"use client";
// src/components/organization/wallet/TransactionsTable.tsx


import { Card, CardContent } from "@/components/ui/card";
import type { ColumnDef } from "@tanstack/react-table";
import {
	getPaginationRowModel,
	getSortedRowModel,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useMemo } from "react";
import { DataTableColumnHeader } from "@/components/common/data-table-column-header";
import { DataTablePagination } from "@/components/common/data-table-pagination";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { DataTable } from "@/components/ui/table";
import { useDataTable } from "@/hooks/use-data-table";
import type { Transaction } from "@/lib/types/payment";
import { cn, formatAmount, formatDate } from "@/lib/utils";

interface TransactionsTableProps {
	readonly transactions: Transaction[];
	readonly total: number;
}

const categoryLabels: Record<string, string> = {
	ticket_purchase: "Ticket Purchase",
	vote_purchase: "Vote Purchase",
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
}: TransactionsTableProps) {
	const columns = useMemo<ColumnDef<Transaction>[]>(
		() => [
			{
				accessorKey: "createdAt",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Date" />
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
				accessorKey: "type",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Type" />
				),
				cell: ({ row }) => {
					const type = row.getValue("type") as string;
					return (
						<div className="flex items-center gap-2">
							{type === "credit" ? (
								<ArrowDown className="h-4 w-4 text-emerald-500" />
							) : (
								<ArrowUp className="h-4 w-4 text-red-500" />
							)}
							<span className="text-sm capitalize">{type}</span>
						</div>
					);
				},
			},
			{
				accessorKey: "category",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Category" />
				),
				cell: ({ row }) => {
					const category = row.getValue("category") as string;
					return (
						<span className="text-sm">
							{categoryLabels[category] ?? category}
						</span>
					);
				},
			},
			{
				accessorKey: "description",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Description" />
				),
				cell: ({ row }) => {
					const desc = row.getValue("description") as string | null;
					return (
						<span className="text-sm text-muted-foreground">{desc || "—"}</span>
					);
				},
			},
			{
				accessorKey: "amount",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Amount" />
				),
				cell: ({ row }) => {
					const amount = Number(row.getValue("amount"));
					const type = row.getValue("type") as string;
					const currency = row.getValue("currency") as string;
					return (
						<span
							className={cn(
								"font-mono text-sm font-medium",
								type === "credit" ? "text-emerald-600" : "text-red-600",
							)}
						>
							{type === "credit" ? "+" : "-"}
							{formatAmount(amount, currency)}
						</span>
					);
				},
			},
			{
				accessorKey: "feeAmount",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Fee" />
				),
				cell: ({ row }) => {
					const fee = Number(row.getValue("feeAmount"));
					const currency = row.getValue("currency") as string;
					return (
						<span className="text-sm font-mono text-muted-foreground">
							{formatAmount(fee, currency)}
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
					const variant = status === "completed" ? "completed" : status === "processing" ? "info" : status === "reversed" ? "warning" : status;
					return (
						<StatusBadge variant={variant} />
					);
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
		<Card>
			<CardContent className="pt-6">
				<div className="rounded-md border bg-card mb-4">
					<DataTable
						table={table}
						columnsCount={columns.length}
						emptyState={
							<EmptyState
								variant="money"
								title="No transactions yet"
								description="There are no transactions recorded in this wallet yet."
							/>
						}
					/>
				</div>
				<div className="flex items-center justify-between">
					<p className="text-sm text-muted-foreground">
						{table.getPaginationRowModel().rows.length} of {total} transaction(s)
					</p>
					<DataTablePagination table={table} />
					</div>
			</CardContent>
		</Card>
	);
}
