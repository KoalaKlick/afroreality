"use client";
// src/components/organization/wallet/PayoutsHistoryTable.tsx

import type { ColumnDef } from "@tanstack/react-table";
import {
	getPaginationRowModel,
	getSortedRowModel,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProviderLogo, getProviderFriendlyName } from "@/components/shared/ProviderLogo";
import { DataTableColumnHeader } from "@/components/common/data-table-column-header";
import { DataTablePagination } from "@/components/common/data-table-pagination";
import { StatusBadge } from "@/components/common/status-badge";
import type { EmptyStateVariant } from "@/components/shared/EmptyState";
import { EmptyState } from "@/components/shared/EmptyState";
import { DataTable } from "@/components/ui/table";
import { useDataTable } from "@/hooks/use-data-table";
import type { PayoutRecord } from "@/lib/types/payment";
import { formatAmount, formatDate } from "@/lib/utils";

interface PayoutsHistoryTableProps {
	readonly payouts: PayoutRecord[];
	readonly total: number;
	readonly emptyTitle?: string;
	readonly emptyDescription?: string;
	readonly emptyVariant?: EmptyStateVariant;
	readonly onCancelPayout?: (payout: PayoutRecord) => void;
	readonly onSyncPayout?: (payout: PayoutRecord) => void;
}

export function PayoutsHistoryTable({
	payouts,
	total,
	emptyTitle = "No withdrawal requests yet",
	emptyDescription = "Withdrawals requested to your bank or mobile money account will appear here.",
	emptyVariant = "payment",
	onCancelPayout,
	onSyncPayout,
}: PayoutsHistoryTableProps) {
	const columns = useMemo<ColumnDef<PayoutRecord>[]>(
		() => [
			{
				accessorKey: "createdAt",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Date & Time" />
				),
				cell: ({ row }) => {
					const date = row.getValue("createdAt") as string | Date;
					return (
						<div className="flex flex-col text-xs">
							<span className="font-medium text-foreground">{formatDate(date)}</span>
							<span className="text-muted-foreground">
								{new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
							</span>
						</div>
					);
				},
			},
			{
				accessorKey: "reference",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Reference" />
				),
				cell: ({ row }) => {
					const ref = row.getValue("reference") as string;
					const desc = row.original.description;
					return (
						<div className="flex flex-col max-w-xs truncate">
							<span className="font-mono text-xs font-semibold text-foreground truncate">
								{ref}
							</span>
							{desc && (
								<span className="text-[11px] text-muted-foreground truncate">
									{desc}
								</span>
							)}
						</div>
					);
				},
			},
			{
				id: "destination",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Destination Account" />
				),
				cell: ({ row }) => {
					const item = row.original;
					const bank = getProviderFriendlyName(item.bankName, item.bankCode);
					const accNum = item.accountNumber || "—";
					const accName = item.accountName || item.recipientName || "";

					return (
						<div className="flex items-center gap-2.5">
							<ProviderLogo
								bankCode={item.bankCode}
								bankName={item.bankName}
								className="size-7 shrink-0"
							/>
							<div className="flex flex-col min-w-0">
								<span className="text-xs font-medium text-foreground truncate">
									{bank} • <span className="font-mono">{accNum}</span>
								</span>
								{accName && (
									<span className="text-[10px] text-muted-foreground truncate">
										{accName}
									</span>
								)}
							</div>
						</div>
					);
				},
			},
			{
				accessorKey: "amount",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Amount" />
				),
				cell: ({ row }) => {
					const amount = Number(row.getValue("amount") || 0);
					const currency = row.original.currency || "GHS";
					return (
						<div className="flex flex-col">
							<span className="font-mono text-sm font-semibold text-foreground">
								{formatAmount(amount, currency)}
							</span>
							{row.original.feeAmount && Number(row.original.feeAmount) > 0 ? (
								<span className="text-[10px] text-muted-foreground">
									Fee: {formatAmount(Number(row.original.feeAmount), currency)}
								</span>
							) : null}
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
					const item = row.original;
					const status = item.status;
					const isAwaitingApproval = status === "pending" && (item as any).requiresApproval;
					const variant =
						status === "completed"
							? "completed"
							: status === "pending" || status === "processing"
								? "pending"
								: "failed";
					const isProcessing = status === "processing";
					const displayText = isAwaitingApproval ? "Awaiting Approval" : status;

					return (
						<div className="flex flex-col gap-1.5 items-start">
							{isAwaitingApproval ? (
								<StatusBadge variant="pending" text={displayText} />
							) : (
								<StatusBadge variant={variant} text={status} />
							)}
							{isProcessing && (
								<div className="flex items-center gap-1">
									{onSyncPayout && (
										<Button
											type="button"
											size="sm"
											variant="ghost"
											className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-primary hover:bg-primary/10"
											title="Sync status with Paystack"
											onClick={() => onSyncPayout(item)}
										>
											<RefreshCw className="size-3" />
										</Button>
									)}
									{onCancelPayout && (
										<Button
											type="button"
											size="sm"
											variant="ghost"
											className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-destructive hover:bg-destructive/10"
											title="Cancel payout & restore balance"
											onClick={() => onCancelPayout(item)}
										>
											<XCircle className="size-3" />
										</Button>
									)}
								</div>
							)}
						</div>
					);
				},
			},
		],
		[onCancelPayout, onSyncPayout],
	);

	const table = useDataTable(payouts, columns, {
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		enableRowSelection: false,
	});

	return (
		<div className="space-y-4">
			<div className="rounded-md border bg-card overflow-hidden">
				<DataTable
					table={table}
					columnsCount={columns.length}
					emptyState={
						<EmptyState
							variant={emptyVariant}
							title={emptyTitle}
							description={emptyDescription}
						/>
					}
				/>
			</div>
			<div className="flex flex-wrap items-center justify-between gap-3 pt-1">
				<p className="text-xs text-muted-foreground">
					Showing {table.getPaginationRowModel().rows.length} of {total} withdrawal record(s)
				</p>
				<DataTablePagination table={table} />
			</div>
		</div>
	);
}
