"use client";
// src/components/header/NotificationBell.tsx

import { Bell } from "lucide-react";
import { useState, useEffect } from "react";
import {
	NotificationsSheet,
	type NotificationInvitation,
} from "@/components/shared/NotificationsSheet";
import { getPendingInvitationsForEmail } from "@/lib/server-functions/organization-join";

interface NotificationBellProps {
	readonly pendingInvitations?: NotificationInvitation[];
	readonly className?: string;
}

export function NotificationBell({
	pendingInvitations: initialProp = [],
	className = "",
}: NotificationBellProps) {
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [invitations, setInvitations] = useState<NotificationInvitation[]>(initialProp);

	// Sync with props when layout revalidates
	useEffect(() => {
		setInvitations(initialProp);
	}, [initialProp]);

	// Periodically check for new invitations every 30 seconds
	useEffect(() => {
		let isMounted = true;
		const checkInvitations = async () => {
			try {
				const fresh = await getPendingInvitationsForEmail();
				if (isMounted && Array.isArray(fresh)) {
					setInvitations(fresh);
				}
			} catch {
				// Ignore polling errors
			}
		};

		const timer = setInterval(checkInvitations, 30000);
		return () => {
			isMounted = false;
			clearInterval(timer);
		};
	}, []);

	const handleOpenDrawer = async () => {
		setDrawerOpen(true);
		// Fetch freshest invitations on click
		try {
			const fresh = await getPendingInvitationsForEmail();
			if (Array.isArray(fresh)) {
				setInvitations(fresh);
			}
		} catch {
			// Ignore
		}
	};

	const count = invitations.length;

	return (
		<>
			<button
				type="button"
				onClick={handleOpenDrawer}
				className={`relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 border border-transparent hover:border-input cursor-pointer ${className}`}
				aria-label="Notifications"
				title={count > 0 ? `${count} pending invitation(s)` : "Notifications"}
			>
				<Bell className="size-4.5" />

				{count > 0 && (
					<>
						{/* Animated glowing ping effect */}
						<span className="absolute top-1 right-1 flex size-2.5 pointer-events-none">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
							<span className="relative inline-flex rounded-full size-2.5 bg-primary" />
						</span>

						{/* Number badge */}
						<span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 flex items-center justify-center text-[10px] font-extrabold text-white bg-primary rounded-full ring-2 ring-background shadow-xs pointer-events-none">
							{count > 9 ? "9+" : count}
						</span>
					</>
				)}
			</button>

			<NotificationsSheet
				open={drawerOpen}
				onOpenChange={setDrawerOpen}
				invitations={invitations}
				onInvitationsChange={setInvitations}
			/>
		</>
	);
}
