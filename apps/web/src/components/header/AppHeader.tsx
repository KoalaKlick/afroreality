"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GlobalSearch } from "@/components/header/GlobalSearch";
import { NotificationBell } from "@/components/header/NotificationBell";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { NotificationInvitation } from "@/components/shared/NotificationsSheet";

interface AppHeaderProps {
	readonly pendingInvitations?: NotificationInvitation[];
	readonly actions?: React.ReactNode;
}

export function AppHeader({ pendingInvitations = [], actions }: AppHeaderProps) {
	const pathname = usePathname();
	const [searchOpen, setSearchOpen] = useState(false);

	// Smart route-based breadcrumbs matching the reference project
	const getBreadcrumbs = () => {
		if (pathname === "/dashboard") {
			return [{ label: "Dashboard" }];
		}
		if (pathname === "/my-events") {
			return [
				{ label: "Events", href: "/my-events" },
				{ label: "My Events" },
			];
		}
		if (pathname === "/my-events/create" || pathname === "/my-events/new") {
			return [
				{ label: "Events", href: "/my-events" },
				{ label: "My Events", href: "/my-events" },
				{ label: "Create Event" },
			];
		}
		if (pathname.startsWith("/my-events/")) {
			return [
				{ label: "Events", href: "/my-events" },
				{ label: "My Events", href: "/my-events" },
				{ label: "Event Details" },
			];
		}
		if (pathname === "/organization/manage") {
			return [
				{ label: "Organization", href: "/organization/manage" },
				{ label: "General Settings" },
			];
		}
		if (pathname === "/organization/members") {
			return [
				{ label: "Organization", href: "/organization/manage" },
				{ label: "Members" },
			];
		}
		if (pathname === "/organization/wallet") {
			return [
				{ label: "Organization", href: "/organization/manage" },
				{ label: "Wallet & Payouts" },
			];
		}
		if (pathname === "/organization/billing") {
			return [
				{ label: "Organization", href: "/organization/manage" },
				{ label: "Subscription & Billing" },
			];
		}
		if (pathname === "/promoter") {
			return [{ label: "Promoter Dashboard" }];
		}

		// Fallback for other paths
		const segments = pathname.split("/").filter(Boolean);
		return segments.map((seg, idx) => {
			const label = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
			const href = "/" + segments.slice(0, idx + 1).join("/");
			const isLast = idx === segments.length - 1;
			return isLast ? { label } : { label, href };
		});
	};

	const breadcrumbs = getBreadcrumbs();

	return (
		<header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 px-4 gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 font-poppins">
			{/* Left: Sidebar toggle & Breadcrumbs */}
			<div className="flex items-center gap-2 min-w-0 flex-1">
				<SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
				<Separator
					orientation="vertical"
					className="mr-2 data-[orientation=vertical]:h-4 h-4 bg-border/60"
				/>
				{breadcrumbs.length > 0 && (
					<Breadcrumb className="truncate">
						<BreadcrumbList>
							{breadcrumbs.map((item, index) => {
								const isLast = index === breadcrumbs.length - 1;
								return (
									<Fragment key={index}>
										<BreadcrumbItem>
											{isLast ? (
												<BreadcrumbPage className="font-medium text-foreground">
													{item.label}
												</BreadcrumbPage>
											) : (
												<BreadcrumbLink asChild>
													<Link
														href={item.href || "#"}
														className="text-muted-foreground hover:text-foreground transition-colors"
													>
														{item.label}
													</Link>
												</BreadcrumbLink>
											)}
										</BreadcrumbItem>
										{!isLast && <BreadcrumbSeparator />}
									</Fragment>
								);
							})}
						</BreadcrumbList>
					</Breadcrumb>
				)}
			</div>

			{/* Right: Search, Notification Bell, & custom actions */}
			<div className="flex items-center gap-2.5 shrink-0 ml-auto">
				<GlobalSearch
					open={searchOpen}
					onOpenChange={setSearchOpen}
					className="w-44 sm:w-60 md:w-72"
				/>

				<NotificationBell pendingInvitations={pendingInvitations} />

				{actions && <div className="flex items-center gap-2">{actions}</div>}
			</div>
		</header>
	);
}
