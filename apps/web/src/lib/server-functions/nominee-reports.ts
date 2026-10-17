"use server";

import { prisma } from "@repo/db";
import { requirePlatformAdmin } from "@/lib/admin/admin-auth";
import { sendNomineeReportWhatsAppNotification } from "@/lib/services/whatsapp";
import { sendNomineeReportSms } from "@/lib/services/sms";
import { revalidatePath } from "next/cache";

export type ReportInterval = "every_6_hours" | "every_12_hours" | "daily" | "weekly";
export type ReportVoteAudience = "all" | "with_votes" | "without_votes";

export interface NomineeReportStats {
	totalNominees: number;
	successCount: number;
	failureCount: number;
	timestamp: string;
	triggeredBy?: string;
	eventIds?: string[];
}

export interface NomineeReportSettings {
	enabled: boolean;
	interval: ReportInterval;
	preferredHourUtc: number; // 0 - 23
	preferredDayOfWeek: number; // 0 = Sun, 1 = Mon ... 6 = Sat
	voteAudience: ReportVoteAudience;
	onlyWithVotes: boolean;
	defaultChannel: "whatsapp" | "sms" | "both";
	lastRunAt: string | null;
	lastRunStats: NomineeReportStats | null;
}

export interface ActiveEventSummary {
	id: string;
	title: string;
	slug: string;
	organizationName: string;
	nomineeCount: number;
	nominees: Array<{
		id: string;
		name: string;
		phone: string;
		votesCount: number;
	}>;
	messagingConfig?: {
		reportEnabled: boolean;
		reportChannel: string;
		ticketConfirmChannel: string;
		voteReceiptChannel: string;
	} | null;
}

const SETTING_KEY = "nominee_whatsapp_reports";

const DEFAULT_NOMINEE_REPORT_SETTINGS: NomineeReportSettings = {
	enabled: false,
	interval: "daily",
	preferredHourUtc: 9, // 9:00 AM UTC
	preferredDayOfWeek: 1, // Monday
	voteAudience: "all",
	onlyWithVotes: false,
	defaultChannel: "whatsapp",
	lastRunAt: null,
	lastRunStats: null,
};

/**
 * Fetch current nominee report settings from PlatformSetting
 */
export async function getNomineeReportSettings(): Promise<NomineeReportSettings> {
	try {
		const row = await prisma.platformSetting.findUnique({
			where: { key: SETTING_KEY },
		});

		if (!row || !row.value) {
			return DEFAULT_NOMINEE_REPORT_SETTINGS;
		}

		const val = row.value as any;
		return {
			enabled: typeof val.enabled === "boolean" ? val.enabled : DEFAULT_NOMINEE_REPORT_SETTINGS.enabled,
			interval: val.interval || DEFAULT_NOMINEE_REPORT_SETTINGS.interval,
			preferredHourUtc: typeof val.preferredHourUtc === "number" ? val.preferredHourUtc : DEFAULT_NOMINEE_REPORT_SETTINGS.preferredHourUtc,
			preferredDayOfWeek: typeof val.preferredDayOfWeek === "number" ? val.preferredDayOfWeek : DEFAULT_NOMINEE_REPORT_SETTINGS.preferredDayOfWeek,
			voteAudience:
				val.voteAudience === "with_votes" || val.voteAudience === "without_votes"
					? val.voteAudience
					: val.onlyWithVotes === true
						? "with_votes"
						: "all",
			onlyWithVotes: typeof val.onlyWithVotes === "boolean" ? val.onlyWithVotes : DEFAULT_NOMINEE_REPORT_SETTINGS.onlyWithVotes,
			defaultChannel: val.defaultChannel || DEFAULT_NOMINEE_REPORT_SETTINGS.defaultChannel,
			lastRunAt: val.lastRunAt || null,
			lastRunStats: val.lastRunStats || null,
		};
	} catch (error) {
		console.error("[NomineeReports] Failed to fetch settings:", error);
		return DEFAULT_NOMINEE_REPORT_SETTINGS;
	}
}

/**
 * Update nominee report schedule settings (Super Admin only)
 */
export async function updateNomineeReportSettings(
	partial: Partial<NomineeReportSettings>
): Promise<{ success: boolean; error?: string; settings?: NomineeReportSettings }> {
	try {
		const admin = await requirePlatformAdmin();
		const current = await getNomineeReportSettings();

		const updated: NomineeReportSettings = {
			...current,
			...partial,
			lastRunAt: partial.lastRunAt !== undefined ? partial.lastRunAt : current.lastRunAt,
			lastRunStats: partial.lastRunStats !== undefined ? partial.lastRunStats : current.lastRunStats,
		};

		await prisma.platformSetting.upsert({
			where: { key: SETTING_KEY },
			create: {
				key: SETTING_KEY,
				value: updated as any,
				description: "Automated WhatsApp & SMS voting progress reports scheduled for active nominees",
				updatedBy: admin.email || admin.fullName || "Super Admin",
			},
			update: {
				value: updated as any,
				updatedBy: admin.email || admin.fullName || "Super Admin",
			},
		});

		revalidatePath("/super/reports");
		return { success: true, settings: updated };
	} catch (error: any) {
		console.error("[NomineeReports] Failed to update settings:", error);
		return { success: false, error: error.message || "Failed to save configuration" };
	}
}

/**
 * Get active voting events for report target selection in Super Admin
 */
export async function getActiveVotingEventsForReports(): Promise<ActiveEventSummary[]> {
	try {
		const events = await prisma.event.findMany({
			where: {
				status: { in: ["published", "ongoing"] },
				OR: [
					{ type: { in: ["voting", "hybrid"] } },
					{ votingCategories: { some: {} } },
				],
			},
			select: {
				id: true,
				title: true,
				slug: true,
				organization: { select: { name: true } },
				messagingConfig: {
					select: {
						reportEnabled: true,
						reportChannel: true,
						ticketConfirmChannel: true,
						voteReceiptChannel: true,
					},
				},
				_count: {
					select: {
						votingOptions: {
							where: {
								status: "approved",
								phone: { not: null },
							},
						},
					},
				},
				votingCategories: {
					select: {
						votingOptions: {
							where: {
								status: "approved",
								phone: { not: null },
							},
							select: {
								id: true,
								optionText: true,
								nomineeCode: true,
								phone: true,
								votesCount: true,
							},
						},
					},
				},
				votingOptions: {
					where: {
						status: "approved",
						phone: { not: null },
						categoryId: null,
					},
					select: {
						id: true,
						optionText: true,
						nomineeCode: true,
						phone: true,
						votesCount: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});

		return events.map((ev) => {
			const nominees = [
				...ev.votingCategories.flatMap((category) => category.votingOptions),
				...ev.votingOptions,
			].map((nominee) => ({
				id: nominee.id,
				name: nominee.optionText,
				phone: nominee.phone ?? "",
				votesCount: nominee.votesCount,
			}));

			return {
				id: ev.id,
				title: ev.title,
				slug: ev.slug,
				organizationName: ev.organization?.name || "Organization",
				nomineeCount: nominees.length,
				nominees,
				messagingConfig: ev.messagingConfig,
			};
		});
	} catch (error) {
		console.error("[NomineeReports] Failed to get active events:", error);
		return [];
	}
}

/**
 * Broadcast live nominee reports to active nominees.
 * - Supports targeting specific selectedEventIds (or all active events if empty/undefined).
 * - Respects per-event EventMessagingConfig channel and preference (with fallback to platform setting).
 * - Can be called manually by Super Admin or automatically by cron.
 */
export async function dispatchNomineeReportsNow({
	force = false,
	triggeredBy = "manual",
	selectedEventIds,
	channelOverride,
	voteAudienceOverride,
	selectedNomineeIds,
}: {
	force?: boolean;
	triggeredBy?: string;
	selectedEventIds?: string[];
	channelOverride?: "whatsapp" | "sms" | "both" | "event_default";
	voteAudienceOverride?: ReportVoteAudience;
	selectedNomineeIds?: string[];
} = {}): Promise<{
	success: boolean;
	totalNominees: number;
	successCount: number;
	failureCount: number;
	error?: string;
	skipped?: boolean;
	reason?: string;
}> {
	try {
		const settings = await getNomineeReportSettings();

		const whereClause: any = {
			status: { in: ["published", "ongoing"] },
		};

		if (selectedEventIds && selectedEventIds.length > 0) {
			whereClause.id = { in: selectedEventIds };
		}

		// Query active events with their messagingConfig
		const activeEvents = await prisma.event.findMany({
			where: whereClause,
			select: {
				id: true,
				title: true,
				slug: true,
				bannerImage: true,
				flierImage: true,
				organization: {
					select: {
						slug: true,
					},
				},
				messagingConfig: true,
				votingCategories: {
					select: {
						id: true,
						name: true,
						showTotalVotesPublicly: true,
						templateConfig: true,
						votingOptions: {
							where: {
								status: "approved",
								phone: { not: null },
							},
							select: {
								id: true,
								optionText: true,
								nomineeCode: true,
								phone: true,
								votesCount: true,
							},
						},
					},
				},
				votingOptions: {
					where: {
						status: "approved",
						phone: { not: null },
						categoryId: null,
					},
					select: {
						id: true,
						optionText: true,
						nomineeCode: true,
						phone: true,
						votesCount: true,
					},
				},
			},
		});

		let successCount = 0;
		let failureCount = 0;

		interface NomineeTask {
			phone: string;
			nomineeName: string;
			eventTitle: string;
			categoryName: string;
			votesCount: number;
			voteDisplayType: "count" | "percentage";
			votePercentage?: number;
			rank: number | string;
			showRank: boolean;
			categoryUrl: string;
			categoryPath: string;
			eventSlug: string;
			singleCategoryEvent: boolean;
			categoryId?: string;
			orgSlug: string;
			bannerImageUrl?: string;
			channel: string;
			eventId: string;
		}

		const dispatchTasks: NomineeTask[] = [];

		for (const ev of activeEvents) {
			const config = ev.messagingConfig;

			// If not forced and event has config with report disabled, skip this event
			if (!force) {
				if (config && !config.reportEnabled) continue;
				if (!config && !settings.enabled) continue;
			}

			const channel =
				channelOverride && channelOverride !== "event_default"
					? channelOverride
					: config?.reportChannel || settings.defaultChannel || "whatsapp";
			if (channel === "none") continue;

			const voteAudience: ReportVoteAudience =
				voteAudienceOverride ||
				(config
					? config.reportOnlyWithVotes
						? "with_votes"
						: "all"
					: settings.voteAudience);
			const selectedIds = selectedNomineeIds ? new Set(selectedNomineeIds) : null;
			const overrideShowRank = config?.reportShowRank ?? true;
			const orgSlug = ev.organization?.slug || "org";
			const bannerImageUrl = ev.bannerImage || ev.flierImage || undefined;

			// 1. Process categorized options
			for (const cat of ev.votingCategories) {
				const showRank = overrideShowRank && (cat.showTotalVotesPublicly ?? true);
				const voteDisplayType =
					cat.templateConfig &&
					typeof cat.templateConfig === "object" &&
					"resultDisplayType" in cat.templateConfig &&
					cat.templateConfig.resultDisplayType === "count"
						? "count"
						: "percentage";
				const totalCategoryVotes = cat.votingOptions.reduce(
					(total, option) => total + option.votesCount,
					0,
				);
				const categoryPath = `${orgSlug}/event/${ev.slug}/category/${cat.id}`;
				const categoryBaseUrl = `https://fextiva.com/${categoryPath}`;

				const sortedOptions = [...cat.votingOptions].sort((a, b) => b.votesCount - a.votesCount);

				sortedOptions.forEach((opt, idx) => {
					if (selectedIds && !selectedIds.has(opt.id)) return;
					if (
						(voteAudience === "with_votes" && opt.votesCount <= 0) ||
						(voteAudience === "without_votes" && opt.votesCount > 0)
					) return;
					if (!opt.phone || opt.phone.trim().length < 6) return;

					dispatchTasks.push({
						phone: opt.phone.trim(),
						nomineeName: opt.optionText,
						eventTitle: ev.title,
						categoryName: cat.name,
						votesCount: opt.votesCount,
						voteDisplayType,
						votePercentage:
							totalCategoryVotes > 0
								? Math.round((opt.votesCount / totalCategoryVotes) * 100)
								: 0,
						rank: showRank ? idx + 1 : "Confidential",
						showRank,
						categoryUrl: opt.nomineeCode
							? `${categoryBaseUrl}?nominee=${encodeURIComponent(opt.nomineeCode)}#${encodeURIComponent(opt.nomineeCode)}`
							: categoryBaseUrl,
						categoryPath,
						eventSlug: ev.slug,
						singleCategoryEvent: ev.votingCategories.length === 1,
						categoryId: cat.id,
						orgSlug,
						bannerImageUrl,
						channel,
						eventId: ev.id,
					});
				});
			}

			// 2. Process uncategorized options
			if (ev.votingOptions.length > 0) {
				const eventPath = `${orgSlug}/event/${ev.slug}`;
				const eventUrl = `https://fextiva.com/${eventPath}`;

				const sortedUncategorized = [...ev.votingOptions].sort((a, b) => b.votesCount - a.votesCount);

				sortedUncategorized.forEach((opt, idx) => {
					if (selectedIds && !selectedIds.has(opt.id)) return;
					if (
						(voteAudience === "with_votes" && opt.votesCount <= 0) ||
						(voteAudience === "without_votes" && opt.votesCount > 0)
					) return;
					if (!opt.phone || opt.phone.trim().length < 6) return;

					dispatchTasks.push({
						phone: opt.phone.trim(),
						nomineeName: opt.optionText,
						eventTitle: ev.title,
						categoryName: "Official Selection",
						votesCount: opt.votesCount,
						voteDisplayType: "count",
						rank: idx + 1,
						showRank: true,
						categoryUrl: opt.nomineeCode
							? `${eventUrl}?nominee=${encodeURIComponent(opt.nomineeCode)}#${encodeURIComponent(opt.nomineeCode)}`
							: eventUrl,
						categoryPath: eventPath,
						eventSlug: ev.slug,
						singleCategoryEvent: false,
						orgSlug,
						bannerImageUrl,
						channel,
						eventId: ev.id,
					});
				});
			}
		}

		const totalEligible = dispatchTasks.length;

		if (totalEligible === 0) {
			return {
				success: true,
				totalNominees: 0,
				successCount: 0,
				failureCount: 0,
				reason: "No eligible nominees with phone numbers found for the selected events.",
			};
		}

		// Dispatch with safe staggering
		for (const task of dispatchTasks) {
			let sent = false;

			// If channel requires WhatsApp
			if (task.channel === "whatsapp" || task.channel === "both" || task.channel === "whatsapp_sms") {
				try {
					const res = await sendNomineeReportWhatsAppNotification({
						phone: task.phone,
						nomineeName: task.nomineeName,
						eventTitle: task.eventTitle,
						categoryName: task.categoryName,
						votesCount: task.votesCount,
						rank: task.rank,
						showRank: task.showRank,
						leaderboardUrl: task.categoryUrl,
						categoryUrl: task.categoryUrl,
						categoryPath: task.categoryPath,
						eventSlug: task.eventSlug,
						categoryId: task.categoryId,
						orgSlug: task.orgSlug,
						bannerImageUrl: task.bannerImageUrl,
					});
					sent = res.success;
				} catch (err) {
					console.error(`[NomineeReports] WA exception for ${task.nomineeName}:`, err);
				}
			}

			// If channel requires SMS, or fallback when WA failed
			if (task.channel === "sms" || ((task.channel === "both" || task.channel === "whatsapp_sms") && !sent)) {
				try {
					const smsRes = await sendNomineeReportSms({
						phone: task.phone,
						nomineeName: task.nomineeName,
						eventTitle: task.eventTitle,
						categoryName: task.categoryName,
						votesCount: task.votesCount,
						rank: task.rank,
						showRank: task.showRank,
						categoryUrl: task.categoryUrl,
						singleCategoryEvent: task.singleCategoryEvent,
						voteDisplayType: task.voteDisplayType,
						votePercentage: task.votePercentage,
						eventId: task.eventId,
					});
					sent = smsRes.success;
				} catch (err) {
					console.error(`[NomineeReports] SMS exception for ${task.nomineeName}:`, err);
				}
			}

			if (sent) {
				successCount++;
			} else {
				failureCount++;
			}

			// Stagger delay
			await new Promise((resolve) => setTimeout(resolve, 80));
		}

		const stats: NomineeReportStats = {
			totalNominees: totalEligible,
			successCount,
			failureCount,
			timestamp: new Date().toISOString(),
			triggeredBy,
			eventIds: selectedEventIds,
		};

		// Update global settings stats
		await prisma.platformSetting.upsert({
			where: { key: SETTING_KEY },
			create: {
				key: SETTING_KEY,
				value: { ...settings, lastRunAt: stats.timestamp, lastRunStats: stats } as any,
				description: "Automated WhatsApp & SMS voting progress reports scheduled for active nominees",
			},
			update: {
				value: { ...settings, lastRunAt: stats.timestamp, lastRunStats: stats } as any,
			},
		});

		// Update per-event messaging config lastRunAt & stats for targeted events
		const touchedEventIds = Array.from(new Set(dispatchTasks.map((t) => t.eventId)));
		for (const evId of touchedEventIds) {
			const evTasks = dispatchTasks.filter((t) => t.eventId === evId);
			const evSuccess = evTasks.filter((_, idx) => idx < successCount).length;
			await prisma.eventMessagingConfig.updateMany({
				where: { eventId: evId },
				data: {
					reportLastRunAt: new Date(),
					reportLastRunStats: {
						totalNominees: evTasks.length,
						successCount: evSuccess,
						timestamp: stats.timestamp,
					},
				},
			}).catch(() => {});
		}

		revalidatePath("/super/reports");

		return {
			success: true,
			totalNominees: totalEligible,
			successCount,
			failureCount,
		};
	} catch (error: any) {
		console.error("[NomineeReports] Dispatch error:", error);
		return {
			success: false,
			totalNominees: 0,
			successCount: 0,
			failureCount: 0,
			error: error.message || "Failed to dispatch nominee reports",
		};
	}
}

/**
 * Trigger nominee reports for a single event specifically
 */
export async function dispatchEventNomineeReportsNow(
	eventId: string,
	force = true
): Promise<{
	success: boolean;
	totalNominees: number;
	successCount: number;
	failureCount: number;
	error?: string;
}> {
	return dispatchNomineeReportsNow({
		force,
		triggeredBy: `event:${eventId}`,
		selectedEventIds: [eventId],
	});
}
