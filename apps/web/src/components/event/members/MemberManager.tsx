"use client";
// src/components/event/members/MemberManager.tsx

import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import {
	getPaginationRowModel,
	getSortedRowModel,
} from "@tanstack/react-table";
import {
	ClipboardCheck,
	Lock,
	Mail,
	QrCode,
	Send,
	Trash2,
	UserPlus,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { DataTableColumnHeader } from "@/components/common/data-table-column-header";
import { DataTablePagination } from "@/components/common/data-table-pagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/common/ConfirmDiscardDialog";
import { useDataTable } from "@/hooks/use-data-table";
import {
	addEventMember,
	bulkAddEventMembers,
	getEventMembers,
	markAttendance,
	removeEventMember,
	sendCodes,
	sendSingleCode,
	bulkRemoveEventMembers,
	bulkMarkAttendance,
} from "@/lib/server-functions/event-member";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { AddMemberDialog } from "./AddMemberDialog";
import { MarkAttendanceDialog } from "./MarkAttendanceDialog";

export interface EventMember {
	id: string;
	eventId: string;
	name: string;
	email: string | null;
	phone: string | null;
	uniqueCode: string;
	status: string;
	responses: Record<string, string> | null;
	createdAt: string;
	updatedAt: string;
}

interface MemberManagerProps {
	readonly eventId: string;
	readonly canEdit?: boolean;
	readonly isVotingStarted?: boolean;
}

const statusVariantMap: Record<string, "info" | "success" | "completed"> = {
	invited: "info",
	attended: "success",
	voted: "completed",
};

export function MemberManager({
	eventId,
	canEdit = true,
	isVotingStarted = false,
}: MemberManagerProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
	const [isSendCodesConfirmOpen, setIsSendCodesConfirmOpen] = useState(false);
	const [members, setMembers] = useState<EventMember[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState("");
	const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
	const [memberToDelete, setMemberToDelete] = useState<{
		id: string;
		name: string;
	} | null>(null);
	const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
	const [isBulkMarkConfirmOpen, setIsBulkMarkConfirmOpen] = useState(false);

	const fetchMembers = useCallback(
		async (p = 1, search = "") => {
			try {
				const result = await getEventMembers({
					data: {
						eventId,
						page: p,
						limit: 20,
						search: search || undefined,
					},
				});
				setMembers(result.items as unknown as EventMember[]);
				setTotal(result.total);
				setPage(p);
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to fetch members",
				);
			}
		},
		[eventId],
	);

	useEffect(() => {
		fetchMembers(1, searchQuery);
	}, [fetchMembers]);

	const handleAddMember = useCallback(
		async (data: { name: string; email: string; phone: string }) => {
			try {
				await addEventMember({
					data: {
						eventId,
						name: data.name,
						email: data.email || undefined,
						phone: data.phone || undefined,
					},
				});
				toast.success("Member added! Voting key sent to their email.");
				await fetchMembers(page, searchQuery);
				router.refresh();
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Failed to add member";
				toast.error(`Failed to add member: ${message}`);
			}
		},
		[eventId, fetchMembers, page, searchQuery, router],
	);

	const handleBulkAdd = useCallback(
		async (
			newMembers: Array<{ name: string; email: string; phone: string }>,
		) => {
			try {
				const result = await bulkAddEventMembers({
					data: {
						eventId,
						members: newMembers.map((m) => ({
							...m,
							email: m.email || undefined,
							phone: m.phone || undefined,
						})),
					},
				});
				toast.success(
					`${result.added} members added! Voting keys sent to their emails.`,
				);
				await fetchMembers(1, searchQuery);
				router.refresh();
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Failed to bulk add members";
				toast.error(`Failed to bulk add: ${message}`);
			}
		},
		[eventId, fetchMembers, searchQuery, router],
	);

	const handleRemove = useCallback(
		(memberId: string) => {
			if (isVotingStarted) {
				toast.error(
					"Cannot remove members once voting has started to maintain election integrity.",
				);
				return;
			}

			startTransition(async () => {
				try {
					await removeEventMember({ data: { memberId } });
					toast.success("Member removed.");
					await fetchMembers(page, searchQuery);
					router.refresh();
				} catch (error) {
					toast.error(
						error instanceof Error ? error.message : "Failed to remove member",
					);
				}
			});
		},
		[isVotingStarted, fetchMembers, page, searchQuery, router],
	);

	const handleMarkAttendance = useCallback(
		async (code: string) => {
			try {
				await markAttendance({ data: { eventId, uniqueCode: code } });
				toast.success("Attendance marked!");
				setIsAttendanceDialogOpen(false);
				await fetchMembers(page, searchQuery);
				router.refresh();
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to mark attendance",
				);
			}
		},
		[eventId, fetchMembers, page, searchQuery, router],
	);

	const handleSendSingleCode = useCallback(
		async (memberId: string) => {
			startTransition(async () => {
				try {
					const result = await sendSingleCode({ data: { memberId } });
					if (result.success) {
						toast.success("Voting key sent to member's email!");
					} else {
						toast.error(result.error || "Failed to send voting key");
					}
				} catch (error) {
					toast.error(
						error instanceof Error ? error.message : "Failed to send voting key",
					);
				}
			});
		},
		[],
	);

	const handleSendBulkCodes = useCallback(async () => {
		startTransition(async () => {
			try {
				const result = await sendCodes({ data: { eventId } });
				if (result.sent === 0 && result.total === 0) {
					toast.error("No members with email addresses found");
					return;
				}
				toast.success(
					`Voting keys sent to ${result.sent} of ${result.total} members!`,
				);
				setIsSendCodesConfirmOpen(false);
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to send keys",
				);
			}
		});
	}, [eventId]);

	const columns = useMemo<ColumnDef<EventMember>[]>(
		() => [
			{
				id: "select",
				header: ({ table }) => (
					<Checkbox
						checked={
							table.getIsAllPageRowsSelected() ||
							(table.getIsSomePageRowsSelected() && false)
						}
						onCheckedChange={(value: any) =>
							table.toggleAllPageRowsSelected(!!value)
						}
						aria-label="Select all"
					/>
				),
				cell: ({ row }) => (
					<Checkbox
						checked={row.getIsSelected()}
						onCheckedChange={(value: any) => row.toggleSelected(!!value)}
						aria-label="Select row"
					/>
				),
				enableSorting: false,
				enableHiding: false,
			},
			{
				accessorKey: "name",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Member / Voter" />
				),
				cell: ({ row }) => {
					const member = row.original;
					return (
						<div>
							<p className="text-sm font-semibold">{member.name}</p>
							<p className="text-xs text-muted-foreground">
								{member.email || member.phone || "No contact"}
							</p>
						</div>
					);
				},
				enableSorting: true,
			},
			{
				accessorKey: "uniqueCode",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Voter Key" />
				),
				cell: () => {
					return (
						<div className="flex items-center gap-2">
							<span className="text-xs font-mono text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md border border-border/50 select-none">
								••••••••••••
							</span>
							<Badge
								variant="outline"
								className="text-[10px] text-muted-foreground font-normal gap-1"
							>
								<Lock className="size-2.5" /> Confidential
							</Badge>
						</div>
					);
				},
				enableSorting: false,
			},
			{
				accessorKey: "status",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Status" />
				),
				cell: ({ row }) => {
					const status = row.getValue("status") as string;
					return (
						<StatusBadge
							variant={statusVariantMap[status] ?? "info"}
							text={status}
						/>
					);
				},
				enableSorting: true,
			},
			{
				accessorKey: "createdAt",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Added" />
				),
				cell: ({ row }) => (
					<span className="text-xs text-muted-foreground">
						{formatDate(row.getValue("createdAt") as string)}
					</span>
				),
				enableSorting: true,
			},
			{
				id: "actions",
				header: () => <span className="text-xs font-semibold">Actions</span>,
				cell: ({ row }) => {
					const member = row.original;
					return (
						<div className="flex items-center gap-1.5 justify-end">
							{member.email && (
								<Button
									variant="outline"
									size="sm"
									className="h-8 px-2 text-xs gap-1"
									onClick={() => handleSendSingleCode(member.id)}
									disabled={isPending}
									title="Email private voting key to this member"
								>
									<Send className="size-3" />
									Send Key
								</Button>
							)}

							{canEdit && (
								<Button
									variant="ghost"
									size="sm"
									className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
									disabled={isPending || isVotingStarted}
									onClick={() =>
										setMemberToDelete({ id: member.id, name: member.name })
									}
									title={
										isVotingStarted
											? "Members locked: voting is live"
											: "Remove member"
									}
								>
									<Trash2 className="size-4" />
								</Button>
							)}
						</div>
					);
				},
				enableSorting: false,
			},
		],
		[canEdit, handleSendSingleCode, isPending, isVotingStarted],
	);

	const table = useDataTable(members, columns as any, {
		pageCount: Math.ceil(total / 20),
		state: {
			pagination: { pageIndex: page - 1, pageSize: 20 },
			rowSelection,
		},
		onRowSelectionChange: setRowSelection,
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		manualPagination: true,
	});

	const selectedCount = Object.keys(rowSelection).filter(
		(k) => rowSelection[k],
	).length;

	const handleBulkRemove = () => {
		if (isVotingStarted) {
			toast.error(
				"Cannot remove members once voting has started to maintain election integrity.",
			);
			return;
		}

		const selectedMemberIds = Object.keys(rowSelection)
			.filter((k) => rowSelection[k])
			.map((idx) => members[parseInt(idx, 10)]?.id)
			.filter(Boolean) as string[];

		if (selectedMemberIds.length === 0) return;

		startTransition(async () => {
			try {
				await bulkRemoveEventMembers({ data: { memberIds: selectedMemberIds } });
				toast.success(`${selectedMemberIds.length} members removed.`);
				setRowSelection({});
				setIsBulkDeleteConfirmOpen(false);
				await fetchMembers(page, searchQuery);
				router.refresh();
			} catch (error) {
				toast.error(
					error instanceof Error
						? error.message
						: "Failed to remove selected members",
				);
			}
		});
	};

	const handleBulkAttendance = () => {
		const selectedMemberIds = Object.keys(rowSelection)
			.filter((k) => rowSelection[k])
			.map((idx) => members[parseInt(idx, 10)]?.id)
			.filter(Boolean) as string[];

		if (selectedMemberIds.length === 0) return;

		startTransition(async () => {
			try {
				await bulkMarkAttendance({ data: { memberIds: selectedMemberIds } });
				toast.success(
					`Attendance marked for ${selectedMemberIds.length} members.`,
				);
				setRowSelection({});
				setIsBulkMarkConfirmOpen(false);
				await fetchMembers(page, searchQuery);
				router.refresh();
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to mark attendance",
				);
			}
		});
	};

	return (
		<div className="space-y-6">
			{/* Voting Started Lock Warning Banner */}
			{isVotingStarted && (
				<div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 p-3.5 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
					<div className="flex items-center gap-2.5">
						<Lock className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
						<span>
							<strong>Electoral Member Lock Active:</strong> Voting has started
							for this event. In accordance with ballot integrity rules, registered
							voter members cannot be deleted from the system.
						</span>
					</div>
				</div>
			)}

			<Card className="border-border/80 shadow-xs">
				<CardContent className="p-6 space-y-6">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
						<div>
							<h3 className="text-lg font-bold text-foreground">
								Registered Members &amp; Voters
							</h3>
							<p className="text-xs text-muted-foreground">
								{total} total members registered · Keys are private &amp; confidential
							</p>
						</div>

						{canEdit && (
							<div className="flex flex-wrap items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									className="gap-1.5 text-xs"
									onClick={() => setIsAttendanceDialogOpen(true)}
								>
									<QrCode className="size-3.5" /> Mark Attendance
								</Button>

								<Button
									variant="outline"
									size="sm"
									className="gap-1.5 text-xs"
									onClick={() => setIsSendCodesConfirmOpen(true)}
									disabled={isPending || members.length === 0}
								>
									<Mail className="size-3.5" /> Email All Keys
								</Button>

								<Button
									size="sm"
									className="gap-1.5 text-xs font-semibold"
									onClick={() => setIsAddDialogOpen(true)}
								>
									<UserPlus className="size-3.5" /> Add Members
								</Button>
							</div>
						)}
					</div>

					{selectedCount > 0 && canEdit && (
						<div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs">
							<span className="font-semibold text-primary">
								{selectedCount} members selected
							</span>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									className="h-7 text-xs gap-1"
									onClick={() => setIsBulkMarkConfirmOpen(true)}
									disabled={isPending}
								>
									<ClipboardCheck className="size-3" /> Mark Attended
								</Button>
								<Button
									variant="destructive"
									size="sm"
									className="h-7 text-xs gap-1"
									disabled={isPending || isVotingStarted}
									onClick={() => setIsBulkDeleteConfirmOpen(true)}
								>
									<Trash2 className="size-3" /> Delete Selected
								</Button>
							</div>
						</div>
					)}

					<div className="rounded-md border bg-card mb-4">
						<DataTable
							table={table}
							columnsCount={columns.length}
							emptyState={
								<EmptyState
									variant="users"
									title="No members yet"
									description="Add members to this event to track attendance and participation."
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

			{/* Dialogs */}
			<AddMemberDialog
				open={isAddDialogOpen}
				onOpenChange={setIsAddDialogOpen}
				onAdd={handleAddMember}
				onBulkAdd={handleBulkAdd}
			/>

			<MarkAttendanceDialog
				open={isAttendanceDialogOpen}
				onOpenChange={setIsAttendanceDialogOpen}
				onMark={handleMarkAttendance}
			/>

			<ConfirmDialog
				open={!!memberToDelete}
				onOpenChange={(open) => !open && setMemberToDelete(null)}
				title="Remove Member?"
				description={`Are you sure you want to remove ${memberToDelete?.name}? This action cannot be undone.`}
				confirmText="Remove"
				variant="destructive"
				onConfirm={() => {
					if (memberToDelete) {
						handleRemove(memberToDelete.id);
						setMemberToDelete(null);
					}
				}}
			/>

			<ConfirmDialog
				open={isBulkDeleteConfirmOpen}
				onOpenChange={setIsBulkDeleteConfirmOpen}
				title={`Remove ${selectedCount} participant(s)?`}
				description="This will revoke access codes and delete all registration data for all selected participants. This action cannot be undone."
				confirmText="Delete"
				variant="destructive"
				onConfirm={handleBulkRemove}
			/>

			<ConfirmDialog
				open={isBulkMarkConfirmOpen}
				onOpenChange={setIsBulkMarkConfirmOpen}
				title={`Mark ${selectedCount} participant(s) as attended?`}
				description="This will update the status of all selected participants to attended."
				confirmText="Mark Attended"
				variant="primary"
				onConfirm={handleBulkAttendance}
			/>

			<ConfirmDialog
				open={isSendCodesConfirmOpen}
				onOpenChange={setIsSendCodesConfirmOpen}
				title="Send Voting Keys via Email"
				description="This will send an official email with the organization banner and confidential voting key to all registered members with email addresses. Continue?"
				confirmText="Send Keys"
				onConfirm={handleSendBulkCodes}
			/>
		</div>
	);
}
