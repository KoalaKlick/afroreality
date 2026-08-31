"use client";
// src/components/organization/wallet/TransactionsTable.tsx

import type { ColumnDef } from "@tanstack/react-table";
import {
	getPaginationRowModel,
	getSortedRowModel,
} from "@tanstack/react-table";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useMemo } from "react";
import { DataTableColumnHeader } from "@/components/common/data-table-column-header";
import { DataTablePagination } from "@/components/common/data-table-pagination";
import { StatusBadge } from "@/components/common/status-badge";
import type { EmptyStateVariant } from "@/components/shared/EmptyState";
import { EmptyState } from "@/components/shared/EmptyState";
import { DataTable } from "@/components/ui/table";
import { useDataTable } from "@/hooks/use-data-table";
import type { Transaction } from "@/lib/types/payment";
import { cn, formatAmount, formatDate } from "@/lib/utils";

interface TransactionsTableProps {
	readonly transactions: Transaction[];
	readonly total: number;
	readonly emptyTitle?: string;
	readonly emptyDescription?: string;
	readonly emptyVariant?: EmptyStateVariant;
}

const categoryLabels: Record<string, string> = {
	ticket_purchase: "Ticket Purchase",
	vote_purchase: "Voting Payment",
	subscription: "Subscription",
	refund: "Refund",
	commission_payout: "Commission Payout",
	wallet_topup: "Wallet Top-up",
	wallet_withdrawal: "Wallet Withdrawal",
	transfer: "Transfer",
	fee: "Fee",
	bonus: "Bonus",
	adjustment: "Adjustment",
};

export function TransactionsTable({
	transactions,
	total,
	emptyTitle = "No transactions yet",
	emptyDescription = "There are no transactions recorded in this ledger view yet.",
	emptyVariant = "money",
}: TransactionsTableProps) {
	const columns = useMemo<ColumnDef<Transaction>[]>(
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
				accessorKey: "type",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Flow" />
				),
				cell: ({ row }) => {
					const type = row.getValue("type") as string;
					const isCredit = type === "credit";
					return (
						<div className="flex items-center gap-1.5">
							<div
								className={cn(
									"size-6 rounded-full flex items-center justify-center shrink-0",
									isCredit
										? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
										: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
								)}
							>
								{isCredit ? (
									<ArrowDownLeft className="size-3.5" />
								) : (
									<ArrowUpRight className="size-3.5" />
								)}
							</div>
							<span className="text-xs font-semibold uppercase tracking-wider">
								{isCredit ? "Inflow" : "Outflow"}
							</span>
						</div>
					);
				},
			},
			{
				id: "category",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Category" />
				),
				cell: ({ row }) => {
					const category = row.original.category;
					return (
						<span className="text-xs font-medium text-foreground">
							{categoryLabels[category] ?? category}
						</span>
					);
				},
			},
			{
				accessorKey: "description",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Description / Reference" />
				),
				cell: ({ row }) => {
					const desc = row.getValue("description") as string | null;
					const ref = row.original.reference;
					return (
						<div className="flex flex-col max-w-xs truncate">
							<span className="text-xs text-foreground truncate">{desc || categoryLabels[row.original.category] || "Transaction"}</span>
							{ref && (
								<span className="font-mono text-[10px] text-muted-foreground truncate">
									{ref}
								</span>
							)}
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
					const type = row.original.type;
					const currency = row.original.currency || "GHS";
					const isCredit = type === "credit";
					return (
						<span
							className={cn(
								"font-mono text-sm font-semibold",
								isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
							)}
						>
							{isCredit ? "+" : "-"}
							{formatAmount(amount, currency)}
						</span>
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

	const table = useDataTable(transactions, columns, {
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
					Showing {table.getPaginationRowModel().rows.length} of {total} transaction record(s)
				</p>
				<DataTablePagination table={table} />
			</div>
		</div>
	);
}
