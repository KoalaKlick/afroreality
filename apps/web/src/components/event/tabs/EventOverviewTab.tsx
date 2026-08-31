"use client";
// src/components/event/tabs/EventOverviewTab.tsx

import { useState } from "react";
import {
	StatCard,
	StatsGrid,
	statIcons,
} from "@/components/event/core/EventStats";
import { BarChart, type VotingChartCategory } from "../charts/voting/BarChart";
import { TrendChart, type VoteTrendPoint } from "../charts/voting/TrendChart";
import { PieChart } from "../charts/voting/PieChart";
import {
	TypeBarChart,
	type TicketTypeSales,
} from "../charts/ticket/TypeBarChart";
import {
	TrendChart as TicketTrendChard,
	type TicketTrendPoint,
} from "../charts/ticket/TrendChart";
import { CategoryDetailModal } from "../nomination/CategoryDetailModal";
import { EventTransactionsSheet } from "../transactions/EventTransactionsSheet";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { formatAmount } from "@/lib/utils";

interface EventOverviewTabProps {
	readonly event: any;
	readonly eventStats?: {
		revenue?: number;
		ticketRevenue?: number;
		voteRevenue?: number;
		nominationRevenue?: number;
		ticketsSold?: number;
		capacity?: number | null;
		checkIns?: number;
		totalVotes?: number;
		totalCategories?: number;
		totalOrders?: number;
	};
	readonly votingCategories?: VotingChartCategory[];
	readonly voteTrend?: VoteTrendPoint[];
	readonly ticketTrend?: TicketTrendPoint[];
	readonly ticketTypeSales?: TicketTypeSales[];
}

export function EventOverviewTab({
	event,
	eventStats,
	votingCategories = [],
	voteTrend = [],
	ticketTrend = [],
	ticketTypeSales = [],
}: EventOverviewTabProps) {
	const [selectedCategory, setSelectedCategory] = useState<VotingChartCategory | null>(null);
	const [modalOpen, setModalOpen] = useState(false);
	const [breakdownOpen, setBreakdownOpen] = useState(false);
	const [breakdownType, setBreakdownType] = useState<"votes" | "tickets">("tickets");

	const stats = {
		revenue: eventStats?.revenue ?? 0,
		ticketRevenue: eventStats?.ticketRevenue ?? 0,
		voteRevenue: eventStats?.voteRevenue ?? 0,
		nominationRevenue: eventStats?.nominationRevenue ?? 0,
		ticketsSold: eventStats?.ticketsSold ?? 0,
		capacity: eventStats?.capacity ?? null,
		checkIns: eventStats?.checkIns ?? 0,
		totalVotes: eventStats?.totalVotes ?? 0,
		totalCategories: eventStats?.totalCategories ?? votingCategories.length,
		totalOrders: eventStats?.totalOrders ?? 0,
	};

	const sponsors = event.sponsors ?? [];
	const socialLinks = event.socialLinks ?? [];
	const galleryLinks = event.galleryLinks ?? [];
	const eventType = event.type;
	const votingMode = event.votingMode;
	const isVotingType = eventType === "voting" || eventType === "hybrid";

	function handleCategoryClick(category: VotingChartCategory) {
		setSelectedCategory(category);
		setModalOpen(true);
	}

	function handleViewBreakdown(type: "votes" | "tickets") {
		setBreakdownType(type);
		setBreakdownOpen(true);
	}

	return (
		<div className="space-y-6 @container">
			{/* Event Overview Stats */}
			<StatsGrid columns={4}>
				<StatCard
					label="Gross Revenue"
					value={formatAmount(stats.revenue)}
					iconSrc={statIcons.cedi}
					description={
						[
							stats.ticketRevenue > 0 &&
								`Tickets ${formatAmount(stats.ticketRevenue)}`,
							stats.voteRevenue > 0 &&
								`Votes ${formatAmount(stats.voteRevenue)}`,
							stats.nominationRevenue > 0 &&
								`Nominations ${formatAmount(stats.nominationRevenue)}`,
						]
							.filter(Boolean)
							.join(" • ") || "Click to view breakdown"
					}
					onClick={() => handleViewBreakdown(eventType === "voting" ? "votes" : "tickets")}
					className="cursor-pointer hover:border-primary/40 hover:shadow-xs transition-all"
				/>

				{(eventType === "ticketed" || eventType === "hybrid") && (
					<StatCard
						label="Tickets Sold"
						value={stats.ticketsSold}
						iconSrc={statIcons.ticket}
						description={
							stats.capacity ? `/ ${stats.capacity} capacity` : undefined
						}
						onClick={() => handleViewBreakdown("tickets")}
						className="cursor-pointer hover:border-primary/40 hover:shadow-xs transition-all"
					/>
				)}

				{(eventType === "voting" || eventType === "hybrid") && (
					<div className="relative group">
						<StatCard
							label="Total Votes"
							value={stats.totalVotes}
							iconSrc={statIcons.vote}
							onClick={() => handleViewBreakdown("votes")}
							className="cursor-pointer hover:border-primary/40 hover:shadow-xs transition-all"
						/>
						<Button
							variant="ghost"
							size="sm"
							onClick={(e) => {
								e.stopPropagation();
								handleViewBreakdown("votes");
							}}
							className="absolute top-2 right-2 h-6 px-2 text-[10px] font-bold bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-950/60 dark:text-primary-300 border border-primary-200/50 rounded-md opacity-80 group-hover:opacity-100 transition-opacity"
						>
							<FileText className="size-3 mr-1" />
							BREAKDOWN
						</Button>
					</div>
				)}

				{(eventType === "ticketed" || eventType === "hybrid") && (
					<StatCard
						label="Check-ins"
						value={stats.checkIns}
						iconSrc={statIcons.user}
						description={
							stats.ticketsSold > 0
								? `${Math.round((stats.checkIns / stats.ticketsSold) * 100)}% of sold`
								: undefined
						}
					/>
				)}

				{eventType === "voting" && (
					<StatCard
						label="Categories"
						value={stats.totalCategories}
						iconSrc={statIcons.analytics}
					/>
				)}

				{eventType === "ticketed" && (
					<StatCard
						label="Orders"
						value={stats.totalOrders}
						iconSrc={statIcons.analytics}
						onClick={() => handleViewBreakdown("tickets")}
						className="cursor-pointer hover:border-primary/40 hover:shadow-xs transition-all"
					/>
				)}
			</StatsGrid>

			{/* Ticket Charts */}
			{(eventType === "ticketed" ||
				eventType === "hybrid" ||
				ticketTrend.length > 0) && (
				<div className="grid grid-cols-1 overflow-x-auto @3xl:grid-cols-[auto_500px] gap-4">
					<TypeBarChart sales={ticketTypeSales} />
					<TicketTrendChard data={ticketTrend} />
				</div>
			)}

			{/* Voting Charts */}
			{isVotingType && votingCategories.length > 0 && (
				<div className="grid grid-cols-1 overflow-x-auto @3xl:grid-cols-[auto_500px] gap-4">
					<BarChart
						categories={votingCategories}
						onCategoryClick={handleCategoryClick}
					/>
					{votingMode === "internal" ? (
						<PieChart categories={votingCategories} />
					) : (
						<TrendChart data={voteTrend} />
					)}
				</div>
			)}

			{/* Category Detail Modal */}
			<CategoryDetailModal
				eventId={event.id}
				category={selectedCategory as any}
				isInternalVoting={votingMode === "internal"}
				open={modalOpen}
				onOpenChange={setModalOpen}
			/>

			{/* Event Transactions Breakdown Sheet */}
			<EventTransactionsSheet
				eventId={event.id}
				isVotingType={isVotingType}
				open={breakdownOpen}
				onOpenChange={setBreakdownOpen}
				defaultType={breakdownType}
			/>

			{/* Extras Summary */}
			<StatsGrid columns={3}>
				<StatCard
					label="Sponsors"
					value={sponsors.length}
					iconSrc={statIcons.plus}
					className="bg-card"
				/>
				<StatCard
					label="Social Links"
					value={socialLinks.length}
					iconSrc={statIcons.search}
					className="bg-card"
				/>
				<StatCard
					label="Galleries"
					value={galleryLinks.length}
					iconSrc={statIcons.analytics}
					className="bg-card"
				/>
			</StatsGrid>
		</div>
	);
}

