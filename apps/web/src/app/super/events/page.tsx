import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { getAdminEventsList } from "@/lib/dal/admin";
import { AdminEventsContent } from "@/components/admin/AdminEventsContent";
import { serializeJsonSafe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Events Oversight - Super Admin Platform",
	description: "Platform-wide events oversight, timelines, amounts, and view-only audit inspection",
};

export default async function SuperAdminEventsPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const params = await searchParams;
	const status = typeof params?.status === "string" ? params.status : "all";

	const events = await getAdminEventsList();

	return (
		<Suspense
			fallback={
				<div className="flex justify-center py-24">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			}
		>
			<AdminEventsContent
				events={serializeJsonSafe(events)}
				initialStatus={status}
			/>
		</Suspense>
	);
}
