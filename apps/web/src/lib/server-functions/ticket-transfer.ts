"use server";

import { prisma } from "@repo/db";
import { generateTicketCode } from "@/lib/utils/ticket-code";
import { createTicketToken, verifyTicketToken } from "@/lib/ticket-crypto";
import { normalizePhoneNumber } from "@/lib/services/whatsapp";
import { dispatchTicketChannelNotification } from "@/lib/server-functions/fulfillment/notifications";
import { getFrontendBaseUrl } from "@/lib/utils";
import { logEventActivity } from "@/lib/audit/audit-logger";

export interface TransferTicketInput {
	ticketId: string;
	currentTicketCode: string;
	token?: string;
	recipientPhone: string;
	recipientName?: string;
	channel: "whatsapp" | "sms";
}

export interface TransferTicketResult {
	success: boolean;
	newTicketCode: string;
	newToken: string;
	newDirectUrl: string;
	recipientPhone: string;
	channel: "whatsapp" | "sms";
	error?: string;
}

/**
 * Transfers an existing ticket to a new recipient phone number.
 * Validates cryptographic ownership, generates a brand-new Crockford base-32 ticket code
 * and cryptographic token, invalidating the previous ticket code immediately.
 * Reuses the official SMS/WhatsApp notification template to dispatch the pass to the new owner.
 */
export async function transferTicketPass({
	data,
}: {
	data: TransferTicketInput;
}): Promise<TransferTicketResult> {
	const { ticketId, currentTicketCode, token, recipientPhone, recipientName, channel } = data;

	if (!ticketId || !currentTicketCode) {
		throw new Error("Missing ticket identification.");
	}

	if (!recipientPhone || recipientPhone.trim().length < 9) {
		throw new Error("Please enter a valid recipient phone number.");
	}

	if (channel !== "whatsapp" && channel !== "sms") {
		throw new Error("Please select a valid delivery channel (WhatsApp or SMS).");
	}

	// Verify cryptographic token if supplied (prevents forged / guessed transfer requests)
	if (token) {
		const verified = verifyTicketToken(token);
		if (!verified || verified.ticketId !== ticketId || verified.ticketCode.trim().toUpperCase() !== currentTicketCode.trim().toUpperCase()) {
			throw new Error("Invalid or expired ticket authorization token.");
		}
	}

	// Clean & normalize recipient phone
	const normalizedPhone = normalizePhoneNumber(recipientPhone.trim());
	if (!normalizedPhone || normalizedPhone.length < 9) {
		throw new Error("Invalid recipient phone number format.");
	}

	// Find the ticket and verify it matches the current code
	const ticket = await prisma.ticket.findUnique({
		where: { id: ticketId },
		include: {
			event: {
				include: { organization: true },
			},
			ticketType: true,
		},
	});

	if (!ticket) {
		throw new Error("Ticket not found.");
	}

	if (ticket.ticketCode.trim().toUpperCase() !== currentTicketCode.trim().toUpperCase()) {
		throw new Error("Ticket code mismatch or this pass has already been transferred.");
	}

	// Prevent self-transfer
	if (ticket.attendeePhone && normalizePhoneNumber(ticket.attendeePhone) === normalizedPhone) {
		throw new Error("This ticket is already registered to this phone number.");
	}

	if (ticket.checkInStatus === "checked_in") {
		throw new Error("This ticket has already been used for event entry and cannot be transferred.");
	}

	if (ticket.event.status === "ended" || ticket.event.status === "cancelled") {
		throw new Error("Cannot transfer tickets for events that have ended or been cancelled.");
	}

	// Rate/abuse limiting: Maximum 3 transfers per pass to prevent SMS/spam abuse
	const previousTransfers = await prisma.activityLog.count({
		where: {
			action: "ticket_transferred",
			entityId: ticket.id,
		},
	});

	if (previousTransfers >= 3) {
		throw new Error("This ticket has reached the maximum transfer limit (3 transfers).");
	}

	// Generate NEW 5-6 Crockford Base-32 ticket code format
	const { ticketCode: newTicketCode } = generateTicketCode(ticket.eventId);
	const newToken = createTicketToken(ticket.id, newTicketCode);
	const targetAttendeeName = recipientName?.trim() || ticket.attendeeName || "Attendee";

	// Atomically update ticket: new code, new recipient phone & name, reset sent flags
	const updatedTicket = await prisma.ticket.update({
		where: { id: ticket.id },
		data: {
			ticketCode: newTicketCode,
			attendeeName: targetAttendeeName,
			attendeePhone: normalizedPhone,
			attendeeEmail: null, // Clear email since pass is reassigned
			smsSent: false,
			whatsappSent: false,
			updatedAt: new Date(),
		},
	});

	const notifEvent = ticket.event;

	// Send message through selected channel reusing canonical template
	try {
		await dispatchTicketChannelNotification({
			ticketIds: [updatedTicket.id],
			phone: normalizedPhone,
			attendeeName: targetAttendeeName,
			eventTitle: notifEvent.title,
			ticketCode: newTicketCode,
			ticketToken: newToken,
			ticketCount: 1,
			eventStartDate: notifEvent.startDate,
			bannerImageUrl: notifEvent.flierImage || notifEvent.bannerImage || undefined,
			eventId: notifEvent.id,
			channel, // "whatsapp" or "sms"
		});
	} catch (err) {
		console.error(`[TICKET-TRANSFER-${channel.toUpperCase()}-ERR]`, err);
	}

	// Audit trail log for security, organizer transparency, and gate lookup
	try {
		await logEventActivity({
			eventId: notifEvent.id,
			organizationId: notifEvent.organizationId,
			action: "ticket_transferred",
			entityType: "ticket",
			entityId: ticket.id,
			description: `Ticket ${currentTicketCode} was transferred to ${normalizedPhone} (New pass: ${newTicketCode}) via ${channel.toUpperCase()}`,
			metadata: {
				oldTicketCode: currentTicketCode,
				newTicketCode,
				previousPhone: ticket.attendeePhone,
				newPhone: normalizedPhone,
				recipientName: targetAttendeeName,
				channel,
				transferredAt: new Date().toISOString(),
			},
		});
	} catch (auditErr) {
		console.warn("[TICKET-TRANSFER-AUDIT-ERR]", auditErr);
	}

	const baseUrl = getFrontendBaseUrl();
	const newDirectUrl = `${baseUrl}/ticket/view?token=${newToken}`;

	return {
		success: true,
		newTicketCode,
		newToken,
		newDirectUrl,
		recipientPhone: normalizedPhone,
		channel,
	};
}

