// src/components/event/tabs/EventOverviewTab.tsx
import {
	StatCard,
	StatsGrid,
	statIcons,
} from "@/components/event/core/EventStats";
import { BarChart, type VotingChartCategory } from "../charts/voting/BarChart";
import { TrendChart, type VoteTrendPoint } from "../charts/voting/TrendChart";
import { PieChart } from "../charts/voting/PieChart";
import { TypeBarChart, type TicketTypeSales } from "../charts/ticket/TypeBarChart";
import { TrendChart as TicketTrendChard, type TicketTrendPoint } from "../charts/ticket/TrendChart";
import { formatAmount } from "@/lib/utils";

interface EventOverviewTabProps {
	readonly event: any;
	readonly eventStats: {
		revenue: number;
		ticketRevenue: number;
		voteRevenue: number;
		nominationRevenue: number;
		ticketsSold: number;
		capacity?: number | null;
		checkIns: number;
		totalVotes: number;
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
  const sponsors = event.sponsors ?? [];
  const socialLinks = event.socialLinks ?? [];
  const galleryLinks = event.galleryLinks ?? [];
  const eventType = event.type;
  const votingMode = event.votingMode;
  const isVotingType = eventType === "voting" || eventType === "hybrid";

  return (
    <div className="space-y-6 @container">
			{/* Event Overview Stats */}
			<StatsGrid columns={4}>
				<StatCard
					label="Gross Revenue"
					value={formatAmount(eventStats.revenue)}
					iconSrc={statIcons.cedi}
					description={
						[
							eventStats.ticketRevenue > 0 &&
								`Tickets ${formatAmount(eventStats.ticketRevenue)}`,
							eventStats.voteRevenue > 0 &&
								`Votes ${formatAmount(eventStats.voteRevenue)}`,
							eventStats.nominationRevenue > 0 &&
								`Nominations ${formatAmount(eventStats.nominationRevenue)}`,
						]
							.filter(Boolean)
							.join(" · ") || "Revenue to date"
					}
				/>

				{(eventType === "ticketed" || eventType === "hybrid") && (
					<StatCard
						label="Tickets Sold"
						value={eventStats.ticketsSold}
						iconSrc={statIcons.ticket}
						description={
							eventStats.capacity
								? `/ ${eventStats.capacity} capacity`
								: undefined
						}
					/>
				)}

				{(eventType === "voting" || eventType === "hybrid") && (
					<StatCard
						label="Total Votes"
						value={eventStats.totalVotes}
						iconSrc={statIcons.vote}
					/>
				)}

				{(eventType === "ticketed" || eventType === "hybrid") && (
					<StatCard
						label="Check-ins"
						value={eventStats.checkIns}
						iconSrc={statIcons.user}
						description={
							eventStats.ticketsSold > 0
								? `${Math.round((eventStats.checkIns / eventStats.ticketsSold) * 100)}% of sold`
								: undefined
						}
					/>
				)}

				{eventType === "voting" && (
					<StatCard
						label="Categories"
						value={eventStats.totalCategories || votingCategories.length}
						iconSrc={statIcons.analytics}
					/>
				)}

				{eventType === "ticketed" && (
					<StatCard
						label="Orders"
						value={eventStats.totalOrders || 0}
						iconSrc={statIcons.analytics}
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
					<BarChart categories={votingCategories} />
					{votingMode === "internal" ? (
						<PieChart categories={votingCategories} />
					) : (
						<TrendChart data={voteTrend} />
					)}
				</div>
			)}

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
