"use client";
// src/components/organization/members/OrgMembersTable.tsx

import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import {
	getPaginationRowModel,
	getSortedRowModel,
} from "@tanstack/react-table";
import {
	Search,
	Shield,
	ShieldCheck,
	UserMinus,
	Users,
} from "lucide-react";
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

	// Search and Filter state
	const [searchQuery, setSearchQuery] = useState("");
	const [roleFilter, setRoleFilter] = useState<string>("all");

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

	// Filtered list
	const filteredMembers = useMemo(() => {
		return members.filter((member) => {
			// Role Filter
			if (roleFilter !== "all" && member.role !== roleFilter) {
				return false;
			}

			// Search Query
			if (searchQuery.trim()) {
				const query = searchQuery.toLowerCase().trim();
				const nameMatch = member.user?.fullName?.toLowerCase().includes(query);
				const emailMatch = member.user?.email?.toLowerCase().includes(query);
				const usernameMatch = member.user?.username?.toLowerCase().includes(query);
				const roleMatch = member.role?.toLowerCase().includes(query);
				return nameMatch || emailMatch || usernameMatch || roleMatch;
			}

			return true;
		});
	}, [members, searchQuery, roleFilter]);

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
										<span className="text-muted-foreground text-xs ml-1">(You)</span>
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
					return <StatusBadge variant={role} />;
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

	const table = useDataTable(filteredMembers, columns, {
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
							placeholder="Search members by name, email..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-8 text-sm h-9 bg-background"
						/>
					</div>

					<div className="flex items-center gap-2 w-full sm:w-auto">
						<Select value={roleFilter} onValueChange={setRoleFilter}>
							<SelectTrigger className="h-9 w-full sm:w-36 text-xs bg-background">
								<SelectValue placeholder="All Roles" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Roles</SelectItem>
								<SelectItem value="owner">Owner</SelectItem>
								<SelectItem value="admin">Admin</SelectItem>
								<SelectItem value="member">Member</SelectItem>
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
								variant="users"
								title={searchQuery || roleFilter !== "all" ? "No matching members" : "No members"}
								description={
									searchQuery || roleFilter !== "all"
										? "No team members matched your search or role filter."
										: "There are no members in this organization yet."
								}
							/>
						}
					/>
				</div>

				<div className="flex flex-wrap items-center justify-between gap-3 pt-1">
					<p className="text-xs text-muted-foreground">
						Showing {table.getPaginationRowModel().rows.length} of {total} member(s)
					</p>
					<DataTablePagination table={table} />
				</div>
			</CardContent>
		</Card>
	);
}
