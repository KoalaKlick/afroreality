import { prisma } from "@repo/db";
import { serializeJsonSafe } from "@/lib/utils";
import type { EventStatsData } from "@/components/event/core/EventStats";

export async function getUserEvents(userId: string, orgId?: string) {
	const where: any = {};
	if (orgId) {
		where.organizationId = orgId;
	} else {
		where.organization = {
			team: {
				some: {
					userId,
				},
			},
		};
	}

	const events = await prisma.event.findMany({
		where,
		include: {
			organization: {
				select: {
					id: true,
					name: true,
					slug: true,
					logoUrl: true,
				},
			},
			_count: {
				select: {
					tickets: true,
					votes: true,
					ticketTypes: true,
					votingCategories: true,
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	return serializeJsonSafe(events);
}

export async function getEventsList(
	userId: string,
	filters?: { status?: string; search?: string; orgId?: string } | string,
	searchParam?: string,
) {
	const where: any = {};
	let orgId: string | undefined;
	let status: string | undefined;
	let search: string | undefined;

	if (typeof filters === "string") {
		orgId = filters;
		search = searchParam;
	} else if (filters) {
		orgId = filters.orgId;
		status = filters.status;
		search = filters.search;
	}

	if (orgId) {
		where.organizationId = orgId;
	} else {
		where.organization = {
			team: {
				some: {
					userId,
				},
			},
		};
	}

	if (status && status !== "all") {
		where.status = status;
	}

	if (search && search.trim()) {
		where.OR = [
			{ title: { contains: search, mode: "insensitive" } },
			{ description: { contains: search, mode: "insensitive" } },
		];
	}

	const events = await prisma.event.findMany({
		where,
		include: {
			organization: {
				select: {
					id: true,
					name: true,
					slug: true,
					logoUrl: true,
					primaryColor: true,
					secondaryColor: true,
				},
			},
			_count: {
				select: {
					tickets: true,
					votes: true,
					ticketTypes: true,
					votingCategories: true,
					members: true,
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	return serializeJsonSafe(events);
}

export async function getEventStats(
	userId: string,
	orgId?: string,
): Promise<EventStatsData> {
	const where: any = {};
	if (orgId) {
		where.organizationId = orgId;
	} else {
		where.organization = {
			team: {
				some: {
					userId,
				},
			},
		};
	}

	const now = new Date();
	const PAID_STATUSES = ["completed", "paid"];

	const [
		statusTypeGroups,
		activeEvents,
		ticketStats,
		voteRevenueResult,
		voteCountResult,
		totalAttendees,
		totalTicketsSold,
	] = await Promise.all([
		prisma.event
			.groupBy({
				by: ["status", "type"],
				where,
				_count: true,
			})
			.catch(() => []),
		prisma.event
			.findMany({
				where: {
					...where,
					status: { notIn: ["draft", "cancelled"] },
				},
				select: { id: true, startDate: true, endDate: true },
			})
			.catch(() => []),
		prisma.ticketOrder
			.aggregate({
				where: {
					event: where,
					status: { in: PAID_STATUSES as any },
				},
				_sum: { subtotal: true },
			})
			.catch(() => ({ _sum: { subtotal: null } })),
		prisma.payment
			.aggregate({
				where: {
					status: "completed",
					purpose: "vote_purchase",
					votes: { some: { event: where } },
				},
				_sum: { amount: true },
			})
			.catch(() => ({ _sum: { amount: null } })),
		prisma.vote
			.aggregate({
				where: { event: where },
				_sum: { voteCount: true },
			})
			.catch(() => ({ _sum: { voteCount: null } })),
		prisma.ticket
			.count({
				where: {
					event: where,
					checkInStatus: "checked_in" as any,
				},
			})
			.catch(() => 0),
		prisma.ticket
			.count({
				where: {
					event: where,
					order: { status: { in: PAID_STATUSES as any } },
				},
			})
			.catch(() => 0),
	]);

	const ticketRevenue = Number(ticketStats?._sum?.subtotal ?? 0);
	const voteRevenue = Number(voteRevenueResult?._sum?.amount ?? 0);
	const totalRevenue = ticketRevenue + voteRevenue;
	const totalVotes = Number(voteCountResult?._sum?.voteCount ?? 0);

	let total = 0;
	let draft = 0;
	let cancelled = 0;
	const byType = { voting: 0, ticketed: 0, hybrid: 0, standard: 0 };

	for (const group of statusTypeGroups as Array<{
		status: string;
		type: string;
		_count: number;
	}>) {
		const count = group._count;
		total += count;
		if (group.status === "draft") draft += count;
		if (group.status === "cancelled") cancelled += count;
		if (group.type && group.type in byType) {
			byType[group.type as keyof typeof byType] += count;
		}
	}

	let ongoing = 0;
	let ended = 0;
	let upcoming = 0;
	const published = activeEvents.length;

	for (const evt of activeEvents) {
		const start = evt.startDate ? new Date(evt.startDate) : null;
		const end = evt.endDate ? new Date(evt.endDate) : null;
		if (start && start > now) upcoming++;
		else if (start && (!end || end >= now)) ongoing++;
		else if (end && end < now) ended++;
	}

	return {
		total,
		published,
		draft,
		ongoing,
		ended,
		cancelled,
		upcoming,
		byType,
		totalTicketsSold,
		totalRevenue,
		totalAttendees,
		totalVotes,
	};
}

export async function getEventDetail(
	eventId: string,
	userId?: string,
): Promise<any> {
	const event = await prisma.event.findUnique({
		where: { id: eventId },
		include: {
			organization: true,
			ticketTypes: {
				orderBy: { orderIdx: "asc" },
			},
			votingCategories: {
				orderBy: { orderIdx: "asc" },
				include: {
					votingOptions: {
						orderBy: { createdAt: "desc" },
					},
					_count: {
						select: { votingOptions: true },
					},
				},
			},
			registrationFields: {
				orderBy: { orderIdx: "asc" },
			},
			members: {
				take: 100,
				orderBy: { createdAt: "desc" },
			},
			_count: {
				select: {
					tickets: true,
					votes: true,
					members: true,
				},
			},
		},
	});

	if (!event) return null;
	return serializeJsonSafe(event);
}

export async function getEventStatsAndTrends(eventId: string) {
	const PAID_STATUSES = ["completed", "paid"];

	const [
		ticketsSold,
		ticketRevenueResult,
		checkIns,
		totalVotesResult,
		totalOrders,
		categoriesCount,
		ticketTypes,
		votesList,
		ordersList,
	] = await Promise.all([
		prisma.ticket
			.count({
				where: {
					eventId,
					order: { status: { in: PAID_STATUSES as any } },
				},
			})
			.catch(() => 0),
		prisma.ticketOrder
			.aggregate({
				where: {
					eventId,
					status: { in: PAID_STATUSES as any },
				},
				_sum: { subtotal: true },
			})
			.catch(() => ({ _sum: { subtotal: null } })),
		prisma.ticket
			.count({
				where: { eventId, checkInStatus: "checked_in" as any },
			})
			.catch(() => 0),
		prisma.vote
			.aggregate({
				where: { eventId },
				_sum: { voteCount: true },
				_count: { _all: true },
			})
			.catch(() => ({ _sum: { voteCount: null }, _count: { _all: 0 } })),
		prisma.ticketOrder
			.count({
				where: {
					eventId,
					status: { in: PAID_STATUSES as any },
				},
			})
			.catch(() => 0),
		prisma.votingCategory
			.count({
				where: { eventId },
			})
			.catch(() => 0),
		prisma.ticketType
			.findMany({
				where: { eventId },
				include: {
					_count: {
						select: {
							tickets: {
								where: { order: { status: { in: PAID_STATUSES as any } } },
							},
						},
					},
				},
			})
			.catch(() => []),
		prisma.vote
			.findMany({
				where: { eventId },
				include: {
					option: { select: { optionText: true } },
					category: { select: { name: true } },
				},
				orderBy: { createdAt: "desc" },
				take: 20,
			})
			.catch(() => []),
		prisma.ticketOrder
			.findMany({
				where: {
					eventId,
					status: { in: PAID_STATUSES as any },
				},
				include: {
					buyer: { select: { fullName: true, email: true } },
				},
				orderBy: { createdAt: "desc" },
				take: 20,
			})
			.catch(() => []),
	]);

	const ticketRevenue = Number(ticketRevenueResult._sum.subtotal ?? 0);
	const totalVotes = Number(totalVotesResult._sum.voteCount ?? 0);
	const voteRevenue = totalVotes * 1;

	const ticketTypeSales = ticketTypes.map((tt) => ({
		name: tt.name,
		sold: tt._count.tickets,
		capacity: tt.quantityTotal,
		revenue: tt._count.tickets * Number(tt.price),
	}));

	const eventStats = {
		revenue: ticketRevenue + voteRevenue,
		ticketRevenue,
		voteRevenue,
		nominationRevenue: 0,
		ticketsSold,
		capacity: null,
		checkIns,
		totalVotes,
		totalCategories: categoriesCount,
		totalOrders,
	};

	return serializeJsonSafe({
		eventStats,
		ticketTypeSales,
		voteTrend: [],
		ticketTrend: [],
		ticketsSold,
		ticketRevenue,
		checkIns,
		totalVotes,
		totalOrders,
		categoriesCount,
		ticketTypes,
		recentVotes: votesList,
		recentOrders: ordersList,
	});
}
