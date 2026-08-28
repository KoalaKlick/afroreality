"use server";

import { prisma } from "@repo/db";
import { serializeJsonSafe } from "../utils";

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
	const isCheckIn = data.action === "check_in";

	const ticket = await prisma.ticket.update({
		where: { id: data.ticketId },
		data: {
			checkInStatus: isCheckIn ? "checked_in" : "not_checked_in",
			checkedInAt: isCheckIn ? new Date() : null,
		},
		include: {
			ticketType: true,
			order: true,
		},
	});

	return {
		success: true,
		ticket: serializeJsonSafe(ticket),
	};
}
