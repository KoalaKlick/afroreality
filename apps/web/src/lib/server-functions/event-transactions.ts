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
		sortBy?: string;
		sortDir?: "asc" | "desc";
	};
}): Promise<{ items: any[]; total: number }> {
	const session = await requireSession();

	const event = await prisma.event.findUnique({
		where: { id: data.eventId },
		select: { organizationId: true },
	});

	if (!event) throw new Error("Event not found");
	await requireOrgRole(event.organizationId, ["owner", "admin", "member"]);

	const page = Math.max(1, Number(data.page) || 1);
	const limit = Math.max(1, Math.min(50, Number(data.limit) || 10));
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
			{ option: { nomineeCode: { contains: q, mode: "insensitive" } } },
			{ category: { name: { contains: q, mode: "insensitive" } } },
		];
	}

	const orderBy: any = {};
	if (data.sortBy === "voteCount") {
		orderBy.voteCount = data.sortDir === "asc" ? "asc" : "desc";
	} else if (data.sortBy === "createdAt") {
		orderBy.createdAt = data.sortDir === "asc" ? "asc" : "desc";
	} else {
		orderBy.createdAt = "desc";
	}

	const [items, total] = await Promise.all([
		prisma.vote.findMany({
			where,
			include: {
				option: { select: { id: true, optionText: true, nomineeCode: true, imageUrl: true } },
				category: { select: { id: true, name: true, votePrice: true } },
				payment: { select: { id: true, reference: true, amount: true, status: true, createdAt: true } },
				voter: { select: { id: true, fullName: true, email: true, phone: true } },
			},
			orderBy,
			skip,
			take: limit,
		}),
		prisma.vote.count({ where }),
	]);

	const formatted = items.map((v) => {
		const unitPrice = Number(v.category?.votePrice || 1);
		const computedAmount = Number(v.payment?.amount || unitPrice * (v.voteCount || 1));
		return {
			id: v.id,
			reference: v.payment?.reference || `VOTE-${v.id.slice(-8).toUpperCase()}`,
			voterName: v.voter?.fullName || v.voterEmail || (v.voterPhone ? v.voterPhone : "Anonymous Voter"),
			voterEmail: v.voterEmail || v.voter?.email || "—",
			voterPhone: v.voterPhone || v.voter?.phone || "—",
			nomineeName: v.option?.optionText || "Nominee",
			nomineeCode: v.option?.nomineeCode || null,
			categoryName: v.category?.name || "Category",
			voteCount: v.voteCount || 1,
			amount: computedAmount,
			currency: "GHS",
			status: v.payment?.status || "completed",
			createdAt: v.createdAt,
		};
	});

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
		sortBy?: string;
		sortDir?: "asc" | "desc";
	};
}): Promise<{ items: any[]; total: number }> {
	const session = await requireSession();

	const event = await prisma.event.findUnique({
		where: { id: data.eventId },
		select: { organizationId: true },
	});

	if (!event) throw new Error("Event not found");
	await requireOrgRole(event.organizationId, ["owner", "admin", "member"]);

	const page = Math.max(1, Number(data.page) || 1);
	const limit = Math.max(1, Math.min(50, Number(data.limit) || 10));
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
			{ buyer: { email: { contains: q, mode: "insensitive" } } },
			{ buyer: { fullName: { contains: q, mode: "insensitive" } } },
		];
	}

	const orderBy: any = {};
	if (data.sortBy === "orderNumber") {
		orderBy.orderNumber = data.sortDir === "asc" ? "asc" : "desc";
	} else if (data.sortBy === "amount") {
		orderBy.subtotal = data.sortDir === "asc" ? "asc" : "desc";
	} else if (data.sortBy === "createdAt") {
		orderBy.createdAt = data.sortDir === "asc" ? "asc" : "desc";
	} else {
		orderBy.createdAt = "desc";
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
				payment: { select: { id: true, reference: true, amount: true, status: true, currency: true } },
			},
			orderBy,
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
			paymentId: order.payment?.id || null,
			buyerName: order.buyerName || order.buyer?.fullName || "Guest Attendee",
			buyerEmail: order.buyer?.email || "—",
			buyerPhone: order.buyerPhone || order.buyer?.phone || "—",
			ticketCount: order.tickets.length || 1,
			ticketType: ticketTypeNames,
			amount: Number(order.subtotal || order.payment?.amount || 0),
			fees: Number(order.fees || 0),
			currency: order.payment?.currency || "GHS",
			status: order.status,
			createdAt: order.createdAt,
		};
	});

	return { items: serializeJsonSafe(formatted), total };
}

export async function getEventNominationTransactions({
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

	const page = Math.max(1, Number(data.page) || 1);
	const limit = Math.max(1, Math.min(50, Number(data.limit) || 10));
	const skip = (page - 1) * limit;

	const where: any = {
		eventId: data.eventId,
		isPublicNomination: true,
	};

	if (data.search?.trim()) {
		const q = data.search.trim();
		where.OR = [
			{ optionText: { contains: q, mode: "insensitive" } },
			{ nomineeCode: { contains: q, mode: "insensitive" } },
			{ nominatedByEmail: { contains: q, mode: "insensitive" } },
			{ nominatedByName: { contains: q, mode: "insensitive" } },
		];
	}

	const [items, total] = await Promise.all([
		prisma.votingOption.findMany({
			where,
			include: {
				category: { select: { id: true, name: true, nominationPrice: true } },
			},
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
		}),
		prisma.votingOption.count({ where }),
	]);

	const formatted = items.map((opt) => ({
		id: opt.id,
		reference: opt.nomineeCode || `NOM-${opt.id.slice(-6).toUpperCase()}`,
		nomineeName: opt.optionText,
		nomineeCode: opt.nomineeCode || "—",
		nominatorName: opt.nominatedByName || "Nominator",
		email: opt.nominatedByEmail || "—",
		categoryName: opt.category?.name || "Category",
		amount: Number(opt.category?.nominationPrice || 0),
		currency: "GHS",
		status: opt.status || "approved",
		createdAt: opt.createdAt,
	}));

	return { items: serializeJsonSafe(formatted), total };
}

