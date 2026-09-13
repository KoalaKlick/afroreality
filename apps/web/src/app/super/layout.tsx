import React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SuperAdminSidebar } from "@/components/super-admin/SuperAdminSidebar";
import { SuperAdminHeader } from "@/components/super-admin/SuperAdminHeader";
import { requirePlatformAdmin } from "@/lib/admin/admin-auth";
import { getSafeUser } from "@/lib/dal/auth";
import { serializeJsonSafe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Super Admin Platform - Fextiva",
	description: "Company platform governance and oversight dashboard",
};


export default async function SuperAdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const state = await requirePlatformAdmin();
	const user = await getSafeUser(state.userId);

	const adminUser = {
		name: user?.fullName || state.fullName || "Super Admin",
		email: user?.email || state.email,
		avatar: user?.avatarUrl || "",
	};

	return (
		<SidebarProvider className="h-svh max-h-svh overflow-hidden rounded-none shadow-none">
			<SuperAdminSidebar user={serializeJsonSafe(adminUser)} />
			<SidebarInset className="font-sans h-svh max-h-svh flex flex-1 flex-col bg-background min-w-0 max-w-full overflow-hidden rounded-none shadow-none">
				<SuperAdminHeader />
				<main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-50 dark:bg-slate-950 min-w-0 max-w-full rounded-none shadow-none">
					<div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 min-w-0 rounded-none shadow-none">
						{children}
					</div>
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
