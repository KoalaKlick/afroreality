"use client";
// src/components/organization/members/OrgInvitationsSettings.tsx


import { useRouter } from 'next/navigation';
import type { ColumnDef } from "@tanstack/react-table";
import { Loader2, MailCheck, X } from "lucide-react";
import { useCallback, useMemo, useTransition } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import { useDataTable } from "@/hooks/use-data-table";
import { usePermissions } from "@/hooks/use-permissions";
import { getAvatarUrl } from "@/lib/image-url-utils";
import {
	cancelInvitation,
	resendInvitation,
} from "@/lib/server-functions/organization-members";
import { formatDate } from "@/lib/utils";

export interface SentInvitation {
	id: string;
	organizationId: string;
	email: string;
	role: string;
	status: string;
	expiresAt: string | null;
	createdAt: string;
	respondedAt: string | null;
	inviter: {
		id: string;
		fullName: string | null;
		avatarUrl: string | null;
	} | null;
}

interface OrgInvitationsSettingsProps {
	readonly organizationId: string;
	readonly invitations: SentInvitation[];
}

function getEffectiveStatus(status: string, expiresAt: string | null): string {
	if (status === "pending" && expiresAt && new Date(expiresAt) < new Date()) {
		return "expired";
	}
	return status;
}

export function OrgInvitationsSettings({
	invitations,
}: OrgInvitationsSettingsProps) {
	const router = useRouter();
	const { canManageMembers } = usePermissions();
	const [isPending, startTransition] = useTransition();

	const handleCancel = useCallback(
		(invitationId: string) => {
			startTransition(async () => {
				try {
					await cancelInvitation({ data: { invitationId } });
					toast.success("Invitation cancelled.");
					await router.refresh();
				} catch (error) {
					toast.error(
						error instanceof Error
							? error.message
							: "Failed to cancel invitation.",
					);
				}
			});
		},
		[router],
	);

	const handleResend = useCallback(
		(invitationId: string) => {
			startTransition(async () => {
				try {
					await resendInvitation({ data: { invitationId } });
					toast.success("Invitation resent.");
					await router.refresh();
				} catch (error) {
					toast.error(
						error instanceof Error
							? error.message
							: "Failed to resend invitation.",
					);
				}
			});
		},
		[router],
	);

	const columns = useMemo<ColumnDef<SentInvitation>[]>(
		() => [
			{
				accessorKey: "email",
				header: () => <div>Invitee</div>,
				cell: ({ row }) => {
					const inv = row.original;
					return (
						<div className="flex items-center gap-3">
							<Avatar className="size-8 rounded-md">
								<AvatarImage
									src={getAvatarUrl(inv.inviter?.avatarUrl) ?? ""}
									alt={inv.email}
								/>
								<AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
									{inv.email?.[0] || "U"}
								</AvatarFallback>
							</Avatar>
							<div>
								<p className="font-medium text-sm truncate">{inv.email}</p>
								{inv.inviter && (
									<p className="text-xs text-muted-foreground">
										Invited by {inv.inviter.fullName ?? "Unknown"}
									</p>
								)}
							</div>
						</div>
					);
				},
				enableSorting: false,
			},
			{
				accessorKey: "role",
				header: () => <div>Role</div>,
				cell: ({ row }) => {
					const role = row.getValue("role") as string;
					return (
						<StatusBadge variant={role} />
					);
				},
			},
			{
				accessorKey: "status",
				header: () => <div>Status</div>,
				cell: ({ row }) => {
					const inv = row.original;
					const effective = getEffectiveStatus(inv.status, inv.expiresAt);
					const variant = effective === "accepted" ? "approved" : effective === "declined" ? "rejected" : effective === "expired" ? "closed" : effective;
					return (
						<StatusBadge variant={variant} />
					);
				},
			},
			{
				accessorKey: "createdAt",
				header: () => <div>Date</div>,
				cell: ({ row }) => {
					const inv = row.original;
					const date = inv.respondedAt ?? inv.createdAt;
					return (
						<span className="text-sm text-muted-foreground">
							{formatDate(date)}
						</span>
					);
				},
			},
			{
				id: "actions",
				header: () => <div className="text-right">Actions</div>,
				enableHiding: false,
				enableSorting: false,
				cell: ({ row }) => {
					if (!canManageMembers) return null;
					const inv = row.original;
					const effective = getEffectiveStatus(inv.status, inv.expiresAt);

					// Show resend for pending & expired, cancel only for pending
					const canResend =
						effective === "pending" || effective === "expired";
					const canCancel = effective === "pending";

					if (!canResend && !canCancel) return null;

					return (
						<div className="flex items-center justify-end gap-1">
							{canResend && (
								<Button
									size="sm"
									variant="ghost"
									className="text-primary hover:text-primary"
									onClick={() => handleResend(inv.id)}
									disabled={isPending}
									title="Resend Invitation"
								>
									{isPending ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<MailCheck className="h-4 w-4" />
									)}
								</Button>
							)}
							{canCancel && (
								<Button
									size="sm"
									variant="ghost"
									className="text-destructive hover:text-destructive"
									onClick={() => handleCancel(inv.id)}
									disabled={isPending}
									title="Cancel Invitation"
								>
									{isPending ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<X className="h-4 w-4" />
									)}
								</Button>
							)}
						</div>
					);
				},
			},
		],
		[isPending, handleCancel, handleResend, canManageMembers],
	);

	const table = useDataTable(invitations, columns, {
		enableRowSelection: false,
	});

	return (
		<Card>
			<CardContent className="pt-6">
				<div className="rounded-md border bg-card mb-4">
					<DataTable
						table={table}
						columnsCount={columns.length}
						emptyState={
							<EmptyState
								variant="users"
								title="No invitations sent"
								description="Invite team members from the Members tab."
							/>
						}
					/>
				</div>
				<div className="flex items-center justify-between">
					<p className="text-sm text-muted-foreground">
						{table.getRowModel().rows.length} of {invitations.length} invitation(s)
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
