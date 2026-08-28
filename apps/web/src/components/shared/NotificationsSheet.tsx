"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell, Building2, Check, Loader2, X } from "lucide-react";
import { Avatar } from "@/components/image/Image";
import { EmptyState } from "@/components/shared/EmptyState";
import { PanAfricanDivider } from "@/components/shared/PanAficDivider";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
}

export interface NotificationsSheetProps<T extends NotificationInvitation = NotificationInvitation> {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly invitations?: T[];
	readonly pendingInvitations?: T[];
	readonly onInvitationsChange?: (invitations: T[]) => void;
}

export function NotificationsSheet<T extends NotificationInvitation = NotificationInvitation>({
	open,
	onOpenChange,
	invitations: propInvitations = [],
	pendingInvitations,
	onInvitationsChange,
}: NotificationsSheetProps<T>) {
	const router = useRouter();
	const initial = pendingInvitations || propInvitations || [];
	const [invitations, setInvitations] = useState<T[]>(initial as T[]);
	const [processingInviteId, setProcessingInviteId] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const handleAccept = (inviteId: string) => {
		setProcessingInviteId(inviteId);
		startTransition(async () => {
			try {
				await acceptOrgInvitation({ data: { invitationId: inviteId } });
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
				await declineOrgInvitation({ data: { invitationId: inviteId } });
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
						<Bell className="size-5 text-emerald-600" />
						<SheetTitle className="text-lg font-semibold">Notifications</SheetTitle>
					</div>
					<SheetDescription className="text-xs text-muted-foreground">
						Team invitations and organization alerts.
					</SheetDescription>
				</SheetHeader>

				<PanAfricanDivider />

				<SheetBody className="flex-1 overflow-y-auto p-6 space-y-4">
					{invitations.length === 0 ? (
						<EmptyState
							variant="message"
							title="All caught up!"
							description="You have no pending invitations or notifications right now."
						/>
					) : (
						invitations.map((invite) => {
							const isThisProcessing = processingInviteId === invite.id;
							return (
								<Card key={invite.id} className="border border-border/60 shadow-xs">
									<CardHeader className="p-4 flex flex-row items-center gap-3 space-y-0">
										<Avatar
											src={getOrgImageUrl(invite.organization.logoUrl)}
											alt={invite.organization.name}
											className="h-10 w-10 rounded-lg"
										/>
										<div className="flex-1 min-w-0">
											<CardTitle className="text-sm font-semibold truncate">
												{invite.organization.name}
											</CardTitle>
											<p className="text-xs text-muted-foreground capitalize">
												Invited you as <span className="font-medium text-foreground">{invite.role}</span>
											</p>
										</div>
									</CardHeader>
									<CardFooter className="p-4 pt-0 flex gap-2 justify-end">
										<Button
											size="sm"
											variant="outline"
											onClick={() => handleDecline(invite.id)}
											disabled={isThisProcessing || isPending}
											className="h-8 text-xs"
										>
											<X className="mr-1 size-3.5" /> Decline
										</Button>
										<Button
											size="sm"
											onClick={() => handleAccept(invite.id)}
											disabled={isThisProcessing || isPending}
											className="h-8 text-xs bg-emerald-500 hover:bg-emerald-600 text-white"
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
						})
					)}
				</SheetBody>
			</SheetContent>
		</Sheet>
	);
}
