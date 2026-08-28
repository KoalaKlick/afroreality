import { prisma } from '@repo/db';
import { serializeJsonSafe } from '@/lib/utils';

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
      createdAt: 'desc',
    },
  });

  return serializeJsonSafe(events);
}

export async function getEventsList(
  userId: string,
  filters?: { status?: string; search?: string; orgId?: string } | string,
  searchParam?: string
) {
  const where: any = {};
  let orgId: string | undefined;
  let status: string | undefined;
  let search: string | undefined;

  if (typeof filters === 'string') {
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

  if (status && status !== 'all') {
    where.status = status;
  }

  if (search && search.trim()) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
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
      createdAt: 'desc',
    },
  });

  return serializeJsonSafe(events);
}

export async function getEventStats(userId: string, orgId?: string) {
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

  const [totalEvents, activeEvents, totalTickets, totalVotes] = await Promise.all([
    prisma.event.count({ where }).catch(() => 0),
    prisma.event.count({ where: { ...where, status: 'published' as any } }).catch(() => 0),
    prisma.ticket.count({ where: { event: where } }).catch(() => 0),
    prisma.vote.count({ where: { event: where } }).catch(() => 0),
  ]);

  return {
    totalEvents,
    activeEvents,
    totalTickets,
    totalVotes,
    totalRevenue: 0,
  };
}

export async function getEventDetail(eventId: string, userId?: string): Promise<any> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      organization: true,
      ticketTypes: {
        orderBy: { orderIdx: 'asc' },
      },
      votingCategories: {
        orderBy: { orderIdx: 'asc' },
        include: {
          votingOptions: {
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: { votingOptions: true },
          },
        },
      },
      registrationFields: {
        orderBy: { orderIdx: 'asc' },
      },
      members: {
        take: 100,
        orderBy: { createdAt: 'desc' },
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
  const PAID_STATUSES = ['completed', 'paid'];

  const [
    ticketsSold,
    ticketRevenueResult,
    checkIns,
    totalVotes,
    totalOrders,
    categoriesCount,
    ticketTypes,
    votesList,
    ordersList,
  ] = await Promise.all([
    prisma.ticket.count({
      where: {
        eventId,
        order: { status: { in: PAID_STATUSES as any } },
      },
    }).catch(() => 0),
    prisma.ticketOrder.aggregate({
      where: {
        eventId,
        status: { in: PAID_STATUSES as any },
      },
      _sum: { subtotal: true },
    }).catch(() => ({ _sum: { subtotal: null } })),
    prisma.ticket.count({
      where: { eventId, checkInStatus: 'checked_in' as any },
    }).catch(() => 0),
    prisma.vote.aggregate({
      where: { eventId },
      _sum: { voteCount: true },
      _count: { _all: true },
    }).catch(() => ({ _sum: { voteCount: null }, _count: { _all: 0 } })),
    prisma.ticketOrder.count({
      where: {
        eventId,
        status: { in: PAID_STATUSES as any },
      },
    }).catch(() => 0),
    prisma.votingCategory.count({
      where: { eventId },
    }).catch(() => 0),
    prisma.ticketType.findMany({
      where: { eventId },
      select: {
        id: true,
        name: true,
        price: true,
        currency: true,
        color: true,
        primaryColor: true,
        _count: { select: { tickets: true } },
      },
    }).catch(() => []),
    prisma.vote.findMany({
      where: { eventId },
      select: { createdAt: true, voteCount: true },
      orderBy: { createdAt: 'asc' },
    }).catch(() => []),
    prisma.ticketOrder.findMany({
      where: {
        eventId,
        status: { in: PAID_STATUSES as any },
      },
      select: {
        createdAt: true,
        subtotal: true,
        tickets: { select: { id: true } },
      },
      orderBy: { createdAt: 'asc' },
    }).catch(() => []),
  ]);

  const ticketRevenue = Number(ticketRevenueResult?._sum?.subtotal ?? 0);
  const voteRevenue = 0;
  const nominationRevenue = 0;
  const totalRevenue = ticketRevenue + voteRevenue + nominationRevenue;

  const eventStats = {
    revenue: totalRevenue,
    ticketRevenue,
    voteRevenue,
    nominationRevenue,
    ticketsSold,
    checkIns,
    totalVotes: Number(totalVotes?._sum?.voteCount ?? 0) || totalVotes?._count?._all || 0,
    totalCategories: categoriesCount,
    totalOrders,
  };

  const ticketTypeSales = ticketTypes.map((t: any) => ({
    ticketTypeId: t.id,
    name: t.name,
    sold: t._count?.tickets || 0,
    revenue: (t._count?.tickets || 0) * Number(t.price || 0),
    color: t.primaryColor || t.color || '#059669',
  }));

  // Build vote trend
  let voteTrend: { date: string; votes: number }[] = [];
  if (votesList && votesList.length > 0) {
    const grouped = new Map<string, number>();
    for (const v of votesList) {
      const dateKey = v.createdAt.toISOString().slice(0, 10);
      grouped.set(dateKey, (grouped.get(dateKey) ?? 0) + Number(v.voteCount || 1));
    }
    const sortedDates = [...grouped.keys()].sort();
    if (sortedDates.length > 0) {
      const start = new Date(sortedDates[0]!);
      const end = new Date(sortedDates[sortedDates.length - 1]!);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().slice(0, 10);
        voteTrend.push({ date: key, votes: grouped.get(key) ?? 0 });
      }
    }
  }

  // Build ticket trend
  let ticketTrend: { date: string; sales: number; revenue: number }[] = [];
  if (ordersList && ordersList.length > 0) {
    const grouped = new Map<string, { sales: number; revenue: number }>();
    for (const o of ordersList) {
      const dateKey = o.createdAt.toISOString().slice(0, 10);
      const cur = grouped.get(dateKey) ?? { sales: 0, revenue: 0 };
      grouped.set(dateKey, {
        sales: cur.sales + (o.tickets?.length || 0),
        revenue: cur.revenue + Number(o.subtotal || 0),
      });
    }
    const sortedDates = [...grouped.keys()].sort();
    if (sortedDates.length > 0) {
      const start = new Date(sortedDates[0]!);
      const end = new Date(sortedDates[sortedDates.length - 1]!);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().slice(0, 10);
        const entry = grouped.get(key) ?? { sales: 0, revenue: 0 };
        ticketTrend.push({ date: key, sales: entry.sales, revenue: entry.revenue });
      }
    }
  }

  return {
    eventStats,
    ticketTypeSales,
    voteTrend,
    ticketTrend,
  };
}
