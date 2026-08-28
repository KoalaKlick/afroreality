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
			<div className="relative flex h-full flex-col overflow-hidden">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(234,179,8,0.14),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(22,163,74,0.14),transparent_26%)]" />
				<div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,rgba(255,248,232,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,248,232,0.08)_1px,transparent_1px)] [background-size:32px_32px]" />

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
