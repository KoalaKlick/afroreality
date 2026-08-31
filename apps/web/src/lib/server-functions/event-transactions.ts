"use server";
// src/lib/server-functions/event-transactions.ts

import { prisma } from "@repo/db";
import { requireSession } from "../session";
import { serializeJsonSafe } from "../utils";
import { requireOrgRole } from "./auth-helpers";

export async function getEventVoteTransactions({
	data,
}: {
	data: {
		eventId: string;
		page?: number;
		limit?: number;
		search?: string;
	};
}): Promise<{ items: any[]; total: number }> {
	const session = await requireSession();

	const event = await prisma.event.findUnique({
		where: { id: data.eventId },
		select: { organizationId: true },
	});

	if (!event) throw new Error("Event not found");
	await requireOrgRole(event.organizationId, ["owner", "admin", "member"]);

	const page = data.page || 1;
	const limit = data.limit || 10;
	const skip = (page - 1) * limit;

	const where: any = {
		eventId: data.eventId,
	};

	if (data.search?.trim()) {
		const q = data.search.trim();
		where.OR = [
			{ voterPhone: { contains: q, mode: "insensitive" } },
			{ voterEmail: { contains: q, mode: "insensitive" } },
			{ payment: { reference: { contains: q, mode: "insensitive" } } },
			{ option: { optionText: { contains: q, mode: "insensitive" } } },
			{ category: { name: { contains: q, mode: "insensitive" } } },
		];
	}

	const [items, total] = await Promise.all([
		prisma.vote.findMany({
			where,
			include: {
				option: { select: { id: true, optionText: true } },
				category: { select: { id: true, name: true, votePrice: true } },
				payment: { select: { id: true, reference: true, amount: true, status: true } },
				voter: { select: { id: true, fullName: true, email: true } },
			},
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
		}),
		prisma.vote.count({ where }),
	]);

	const formatted = items.map((v) => ({
		id: v.id,
		reference: v.payment?.reference || `VOTE-${v.id.slice(-6)}`,
		voterName: v.voter?.fullName || v.voterEmail || "Anonymous Voter",
		voterPhone: v.voterPhone || "—",
		nomineeName: v.option?.optionText || "Nominee",
		categoryName: v.category?.name || "Category",
		voteCount: v.voteCount || 1,
		amount: v.payment?.amount ? Number(v.payment.amount) : (Number(v.category?.votePrice || 1) * (v.voteCount || 1)),
		currency: "GHS",
		status: v.payment?.status || "completed",
		createdAt: v.createdAt,
	}));

	return { items: serializeJsonSafe(formatted), total };
}

export async function getEventTicketTransactions({
	data,
}: {
	data: {
		eventId: string;
		page?: number;
		limit?: number;
		search?: string;
	};
}): Promise<{ items: any[]; total: number }> {
	const session = await requireSession();

	const event = await prisma.event.findUnique({
		where: { id: data.eventId },
		select: { organizationId: true },
	});

	if (!event) throw new Error("Event not found");
	await requireOrgRole(event.organizationId, ["owner", "admin", "member"]);

	const page = data.page || 1;
	const limit = data.limit || 10;
	const skip = (page - 1) * limit;

	const where: any = {
		eventId: data.eventId,
	};

	if (data.search?.trim()) {
		const q = data.search.trim();
		where.OR = [
			{ buyerName: { contains: q, mode: "insensitive" } },
			{ buyerPhone: { contains: q, mode: "insensitive" } },
			{ orderNumber: { contains: q, mode: "insensitive" } },
			{ payment: { reference: { contains: q, mode: "insensitive" } } },
		];
	}

	const [items, total] = await Promise.all([
		prisma.ticketOrder.findMany({
			where,
			include: {
				tickets: {
					include: {
						ticketType: { select: { id: true, name: true, price: true } },
					},
				},
				buyer: { select: { id: true, fullName: true, email: true, phone: true } },
				payment: { select: { id: true, reference: true, amount: true, status: true } },
			},
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
		}),
		prisma.ticketOrder.count({ where }),
	]);

	const formatted = items.map((order) => {
		const ticketTypeNames = Array.from(
			new Set(order.tickets.map((t) => t.ticketType?.name).filter(Boolean)),
		).join(", ") || "General Admission";

		return {
			id: order.id,
			orderNumber: order.orderNumber,
			reference: order.payment?.reference || order.orderNumber,
			customerName: order.buyerName || order.buyer?.fullName || "Customer",
			customerEmail: order.buyer?.email || "—",
			customerPhone: order.buyerPhone || order.buyer?.phone || "—",
			ticketCount: order.tickets.length || 1,
			ticketType: ticketTypeNames,
			amount: Number(order.subtotal || order.payment?.amount || 0),
			currency: "GHS",
			status: order.status,
			createdAt: order.createdAt,
		};
	});

	return { items: serializeJsonSafe(formatted), total };
}
