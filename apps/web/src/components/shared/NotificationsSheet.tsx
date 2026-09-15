"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
	Bell,
	Building2,
	Check,
	Loader2,
	ShieldAlert,
	CheckCircle2,
	Lock,
	ArrowRight,
	ChevronDown,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { PanAfricanDivider } from "@/components/shared/PanAficDivider";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
} from "@/components/ui/collapsible";
import {
	Sheet,
	SheetBody,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { getOrgImageUrl } from "@/lib/image-url-utils";
import {
	acceptOrgInvitation,
	declineOrgInvitation,
} from "@/lib/server-functions/organization-join";
import type { PlatformNotificationAlert } from "@/lib/server-functions/notifications";

export interface NotificationInvitation {
	id: string;
	email?: string;
	role: string;
	createdAt?: string;
	organization: {
		id: string;
		name: string;
		slug?: string;
		logoUrl: string | null;
		bannerUrl?: string | null;
	};
	inviter?: {
		fullName?: string | null;
		avatarUrl?: string | null;
	} | null;
}

export interface NotificationsSheetProps<T extends NotificationInvitation = NotificationInvitation> {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly invitations?: T[];
	readonly pendingInvitations?: T[];
	readonly alerts?: PlatformNotificationAlert[];
	readonly onInvitationsChange?: (invitations: T[]) => void;
}

function formatTimeAgo(dateInput: string | Date | undefined): string {
	if (!dateInput) return "";
	const date = new Date(dateInput);
	if (isNaN(date.getTime())) return "";
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffSecs = Math.floor(diffMs / 1000);
	if (diffSecs < 60) return "Just now";
	const diffMins = Math.floor(diffSecs / 60);
	if (diffMins < 60) return `${diffMins}m ago`;
	const diffHours = Math.floor(diffMins / 60);
	if (diffHours < 24) return `${diffHours}h ago`;
	const diffDays = Math.floor(diffHours / 24);
	if (diffDays < 7) return `${diffDays}d ago`;
	return date.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
	});
}

const VISIBLE_LIMIT = 3;

function AlertNotificationItem({
	alert,
	onOpenChange,
}: {
	alert: PlatformNotificationAlert;
	onOpenChange: (open: boolean) => void;
}) {
	const router = useRouter();
	const isFrozen = alert.type === "wallet_frozen";
	const timeAgo = formatTimeAgo(alert.createdAt);

	const orgImage = alert.organization?.logoUrl;
	const resolvedLogo = orgImage ? getOrgImageUrl(orgImage) : null;
	const initialLetter = alert.organization?.name?.charAt(0).toUpperCase() || "O";

	// Avoid duplicate reason if alert.message already mentions it
	const hasDistinctReason =
		alert.reason &&
		!alert.message.toLowerCase().includes(alert.reason.toLowerCase());

	return (
		<div className="px-5 py-4 hover:bg-muted/30 transition-colors flex items-start gap-3.5 text-left w-full">
			{/* Left Avatar / Status Icon matching sidebar user profile (rounded-lg) */}
			<div className="relative size-9 rounded-lg shrink-0">
				{resolvedLogo ? (
					<Avatar className="size-9 rounded-lg border border-border/60 shrink-0">
						<AvatarImage
							src={resolvedLogo}
							alt={alert.organization?.name || "Organization"}
							className="object-cover rounded-lg"
						/>
						<AvatarFallback className="rounded-lg text-xs font-semibold bg-muted text-foreground">
							{initialLetter}
						</AvatarFallback>
					</Avatar>
				) : isFrozen ? (
					<div className="size-9 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
						<ShieldAlert className="size-4.5" />
					</div>
				) : (
					<div className="size-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
						<CheckCircle2 className="size-4.5" />
					</div>
				)}

				{resolvedLogo && (
					<span
						className={cn(
							"absolute -bottom-1 -right-1 size-4 rounded-full flex items-center justify-center text-white border-2 border-background",
							isFrozen ? "bg-rose-600" : "bg-emerald-600",
						)}
					>
						{isFrozen ? (
							<ShieldAlert className="size-2.5" />
						) : (
							<CheckCircle2 className="size-2.5" />
						)}
					</span>
				)}
			</div>

			{/* Content */}
			<div className="flex-1 min-w-0">
				{/* Top Row: Timestamp and status */}
				<div className="flex items-center justify-between gap-2">
					<span className="text-xs text-muted-foreground font-normal">
						{timeAgo}
					</span>
					<StatusBadge
						variant={isFrozen ? "restricted" : "restored"}
						size="sm"
					/>
				</div>

				{/* Title */}
				<h4 className="text-sm font-semibold text-foreground mt-0.5 leading-snug">
					{alert.title}
				</h4>

				{/* Organization */}
				{alert.organization && (
					<p className="text-xs text-muted-foreground font-normal mt-0.5">
						Org: {alert.organization.name}
					</p>
				)}

				{/* Message */}
				<p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
					{alert.message}
				</p>

				{/* Admin Reason (only if distinct, avoiding duplicate text) */}
				{hasDistinctReason && (
					<div className="mt-2.5 border-l-2 border-destructive/60 bg-muted/20 pl-3 py-1 text-xs rounded-r">
						<span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
							Admin note:
						</span>
						<p className="text-xs font-medium text-foreground mt-0.5">
							{alert.reason}
						</p>
					</div>
				)}

				{/* Preline-style Embedded Action Card */}
				<Button
					type="button"
					variant="outline"
					onClick={() => {
						onOpenChange(false);
						router.push(alert.actionUrl || "/organization/wallet");
					}}
					className="w-full mt-2"
				>
					<div className="flex items-center gap-2.5 min-w-0">
						<span className="text-xs font-medium text-foreground truncate">
							Open Organization Wallet
						</span>
					</div>
					<ArrowRight className="size-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
				</Button>
			</div>
		</div>
	);
}

function InvitationNotificationItem({
	invite,
	isThisProcessing,
	isPending,
	onAccept,
	onDecline,
}: {
	invite: NotificationInvitation;
	isThisProcessing: boolean;
	isPending: boolean;
	onAccept: (id: string) => void;
	onDecline: (id: string) => void;
}) {
	// Support either logoUrl or bannerUrl from the organization
	const orgImage = invite.organization?.logoUrl || invite.organization?.bannerUrl;
	const resolvedLogo = orgImage ? getOrgImageUrl(orgImage) : null;
	const initialLetter = invite.organization?.name?.charAt(0).toUpperCase() || "O";
	const timeAgo = formatTimeAgo(invite.createdAt);

	return (
		<div className="px-5 py-4 hover:bg-muted/30 transition-colors flex items-start gap-3.5 text-left w-full">
			{/* Left Avatar matching sidebar user profile (rounded-lg) */}
			<Avatar className="size-9 rounded-lg border border-border/60 shrink-0">
				{resolvedLogo && (
					<AvatarImage
						src={resolvedLogo}
						alt={invite.organization.name}
						className="object-cover rounded-lg"
					/>
				)}
				<AvatarFallback className="rounded-lg text-xs font-semibold bg-primary/10 text-primary">
					{initialLetter}
				</AvatarFallback>
			</Avatar>

			{/* Content */}
			<div className="flex-1 min-w-0">
				{/* Top row */}
				<div className="flex items-center justify-between gap-2">
					<span className="text-xs text-muted-foreground font-normal">
						{timeAgo || "Team invitation"}
					</span>
					<StatusBadge variant="pending" size="sm" />
				</div>

				{/* Organization Name */}
				<h4 className="text-sm font-semibold text-foreground mt-0.5 truncate leading-snug">
					{invite.organization.name}
				</h4>

				{/* Role Subtitle */}
				<p className="text-xs text-muted-foreground mt-0.5">
					Invited you as <span className="font-medium text-foreground">{invite.role}</span>
				</p>

				{/* Inviter */}
				{invite.inviter?.fullName && (
					<p className="text-[11px] text-muted-foreground/80 mt-1 truncate">
						From: {invite.inviter.fullName}
					</p>
				)}

				{/* Action Buttons */}
				<div className="flex justify-end-safe gap-2 mt-3">
					<Button
						size="xs"
						variant="outline"
						onClick={() => onDecline(invite.id)}
						disabled={isThisProcessing || isPending}
						className=""
					>
						Decline
					</Button>
					<Button
						size="xs"
						variant="tertiary"
						onClick={() => onAccept(invite.id)}
						disabled={isThisProcessing || isPending}
						className=""
					>
						{isThisProcessing ? (
							<Loader2 className="size-3 animate-spin" />
						) : (
							<>
								<Check className="mr-1 size-3" />
								Accept
							</>
						)}
					</Button>
				</div>
			</div>
		</div>
	);
}

type UnifiedItem<T extends NotificationInvitation = NotificationInvitation> =
	| { type: "alert"; id: string; createdAt: string; alert: PlatformNotificationAlert }
	| { type: "invitation"; id: string; createdAt: string; invite: T };

export function NotificationsSheet<T extends NotificationInvitation = NotificationInvitation>({
	open,
	onOpenChange,
	invitations: propInvitations = [],
	pendingInvitations,
	alerts = [],
	onInvitationsChange,
}: NotificationsSheetProps<T>) {
	const router = useRouter();
	const initial = pendingInvitations || propInvitations || [];
	const [invitations, setInvitations] = useState<T[]>(initial as T[]);
	const [processingInviteId, setProcessingInviteId] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	// Single unified accordion state for older items
	const [isExpanded, setIsExpanded] = useState(false);

	// Keep local state in sync when parent components or props update
	useEffect(() => {
		const current = pendingInvitations || propInvitations || [];
		setInvitations(current as T[]);
	}, [pendingInvitations, propInvitations]);

	const handleAccept = (inviteId: string) => {
		setProcessingInviteId(inviteId);
		startTransition(async () => {
			try {
				await acceptOrgInvitation(inviteId);
				toast.success("Invitation accepted! Welcome to the team.");
				const updated = invitations.filter((inv) => inv.id !== inviteId);
				setInvitations(updated);
				onInvitationsChange?.(updated);
				router.refresh();
			} catch (err: any) {
				toast.error(err.message || "Failed to accept invitation");
			} finally {
				setProcessingInviteId(null);
			}
		});
	};

	const handleDecline = (inviteId: string) => {
		setProcessingInviteId(inviteId);
		startTransition(async () => {
			try {
				await declineOrgInvitation(inviteId);
				toast.info("Invitation declined.");
				const updated = invitations.filter((inv) => inv.id !== inviteId);
				setInvitations(updated);
				onInvitationsChange?.(updated);
				router.refresh();
			} catch (err: any) {
				toast.error(err.message || "Failed to decline invitation");
			} finally {
				setProcessingInviteId(null);
			}
		});
	};

	// Merge all notices and invitations into a single chronological feed (latest first)
	const allNotifications = useMemo(() => {
		const items: UnifiedItem<T>[] = [
			...alerts.map((a) => ({
				type: "alert" as const,
				id: a.id,
				createdAt: a.createdAt,
				alert: a,
			})),
			...invitations.map((inv) => ({
				type: "invitation" as const,
				id: inv.id,
				createdAt: (inv as any).createdAt || new Date().toISOString(),
				invite: inv,
			})),
		];

		return items.sort(
			(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
		);
	}, [alerts, invitations]);

	const visibleItems = allNotifications.slice(0, VISIBLE_LIMIT);
	const hiddenItems = allNotifications.slice(VISIBLE_LIMIT);
	const hasMore = hiddenItems.length > 0;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="w-full sm:max-w-md font-poppins flex flex-col p-0">
				<SheetHeader className="p-5 border-b border-border/40">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Bell className="size-4.5 text-primary" />
							<SheetTitle className="text-base font-semibold">Notifications</SheetTitle>
						</div>
						{allNotifications.length > 0 && (
							<span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
								{allNotifications.length}
							</span>
						)}
					</div>
					<SheetDescription className="text-xs text-muted-foreground">
						Team invitations and organization alerts.
					</SheetDescription>
				</SheetHeader>

				<PanAfricanDivider />

				<SheetBody className="flex-1 overflow-y-auto p-0 px-0 md:px-0 py-0 divide-y divide-border/60">
					{allNotifications.length === 0 ? (
						<div className="p-8">
							<EmptyState
								variant="message"
								title="All caught up!"
								description="You have no pending invitations or account notices right now."
							/>
						</div>
					) : (
						<div className="divide-y divide-border/60 bg-background w-full">
							{visibleItems.map((item) =>
								item.type === "alert" ? (
									<AlertNotificationItem
										key={item.id}
										alert={item.alert}
										onOpenChange={onOpenChange}
									/>
								) : (
									<InvitationNotificationItem
										key={item.id}
										invite={item.invite}
										isThisProcessing={processingInviteId === item.invite.id}
										isPending={isPending}
										onAccept={handleAccept}
										onDecline={handleDecline}
									/>
								),
							)}

							{hasMore && (
								<Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
									<CollapsibleContent className="divide-y divide-border/60">
										{hiddenItems.map((item) =>
											item.type === "alert" ? (
												<AlertNotificationItem
													key={item.id}
													alert={item.alert}
													onOpenChange={onOpenChange}
												/>
											) : (
												<InvitationNotificationItem
													key={item.id}
													invite={item.invite}
													isThisProcessing={processingInviteId === item.invite.id}
													isPending={isPending}
													onAccept={handleAccept}
													onDecline={handleDecline}
												/>
											),
										)}
									</CollapsibleContent>
									<button
										type="button"
										onClick={() => setIsExpanded((prev) => !prev)}
										className="w-full py-3 px-5 text-xs font-medium text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 bg-muted/20 hover:bg-muted/40 transition-colors border-t border-border/60 cursor-pointer"
									>
										<span>
											{isExpanded
												? "Show fewer notifications"
												: `Show ${hiddenItems.length} more notification${hiddenItems.length > 1 ? "s" : ""}`}
										</span>
										<ChevronDown
											className={cn(
												"size-3.5 transition-transform duration-200",
												isExpanded && "rotate-180",
											)}
										/>
									</button>
								</Collapsible>
							)}
						</div>
					)}
				</SheetBody>
			</SheetContent>
		</Sheet>
	);
}
