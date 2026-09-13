import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { getAdminOrganizersList } from "@/lib/dal/admin";
import { AdminOrganizersContent } from "@/components/admin/AdminOrganizersContent";
import { serializeJsonSafe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Organizers & Members - Super Admin Platform",
	description: "Oversight of organizers, their members, hosted events, and wallet configurations",
};

export default async function SuperAdminOrganizersPage() {
	const organizers = await getAdminOrganizersList();

	return (
		<Suspense
			fallback={
				<div className="flex justify-center py-24">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			}
		>
			<AdminOrganizersContent organizers={serializeJsonSafe(organizers)} />
		</Suspense>
	);
}
