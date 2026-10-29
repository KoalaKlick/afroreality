"use server";

import { prisma } from "@repo/db";
import { serializeJsonSafe } from "../utils";
import { getAuthState } from "@/lib/auth-guards";
import { isPlatformAdmin } from "@/lib/admin/admin-auth";
import { isPlaceholderName } from "@/lib/server-functions/fulfillment/payer-name";

async function verifyEventOrganizerAccess(
	userId: string,
	email: string,
	eventId: string,
): Promise<boolean> {
	if (await isPlatformAdmin(email)) return true;

	const event = await prisma.event.findUnique({
		where: { id: eventId },
		include: { organization: true },
	});
	if (!event) return false;

	if (event.creatorId === userId || event.organization?.createdBy === userId) {
		return true;
	}

	const membership = await prisma.teamMember.findUnique({
		where: {
			organizationId_userId: {
				organizationId: event.organizationId,
				userId,
			},
		},
		select: { role: true },
	});

	return Boolean(membership);
}

export async function getEventTicketAttendees({
	data,
}: {
	data: { eventId: string; search?: string };
}): Promise<{
	tickets: any[];
	totalCount: number;
	checkedInCount: number;
	remainingCount: number;
}> {
	const auth = await getAuthState();
	if (!auth) {
		throw new Error("Authentication required.");
	}

	const isAuthorized = await verifyEventOrganizerAccess(
		auth.userId,
		auth.email,
		data.eventId,
	);
	if (!isAuthorized) {
		throw new Error("You are not authorized to view attendee tickets for this event.");
	}

	const where: any = {
		eventId: data.eventId,
	};

	if (data.search) {
		where.OR = [
			{ attendeeName: { contains: data.search, mode: "insensitive" } },
			{ attendeeEmail: { contains: data.search, mode: "insensitive" } },
			{ attendeePhone: { contains: data.search, mode: "insensitive" } },
			{ order: { orderNumber: { contains: data.search, mode: "insensitive" } } },
			{ order: { buyerName: { contains: data.search, mode: "insensitive" } } },
			{ order: { buyerEmail: { contains: data.search, mode: "insensitive" } } },
			{ order: { buyerPhone: { contains: data.search, mode: "insensitive" } } },
		];
	}

	const [tickets, totalCount, checkedInCount] = await Promise.all([
		prisma.ticket.findMany({
			where,
			include: {
				ticketType: true,
				order: true,
			},
			orderBy: [{ checkedInAt: "desc" }, { createdAt: "desc" }],
		}),
		prisma.ticket.count({ where: { eventId: data.eventId } }),
		prisma.ticket.count({
			where: { eventId: data.eventId, checkInStatus: "checked_in" },
		}),
	]);

	// Security: NEVER return the raw or partial ticketCode in the attendee roster.
	// Organizers and sub-admins only receive the public orderNumber and attendee profile.
	const sanitizedTickets = tickets.map((t: any) => {
		const name =
			(!isPlaceholderName(t.attendeeName) ? t.attendeeName : null) ||
			(!isPlaceholderName(t.order?.buyerName) ? t.order.buyerName : null) ||
			t.attendeeName;
		return {
			id: t.id,
			orderNumber: t.order?.orderNumber || `ORD-${t.id.slice(0, 8).toUpperCase()}`,
			attendeeName: name,
			attendeeEmail: t.attendeeEmail || t.order?.buyerEmail || null,
			attendeePhone: t.attendeePhone || t.order?.buyerPhone || null,
			checkInStatus: t.checkInStatus,
			checkedInAt: t.checkedInAt,
			createdAt: t.createdAt,
			ticketType: t.ticketType ? { id: t.ticketType.id, name: t.ticketType.name } : null,
		};
	});

	return {
		tickets: serializeJsonSafe(sanitizedTickets),
		totalCount,
		checkedInCount,
		remainingCount: Math.max(0, totalCount - checkedInCount),
	};
}

export async function toggleTicketCheckInStatus({
	data,
}: {
	data: { ticketId: string; action: "check_in" | "check_out" };
}): Promise<{ success: boolean; ticket: any }> {
	const auth = await getAuthState();
	if (!auth) {
		throw new Error("Authentication required.");
	}

	const ticket = await prisma.ticket.findUnique({
		where: { id: data.ticketId },
		select: { id: true, eventId: true },
	});

	if (!ticket) {
		throw new Error("Ticket not found.");
	}

	const isAuthorized = await verifyEventOrganizerAccess(
		auth.userId,
		auth.email,
		ticket.eventId,
	);
	if (!isAuthorized) {
		throw new Error("You are not authorized to check in tickets for this event.");
	}

	if (data.action === "check_out") {
		throw new Error(
			"Admission is final and cannot be undone from the dashboard. Re-entry must be managed via physical wristbands or hand-stamps to prevent duplicate ticket entry.",
		);
	}

	const isCheckIn = data.action === "check_in";

	const updated = await prisma.ticket.update({
		where: { id: data.ticketId },
		data: {
			checkInStatus: isCheckIn ? "checked_in" : "not_checked_in",
			checkedInAt: isCheckIn ? new Date() : null,
			checkedInBy: isCheckIn ? auth.userId : null,
		},
		include: {
			ticketType: true,
			order: true,
		},
	});

	const resolvedName =
		(!isPlaceholderName(updated.attendeeName) ? updated.attendeeName : null) ||
		(!isPlaceholderName(updated.order?.buyerName) ? updated.order.buyerName : null) ||
		updated.attendeeName;

	return {
		success: true,
		ticket: serializeJsonSafe({
			id: updated.id,
			orderNumber: updated.order?.orderNumber || `ORD-${updated.id.slice(0, 8).toUpperCase()}`,
			attendeeName: resolvedName,
			attendeeEmail: updated.attendeeEmail,
			attendeePhone: updated.attendeePhone,
			checkInStatus: updated.checkInStatus,
			checkedInAt: updated.checkedInAt,
			ticketType: updated.ticketType,
		}),
	};
}
