"use server";
import { prisma } from "@repo/db";
import { createTicketToken, verifyTicketToken } from "@/lib/ticket-crypto";
import { paystack } from "@/lib/paystack";
import { getFrontendBaseUrl } from "@/lib/utils";

interface PublicTicketCheckoutInput {
	eventId: string;
	ticketTypeId: string;
	quantity: number;
	buyerName: string;
	buyerEmail: string;
	buyerPhone?: string;
}

interface PublicVoteInput {
	eventId: string;
	categoryId: string;
	optionId: string;
	voteCount?: number;
	voterEmail?: string;
	voterPhone?: string;
	voterKey?: string;
}

interface VerifyTicketInput {
	token?: string;
	ticketCode?: string;
	action?: "check_in" | "check_out" | "status";
}

/**
 * 1. Public Ticket Checkout
 * Handles Free RSVP / Immediate Ticket issuance or Paystack payment authorization
 */
export async function initiatePublicTicketCheckout({
	data,
}: {
	data: PublicTicketCheckoutInput;
}) {
	try {
		const { eventId, ticketTypeId, quantity, buyerName, buyerEmail, buyerPhone } =
			data;

		if (!buyerName || !buyerEmail || quantity < 1) {
			return {
				success: false,
				error: "Missing required checkout information.",
			};
		}

		const ticketType = await prisma.ticketType.findUnique({
			where: { id: ticketTypeId },
			include: {
				event: {
					include: { organization: true },
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

		if (
			ticketType.quantityTotal &&
			ticketType.quantitySold + quantity > ticketType.quantityTotal
		) {
			return {
				success: false,
				error: "Sorry, not enough tickets available in this tier.",
			};
		}

		const unitPrice = Number(ticketType.price);
		const totalAmount = unitPrice * quantity;
		const isFree = totalAmount === 0;

		const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

		// Create Ticket Order
		const order = await prisma.ticketOrder.create({
			data: {
				orderNumber,
				eventId,
				buyerName,
				buyerPhone,
				subtotal: totalAmount,
				discountAmount: 0,
				fees: 0,
				status: isFree ? "completed" : "pending",
			},
		});

		if (isFree) {
			// Generate Tickets immediately
			const tickets = [];
			for (let i = 0; i < quantity; i++) {
				const ticketCode = `TIX-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
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

			// Increment sold count
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

		// Paid Ticket: Initialize Paystack Transaction
		const callbackUrl = `${getFrontendBaseUrl()}/payment/callback`;

		const paystackRes = await paystack.transaction.initialize({
			email: buyerEmail,
			amount: Math.round(totalAmount * 100),
			currency: ticketType.currency || "GHS",
			callback_url: callbackUrl,
			metadata: {
				purpose: "ticket_purchase",
				orderId: order.id,
				orderNumber,
				eventId,
				ticketTypeId,
				quantity,
				buyerName,
				buyerEmail,
				buyerPhone,
				orgSlug: ticketType.event.organization.slug,
				eventSlug: ticketType.event.slug,
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

		return {
			success: true,
			isFree: false,
			orderId: order.id,
			orderNumber,
			authorizationUrl: paystackRes.data.authorization_url,
			accessCode: paystackRes.data.access_code,
			reference: paystackRes.data.reference,
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
		const totalAmount = votePrice * voteCount;
		const isFree = totalAmount === 0;

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

		// Paid Vote: Initialize Paystack
		if (!voterEmail) {
			return {
				success: false,
				error: "Email is required for payment receipt.",
			};
		}

		const callbackUrl = `${getFrontendBaseUrl()}/payment/callback`;

		const paystackRes = await paystack.transaction.initialize({
			email: voterEmail,
			amount: Math.round(totalAmount * 100),
			currency: "GHS",
			callback_url: callbackUrl,
			metadata: {
				purpose: "vote_purchase",
				eventId,
				categoryId,
				optionId,
				voteCount,
				voterEmail,
				voterPhone,
				orgSlug: category.event.organization.slug,
				eventSlug: category.event.slug,
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

		return {
			success: true,
			isPaid: true,
			authorizationUrl: paystackRes.data.authorization_url,
			accessCode: paystackRes.data.access_code,
			reference: paystackRes.data.reference,
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

