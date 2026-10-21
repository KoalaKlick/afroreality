"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";

const PAGE_META: Record<string, { title: string; description?: string }> = {
	"/super": {
		title: "Dashboard",
		description: "Platform health and recent activity",
	},
	"/super/organizers": {
		title: "Organizers",
		description: "Organizations and member directory",
	},
	"/super/events": {
		title: "Events",
		description: "Schedule and financial oversight",
	},
	"/super/reports": {
		title: "Messaging",
		description: "Reports, SMS and WhatsApp delivery",
	},
	"/super/wallets": {
		title: "Wallets",
		description: "Escrow balances and payout approvals",
	},
	"/super/deposits": {
		title: "Deposits",
		description: "Security deposit rules and status",
	},
	"/super/fees": {
		title: "Fees & gateways",
		description: "Take rates, processing fees and payment routing",
	},
	"/super/admins": {
		title: "Admin users",
		description: "Platform administrators and access",
	},
};

export function SuperAdminHeader() {
	const pathname = usePathname();

	const meta =
		Object.entries(PAGE_META).find(
			([path]) => pathname === path || (path !== "/super" && pathname.startsWith(`${path}/`)),
		)?.[1] || PAGE_META["/super"];

	return (
		<header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border/70 bg-background/95 backdrop-blur-sm px-4 sm:px-6">
			<SidebarTrigger className="size-8 text-muted-foreground hover:text-foreground" />
			<div className="h-4 w-px bg-border" />
			<div className="min-w-0">
				<h1 className="text-sm font-semibold text-foreground tracking-tight truncate">
					{meta?.title}
				</h1>
				{meta?.description && (
					<p className="text-[11px] text-muted-foreground truncate hidden sm:block">
						{meta.description}
					</p>
				)}
			</div>
		</header>
	);
}
