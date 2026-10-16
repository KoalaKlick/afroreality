"use server";

import { prisma } from "@repo/db";
import { revalidatePath } from "next/cache";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConfirmChannel = "whatsapp" | "sms" | "whatsapp_sms" | "none";
export type NominationChannel = "email" | "whatsapp" | "sms" | "email_whatsapp" | "none";
export type ReportChannel = "whatsapp" | "sms" | "whatsapp_sms";
export type ReportInterval = "every_6_hours" | "every_12_hours" | "daily" | "weekly";

export interface EventMessagingConfigData {
	eventId: string;
	ticketConfirmChannel: ConfirmChannel;
	voteReceiptChannel: ConfirmChannel;
	nominationChannel: NominationChannel;
	reportEnabled: boolean;
	reportChannel: ReportChannel;
	reportInterval: ReportInterval;
	reportPreferredHourUtc: number;
	reportPreferredDay: number;
	reportOnlyWithVotes: boolean;
	reportShowRank: boolean;
	reportLastRunAt: string | null;
	reportLastRunStats: any | null;
}

export interface EventReportRunStats {
	totalNominees: number;
	successCount: number;
	failureCount: number;
	timestamp: string;
	triggeredBy?: string;
	channel?: string;
}

const DEFAULT_CONFIG: Omit<EventMessagingConfigData, "eventId"> = {
	ticketConfirmChannel: "whatsapp",
	voteReceiptChannel: "whatsapp",
	nominationChannel: "email",
	reportEnabled: false,
	reportChannel: "whatsapp",
	reportInterval: "daily",
	reportPreferredHourUtc: 9,
	reportPreferredDay: 1,
	reportOnlyWithVotes: false,
	reportShowRank: true,
	reportLastRunAt: null,
	reportLastRunStats: null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rowToData(row: any): EventMessagingConfigData {
	return {
		eventId: row.eventId,
		ticketConfirmChannel: row.ticketConfirmChannel as ConfirmChannel,
		voteReceiptChannel: row.voteReceiptChannel as ConfirmChannel,
		nominationChannel: row.nominationChannel as NominationChannel,
		reportEnabled: row.reportEnabled,
		reportChannel: row.reportChannel as ReportChannel,
		reportInterval: row.reportInterval as ReportInterval,
		reportPreferredHourUtc: row.reportPreferredHourUtc,
		reportPreferredDay: row.reportPreferredDay,
		reportOnlyWithVotes: row.reportOnlyWithVotes,
		reportShowRank: row.reportShowRank,
		reportLastRunAt: row.reportLastRunAt ? row.reportLastRunAt.toISOString() : null,
		reportLastRunStats: row.reportLastRunStats ?? null,
	};
}

// ─── Server Actions ───────────────────────────────────────────────────────────

/**
 * Fetch the messaging config for an event.
 * Returns the default config (with eventId set) if none exists yet.
 */
export async function getEventMessagingConfig(
	eventId: string,
): Promise<EventMessagingConfigData> {
	try {
		const row = await prisma.eventMessagingConfig.findUnique({ where: { eventId } });
		if (!row) return { ...DEFAULT_CONFIG, eventId };
		return rowToData(row);
	} catch (error) {
		console.error("[EventMessaging] getEventMessagingConfig error:", error);
		return { ...DEFAULT_CONFIG, eventId };
	}
}

/**
 * Upsert the messaging config for an event.
 * Safe to call from both org-admin and super-admin contexts.
 */
export async function saveEventMessagingConfig(
	data: Partial<EventMessagingConfigData> & { eventId: string },
): Promise<{ success: boolean; config?: EventMessagingConfigData; error?: string }> {
	try {
		const current = await getEventMessagingConfig(data.eventId);
		const merged = { ...current, ...data };

		const row = await prisma.eventMessagingConfig.upsert({
			where: { eventId: data.eventId },
			create: {
				eventId: merged.eventId,
				ticketConfirmChannel: merged.ticketConfirmChannel,
				voteReceiptChannel: merged.voteReceiptChannel,
				nominationChannel: merged.nominationChannel,
				reportEnabled: merged.reportEnabled,
				reportChannel: merged.reportChannel,
				reportInterval: merged.reportInterval,
				reportPreferredHourUtc: merged.reportPreferredHourUtc,
				reportPreferredDay: merged.reportPreferredDay,
				reportOnlyWithVotes: merged.reportOnlyWithVotes,
				reportShowRank: merged.reportShowRank,
			},
			update: {
				ticketConfirmChannel: merged.ticketConfirmChannel,
				voteReceiptChannel: merged.voteReceiptChannel,
				nominationChannel: merged.nominationChannel,
				reportEnabled: merged.reportEnabled,
				reportChannel: merged.reportChannel,
				reportInterval: merged.reportInterval,
				reportPreferredHourUtc: merged.reportPreferredHourUtc,
				reportPreferredDay: merged.reportPreferredDay,
				reportOnlyWithVotes: merged.reportOnlyWithVotes,
				reportShowRank: merged.reportShowRank,
			},
		});

		revalidatePath("/super/reports");
		return { success: true, config: rowToData(row) };
	} catch (error: any) {
		console.error("[EventMessaging] saveEventMessagingConfig error:", error);
		return { success: false, error: error?.message || "Failed to save messaging config" };
	}
}

/**
 * Fetch messaging configs for all events (super admin use).
 * Returns a list enriched with event title and org name.
 */
export async function getAllEventMessagingConfigs(): Promise<
	Array<EventMessagingConfigData & { eventTitle: string; orgName: string; orgSlug: string }>
> {
	try {
		const events = await prisma.event.findMany({
			where: { status: { in: ["published", "ongoing"] } },
			select: {
				id: true,
				title: true,
				organization: { select: { name: true, slug: true } },
				messagingConfig: true,
			},
			orderBy: { createdAt: "desc" },
		});

		return events.map((ev) => {
			const cfg = ev.messagingConfig
				? rowToData(ev.messagingConfig)
				: { ...DEFAULT_CONFIG, eventId: ev.id };
			return {
				...cfg,
				eventTitle: ev.title,
				orgName: ev.organization?.name || "Unknown Org",
				orgSlug: ev.organization?.slug || "",
			};
		});
	} catch (error) {
		console.error("[EventMessaging] getAllEventMessagingConfigs error:", error);
		return [];
	}
}

/**
 * Internal: update the report run stats after dispatching.
 * Not a server action — called internally from report dispatch.
 */
export async function updateEventReportRunStats(
	eventId: string,
	stats: EventReportRunStats,
): Promise<void> {
	try {
		await prisma.eventMessagingConfig.upsert({
			where: { eventId },
			create: {
				eventId,
				...DEFAULT_CONFIG,
				reportLastRunAt: new Date(stats.timestamp),
				reportLastRunStats: stats as any,
			},
			update: {
				reportLastRunAt: new Date(stats.timestamp),
				reportLastRunStats: stats as any,
			},
		});
	} catch (error) {
		console.error("[EventMessaging] updateEventReportRunStats error:", error);
	}
}
