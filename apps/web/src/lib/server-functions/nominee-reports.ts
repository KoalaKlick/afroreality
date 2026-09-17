"use server";

import { prisma } from "@repo/db";
import { requirePlatformAdmin } from "@/lib/admin/admin-auth";
import { sendNomineeReportWhatsAppNotification } from "@/lib/services/whatsapp";
import { revalidatePath } from "next/cache";

export type ReportInterval = "every_6_hours" | "every_12_hours" | "daily" | "weekly";

export interface NomineeReportStats {
	totalNominees: number;
	successCount: number;
	failureCount: number;
	timestamp: string;
	triggeredBy?: string;
}

export interface NomineeReportSettings {
	enabled: boolean;
	interval: ReportInterval;
	preferredHourUtc: number; // 0 - 23
	preferredDayOfWeek: number; // 0 = Sun, 1 = Mon ... 6 = Sat
	onlyWithVotes: boolean;
	lastRunAt: string | null;
	lastRunStats: NomineeReportStats | null;
}

const SETTING_KEY = "nominee_whatsapp_reports";

export const DEFAULT_NOMINEE_REPORT_SETTINGS: NomineeReportSettings = {
	enabled: false,
	interval: "daily",
	preferredHourUtc: 9, // 9:00 AM UTC
	preferredDayOfWeek: 1, // Monday
	onlyWithVotes: false,
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
			onlyWithVotes: typeof val.onlyWithVotes === "boolean" ? val.onlyWithVotes : DEFAULT_NOMINEE_REPORT_SETTINGS.onlyWithVotes,
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
			// Preserve run stats unless explicitly passed
			lastRunAt: partial.lastRunAt !== undefined ? partial.lastRunAt : current.lastRunAt,
			lastRunStats: partial.lastRunStats !== undefined ? partial.lastRunStats : current.lastRunStats,
		};

		await prisma.platformSetting.upsert({
			where: { key: SETTING_KEY },
			create: {
				key: SETTING_KEY,
				value: updated as any,
				description: "Automated WhatsApp voting progress reports scheduled for active nominees",
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
 * Broadcast live nominee reports to all active nominees
 * Can be called manually by a Super Admin or automatically by cron
 */
export async function dispatchNomineeReportsNow({
	force = false,
	triggeredBy = "manual",
}: {
	force?: boolean;
	triggeredBy?: string;
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

		if (!force && !settings.enabled) {
			return {
				success: false,
				skipped: true,
				reason: "Automated nominee reports are currently disabled in platform settings.",
				totalNominees: 0,
				successCount: 0,
				failureCount: 0,
			};
		}

		// Query all published or ongoing events that support voting
		const activeEvents = await prisma.event.findMany({
			where: {
				status: { in: ["published", "ongoing"] },
			},
			select: {
				id: true,
				title: true,
				slug: true,
				votingCategories: {
					select: {
						id: true,
						name: true,
						votingOptions: {
							where: {
								status: "approved",
								phone: { not: null },
							},
							select: {
								id: true,
								optionText: true,
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
						phone: true,
						votesCount: true,
					},
				},
			},
		});

		let totalEligible = 0;
		let successCount = 0;
		let failureCount = 0;

		const dispatchTasks: Array<{
			phone: string;
			nomineeName: string;
			eventTitle: string;
			categoryName: string;
			votesCount: number;
			rank: number;
			leaderboardUrl: string;
		}> = [];

		for (const ev of activeEvents) {
			const leaderboardUrl = `https://fextiva.com/e/${ev.slug}`;

			// 1. Process categorized options
			for (const cat of ev.votingCategories) {
				// Rank options in descending order of votesCount
				const sortedOptions = [...cat.votingOptions].sort(
					(a, b) => b.votesCount - a.votesCount
				);

				sortedOptions.forEach((opt, idx) => {
					if (settings.onlyWithVotes && opt.votesCount <= 0) return;
					if (!opt.phone || opt.phone.trim().length < 6) return;

					dispatchTasks.push({
						phone: opt.phone.trim(),
						nomineeName: opt.optionText,
						eventTitle: ev.title,
						categoryName: cat.name,
						votesCount: opt.votesCount,
						rank: idx + 1,
						leaderboardUrl,
					});
				});
			}

			// 2. Process uncategorized options (if any)
			if (ev.votingOptions.length > 0) {
				const sortedUncategorized = [...ev.votingOptions].sort(
					(a, b) => b.votesCount - a.votesCount
				);

				sortedUncategorized.forEach((opt, idx) => {
					if (settings.onlyWithVotes && opt.votesCount <= 0) return;
					if (!opt.phone || opt.phone.trim().length < 6) return;

					dispatchTasks.push({
						phone: opt.phone.trim(),
						nomineeName: opt.optionText,
						eventTitle: ev.title,
						categoryName: "Official Selection",
						votesCount: opt.votesCount,
						rank: idx + 1,
						leaderboardUrl,
					});
				});
			}
		}

		totalEligible = dispatchTasks.length;

		if (totalEligible === 0) {
			const stats: NomineeReportStats = {
				totalNominees: 0,
				successCount: 0,
				failureCount: 0,
				timestamp: new Date().toISOString(),
				triggeredBy,
			};

			await prisma.platformSetting.upsert({
				where: { key: SETTING_KEY },
				create: {
					key: SETTING_KEY,
					value: { ...settings, lastRunAt: stats.timestamp, lastRunStats: stats } as any,
					description: "Automated WhatsApp voting progress reports scheduled for active nominees",
				},
				update: {
					value: { ...settings, lastRunAt: stats.timestamp, lastRunStats: stats } as any,
				},
			});

			return {
				success: true,
				totalNominees: 0,
				successCount: 0,
				failureCount: 0,
				reason: "No eligible nominees with phone numbers found across active events.",
			};
		}

		// Dispatch with safe staggering (100ms delay between messages)
		for (const task of dispatchTasks) {
			try {
				const res = await sendNomineeReportWhatsAppNotification({
					phone: task.phone,
					nomineeName: task.nomineeName,
					eventTitle: task.eventTitle,
					categoryName: task.categoryName,
					votesCount: task.votesCount,
					rank: task.rank,
					leaderboardUrl: task.leaderboardUrl,
				});

				if (res.success) {
					successCount++;
				} else {
					console.warn(`[NomineeReports] Failed to notify ${task.nomineeName} (${task.phone}):`, res.error);
					failureCount++;
				}
			} catch (err) {
				console.error(`[NomineeReports] Exception sending to ${task.nomineeName}:`, err);
				failureCount++;
			}

			// Stagger delay
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		const stats: NomineeReportStats = {
			totalNominees: totalEligible,
			successCount,
			failureCount,
			timestamp: new Date().toISOString(),
			triggeredBy,
		};

		// Save run status
		await prisma.platformSetting.upsert({
			where: { key: SETTING_KEY },
			create: {
				key: SETTING_KEY,
				value: { ...settings, lastRunAt: stats.timestamp, lastRunStats: stats } as any,
				description: "Automated WhatsApp voting progress reports scheduled for active nominees",
			},
			update: {
				value: { ...settings, lastRunAt: stats.timestamp, lastRunStats: stats } as any,
			},
		});

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
