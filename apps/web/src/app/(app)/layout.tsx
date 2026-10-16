import React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/header/AppHeader";
import { requireAppAccess } from "@/lib/auth-guards";
import { getSafeUser } from "@/lib/dal/auth";
import { getPendingInvitationsForEmail } from "@/lib/server-functions/organization-join";
import { getPlatformNotificationsForUser } from "@/lib/server-functions/notifications";
import { prisma } from "@repo/db";
import { cookies } from "next/headers";
import { serializeJsonSafe } from "@/lib/utils";
import { ACTIVE_ORG_COOKIE_NAME } from "@/lib/constants/config";

import { OrganizationProvider } from "@/lib/organization-context";
import { getUserOrganizations } from "@/lib/dal/organization";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
	const state = await requireAppAccess();
	const user = await getSafeUser(state.userId);

	// Fetch organizations user belongs to or created
	const userOrgs = await getUserOrganizations(state.userId);
	const organizations = userOrgs.map((o) => ({
		id: o.id,
		name: o.name,
		slug: o.slug,
		logoUrl: o.logoUrl,
		role: o.role,
	}));

	const cookieStore = await cookies();
	const activeOrgCookie = cookieStore.get(ACTIVE_ORG_COOKIE_NAME)?.value;
	const activeOrganizationId =
		organizations.find((o) => o.id === activeOrgCookie)?.id ??
		organizations[0]?.id ??
		null;

	const [pendingInvitations, platformAlerts] = await Promise.all([
		getPendingInvitationsForEmail().catch(() => []),
		getPlatformNotificationsForUser().catch(() => []),
	]);

	const sidebarUser = {
		name: user?.fullName || state.fullName || "User",
		email: user?.email || state.email,
		avatar: user?.avatarUrl || "",
		username: user?.username || state.username || "",
		momoNumber: user?.phone || "",
	};

	return (
		<OrganizationProvider
			organizations={serializeJsonSafe(organizations)}
			initialActiveOrgId={activeOrganizationId}
		>
			<SidebarProvider>
				<AppSidebar
					user={serializeJsonSafe(sidebarUser)}
					organizations={serializeJsonSafe(organizations)}
					activeOrganizationId={activeOrganizationId}
					pendingInvitations={serializeJsonSafe(pendingInvitations)}
				/>
				<SidebarInset className="font-sans min-h-svh flex flex-1 flex-col">
					{/* The Header */}
					<AppHeader
						pendingInvitations={serializeJsonSafe(pendingInvitations)}
						alerts={serializeJsonSafe(platformAlerts)}
					/>

					{/* Page Main Content */}
					<div className="relative flex-1 flex flex-col min-w-0 p-2 sm:p-4 md:p-6 lg:p-8">
						<div className="flex flex-1 flex-col gap-6">
							{children}
						</div>
					</div>
				</SidebarInset>
			</SidebarProvider>
		</OrganizationProvider>
	);
}

