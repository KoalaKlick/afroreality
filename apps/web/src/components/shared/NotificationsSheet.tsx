"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell, Building2, Check, Loader2, X, ShieldAlert, CheckCircle2, Lock, ArrowRight, AlertTriangle } from "lucide-react";
import { Avatar } from "@/components/image/Image";
import { EmptyState } from "@/components/shared/EmptyState";
import { PanAfricanDivider } from "@/components/shared/PanAficDivider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Sheet,
	SheetBody,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
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
	organization: {
		id: string;
		name: string;
		slug?: string;
		logoUrl: string | null;
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

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="w-full sm:max-w-md font-poppins flex flex-col p-0">
				<SheetHeader className="p-6 border-b border-border/40">
					<div className="flex items-center gap-2">
						<Bell className="size-5 text-primary" />
						<SheetTitle className="text-lg font-semibold">Notifications</SheetTitle>
					</div>
					<SheetDescription className="text-xs text-muted-foreground">
						Team invitations and organization alerts.
					</SheetDescription>
				</SheetHeader>

				<PanAfricanDivider />

				<SheetBody className="flex-1 overflow-y-auto p-5 space-y-6">
					{alerts.length === 0 && invitations.length === 0 ? (
						<EmptyState
							variant="message"
							title="All caught up!"
							description="You have no pending invitations or account notices right now."
						/>
					) : (
						<>
							{/* Section 1: Platform & Account Notices (Account freezing, unfreezing, etc.) */}
							{alerts.length > 0 && (
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
											<ShieldAlert className="size-3.5 text-destructive" />
											Account & Security Notices
										</span>
										<Badge variant="outline" className="text-[10px] font-bold border-destructive/40 text-destructive bg-destructive/10">
											{alerts.length} Alert{alerts.length === 1 ? "" : "s"}
										</Badge>
									</div>

									{alerts.map((alert) => {
										const isFrozen = alert.type === "wallet_frozen";
										return (
											<Card
												key={alert.id}
												className={`border shadow-xs ${
													isFrozen
														? "border-destructive/50 bg-destructive/5 dark:bg-destructive/10"
														: "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10"
												}`}
											>
												<CardHeader className="p-4 pb-2 space-y-2">
													<div className="flex items-start justify-between gap-2">
														<div className="flex items-center gap-2">
															{isFrozen ? (
																<div className="size-8 rounded-lg bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
																	<ShieldAlert className="size-4.5" />
																</div>
															) : (
																<div className="size-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
																	<CheckCircle2 className="size-4.5" />
																</div>
															)}
															<div>
																<CardTitle className="text-sm font-bold text-foreground">
																	{alert.title}
																</CardTitle>
																{alert.organization && (
																	<p className="text-xs text-muted-foreground font-medium">
																		Org: {alert.organization.name}
																	</p>
																)}
															</div>
														</div>
														<Badge
															variant={isFrozen ? "destructive" : "outline"}
															className={`text-[9px] font-bold uppercase tracking-wider ${
																!isFrozen && "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
															}`}
														>
															{isFrozen ? "Restricted" : "Restored"}
														</Badge>
													</div>
												</CardHeader>

												<CardContent className="p-4 pt-1 space-y-2 text-xs">
													<p className="text-muted-foreground leading-relaxed">
														{alert.message}
													</p>

													{alert.reason && (
														<div className="p-2.5 rounded-md bg-background/80 border border-destructive/30 space-y-1">
															<span className="text-[10px] font-bold uppercase tracking-wider text-destructive block">
																Official Reason from Administration:
															</span>
															<p className="text-xs font-semibold text-foreground">
																{alert.reason}
															</p>
														</div>
													)}

													<div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
														<span>
															{new Date(alert.createdAt).toLocaleString(undefined, {
																dateStyle: "medium",
																timeStyle: "short",
															})}
														</span>
														{isFrozen && (
															<span className="font-semibold text-destructive flex items-center gap-1">
																<Lock className="size-3" /> Payouts Halted
															</span>
														)}
													</div>
												</CardContent>

												<CardFooter className="p-4 pt-0 flex justify-end">
													<Button
														size="sm"
														variant={isFrozen ? "default" : "outline"}
														onClick={() => {
															onOpenChange(false);
															router.push(alert.actionUrl || "/organization/wallet");
														}}
														className={`h-8 text-xs font-semibold ${
															isFrozen ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : ""
														}`}
													>
														<span>Open Organization Wallet</span>
														<ArrowRight className="ml-1.5 size-3.5" />
													</Button>
												</CardFooter>
											</Card>
										);
									})}
								</div>
							)}

							{/* Section 2: Team Invitations */}
							{invitations.length > 0 && (
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
											<Building2 className="size-3.5 text-primary" />
											Team Invitations
										</span>
										<Badge variant="outline" className="text-[10px] font-bold border-border">
											{invitations.length} Pending
										</Badge>
									</div>

									{invitations.map((invite) => {
										const isThisProcessing = processingInviteId === invite.id;
										const logoUrl = getOrgImageUrl(invite.organization.logoUrl);

										return (
											<Card key={invite.id} className="border border-border/60 shadow-xs">
												<CardHeader className="p-4 flex flex-row items-center gap-3 space-y-0">
													{logoUrl ? (
														<Avatar
															src={logoUrl}
															alt={invite.organization.name}
															className="h-10 w-10 rounded-lg object-cover"
														/>
													) : (
														<div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
															<Building2 className="size-5" />
														</div>
													)}
													<div className="flex-1 min-w-0">
														<CardTitle className="text-sm font-semibold truncate">
															{invite.organization.name}
														</CardTitle>
														<p className="text-xs text-muted-foreground capitalize">
															Invited you as <span className="font-medium text-foreground">{invite.role}</span>
														</p>
														{invite.inviter?.fullName && (
															<p className="text-[11px] text-muted-foreground/80 mt-0.5 truncate">
																From: {invite.inviter.fullName}
															</p>
														)}
													</div>
												</CardHeader>
												<CardFooter className="p-4 pt-0 flex gap-2 justify-end">
													<Button
														size="sm"
														variant="outline"
														onClick={() => handleDecline(invite.id)}
														disabled={isThisProcessing || isPending}
														className="h-8 text-xs cursor-pointer"
													>
														<X className="mr-1 size-3.5" /> Decline
													</Button>
													<Button
														size="sm"
														onClick={() => handleAccept(invite.id)}
														disabled={isThisProcessing || isPending}
														className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
													>
														{isThisProcessing ? (
															<Loader2 className="size-3.5 animate-spin" />
														) : (
															<>
																<Check className="mr-1 size-3.5" /> Accept
															</>
														)}
													</Button>
												</CardFooter>
											</Card>
										);
									})}
								</div>
							)}
						</>
					)}
				</SheetBody>
			</SheetContent>
		</Sheet>
	);
}
