import { prisma } from "@repo/db";
import { createTicketToken } from "@/lib/ticket-crypto";
import { generateNomineeCode } from "@/lib/server-functions/voting-options";
import { sendNominationConfirmationEmail } from "@/lib/email/nomination";
import { sendTicketConfirmationEmail } from "@/lib/email/ticket";
import {
	sendTicketWhatsAppNotification,
	sendVoteReceiptWhatsAppNotification,
	normalizePhoneNumber,
} from "@/lib/services/whatsapp";
import { getFrontendBaseUrl } from "@/lib/utils";

export interface FulfillmentResult {
	success: boolean;
	alreadyCompleted?: boolean;
	message?: string;
	error?: string;
	payment?: any;
	tickets?: any[];
	votesCount?: number;
}

/**
 * Atomic and Idempotent Payment Fulfillment Service
 * Handles Tickets, Votes, Nominations, Wallet Balances, and Ledger Transactions
 * Ensures ONLY verified Paystack payments trigger database fulfillment.
 */
export async function fulfillSuccessfulPayment({
	reference,
	paystackData,
}: {
	reference: string;
	paystackData?: any;
}): Promise<FulfillmentResult> {
	try {
		if (!reference) {
			return { success: false, error: "Missing reference." };
		}

		// 1. Fetch Payment record
		let payment = await prisma.payment.findUnique({
			where: { reference },
			include: {
				ticketOrders: {
					include: { tickets: true },
				},
			},
		});

		const meta = (payment?.metadata as any) || (paystackData?.metadata as any) || {};

		// If not found by reference, check if it's an event deposit
		if (!payment && meta.isEventDeposit && meta.eventId) {
			payment = await prisma.payment.findFirst({
				where: {
					status: "pending",
					metadata: { path: ["eventId"], equals: meta.eventId },
				},
				include: {
					ticketOrders: {
						include: { tickets: true },
					},
				},
				orderBy: { createdAt: "desc" },
			});
		}

		if (!payment) {
			console.error(`[FULFILLMENT] Payment not found for reference: ${reference}`);
			return { success: false, error: `Payment not found: ${reference}` };
		}

		const metadata = (payment.metadata as any) || (paystackData?.metadata as any) || {};

		// 2. Idempotency Check — if already completed, do not double-increment, but ensure notifications are dispatched
		if (payment.status === "completed") {
			await dispatchPendingNotificationsIfAny({ payment, metadata, paystackData });
			return {
				success: true,
				alreadyCompleted: true,
				message: "Payment already fulfilled.",
				payment,
				tickets: payment.ticketOrders?.[0]?.tickets || [],
			};
		}
		const now = new Date();
		const paystackTransactionId = String(paystackData?.id || payment.paystackTransactionId || "");

		// 3. Mark Payment as completed
		const updatedPayment = await prisma.payment.update({
			where: { id: payment.id },
			data: {
				status: "completed",
				verifiedAt: now,
				paystackTransactionId: paystackTransactionId || undefined,
				providerResponse: paystackData ? paystackData : undefined,
			},
		});

		let generatedTickets: any[] = [];

		// 4. A: Ticket Purchase Fulfillment
		if (payment.purpose === "ticket_purchase" || metadata.purpose === "ticket_purchase") {
			let ticketOrderId = metadata.ticketOrderId || metadata.orderId || payment.ticketOrders?.[0]?.id;
			const ticketTypeId = metadata.ticketTypeId || metadata.optionId;
			const eventId = metadata.eventId;
			const quantity = Math.max(1, Number(metadata.quantity) || 1);
			const buyerName = metadata.buyerName || metadata.attendeeName || `USSD Attendee (${metadata.phoneNumber || payment.email})`;
			const buyerEmail = metadata.buyerEmail || metadata.attendeeEmail || payment.email;

			if (!ticketOrderId && ticketTypeId && eventId) {
				try {
					const newOrder = await prisma.ticketOrder.create({
						data: {
							eventId,
							paymentId: payment.id,
							orderNumber: `ORD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
							buyerName,
							buyerPhone: metadata.phoneNumber || null,
							subtotal: payment.amount,
							status: "completed",
						},
						include: { tickets: true },
					});
					ticketOrderId = newOrder.id;
				} catch (orderCreateErr) {
					console.error("[fulfillment] Failed to create TicketOrder for USSD:", orderCreateErr);
				}
			}

			if (ticketOrderId) {
				const order = await prisma.ticketOrder.findUnique({
					where: { id: ticketOrderId },
					include: { tickets: true },
				});

				if (order) {
					// Mark order completed
					await prisma.ticketOrder.update({
						where: { id: ticketOrderId },
						data: { status: "completed" },
					});

					// Generate Tickets if not yet generated
					if (order.tickets.length === 0 && ticketTypeId) {
						const attendees = Array.isArray(metadata.attendees) ? metadata.attendees : [];
						for (let i = 0; i < quantity; i++) {
							const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
							const ticketCode = `TIX-${Date.now().toString().slice(-6)}-${randomSuffix}-${i + 1}`;
							const attendee = attendees[i];
							const attendeeName =
								(attendee && typeof attendee.name === "string" && attendee.name.trim()) ||
								buyerName;
							const attendeeEmail =
								(attendee && typeof attendee.email === "string" && attendee.email.trim()) ||
								buyerEmail ||
								null;
							const attendeePhone =
								(attendee && typeof attendee.phone === "string" && attendee.phone.trim()) ||
								null;

							const ticket = await prisma.ticket.create({
								data: {
									orderId: order.id,
									ticketTypeId,
									eventId: eventId || order.eventId,
									ticketCode,
									attendeeName,
									attendeeEmail,
									attendeePhone,
									checkInStatus: "not_checked_in",
								},
							});

							const token = createTicketToken(ticket.id, ticket.ticketCode);
							generatedTickets.push({
								id: ticket.id,
								ticketCode: ticket.ticketCode,
								token,
							});
						}

						// Increment ticket type sold count atomically
						await prisma.ticketType.update({
							where: { id: ticketTypeId },
							data: {
								quantitySold: { increment: quantity },
							},
						});
					} else {
						generatedTickets = order.tickets.map((t) => ({
							id: t.id,
							ticketCode: t.ticketCode,
							token: createTicketToken(t.id, t.ticketCode),
						}));
					}
				}

				// Send WhatsApp ticket notification
				const buyerPhone =
					metadata.buyerPhone ||
					metadata.phone ||
					metadata.phone_number ||
					metadata.attendeePhone ||
					order?.buyerPhone ||
					null;

				// Fetch event once for notifications
				const notifEvent = await prisma.event.findUnique({
					where: { id: eventId },
					select: {
						title: true,
						flierImage: true,
						bannerImage: true,
						organization: { select: { name: true } },
					},
				});

				// Collect all attendee names from generated tickets for multi-ticket notifications
				const allAttendeeNames: string[] = [];
				if (generatedTickets.length > 1) {
					for (const tkt of generatedTickets) {
						const rec = await prisma.ticket.findUnique({
							where: { id: tkt.id },
							select: { attendeeName: true },
						});
						allAttendeeNames.push(rec?.attendeeName || "Attendee");
					}
				}

				if (buyerPhone && generatedTickets.length > 0) {
					try {
						// Atomic guard: claim whatsappSent=true for all unsent tickets in one query.
						// If another process already marked them, affected count will be 0 and we skip.
						const claimed = await prisma.ticket.updateMany({
							where: {
								id: { in: generatedTickets.map((t) => t.id) },
								whatsappSent: false,
							},
							data: { whatsappSent: true },
						});

						if (claimed.count > 0) {
							await sendTicketWhatsAppNotification({
								phone: buyerPhone,
								attendeeName: buyerName,
								eventTitle: notifEvent?.title || "Fextiva Event",
								ticketCode: generatedTickets.map((t) => t.ticketCode).join(", "),
								ticketToken: generatedTickets[0]?.token || undefined,
								bannerImageUrl: notifEvent?.flierImage || notifEvent?.bannerImage || undefined,
								attendeeNames: allAttendeeNames.length > 1 ? allAttendeeNames : undefined,
							});
						} else {
							console.log(`[WhatsApp] Buyer notification already sent for tickets, skipping duplicate.`);
						}
					} catch (waErr) {
						console.error("[WhatsApp] Error sending ticket confirmation:", waErr);
					}
				}

				// Send individual email + WhatsApp confirmations for each attendee
				if (notifEvent && generatedTickets.length > 0) {
					const unitPrice = Number(metadata.baseAmount || 0) / Math.max(generatedTickets.length, 1);
					const totalAmount = Number(metadata.baseAmount || metadata.totalToCharge || payment.amount || 0);

					const baseUrl = getFrontendBaseUrl();
					const primaryTicket = generatedTickets[0];
					const primaryPassViewUrl = `${baseUrl}/ticket/view?token=${primaryTicket.token}`;
					const cleanBuyerEmail = buyerEmail ? String(buyerEmail).trim().toLowerCase() : null;
					const emailedAddresses = new Set<string>();

					// 1. Primary buyer order confirmation with master pass link
					if (cleanBuyerEmail) {
						emailedAddresses.add(cleanBuyerEmail);
						sendTicketConfirmationEmail({
							email: cleanBuyerEmail,
							attendeeName: buyerName,
							eventName: notifEvent.title,
							organizationName: notifEvent.organization?.name || "Fextiva",
							ticketTypeName: metadata.ticketTypeName || "Ticket",
							ticketCode: primaryTicket.ticketCode,
							viewUrl: primaryPassViewUrl,
							bannerUrl: notifEvent.flierImage || notifEvent.bannerImage,
							isFree: false,
							amountPaid: totalAmount,
							currency: "GHS",
							isPrimaryBuyer: true,
							orderNumber: metadata.orderNumber || order?.orderNumber,
							totalTickets: generatedTickets.length,
							allTicketCodes: generatedTickets.map((t) => t.ticketCode),
						attendeeNames: allAttendeeNames.length > 1 ? allAttendeeNames : undefined,
						}).catch((err) =>
							console.error(`[EMAIL:TICKET] Failed for buyer ${cleanBuyerEmail}:`, err),
						);
					}

					for (let i = 0; i < generatedTickets.length; i++) {
						const tkt = generatedTickets[i];
						// Retrieve attendee details from the fetched ticket record
						const ticketRecord = await prisma.ticket.findUnique({
							where: { id: tkt.id },
							select: {
								attendeeName: true,
								attendeeEmail: true,
								attendeePhone: true,
								whatsappSent: true,
								ticketType: { select: { name: true } },
							},
						});

						const passViewUrl = `${baseUrl}/ticket/view?token=${tkt.token}`;

						// Email attendee if not already emailed as buyer
						const recipientEmail = ticketRecord?.attendeeEmail ? ticketRecord.attendeeEmail.trim().toLowerCase() : null;
						if (recipientEmail && !emailedAddresses.has(recipientEmail)) {
							emailedAddresses.add(recipientEmail);
							sendTicketConfirmationEmail({
								email: recipientEmail,
								attendeeName: ticketRecord?.attendeeName || "Attendee",
								eventName: notifEvent.title,
								organizationName: notifEvent.organization?.name || "Fextiva",
								ticketTypeName: ticketRecord?.ticketType?.name || metadata.ticketTypeName || "Ticket",
								ticketCode: tkt.ticketCode,
								viewUrl: passViewUrl,
								bannerUrl: notifEvent.flierImage || notifEvent.bannerImage,
								isFree: false,
								amountPaid: unitPrice,
								currency: "GHS",
								isPrimaryBuyer: false,
								totalTickets: 1,
							}).catch((err) =>
								console.error(`[EMAIL:TICKET] Failed for ticket ${tkt.ticketCode}:`, err),
							);
						}

						// WhatsApp — send to each attendee with their own phone (skip if same as buyer or already sent)
						const attendeePhoneVal = ticketRecord?.attendeePhone;
						const attendeeAlreadySent = (ticketRecord as any)?.whatsappSent === true;
						if (attendeePhoneVal && attendeePhoneVal !== buyerPhone && !attendeeAlreadySent) {
							sendTicketWhatsAppNotification({
								phone: attendeePhoneVal,
								attendeeName: ticketRecord?.attendeeName || "Attendee",
								eventTitle: notifEvent.title,
								ticketCode: tkt.ticketCode,
								ticketToken: tkt.token,
								bannerImageUrl: notifEvent.flierImage || notifEvent.bannerImage || undefined,
							}).catch((waErr) =>
								console.error(`[WhatsApp] Error sending attendee ticket for ${tkt.ticketCode}:`, waErr),
							);
						}
					}
				}
			}
		}

		// 4. B: Voting Fulfillment
		if (
			payment.purpose === "vote_purchase" ||
			metadata.purpose === "vote_purchase" ||
			metadata.purpose === "voting"
		) {
			const optionId = metadata.optionId || metadata.votingOptionId;
			const categoryId = metadata.categoryId;
			const eventId = metadata.eventId;
			const voteCount = Math.max(1, Number(metadata.voteCount) || Number(metadata.quantity) || 1);
			const voterPhone =
				metadata.voterPhone || metadata.phone || metadata.phone_number || null;
			const voterEmail = metadata.voterEmail || payment.email || null;

			if (optionId && eventId) {
				// Record Vote row
				await prisma.vote.create({
					data: {
						eventId,
						optionId,
						categoryId: categoryId || null,
						paymentId: payment.id,
						voteCount,
						voterPhone,
						voterEmail,
					},
				});

				// Increment vote count on option atomically
				await prisma.votingOption.update({
					where: { id: optionId },
					data: {
						votesCount: { increment: voteCount },
					},
				});

				// Send WhatsApp vote confirmation
				if (voterPhone) {
					try {
						const option = await prisma.votingOption.findUnique({
							where: { id: optionId },
							include: { category: true },
						});
						await sendVoteReceiptWhatsAppNotification({
							phone: voterPhone,
							voterName: metadata.voterName || undefined,
							nomineeName: option?.optionText || "Nominee",
							categoryName: option?.category?.name || undefined,
							votesCount: voteCount,
							reference,
						});
					} catch (waErr) {
						console.error("[WhatsApp] Error sending vote receipt:", waErr);
					}
				}
			}
		}

		// 4. C: Nomination Fulfillment
		if (payment.purpose === "nomination" || metadata.purpose === "nomination") {
			let optionId = metadata.optionId || metadata.nomineeId;
			let option: any = null;

			if (optionId) {
				option = await prisma.votingOption.findUnique({
					where: { id: optionId },
					include: {
						category: true,
						event: { include: { organization: true } },
					},
				});
			}

			// If option was not pre-created, create it now from payment metadata
			if (!option && metadata.eventId && metadata.categoryId && metadata.nomineeName) {
				const category = await prisma.votingCategory.findUnique({
					where: { id: metadata.categoryId },
				});
				const requireApproval = category?.requireApproval ?? true;
				const newStatus = requireApproval ? "pending" : "approved";
				const deletionCode = Math.floor(100000 + Math.random() * 900000).toString();
				const nomineeCode = await generateNomineeCode(metadata.eventId, metadata.categoryId, category?.name);

				option = await prisma.votingOption.create({
					data: {
						eventId: metadata.eventId,
						categoryId: metadata.categoryId,
						optionText: String(metadata.nomineeName).trim(),
						email: metadata.nomineeEmail || null,
						description: metadata.nomineeBio || metadata.description || null,
						imageUrl: metadata.nomineeImageUrl || metadata.imageUrl || null,
						nominatedByName: metadata.nominatorName || null,
						nominatedByEmail: metadata.nominatorEmail || payment.email || null,
						status: newStatus as any,
						isPublicNomination: true,
						nomineeCode,
						deletionCode,
					},
					include: {
						category: true,
						event: { include: { organization: true } },
					},
				});

				metadata.optionId = option.id;
			} else if (option) {
				const requireApproval = option.category?.requireApproval ?? true;
				const newStatus = requireApproval ? "pending" : "approved";
				const deletionCode =
					option.deletionCode ||
					Math.floor(100000 + Math.random() * 900000).toString();

				option = await prisma.votingOption.update({
					where: { id: option.id },
					data: {
						status: newStatus as any,
						deletionCode,
					},
					include: {
						category: true,
						event: { include: { organization: true } },
					},
				});
			}

			// Send confirmation email with exit key / review status
			if (option) {
				const recipientEmail =
					option.nominatedByEmail || option.email || payment.email;
				if (recipientEmail) {
					sendNominationConfirmationEmail({
						email: recipientEmail,
						recipientName: option.nominatedByName || recipientEmail,
						nomineeName: option.optionText,
						categoryName: option.category?.name || "Category",
						eventName: option.event?.title || "Event",
						deletionCode: option.status === "approved" ? option.deletionCode : null,
						organizationName: option.event?.organization?.name || "Fextiva",
						bannerUrl: option.event?.bannerImage || option.event?.flierImage,
					}).catch((err) =>
						console.error("[fulfillment] Failed to send nomination email:", err),
					);
				}
			}
		}

		// 4. D: USSD Session Confirmation
		if (
			reference.startsWith("USSD_") ||
			reference.startsWith("USSD-") ||
			metadata.channel === "ussd"
		) {
			try {
				await prisma.ussdSession.updateMany({
					where: { reference },
					data: { status: "completed" },
				});
			} catch (e) {
				// Ignore if USSD session table not matching
			}
		}

		// 5. Organization Wallet & Transaction Ledger Updates
		// Security deposits are held in platform escrow and MUST NEVER credit organizer wallet balances.
		if (metadata.isEventDeposit) {
			if (metadata.eventId) {
				await prisma.event.updateMany({
					where: { id: metadata.eventId, status: "draft" },
					data: { status: "published", publishedAt: new Date() },
				});
			}
			return {
				success: true,
				payment: updatedPayment,
			};
		}

		let organizationId = metadata.organizationId || metadata.orgId;
		if (!organizationId) {
			const eventId = metadata.eventId || metadata.event_id || payment.ticketOrders?.[0]?.eventId;
			if (eventId) {
				const ev = await prisma.event.findUnique({
					where: { id: eventId },
					select: { organizationId: true },
				});
				organizationId = ev?.organizationId;
			}
		}

		if (organizationId) {
			try {
				const org = await prisma.organization.findUnique({
					where: { id: organizationId },
					select: {
						paystackBankCode: true,
						paystackAccountNumber: true,
						paystackAccountName: true,
						subaccountCode: true,
					},
				});

				const feeType =
					payment.purpose === "ticket_purchase"
						? "ticket"
						: payment.purpose === "nomination"
							? "nomination"
							: "vote";

				const baseAmount = Number(metadata.baseAmount || payment.amount || 0);
				const platformFee = Number(metadata.platformFee ?? 0);
				const organizerReceives = Number(metadata.organizerReceives ?? (baseAmount - platformFee));

				// Find or create wallet
				let wallet = await prisma.wallet.findFirst({
					where: { organizationId },
				});

				if (!wallet) {
					wallet = await prisma.wallet.create({
						data: {
							organizationId,
							balance: 0,
							currency: "GHS",
						},
					});
				}

				if (organizerReceives > 0) {
					const existingCreditTxn = await prisma.transaction.findFirst({
						where: {
							walletId: wallet.id,
							paymentId: payment.id,
							type: "credit",
						},
					});

					const cleanLabel =
						payment.purpose === "ticket_purchase"
							? "Ticket Purchase"
							: payment.purpose === "nomination"
								? "Nomination Fee"
								: "Voting Payment";

					if (!existingCreditTxn) {
						const currentBalance = Number(wallet.balance);
						const newBalance = currentBalance + organizerReceives;

						await prisma.wallet.update({
							where: { id: wallet.id },
							data: {
								balance: { increment: organizerReceives },
								lastTransactionAt: now,
							},
						});

						const creditRef = `TXN-IN-${reference}`;
						await prisma.transaction.create({
							data: {
								reference: creditRef,
								walletId: wallet.id,
								paymentId: payment.id,
								type: "credit",
								category: payment.purpose === "ticket_purchase" ? "ticket_purchase" : "vote_purchase",
								status: "completed",
								amount: organizerReceives,
								currency: "GHS",
								feeAmount: platformFee,
								balanceBefore: currentBalance,
								balanceAfter: newBalance,
								description: `${cleanLabel} Revenue (${reference}) - Net: GHS ${organizerReceives.toFixed(2)}, Platform Fee: GHS ${platformFee.toFixed(2)}`,
								completedAt: now,
							},
						});
					}
				}
			} catch (walletErr) {
				console.error("[FULFILLMENT-WALLET-ERROR]", walletErr);
			}
		}

		return {
			success: true,
			payment: updatedPayment,
			tickets: generatedTickets,
		};
	} catch (error: any) {
		console.error("[FULFILLMENT-ERROR]", error);
		return {
			success: false,
			error: error.message || "Failed to fulfill payment.",
		};
	}
}

/**
 * Fulfills payout transfer state changes (success, failure, reversed)
 * Updates Payout, Ledger Transaction, and Wallet pendingDebits atomically
 */
export async function fulfillPayoutTransfer({
	reference,
	status,
	paystackData,
}: {
	reference: string;
	status: "completed" | "failed" | "reversed";
	paystackData?: any;
}): Promise<{ success: boolean; message?: string; error?: string }> {
	try {
		const payout = await prisma.payout.findUnique({
			where: { reference },
			include: { wallet: true },
		});

		if (!payout) {
			console.warn(`[FULFILLMENT-PAYOUT] Payout not found for reference: ${reference}`);
			return { success: false, error: `Payout not found: ${reference}` };
		}

		await prisma.$transaction(async (tx) => {
			const amt = Number(payout.amount);
			const now = new Date();
			const wasAlreadyCompleted = payout.status === "completed";

			// 1. Update Payout record
			await tx.payout.update({
				where: { id: payout.id },
				data: {
					status,
					completedAt: status === "completed" ? (payout.completedAt || now) : undefined,
					failedAt: status !== "completed" ? now : undefined,
					providerResponse: paystackData ?? undefined,
				},
			});

			// 2. Update Debit Transaction record
			await tx.transaction.updateMany({
				where: { reference, type: "debit" },
				data: {
					status,
					completedAt: status === "completed" ? now : undefined,
				},
			});

			// 3. Reconcile Wallet balance and pendingDebits atomically
			if (payout.walletId) {
				const wallet = await tx.wallet.findUnique({ where: { id: payout.walletId } });
				if (wallet) {
					// Sum real pending debits from database transactions
					const pendingDebitsAgg = await tx.transaction.aggregate({
						where: {
							walletId: wallet.id,
							type: "debit",
							status: { in: ["pending", "processing"] },
						},
						_sum: { amount: true },
					});
					const exactPendingDebits = Number(pendingDebitsAgg._sum.amount || 0);

					let updatedBalance = Number(wallet.balance);
					// If transitioning from processing/pending to completed, decrement ledger balance
					if (status === "completed" && !wasAlreadyCompleted) {
						updatedBalance = Math.max(0, Math.round((updatedBalance - amt) * 100) / 100);
					}

					await tx.wallet.update({
						where: { id: wallet.id },
						data: {
							balance: updatedBalance,
							pendingDebits: exactPendingDebits,
							lastTransactionAt: now,
						},
					});
				}
			}
		});

		return { success: true };
	} catch (error: any) {
		console.error("[FULFILLMENT-PAYOUT-ERROR]", error);
		return { success: false, error: error.message };
	}
}

/**
 * Dispatches pending WhatsApp and Email notifications if they were not already sent.
 * Essential when payment was marked completed by Cloudflare Worker or webhook prior to rich notification delivery.
 */
async function dispatchPendingNotificationsIfAny({
	payment,
	metadata,
	paystackData,
}: {
	payment: any;
	metadata: any;
	paystackData?: any;
}) {
	try {
		const purpose = payment.purpose || metadata?.purpose || "general";

		// A: Ticket Purchase Notifications
		if (purpose === "ticket_purchase") {
			let order = payment.ticketOrders?.[0];
			if (!order) {
				order = await prisma.ticketOrder.findFirst({
					where: { paymentId: payment.id },
					include: { tickets: true },
				});
			}

			const tickets = order?.tickets || [];
			const alreadyDispatched = metadata?.notificationsDispatched === true;
			const unsentWhatsapp = tickets.some((t: any) => !t.whatsappSent);

			if ((!alreadyDispatched || unsentWhatsapp) && tickets.length > 0) {
				const eventId = metadata.eventId || order?.eventId;
				const buyerName =
					metadata.buyerName ||
					metadata.attendeeName ||
					order?.buyerName ||
					`Attendee (${metadata.phoneNumber || payment.email})`;
				const buyerPhone =
					metadata.buyerPhone ||
					metadata.phone ||
					metadata.phone_number ||
					metadata.attendeePhone ||
					order?.buyerPhone ||
					null;
				const buyerEmail =
					metadata.buyerEmail ||
					metadata.attendeeEmail ||
					payment.email;

				const notifEvent = eventId
					? await prisma.event.findUnique({
							where: { id: eventId },
							select: {
								title: true,
								flierImage: true,
								bannerImage: true,
								organization: { select: { name: true } },
							},
					  })
					: null;

				const formattedTickets = tickets.map((t: any) => ({
					id: t.id,
					ticketCode: t.ticketCode,
					token: createTicketToken(t.id, t.ticketCode),
				}));

				const allAttendeeNames: string[] = [];
				for (const tkt of tickets) {
					if (tkt.attendeeName) {
						allAttendeeNames.push(tkt.attendeeName);
					}
				}

				// 1. Send WhatsApp notification
				// Atomic guard: only send if we can claim at least one unsent ticket.
				// This prevents duplicate sends when webhook + callback race each other.
				if (buyerPhone && notifEvent && unsentWhatsapp) {
					try {
						const claimed = await prisma.ticket.updateMany({
							where: {
								id: { in: tickets.map((t: any) => t.id) },
								whatsappSent: false,
							},
							data: { whatsappSent: true },
						});

						if (claimed.count > 0) {
							await sendTicketWhatsAppNotification({
								phone: buyerPhone,
								attendeeName: buyerName,
								eventTitle: notifEvent.title || "Fextiva Event",
								ticketCode: formattedTickets.map((t: any) => t.ticketCode).join(", "),
								ticketToken: formattedTickets[0]?.token || undefined,
								bannerImageUrl: notifEvent.flierImage || notifEvent.bannerImage || undefined,
								attendeeNames: allAttendeeNames.length > 1 ? allAttendeeNames : undefined,
							});
						} else {
							console.log(`[WhatsApp] Recovery: buyer notification already claimed, skipping duplicate.`);
						}
					} catch (waErr) {
						console.error("[WhatsApp] Error sending ticket confirmation on recovery:", waErr);
					}
				}

				// 2. Send Email notification
				if (buyerEmail && notifEvent && !alreadyDispatched) {
					const cleanBuyerEmail = String(buyerEmail).trim().toLowerCase();
					const baseUrl = getFrontendBaseUrl();
					const primaryTicket = formattedTickets[0];
					const primaryPassViewUrl = `${baseUrl}/ticket/view?token=${primaryTicket.token}`;
					const totalAmount = Number(metadata.baseAmount || metadata.totalToCharge || payment.amount || 0);

					try {
						await sendTicketConfirmationEmail({
							email: cleanBuyerEmail,
							attendeeName: buyerName,
							eventName: notifEvent.title,
							organizationName: notifEvent.organization?.name || "Fextiva",
							ticketTypeName: metadata.ticketTypeName || "Ticket",
							ticketCode: primaryTicket.ticketCode,
							viewUrl: primaryPassViewUrl,
							bannerUrl: notifEvent.flierImage || notifEvent.bannerImage,
							isFree: false,
							amountPaid: totalAmount,
							currency: "GHS",
							isPrimaryBuyer: true,
							orderNumber: metadata.orderNumber || order?.orderNumber,
							totalTickets: tickets.length,
							allTicketCodes: formattedTickets.map((t: any) => t.ticketCode),
							attendeeNames: allAttendeeNames.length > 1 ? allAttendeeNames : undefined,
						});
					} catch (emailErr) {
						console.error("[EMAIL:TICKET] Error sending confirmation on recovery:", emailErr);
					}
				}

				// Mark metadata to prevent duplicate emails
				await prisma.payment.update({
					where: { id: payment.id },
					data: {
						metadata: {
							...metadata,
							notificationsDispatched: true,
						},
					},
				}).catch(() => {});
			}
		}

		// B: Voting Notifications
		if (purpose === "voting" || purpose === "vote_purchase") {
			const voterPhone =
				metadata.voterPhone ||
				metadata.phone ||
				metadata.phone_number ||
				paystackData?.customer?.phone;
			const alreadyNotified = metadata.voteNotificationSent === true;

			if (voterPhone && !alreadyNotified) {
				const optionId = metadata.optionId || metadata.votingOptionId || metadata.option_id;
				const voteCount = Math.max(1, Number(metadata.voteCount) || Number(metadata.quantity) || 1);

				try {
					const option = optionId
						? await prisma.votingOption.findUnique({
								where: { id: optionId },
								include: { category: true },
						  })
						: null;

					await sendVoteReceiptWhatsAppNotification({
						phone: voterPhone,
						voterName: metadata.voterName || undefined,
						nomineeName: option?.optionText || "Nominee",
						categoryName: option?.category?.name || undefined,
						votesCount: voteCount,
						reference: payment.reference,
					});

					await prisma.payment.update({
						where: { id: payment.id },
						data: {
							metadata: {
								...metadata,
								voteNotificationSent: true,
							},
						},
					}).catch(() => {});
				} catch (waErr) {
					console.error("[WhatsApp] Error sending vote receipt on recovery:", waErr);
				}
			}
		}

		// C: Nomination Notifications
		if (purpose === "nomination") {
			const alreadyNotified = metadata.nominationNotificationSent === true;
			const optionId = metadata.optionId || metadata.nomineeId;

			if (!alreadyNotified && optionId) {
				try {
					const option = await prisma.votingOption.findUnique({
						where: { id: optionId },
						include: {
							category: true,
							event: { include: { organization: true } },
						},
					});

					if (option) {
						const recipientEmail = option.nominatedByEmail || option.email || payment.email;
						if (recipientEmail) {
							await sendNominationConfirmationEmail({
								email: recipientEmail,
								recipientName: option.nominatedByName || recipientEmail,
								nomineeName: option.optionText,
								categoryName: option.category?.name || "Category",
								eventName: option.event?.title || "Event",
								status: option.status,
								deletionCode: option.status === "approved" ? option.deletionCode : null,
								organizationName: option.event?.organization?.name || "Fextiva",
								bannerUrl: option.event?.bannerImage || option.event?.flierImage,
								eventUrl: option.event?.slug ? `${getFrontendBaseUrl()}/event/${option.event.slug}` : undefined,
							});

							await prisma.payment.update({
								where: { id: payment.id },
								data: {
									metadata: {
										...metadata,
										nominationNotificationSent: true,
									},
								},
							}).catch(() => {});
						}
					}
				} catch (nomErr) {
					console.error("[Nomination] Error sending email on recovery:", nomErr);
				}
			}
		}
	} catch (err) {
		console.error("[FULFILLMENT] Exception in dispatchPendingNotificationsIfAny:", err);
	}
}

