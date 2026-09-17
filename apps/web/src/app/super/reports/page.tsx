import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { prisma } from "@repo/db";
import { requirePlatformAdmin } from "@/lib/admin/admin-auth";
import { getNomineeReportSettings } from "@/lib/server-functions/nominee-reports";
import { getWhatsAppUsageOverview } from "@/lib/server-functions/whatsapp-usage";
import { NomineeReportsContent } from "@/components/super-admin/NomineeReportsContent";
import { serializeJsonSafe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "WhatsApp Reports & Usage - Super Admin Platform",
	description: "Configure automated WhatsApp voting reports, intervals, webhooks, and live transaction usage tracking.",
};

export default async function SuperAdminNomineeReportsPage() {
	await requirePlatformAdmin();

	// Load settings, live platform stats, and WhatsApp message logs/webhook status
	const [settings, activeEventsCount, eligibleNomineesCount, totalVotesCast, usageData] =
		await Promise.all([
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
			/>
		</Suspense>
	);
}
