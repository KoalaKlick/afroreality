import { prisma } from "@repo/db";
import { getSession } from "./auth";
import { getOrgWallet } from "@/lib/server-functions/wallet";

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

    // 1. Fetch organization events and wallet directly from getOrgWallet (single source of truth)
    const [orgEvents, walletRes] = await Promise.all([
      prisma.event.findMany({
        where: { organizationId: activeOrgId },
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          startDate: true,
          endDate: true,
          flierImage: true,
          venueName: true,
        },
      }),
      getOrgWallet({ data: { organizationId: activeOrgId } }).catch((err) => {
        console.warn("[DASHBOARD-WALLET-ERR]", err);
        return null;
      }),
    ]);

    const eventIds = orgEvents.map((e) => e.id);
    const eventIdSet = new Set(eventIds);
    const eventTitleMap = new Map(orgEvents.map((e) => [e.id, e.title]));

    // 2. Fetch all completed payments and ticket orders for this organization's events
    const [allCompletedPayments, ticketOrdersList, voteSumResult, optionVoteSumResult, attendeesCount, ticketsSoldCount] =
      await Promise.all([
        prisma.payment.findMany({
          where: {
            status: "completed",
          },
          include: {
            ticketOrders: { select: { eventId: true } },
            votes: { select: { eventId: true } },
          },
          orderBy: { createdAt: "desc" },
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
          take: 10,
        }),
        prisma.vote.aggregate({
          where: { event: { organizationId: activeOrgId } },
          _sum: { voteCount: true },
        }),
        prisma.votingOption.aggregate({
          where: { event: { organizationId: activeOrgId } },
          _sum: { votesCount: true },
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
      ]);

    // Filter payments belonging to this organization
    const orgPayments = allCompletedPayments.filter((p) => {
      const meta = (p.metadata as any) || {};
      if (meta.organizationId === activeOrgId || meta.orgId === activeOrgId) return true;
      if (meta.eventId && eventIdSet.has(meta.eventId)) return true;
      if (meta.event_id && eventIdSet.has(meta.event_id)) return true;
      if (p.ticketOrders?.some((to) => eventIdSet.has(to.eventId))) return true;
      if (p.votes?.some((v) => eventIdSet.has(v.eventId))) return true;
      return false;
    });

    // 3. Read exact recorded amounts from database without inline re-calculation
    let totalGrossRevenue = 0;
    let totalOrganizerRevenue = 0;

    for (const p of orgPayments) {
      const meta = (p.metadata as any) || {};
      const baseAmount = Number(meta.baseAmount ?? p.amount ?? 0);
      const platformFee = Number(meta.platformFee ?? 0);
      const organizerReceives = Number(meta.organizerReceives ?? (baseAmount - platformFee));

      totalGrossRevenue += baseAmount;
      totalOrganizerRevenue += organizerReceives;
    }

    // 4. Status and Type aggregation
    let total = 0, draft = 0, cancelled = 0, ongoing = 0, ended = 0, upcoming = 0, published = 0;
    const byType = { voting: 0, ticketed: 0, hybrid: 0, standard: 0 };

    for (const evt of orgEvents) {
      total++;
      if (evt.status === "draft") draft++;
      else if (evt.status === "cancelled") cancelled++;
      else {
        published++;
        const start = evt.startDate;
        const end = evt.endDate;
        if (start && start > now) upcoming++;
        else if (start && (!end || end >= now)) ongoing++;
        else if (end && end < now) ended++;
        else if (evt.status === "ongoing") ongoing++;
      }

      if (evt.type && evt.type in byType) {
        byType[evt.type as keyof typeof byType]++;
      }
    }

    // 5. Total Votes (take maximum of direct vote records or option counters)
    const rawVoteCount = Number(voteSumResult._sum.voteCount ?? 0);
    const optionVoteCount = Number(optionVoteSumResult._sum.votesCount ?? 0);
    const totalVotes = Math.max(rawVoteCount, optionVoteCount);

    const organizerShare = walletRes
      ? Number(walletRes.organizerShare ?? totalOrganizerRevenue)
      : totalOrganizerRevenue;
    const availableBalance = walletRes
      ? Number(walletRes.availableBalance ?? totalOrganizerRevenue)
      : totalOrganizerRevenue;
    const pendingBalance = walletRes
      ? Number(walletRes.pendingBalance ?? 0)
      : 0;
    const totalInflows = walletRes
      ? Number(walletRes.totalInflows ?? totalGrossRevenue)
      : totalGrossRevenue;
    const totalPayouts = walletRes
      ? Number(walletRes.totalPayouts ?? 0)
      : 0;
    const platformFees = walletRes?.platformFees !== undefined
      ? Number(walletRes.platformFees)
      : Math.max(0, Math.round((totalInflows - organizerShare) * 100) / 100);

    const stats = {
      total,
      published,
      draft,
      ongoing,
      ended,
      cancelled,
      upcoming,
      byType,
      totalTicketsSold: ticketsSoldCount,
      totalRevenue: organizerShare,
      totalInflows,
      organizerShare,
      availableBalance,
      pendingBalance,
      totalPayouts,
      totalWithdrawn: totalPayouts,
      platformFees,
      totalAttendees: attendeesCount,
      totalVotes,
      currency: walletRes?.currency || "GHS",
    };

    // 6. Ongoing Events List
    const ongoingEventsList = orgEvents
      .filter((e) => e.status !== "draft" && e.status !== "cancelled")
      .slice(0, 5)
      .map((e) => ({
        id: e.id,
        title: e.title,
        type: e.type,
        flierImage: e.flierImage,
        venueName: e.venueName,
        startDate: e.startDate ? e.startDate.toISOString() : null,
      }));

    // 7. Recent Orders & Activities (combine ticket orders + voting / nomination payments)
    const combinedOrders: Array<{
      id: string;
      orderNumber: string;
      buyerName: string | null;
      buyerEmail: string;
      total: number;
      currency: string;
      status: string;
      createdAt: string;
      event: { title: string };
    }> = [];

    // Add ticket orders (exact amount)
    for (const o of ticketOrdersList) {
      combinedOrders.push({
        id: o.id,
        orderNumber: o.orderNumber,
        buyerName: o.buyer?.fullName || o.buyerName || null,
        buyerEmail: o.buyer?.email || o.payment?.email || "",
        total: Number(o.subtotal || 0),
        currency: o.payment?.currency || "GHS",
        status: o.status,
        createdAt: o.createdAt.toISOString(),
        event: { title: o.event.title },
      });
    }

    // Add completed payment orders (voting and nomination payments with exact gross amount)
    for (const p of orgPayments) {
      if (p.purpose === "ticket_purchase") continue; // already tracked via ticketOrders if present
      const meta = (p.metadata as any) || {};
      const eventId = meta.eventId || meta.event_id;
      const eventTitle = (eventId && eventTitleMap.get(eventId)) || meta.eventName || "Event";

      const buyerAmount = Number(meta.baseAmount ?? p.amount ?? 0);

      const buyerName =
        meta.nomineeName ||
        meta.nominatorName ||
        meta.voterPhone ||
        p.email?.split("@")[0] ||
        "Supporter";

      combinedOrders.push({
        id: p.id,
        orderNumber: p.reference,
        buyerName,
        buyerEmail: p.email || meta.nominatorEmail || meta.voterEmail || "",
        total: buyerAmount,
        currency: p.currency || "GHS",
        status: p.status,
        createdAt: p.createdAt.toISOString(),
        event: { title: eventTitle },
      });
    }

    combinedOrders.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const recentOrders = combinedOrders.slice(0, 8);

    // 8. Accurate Daily, Weekly, and Monthly Revenue & Orders Trends
    // A. Daily (past 7 days)
    const dailyTrends: Array<{ date: string; revenue: number; orders: number; gross: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      const label = d.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" });

      const dayPayments = orgPayments.filter((p) => {
        const pDate = new Date(p.verifiedAt || p.createdAt);
        return pDate >= dayStart && pDate <= dayEnd;
      });

      const dayRevenue = dayPayments.reduce((sum, p) => {
        const meta = (p.metadata as any) || {};
        return sum + Number(meta.organizerReceives ?? p.amount ?? 0);
      }, 0);

      const dayGross = dayPayments.reduce((sum, p) => {
        const meta = (p.metadata as any) || {};
        return sum + Number(meta.baseAmount ?? p.amount ?? 0);
      }, 0);

      dailyTrends.push({
        date: label,
        revenue: Math.round(dayRevenue * 100) / 100,
        orders: dayPayments.length,
        gross: Math.round(dayGross * 100) / 100,
      });
    }

    // B. Weekly (past 8 weeks)
    const weeklyTrends: Array<{ date: string; revenue: number; orders: number; gross: number }> = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7 + weekStart.getDay()));
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const label = `W${8 - i} (${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`;

      const weekPayments = orgPayments.filter((p) => {
        const pDate = new Date(p.verifiedAt || p.createdAt);
        return pDate >= weekStart && pDate <= weekEnd;
      });

      const weekRevenue = weekPayments.reduce((sum, p) => {
        const meta = (p.metadata as any) || {};
        return sum + Number(meta.organizerReceives ?? p.amount ?? 0);
      }, 0);

      const weekGross = weekPayments.reduce((sum, p) => {
        const meta = (p.metadata as any) || {};
        return sum + Number(meta.baseAmount ?? p.amount ?? 0);
      }, 0);

      weeklyTrends.push({
        date: label,
        revenue: Math.round(weekRevenue * 100) / 100,
        orders: weekPayments.length,
        gross: Math.round(weekGross * 100) / 100,
      });
    }

    // C. Monthly (past 6 months)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyTrends: Array<{ date: string; revenue: number; orders: number; gross: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const targetYear = d.getFullYear();
      const targetMonth = d.getMonth();
      const monthName = months[targetMonth];

      const monthPayments = orgPayments.filter((p) => {
        const pDate = new Date(p.verifiedAt || p.createdAt);
        return pDate.getFullYear() === targetYear && pDate.getMonth() === targetMonth;
      });

      const monthRevenue = monthPayments.reduce((sum, p) => {
        const meta = (p.metadata as any) || {};
        return sum + Number(meta.organizerReceives ?? meta.baseAmount ?? p.amount ?? 0);
      }, 0);

      const monthGross = monthPayments.reduce((sum, p) => {
        const meta = (p.metadata as any) || {};
        return sum + Number(meta.baseAmount ?? p.amount ?? 0);
      }, 0);

      monthlyTrends.push({
        date: monthName || "",
        revenue: Math.round(monthRevenue * 100) / 100,
        orders: monthPayments.length,
        gross: Math.round(monthGross * 100) / 100,
      });
    }

    return {
      organizations,
      activeOrganizationId: activeOrgId,
      profileStats,
      stats,
      ongoingEvents: ongoingEventsList,
      recentOrders,
      revenueData: monthlyTrends.map((m) => ({ month: m.date, revenue: m.revenue })),
      revenueTrends: {
        daily: dailyTrends,
        weekly: weeklyTrends,
        monthly: monthlyTrends,
      },
    };
  } catch (error) {
    console.error("getDashboardOverview DAL error:", error);
    return null;
  }
}
