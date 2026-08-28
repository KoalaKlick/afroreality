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
	Mail,
	QrCode,
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
import { AddMemberDialog } from "./AddMemberDialog";
import { MarkAttendanceDialog } from "./MarkAttendanceDialog";
import { RegistrationFieldManager } from "./RegistrationFieldManager";

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
}

const statusVariantMap: Record<string, "info" | "success" | "completed"> = {
	invited: "info",
	attended: "success",
	voted: "completed",
};

export function MemberManager({ eventId, canEdit = true }: MemberManagerProps) {
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
	const [memberToDelete, setMemberToDelete] = useState<{ id: string; name: string } | null>(null);
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
				const result = await addEventMember({
					data: {
						eventId,
						name: data.name,
						email: data.email || undefined,
						phone: data.phone || undefined,
					},
				});
				console.log("[DEBUG] addEventMember result:", result);
				toast.success("Member added successfully!");
				await fetchMembers(page, searchQuery);
				router.refresh();
			} catch (error) {
				console.error("[DEBUG] addEventMember error:", error);
				const message = error instanceof Error ? error.message : "Failed to add member";
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
				console.log("[DEBUG] bulkAddEventMembers result:", result);
				toast.success(`${result.added} members added successfully!`);
				await fetchMembers(1, searchQuery);
				router.refresh();
			} catch (error) {
				console.error("[DEBUG] bulkAddEventMembers error:", error);
				const message = error instanceof Error ? error.message : "Failed to bulk add members";
				toast.error(`Failed to bulk add: ${message}`);
			}
		},
		[eventId, fetchMembers, searchQuery, router],
	);

	const handleRemove = useCallback(
		(memberId: string) => {
			startTransition(async () => {
				try {
					await removeEventMember({ data: { memberId } });
					toast.success("Member removed.");
					await fetchMembers(page, searchQuery);
					await router.refresh();
				} catch (error) {
					toast.error(
						error instanceof Error ? error.message : "Failed to remove member",
					);
				}
			});
		},
		[fetchMembers, page, searchQuery, router],
	);

	const handleMarkAttendance = useCallback(
		async (code: string) => {
			try {
				await markAttendance({ data: { eventId, uniqueCode: code } });
				toast.success("Attendance marked!");
				setIsAttendanceDialogOpen(false);
				await fetchMembers(page, searchQuery);
				await router.refresh();
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to mark attendance",
				);
			}
		},
		[eventId, fetchMembers, page, searchQuery, router],
	);

	const handleCopyCode = useCallback((code: string) => {
		navigator.clipboard.writeText(code);
		toast.success("Code copied to clipboard!");
	}, []);

	const handleSendSingleCode = useCallback(
		async (memberId: string) => {
			try {
				const result = await sendSingleCode({ data: { memberId } });
				if (result.success) {
					toast.success("Code sent successfully");
				} else {
					toast.error("Failed to send code");
				}
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to send code",
				);
			}
		},
		[],
	);

	const handleSendBulkCodes = useCallback(async () => {
		try {
			const result = await sendCodes({ data: { eventId } });
			if (result.sent === 0 && result.total === 0) {
				toast.error("No members with email addresses found");
				return;
			}
			toast.success(`Codes sent to ${result.sent} of ${result.total} members`);
			setIsSendCodesConfirmOpen(false);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to send codes",
			);
		}
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
						onCheckedChange={(value: any) => table.toggleAllPageRowsSelected(!!value)}
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
					<DataTableColumnHeader column={column} title="Name" />
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
					<DataTableColumnHeader column={column} title="Code" />
				),
				cell: ({ row }) => {
					const code = row.getValue("uniqueCode") as string;
					return (
						<div className="flex items-center gap-2">
							<code className="px-2 py-1 bg-muted rounded text-sm font-mono">
								{code}
							</code>
							<Button
								size="icon"
								variant="ghost"
								className="size-6"
								onClick={() => handleCopyCode(code)}
								title="Copy code"
							>
								<ClipboardCheck className="size-3" />
							</Button>
						</div>
					);
				},
			},
			{
				accessorKey: "status",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Status" />
				),
				cell: ({ row }) => {
					const status = row.getValue("status") as string;
					const variant = statusVariantMap[status] || "info";
					return (
						<StatusBadge
							variant={variant}
							text={status}
							size="sm"
						/>
					);
				},
			},
			{
				accessorKey: "createdAt",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Added" />
				),
				cell: ({ row }) => {
					const date = row.getValue("createdAt") as string;
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
					if (!canEdit) return null;
					const member = row.original;
					return (
						<div className="flex items-center justify-end gap-1">
							{member.email && (
								<Button
									size="sm"
									variant="ghost"
									onClick={() => handleSendSingleCode(member.id)}
									disabled={isPending}
									title="Send access code via email"
								>
									<Mail className="size-4" />
								</Button>
							)}
							<Button
								size="sm"
								variant="ghost"
								className="text-destructive hover:text-destructive"
								onClick={() => setMemberToDelete({ id: member.id, name: member.name })}
								disabled={isPending}
								title="Remove member"
							>
								<Trash2 className="size-4" />
							</Button>
						</div>
					);
				},
			},
		],
		[canEdit, setMemberToDelete, isPending, handleCopyCode, handleSendSingleCode],
	);

	const table = useDataTable(members, columns, {
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
		state: {
			rowSelection,
		},
	});

	const selectedRows = table.getSelectedRowModel().flatRows;
	const selectedCount = selectedRows.length;

	const handleBulkDelete = useCallback(async () => {
		const memberIds = selectedRows.map((r) => r.original.id);
		if (memberIds.length === 0) return;
		startTransition(async () => {
			try {
				await bulkRemoveEventMembers({ data: { memberIds } });
				toast.success("Selected members removed.");
				setRowSelection({});
				setIsBulkDeleteConfirmOpen(false);
				await fetchMembers(page, searchQuery);
				await router.refresh();
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to remove selected members",
				);
			}
		});
	}, [selectedRows, fetchMembers, page, searchQuery, router]);

	const handleBulkMarkAttendance = useCallback(async () => {
		const memberIds = selectedRows.map((r) => r.original.id);
		if (memberIds.length === 0) return;
		startTransition(async () => {
			try {
				await bulkMarkAttendance({ data: { eventId, memberIds } });
				toast.success("Attendance marked for selected members.");
				setRowSelection({});
				setIsBulkMarkConfirmOpen(false);
				await fetchMembers(page, searchQuery);
				await router.refresh();
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to mark attendance",
				);
			}
		});
	}, [eventId, selectedRows, fetchMembers, page, searchQuery, router]);

	return (
		<div className="space-y-4">
			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center justify-between gap-4 mb-4">
						<input
							type="search"
							placeholder="Search members..."
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value);
								fetchMembers(1, e.target.value);
							}}
							className="flex h-9 w-full max-w-sm rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						/>
						{canEdit && (
							<div className="flex items-center gap-2 flex-shrink-0">
								<RegistrationFieldManager eventId={eventId} canEdit={canEdit} />
								<Button
									size="sm"
									variant="outline"
									onClick={() => setIsSendCodesConfirmOpen(true)}
									className="gap-1.5"
								>
									<Mail className="size-4" />
									Send Codes
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={() => setIsAttendanceDialogOpen(true)}
									className="gap-1.5"
								>
									<QrCode className="size-4" />
									Attendance
								</Button>
								<Button
									size="sm"
									onClick={() => setIsAddDialogOpen(true)}
									className="gap-1.5"
								>
									<UserPlus className="size-4" />
									Add Member
								</Button>
							</div>
						)}
					</div>
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

			<SendCodesConfirmDialog
				open={isSendCodesConfirmOpen}
				onOpenChange={setIsSendCodesConfirmOpen}
				onConfirm={handleSendBulkCodes}
				memberCount={total}
			/>

			{selectedCount > 0 && (
				<div className="fixed bottom-6 right-6 z-50 bg-background border rounded-xl shadow-xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 border-primary/20">
					<div className="text-sm font-medium">
						<span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-bold mr-2">
							{selectedCount}
						</span>
						selected
					</div>
					<div className="h-4 w-[1px] bg-border" />
					<div className="flex items-center gap-2">
						<Button
							size="sm"
							variant="outline"
							className="gap-1.5"
							onClick={() => setIsBulkMarkConfirmOpen(true)}
							disabled={isPending}
						>
							<QrCode className="size-4" />
							Mark Attended
						</Button>
						<Button
							size="sm"
							variant="destructive"
							className="gap-1.5"
							onClick={() => setIsBulkDeleteConfirmOpen(true)}
							disabled={isPending}
						>
							<Trash2 className="size-4" />
							Delete
						</Button>
					</div>
				</div>
			)}

			<ConfirmDialog
				open={memberToDelete !== null}
				onOpenChange={(open) => !open && setMemberToDelete(null)}
				onConfirm={() => {
					if (memberToDelete) {
						handleRemove(memberToDelete.id);
						setMemberToDelete(null);
					}
				}}
				title="Remove Member?"
				description={`Are you sure you want to remove ${memberToDelete?.name}? This action cannot be undone.`}
				confirmText="Remove"
				variant="destructive"
			/>

			<ConfirmDialog
				open={isBulkDeleteConfirmOpen}
				onOpenChange={setIsBulkDeleteConfirmOpen}
				onConfirm={handleBulkDelete}
				title={`Remove ${selectedCount} participant(s)?`}
				description="This will revoke access codes and delete all registration data for all selected participants. This action cannot be undone."
				confirmText="Delete"
				variant="destructive"
			/>

			<ConfirmDialog
				open={isBulkMarkConfirmOpen}
				onOpenChange={setIsBulkMarkConfirmOpen}
				onConfirm={handleBulkMarkAttendance}
				title={`Mark ${selectedCount} participant(s) as attended?`}
				description="This will update the status of all selected participants to attended."
				confirmText="Mark Attended"
				variant="primary"
			/>
		</div>
	);
}

function SendCodesConfirmDialog({
	open,
	onOpenChange,
	onConfirm,
	memberCount,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	memberCount: number;
}) {
	const [isPending, startTransition] = useTransition();

	return (
		<div
			role="dialog"
			aria-modal="true"
			className={open ? "fixed inset-0 z-50 flex items-center justify-center bg-black/50" : "hidden"}
			onClick={() => onOpenChange(false)}
		>
			<div
				className="bg-background rounded-lg shadow-lg p-6 max-w-md w-full mx-4"
				onClick={(e) => e.stopPropagation()}
			>
				<h3 className="text-lg font-semibold mb-2">Send Bulk Codes?</h3>
				<p className="text-sm text-muted-foreground mb-4">
					This will send access codes to ALL {memberCount} participants who have an
					email address. This action cannot be undone.
				</p>
				<div className="flex justify-end gap-2">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={() => startTransition(onConfirm)} disabled={isPending}>
						{isPending ? "Sending..." : "Send Codes"}
					</Button>
				</div>
			</div>
		</div>
	);
}
