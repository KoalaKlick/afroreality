"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	ShieldCheck,
	LayoutDashboard,
	Building2,
	CalendarCheck,
	Wallet,
	UserCheck,
	ArrowLeft,
	Sparkles,
	Percent,
	MessageSquare,
} from "lucide-react";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import Image from "next/image";
import { PROJ_NAME } from "@/lib/constants/branding";

interface SuperAdminSidebarProps {
	user: {
		name: string;
		email: string;
		avatar?: string;
	};
}

const navItems = [
	{
		title: "Platform Overview",
		href: "/super",
		icon: LayoutDashboard,
		exact: true,
	},
	{
		title: "Organizers & Members",
		href: "/super/organizers",
		icon: Building2,
	},
	{
		title: "Events Oversight",
		href: "/super/events",
		icon: CalendarCheck,
	},
	{
		title: "Nominee Reports",
		href: "/super/reports",
		icon: MessageSquare,
	},
	{
		title: "Wallets & Payouts",
		href: "/super/wallets",
		icon: Wallet,
	},
	{
		title: "Security Deposits",
		href: "/super/deposits",
		icon: ShieldCheck,
	},
	{
		title: "Platform Fees",
		href: "/super/fees",
		icon: Percent,
	},
	{
		title: "Platform Admin Users",
		href: "/super/admins",
		icon: UserCheck,
	},
];

export function SuperAdminSidebar({ user, ...props }: SuperAdminSidebarProps & React.ComponentProps<typeof Sidebar>) {
	const pathname = usePathname();

	return (
		<Sidebar collapsible="icon" className="border-r border-border rounded-none shadow-none" {...props}>
			<div className="relative flex h-full flex-col overflow-hidden bg-sidebar rounded-none shadow-none">
				{/* Company Super Admin Header */}
				<SidebarHeader className="relative z-10 border-b border-border px-4 py-3.5 rounded-none shadow-none bg-sidebar">
					<Link href="/super" className="flex items-center gap-3 group select-none">
						<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-none shadow-none bg-background/80 border border-border/80 p-1">
							<Image
								src="/logo.svg"
								alt="Fextiva Logo"
								width={32}
								height={32}
								className="h-7 w-auto object-contain transition-transform group-hover:scale-105"
								priority
							/>
						</div>
						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-1.5">
								<span className="text-base font-extrabold text-foreground tracking-tight">
									Fextiva
								</span>
								<Badge variant="outline" className="text-[9px] uppercase tracking-wider font-extrabold bg-primary/10 text-primary border-primary/40 px-1.5 py-0 rounded-none shadow-none">
									Super
								</Badge>
							</div>
							<p className="text-[11px] text-muted-foreground truncate">
								Company Platform Control
							</p>
						</div>
					</Link>
				</SidebarHeader>


				{/* Navigation Links */}
				<SidebarContent className="relative z-10 px-3 py-4 flex-1 rounded-none shadow-none">
					<div className="px-2 pb-2">
						<span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70">
							Platform Governance
						</span>
					</div>

					<SidebarMenu className="gap-1">
						{navItems.map((item) => {
							const Icon = item.icon;
							const isActive = item.exact
								? pathname === item.href
								: pathname === item.href || pathname.startsWith(`${item.href}/`);

							return (
								<SidebarMenuItem key={item.href}>
									<SidebarMenuButton
										asChild
										isActive={isActive}
										className={cn(
											"h-10 px-3 text-xs font-semibold rounded-none shadow-none transition-all",
											isActive
												? "bg-primary text-primary-foreground font-bold hover:bg-primary hover:text-primary-foreground"
												: "text-muted-foreground hover:text-foreground hover:bg-muted/70"
										)}
									>
										<Link href={item.href} className="flex items-center gap-3">
											<Icon className="h-4 w-4 shrink-0" />
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							);
						})}
					</SidebarMenu>

					{/* Switch to Organizer Portal Banner */}
					<div className="mt-8 px-2">
						<div className="p-3 bg-muted/40 border border-border space-y-2 rounded-none shadow-none">
							<span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
								<Sparkles className="h-3.5 w-3.5 text-primary" />
								Organizer View
							</span>
							<p className="text-[11px] text-muted-foreground leading-relaxed">
								Return to your organization account or event manager.
							</p>
							<Button
								variant="outline"
								size="sm"
								asChild
								className="w-full text-xs font-semibold h-8 mt-1 rounded-none shadow-none hover:bg-background border-border"
							>
								<Link href="/dashboard">
									<ArrowLeft className="h-3 w-3 mr-1.5" />
									Organizer Portal
								</Link>
							</Button>
						</div>
					</div>
				</SidebarContent>

				{/* Footer User Info */}
				<SidebarFooter className="relative z-10 border-t border-border p-3 rounded-none shadow-none">
					<div className="flex items-center justify-between gap-3 p-2 bg-muted/30 border border-border rounded-none shadow-none">
						<div className="flex items-center gap-2.5 min-w-0">
							<Avatar className="h-8 w-8 shrink-0 rounded-none shadow-none border border-border">
								<AvatarImage src={user.avatar || ""} />
								<AvatarFallback className="bg-primary/10 text-primary font-bold text-xs rounded-none">
									{user.name.slice(0, 2).toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<div className="min-w-0">
								<p className="text-xs font-bold text-foreground truncate">{user.name}</p>
								<p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
							</div>
						</div>
					</div>
				</SidebarFooter>
			</div>
		</Sidebar>
	);
}
