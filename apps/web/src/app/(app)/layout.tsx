import React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/header/AppHeader";
import { requireAppAccess } from "@/lib/auth-guards";
import { getSafeUser } from "@/lib/dal/auth";
import { getPendingInvitationsForEmail } from "@/lib/server-functions/organization-join";
import { prisma } from "@repo/db";
import { serializeJsonSafe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
	const state = await requireAppAccess();
	const user = await getSafeUser(state.userId);

	// Fetch organizations user belongs to
	const memberships = await prisma.teamMember.findMany({
		where: { userId: state.userId },
		include: { organization: true },
		orderBy: { joinedAt: "asc" },
	});

	const organizations = memberships.map((m) => ({
		id: m.organization.id,
		name: m.organization.name,
		slug: m.organization.slug,
		logoUrl: m.organization.logoUrl,
		role: m.role,
	}));

	const pendingInvitations = await getPendingInvitationsForEmail().catch(() => []);

	const sidebarUser = {
		name: user?.fullName || state.fullName || "User",
		email: user?.email || state.email,
		avatar: user?.avatarUrl || "",
		username: user?.username || state.username || "",
		momoNumber: user?.phone || "",
	};

	return (
		<SidebarProvider>
			<AppSidebar
				user={serializeJsonSafe(sidebarUser)}
				organizations={serializeJsonSafe(organizations)}
				activeOrganizationId={organizations[0]?.id ?? null}
				pendingInvitations={serializeJsonSafe(pendingInvitations)}
			/>
			<SidebarInset className="font-sans min-h-svh flex flex-1 flex-col bg-background">
				{/* The Header */}
				<AppHeader pendingInvitations={serializeJsonSafe(pendingInvitations)} />

				{/* The Page Slot Pattern */}
				<main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/20">
					<div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6">
						{children}
					</div>
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
