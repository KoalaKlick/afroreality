"use client";
// src/components/event/transactions/VoteTransactionsTable.tsx

import { useState, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/table";
import { useDataTable } from "@/hooks/use-data-table";
import { DataTableColumnHeader } from "@/components/common/data-table-column-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, Loader2, Vote } from "lucide-react";
import { formatAmount, formatDate } from "@/lib/utils";

export interface VoteTransaction {
	id: string;
	reference: string;
	voterName: string;
	voterEmail: string;
	voterPhone: string;
	nomineeName: string;
	nomineeCode?: string | null;
	categoryName: string;
	voteCount: number;
	amount: number;
	currency: string;
	status: string;
	createdAt: string | Date;
}

interface VoteTransactionsTableProps {
	readonly data: VoteTransaction[];
	readonly total: number;
	readonly page: number;
	readonly totalPages: number;
	readonly isLoading?: boolean;
	readonly searchQuery: string;
	readonly onSearchChange: (q: string) => void;
	readonly onPageChange: (p: number) => void;
}

export function VoteTransactionsTable({
	data,
	total,
	page,
	totalPages,
	isLoading = false,
	searchQuery,
	onSearchChange,
	onPageChange,
}: VoteTransactionsTableProps) {
	const columns = useMemo<ColumnDef<VoteTransaction>[]>(
		() => [
			{
				accessorKey: "voteCount",
				header: ({ column }) => (
					<div className="text-center">
						<DataTableColumnHeader column={column} title="Votes" />
					</div>
				),
				cell: ({ row }) => {
					const count = row.getValue("voteCount") as number;
					return (
						<div className="flex justify-center">
							<span className="inline-flex items-center justify-center size-7 rounded-full bg-primary/10 text-primary font-bold text-xs ring-1 ring-primary/30">
								{count}
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
				accessorKey: "nomineeName",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Nominee / Option" />
				),
				cell: ({ row }) => {
					const nominee = row.original.nomineeName;
					const code = row.original.nomineeCode;
					const cat = row.original.categoryName;
					return (
						<div className="flex flex-col min-w-0 max-w-xs">
							<div className="flex items-center gap-1.5">
								<span className="font-medium text-xs text-foreground truncate">{nominee}</span>
								{code && (
									<span className="text-[10px] font-mono font-semibold px-1 py-0.2 bg-muted rounded border text-muted-foreground shrink-0">
										{code}
									</span>
								)}
							</div>
							<span className="text-[11px] text-muted-foreground truncate">{cat}</span>
						</div>
					);
				},
			},
			{
				id: "voter",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Voter" />
				),
				cell: ({ row }) => {
					const name = row.original.voterName;
					const phone = row.original.voterPhone;
					const email = row.original.voterEmail;
					return (
						<div className="flex flex-col text-xs min-w-0 max-w-xs">
							<span className="font-medium text-foreground truncate">{name}</span>
							<span className="text-[11px] text-muted-foreground font-mono truncate">
								{phone !== "—" ? phone : email}
							</span>
						</div>
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
							variant={status === "completed" || status === "paid" ? "completed" : "pending"}
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
						placeholder="Search voter, nominee, or code..."
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						className="pl-9 h-9 text-xs"
					/>
				</div>
				<span className="text-xs text-muted-foreground shrink-0 font-medium">
					{total} vote transaction{total === 1 ? "" : "s"}
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
							<Vote className="size-8 text-muted-foreground/50 stroke-1" />
							<span className="text-sm font-medium text-foreground">No vote transactions found</span>
							<span className="text-xs max-w-xs">
								{searchQuery ? "No records matched your search query." : "Votes cast by attendees will appear here."}
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
