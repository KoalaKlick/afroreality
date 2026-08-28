"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
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
	Sparkles,
	ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
	const [search, setSearch] = useState<string>("");
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isPending, startTransition] = useTransition();

	const loadAttendees = async (searchQuery?: string) => {
		try {
			setIsLoading(true);
			const res = await getEventTicketAttendees({
				data: { eventId: event.id, search: searchQuery },
			});
			setTickets(res.tickets);
			setTotalCount(res.totalCount);
			setCheckedInCount(res.checkedInCount);
			setRemainingCount(res.remainingCount);
		} catch (err: any) {
			toast.error(err.message || "Failed to load ticket attendees.");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		loadAttendees();
	}, [event.id]);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		loadAttendees(search.trim());
	};

	const handleToggleCheckIn = async (
		ticketId: string,
		currentStatus: string,
	) => {
		const nextAction =
			currentStatus === "checked_in" ? "check_out" : "check_in";

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
	};

	const checkInRate =
		totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;

	return (
		<div className="space-y-6">
			{/* Top Overview Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<Card className="border bg-card/60">
					<CardContent className="p-5 flex items-center justify-between">
						<div className="space-y-1">
							<p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
								Total Tickets Issued
							</p>
							<p className="text-2xl font-black text-foreground font-mono">
								{totalCount}
							</p>
						</div>
						<div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
							<Users className="size-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border bg-card/60">
					<CardContent className="p-5 flex items-center justify-between">
						<div className="space-y-1">
							<p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
								Checked In ({checkInRate}%)
							</p>
							<p className="text-2xl font-black text-green-600 dark:text-green-400 font-mono">
								{checkedInCount}
							</p>
						</div>
						<div className="size-11 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center">
							<CheckCircle2 className="size-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border bg-card/60">
					<CardContent className="p-5 flex items-center justify-between">
						<div className="space-y-1">
							<p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
								Awaiting Check-in
							</p>
							<p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
								{remainingCount}
							</p>
						</div>
						<div className="size-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
							<Clock className="size-5" />
						</div>
					</CardContent>
				</Card>
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
							Open the high-speed QR and Ticket Code scanner on door tablet or
							mobile devices.
						</p>
					</div>
				</div>

				<Button asChild size="sm" className="font-bold text-xs gap-2 shrink-0">
					<Link href="/ticket/verify" target="_blank">
						<ExternalLink className="size-3.5" /> Open Gate Scanner
					</Link>
				</Button>
			</div>

			{/* Attendee Roster and Verification Table */}
			<Card className="border bg-card">
				<CardHeader className="p-5 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
						<form onSubmit={handleSearch} className="flex gap-2">
							<div className="relative">
								<Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
								<Input
									placeholder="Search by code, name, email..."
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									className="pl-8 h-8 text-xs w-56 sm:w-64"
								/>
							</div>
							<Button type="submit" size="sm" variant="secondary" className="h-8 text-xs font-semibold">
								Search
							</Button>
						</form>

						<Button
							variant="outline"
							size="icon"
							className="size-8"
							onClick={() => loadAttendees(search.trim())}
							title="Refresh roster"
							disabled={isLoading}
						>
							<RefreshCw
								className={`size-3.5 ${isLoading ? "animate-spin" : ""}`}
							/>
						</Button>
					</div>
				</CardHeader>

				<CardContent className="p-0">
					{isLoading ? (
						<div className="py-16 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
							<Loader2 className="size-4 animate-spin" /> Loading attendee
							records...
						</div>
					) : tickets.length === 0 ? (
						<div className="py-16 text-center space-y-2">
							<Users className="size-10 mx-auto text-muted-foreground/40" />
							<p className="text-sm font-semibold text-foreground">
								No Tickets Found
							</p>
							<p className="text-xs text-muted-foreground max-w-sm mx-auto">
								{search
									? "No attendees match your search query."
									: "Tickets issued for this event will appear here for gate check-in."}
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-xs text-left">
								<thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
									<tr>
										<th className="py-3 px-4">Ticket Code</th>
										<th className="py-3 px-4">Attendee / Buyer</th>
										<th className="py-3 px-4">Ticket Tier</th>
										<th className="py-3 px-4">Check-in Status</th>
										<th className="py-3 px-4">Time</th>
										<th className="py-3 px-4 text-right">Action</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border/60">
									{tickets.map((t) => {
										const isCheckedIn = t.checkInStatus === "checked_in";
										const attendeeName =
											t.attendeeName || t.order?.buyerName || "Guest";
										const attendeeEmail =
											t.attendeeEmail || t.order?.buyerEmail || "-";

										return (
											<tr
												key={t.id}
												className="hover:bg-muted/30 transition-colors"
											>
												<td className="py-3 px-4 font-mono font-bold text-foreground">
													{t.ticketCode}
												</td>
												<td className="py-3 px-4">
													<p className="font-semibold text-foreground">
														{attendeeName}
													</p>
													<p className="text-[11px] text-muted-foreground">
														{attendeeEmail}
													</p>
												</td>
												<td className="py-3 px-4">
													<Badge variant="outline" className="text-[11px]">
														{t.ticketType?.name || "General"}
													</Badge>
												</td>
												<td className="py-3 px-4">
													{isCheckedIn ? (
														<Badge className="bg-green-500/15 text-green-700 dark:text-green-400 hover:bg-green-500/20 border-green-500/30 text-[10px] font-bold gap-1">
															<CheckCircle2 className="size-3" /> Checked In
														</Badge>
													) : (
														<Badge
															variant="secondary"
															className="text-[10px] text-muted-foreground font-medium gap-1"
														>
															<Clock className="size-3" /> Pending
														</Badge>
													)}
												</td>
												<td className="py-3 px-4 text-muted-foreground">
													{t.checkedInAt
														? formatDate(t.checkedInAt, true)
														: "-"}
												</td>
												<td className="py-3 px-4 text-right">
													{isCheckedIn ? (
														<Button
															variant="ghost"
															size="sm"
															onClick={() =>
																handleToggleCheckIn(t.id, t.checkInStatus)
															}
															disabled={isPending}
															className="h-7 text-[11px] text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 gap-1 font-semibold"
														>
															<LogOut className="size-3" /> Undo
														</Button>
													) : (
														<Button
															size="sm"
															onClick={() =>
																handleToggleCheckIn(t.id, t.checkInStatus)
															}
															disabled={isPending}
															className="h-7 text-[11px] font-bold gap-1"
														>
															<LogIn className="size-3" /> Check In
														</Button>
													)}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
