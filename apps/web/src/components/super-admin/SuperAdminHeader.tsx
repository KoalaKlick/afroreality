"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, ArrowLeft } from "lucide-react";

export function SuperAdminHeader() {
	const pathname = usePathname();

	const getPageTitle = () => {
		if (pathname === "/super") return "Platform Overview";
		if (pathname.startsWith("/super/organizers")) return "Organizers & Members Directory";
		if (pathname.startsWith("/super/events")) return "Events Schedule & Financial Oversight";
		if (pathname.startsWith("/super/wallets")) return "Wallets, Escrow & Payouts";
		if (pathname.startsWith("/super/admins")) return "Platform Admin Users & Delegation";
		return "Super Admin Platform";
	};

	return (
		<header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 rounded-none shadow-none">
			<div className="flex items-center gap-3">
				<SidebarTrigger className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-none shadow-none" />
				<div className="h-4 w-[1px] bg-border" />
				<div>
					<h2 className="text-xs font-bold text-foreground sm:text-sm tracking-tight">
						{getPageTitle()}
					</h2>
				</div>
			</div>

			<div className="flex items-center gap-3">
				{/* View-Only Governance Notice */}
				<div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-muted/50 border border-border text-[11px] text-muted-foreground rounded-none shadow-none">
					<Eye className="h-3 w-3 text-primary" />
					<span>View-Only Core Boundary</span>
				</div>

				{/* Live Status Badge */}
				<Badge
					variant="outline"
					className="hidden sm:flex items-center gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-none shadow-none"
				>
					<span className="h-1.5 w-1.5 bg-emerald-500 animate-pulse" />
					Live Oversight
				</Badge>

				{/* Quick link to Organizer dashboard */}
				<Button variant="ghost" size="sm" asChild className="h-8 text-xs text-muted-foreground hover:text-foreground rounded-none shadow-none">
					<Link href="/dashboard" className="flex items-center gap-1">
						<ArrowLeft className="h-3 w-3" />
						<span className="hidden sm:inline">Organizer View</span>
					</Link>
				</Button>
			</div>
		</header>
	);
}
