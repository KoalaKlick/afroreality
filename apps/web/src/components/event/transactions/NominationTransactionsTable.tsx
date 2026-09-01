"use client";
// src/components/event/transactions/NominationTransactionsTable.tsx

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/table";
import { useDataTable } from "@/hooks/use-data-table";
import { DataTableColumnHeader } from "@/components/common/data-table-column-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, Loader2, Award } from "lucide-react";
import { formatAmount, formatDate } from "@/lib/utils";

export interface NominationTransaction {
	id: string;
	reference: string;
	nomineeName: string;
	nomineeCode?: string | null;
	nominatorName: string;
	email: string;
	categoryName: string;
	amount: number;
	currency: string;
	status: string;
	createdAt: string | Date;
}

interface NominationTransactionsTableProps {
	readonly data: NominationTransaction[];
	readonly total: number;
	readonly page: number;
	readonly totalPages: number;
	readonly isLoading?: boolean;
	readonly searchQuery: string;
	readonly onSearchChange: (q: string) => void;
	readonly onPageChange: (p: number) => void;
}

export function NominationTransactionsTable({
	data,
	total,
	page,
	totalPages,
	isLoading = false,
	searchQuery,
	onSearchChange,
	onPageChange,
}: NominationTransactionsTableProps) {
	const columns = useMemo<ColumnDef<NominationTransaction>[]>(
		() => [
			{
				accessorKey: "nomineeName",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Nominee" />
				),
				cell: ({ row }) => {
					const name = row.getValue("nomineeName") as string;
					const category = row.original.categoryName;
					return (
						<div className="flex flex-col min-w-0 max-w-xs">
							<span className="font-semibold text-xs text-foreground truncate">{name}</span>
							<span className="text-[11px] text-muted-foreground truncate">{category}</span>
						</div>
					);
				},
			},
			{
				accessorKey: "nomineeCode",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Code" />
				),
				cell: ({ row }) => {
					const code = row.getValue("nomineeCode") as string;
					return (
						<span className="font-mono text-xs text-muted-foreground font-semibold px-1.5 py-0.5 bg-muted rounded border">
							{code || "—"}
						</span>
					);
				},
			},
			{
				id: "nominator",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Nominator" />
				),
				cell: ({ row }) => {
					const nominator = row.original.nominatorName;
					const email = row.original.email;
					return (
						<div className="flex flex-col text-xs min-w-0 max-w-xs">
							<span className="font-medium text-foreground truncate">{nominator}</span>
							<span className="text-[11px] text-muted-foreground truncate font-mono">{email}</span>
						</div>
					);
				},
			},
			{
				accessorKey: "amount",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Fee" />
				),
				cell: ({ row }) => {
					const amount = row.getValue("amount") as number;
					const currency = row.original.currency || "GHS";
					return (
						<span className="font-mono font-bold text-xs text-foreground">
							{amount > 0 ? formatAmount(amount, currency) : "Free"}
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
								{new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
							variant={status === "approved" || status === "completed" ? "approved" : "pending"}
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
						placeholder="Search nominee, nominator, or code..."
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						className="pl-9 h-9 text-xs"
					/>
				</div>
				<span className="text-xs text-muted-foreground shrink-0 font-medium">
					{total} nomination{total === 1 ? "" : "s"}
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
							<Award className="size-8 text-muted-foreground/50 stroke-1" />
							<span className="text-sm font-medium text-foreground">No nomination transactions found</span>
							<span className="text-xs max-w-xs">
								{searchQuery ? "No records matched your search query." : "Public nominations submitted for this event will appear here."}
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
