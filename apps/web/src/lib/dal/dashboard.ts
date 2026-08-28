import { prisma } from "@repo/db";
import { getSession } from "./auth";

export const PAID_ORDER_STATUSES = ["completed", "paid"] as const;

export async function getDashboardOverview(orgId?: string | null) {
  const session = await getSession();
  if (!session) return null;
  const userId = session.id;

  try {
    const memberships = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        organization: {
          include: { _count: { select: { team: true } } },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    const organizations = memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      logoUrl: m.organization.logoUrl,
      role: m.role,
      memberCount: m.organization._count.team,
    }));

    let activeOrgId = orgId ?? null;
    if (activeOrgId && !organizations.some((o) => o.id === activeOrgId)) {
      activeOrgId = null;
    }
    if (!activeOrgId && organizations.length > 0) {
      activeOrgId = organizations[0]?.id || null;
    }

    const now = new Date();

    const [createdEventsCount, ticketOrderCount] = await Promise.all([
      prisma.event.count({ where: { creatorId: userId } }),
      prisma.ticketOrder.count({
        where: { buyerId: userId, status: "completed" },
      }),
    ]);

    const profileStats = {
      createdEvents: createdEventsCount,
      organizations: organizations.length,
      completedOrders: ticketOrderCount,
    };

    if (!activeOrgId) {
      return {
        organizations,
        activeOrganizationId: null,
        profileStats,
        stats: {
          total: 0,
          published: 0,
          draft: 0,
          ongoing: 0,
          ended: 0,
          cancelled: 0,
          upcoming: 0,
          byType: { voting: 0, ticketed: 0, hybrid: 0, standard: 0 },
          totalTicketsSold: 0,
          totalRevenue: 0,
          totalAttendees: 0,
          totalVotes: 0,
        },
        ongoingEvents: [],
        recentOrders: [],
        revenueData: [],
      };
    }

    const [
      statusTypeGroups,
      activeEvents,
      ticketStats,
      voteRevenueResult,
      voteCountResult,
      totalAttendees,
      totalTicketsSold,
      ongoingEventsList,
      recentOrdersList,
    ] = await Promise.all([
      prisma.event.groupBy({
        by: ["status", "type"],
        where: { organizationId: activeOrgId },
        _count: true,
      }),
      prisma.event.findMany({
        where: {
          organizationId: activeOrgId,
          status: { notIn: ["draft", "cancelled"] },
        },
        select: { id: true, startDate: true, endDate: true },
      }),
      prisma.ticketOrder.aggregate({
        where: {
          event: { organizationId: activeOrgId },
          status: "completed",
        },
        _sum: { subtotal: true },
      }),
      prisma.payment.aggregate({
        where: {
          status: "completed",
          purpose: "vote_purchase",
          votes: { some: { event: { organizationId: activeOrgId } } },
        },
        _sum: { amount: true },
      }),
      prisma.vote.aggregate({
        where: { event: { organizationId: activeOrgId } },
        _sum: { voteCount: true },
      }),
      prisma.ticket.count({
        where: {
          event: { organizationId: activeOrgId },
          checkInStatus: "checked_in",
        },
      }),
      prisma.ticket.count({
        where: {
          event: { organizationId: activeOrgId },
          order: { status: "completed" },
        },
      }),
      prisma.event.findMany({
        where: {
          organizationId: activeOrgId,
          status: { notIn: ["draft", "cancelled"] },
          startDate: { lte: now },
          OR: [{ endDate: null }, { endDate: { gte: now } }],
        },
        select: {
          id: true,
          title: true,
          type: true,
          flierImage: true,
          venueName: true,
          startDate: true,
        },
        orderBy: { startDate: "desc" },
        take: 5,
      }),
      prisma.ticketOrder.findMany({
        where: {
          event: { organizationId: activeOrgId },
        },
        include: {
          event: { select: { title: true } },
          buyer: { select: { fullName: true, email: true } },
          payment: { select: { currency: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

    const ticketRevenue = Number(ticketStats._sum.subtotal ?? 0);
    const voteRevenue = Number(voteRevenueResult._sum.amount ?? 0);
    const totalRevenue = ticketRevenue + voteRevenue;

    let total = 0, draft = 0, cancelled = 0;
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

    let ongoing = 0, ended = 0, upcoming = 0;
    const published = activeEvents.length;

    for (const evt of activeEvents) {
      const start = evt.startDate;
      const end = evt.endDate;
      if (start && start > now) upcoming++;
      else if (start && (!end || end >= now)) ongoing++;
      else if (end && end < now) ended++;
    }

    const stats = {
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
      totalVotes: Number(voteCountResult._sum.voteCount ?? 0),
    };

    const serializedOngoing = ongoingEventsList.map((e) => ({
      id: e.id,
      title: e.title,
      type: e.type,
      flierImage: e.flierImage,
      venueName: e.venueName,
      startDate: e.startDate ? e.startDate.toISOString() : null,
    }));

    const serializedOrders = recentOrdersList.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      buyerName: o.buyer?.fullName || o.buyerName || null,
      buyerEmail: o.buyer?.email || o.payment?.email || "",
      total: Number(o.subtotal || 0),
      currency: o.payment?.currency || "GHS",
      status: o.status,
      createdAt: o.createdAt.toISOString(),
      event: { title: o.event.title },
    }));

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const revenueData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[d.getMonth()];
      revenueData.push({
        month: monthName || "",
        revenue: i === 0 ? totalRevenue : 0,
      });
    }

    return {
      organizations,
      activeOrganizationId: activeOrgId,
      profileStats,
      stats,
      ongoingEvents: serializedOngoing,
      recentOrders: serializedOrders,
      revenueData,
    };
  } catch (error) {
    console.error("getDashboardOverview DAL error:", error);
    return null;
  }
}
