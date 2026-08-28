"use client";

import { CustomizableEventStats } from "@/components/event/charts/CustomizableEventStats";
import type { EventStatsData } from "@/components/event/core/EventStats";
import { OngoingEvents, type OngoingEvent } from "./OngoingEvents";
import { RevenueChart } from "./RevenueChart";
import { EventTypePieChart } from "./EventTypePieChart";
import { RecentOrdersTable, type OrderItem } from "./RecentOrdersTable";
import { PROJ_NAME } from "@/lib/constants/branding";

interface DashboardContentProps {
	readonly stats: EventStatsData;
	readonly profileStats?: {
		createdEvents: number;
		organizations: number;
		completedOrders?: number;
	};
	readonly ongoingEvents: OngoingEvent[];
	readonly recentOrders: OrderItem[];
	readonly revenueData: { month: string; revenue: number }[];
}

export function DashboardContent({
	stats,
	profileStats,
	ongoingEvents,
	recentOrders,
	revenueData,
}: DashboardContentProps) {
	return (
		<div className="flex flex-1 flex-col gap-6">
			{/* Ongoing Events Strip */}
			<OngoingEvents events={ongoingEvents} />

			{/* Customizable 3D Stat Cards */}
			<CustomizableEventStats
				stats={stats}
				profileStats={profileStats ? { organizationCount: profileStats.organizations, createdEvents: profileStats.createdEvents } : undefined}
				storageKey={`${PROJ_NAME.toLowerCase()}:dashboard-stats`}
				defaultKeys={["total", "ticketsSold", "revenue", "votes"]}
			/>

			{/* Charts Row */}
			<div className="grid gap-6 lg:grid-cols-2">
				<RevenueChart data={revenueData} />
				<EventTypePieChart byType={stats.byType} />
			</div>

			{/* Orders Table */}
			<RecentOrdersTable orders={recentOrders} />
		</div>
	);
}
