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
	Users,
	ExternalLink,
	Loader2,
	RefreshCw,
	LogIn,
	LogOut,
	ShieldCheck,
	Ticket,
	KeyRound,
	CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
	StatCard,
	StatsGrid,
	statIcons,
} from "@/components/event/core/EventStats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/table";
import { DataTableColumnHeader } from "@/components/common/data-table-column-header";
import { DataTablePagination } from "@/components/common/data-table-pagination";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { useDataTable } from "@/hooks/use-data-table";
import {
	getEventTicketAttendees,
} from "@/lib/server-functions/ticket-verification";
import { verifyAndCheckInTicket } from "@/lib/server-functions/public-checkout";
import { cn, formatDate } from "@/lib/utils";
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

	const [selectedTicketForVerify, setSelectedTicketForVerify] = useState<any | null>(null);
	const [verifyCodeInput, setVerifyCodeInput] = useState<string>("");
	const [isVerifying, setIsVerifying] = useState<boolean>(false);

	// Quick Global Check In / Out Modal State
	const [isQuickModalOpen, setIsQuickModalOpen] = useState<boolean>(false);
	const [quickAction, setQuickAction] = useState<"check_in" | "check_out">("check_in");
	const [quickCode, setQuickCode] = useState<string>("");
	const [isSubmittingQuick, setIsSubmittingQuick] = useState<boolean>(false);
	const [quickResult, setQuickResult] = useState<{
		success: boolean;
		message: string;
		attendeeName?: string;
		tierName?: string;
	} | null>(null);

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

	const handleVerifyAndCheckIn = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			if (!selectedTicketForVerify || !verifyCodeInput.trim()) return;

			setIsVerifying(true);
			try {
				const res = await verifyAndCheckInTicket({
					data: {
						ticketCode: verifyCodeInput.trim().toUpperCase(),
						action: "check_in",
					},
				});

				if (!res.isValid || !res.ticket) {
					toast.error(res.message || "Invalid ticket code or check-in failed.");
					return;
				}

				if (res.ticket.id !== selectedTicketForVerify.id) {
					toast.error(
						`This code belongs to another attendee (${res.ticket.attendeeName || "Other Guest"}), not ${selectedTicketForVerify.attendeeName}`,
					);
					return;
				}

				toast.success(
					`Attendee ${selectedTicketForVerify.attendeeName} checked in successfully!`,
				);
				setTickets((prev) =>
					prev.map((t) =>
						t.id === selectedTicketForVerify.id
							? {
									...t,
									checkInStatus: "checked_in",
									checkedInAt: res.ticket.checkedInAt || new Date().toISOString(),
								}
							: t,
					),
				);
				setCheckedInCount((c) => c + 1);
				setRemainingCount((r) => Math.max(0, r - 1));
				setSelectedTicketForVerify(null);
				setVerifyCodeInput("");
			} catch (err: any) {
				toast.error(err.message || "Failed to check in attendee.");
			} finally {
				setIsVerifying(false);
			}
		},
		[selectedTicketForVerify, verifyCodeInput],
	);

	const handleQuickCheckInOut = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			const trimmedCode = quickCode.trim().toUpperCase();
			if (!trimmedCode) return;

			setIsSubmittingQuick(true);
			setQuickResult(null);

			try {
				const res = await verifyAndCheckInTicket({
					data: {
						ticketCode: trimmedCode,
						action: quickAction,
					},
				});

				if (!res.isValid || !res.ticket) {
					setQuickResult({
						success: false,
						message: res.message || "Invalid ticket code.",
					});
					toast.error(res.message || "Action failed.");
					return;
				}

				const isCheckIn = quickAction === "check_in";
				const updatedStatus = isCheckIn ? "checked_in" : "not_checked_in";
				const targetAttendeeName = res.ticket.attendeeName || "Guest";
				const tierName = res.ticket.ticketType?.name;

				setQuickResult({
					success: true,
					message: isCheckIn
						? `${targetAttendeeName} admitted successfully!`
						: `${targetAttendeeName} checked out successfully.`,
					attendeeName: targetAttendeeName,
					tierName,
				});

				toast.success(
					isCheckIn
						? `${targetAttendeeName} checked in successfully!`
						: `${targetAttendeeName} checked out successfully.`,
				);

				// Update table state
				setTickets((prev) =>
					prev.map((t) =>
						t.id === res.ticket.id
							? {
									...t,
									checkInStatus: updatedStatus,
									checkedInAt: isCheckIn
										? res.ticket.checkedInAt || new Date().toISOString()
										: null,
								}
							: t,
					),
				);

				if (isCheckIn) {
					setCheckedInCount((c) => c + 1);
					setRemainingCount((r) => Math.max(0, r - 1));
				} else {
					setCheckedInCount((c) => Math.max(0, c - 1));
					setRemainingCount((r) => r + 1);
				}

				setQuickCode("");
			} catch (err: any) {
				setQuickResult({
					success: false,
					message: err.message || "Failed to process ticket.",
				});
				toast.error(err.message || "Failed to process ticket.");
			} finally {
				setIsSubmittingQuick(false);
			}
		},
		[quickAction, quickCode],
	);

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
				accessorKey: "orderNumber",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Order Ref" />
				),
				cell: ({ row }) => (
					<span className="font-mono text-xs font-semibold text-foreground">
						{row.original.orderNumber || "ORD-PASS"}
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
					const contact =
						t.attendeePhone ||
						t.attendeeEmail ||
						t.order?.buyerPhone ||
						t.order?.buyerEmail ||
						"-";
					return (
						<div>
							<p className="font-semibold text-foreground text-xs">{name}</p>
							<p className="text-[11px] text-muted-foreground">{contact}</p>
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
				header: () => <div className="text-right">Admission</div>,
				cell: ({ row }) => {
					const t = row.original;
					const isCheckedIn = t.checkInStatus === "checked_in";
					return (
						<div className="text-right">
							{isCheckedIn ? (
								<span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-end gap-1">
									<CheckCircle2 className="size-3.5" /> Admitted
								</span>
							) : (
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										setSelectedTicketForVerify(t);
										setVerifyCodeInput("");
									}}
									className="h-7 text-[11px] font-semibold gap-1 border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
								>
									<KeyRound className="size-3" /> Verify Pass
								</Button>
							)}
						</div>
					);
				},
			},
		],
		[],
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
			{/* Overview-Style Stat Cards */}
			<StatsGrid columns={3}>
				<StatCard
					label="Total Issued"
					value={totalCount}
					iconSrc={statIcons.ticket}
					description="All passes generated for this event"
				/>

				<StatCard
					label="Checked In"
					value={checkedInCount}
					iconSrc={statIcons.high}
					description={`${checkInRate}% attendance rate`}
				/>

				<StatCard
					label="Pending Entry"
					value={remainingCount}
					iconSrc={statIcons.ongoing}
					description="Tickets awaiting gate verification"
				/>
			</StatsGrid>

			{/* Gate Verification Scanner Card */}
			<Card className="bg-card">
				<CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
					<div className="flex items-center gap-3.5">
						<div className="size-9 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
							<QrCode className="size-4.5" />
						</div>
						<div>
							<h4 className="font-bold text-sm text-foreground">
								Gate Verification Scanner
							</h4>
							<p className="text-xs text-muted-foreground mt-0.5">
								Scan QR passes or look up ticket numbers at entry points.
							</p>
						</div>
					</div>

					<Button asChild size="sm" className="h-9 text-xs font-semibold gap-1.5 shrink-0 w-full sm:w-auto">
						<Link href="/ticket/verify" target="_blank">
							<ExternalLink className="size-3.5" /> Launch Gate Scanner
						</Link>
					</Button>
				</CardContent>
			</Card>

			{/* Attendee Roster Card with Reused Search Bar, DataTable and DataTablePagination */}
			<Card className="bg-card">
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
								size="sm"
								onClick={() => {
									setIsQuickModalOpen(true);
									setQuickAction("check_in");
									setQuickCode("");
									setQuickResult(null);
								}}
								className="h-8 text-xs font-semibold gap-1.5 cursor-pointer bg-primary text-primary-foreground shadow-xs"
							>
								<LogIn className="size-3.5" />
								Check In / Out
							</Button>

							<Button
								variant="outline"
								size="sm"
								className="h-8 text-xs gap-1.5 cursor-pointer"
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
								placeholder="Search attendees by name, phone, email, or order ref..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9 h-9 text-xs"
							/>
						</form>

						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="h-9 w-full sm:w-[180px] text-xs bg-background border-border/80 shrink-0">
								<SelectValue placeholder="All Statuses" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all" className="text-xs">
									All Statuses ({tickets.length})
								</SelectItem>
								<SelectItem value="checked_in" className="text-xs">
									Checked In ({checkedInCount})
								</SelectItem>
								<SelectItem value="pending" className="text-xs">
									Pending Entry ({remainingCount})
								</SelectItem>
							</SelectContent>
						</Select>
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

			{/* Manual Pass Verification Modal */}
			<Dialog
				open={Boolean(selectedTicketForVerify)}
				onOpenChange={(isOpen) => {
					if (!isOpen) {
						setSelectedTicketForVerify(null);
						setVerifyCodeInput("");
					}
				}}
			>
				<DialogContent className="sm:max-w-md p-6 bg-background border-border/80 shadow-none">
					<DialogHeader className="text-left space-y-1.5">
						<DialogTitle className="text-base font-bold flex items-center gap-2">
							<ShieldCheck className="size-4 text-primary" />
							Verify & Admit Attendee
						</DialogTitle>
						<DialogDescription className="text-xs text-muted-foreground leading-relaxed">
							Admins must verify the attendee&apos;s ticket code before granting entry. Enter the pass code from the attendee&apos;s phone or receipt.
						</DialogDescription>
					</DialogHeader>

					{selectedTicketForVerify && (
						<form onSubmit={handleVerifyAndCheckIn} className="space-y-4 pt-2">
							<div className="p-3 rounded-lg bg-muted/40 border border-border/60 space-y-2 text-xs">
								<div className="flex justify-between items-center">
									<span className="text-muted-foreground">Attendee:</span>
									<span className="font-bold text-foreground">
										{selectedTicketForVerify.attendeeName}
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-muted-foreground">Ticket Tier:</span>
									<Badge variant="outline" className="text-[10px]">
										{selectedTicketForVerify.ticketType?.name || "General"}
									</Badge>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-muted-foreground">Order Ref:</span>
									<span className="font-mono font-semibold text-foreground">
										{selectedTicketForVerify.orderNumber}
									</span>
								</div>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="verify-ticket-input" className="text-xs font-semibold">
									Enter Attendee Ticket / Pass Code *
								</Label>
								<Input
									id="verify-ticket-input"
									placeholder="e.g. 9M4P10 or E7K2M-9M4P10"
									value={verifyCodeInput}
									onChange={(e) => setVerifyCodeInput(e.target.value.toUpperCase())}
									className="font-mono text-sm uppercase h-10 border-border/80 bg-background"
									autoFocus
									required
								/>
								<p className="text-[11px] text-muted-foreground">
									Located in the attendee&apos;s SMS, WhatsApp pass, or email.
								</p>
							</div>

							<DialogFooter className="pt-2 gap-2 sm:gap-0">
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => {
										setSelectedTicketForVerify(null);
										setVerifyCodeInput("");
									}}
									className="text-xs cursor-pointer"
								>
									Cancel
								</Button>
								<Button
									type="submit"
									size="sm"
									disabled={isVerifying || !verifyCodeInput.trim()}
									className="text-xs font-semibold gap-1.5 cursor-pointer"
								>
									{isVerifying ? (
										<Loader2 className="size-3.5 animate-spin" />
									) : (
										<ShieldCheck className="size-3.5" />
									)}
									Confirm Admission
								</Button>
							</DialogFooter>
						</form>
					)}
				</DialogContent>
			</Dialog>

			{/* Global Quick Check In / Out Modal */}
			<Dialog
				open={isQuickModalOpen}
				onOpenChange={(isOpen) => {
					setIsQuickModalOpen(isOpen);
					if (!isOpen) {
						setQuickCode("");
						setQuickResult(null);
					}
				}}
			>
				<DialogContent className="sm:max-w-md p-6 bg-background border-border/80 shadow-none">
					<DialogHeader className="text-left space-y-1.5">
						<DialogTitle className="text-base font-bold flex items-center gap-2">
							<ShieldCheck className="size-4 text-primary" />
							Gate Pass Check In & Out
						</DialogTitle>
						<DialogDescription className="text-xs text-muted-foreground leading-relaxed">
							Enter the 6-character pass code (or full ticket code) from the attendee&apos;s phone or receipt to update admission status.
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleQuickCheckInOut} className="space-y-4 pt-1">
						{/* Action Selector: Check In vs Check Out */}
						<div className="grid grid-cols-2 gap-2">
							<button
								type="button"
								onClick={() => setQuickAction("check_in")}
								className={cn(
									"flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer",
									quickAction === "check_in"
										? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500"
										: "border-border/70 bg-muted/20 text-muted-foreground hover:bg-muted/40",
								)}
							>
								<LogIn className="size-3.5" />
								Check In (Entry)
							</button>

							<button
								type="button"
								onClick={() => setQuickAction("check_out")}
								className={cn(
									"flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer",
									quickAction === "check_out"
										? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500"
										: "border-border/70 bg-muted/20 text-muted-foreground hover:bg-muted/40",
								)}
							>
								<LogOut className="size-3.5" />
								Check Out (Exit)
							</button>
						</div>

						{/* Code input */}
						<div className="space-y-1.5">
							<Label htmlFor="quick-checkin-code" className="text-xs font-semibold">
								Ticket Pass Code *
							</Label>
							<Input
								id="quick-checkin-code"
								placeholder="e.g. 9M4P10 or E7K2M-9M4P10"
								value={quickCode}
								onChange={(e) => setQuickCode(e.target.value.toUpperCase())}
								className="font-mono text-sm uppercase h-10 border-border/80 bg-background"
								autoFocus
								required
							/>
							<p className="text-[11px] text-muted-foreground">
								Located on the attendee&apos;s WhatsApp/SMS message or live pass link.
							</p>
						</div>

						{quickResult && (
							<div
								className={cn(
									"p-3 rounded-lg border text-xs space-y-1",
									quickResult.success
										? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
										: "bg-destructive/10 border-destructive/30 text-destructive",
								)}
							>
								<p className="font-semibold flex items-center gap-1.5">
									{quickResult.success ? (
										<CheckCircle2 className="size-3.5 shrink-0" />
									) : (
										<ShieldCheck className="size-3.5 shrink-0" />
									)}
									{quickResult.message}
								</p>
								{quickResult.attendeeName && (
									<p className="text-[11px] opacity-80">
										Attendee: {quickResult.attendeeName} ({quickResult.tierName || "General"})
									</p>
								)}
							</div>
						)}

						<DialogFooter className="pt-2 gap-2 sm:gap-0">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => setIsQuickModalOpen(false)}
								className="text-xs cursor-pointer"
							>
								Close
							</Button>
							<Button
								type="submit"
								size="sm"
								disabled={isSubmittingQuick || !quickCode.trim()}
								className={cn(
									"text-xs font-semibold gap-1.5 cursor-pointer",
									quickAction === "check_out"
										? "bg-amber-600 hover:bg-amber-700 text-white"
										: "bg-primary text-primary-foreground",
								)}
							>
								{isSubmittingQuick ? (
									<Loader2 className="size-3.5 animate-spin" />
								) : quickAction === "check_out" ? (
									<LogOut className="size-3.5" />
								) : (
									<LogIn className="size-3.5" />
								)}
								{quickAction === "check_out" ? "Confirm Check-Out" : "Confirm Check-In"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}

