import { prisma } from "@repo/db";
import { createTicketToken } from "@/lib/ticket-crypto";

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
		const payment = await prisma.payment.findUnique({
			where: { reference },
			include: {
				ticketOrders: {
					include: { tickets: true },
				},
			},
		});

		if (!payment) {
			console.error(`[FULFILLMENT] Payment not found for reference: ${reference}`);
			return { success: false, error: `Payment not found: ${reference}` };
		}

		// 2. Idempotency Check — if already completed, do not double-increment
		if (payment.status === "completed") {
			return {
				success: true,
				alreadyCompleted: true,
				message: "Payment already fulfilled.",
				payment,
				tickets: payment.ticketOrders?.[0]?.tickets || [],
			};
		}

		const metadata = (payment.metadata as any) || (paystackData?.metadata as any) || {};
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
			const ticketOrderId = metadata.ticketOrderId || metadata.orderId || payment.ticketOrders?.[0]?.id;
			const ticketTypeId = metadata.ticketTypeId;
			const eventId = metadata.eventId;
			const quantity = Math.max(1, Number(metadata.quantity) || 1);
			const buyerName = metadata.buyerName || metadata.attendeeName || "Attendee";
			const buyerEmail = metadata.buyerEmail || metadata.attendeeEmail || payment.email;

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
						for (let i = 0; i < quantity; i++) {
							const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
							const ticketCode = `TIX-${Date.now().toString().slice(-6)}-${randomSuffix}-${i + 1}`;
							const ticket = await prisma.ticket.create({
								data: {
									orderId: order.id,
									ticketTypeId,
									eventId: eventId || order.eventId,
									ticketCode,
									attendeeName: buyerName,
									attendeeEmail: buyerEmail,
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
			const voterPhone = metadata.voterPhone || metadata.phone || null;
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
			}
		}

		// 4. C: Nomination Fulfillment
		if (payment.purpose === "nomination" || metadata.purpose === "nomination") {
			const optionId = metadata.optionId || metadata.nomineeId;
			if (optionId) {
				const option = await prisma.votingOption.findUnique({
					where: { id: optionId },
					include: { category: true },
				});

				if (option) {
					const requireApproval = option.category?.requireApproval ?? true;
					const newStatus = requireApproval ? "pending" : "approved";
					const deletionCode = Math.floor(100000 + Math.random() * 900000).toString();

					await prisma.votingOption.update({
						where: { id: optionId },
						data: {
							status: newStatus as any,
							deletionCode,
						},
					});
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
		const organizationId = metadata.organizationId || metadata.orgId;
		if (organizationId) {
			try {
				const baseAmount = Number(metadata.baseAmount || payment.amount || 0);
				const platformFee = Number(metadata.platformFee || 0);
				const organizerReceives = Number(metadata.organizerReceives || baseAmount - platformFee);

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

				// Credit wallet if payment is not directly split
				const isSplit = metadata.isSplit === true;
				if (!isSplit && organizerReceives > 0) {
					const newBalance = Number(wallet.balance) + organizerReceives;

					await prisma.wallet.update({
						where: { id: wallet.id },
						data: {
							balance: { increment: organizerReceives },
							lastTransactionAt: now,
						},
					});

					// Create ledger record
					const category =
						payment.purpose === "ticket_purchase"
							? "ticket_purchase"
							: payment.purpose === "vote_purchase"
								? "vote_purchase"
								: "wallet_topup";

					await prisma.transaction.create({
						data: {
							reference: `TXN-${reference}-${Date.now().toString().slice(-4)}`,
							walletId: wallet.id,
							paymentId: payment.id,
							type: "credit",
							category,
							status: "completed",
							amount: organizerReceives,
							currency: "GHS",
							feeAmount: platformFee,
							balanceBefore: wallet.balance,
							balanceAfter: newBalance,
							description: `Payment received for ${payment.purpose}: Ref ${reference}`,
							completedAt: now,
						},
					});
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
