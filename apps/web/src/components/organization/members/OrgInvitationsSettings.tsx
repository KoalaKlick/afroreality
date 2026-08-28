"use client";
// src/components/organization/members/OrgInvitationsSettings.tsx

import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import {
	getPaginationRowModel,
	getSortedRowModel,
} from "@tanstack/react-table";
import { Loader2, MailCheck, Search, X } from "lucide-react";
import { useCallback, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { DataTableColumnHeader } from "@/components/common/data-table-column-header";
import { DataTablePagination } from "@/components/common/data-table-pagination";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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

	// Search and status filter
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");

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

	// Filtered list
	const filteredInvitations = useMemo(() => {
		return invitations.filter((inv) => {
			const effective = getEffectiveStatus(inv.status, inv.expiresAt);

			if (statusFilter !== "all" && effective !== statusFilter) {
				return false;
			}

			if (searchQuery.trim()) {
				const query = searchQuery.toLowerCase().trim();
				const emailMatch = inv.email?.toLowerCase().includes(query);
				const roleMatch = inv.role?.toLowerCase().includes(query);
				const inviterMatch = inv.inviter?.fullName?.toLowerCase().includes(query);
				return emailMatch || roleMatch || inviterMatch;
			}

			return true;
		});
	}, [invitations, searchQuery, statusFilter]);

	const columns = useMemo<ColumnDef<SentInvitation>[]>(
		() => [
			{
				accessorKey: "email",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Invitee" />
				),
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
								<p className="text-sm font-semibold">{inv.email}</p>
								{inv.inviter && (
									<p className="text-xs text-muted-foreground">
										by {inv.inviter.fullName || "Admin"}
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
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Role" />
				),
				cell: ({ row }) => {
					const role = row.getValue("role") as string;
					return <StatusBadge variant={role} />;
				},
			},
			{
				accessorKey: "status",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Status" />
				),
				cell: ({ row }) => {
					const inv = row.original;
					const effective = getEffectiveStatus(inv.status, inv.expiresAt);
					const variant =
						effective === "accepted"
							? "approved"
							: effective === "declined"
								? "rejected"
								: effective === "expired"
									? "closed"
									: effective;
					return <StatusBadge variant={variant} />;
				},
			},
			{
				accessorKey: "createdAt",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Date" />
				),
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
		[canManageMembers, handleCancel, handleResend, isPending],
	);

	const table = useDataTable(filteredInvitations, columns, {
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		enableRowSelection: false,
	});

	return (
		<Card>
			<CardContent className="pt-6 space-y-4">
				{/* Search & Filter Toolbar */}
				<div className="flex flex-col sm:flex-row items-center justify-between gap-3">
					<div className="relative w-full sm:w-72">
						<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search invitations by email..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-8 text-sm h-9 bg-background"
						/>
					</div>

					<div className="flex items-center gap-2 w-full sm:w-auto">
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="h-9 w-full sm:w-36 text-xs bg-background">
								<SelectValue placeholder="All Statuses" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Statuses</SelectItem>
								<SelectItem value="pending">Pending</SelectItem>
								<SelectItem value="accepted">Accepted</SelectItem>
								<SelectItem value="declined">Declined</SelectItem>
								<SelectItem value="expired">Expired</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Table Container */}
				<div className="rounded-md border bg-card overflow-hidden">
					<DataTable
						table={table}
						columnsCount={columns.length}
						emptyState={
							<EmptyState
								variant="message"
								title={
									searchQuery || statusFilter !== "all"
										? "No matching invitations"
										: "No invitations"
								}
								description={
									searchQuery || statusFilter !== "all"
										? "No sent invitations matched your search or status filter."
										: "No pending or past invitations for this organization."
								}
							/>
						}
					/>
				</div>

				<div className="flex flex-wrap items-center justify-between gap-3 pt-1">
					<p className="text-xs text-muted-foreground">
						Showing {table.getPaginationRowModel().rows.length} of {invitations.length} invitation(s)
					</p>
					<DataTablePagination table={table} />
				</div>
			</CardContent>
		</Card>
	);
}
