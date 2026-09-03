"use server";
// src/lib/server-functions/event-revenue.ts

import { prisma } from "@repo/db";
import { requireSession } from "../session";
import { serializeJsonSafe } from "../utils";
import { requireOrgRole } from "./auth-helpers";

const PAID_STATUSES = ["completed", "paid"];

export interface EventRevenuePayment {
	id: string;
	reference: string;
	payer: string;
	contact: string;
	kind: "ticket" | "vote" | "nomination";
	label: string;
	amount: number;
	currency: string;
	status: string;
	createdAt: string | Date;
}

export async function getEventPaymentRevenue({
	data,
}: {
	data: {
		eventId: string;
		page?: number;
		limit?: number;
		search?: string;
		kind?: "ticket" | "vote" | "nomination" | "all";
	};
}): Promise<{
	items: EventRevenuePayment[];
	total: number;
	totals: {
		ticketRevenue: number;
		voteRevenue: number;
		nominationRevenue: number;
		totalRevenue: number;
	};
}> {
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
	const kind = data.kind ?? "all";

	const where: any = {
		status: { in: PAID_STATUSES as any },
		OR: [
			{
				ticketOrders: {
					some: { eventId: data.eventId },
				},
			},
			{
				votes: {
					some: { eventId: data.eventId },
				},
			},
		],
	};

	if (data.search?.trim()) {
		const q = data.search.trim();
		where.OR = [
			{ reference: { contains: q, mode: "insensitive" } },
			{ email: { contains: q, mode: "insensitive" } },
		];
	} else if (kind !== "all") {
		if (kind === "ticket") {
			where.OR = [{ ticketOrders: { some: { eventId: data.eventId } } }];
		} else if (kind === "vote") {
			where.OR = [{ votes: { some: { eventId: data.eventId } } }];
		} else {
			// Nominations are captured as a metadata/purpose match since there
			// is no direct Payment <-> VotingOption relation.
			where.OR = [{ purpose: "nomination" }];
		}
	}

	const [payments, totalsByPurpose, totalRevenueAgg, totalCount] =
		await Promise.all([
			prisma.payment.findMany({
				where,
				include: {
					ticketOrders: {
						where: { eventId: data.eventId },
						select: { orderNumber: true, subtotal: true },
					},
					votes: {
						where: { eventId: data.eventId },
						select: {
							voteCount: true,
							option: { select: { optionText: true } },
						},
					},
				},
				orderBy: { createdAt: "desc" },
				skip,
				take: limit,
			}),
			prisma.payment.groupBy({
				by: ["purpose"],
				where: {
					status: { in: PAID_STATUSES as any },
					OR: [
						{ ticketOrders: { some: { eventId: data.eventId } } },
						{ votes: { some: { eventId: data.eventId } } },
					],
				},
				_sum: { amount: true },
			}),
			prisma.payment.aggregate({
				where: {
					status: { in: PAID_STATUSES as any },
					OR: [
						{ ticketOrders: { some: { eventId: data.eventId } } },
						{ votes: { some: { eventId: data.eventId } } },
					],
				},
				_sum: { amount: true },
			}),
			prisma.payment.count({ where }),
		]);

	// Derive revenue by category from the purpose-based totals.
	const purposeSum = (p: string) => {
		const row = totalsByPurpose.find((r) => r.purpose === p);
		return Number(row?._sum?.amount ?? 0);
	};

	const ticketRevenue = purposeSum("ticket_purchase");
	const voteRevenue = purposeSum("vote_purchase") + purposeSum("voting");
	const nominationRevenue = purposeSum("nomination");
	const totalRevenue = Number(totalRevenueAgg._sum?.amount ?? 0);

	const items = payments.map((p) => {
		const hasTickets = p.ticketOrders.length > 0;
		const hasVotes = p.votes.length > 0;
		const kind: "ticket" | "vote" | "nomination" = hasTickets
			? "ticket"
			: hasVotes
				? "vote"
				: p.purpose === "nomination"
					? "nomination"
					: "ticket";

		let label = "Payment";
		if (hasTickets) {
			label = p.ticketOrders.map((o) => `Order ${o.orderNumber}`).join(", ");
		} else if (hasVotes) {
			const nominee = p.votes[0]?.option?.optionText;
			label = nominee ? `Vote: ${nominee}` : "Votes";
		} else if (p.purpose === "nomination") {
			label = "Nomination";
		}

		return {
			id: p.id,
			reference: p.reference,
			payer: p.email || "—",
			contact: p.email || "—",
			kind,
			label,
			amount: Number(p.amount),
			currency: p.currency || "GHS",
			status: p.status,
			createdAt: p.createdAt,
		};
	});

	return serializeJsonSafe({
		items,
		total: totalCount,
		totals: {
			ticketRevenue,
			voteRevenue,
			nominationRevenue,
			totalRevenue,
		},
	});
}
