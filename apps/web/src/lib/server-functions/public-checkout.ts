"use server";

import { prisma } from "@repo/db";
import { paystack } from "@/lib/paystack";
import { createTicketToken, verifyTicketToken } from "@/lib/ticket-crypto";
import { getFrontendBaseUrl } from "@/lib/utils";
import { computeChargeAmount, toPesewas, round2 } from "@/lib/utils/pricing";
import { fulfillSuccessfulPayment } from "@/lib/server-functions/fulfillment";

export interface PublicTicketCheckoutInput {
	eventId: string;
	ticketTypeId: string;
	quantity: number;
	buyerName: string;
	buyerEmail: string;
	buyerPhone?: string;
}

export interface PublicVoteInput {
	eventId: string;
	categoryId: string;
	optionId: string;
	voteCount: number;
	voterEmail?: string;
	voterPhone?: string;
	voterKey?: string; // for internal voting
}

export interface VerifyTicketInput {
	token?: string;
	ticketCode?: string;
	action?: "check_in" | "check_out" | "status";
}

/**
 * 1. Public Ticket Checkout (Free or Paid with Paystack Surcharge & Subaccount Split)
 */
export async function initiatePublicTicketCheckout({
	data,
}: {
	data: PublicTicketCheckoutInput;
}) {
	try {
		const {
			eventId,
			ticketTypeId,
			quantity = 1,
			buyerName,
			buyerEmail,
			buyerPhone,
		} = data;

		if (!eventId || !ticketTypeId || !buyerEmail || !buyerName) {
			return {
				success: false,
				error: "Please provide all required attendee and ticket details.",
			};
		}

		if (quantity <= 0) {
			return {
				success: false,
				error: "Quantity must be at least 1.",
			};
		}

		// Fetch ticket type and event organization
		const ticketType = await prisma.ticketType.findUnique({
			where: { id: ticketTypeId },
			include: {
				event: {
					include: {
						organization: true,
					},
				},
			},
		});

		if (!ticketType || ticketType.eventId !== eventId) {
			return {
				success: false,
				error: "Ticket tier not found for this event.",
			};
		}

		if (ticketType.status !== "available") {
			return {
				success: false,
				error: "This ticket tier is currently not available for purchase.",
			};
		}

		// Check capacity / limit
		if (ticketType.quantityTotal != null) {
			const remaining = ticketType.quantityTotal - ticketType.quantitySold;
			if (quantity > remaining) {
				return {
					success: false,
					error:
						remaining > 0
							? `Only ${remaining} ticket(s) remaining for ${ticketType.name}.`
							: `This ticket tier is sold out.`,
				};
			}
		}

		const unitPrice = Number(ticketType.price || 0);
		const baseAmount = unitPrice * quantity;
		const isFree = baseAmount === 0;

		const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

		// Compute Paystack Fee Surcharge
		const feeCalc = computeChargeAmount(baseAmount);
		const totalToCharge = feeCalc.totalToCharge;
		const paystackFee = feeCalc.paystackFee;
		const organization = ticketType.event.organization;
		const subaccountCode = (organization as any)?.subaccountCode || null;

		// Create Pending Ticket Order
		const order = await prisma.ticketOrder.create({
			data: {
				eventId,
				orderNumber,
				buyerName,
				buyerPhone: buyerPhone || null,
				subtotal: baseAmount,
				discountAmount: 0,
				fees: paystackFee,
				status: isFree ? "completed" : "pending",
			},
		});

		if (isFree) {
			// Generate Free Tickets immediately
			const tickets = [];
			for (let i = 0; i < quantity; i++) {
				const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
				const ticketCode = `TIX-${Date.now().toString().slice(-6)}-${randomSuffix}-${i + 1}`;
				const ticket = await prisma.ticket.create({
					data: {
						orderId: order.id,
						ticketTypeId,
						eventId,
						ticketCode,
						attendeeName: buyerName,
						attendeeEmail: buyerEmail,
						checkInStatus: "not_checked_in",
					},
				});

				const token = createTicketToken(ticket.id, ticket.ticketCode);
				tickets.push({
					id: ticket.id,
					ticketCode: ticket.ticketCode,
					token,
				});
			}

			// Increment sold count atomically
			await prisma.ticketType.update({
				where: { id: ticketTypeId },
				data: {
					quantitySold: { increment: quantity },
				},
			});

			return {
				success: true,
				isFree: true,
				orderId: order.id,
				orderNumber,
				tickets,
				viewUrl: `/ticket/view?token=${tickets[0]?.token}`,
			};
		}

		// Paid Ticket: Initialize Paystack Transaction with exact surcharge & subaccount routing
		const callbackUrl = `${getFrontendBaseUrl()}/payment/callback`;

		const paystackRes = await paystack.transaction.initialize({
			email: buyerEmail,
			amount: toPesewas(totalToCharge),
			currency: ticketType.currency || "GHS",
			callback_url: callbackUrl,
			subaccount: subaccountCode || undefined,
			transaction_charge: subaccountCode && paystackFee > 0 ? toPesewas(paystackFee) : undefined,
			metadata: {
				purpose: "ticket_purchase",
				ticketOrderId: order.id,
				orderId: order.id,
				orderNumber,
				eventId,
				ticketTypeId,
				ticketTypeName: ticketType.name,
				quantity,
				buyerName,
				buyerEmail,
				buyerPhone,
				organizationId: organization.id,
				orgSlug: organization.slug,
				eventSlug: ticketType.event.slug,
				baseAmount,
				paystackFee,
				totalToCharge,
				isSplit: !!subaccountCode,
				sourcePath: `/${organization.slug}/event/${ticketType.event.slug}`,
			},
		});

		if (!paystackRes?.status || !paystackRes?.data) {
			return {
				success: false,
				error:
					paystackRes?.message ||
					"Failed to initialize payment gateway. Please ensure payment settings are configured.",
			};
		}

		// Create Payment record for webhook reconciliation
		const payment = await prisma.payment.create({
			data: {
				reference: paystackRes.data.reference,
				email: buyerEmail,
				purpose: "ticket_purchase",
				amount: totalToCharge,
				currency: "GHS",
				provider: "paystack",
				status: "pending",
				metadata: {
					ticketOrderId: order.id,
					orderId: order.id,
					orderNumber,
					eventId,
					ticketTypeId,
					ticketTypeName: ticketType.name,
					quantity,
					buyerName,
					buyerEmail,
					buyerPhone,
					organizationId: organization.id,
					orgSlug: organization.slug,
					eventSlug: ticketType.event.slug,
					baseAmount,
					paystackFee,
					totalToCharge,
					isSplit: !!subaccountCode,
					sourcePath: `/${organization.slug}/event/${ticketType.event.slug}`,
				},
			},
		});

		// Link payment to order
		await prisma.ticketOrder.update({
			where: { id: order.id },
			data: { paymentId: payment.id },
		});

		return {
			success: true,
			isFree: false,
			orderId: order.id,
			orderNumber,
			authorizationUrl: paystackRes.data.authorization_url,
			accessCode: paystackRes.data.access_code,
			reference: paystackRes.data.reference,
			feeBreakdown: {
				baseAmount,
				paystackFee,
				totalToCharge,
			},
		};
	} catch (err: any) {
		console.error("Public Ticket Checkout Error:", err);
		return {
			success: false,
			error: err.message || "An unexpected error occurred during ticket checkout.",
		};
	}
}

/**
 * 2. Public / Internal Voting Checkout
 */
export async function initiatePublicVote({ data }: { data: PublicVoteInput }) {
	try {
		const {
			eventId,
			categoryId,
			optionId,
			voteCount = 1,
			voterEmail,
			voterPhone,
			voterKey,
		} = data;

		if (!eventId || !categoryId || !optionId) {
			return {
				success: false,
				error: "Missing required voting parameters.",
			};
		}

		const category = await prisma.votingCategory.findUnique({
			where: { id: categoryId },
			include: {
				event: {
					include: { organization: true },
				},
				votingOptions: {
					where: { id: optionId },
				},
			},
		});

		if (!category || category.eventId !== eventId) {
			return {
				success: false,
				error: "Voting category not found.",
			};
		}

		const nominee = category.votingOptions[0];
		if (!nominee) {
			return {
				success: false,
				error: "Nominee not found in this category.",
			};
		}

		const isInternalVoting =
			(category.event as any).votingMode === "internal" || !!voterKey;

		if (isInternalVoting) {
			if (!voterKey) {
				return {
					success: false,
					error: "Confidential voter key is required for internal voting.",
				};
			}

			// Verify member voter key
			const member = await prisma.eventMember.findFirst({
				where: {
					eventId,
					uniqueCode: voterKey.toUpperCase().trim(),
				},
			});

			if (!member) {
				return {
					success: false,
					error: "Invalid or unrecognized voter key.",
				};
			}

			// Check if member already voted in this category
			const existingVote = await prisma.vote.findFirst({
				where: {
					categoryId,
					eventMemberId: member.id,
				},
			});

			if (existingVote) {
				return {
					success: false,
					error: "You have already cast your ballot for this category.",
				};
			}

			// Record Ballot
			await prisma.vote.create({
				data: {
					eventId,
					categoryId,
					optionId,
					eventMemberId: member.id,
					voteCount: 1,
				},
			});

			await prisma.votingOption.update({
				where: { id: optionId },
				data: {
					votesCount: { increment: 1 },
				},
			});

			await prisma.eventMember.update({
				where: { id: member.id },
				data: { status: "voted" },
			});

			return {
				success: true,
				isInternal: true,
				message: "Ballot cast successfully.",
			};
		}

		// General Voting: Free or Paid
		const votePrice = Number(category.votePrice || 0);
		const baseAmount = votePrice * voteCount;
		const isFree = baseAmount === 0;

		if (isFree) {
			await prisma.vote.create({
				data: {
					eventId,
					categoryId,
					optionId,
					voteCount,
					voterEmail,
					voterPhone,
				},
			});

			await prisma.votingOption.update({
				where: { id: optionId },
				data: {
					votesCount: { increment: voteCount },
				},
			});

			return {
				success: true,
				isFree: true,
				message: `${voteCount} free vote(s) cast successfully.`,
			};
		}

		// Paid Vote: Initialize Paystack with surcharge
		if (!voterEmail) {
			return {
				success: false,
				error: "Email is required for payment receipt.",
			};
		}

		const feeCalc = computeChargeAmount(baseAmount);
		const totalToCharge = feeCalc.totalToCharge;
		const paystackFee = feeCalc.paystackFee;
		const organization = category.event.organization;
		const subaccountCode = (organization as any)?.subaccountCode || null;

		const callbackUrl = `${getFrontendBaseUrl()}/payment/callback`;

		const paystackRes = await paystack.transaction.initialize({
			email: voterEmail,
			amount: toPesewas(totalToCharge),
			currency: "GHS",
			callback_url: callbackUrl,
			subaccount: subaccountCode || undefined,
			transaction_charge: subaccountCode && paystackFee > 0 ? toPesewas(paystackFee) : undefined,
			metadata: {
				purpose: "voting",
				eventId,
				categoryId,
				categoryName: category.name,
				optionId,
				votingOptionId: optionId,
				nomineeName: nominee.optionText,
				voteCount,
				voterEmail,
				voterPhone,
				organizationId: organization.id,
				orgSlug: organization.slug,
				eventSlug: category.event.slug,
				baseAmount,
				paystackFee,
				totalToCharge,
				isSplit: !!subaccountCode,
				sourcePath: `/${organization.slug}/event/${category.event.slug}/category/${categoryId}`,
			},
		});

		if (!paystackRes?.status || !paystackRes?.data) {
			return {
				success: false,
				error:
					paystackRes?.message ||
					"Failed to initialize payment gateway. Please ensure payment settings are configured.",
			};
		}

		// Create Payment record for webhook reconciliation
		await prisma.payment.create({
			data: {
				reference: paystackRes.data.reference,
				email: voterEmail,
				purpose: "vote_purchase",
				amount: totalToCharge,
				currency: "GHS",
				provider: "paystack",
				status: "pending",
				metadata: {
					purpose: "voting",
					eventId,
					categoryId,
					categoryName: category.name,
					optionId,
					votingOptionId: optionId,
					nomineeName: nominee.optionText,
					voteCount,
					voterEmail,
					voterPhone,
					organizationId: organization.id,
					orgSlug: organization.slug,
					eventSlug: category.event.slug,
					baseAmount,
					paystackFee,
					totalToCharge,
					isSplit: !!subaccountCode,
					sourcePath: `/${organization.slug}/event/${category.event.slug}/category/${categoryId}`,
				},
			},
		});

		return {
			success: true,
			isPaid: true,
			authorizationUrl: paystackRes.data.authorization_url,
			accessCode: paystackRes.data.access_code,
			reference: paystackRes.data.reference,
			feeBreakdown: {
				baseAmount,
				paystackFee,
				totalToCharge,
			},
		};
	} catch (err: any) {
		console.error("Public Vote Error:", err);
		return {
			success: false,
			error: err.message || "An unexpected error occurred during vote checkout.",
		};
	}
}

/**
 * 3. Gate Verification & Check-In
 */
export async function verifyAndCheckInTicket({
	data,
}: {
	data: VerifyTicketInput;
}) {
	const { token, ticketCode, action = "status" } = data;

	let ticketId: string | null = null;
	let code: string | null = ticketCode || null;

	if (token) {
		const verified = verifyTicketToken(token);
		if (!verified) {
			return {
				isValid: false,
				status: "invalid",
				message: "Invalid or forged cryptographic ticket signature.",
			};
		}
		ticketId = verified.ticketId;
		code = verified.ticketCode;
	}

	const ticket = await prisma.ticket.findFirst({
		where: {
			OR: [
				ticketId ? { id: ticketId } : undefined,
				code ? { ticketCode: code } : undefined,
			].filter(Boolean) as any,
		},
		include: {
			event: {
				include: { organization: true },
			},
			ticketType: true,
			order: true,
		},
	});

	if (!ticket) {
		return {
			isValid: false,
			status: "not_found",
			message: "Ticket not found in event registry.",
		};
	}

	if (action === "check_in") {
		if (ticket.checkInStatus === "checked_in") {
			return {
				isValid: true,
				status: "already_checked_in",
				message: "Attendee is already checked in.",
				ticket,
			};
		}

		const updated = await prisma.ticket.update({
			where: { id: ticket.id },
			data: {
				checkInStatus: "checked_in",
				checkedInAt: new Date(),
			},
			include: {
				event: { include: { organization: true } },
				ticketType: true,
				order: true,
			},
		});

		return {
			isValid: true,
			status: "checked_in",
			message: "Check-in successful! Access granted.",
			ticket: updated,
		};
	}

	if (action === "check_out") {
		const updated = await prisma.ticket.update({
			where: { id: ticket.id },
			data: {
				checkInStatus: "not_checked_in",
				checkedInAt: null,
			},
			include: {
				event: { include: { organization: true } },
				ticketType: true,
				order: true,
			},
		});

		return {
			isValid: true,
			status: "not_checked_in",
			message: "Ticket reset to not checked in.",
			ticket: updated,
		};
	}

	// Status only
	return {
		isValid: true,
		status: ticket.checkInStatus,
		message:
			ticket.checkInStatus === "checked_in"
				? `Already checked in at ${ticket.checkedInAt?.toLocaleTimeString()}`
				: "Valid ticket. Ready for entry.",
		ticket,
	};
}

/**
 * 4. Payment Callback Status Lookup & Secure Direct Verification
 */
export async function getPaymentStatusByReference({
	reference,
}: {
	reference: string;
}) {
	try {
		if (!reference) {
			return { success: false, error: "Payment reference is required." };
		}

		let payment = await prisma.payment.findUnique({
			where: { reference },
			include: {
				ticketOrders: {
					include: {
						tickets: true,
					},
				},
			},
		});

		if (!payment) {
			return { success: false, error: "Payment not found." };
		}

		// If payment is pending, verify directly with Paystack API and atomically fulfill
		if (payment.status !== "completed") {
			try {
				const verifyRes = await paystack.transaction.verify(reference);
				if (verifyRes?.status && verifyRes?.data?.status === "success") {
					// Delegate to single-source-of-truth fulfillment helper
					await fulfillSuccessfulPayment({
						reference,
						paystackData: verifyRes.data,
					});

					// Re-fetch updated payment with tickets
					const refreshed = await prisma.payment.findUnique({
						where: { id: payment.id },
						include: {
							ticketOrders: {
								include: {
									tickets: true,
								},
							},
						},
					});
					if (refreshed) payment = refreshed;
				} else if (
					verifyRes?.data?.status === "failed" ||
					verifyRes?.data?.status === "abandoned"
				) {
					payment = await prisma.payment.update({
						where: { id: payment.id },
						data: { status: "failed" },
						include: {
							ticketOrders: {
								include: {
									tickets: true,
								},
							},
						},
					});
				}
			} catch (verifyErr) {
				console.error("Paystack verification error on callback:", verifyErr);
			}
		}

		const metadata = (payment.metadata as any) || {};
		const ticketOrder = payment.ticketOrders?.[0];
		const tickets = (ticketOrder?.tickets || []).map((t) => ({
			id: t.id,
			ticketCode: t.ticketCode,
			token: createTicketToken(t.id, t.ticketCode),
		}));

		return {
			success: true,
			payment: {
				id: payment.id,
				reference: payment.reference,
				status: payment.status,
				amount: Number(payment.amount),
				currency: payment.currency,
				purpose: payment.purpose,
				metadata,
				tickets,
				viewUrl: tickets[0]?.token
					? `/ticket/view?token=${tickets[0].token}`
					: undefined,
			},
		};
	} catch (err: any) {
		console.error("Get Payment Status Error:", err);
		return {
			success: false,
			error: err.message || "Failed to fetch payment status.",
		};
	}
}
