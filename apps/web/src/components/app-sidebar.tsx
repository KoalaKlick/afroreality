// src/components/app-sidebar.tsx
"use client";

import type * as React from "react";
import { NavMain } from "@/components/nav-main";
import type { Invitation } from "@/components/nav-user";
import { NavUser } from "@/components/nav-user";
import { OrganizationSwitcher } from "@/components/organization-switcher";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
} from "@/components/ui/sidebar";
import { navMain, type OrganizationInfo } from "@/lib/constants/navigation";

export function AppSidebar({
	user,
	organizations = [],
	activeOrganizationId,
	pendingInvitations = [],
	...props
}: React.ComponentProps<typeof Sidebar> & {
	readonly user?: {
		readonly name: string;
		readonly email: string;
		readonly avatar?: string;
		readonly username?: string;
		readonly momoNumber?: string;
		readonly momoNetwork?: string;
	};
	readonly organizations?: OrganizationInfo[];
	readonly activeOrganizationId?: string | null;
	readonly pendingInvitations?: Invitation[];
}) {
	const defaultUser = {
		name: "User",
		email: "",
		avatar: "",
		username: "",
		momoNumber: "",
		momoNetwork: "",
	};
	const sidebarUser = user ?? defaultUser;

	return (
		<Sidebar collapsible="icon" className="border-sidebar-border/40" {...props}>
			<div className="relative flex h-full flex-col overflow-hidden bg-primary-100/60 dark:bg-primary-950/30">
				<SidebarHeader className="relative z-10 border-b border-border/30 px-2 py-3">
					<OrganizationSwitcher
						organizations={organizations}
						activeOrganizationId={activeOrganizationId}
					/>
				</SidebarHeader>
				<SidebarContent className="relative z-10 px-2 py-3">
					<NavMain items={navMain} />
				</SidebarContent>
				<SidebarFooter className="relative z-10 border-t border-border/30 px-3 py-3">
					<NavUser user={sidebarUser} pendingInvitations={pendingInvitations} />
				</SidebarFooter>
			</div>
		</Sidebar>
	);
}
