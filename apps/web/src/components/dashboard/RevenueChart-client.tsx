"use client";

import { useMemo, useState } from "react";
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Calendar, DollarSign, Receipt, TrendingUp } from "lucide-react";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn, formatAmount } from "@/lib/utils";

export interface RevenueTrendPoint {
	date: string;
	revenue: number;
	orders: number;
	gross?: number;
}

export interface RevenueChartProps {
	readonly data?: { month: string; revenue: number }[];
	readonly trends?: {
		daily: RevenueTrendPoint[];
		weekly: RevenueTrendPoint[];
		monthly: RevenueTrendPoint[];
	};
}

const chartConfig = {
	revenue: {
		label: "Net Share (GHS)",
		color: "#02a605",
	},
	orders: {
		label: "Orders",
		color: "#3b82f6",
	},
} satisfies ChartConfig;

type TimeframeOption = "daily" | "weekly" | "monthly";

export function RevenueChart({ data = [], trends }: RevenueChartProps) {
	const [timeframe, setTimeframe] = useState<TimeframeOption>("daily");

	const activePoints = useMemo<RevenueTrendPoint[]>(() => {
		if (trends) {
			const list = trends[timeframe] || [];
			if (list.length > 0) return list;
		}
		if (data && data.length > 0) {
			return data.map((d) => ({
				date: d.month,
				revenue: d.revenue,
				orders: d.revenue > 0 ? 1 : 0,
			}));
		}
		return [];
	}, [trends, timeframe, data]);

	const totalRevenue = useMemo(
		() => activePoints.reduce((sum, item) => sum + (item.revenue || 0), 0),
		[activePoints],
	);

	const totalOrders = useMemo(
		() => activePoints.reduce((sum, item) => sum + (item.orders || 0), 0),
		[activePoints],
	);

	const hasData = activePoints.length > 0 && (totalRevenue > 0 || totalOrders > 0);

	return (
		<div className="rounded-xl bg-card p-4 sm:p-6 shadow-xs border border-border/50 min-w-0 max-w-full overflow-hidden flex flex-col justify-between">
			{/* Top Header with Title and Timeframe Selector */}
			<div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
				<div className="flex items-center gap-2 min-w-0">
					<div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
						<TrendingUp className="size-4.5" />
					</div>
					<div>
						<h3 className="font-semibold text-foreground text-sm tracking-tight">
							Revenue & Order Trends Over Time
						</h3>
						<p className="text-[11px] text-muted-foreground">
							{timeframe === "daily"
								? "Daily performance over time (past 7 days)"
								: timeframe === "weekly"
									? "Weekly performance over time (past 8 weeks)"
									: "Monthly performance over time (past 6 months)"}
						</p>
					</div>
				</div>

				<div className="flex items-center gap-3 self-end sm:self-auto">
					{/* 3 Timeframe Switcher: Daily, Weekly, Monthly */}
					<div className="inline-flex items-center rounded-lg border border-border/70 bg-muted/40 p-0.5 text-xs">
						<button
							type="button"
							onClick={() => setTimeframe("daily")}
							className={cn(
								"px-2.5 py-1 rounded-md text-xs font-medium transition-all",
								timeframe === "daily"
									? "bg-background text-foreground shadow-xs"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							Daily
						</button>
						<button
							type="button"
							onClick={() => setTimeframe("weekly")}
							className={cn(
								"px-2.5 py-1 rounded-md text-xs font-medium transition-all",
								timeframe === "weekly"
									? "bg-background text-foreground shadow-xs"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							Weekly
						</button>
						<button
							type="button"
							onClick={() => setTimeframe("monthly")}
							className={cn(
								"px-2.5 py-1 rounded-md text-xs font-medium transition-all",
								timeframe === "monthly"
									? "bg-background text-foreground shadow-xs"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							Monthly
						</button>
					</div>

					{/* Summary metrics */}
					<div className="text-right hidden sm:block">
						<div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
							GHS {totalRevenue.toFixed(2)}
						</div>
						<div className="text-[10px] text-muted-foreground">
							{totalOrders} {totalOrders === 1 ? "order" : "orders"}
						</div>
					</div>
				</div>
			</div>

			{/* Chart Area */}
			{!hasData ? (
				<EmptyState
					variant="money"
					title="No revenue or orders yet"
					description={`No transaction activity recorded for the ${timeframe} period. Sales will plot here in real-time.`}
					className="py-4 h-[280px]"
					svgClassName="w-24 h-24 mb-2 opacity-90"
				/>
			) : (
				<ChartContainer config={chartConfig} className="h-[280px] w-full">
					<ResponsiveContainer width="100%" height="100%">
						<AreaChart
							data={activePoints}
							margin={{ top: 15, right: 15, left: -20, bottom: 0 }}
						>
							<defs>
								<linearGradient id="areaRevenueGradient" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#02a605" stopOpacity={0.4} />
									<stop offset="95%" stopColor="#02a605" stopOpacity={0.0} />
								</linearGradient>
							</defs>
							<CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} />
							<XAxis
								dataKey="date"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								fontSize={11}
								className="text-muted-foreground"
							/>
							<YAxis
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								fontSize={11}
								tickFormatter={(value) => `${value}`}
								className="text-muted-foreground"
							/>
							<Tooltip
								content={({ active, payload }) => {
									if (!active || !payload || !payload.length) return null;
									const point = payload[0]?.payload as RevenueTrendPoint;
									return (
										<div className="rounded-lg border border-border/70 bg-popover p-2.5 shadow-md text-xs space-y-1.5 min-w-[140px]">
											<div className="font-semibold text-foreground border-b border-border/50 pb-1 flex items-center justify-between gap-2">
												<span>{point.date}</span>
												<span className="font-mono text-[10px] text-muted-foreground">
													{timeframe.toUpperCase()}
												</span>
											</div>
											<div className="flex items-center justify-between gap-2 text-emerald-600 dark:text-emerald-400">
												<span className="flex items-center gap-1">
													<DollarSign className="size-3 shrink-0" />
													Net Share:
												</span>
												<span className="font-mono font-bold">
													GHS {Number(point.revenue).toFixed(2)}
												</span>
											</div>
											<div className="flex items-center justify-between gap-2 text-muted-foreground">
												<span className="flex items-center gap-1">
													<Receipt className="size-3 shrink-0" />
													Orders:
												</span>
												<span className="font-mono font-medium text-foreground">
													{point.orders}
												</span>
											</div>
											{point.gross !== undefined && point.gross > 0 && (
												<div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground pt-0.5 border-t border-border/40">
													<span>Gross Inflow:</span>
													<span className="font-mono">
														GHS {Number(point.gross).toFixed(2)}
													</span>
												</div>
											)}
										</div>
									);
								}}
							/>
							<Area
								type="linear"
								dataKey="revenue"
								stroke="#02a605"
								strokeWidth={2.5}
								fillOpacity={1}
								fill="url(#areaRevenueGradient)"
								dot={{
									r: 2.5,
									fill: "#02a605",
									strokeWidth: 1,
									stroke: "#fff",
								}}
								activeDot={{
									r: 5,
									stroke: "#02a605",
									strokeWidth: 2,
									fill: "#fff",
								}}
							/>
						</AreaChart>
					</ResponsiveContainer>
				</ChartContainer>
			)}
		</div>
	);
}
