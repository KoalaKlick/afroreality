"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
	ShieldCheck,
	LayoutDashboard,
	Building2,
	CalendarCheck,
	Wallet,
	UserCheck,
	ArrowLeft,
	Percent,
	MessageSquare,
	Send,
} from "lucide-react";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarGroupContent,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SuperAdminSidebarProps {
	user: {
		name: string;
		email: string;
		avatar?: string;
	};
}

const navGroups = [
	{
		label: "Overview",
		items: [
			{ title: "Dashboard", href: "/super", icon: LayoutDashboard, exact: true },
		],
	},
	{
		label: "Oversight",
		items: [
			{ title: "Organizers", href: "/super/organizers", icon: Building2 },
			{ title: "Organizer Notifications", href: "/super/notifications", icon: Send },
			{ title: "Events", href: "/super/events", icon: CalendarCheck },
			{ title: "Messaging & Reports", href: "/super/reports", icon: MessageSquare },
			{ title: "Wallets", href: "/super/wallets", icon: Wallet },
			{ title: "Deposits", href: "/super/deposits", icon: ShieldCheck },
		],
	},
	{
		label: "Configuration",
		items: [
			{ title: "Fees & gateways", href: "/super/fees", icon: Percent },
			{ title: "Admin users", href: "/super/admins", icon: UserCheck },
		],
	},
] as const;

export function SuperAdminSidebar({
	user,
	...props
}: SuperAdminSidebarProps & React.ComponentProps<typeof Sidebar>) {
	const pathname = usePathname();

	return (
		<Sidebar collapsible="icon" className="border-r border-border/70" {...props}>
			<div className="relative flex h-full flex-col overflow-hidden bg-sidebar">
				<SidebarHeader className="border-b border-border/70 px-4 py-3.5">
					<Link href="/super" className="flex items-center gap-3 select-none">
						<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background border border-border/70 p-1">
							<Image
								src="/logo.svg"
								alt="Fextiva"
								width={32}
								height={32}
								className="h-7 w-auto object-contain"
								priority
							/>
						</div>
						<div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
							<p className="text-sm font-semibold text-foreground tracking-tight">
								Fextiva Admin
							</p>
							<p className="text-[11px] text-muted-foreground truncate">
								Platform control
							</p>
						</div>
					</Link>
				</SidebarHeader>

				<SidebarContent className="px-2 py-3 flex-1 gap-4">
					{navGroups.map((group) => (
						<SidebarGroup key={group.label} className="p-0">
							<SidebarGroupLabel className="px-3 text-[10px] uppercase tracking-wider text-muted-foreground/80">
								{group.label}
							</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu className="gap-0.5">
									{group.items.map((item) => {
										const Icon = item.icon;
										const exact = "exact" in item && item.exact;
										const isActive = exact
											? pathname === item.href
											: pathname === item.href ||
												pathname.startsWith(`${item.href}/`);

										return (
											<SidebarMenuItem key={item.href}>
												<SidebarMenuButton
													asChild
													isActive={isActive}
													className={cn(
														"h-9 px-3 text-xs font-medium rounded-lg",
														isActive
															? "bg-muted text-foreground"
															: "text-muted-foreground hover:text-foreground hover:bg-muted/60",
													)}
												>
													<Link href={item.href} className="flex items-center gap-2.5">
														<Icon className="size-4 shrink-0" />
														<span>{item.title}</span>
													</Link>
												</SidebarMenuButton>
											</SidebarMenuItem>
										);
									})}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					))}
				</SidebarContent>

				<SidebarFooter className="border-t border-border/70 p-3 gap-2">
					<Button
						variant="ghost"
						size="sm"
						asChild
						className="w-full justify-start h-8 text-xs text-muted-foreground hover:text-foreground"
					>
						<Link href="/dashboard">
							<ArrowLeft className="size-3.5 mr-1.5" />
							Organizer portal
						</Link>
					</Button>
					<div className="flex items-center gap-2.5 p-2 rounded-lg border border-border/70 bg-muted/30">
						<Avatar className="size-8 shrink-0 rounded-lg border border-border/70">
							<AvatarImage src={user.avatar || ""} />
							<AvatarFallback className="bg-muted text-muted-foreground font-semibold text-xs rounded-lg">
								{user.name.slice(0, 2).toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<div className="min-w-0 group-data-[collapsible=icon]:hidden">
							<p className="text-xs font-semibold text-foreground truncate">
								{user.name}
							</p>
							<p className="text-[10px] text-muted-foreground truncate">
								{user.email}
							</p>
						</div>
					</div>
				</SidebarFooter>
			</div>
		</Sidebar>
	);
}
