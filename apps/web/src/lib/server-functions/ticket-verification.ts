"use server";

import { prisma } from "@repo/db";
import { serializeJsonSafe } from "../utils";
import { getAuthState } from "@/lib/auth-guards";
import { isPlatformAdmin } from "@/lib/admin/admin-auth";

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
			{ ticketCode: { contains: data.search, mode: "insensitive" } },
			{ attendeeName: { contains: data.search, mode: "insensitive" } },
			{ attendeeEmail: { contains: data.search, mode: "insensitive" } },
			{ order: { buyerName: { contains: data.search, mode: "insensitive" } } },
			{ order: { buyerEmail: { contains: data.search, mode: "insensitive" } } },
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

	return {
		tickets: serializeJsonSafe(tickets),
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

	return {
		success: true,
		ticket: serializeJsonSafe(updated),
	};
}
