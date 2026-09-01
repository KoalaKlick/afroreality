"use client";
// src/components/event/transactions/TicketTransactionsTable.tsx

import { useState, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/table";
import { useDataTable } from "@/hooks/use-data-table";
import { DataTableColumnHeader } from "@/components/common/data-table-column-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, Loader2, Ticket, Mail } from "lucide-react";
import { formatAmount, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export interface TicketTransaction {
	id: string;
	orderNumber: string;
	reference: string;
	paymentId?: string | null;
	buyerName: string;
	buyerEmail: string;
	buyerPhone: string;
	ticketCount: number;
	ticketType: string;
	amount: number;
	fees?: number;
	currency: string;
	status: string;
	createdAt: string | Date;
}

interface TicketTransactionsTableProps {
	readonly data: TicketTransaction[];
	readonly total: number;
	readonly page: number;
	readonly totalPages: number;
	readonly isLoading?: boolean;
	readonly searchQuery: string;
	readonly onSearchChange: (q: string) => void;
	readonly onPageChange: (p: number) => void;
}

export function TicketTransactionsTable({
	data,
	total,
	page,
	totalPages,
	isLoading = false,
	searchQuery,
	onSearchChange,
	onPageChange,
}: TicketTransactionsTableProps) {
	const [resendingId, setResendingId] = useState<string | null>(null);

	const columns = useMemo<ColumnDef<TicketTransaction>[]>(
		() => [
			{
				accessorKey: "orderNumber",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Order #" />
				),
				cell: ({ row }) => {
					const orderNum = row.getValue("orderNumber") as string;
					const ref = row.original.reference;
					return (
						<div className="flex flex-col">
							<span className="font-mono font-bold text-xs text-foreground">{orderNum}</span>
							{ref && ref !== orderNum && (
								<span className="font-mono text-[10px] text-muted-foreground truncate max-w-[120px]">
									{ref}
								</span>
							)}
						</div>
					);
				},
			},
			{
				accessorKey: "buyerName",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Buyer" />
				),
				cell: ({ row }) => {
					const name = row.original.buyerName;
					const email = row.original.buyerEmail;
					const phone = row.original.buyerPhone;
					return (
						<div className="flex flex-col text-xs min-w-0 max-w-xs">
							<span className="font-medium text-foreground truncate">{name}</span>
							<span className="text-[11px] text-muted-foreground truncate">
								{email !== "—" ? email : phone}
							</span>
						</div>
					);
				},
			},
			{
				accessorKey: "ticketCount",
				header: ({ column }) => (
					<div className="text-center">
						<DataTableColumnHeader column={column} title="Tickets" />
					</div>
				),
				cell: ({ row }) => {
					const count = row.getValue("ticketCount") as number;
					const tier = row.original.ticketType;
					return (
						<div className="flex flex-col items-center">
							<span className="inline-flex items-center justify-center size-6 rounded-full bg-secondary/10 text-secondary font-bold text-xs ring-1 ring-secondary/30">
								{count}
							</span>
							<span className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[100px]">
								{tier}
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
		[resendingId],
	);

	const table = useDataTable(data, columns);

	return (
		<div className="space-y-3.5">
			{/* Top bar with Search & Count */}
			<div className="flex items-center justify-between gap-3">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
					<Input
						placeholder="Search order #, buyer name, or email..."
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						className="pl-9 h-9 text-xs"
					/>
				</div>
				<span className="text-xs text-muted-foreground shrink-0 font-medium">
					{total} ticket order{total === 1 ? "" : "s"}
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
							<Ticket className="size-8 text-muted-foreground/50 stroke-1" />
							<span className="text-sm font-medium text-foreground">No ticket orders found</span>
							<span className="text-xs max-w-xs">
								{searchQuery ? "No records matched your search query." : "Ticket orders will appear here as attendees complete purchases."}
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
