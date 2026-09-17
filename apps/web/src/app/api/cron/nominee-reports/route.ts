import { NextResponse } from "next/server";
import {
	getNomineeReportSettings,
	dispatchNomineeReportsNow,
} from "@/lib/server-functions/nominee-reports";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
	return handleCron(req);
}

export async function POST(req: Request) {
	return handleCron(req);
}

async function handleCron(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const force = searchParams.get("force") === "true";

		// Optional secret check if CRON_SECRET is configured
		const cronSecret = process.env.CRON_SECRET;
		if (cronSecret) {
			const authHeader = req.headers.get("authorization");
			const querySecret = searchParams.get("secret");
			const headerSecret = req.headers.get("x-cron-secret");

			const isAuthorized =
				authHeader === `Bearer ${cronSecret}` ||
				querySecret === cronSecret ||
				headerSecret === cronSecret;

			if (!isAuthorized) {
				return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
			}
		}

		const settings = await getNomineeReportSettings();

		if (!settings.enabled && !force) {
			return NextResponse.json({
				success: false,
				skipped: true,
				message: "Nominee reports are disabled in platform settings.",
			});
		}

		// Interval evaluation
		if (!force && settings.lastRunAt) {
			const lastRun = new Date(settings.lastRunAt).getTime();
			const now = Date.now();
			const hoursElapsed = (now - lastRun) / (1000 * 60 * 60);

			if (settings.interval === "every_6_hours" && hoursElapsed < 5.8) {
				return NextResponse.json({
					success: false,
					skipped: true,
					message: `Skipped: Interval is every 6 hours. ${hoursElapsed.toFixed(1)}h elapsed.`,
				});
			}

			if (settings.interval === "every_12_hours" && hoursElapsed < 11.8) {
				return NextResponse.json({
					success: false,
					skipped: true,
					message: `Skipped: Interval is every 12 hours. ${hoursElapsed.toFixed(1)}h elapsed.`,
				});
			}

			if (settings.interval === "daily") {
				if (hoursElapsed < 22) {
					return NextResponse.json({
						success: false,
						skipped: true,
						message: `Skipped: Daily report already sent ${hoursElapsed.toFixed(1)}h ago.`,
					});
				}
				const currentUtcHour = new Date().getUTCHours();
				if (Math.abs(currentUtcHour - settings.preferredHourUtc) > 1 && hoursElapsed < 26) {
					return NextResponse.json({
						success: false,
						skipped: true,
						message: `Skipped: Waiting for target UTC hour ${settings.preferredHourUtc}:00 (Current: ${currentUtcHour}:00 UTC).`,
					});
				}
			}

			if (settings.interval === "weekly") {
				if (hoursElapsed < 156) {
					// < 6.5 days
					return NextResponse.json({
						success: false,
						skipped: true,
						message: `Skipped: Weekly report sent ${hoursElapsed.toFixed(1)}h ago.`,
					});
				}
			}
		}

		const result = await dispatchNomineeReportsNow({
			force,
			triggeredBy: "cron_scheduler",
		});

		return NextResponse.json(result);
	} catch (error: any) {
		console.error("[Cron NomineeReports] Error:", error);
		return NextResponse.json(
			{ error: error.message || "Failed to process cron task" },
			{ status: 500 }
		);
	}
}
