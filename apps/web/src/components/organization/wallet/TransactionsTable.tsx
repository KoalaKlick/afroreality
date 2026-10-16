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
import { Badge } from "@/components/ui/badge";
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
	readonly onSelectEvent?: (eventId: string) => void;
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
	onSelectEvent,
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
				id: "event",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Event" />
				),
				cell: ({ row }) => {
					const event = row.original.event;
					if (!event) {
						return <span className="text-xs text-muted-foreground/60">—</span>;
					}
					return (
						<div className="flex items-center gap-1.5 max-w-[170px]">
							{onSelectEvent ? (
								<button
									type="button"
									onClick={() => onSelectEvent(event.id)}
									className="text-xs font-medium text-foreground hover:text-primary transition-colors truncate text-left underline-offset-2 hover:underline"
									title={`Filter by ${event.title}`}
								>
									{event.title}
								</button>
							) : (
								<span
									className="text-xs font-medium text-foreground truncate"
									title={event.title}
								>
									{event.title}
								</span>
							)}
							{event.isOngoing && (
								<Badge
									variant="outline"
									className="text-[9px] h-4 px-1 shrink-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-semibold"
								>
									Ongoing
								</Badge>
							)}
						</div>
					);
				},
			},
			{
				accessorKey: "description",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Description" />
				),
				cell: ({ row }) => {
					const rawDesc = row.getValue("description") as string | null;
					const category = row.original.category;

					// Format friendly description without raw tokens
					let displayDesc = rawDesc || categoryLabels[category] || "Transaction";
					displayDesc = displayDesc
						.replace(/vote_purchase/gi, "Voting")
						.replace(/ticket_purchase/gi, "Ticket Purchase")
						.replace(/wallet_topup/gi, "Wallet Top-up")
						.replace(/wallet_withdrawal/gi, "Withdrawal")
						.replace(/:\s*Ref\s+[a-zA-Z0-9_\-]+/gi, "")
						.replace(/Ref\s+[a-zA-Z0-9_\-]+/gi, "")
						.replace(/WDR-[a-zA-Z0-9_\-]+/gi, "")
						.replace(/TXN-[a-zA-Z0-9_\-]+/gi, "")
						.trim();

					if (!displayDesc) {
						displayDesc = categoryLabels[category] ?? "Transaction";
					}

					return (
						<div className="flex flex-col max-w-sm truncate">
							<span className="text-xs text-foreground font-medium truncate">
								{displayDesc}
							</span>
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
