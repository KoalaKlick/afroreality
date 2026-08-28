"use client";
// src/components/onboarding/PendingInvitationsStep.tsx
import { useState, useTransition } from "react";
import { CheckCircle, XCircle, Building2, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
	acceptOrgInvitation,
	declineOrgInvitation,
} from "@/lib/server-functions/organization-join";
import { completeOnboardingFlow } from "@/lib/server-functions/profile";
import { getOrgImageUrl } from "@/lib/image-url-utils";
import { getErrorMessage } from "@/lib/utils";

export interface PendingInvitationItem {
	id: string;
	role: string;
	organization: {
		id: string;
		name: string;
		slug: string;
		logoUrl?: string | null;
	};
}

interface PendingInvitationsStepProps {
	readonly invitations: PendingInvitationItem[];
	readonly username?: string | null;
	readonly fullName?: string | null;
	readonly onSkipToCreateOrg: () => void;
}

export function PendingInvitationsStep({
	invitations,
	username,
	fullName,
	onSkipToCreateOrg,
}: PendingInvitationsStepProps) {
	const [activeInvites, setActiveInvites] = useState(invitations);
	const [processingId, setProcessingId] = useState<string | null>(null);
	const [, startTransition] = useTransition();

	const handleAccept = (invite: PendingInvitationItem) => {
		setProcessingId(invite.id);
		startTransition(async () => {
			try {
				await acceptOrgInvitation({
					data: { invitationId: invite.id },
				});

				const fallbackUsername =
					username ||
					(invite.organization?.name
						? invite.organization.name.toLowerCase().replace(/[^a-z0-9_]/g, "") +
							"_" +
							invite.id.slice(0, 4)
						: "user_" + invite.id.slice(0, 6));

				// Mark profile onboarding complete if needed
				await completeOnboardingFlow({
					data: {
						username: fallbackUsername,
						fullName: fullName || "User",
					},
				}).catch(() => null);

				toast.success(`Joined ${invite.organization.name} successfully!`);
				window.location.href = `/dashboard?org=${invite.organization.id}`;
			} catch (err) {
				toast.error(getErrorMessage(err));
				setProcessingId(null);
			}
		});
	};

	const handleDecline = (inviteId: string) => {
		setProcessingId(inviteId);
		startTransition(async () => {
			try {
				await declineOrgInvitation({
					data: { invitationId: inviteId },
				});
				toast.info("Invitation declined.");
				const remaining = activeInvites.filter((i) => i.id !== inviteId);
				setActiveInvites(remaining);
				setProcessingId(null);
				if (remaining.length === 0) {
					onSkipToCreateOrg();
				}
			} catch (err) {
				toast.error(getErrorMessage(err));
				setProcessingId(null);
			}
		});
	};

	if (activeInvites.length === 0) {
		return null;
	}

	return (
		<div className="space-y-6 w-full text-center sm:text-left">
			<div className="space-y-2">
				<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
					<Mail className="size-3.5" />
					<span>Pending Invitations</span>
				</div>
				<h2 className="text-xl font-bold tracking-tight">
					You&apos;ve Been Invited!
				</h2>
				<p className="text-sm text-muted-foreground">
					You have pending team invitations to join existing organizations. Accept
					to jump straight to your dashboard.
				</p>
			</div>

			<div className="space-y-3">
				{activeInvites.map((invite) => {
					const logoUrl = getOrgImageUrl(invite.organization.logoUrl);
					const isProcessing = processingId === invite.id;

					return (
						<div
							key={invite.id}
							className="p-4 rounded-xl border bg-card flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs hover:border-primary/40 transition-colors"
						>
							<div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
								{logoUrl ? (
									<img
										src={logoUrl}
										alt={invite.organization.name}
										className="size-11 rounded-lg object-cover border shrink-0"
									/>
								) : (
									<div className="size-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
										<Building2 className="size-5" />
									</div>
								)}
								<div className="min-w-0 flex-1">
									<h4 className="font-bold text-sm truncate">
										{invite.organization.name}
									</h4>
									<div className="flex items-center gap-2 mt-0.5">
										<Badge variant="secondary" className="text-[10px] capitalize">
											Role: {invite.role}
										</Badge>
									</div>
								</div>
							</div>

							<div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => handleDecline(invite.id)}
									disabled={isProcessing}
									className="text-xs"
								>
									{isProcessing ? (
										<Loader2 className="size-3.5 animate-spin" />
									) : (
										<XCircle className="size-3.5 mr-1" />
									)}
									Decline
								</Button>
								<Button
									type="button"
									size="sm"
									onClick={() => handleAccept(invite)}
									disabled={isProcessing}
									className="text-xs"
								>
									{isProcessing ? (
										<Loader2 className="size-3.5 animate-spin mr-1" />
									) : (
										<CheckCircle className="size-3.5 mr-1" />
									)}
									Accept &amp; Join
								</Button>
							</div>
						</div>
					);
				})}
			</div>

			<div className="pt-2 border-t text-center">
				<button
					type="button"
					onClick={onSkipToCreateOrg}
					className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors underline"
				>
					Or create a new organization instead
				</button>
			</div>
		</div>
	);
}
