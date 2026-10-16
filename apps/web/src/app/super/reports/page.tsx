import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { prisma } from "@repo/db";
import { requirePlatformAdmin } from "@/lib/admin/admin-auth";
import {
	getNomineeReportSettings,
	getActiveVotingEventsForReports,
} from "@/lib/server-functions/nominee-reports";
import { getWhatsAppUsageOverview } from "@/lib/server-functions/whatsapp-usage";
import { getSmsUsageOverview } from "@/lib/services/sms";
import { getAllEventMessagingConfigs } from "@/lib/server-functions/event-messaging-config";
import { getPhoneLoginOtpChannel } from "@/lib/server-functions/auth";
import { NomineeReportsContent } from "@/components/super-admin/NomineeReportsContent";
import { serializeJsonSafe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Messaging & Reports Hub - Super Admin Platform",
	description: "Configure multi-channel automated voting reports (WhatsApp & SMS), per-event routing, Arkesel SMS deliverability, and Meta WhatsApp tracking.",
};

export default async function SuperAdminNomineeReportsPage() {
	await requirePlatformAdmin();

	// Load platform-wide messaging data in parallel
	const [
		settings,
		activeEventsCount,
		eligibleNomineesCount,
		totalVotesCast,
		usageData,
		smsUsageData,
		activeEvents,
		allConfigs,
		phoneOtpChannel,
	] = await Promise.all([
		getNomineeReportSettings(),
		prisma.event.count({
			where: {
				status: { in: ["published", "ongoing"] },
			},
		}),
		prisma.votingOption.count({
			where: {
				status: "approved",
				phone: { not: null },
				event: {
					status: { in: ["published", "ongoing"] },
				},
			},
		}),
		prisma.vote.count().catch(() => 0),
		getWhatsAppUsageOverview().catch(() => undefined),
		getSmsUsageOverview().catch(() => undefined),
		getActiveVotingEventsForReports().catch(() => []),
		getAllEventMessagingConfigs().catch(() => []),
		getPhoneLoginOtpChannel().catch(() => "sms" as const),
	]);

	const summaryData = {
		activeEventsCount,
		eligibleNomineesCount,
		totalVotesCast,
	};

	return (
		<Suspense
			fallback={
				<div className="flex justify-center py-24">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			}
		>
			<NomineeReportsContent
				initialSettings={serializeJsonSafe(settings)}
				summaryData={serializeJsonSafe(summaryData)}
				usageData={serializeJsonSafe(usageData)}
				smsUsageData={serializeJsonSafe(smsUsageData)}
				activeEvents={serializeJsonSafe(activeEvents)}
				allConfigs={serializeJsonSafe(allConfigs)}
				initialOtpChannel={phoneOtpChannel}
			/>
		</Suspense>
	);
}
