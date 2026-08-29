"use client";

import { useState, useEffect, useMemo, useCallback, useTransition } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import {
	getPaginationRowModel,
	getSortedRowModel,
} from "@tanstack/react-table";
import {
	QrCode,
	Search,
	CheckCircle2,
	Clock,
	Users,
	ExternalLink,
	Loader2,
	RefreshCw,
	LogIn,
	LogOut,
	ShieldCheck,
	Ticket,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/table";
import { DataTableColumnHeader } from "@/components/common/data-table-column-header";
import { DataTablePagination } from "@/components/common/data-table-pagination";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { useDataTable } from "@/hooks/use-data-table";
import { StatCard, statIcons } from "@/components/event/core/EventStats";
import {
	getEventTicketAttendees,
	toggleTicketCheckInStatus,
} from "@/lib/server-functions/ticket-verification";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface EventVerificationTabProps {
	readonly event: any;
}

export function EventVerificationTab({ event }: EventVerificationTabProps) {
	const [tickets, setTickets] = useState<any[]>([]);
	const [totalCount, setTotalCount] = useState<number>(0);
	const [checkedInCount, setCheckedInCount] = useState<number>(0);
	const [remainingCount, setRemainingCount] = useState<number>(0);
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isPending, startTransition] = useTransition();

	const loadAttendees = useCallback(async (query?: string) => {
		try {
			setIsLoading(true);
			const res = await getEventTicketAttendees({
				data: { eventId: event.id, search: query },
			});
			setTickets(res.tickets);
			setTotalCount(res.totalCount);
			setCheckedInCount(res.checkedInCount);
			setRemainingCount(res.remainingCount);
		} catch (err: any) {
			toast.error(err.message || "Failed to load attendee tickets.");
		} finally {
			setIsLoading(false);
		}
	}, [event.id]);

	useEffect(() => {
		loadAttendees();
	}, [loadAttendees]);

	const handleToggleCheckIn = useCallback(async (ticketId: string, currentStatus: string) => {
		const nextAction = currentStatus === "checked_in" ? "check_out" : "check_in";

		startTransition(async () => {
			try {
				const res = await toggleTicketCheckInStatus({
					data: { ticketId, action: nextAction },
				});

				if (res.success) {
					toast.success(
						nextAction === "check_in"
							? "Attendee checked in!"
							: "Attendee checked out.",
					);
					setTickets((prev) =>
						prev.map((t) => (t.id === ticketId ? res.ticket : t)),
					);
					setCheckedInCount((prev) =>
						nextAction === "check_in" ? prev + 1 : Math.max(0, prev - 1),
					);
					setRemainingCount((prev) =>
						nextAction === "check_in" ? Math.max(0, prev - 1) : prev + 1,
					);
				}
			} catch (err: any) {
				toast.error(err.message || "Action failed.");
			}
		});
	}, []);

	// Filtered data for client-side quick filter
	const filteredTickets = useMemo(() => {
		return tickets.filter((t) => {
			if (statusFilter === "checked_in" && t.checkInStatus !== "checked_in") return false;
			if (statusFilter === "pending" && t.checkInStatus === "checked_in") return false;
			return true;
		});
	}, [tickets, statusFilter]);

	// Table Columns setup using DataTableColumnHeader and StatusBadge
	const columns = useMemo<ColumnDef<any>[]>(
		() => [
			{
				accessorKey: "ticketCode",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Ticket Code" />
				),
				cell: ({ row }) => (
					<span className="font-mono font-bold text-foreground">
						{row.original.ticketCode}
					</span>
				),
			},
			{
				accessorKey: "attendeeName",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Attendee" />
				),
				cell: ({ row }) => {
					const t = row.original;
					const name = t.attendeeName || t.order?.buyerName || "Guest";
					const email = t.attendeeEmail || t.order?.buyerEmail || "-";
					return (
						<div>
							<p className="font-semibold text-foreground text-xs">{name}</p>
							<p className="text-[11px] text-muted-foreground">{email}</p>
						</div>
					);
				},
			},
			{
				accessorKey: "ticketType.name",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Ticket Tier" />
				),
				cell: ({ row }) => (
					<Badge variant="outline" className="text-[11px]">
						{row.original.ticketType?.name || "General"}
					</Badge>
				),
			},
			{
				accessorKey: "checkInStatus",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Status" />
				),
				cell: ({ row }) => {
					const isCheckedIn = row.original.checkInStatus === "checked_in";
					return (
						<StatusBadge
							variant={isCheckedIn ? "published" : "draft"}
							text={isCheckedIn ? "Checked In" : "Pending"}
						/>
					);
				},
			},
			{
				accessorKey: "checkedInAt",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Check-In Time" />
				),
				cell: ({ row }) => (
					<span className="text-xs text-muted-foreground">
						{row.original.checkedInAt
							? formatDate(row.original.checkedInAt, true)
							: "-"}
					</span>
				),
			},
			{
				id: "actions",
				header: () => <div className="text-right">Action</div>,
				cell: ({ row }) => {
					const t = row.original;
					const isCheckedIn = t.checkInStatus === "checked_in";
					return (
						<div className="text-right">
							{isCheckedIn ? (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => handleToggleCheckIn(t.id, t.checkInStatus)}
									disabled={isPending}
									className="h-7 text-[11px] text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 gap-1 font-semibold"
								>
									<LogOut className="size-3" /> Undo
								</Button>
							) : (
								<Button
									size="sm"
									onClick={() => handleToggleCheckIn(t.id, t.checkInStatus)}
									disabled={isPending}
									className="h-7 text-[11px] font-bold gap-1"
								>
									<LogIn className="size-3" /> Check In
								</Button>
							)}
						</div>
					);
				},
			},
		],
		[handleToggleCheckIn, isPending],
	);

	const table = useDataTable(
		filteredTickets,
		columns,
		{
			getPaginationRowModel: getPaginationRowModel(),
			getSortedRowModel: getSortedRowModel(),
			initialState: {
				pagination: {
					pageSize: 10,
				},
			},
		},
	);

	const checkInRate =
		totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;

	return (
		<div className="space-y-6">
			{/* Stat Cards - Reusing standard StatCard with 3D icons */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<StatCard
					label="Total Tickets Issued"
					value={totalCount}
					iconSrc={statIcons.ticket}
					description="Confirmed tickets for this event"
				/>

				<StatCard
					label={`Checked In (${checkInRate}%)`}
					value={checkedInCount}
					iconSrc={statIcons.ongoingGreen}
					variant="success"
					description="Attendees verified at gate"
				/>

				<StatCard
					label="Awaiting Check-in"
					value={remainingCount}
					iconSrc={statIcons.search}
					variant="warning"
					description="Tickets pending door entry"
				/>
			</div>

			{/* Scanner Launch Bar */}
			<div className="rounded-2xl border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<div className="size-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
						<QrCode className="size-5" />
					</div>
					<div>
						<h4 className="font-bold text-sm text-foreground">
							Live Gate Scanner &amp; Door Verification
						</h4>
						<p className="text-xs text-muted-foreground">
							Open the high-speed QR and Ticket Code scanner on door tablet or mobile devices.
						</p>
					</div>
				</div>

				<Button asChild size="sm" className="font-bold text-xs gap-2 shrink-0">
					<Link href="/ticket/verify" target="_blank">
						<ExternalLink className="size-3.5" /> Open Gate Scanner
					</Link>
				</Button>
			</div>

			{/* Attendee Roster Card with Reused Search Bar, DataTable and DataTablePagination */}
			<Card className="border bg-card">
				<CardHeader className="p-5 border-b space-y-4">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
						<div>
							<CardTitle className="text-base font-bold flex items-center gap-2">
								<ShieldCheck className="size-4 text-primary" /> Attendee
								Check-In Roster
							</CardTitle>
							<p className="text-xs text-muted-foreground mt-0.5">
								Search and manually check in attendees at the door.
							</p>
						</div>

						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								className="h-8 text-xs gap-1.5"
								onClick={() => loadAttendees(searchQuery.trim())}
								disabled={isLoading}
							>
								<RefreshCw
									className={`size-3.5 ${isLoading ? "animate-spin" : ""}`}
								/>
								Refresh
							</Button>
						</div>
					</div>

					{/* Reused Search & Filter Bar */}
					<div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
						<form
							onSubmit={(e) => {
								e.preventDefault();
								loadAttendees(searchQuery.trim());
							}}
							className="relative flex-1 w-full"
						>
							<Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
							<Input
								placeholder="Search attendees by ticket code, name, or email..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9 h-9 text-xs"
							/>
						</form>

						<div className="flex items-center gap-1.5 w-full sm:w-auto">
							<Button
								variant={statusFilter === "all" ? "default" : "outline"}
								size="sm"
								onClick={() => setStatusFilter("all")}
								className="h-8 text-xs flex-1 sm:flex-none"
							>
								All ({tickets.length})
							</Button>
							<Button
								variant={statusFilter === "checked_in" ? "default" : "outline"}
								size="sm"
								onClick={() => setStatusFilter("checked_in")}
								className="h-8 text-xs flex-1 sm:flex-none"
							>
								Checked In ({checkedInCount})
							</Button>
							<Button
								variant={statusFilter === "pending" ? "default" : "outline"}
								size="sm"
								onClick={() => setStatusFilter("pending")}
								className="h-8 text-xs flex-1 sm:flex-none"
							>
								Pending ({remainingCount})
							</Button>
						</div>
					</div>
				</CardHeader>

				<CardContent className="p-0">
					{isLoading ? (
						<div className="py-16 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
							<Loader2 className="size-4 animate-spin" /> Loading attendee
							records...
						</div>
					) : filteredTickets.length === 0 ? (
						<EmptyState
							title="No Tickets Found"
							description={
								searchQuery
									? "No attendees match your search query."
									: "Tickets issued for this event will appear here for gate check-in."
							}
							icon={Ticket}
						/>
					) : (
						<div className="space-y-4 p-4">
							<DataTable table={table} columnsCount={columns.length} />
							<DataTablePagination table={table} />
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

