import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { getPlatformAdminUsers } from "@/lib/server-functions/admin";
import { SuperAdminsContent } from "@/components/super-admin/SuperAdminsContent";
import { serializeJsonSafe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Platform Admin Users - Super Admin",
	description: "Manage and authorize platform administrators and delegates",
};

export default async function SuperAdminsPage() {
	const data = await getPlatformAdminUsers();

	return (
		<Suspense
			fallback={
				<div className="flex justify-center py-24">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			}
		>
			<SuperAdminsContent
				rootAdmin={data.rootAdmin}
				admins={serializeJsonSafe(data.admins)}
			/>
		</Suspense>
	);
}
