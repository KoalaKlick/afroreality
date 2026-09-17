"use client";

import React, { useState, useTransition } from "react";
import {
	Calendar,
	Search,
	Eye,
	Clock,
	CheckCircle2,
	Building2,
	MapPin,
	ShieldAlert,
	ShieldCheck,
	Ban,
	Coins,
	DollarSign,
	PhoneCall,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { formatAmount } from "@/lib/utils";
import type { AdminEventItem } from "@/lib/dal/admin";
import { adminUpdateEventStatus, adminToggleEventUssd } from "@/lib/server-functions/admin";

interface AdminEventsContentProps {
	events: AdminEventItem[];
	initialStatus?: string;
}

export function AdminEventsContent({ events, initialStatus = "all" }: AdminEventsContentProps) {
	const [eventList, setEventList] = useState<AdminEventItem[]>(events);
	const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedEvent, setSelectedEvent] = useState<AdminEventItem | null>(null);
	const [isAuditSheetOpen, setIsAuditSheetOpen] = useState(false);

	// Event moderation dialog
	const [statusDialogEvent, setStatusDialogEvent] = useState<AdminEventItem | null>(null);
	const [targetStatus, setTargetStatus] = useState<string>("");
	const [statusReason, setStatusReason] = useState("");
	const [isPending, startTransition] = useTransition();

	const now = new Date();

	const handleToggleUssd = (eventId: string, currentVal: boolean) => {
		const newVal = !currentVal;
		setEventList((prev) =>
			prev.map((e) => (e.id === eventId ? { ...e, hasUssd: newVal } : e))
		);
		if (selectedEvent && selectedEvent.id === eventId) {
			setSelectedEvent((prev) => (prev ? { ...prev, hasUssd: newVal } : null));
		}

		startTransition(async () => {
			const res = await adminToggleEventUssd({ eventId, hasUssd: newVal });
			if (res.success) {
				toast.success(res.message);
			} else {
				setEventList((prev) =>
					prev.map((e) => (e.id === eventId ? { ...e, hasUssd: currentVal } : e))
				);
				if (selectedEvent && selectedEvent.id === eventId) {
					setSelectedEvent((prev) => (prev ? { ...prev, hasUssd: currentVal } : null));
				}
				toast.error(res.error || "Failed to update USSD setting");
			}
		});
	};

	const filteredEvents = eventList.filter((ev) => {
		if (statusFilter !== "all" && ev.status !== statusFilter) return false;
		if (typeFilter !== "all" && ev.type !== typeFilter) return false;
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			return (
				ev.title.toLowerCase().includes(q) ||
				ev.organization.name.toLowerCase().includes(q) ||
				(ev.venueCity && ev.venueCity.toLowerCase().includes(q))
			);
		}
		return true;
	});

	const getEventTimelineBadge = (ev: AdminEventItem) => {
		if (ev.status === "cancelled") {
			return (
				<Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30 text-[9px] font-bold uppercase rounded-none shadow-none">
					Cancelled / Delisted
				</Badge>
			);
		}

		if (ev.status === "ended") {
			return (
				<Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[9px] font-semibold rounded-none shadow-none">
					Ended
				</Badge>
			);
		}

		if (ev.startDate) {
			const start = new Date(ev.startDate);
			const end = ev.endDate ? new Date(ev.endDate) : null;

			if (start <= now && (!end || end >= now)) {
				return (
					<Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[9px] font-bold uppercase flex items-center gap-1 rounded-none shadow-none">
						<span className="h-1.5 w-1.5 bg-emerald-500 animate-pulse" />
						Ongoing Now
					</Badge>
				);
			}

			if (start > now) {
				const diffDays = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
				return (
					<Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-[9px] font-semibold rounded-none shadow-none">
						Starts in {diffDays} {diffDays === 1 ? "day" : "days"}
					</Badge>
				);
			}
		}

		return (
			<Badge variant="outline" className="text-[9px] capitalize font-medium rounded-none shadow-none border-border">
				{ev.status}
			</Badge>
		);
	};

	const handleOpenAudit = (ev: AdminEventItem) => {
		setSelectedEvent(ev);
		setIsAuditSheetOpen(true);
	};

	const handleConfirmStatusChange = () => {
		if (!statusDialogEvent || !targetStatus) return;

		startTransition(async () => {
			const res = await adminUpdateEventStatus({
				eventId: statusDialogEvent.id,
				status: targetStatus,
				reason: statusReason.trim() || undefined,
			});

			if (res.success) {
				toast.success(res.message);
				setStatusDialogEvent(null);
				setStatusReason("");
				if (selectedEvent && selectedEvent.id === statusDialogEvent.id) {
					setSelectedEvent({ ...selectedEvent, status: targetStatus });
				}
			} else {
				toast.error(res.error || "Failed to update status");
			}
		});
	};

	return (
		<div className="flex flex-col gap-6 rounded-none shadow-none">
			{/* Filters & Search */}
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-none shadow-none">
				<div className="flex flex-1 flex-wrap items-center gap-2">
					<div className="relative flex-1 min-w-[220px] max-w-sm">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search by event title, host, or city..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9 bg-background text-xs rounded-none shadow-none border-border"
						/>
					</div>

					{/* Status Filter Buttons */}
					<div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
						{["all", "ongoing", "published", "ended", "draft", "cancelled"].map((st) => (
							<button
								key={st}
								type="button"
								onClick={() => setStatusFilter(st)}
								className={`px-2.5 py-1.5 text-xs font-semibold capitalize transition-all whitespace-nowrap rounded-none shadow-none border ${
									statusFilter === st
										? "bg-primary text-primary-foreground border-primary font-bold"
										: "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted border-border"
								}`}
							>
								{st}
							</button>
						))}
					</div>
				</div>

				<div className="flex items-center gap-2 shrink-0">
					<span className="text-xs text-muted-foreground">
						Showing <strong>{filteredEvents.length}</strong> of {events.length} events
					</span>
				</div>
			</div>

			{/* Events Grid - Flat & Sharp */}
			{filteredEvents.length === 0 ? (
				<Card className="border border-border rounded-none shadow-none">
					<CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
						<Calendar className="h-10 w-10 mb-3 opacity-40" />
						<h3 className="text-base font-semibold text-foreground">No events match filters</h3>
						<p className="text-xs max-w-sm mt-1">
							Try switching status filter or clearing your search query.
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 rounded-none shadow-none">
					{filteredEvents.map((ev) => (
						<Card
							key={ev.id}
							className="border border-border bg-card rounded-none shadow-none flex flex-col justify-between"
						>
							<CardHeader className="pb-3 border-b border-border rounded-none shadow-none">
								<div className="flex items-start justify-between gap-2">
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2 mb-1">
											<Badge
												variant="outline"
												className="text-[9px] uppercase font-bold text-muted-foreground rounded-none shadow-none border-border"
											>
												{ev.type}
											</Badge>
											{getEventTimelineBadge(ev)}
										</div>
										<CardTitle className="text-sm font-bold text-foreground line-clamp-1">
											{ev.title}
										</CardTitle>
										<div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 truncate">
											<Building2 className="h-3 w-3 text-primary shrink-0" />
											<span className="truncate">{ev.organization.name}</span>
										</div>
									</div>
								</div>
							</CardHeader>

							<CardContent className="space-y-3 pt-3 rounded-none shadow-none">
								{/* Dates & Location */}
								<div className="bg-muted/30 p-2.5 border border-border text-xs space-y-1 rounded-none shadow-none">
									<div className="flex items-center justify-between text-muted-foreground">
										<span className="flex items-center gap-1">
											<Clock className="h-3 w-3" />
											Start:
										</span>
										<span className="font-medium text-foreground">
											{ev.startDate
												? new Date(ev.startDate).toLocaleDateString()
												: "Unscheduled"}
										</span>
									</div>
									<div className="flex items-center justify-between text-muted-foreground">
										<span className="flex items-center gap-1">
											<Clock className="h-3 w-3" />
											End:
										</span>
										<span className="font-medium text-foreground">
											{ev.endDate
												? new Date(ev.endDate).toLocaleDateString()
												: "No end set"}
										</span>
									</div>
									<div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border">
										<span className="flex items-center gap-1">
											<MapPin className="h-3 w-3" />
											Location:
										</span>
										<span className="font-medium text-foreground truncate max-w-[150px]">
											{ev.isVirtual ? "Virtual Event" : ev.venueCity || ev.venueCountry}
										</span>
									</div>
								</div>

								{/* USSD Mobile Gateway Feature Toggle */}
								<div className="flex items-center justify-between p-2 bg-muted/30 border border-border text-xs rounded-none shadow-none">
									<div className="flex items-center gap-1.5 min-w-0 pr-2">
										<PhoneCall className={`h-3.5 w-3.5 shrink-0 ${ev.hasUssd ? "text-emerald-500" : "text-muted-foreground"}`} />
										<div className="min-w-0">
											<span className="font-semibold text-foreground block text-[11px] leading-tight">
												USSD Gateway
											</span>
											<span className="text-[10px] text-muted-foreground font-mono truncate block">
												{ev.hasUssd ? (ev.ussdCode ? `*384*77340*${ev.ussdCode}#` : "Active") : "Disabled"}
											</span>
										</div>
									</div>
									<div className="flex items-center gap-2 shrink-0">
										<Badge
											variant="outline"
											className={`text-[9px] font-bold uppercase rounded-none shadow-none px-1.5 py-0 ${
												ev.hasUssd
													? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
													: "bg-muted text-muted-foreground border-border"
											}`}
										>
											{ev.hasUssd ? "ON" : "OFF"}
										</Badge>
										<Switch
											checked={ev.hasUssd}
											disabled={isPending}
											onCheckedChange={() => handleToggleUssd(ev.id, ev.hasUssd)}
										/>
									</div>
								</div>

								{/* Amount & Share Performance Strip */}
								<div className="p-2.5 bg-muted/20 border border-border space-y-1 rounded-none shadow-none text-xs">
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">Gross Inflow:</span>
										<span className="font-bold text-foreground font-mono">
											{formatAmount(ev.totalGrossRevenue, "GHS")}
										</span>
									</div>

									<div className="flex items-center justify-between text-primary font-semibold">
										<span className="flex items-center gap-1">
											<Coins className="h-3 w-3" />
											Our Share (Fee):
										</span>
										<span className="font-mono">
											{formatAmount(ev.ourPlatformShare, "GHS")}
										</span>
									</div>

									<div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border">
										<span>Organizer Receives:</span>
										<span className="font-mono text-foreground">
											{formatAmount(ev.organizerNetRevenue, "GHS")}
										</span>
									</div>
								</div>

								{/* Audit View Action */}
								<div className="pt-1">
									<Button
										variant="outline"
										size="sm"
										className="w-full text-xs font-semibold rounded-none shadow-none border-border hover:bg-primary hover:text-primary-foreground hover:border-primary"
										onClick={() => handleOpenAudit(ev)}
									>
										<Eye className="h-3.5 w-3.5 mr-1.5" />
										Inspect Event (View-Only Audit)
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* View-Only Event Audit Sheet - Flat & Square */}
			<Sheet open={isAuditSheetOpen} onOpenChange={setIsAuditSheetOpen}>
				<SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto p-0 flex flex-col bg-background border-l border-border rounded-none shadow-none">
					{selectedEvent && (
						<>
							<SheetHeader className="p-6 border-b border-border bg-muted/20 rounded-none shadow-none">
								<div>
									<div className="flex items-center gap-2 mb-1.5">
										<Badge variant="outline" className="text-[9px] uppercase font-bold rounded-none shadow-none">
											{selectedEvent.type}
										</Badge>
										{getEventTimelineBadge(selectedEvent)}
									</div>
									<SheetTitle className="text-base font-bold text-foreground">
										{selectedEvent.title}
									</SheetTitle>
									<SheetDescription className="text-xs font-mono">
										Host: <strong>{selectedEvent.organization.name}</strong> • Created: {new Date(selectedEvent.createdAt).toLocaleDateString()}
									</SheetDescription>
								</div>
							</SheetHeader>

							<div className="p-6 space-y-6 flex-1 text-xs">
								{/* Read-Only Governance Notice */}
								<div className="flex items-center gap-2.5 p-3 bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 rounded-none shadow-none">
									<ShieldCheck className="h-4 w-4 shrink-0" />
									<span>
										<strong>Platform Policy:</strong> Core event configurations (contestant ballots, ticket inventory, private agenda) belong to the organizer and are protected in read-only audit mode.
									</span>
								</div>

								{/* Financial Share Split Breakdown */}
								<div className="p-4 border border-border bg-card space-y-3 rounded-none shadow-none">
									<h4 className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-2 text-primary">
										<Coins className="h-3.5 w-3.5" />
										Revenue Inflow & Platform Share Split
									</h4>
									<div className="grid grid-cols-3 gap-2">
										<div className="p-3 bg-muted/40 border border-border rounded-none shadow-none">
											<span className="text-[10px] uppercase font-bold text-muted-foreground block">
												Gross Total
											</span>
											<span className="text-sm font-bold text-foreground font-mono mt-1 block">
												{formatAmount(selectedEvent.totalGrossRevenue, "GHS")}
											</span>
										</div>
										<div className="p-3 bg-primary/10 border border-primary/30 rounded-none shadow-none">
											<span className="text-[10px] uppercase font-bold text-primary block">
												Our Share (Fee)
											</span>
											<span className="text-sm font-bold text-primary font-mono mt-1 block">
												{formatAmount(selectedEvent.ourPlatformShare, "GHS")}
											</span>
										</div>
										<div className="p-3 bg-muted/40 border border-border rounded-none shadow-none">
											<span className="text-[10px] uppercase font-bold text-muted-foreground block">
												Organizer Net
											</span>
											<span className="text-sm font-bold text-foreground font-mono mt-1 block">
												{formatAmount(selectedEvent.organizerNetRevenue, "GHS")}
											</span>
										</div>
									</div>

									{/* Streams breakdown */}
									<div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-muted-foreground">
										<div>
											<span>Ticket Sales:</span>{" "}
											<strong className="text-foreground font-mono">
												{formatAmount(selectedEvent.ticketStats.revenue, "GHS")}
											</strong>{" "}
											({selectedEvent.ticketStats.ticketsSold} tickets)
										</div>
										<div>
											<span>Voting Sales:</span>{" "}
											<strong className="text-foreground font-mono">
												{formatAmount(selectedEvent.votingStats.revenue, "GHS")}
											</strong>{" "}
											({selectedEvent.votingStats.totalVotes} votes)
										</div>
									</div>
								</div>

								{/* Timing & Schedule */}
								<div className="p-4 border border-border bg-card space-y-3 rounded-none shadow-none">
									<h4 className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-2">
										<Clock className="h-3.5 w-3.5 text-primary" />
										Schedule & Dates
									</h4>
									<div className="grid grid-cols-2 gap-3 text-muted-foreground">
										<div>
											<span className="block text-[10px] uppercase font-bold">Start Date & Time</span>
											<span className="font-semibold text-foreground">
												{selectedEvent.startDate
													? new Date(selectedEvent.startDate).toLocaleString()
													: "Not set"}
											</span>
										</div>
										<div>
											<span className="block text-[10px] uppercase font-bold">End Date & Time</span>
											<span className="font-semibold text-foreground">
												{selectedEvent.endDate
													? new Date(selectedEvent.endDate).toLocaleString()
													: "Not set"}
											</span>
										</div>
										<div>
											<span className="block text-[10px] uppercase font-bold">Timezone</span>
											<span className="font-semibold text-foreground">{selectedEvent.timezone}</span>
										</div>
										<div>
											<span className="block text-[10px] uppercase font-bold">Registration Deadline</span>
											<span className="font-semibold text-foreground">
												{selectedEvent.registrationDeadline
													? new Date(selectedEvent.registrationDeadline).toLocaleDateString()
													: "Open until start"}
											</span>
										</div>
									</div>
								</div>

								{/* Venue & Organizer Details */}
								<div className="p-4 border border-border bg-card space-y-3 rounded-none shadow-none">
									<h4 className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-2">
										<Building2 className="h-3.5 w-3.5 text-primary" />
										Host & Location
									</h4>
									<div className="grid grid-cols-2 gap-3 text-muted-foreground">
										<div>
											<span className="block text-[10px] uppercase font-bold">Host Organization</span>
											<span className="font-semibold text-foreground">
												{selectedEvent.organization.name}
											</span>
										</div>
										<div>
											<span className="block text-[10px] uppercase font-bold">Contact Email</span>
											<span className="font-semibold text-foreground">
												{selectedEvent.organization.contactEmail || "Not provided"}
											</span>
										</div>
										<div>
											<span className="block text-[10px] uppercase font-bold">Location Type</span>
											<span className="font-semibold text-foreground">
												{selectedEvent.isVirtual ? "Virtual (Online)" : "In-Person Venue"}
											</span>
										</div>
										<div>
											<span className="block text-[10px] uppercase font-bold">Venue Name / City</span>
											<span className="font-semibold text-foreground">
												{selectedEvent.venueName || selectedEvent.venueCity || "Ghana"}
											</span>
										</div>
									</div>
								</div>

								{/* USSD Gateway Detailed Configuration Box */}
								<div className="p-4 border border-border bg-card space-y-3 rounded-none shadow-none">
									<div className="flex items-center justify-between">
										<h4 className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-2">
											<PhoneCall className="h-3.5 w-3.5 text-primary" />
											USSD Mobile Dialer Controls
										</h4>
										<Switch
											checked={selectedEvent.hasUssd}
											disabled={isPending}
											onCheckedChange={() => handleToggleUssd(selectedEvent.id, selectedEvent.hasUssd)}
										/>
									</div>
									<p className="text-muted-foreground text-xs">
										Allow users to dial via basic mobile phones to purchase tickets or cast votes without internet data.
									</p>
									<div className="grid grid-cols-2 gap-3 text-muted-foreground pt-1 border-t border-border">
										<div>
											<span className="block text-[10px] uppercase font-bold">Access Status</span>
											<span className={`font-semibold ${selectedEvent.hasUssd ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
												{selectedEvent.hasUssd ? "Active & Dialable" : "Deactivated by Super Admin"}
											</span>
										</div>
										<div>
											<span className="block text-[10px] uppercase font-bold">Assigned USSD String</span>
											<span className="font-mono text-foreground font-semibold">
												{selectedEvent.ussdCode ? `*384*77340*${selectedEvent.ussdCode}#` : "*384*77340#"}
											</span>
										</div>
									</div>
								</div>

								{/* Platform Governance Actions */}
								<div className="p-4 border border-rose-500/30 bg-rose-500/5 space-y-3 rounded-none shadow-none">
									<h4 className="font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider text-[11px] flex items-center gap-2">
										<ShieldAlert className="h-3.5 w-3.5" />
										Platform Moderation Controls
									</h4>
									<p className="text-muted-foreground text-xs">
										If this event violates platform terms, contains fraudulent ticket tiers, or illegal content, platform administrators can intervene.
									</p>

									<div className="flex gap-2 justify-end pt-1">
										{selectedEvent.status === "cancelled" ? (
											<Button
												variant="outline"
												size="sm"
												disabled={isPending}
												onClick={() => {
													setStatusDialogEvent(selectedEvent);
													setTargetStatus("published");
												}}
												className="text-xs rounded-none shadow-none border-border"
											>
												<CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
												Reactivate Event
											</Button>
										) : (
											<Button
												variant="destructive"
												size="sm"
												disabled={isPending}
												onClick={() => {
													setStatusDialogEvent(selectedEvent);
													setTargetStatus("cancelled");
												}}
												className="text-xs font-semibold rounded-none shadow-none"
											>
												<Ban className="h-3.5 w-3.5 mr-1.5" />
												Delist / Cancel Event
											</Button>
										)}
									</div>
								</div>
							</div>
						</>
					)}
				</SheetContent>
			</Sheet>

			{/* Status Moderation Confirmation Dialog */}
			<Dialog open={!!statusDialogEvent} onOpenChange={(open) => !open && setStatusDialogEvent(null)}>
				<DialogContent className="sm:max-w-md rounded-none shadow-none border border-border">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-rose-600">
							<ShieldAlert className="h-5 w-5" />
							{targetStatus === "cancelled" ? "Cancel / Delist Event" : "Reactivate Event"}
						</DialogTitle>
						<DialogDescription className="text-xs">
							{targetStatus === "cancelled"
								? `Are you sure you want to delist "${statusDialogEvent?.title}"? Public ticket sales and voting will be halted immediately.`
								: `Are you sure you want to reactivate "${statusDialogEvent?.title}"?`}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-2 py-2">
						<label className="text-xs font-medium text-foreground">
							Reason (Audit Trail):
						</label>
						<Input
							placeholder="e.g. Terms violation, requested by organizer, fraud suspicion..."
							value={statusReason}
							onChange={(e) => setStatusReason(e.target.value)}
							className="text-xs rounded-none shadow-none border-border"
						/>
					</div>

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setStatusDialogEvent(null)}
							disabled={isPending}
							className="text-xs rounded-none shadow-none"
						>
							Cancel
						</Button>
						<Button
							variant={targetStatus === "cancelled" ? "destructive" : "default"}
							size="sm"
							onClick={handleConfirmStatusChange}
							disabled={isPending}
							className="text-xs font-semibold rounded-none shadow-none"
						>
							{isPending ? "Applying..." : "Confirm Action"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
