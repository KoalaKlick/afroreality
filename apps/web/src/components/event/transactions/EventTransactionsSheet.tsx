"use client";
// src/components/event/transactions/EventTransactionsSheet.tsx

import { useState, useCallback, useEffect } from "react";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Loader2,
	Ticket as TicketIcon,
	Vote as VoteIcon,
	Search,
	ArrowUpDown,
	Calendar,
	User,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { formatAmount, formatDate } from "@/lib/utils";
import {
	getEventVoteTransactions,
	getEventTicketTransactions,
} from "@/lib/server-functions/event-transactions";

interface EventTransactionsSheetProps {
	eventId: string;
	isVotingType: boolean;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	defaultType?: "votes" | "tickets";
}

export function EventTransactionsSheet({
	eventId,
	isVotingType,
	open,
	onOpenChange,
	defaultType = "tickets",
}: EventTransactionsSheetProps) {
	const [activeTab, setActiveTab] = useState<"votes" | "tickets">(defaultType);
	const [searchQuery, setSearchQuery] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const [voteData, setVoteData] = useState<{ items: any[]; total: number }>({
		items: [],
		total: 0,
	});
	const [ticketData, setTicketData] = useState<{ items: any[]; total: number }>({
		items: [],
		total: 0,
	});

	const [page, setPage] = useState(1);
	const limit = 10;

	useEffect(() => {
		if (open) {
			setActiveTab(defaultType);
			setPage(1);
			setSearchQuery("");
		}
	}, [open, defaultType]);

	const loadData = useCallback(async () => {
		if (!open || !eventId) return;
		setIsLoading(true);
		try {
			if (activeTab === "votes") {
				const res = await getEventVoteTransactions({
					data: { eventId, page, limit, search: searchQuery },
				});
				setVoteData(res);
			} else {
				const res = await getEventTicketTransactions({
					data: { eventId, page, limit, search: searchQuery },
				});
				setTicketData(res);
			}
		} catch (e) {
			console.error("[TRANSACTIONS-SHEET-ERROR]", e);
		} finally {
			setIsLoading(false);
		}
	}, [open, eventId, activeTab, page, searchQuery]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const currentData = activeTab === "votes" ? voteData : ticketData;
	const totalPages = Math.max(1, Math.ceil(currentData.total / limit));

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				variant="afro"
				className="w-full sm:max-w-2xl flex flex-col h-full p-0"
			>
				<SheetHeader className="shrink-0 px-6 py-6 border-b border-border/60">
					<div className="flex items-center gap-2">
						{activeTab === "votes" ? (
							<div className="size-9 rounded-lg bg-primary-100 dark:bg-primary-950/50 text-primary flex items-center justify-center shrink-0">
								<VoteIcon className="size-5" />
							</div>
						) : (
							<div className="size-9 rounded-lg bg-primary-100 dark:bg-primary-950/50 text-primary flex items-center justify-center shrink-0">
								<TicketIcon className="size-5" />
							</div>
						)}
						<div>
							<SheetTitle className="text-xl font-bold">
								{activeTab === "votes" ? "Vote Transactions Breakdown" : "Ticket Orders Breakdown"}
							</SheetTitle>
							<SheetDescription className="text-xs">
								View real-time payments, quantities, and verification statuses for this event.
							</SheetDescription>
						</div>
					</div>

					<div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
						<Tabs
							value={activeTab}
							onValueChange={(v) => {
								setActiveTab(v as any);
								setPage(1);
							}}
							className="w-auto"
						>
							<TabsList variant="afro" className="h-9">
								<TabsTrigger variant="afro" value="tickets" className="text-xs gap-1.5">
									<TicketIcon className="size-3.5" />
									<span>Tickets ({ticketData.total})</span>
								</TabsTrigger>
								{isVotingType && (
									<TabsTrigger variant="afro" value="votes" className="text-xs gap-1.5">
										<VoteIcon className="size-3.5" />
										<span>Votes ({voteData.total})</span>
									</TabsTrigger>
								)}
							</TabsList>
						</Tabs>

						<div className="relative flex-1 sm:max-w-xs">
							<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
							<Input
								placeholder="Search references, names..."
								value={searchQuery}
								onChange={(e) => {
									setSearchQuery(e.target.value);
									setPage(1);
								}}
								className="pl-8 h-9 text-xs bg-background"
							/>
						</div>
					</div>
				</SheetHeader>

				{/* Body Content */}
				<div className="flex-1 overflow-y-auto p-6 space-y-4">
					{isLoading ? (
						<div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
							<Loader2 className="size-6 animate-spin text-primary" />
							<span className="text-xs">Loading transaction records...</span>
						</div>
					) : currentData.items.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-2 border border-dashed rounded-lg">
							<span className="text-sm font-medium text-foreground">No records found</span>
							<span className="text-xs max-w-xs">
								{searchQuery ? "No transactions match your search filter." : "Transactions will appear here once attendees purchase tickets or cast votes."}
							</span>
						</div>
					) : (
						<div className="space-y-2.5">
							{currentData.items.map((item) => (
								<div
									key={item.id}
									className="p-3.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
								>
									<div className="flex items-start gap-3 min-w-0">
										<div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
											{activeTab === "votes" ? (
												<VoteIcon className="size-4" />
											) : (
												<TicketIcon className="size-4" />
											)}
										</div>
										<div className="flex flex-col min-w-0">
											<div className="flex items-center gap-2">
												<span className="font-semibold text-foreground truncate">
													{activeTab === "votes"
														? `${item.voteCount} vote(s) for ${item.nomineeName}`
														: `${item.ticketCount}x ${item.ticketType}`}
												</span>
												<StatusBadge
													variant={item.status === "completed" || item.status === "paid" ? "completed" : "pending"}
													text={item.status}
												/>
											</div>

											<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground mt-1">
												<span className="font-mono text-[11px] text-foreground/80">
													{item.reference}
												</span>
												{item.customerName && item.customerName !== "Customer" && (
													<span className="flex items-center gap-1">
														<User className="size-3" />
														{item.customerName}
													</span>
												)}
												<span className="flex items-center gap-1 text-[11px]">
													<Calendar className="size-3" />
													{formatDate(item.createdAt)}
												</span>
											</div>
										</div>
									</div>

									<div className="text-right shrink-0">
										<span className="font-mono font-bold text-sm text-foreground">
											{formatAmount(item.amount, item.currency || "GHS")}
										</span>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Pagination Footer */}
				<div className="shrink-0 px-6 py-3 border-t bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
					<span>
						Showing {currentData.items.length} of {currentData.total} record(s)
					</span>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={page <= 1 || isLoading}
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							className="h-7 px-2 text-xs"
						>
							Prev
						</Button>
						<span className="text-[11px] font-medium">
							Page {page} of {totalPages}
						</span>
						<Button
							variant="outline"
							size="sm"
							disabled={page >= totalPages || isLoading}
							onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
							className="h-7 px-2 text-xs"
						>
							Next
						</Button>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
