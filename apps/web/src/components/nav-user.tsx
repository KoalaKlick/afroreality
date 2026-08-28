"use client";

import Link from "next/link";
import {
	BadgeCheck,
	Bell,
	ChevronsUpDown,
	LogOut,
	Moon,
	Settings,
	Sun,
	SunMoon,
	Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Avatar } from "@/components/image/Image";
import { UserProfileSheet } from "@/components/shared/UserProfileSheet";
import { NotificationsSheet } from "@/components/shared/NotificationsSheet";
import { useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/components/providers/auth-provider";
import { getAvatarUrl } from "@/lib/image-url-utils";
import { cn } from "@/lib/utils";

export interface Invitation {
	id: string;
	organization: {
		id: string;
		name: string;
		slug: string;
		logoUrl: string | null;
	};
	role: string;
}

export function NavUser({
	user,
	pendingInvitations = [],
}: {
	readonly user: {
		readonly name: string;
		readonly email: string;
		readonly avatar?: string;
		readonly username?: string;
		readonly momoNumber?: string;
		readonly momoNetwork?: string;
	};
	readonly pendingInvitations?: Invitation[];
}) {
	const { isMobile } = useSidebar();
	const { logout } = useAuth();
	const { theme, setTheme } = useTheme();
	const [notificationOpen, setNotificationOpen] = useState(false);
	const [accountOpen, setAccountOpen] = useState(false);
	const [invitations, setInvitations] = useState(pendingInvitations);

	const [fontSize, setFontSize] = useState(() => {
		if (typeof window !== "undefined") {
			return localStorage.getItem("font-size") || "16";
		}
		return "16";
	});

	const updateFontSize = (size: string) => {
		setFontSize(size);
		if (typeof window !== "undefined") {
			document.documentElement.style.fontSize = `${size}px`;
			localStorage.setItem("font-size", size);
		}
	};

	useEffect(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("font-size") || "16";
			document.documentElement.style.fontSize = `${saved}px`;
		}
	}, []);

	// Keep local state in sync with the latest invitations from the loader.
	useEffect(() => {
		setInvitations(pendingInvitations);
	}, [pendingInvitations]);

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<Avatar
								src={user.avatar ? getAvatarUrl(user.avatar) : ""}
								alt={user.name}
								width={32}
								height={32}
								className="h-8 w-8 rounded-lg"
							/>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-semibold">{user.name}</span>
								<span className="truncate text-xs text-muted-foreground">
									{user.email}
								</span>
							</div>
							<ChevronsUpDown className="ml-auto size-4 opacity-40" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 md:min-w-60 rounded-lg border bg-popover"
						side={isMobile ? "bottom" : "right"}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
								<Avatar
									src={user.avatar ? getAvatarUrl(user.avatar) : ""}
									alt={user.name}
									width={32}
									height={32}
									className="h-8 w-8 rounded-lg"
								/>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-semibold">{user.name}</span>
									<span className="truncate text-xs text-muted-foreground">
										{user.email}
									</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem
								onClick={() => setAccountOpen(true)}
								className="cursor-pointer"
							>
								<BadgeCheck className="mr-2 size-4" />
								My Profile
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<Link
									href="/organization/wallet"
									className="cursor-pointer"
								>
									<Wallet className="mr-2 size-4" />
									Wallet
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => setNotificationOpen(true)}
								className="relative cursor-pointer"
							>
								<Bell className="mr-2 size-4" />
								Notifications
								{invitations.length > 0 && (
									<Badge
										variant="destructive"
										className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-[10px]"
									>
										{invitations.length > 9 ? "9+" : invitations.length}
									</Badge>
								)}
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<Link
									href="/organization/manage"
									className="cursor-pointer"
								>
									<Settings className="mr-2 size-4" />
									Settings
								</Link>
							</DropdownMenuItem>

							<DropdownMenuSeparator />

							{/* Appearance Submenu */}
							<DropdownMenuSub>
								<DropdownMenuSubTrigger>
									<SunMoon className="mr-2 size-4" />
									Appearance
								</DropdownMenuSubTrigger>
								<DropdownMenuPortal>
									<DropdownMenuSubContent className="min-w-48">
										<DropdownMenuLabel>Theme</DropdownMenuLabel>
										<DropdownMenuItem
											onClick={() => setTheme("light")}
											className={cn(
												theme === "light" && "bg-accent text-accent-foreground",
											)}
										>
											<Sun className="mr-2 size-4" />
											Light Mode
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => setTheme("dark")}
											className={cn(
												theme === "dark" && "bg-accent text-accent-foreground",
											)}
										>
											<Moon className="mr-2 size-4" />
											Dark Mode
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => setTheme("system")}
											className={cn(
												theme === "system" &&
													"bg-accent text-accent-foreground",
											)}
										>
											<SunMoon className="mr-2 size-4" />
											System
										</DropdownMenuItem>

										<DropdownMenuSeparator />

										<DropdownMenuLabel>Font Size</DropdownMenuLabel>
										<div className="px-2 py-1.5 flex items-center justify-between gap-1">
											{["14", "16", "18", "20"].map((size) => (
												<Button
													key={size}
													variant="ghost"
													size="sm"
													className={cn(
														"h-8 w-8 p-0 text-xs",
														fontSize === size
															? "bg-primary text-primary-foreground hover:bg-primary/90"
															: "hover:bg-accent",
													)}
													onClick={() => updateFontSize(size)}
												>
													{size === "14"
														? "S"
														: size === "16"
															? "M"
															: size === "18"
																? "L"
																: "XL"}
												</Button>
											))}
										</div>
									</DropdownMenuSubContent>
								</DropdownMenuPortal>
							</DropdownMenuSub>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() => logout()}
							className="cursor-pointer text-destructive focus:text-destructive"
						>
							<LogOut className="mr-2 size-4" />
							Log out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>

			{/* Notifications Sheet */}
			<NotificationsSheet
				open={notificationOpen}
				onOpenChange={setNotificationOpen}
				invitations={invitations}
				onInvitationsChange={setInvitations}
			/>

			{/* Account / Profile Sheet */}
			<UserProfileSheet
				open={accountOpen}
				onOpenChange={setAccountOpen}
				user={{
					name: user.name,
					email: user.email,
					avatar: user.avatar,
					username: user.username,
					momoNumber: user.momoNumber,
					momoNetwork: user.momoNetwork,
				}}
			/>
		</SidebarMenu>
	);
}
