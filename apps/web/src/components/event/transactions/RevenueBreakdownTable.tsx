"use client";
// src/components/event/transactions/RevenueBreakdownTable.tsx

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/table";
import { useDataTable } from "@/hooks/use-data-table";
import { DataTableColumnHeader } from "@/components/common/data-table-column-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Search,
	ChevronLeft,
	ChevronRight,
	Loader2,
	Banknote,
} from "lucide-react";
import { formatAmount, formatDate } from "@/lib/utils";
import type { EventRevenuePayment } from "@/lib/server-functions/event-revenue";

interface RevenueBreakdownTableProps {
	readonly data: EventRevenuePayment[];
	readonly total: number;
	readonly page: number;
	readonly totalPages: number;
	readonly isLoading?: boolean;
	readonly searchQuery: string;
	readonly onSearchChange: (q: string) => void;
	readonly onPageChange: (p: number) => void;
}

export function RevenueBreakdownTable({
	data,
	total,
	page,
	totalPages,
	isLoading = false,
	searchQuery,
	onSearchChange,
	onPageChange,
}: RevenueBreakdownTableProps) {
	const columns = useMemo<ColumnDef<EventRevenuePayment>[]>(
		() => [
			{
				accessorKey: "reference",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Reference" />
				),
				cell: ({ row }) => {
					const ref = row.getValue("reference") as string;
					return (
						<span className="font-mono text-xs font-semibold text-foreground">
							{ref}
						</span>
					);
				},
			},
			{
				accessorKey: "kind",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Source" />
				),
				cell: ({ row }) => {
					const kind = row.getValue("kind") as string;
					const label = row.original.label;
					const kindStyles: Record<string, string> = {
						ticket: "bg-secondary/10 text-secondary ring-secondary/30",
						vote: "bg-primary/10 text-primary ring-primary/30",
						nomination: "bg-amber-500/10 text-amber-600 ring-amber-500/30",
					};
					const kindLabel = {
						ticket: "Ticket",
						vote: "Vote",
						nomination: "Nomination",
					};
					return (
						<div className="flex flex-col min-w-0 max-w-xs">
							<span
								className={`inline-flex items-center w-fit text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ring-1 ${
									kindStyles[kind] ?? kindStyles.ticket
								}`}
							>
								{kindLabel[kind as keyof typeof kindLabel] ?? "Payment"}
							</span>
							<span className="text-[11px] text-muted-foreground truncate mt-0.5">
								{label}
							</span>
						</div>
					);
				},
			},
			{
				accessorKey: "payer",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Payer" />
				),
				cell: ({ row }) => {
					const payer = row.original.payer;
					const contact = row.original.contact;
					return (
						<div className="flex flex-col text-xs min-w-0 max-w-xs">
							<span className="font-medium text-foreground truncate">{payer}</span>
							{contact && contact !== payer && (
								<span className="text-[11px] text-muted-foreground truncate font-mono">
									{contact}
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
					const amount = row.getValue("amount") as number;
					const currency = row.original.currency || "GHS";
					return (
						<span className="font-mono font-bold text-xs text-foreground">
							{formatAmount(amount, currency)}
						</span>
					);
				},
			},
			{
				accessorKey: "createdAt",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Date" />
				),
				cell: ({ row }) => {
					const date = row.getValue("createdAt") as string | Date;
					return (
						<div className="flex flex-col text-xs whitespace-nowrap text-muted-foreground">
							<span>{formatDate(date)}</span>
							<span className="text-[10px]">
								{new Date(date).toLocaleTimeString([], {
									hour: "2-digit",
									minute: "2-digit",
								})}
							</span>
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
					return (
						<StatusBadge
							variant={
								status === "completed" || status === "paid"
									? "completed"
									: "pending"
							}
							text={status}
						/>
					);
				},
			},
		],
		[],
	);

	const table = useDataTable(data, columns);

	return (
		<div className="space-y-3.5">
			{/* Top bar with Search & Count */}
			<div className="flex items-center justify-between gap-3">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
					<Input
						placeholder="Search reference or payer..."
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						className="pl-9 h-9 text-xs"
					/>
				</div>
				<span className="text-xs text-muted-foreground shrink-0 font-medium">
					{total} payment{total === 1 ? "" : "s"}
				</span>
			</div>

			{/* Table Container */}
			<div className="rounded-xl border bg-card overflow-hidden relative">
				{isLoading && (
					<div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
						<Loader2 className="size-6 animate-spin text-primary" />
					</div>
				)}
				<DataTable
					table={table}
					columnsCount={columns.length}
					emptyState={
						<div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2">
							<Banknote className="size-8 text-muted-foreground/50 stroke-1" />
							<span className="text-sm font-medium text-foreground">
								No revenue payments found
							</span>
							<span className="text-xs max-w-xs">
								{searchQuery
									? "No payments matched your search query."
									: "Completed payments for this event will appear here."}
							</span>
						</div>
					}
				/>
			</div>

			{/* Pagination Footer */}
			{totalPages > 1 && (
				<div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
					<span>
						Page {page} of {totalPages} ({total} records)
					</span>
					<div className="flex items-center gap-1.5">
						<Button
							variant="outline"
							size="sm"
							className="h-8 px-2.5 text-xs"
							disabled={page <= 1 || isLoading}
							onClick={() => onPageChange(page - 1)}
						>
							<ChevronLeft className="size-3.5 mr-1" />
							Prev
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="h-8 px-2.5 text-xs"
							disabled={page >= totalPages || isLoading}
							onClick={() => onPageChange(page + 1)}
						>
							Next
							<ChevronRight className="size-3.5 ml-1" />
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
