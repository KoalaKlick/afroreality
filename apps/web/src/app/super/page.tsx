import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { getAdminOverviewData } from "@/lib/dal/admin";
import { AdminOverviewContent } from "@/components/admin/AdminOverviewContent";
import { serializeJsonSafe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Super Admin Platform Overview - Fextiva",
	description: "Comprehensive platform-level overview of organizers, events, and revenues",
};

export default async function SuperAdminOverviewPage() {
	const stats = await getAdminOverviewData();

	return (
		<Suspense
			fallback={
				<div className="flex justify-center py-24">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			}
		>
			<AdminOverviewContent stats={serializeJsonSafe(stats)} />
		</Suspense>
	);
}
