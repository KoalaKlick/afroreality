"use client";
// src/components/organization/wallet/PayoutsHistoryTable.tsx

import type { ColumnDef } from "@tanstack/react-table";
import {
	getPaginationRowModel,
	getSortedRowModel,
} from "@tanstack/react-table";
import { Building2 } from "lucide-react";
import { useMemo } from "react";
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
}

export function PayoutsHistoryTable({
	payouts,
	total,
	emptyTitle = "No withdrawal requests yet",
	emptyDescription = "Withdrawals requested to your bank or mobile money account will appear here.",
	emptyVariant = "payment",
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
					const bank = item.bankName || item.bankCode || "Bank/MoMo";
					const accNum = item.accountNumber || "—";
					const accName = item.accountName || item.recipientName || "";

					return (
						<div className="flex items-center gap-2">
							<div className="size-7 rounded-md bg-secondary-100 dark:bg-secondary-950/50 text-secondary flex items-center justify-center shrink-0">
								<Building2 className="size-3.5" />
							</div>
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
					const status = row.getValue("status") as string;
					const variant =
						status === "completed"
							? "completed"
							: status === "pending" || status === "processing"
								? "pending"
								: "failed";
					return <StatusBadge variant={variant} text={status} />;
				},
			},
		],
		[],
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
