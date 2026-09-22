"use client";
// src/components/organization/members/InviteMemberDialog.tsx


import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck } from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteOrgMember } from "@/lib/server-functions/organization-members";
import { FEXTIVA_SUPER_ADMIN_EMAIL } from "@/lib/constants/branding";
import { cn } from "@/lib/utils";

interface InviteMemberDialogProps {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly organizationId: string;
	readonly initialEmail?: string;
	readonly initialRole?: "member" | "admin";
}

const roleSelectorStyles = (selected: boolean) =>
	cn(
		"px-3 py-1.5 rounded-md border text-xs font-semibold transition-all",
		selected
			? "border-primary bg-primary/10 text-primary"
			: "border-border opacity-40 hover:opacity-70",
	);

export function InviteMemberDialog({
	open,
	onOpenChange,
	organizationId,
	initialEmail = "",
	initialRole = "member",
}: InviteMemberDialogProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [inviteEmail, setInviteEmail] = useState(initialEmail);
	const [inviteRole, setInviteRole] = useState<"member" | "admin">(initialRole);

	useEffect(() => {
		if (open) {
			setInviteEmail(initialEmail);
			setInviteRole(initialRole);
		}
	}, [open, initialEmail, initialRole]);

	const handleInvite = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!inviteEmail.trim()) return;
		startTransition(async () => {
			try {
				const result = await inviteOrgMember({
					data: {
						organizationId,
						email: inviteEmail.trim(),
						role: inviteRole,
					},
				});
				if (!result.success) {
					toast.error(result.error);
					return;
				}
				toast.success(`Invitation sent to ${inviteEmail}!`);
				setInviteEmail("");
				onOpenChange(false);
				await router.refresh();
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to send invitation.",
				);
			}
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Invite a Member</DialogTitle>
				</DialogHeader>
				<div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs">
					<div className="flex items-center gap-2.5">
						<div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
							<ShieldCheck className="size-4" />
						</div>
						<div>
							<p className="font-semibold text-foreground">Fextiva Super Admin</p>
							<p className="text-[11px] text-muted-foreground">{FEXTIVA_SUPER_ADMIN_EMAIL}</p>
						</div>
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => {
							setInviteEmail(FEXTIVA_SUPER_ADMIN_EMAIL);
							setInviteRole("admin");
						}}
						className="h-7 text-xs font-semibold border-primary/40 text-primary hover:bg-primary/10 hover:border-primary"
					>
						Quick Fill
					</Button>
				</div>
				<form onSubmit={handleInvite} className="space-y-4 mt-1">
					<div className="space-y-2">
						<Label htmlFor="invite-email">Email Address</Label>
						<Input
							id="invite-email"
							type="email"
							value={inviteEmail}
							onChange={(e) => setInviteEmail(e.target.value)}
							placeholder="user@example.com"
							required
						/>
					</div>
					<div className="flex items-center gap-2">
						<Label>Role</Label>
						<button
							type="button"
							onClick={() => setInviteRole("member")}
							className={roleSelectorStyles(inviteRole === "member")}
						>
							Member
						</button>
						<button
							type="button"
							onClick={() => setInviteRole("admin")}
							className={roleSelectorStyles(inviteRole === "admin")}
						>
							Admin
						</button>
					</div>
					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Send Invite
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
