"use client";
// src/components/header/NotificationBell.tsx

import { Bell } from "lucide-react";
import { useState } from "react";
import {
	NotificationsSheet,
	type NotificationInvitation,
} from "@/components/shared/NotificationsSheet";

interface NotificationBellProps {
	readonly pendingInvitations?: NotificationInvitation[];
	readonly className?: string;
}

export function NotificationBell({
	pendingInvitations = [],
	className = "",
}: NotificationBellProps) {
	const [drawerOpen, setDrawerOpen] = useState(false);
	const count = pendingInvitations.length;

	return (
		<>
			<button
				type="button"
				onClick={() => setDrawerOpen(true)}
				className={`relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 border border-transparent hover:border-input ${className}`}
				aria-label="Notifications"
				title={count > 0 ? `${count} pending invitation(s)` : "Notifications"}
			>
				<Bell className="size-4.5" />

				{count > 0 && (
					<>
						{/* Animated glowing ping effect */}
						<span className="absolute top-1 right-1 flex size-2.5">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
							<span className="relative inline-flex rounded-full size-2.5 bg-destructive" />
						</span>

						{/* Number badge */}
						<span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 flex items-center justify-center text-[10px] font-extrabold text-white bg-destructive rounded-full ring-2 ring-background shadow-xs">
							{count}
						</span>
					</>
				)}
			</button>

			<NotificationsSheet
				open={drawerOpen}
				onOpenChange={setDrawerOpen}
				invitations={pendingInvitations}
			/>
		</>
	);
}
