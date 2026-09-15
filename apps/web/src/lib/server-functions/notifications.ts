"use server";

import { prisma } from "@repo/db";
import { getSession } from "@/lib/session";

export interface PlatformNotificationAlert {
	id: string;
	type: "wallet_frozen" | "wallet_unfrozen" | "system_notice";
	severity: "critical" | "warning" | "info" | "success";
	title: string;
	message: string;
	reason?: string | null;
	organization?: {
		id: string;
		name: string;
		logoUrl?: string | null;
		slug?: string;
	} | null;
	createdAt: string;
	actionUrl?: string;
	isLocked?: boolean;
}

/**
 * Retrieves platform alerts and administrative notifications for the current authenticated user.
 * Specifically checks for frozen account/wallet states and admin audit logs.
 */
export async function getPlatformNotificationsForUser(): Promise<PlatformNotificationAlert[]> {
	try {
		const session = await getSession();
		if (!session?.userId) return [];

		// 1. Fetch user's organizations (as member or creator)
		const memberships = await prisma.teamMember.findMany({
			where: { userId: session.userId },
			select: { organizationId: true },
		});

		const createdOrgs = await prisma.organization.findMany({
			where: { createdBy: session.userId },
			select: { id: true },
		});

		const orgIds = Array.from(
			new Set([
				...memberships.map((m) => m.organizationId),
				...createdOrgs.map((o) => o.id),
			]),
		);

		if (orgIds.length === 0) return [];

		const alerts: PlatformNotificationAlert[] = [];

		// 2. Query active wallets for these organizations
		const wallets = await prisma.wallet.findMany({
			where: {
				organizationId: { in: orgIds },
			},
			include: {
				organization: {
					select: {
						id: true,
						name: true,
						slug: true,
						logoUrl: true,
					},
				},
			},
		});

		// 3. For any wallet that is currently locked, create an active notification
		for (const w of wallets) {
			if (w.isLocked && w.organization) {
				const reasonText = w.lockReason?.trim();
				alerts.push({
					id: `active-freeze-${w.id}`,
					type: "wallet_frozen",
					severity: "critical",
					title: `Wallet frozen (${w.organization.name})`,
					message:
						"Wallet payouts and outbound transfers for this organization have been paused by platform administration.",
					reason: reasonText || null,
					organization: {
						id: w.organization.id,
						name: w.organization.name,
						slug: w.organization.slug,
						logoUrl: w.organization.logoUrl,
					},
					createdAt: (w.updatedAt || new Date()).toISOString(),
					actionUrl: "/organization/wallet",
					isLocked: true,
				});
			}
		}

		// 4. Query recent administrative lock/unlock activity logs
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const recentLogs = await prisma.activityLog.findMany({
			where: {
				organizationId: { in: orgIds },
				action: { in: ["wallet.locked_by_super_admin", "wallet.unlocked_by_super_admin"] },
				createdAt: { gte: thirtyDaysAgo },
			},
			include: {
				organization: {
					select: {
						id: true,
						name: true,
						slug: true,
						logoUrl: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
			take: 10,
		});

		for (const log of recentLogs) {
			if (!log.organization) continue;

			// If it's an unlock event, show restoration notice
			if (log.action === "wallet.unlocked_by_super_admin") {
				alerts.push({
					id: `unlocked-notice-${log.id}`,
					type: "wallet_unfrozen",
					severity: "success",
					title: "Account Wallet Restrictions Lifted",
					message: `Platform restrictions on ${log.organization.name}'s wallet have been removed by Fextiva administration. Outbound withdrawals and normal wallet activities are fully restored.`,
					organization: {
						id: log.organization.id,
						name: log.organization.name,
						slug: log.organization.slug,
						logoUrl: log.organization.logoUrl,
					},
					createdAt: log.createdAt.toISOString(),
					actionUrl: "/organization/wallet",
					isLocked: false,
				});
			}
		}

		// Sort notifications by date descending
		return alerts.sort(
			(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
		);
	} catch (error) {
		console.error("[GET_PLATFORM_NOTIFICATIONS_ERROR]", error);
		return [];
	}
}
