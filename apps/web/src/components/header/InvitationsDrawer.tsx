"use client";
// src/components/header/InvitationsDrawer.tsx

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, Check, ChevronDown, ChevronUp, Loader2, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
} from "@/components/ui/sheet";
import { getOrgImageUrl } from "@/lib/image-url-utils";
import {
	acceptOrgInvitation,
	declineOrgInvitation,
} from "@/lib/server-functions/organization-join";
import { getErrorMessage } from "@/lib/utils";

export interface PendingInvitationItem {
	id: string;
	email: string;
	role: string;
	createdAt: string;
	expiresAt: string | null;
	organization: {
		id: string;
		name: string;
		slug: string;
		logoUrl: string | null;
	};
}

interface InvitationsDrawerProps {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly invitations?: PendingInvitationItem[];
}

export function InvitationsDrawer({
	open,
	onOpenChange,
	invitations = [],
}: InvitationsDrawerProps) {
	const router = useRouter();
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const [activeId, setActiveId] = useState<string | null>(null);

	function handleAccept(invitationId: string) {
		setActiveId(invitationId);
		startTransition(async () => {
			try {
				await acceptOrgInvitation({ data: { invitationId } });
				toast.success("Invitation accepted! Organization added to your list.");
				await router.refresh();
				onOpenChange(false);
			} catch (err) {
				toast.error(getErrorMessage(err));
			} finally {
				setActiveId(null);
			}
		});
	}

	function handleDecline(invitationId: string) {
		setActiveId(invitationId);
		startTransition(async () => {
			try {
				await declineOrgInvitation({ data: { invitationId } });
				toast.success("Invitation declined.");
				await router.refresh();
			} catch (err) {
				toast.error(getErrorMessage(err));
			} finally {
				setActiveId(null);
			}
		});
	}

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full bg-background border-l">
				{/* Header */}
				<div className="h-16 flex items-center justify-between px-5 border-b border-border/50 shrink-0">
					<div className="flex items-center gap-2.5">
						<div className="p-2 rounded-xl bg-primary/10 text-primary">
							<Mail className="size-4" />
						</div>
						<div>
							<h2 className="text-sm font-bold text-foreground flex items-center gap-2">
								Pending Invitations
								{invitations.length > 0 && (
									<span className="text-[11px] font-bold text-white bg-primary rounded-full min-w-5 h-5 px-1.5 inline-flex items-center justify-center">
										{invitations.length}
									</span>
								)}
							</h2>
							<p className="text-xs text-muted-foreground">
								Organization invites waiting for your response
							</p>
						</div>
					</div>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-4 space-y-3">
					{invitations.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
							<div className="size-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
								<Mail className="size-6 opacity-40" />
							</div>
							<p className="text-sm font-semibold">No pending invitations</p>
							<p className="text-xs mt-1 text-muted-foreground/70">
								You're all caught up! New org invites will appear here.
							</p>
						</div>
					) : (
						invitations.map((inv) => {
							const isExpanded = expandedId === inv.id;
							const logoUrl = getOrgImageUrl(inv.organization.logoUrl);
							const isActionPending = isPending && activeId === inv.id;

							return (
								<div
									key={inv.id}
									className="rounded-xl border border-border/60 bg-card overflow-hidden transition-all duration-200 hover:border-primary/30 shadow-xs"
								>
									{/* Card Header */}
									<button
										type="button"
										onClick={() => setExpandedId(isExpanded ? null : inv.id)}
										className="w-full flex items-center gap-3 p-3.5 text-left transition-colors hover:bg-muted/30"
									>
										<div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden border border-primary/10">
											{logoUrl ? (
												<img
													src={logoUrl}
													alt={inv.organization.name}
													className="size-full object-cover rounded-xl"
												/>
											) : (
												<Building2 className="size-5 text-primary" />
											)}
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-xs font-bold text-foreground truncate">
												{inv.organization.name}
											</p>
											<p className="text-[11px] text-muted-foreground mt-0.5">
												Role: <span className="capitalize font-semibold text-foreground">{inv.role}</span>
											</p>
										</div>
										{isExpanded ? (
											<ChevronUp className="size-4 text-muted-foreground shrink-0" />
										) : (
											<ChevronDown className="size-4 text-muted-foreground shrink-0" />
										)}
									</button>

									{/* Expanded Actions & Info */}
									{isExpanded && (
										<div className="px-3.5 pb-3.5 pt-2 space-y-3 border-t border-border/40 bg-muted/20 animate-in slide-in-from-top-1 duration-150">
											<div className="grid grid-cols-2 gap-2 text-xs">
												<div>
													<span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Assigned Role</span>
													<p className="font-semibold capitalize text-foreground">{inv.role}</p>
												</div>
												<div>
													<span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Date Sent</span>
													<p className="font-semibold text-foreground">
														{new Date(inv.createdAt).toLocaleDateString()}
													</p>
												</div>
											</div>

											<div className="flex gap-2 pt-1">
												<Button
													variant="outline"
													size="sm"
													className="flex-1 text-xs h-8 text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
													onClick={() => handleDecline(inv.id)}
													disabled={isPending}
												>
													{isActionPending ? (
														<Loader2 className="size-3.5 animate-spin mr-1.5" />
													) : (
														<X className="size-3.5 mr-1.5" />
													)}
													Decline
												</Button>
												<Button
													size="sm"
													className="flex-1 text-xs h-8 bg-primary hover:bg-primary/90 text-white font-medium"
													onClick={() => handleAccept(inv.id)}
													disabled={isPending}
												>
													{isActionPending ? (
														<Loader2 className="size-3.5 animate-spin mr-1.5" />
													) : (
														<Check className="size-3.5 mr-1.5" />
													)}
													Accept
												</Button>
											</div>
										</div>
									)}
								</div>
							);
						})
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
