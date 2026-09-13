"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Users, CalendarCheck, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
	{
		title: "Overview",
		href: "/admin",
		icon: ShieldCheck,
		exact: true,
	},
	{
		title: "Organizers & Members",
		href: "/admin/organizers",
		icon: Users,
	},
	{
		title: "Events Oversight",
		href: "/admin/events",
		icon: CalendarCheck,
	},
	{
		title: "Wallets & Payouts",
		href: "/admin/wallets",
		icon: Wallet,
	},
];

export function AdminNavTabs() {
	const pathname = usePathname();

	return (
		<div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
			{tabs.map((tab) => {
				const Icon = tab.icon;
				const isActive = tab.exact
					? pathname === tab.href
					: pathname === tab.href || pathname.startsWith(`${tab.href}/`);

				return (
					<Link
						key={tab.href}
						href={tab.href}
						className={cn(
							"flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap",
							isActive
								? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
								: "text-muted-foreground hover:text-foreground hover:bg-muted/80 bg-background/60 border border-border/40"
						)}
					>
						<Icon className="h-3.5 w-3.5" />
						<span>{tab.title}</span>
					</Link>
				);
			})}
		</div>
	);
}
