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
	Ticket as TicketIcon,
	Vote as VoteIcon,
	Award,
	Banknote,
} from "lucide-react";
import {
	getEventVoteTransactions,
	getEventTicketTransactions,
	getEventNominationTransactions,
} from "@/lib/server-functions/event-transactions";
import { getEventPaymentRevenue } from "@/lib/server-functions/event-revenue";
import type { EventRevenuePayment } from "@/lib/server-functions/event-revenue";
import { VoteTransactionsTable } from "./VoteTransactionsTable";
import { TicketTransactionsTable } from "./TicketTransactionsTable";
import { NominationTransactionsTable } from "./NominationTransactionsTable";
import { RevenueBreakdownTable } from "./RevenueBreakdownTable";

interface EventTransactionsSheetProps {
	eventId: string;
	isVotingType: boolean;
	isTicketedType: boolean;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	defaultType?: "votes" | "tickets" | "nominations" | "revenue";
}

export function EventTransactionsSheet({
	eventId,
	isVotingType,
	isTicketedType,
	open,
	onOpenChange,
	defaultType = "tickets",
}: EventTransactionsSheetProps) {
	const [activeTab, setActiveTab] = useState<
		"votes" | "tickets" | "nominations" | "revenue"
	>(defaultType);
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
	const [nominationData, setNominationData] = useState<{ items: any[]; total: number }>({
		items: [],
		total: 0,
	});
	const [revenueData, setRevenueData] = useState<{
		items: EventRevenuePayment[];
		total: number;
		totals: {
			ticketRevenue: number;
			voteRevenue: number;
			nominationRevenue: number;
			totalRevenue: number;
		};
	}>({
		items: [],
		total: 0,
		totals: { ticketRevenue: 0, voteRevenue: 0, nominationRevenue: 0, totalRevenue: 0 },
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
			} else if (activeTab === "tickets") {
				const res = await getEventTicketTransactions({
					data: { eventId, page, limit, search: searchQuery },
				});
				setTicketData(res);
			} else if (activeTab === "nominations") {
				const res = await getEventNominationTransactions({
					data: { eventId, page, limit, search: searchQuery },
				});
				setNominationData(res);
			} else if (activeTab === "revenue") {
				const res = await getEventPaymentRevenue({
					data: { eventId, page, limit, search: searchQuery },
				});
				setRevenueData(res);
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

	const totalVotesPages = Math.max(1, Math.ceil(voteData.total / limit));
	const totalTicketsPages = Math.max(1, Math.ceil(ticketData.total / limit));
	const totalNominationPages = Math.max(1, Math.ceil(nominationData.total / limit));
	const totalRevenuePages = Math.max(1, Math.ceil(revenueData.total / limit));

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				variant="brand"
				className="w-full sm:max-w-3xl flex flex-col h-full p-0"
			>
				<SheetHeader className="shrink-0 px-6 py-6 border-b border-border/60">
					<div className="flex items-center gap-3">
						<div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 ring-1 ring-primary/20">
							{activeTab === "votes" ? (
								<VoteIcon className="size-5" />
							) : activeTab === "nominations" ? (
								<Award className="size-5" />
							) : activeTab === "revenue" ? (
								<Banknote className="size-5" />
							) : (
								<TicketIcon className="size-5" />
							)}
						</div>
						<div>
							<SheetTitle className="text-xl font-bold text-foreground">
								{activeTab === "votes"
									? "Vote Transactions Breakdown"
									: activeTab === "nominations"
										? "Nomination Transactions Breakdown"
										: activeTab === "revenue"
											? "Revenue Breakdown"
											: "Ticket Orders Breakdown"}
							</SheetTitle>
							<SheetDescription className="text-xs text-muted-foreground mt-0.5">
								{activeTab === "votes"
									? "Detailed audit log of votes cast, amounts paid, voter contacts, and nominees."
									: activeTab === "nominations"
										? "Detailed record of public nominee registrations and paid nomination fees."
										: activeTab === "revenue"
											? "All completed payments received, broken down by ticket sales, votes, and nominations."
											: "Detailed breakdown of ticket tier purchases, buyer info, and order references."}
							</SheetDescription>
						</div>
					</div>

					<div className="pt-4 flex items-center justify-between">
						<Tabs
							value={activeTab}
							onValueChange={(v) => {
								setActiveTab(v as any);
								setPage(1);
								setSearchQuery("");
							}}
							className="w-full"
						>
							<TabsList variant="brand" className="h-9 w-full sm:w-auto">
								<TabsTrigger variant="brand" value="revenue" className="text-xs gap-1.5 flex-1 sm:flex-initial">
									<Banknote className="size-3.5" />
									<span>Revenue</span>
								</TabsTrigger>
								{isTicketedType && (
									<TabsTrigger variant="brand" value="tickets" className="text-xs gap-1.5 flex-1 sm:flex-initial">
										<TicketIcon className="size-3.5" />
										<span>Tickets ({ticketData.total})</span>
									</TabsTrigger>
								)}
								{isVotingType && (
									<>
										<TabsTrigger variant="brand" value="votes" className="text-xs gap-1.5 flex-1 sm:flex-initial">
											<VoteIcon className="size-3.5" />
											<span>Votes ({voteData.total})</span>
										</TabsTrigger>
										<TabsTrigger variant="brand" value="nominations" className="text-xs gap-1.5 flex-1 sm:flex-initial">
											<Award className="size-3.5" />
											<span>Nominations ({nominationData.total})</span>
										</TabsTrigger>
									</>
								)}
							</TabsList>
						</Tabs>
					</div>
				</SheetHeader>

				{/* Body Content */}
				<div className="flex-1 overflow-y-auto p-6">
					{activeTab === "revenue" && (
						<RevenueBreakdownTable
							data={revenueData.items}
							total={revenueData.total}
							page={page}
							totalPages={totalRevenuePages}
							isLoading={isLoading}
							searchQuery={searchQuery}
							onSearchChange={(q) => {
								setSearchQuery(q);
								setPage(1);
							}}
							onPageChange={(p) => setPage(p)}
						/>
					)}

					{activeTab === "votes" && (
						<VoteTransactionsTable
							data={voteData.items}
							total={voteData.total}
							page={page}
							totalPages={totalVotesPages}
							isLoading={isLoading}
							searchQuery={searchQuery}
							onSearchChange={(q) => {
								setSearchQuery(q);
								setPage(1);
							}}
							onPageChange={(p) => setPage(p)}
						/>
					)}

					{activeTab === "tickets" && (
						<TicketTransactionsTable
							data={ticketData.items}
							total={ticketData.total}
							page={page}
							totalPages={totalTicketsPages}
							isLoading={isLoading}
							searchQuery={searchQuery}
							onSearchChange={(q) => {
								setSearchQuery(q);
								setPage(1);
							}}
							onPageChange={(p) => setPage(p)}
						/>
					)}

					{activeTab === "nominations" && (
						<NominationTransactionsTable
							data={nominationData.items}
							total={nominationData.total}
							page={page}
							totalPages={totalNominationPages}
							isLoading={isLoading}
							searchQuery={searchQuery}
							onSearchChange={(q) => {
								setSearchQuery(q);
								setPage(1);
							}}
							onPageChange={(p) => setPage(p)}
						/>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}

