import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/admin/admin-auth";
import { getAdminOrganizersList } from "@/lib/dal/admin";
import { getSafeUser } from "@/lib/dal/auth";
import { getAdminNotificationHistory } from "@/lib/server-functions/admin-organizer-notifications";
import { OrganizerNotificationCenter } from "@/components/super-admin/OrganizerNotificationCenter";
import { serializeJsonSafe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Organizer Notifications & Broadcasts - Super Admin Platform",
	description: "Send personalized, rich-text email and SMS communications to organizers with dynamic merge prefixes.",
};

export default async function SuperAdminNotificationsPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const state = await requirePlatformAdmin();
	const params = await searchParams;
	const preselectedOrgId = typeof params.orgId === "string" ? params.orgId : null;

	const [organizers, user, history] = await Promise.all([
		getAdminOrganizersList(),
		getSafeUser(state.userId),
		getAdminNotificationHistory(),
	]);

	const adminUser = {
		name: user?.fullName || state.fullName || "Super Admin",
		email: user?.email || state.email || "admin@fextiva.com",
		phone: user?.phone || "",
		avatar: user?.avatarUrl || "",
	};

	return (
		<Suspense
			fallback={
				<div className="flex justify-center py-24">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			}
		>
			<OrganizerNotificationCenter
				organizers={serializeJsonSafe(organizers)}
				adminUser={serializeJsonSafe(adminUser)}
				initialHistory={serializeJsonSafe(history)}
				preselectedOrgId={preselectedOrgId}
			/>
		</Suspense>
	);
}
