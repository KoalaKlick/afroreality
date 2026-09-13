"use client";
// src/components/header/NotificationBell.tsx

import { Bell, ShieldAlert } from "lucide-react";
import { useState, useEffect } from "react";
import {
	NotificationsSheet,
	type NotificationInvitation,
} from "@/components/shared/NotificationsSheet";
import { getPendingInvitationsForEmail } from "@/lib/server-functions/organization-join";
import {
	getPlatformNotificationsForUser,
	type PlatformNotificationAlert,
} from "@/lib/server-functions/notifications";

interface NotificationBellProps {
	readonly pendingInvitations?: NotificationInvitation[];
	readonly alerts?: PlatformNotificationAlert[];
	readonly className?: string;
}

export function NotificationBell({
	pendingInvitations: initialProp = [],
	alerts: initialAlerts = [],
	className = "",
}: NotificationBellProps) {
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [invitations, setInvitations] = useState<NotificationInvitation[]>(initialProp);
	const [alerts, setAlerts] = useState<PlatformNotificationAlert[]>(initialAlerts);

	// Sync with props when layout revalidates
	useEffect(() => {
		setInvitations(initialProp);
	}, [initialProp]);

	useEffect(() => {
		setAlerts(initialAlerts);
	}, [initialAlerts]);

	// Periodically check for new invitations and platform alerts every 30 seconds
	useEffect(() => {
		let isMounted = true;
		const checkNotifications = async () => {
			try {
				const [freshInvites, freshAlerts] = await Promise.all([
					getPendingInvitationsForEmail().catch(() => []),
					getPlatformNotificationsForUser().catch(() => []),
				]);
				if (isMounted) {
					if (Array.isArray(freshInvites)) setInvitations(freshInvites);
					if (Array.isArray(freshAlerts)) setAlerts(freshAlerts);
				}
			} catch {
				// Ignore polling errors
			}
		};

		const timer = setInterval(checkNotifications, 30000);
		return () => {
			isMounted = false;
			clearInterval(timer);
		};
	}, []);

	const handleOpenDrawer = async () => {
		setDrawerOpen(true);
		// Fetch freshest invitations and alerts on click
		try {
			const [freshInvites, freshAlerts] = await Promise.all([
				getPendingInvitationsForEmail().catch(() => []),
				getPlatformNotificationsForUser().catch(() => []),
			]);
			if (Array.isArray(freshInvites)) setInvitations(freshInvites);
			if (Array.isArray(freshAlerts)) setAlerts(freshAlerts);
		} catch {
			// Ignore
		}
	};

	const hasCriticalAlert = alerts.some((a) => a.type === "wallet_frozen");
	const count = invitations.length + alerts.length;

	return (
		<>
			<button
				type="button"
				onClick={handleOpenDrawer}
				className={`relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 border border-transparent hover:border-input cursor-pointer ${className}`}
				aria-label="Notifications"
				title={
					hasCriticalAlert
						? "Urgent: Account / Wallet Restricted"
						: count > 0
							? `${count} pending notification(s)`
							: "Notifications"
				}
			>
				{hasCriticalAlert ? (
					<Bell className="size-4.5 text-destructive animate-bounce" />
				) : (
					<Bell className="size-4.5" />
				)}

				{count > 0 && (
					<>
						{/* Animated glowing ping effect */}
						<span className="absolute top-1 right-1 flex size-2.5 pointer-events-none">
							<span
								className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
									hasCriticalAlert ? "bg-destructive" : "bg-primary"
								}`}
							/>
							<span
								className={`relative inline-flex rounded-full size-2.5 ${
									hasCriticalAlert ? "bg-destructive" : "bg-primary"
								}`}
							/>
						</span>

						{/* Number badge */}
						<span
							className={`absolute -top-1 -right-1 min-w-4 h-4 px-1 flex items-center justify-center text-[10px] font-extrabold text-white rounded-full ring-2 ring-background shadow-xs pointer-events-none ${
								hasCriticalAlert ? "bg-destructive" : "bg-primary"
							}`}
						>
							{count > 9 ? "9+" : count}
						</span>
					</>
				)}
			</button>

			<NotificationsSheet
				open={drawerOpen}
				onOpenChange={setDrawerOpen}
				invitations={invitations}
				alerts={alerts}
				onInvitationsChange={setInvitations}
			/>
		</>
	);
}
