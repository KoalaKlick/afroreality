import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { prisma } from "@repo/db";
import { requirePlatformAdmin } from "@/lib/admin/admin-auth";
import { getNomineeReportSettings } from "@/lib/server-functions/nominee-reports";
import { NomineeReportsContent } from "@/components/super-admin/NomineeReportsContent";
import { serializeJsonSafe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Nominee Reports Schedule - Super Admin Platform",
	description: "Configure automated WhatsApp voting reports and intervals sent to nominees across active events.",
};

export default async function SuperAdminNomineeReportsPage() {
	await requirePlatformAdmin();

	// Load settings and live platform stats
	const [settings, activeEventsCount, eligibleNomineesCount, totalVotesCast] =
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
			/>
		</Suspense>
	);
}
