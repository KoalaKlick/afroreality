"use client";
// src/components/organization/members/OrgMembersTable.tsx


import { useRouter } from 'next/navigation';
import type { ColumnDef } from "@tanstack/react-table";
import {
	getPaginationRowModel,
	getSortedRowModel,
} from "@tanstack/react-table";
import {
	Shield,
	ShieldCheck,
	UserMinus,
} from "lucide-react";
import { useCallback, useMemo, useTransition } from "react";
import { toast } from "sonner";
import { DataTableColumnHeader } from "@/components/common/data-table-column-header";
import { DataTablePagination } from "@/components/common/data-table-pagination";
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
	removeOrgMember,
	updateMemberRole,
} from "@/lib/server-functions/organization-members";
import { formatDate } from "@/lib/utils";

export interface OrgMember {
	id: string;
	userId: string;
	role: string;
	joinedAt: string;
	updatedAt: string;
	user: {
		id: string;
		fullName: string | null;
		email: string;
		avatarUrl: string | null;
		username: string | null;
	};
}

interface OrgMembersTableProps {
	readonly organizationId: string;
	readonly members: OrgMember[];
	readonly total: number;
	readonly currentUserId: string;
}

export function OrgMembersTable({
	organizationId,
	members,
	total,
	currentUserId,
}: OrgMembersTableProps) {
	const router = useRouter();
	const { canManageMembers } = usePermissions();
	const [isPending, startTransition] = useTransition();

	const handleRoleChange = useCallback(
		(targetUserId: string, newRole: "admin" | "member") => {
			startTransition(async () => {
				try {
					await updateMemberRole({
						data: { organizationId, targetUserId, role: newRole },
					});
					toast.success("Role updated successfully!");
					await router.refresh();
				} catch (error) {
					toast.error(
						error instanceof Error ? error.message : "Failed to update role.",
					);
				}
			});
		},
		[organizationId, router],
	);

	const handleRemove = useCallback(
		(targetUserId: string, name: string | null) => {
			if (!confirm(`Are you sure you want to remove ${name ?? "this member"}?`))
				return;
			startTransition(async () => {
				try {
					await removeOrgMember({ data: { organizationId, targetUserId } });
					toast.success("Member removed.");
					await router.refresh();
				} catch (error) {
					toast.error(
						error instanceof Error ? error.message : "Failed to remove member.",
					);
				}
			});
		},
		[organizationId, router],
	);

	const columns = useMemo<ColumnDef<OrgMember>[]>(
		() => [
			{
				accessorKey: "user.fullName",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Member" />
				),
				cell: ({ row }) => {
					const member = row.original;
					const isSelf = member.user?.id === currentUserId;
					return (
						<div className="flex items-center gap-3">
							<Avatar className="size-9 rounded-lg">
								<AvatarImage
									src={getAvatarUrl(member.user?.avatarUrl) ?? ""}
									alt={member.user?.fullName ?? "Member"}
								/>
								<AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
									{member.user?.fullName?.[0] || "U"}
								</AvatarFallback>
							</Avatar>
							<div>
								<p className="text-sm font-semibold">
									{member.user?.fullName || "Team Member"}
									{isSelf && (
										<span className="text-muted-foreground ml-1">(You)</span>
									)}
								</p>
								<p className="text-xs text-muted-foreground">
									{member.user?.email}
								</p>
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
					return (
						<StatusBadge variant={role} />
					);
				},
			},
			{
				accessorKey: "joinedAt",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Joined" />
				),
				cell: ({ row }) => {
					const joined = row.getValue("joinedAt") as string;
					return (
						<span className="text-sm text-muted-foreground">
							{formatDate(joined)}
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
					const member = row.original;
					const isTargetOwner = member.role === "owner";
					const isSelf = member.user?.id === currentUserId;
					if (isTargetOwner || isSelf) return null;
					return (
						<div className="flex items-center justify-end gap-1">
							{member.role === "member" ? (
								<Button
									size="sm"
									variant="ghost"
									onClick={() => handleRoleChange(member.userId, "admin")}
									disabled={isPending}
									title="Promote to Admin"
								>
									<ShieldCheck className="h-4 w-4" />
								</Button>
							) : (
								<Button
									size="sm"
									variant="ghost"
									onClick={() => handleRoleChange(member.userId, "member")}
									disabled={isPending}
									title="Demote to Member"
								>
									<Shield className="h-4 w-4" />
								</Button>
							)}
							<Button
								size="sm"
								variant="ghost"
								className="text-destructive hover:text-destructive"
								onClick={() =>
									handleRemove(member.userId, member.user?.fullName)
								}
								disabled={isPending}
								title="Remove Member"
							>
								<UserMinus className="h-4 w-4" />
							</Button>
						</div>
					);
				},
			},
		],
		[currentUserId, handleRoleChange, handleRemove, isPending, canManageMembers],
	);

	const table = useDataTable(members, columns, {
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
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
								title="No members"
								description="There are no members in this organization yet."
							/>
						}
					/>
				</div>
				<div className="flex items-center justify-between">
					<p className="text-sm text-muted-foreground">
						{table.getPaginationRowModel().rows.length} of {total} member(s)
					</p>
					<DataTablePagination table={table} />
				</div>
			</CardContent>
		</Card>
	);
}
