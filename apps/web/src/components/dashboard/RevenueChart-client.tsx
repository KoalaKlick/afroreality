"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { TrendingUp } from "lucide-react";
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { EmptyState } from "@/components/shared/EmptyState";

interface RevenueChartProps {
	readonly data: { month: string; revenue: number }[];
}

const chartConfig = {
	revenue: {
		label: "Revenue (GHS)",
		color: "#02a605",
	},
} satisfies ChartConfig;

export function RevenueChart({ data }: RevenueChartProps) {
	const totalRevenue = (data || []).reduce((sum, item) => sum + (item.revenue || 0), 0);

	return (
		<div className="rounded-xl bg-card p-4 sm:p-6 shadow-xs border border-border/50 min-w-0 max-w-full overflow-hidden">
			<div className="mb-4 flex items-center justify-between gap-2">
				<div className="flex items-center gap-2 min-w-0">
					<TrendingUp className="size-4 text-emerald-600 shrink-0" />
					<h3 className="font-semibold text-foreground text-sm truncate">Revenue Trend</h3>
				</div>
				<span className="text-xs font-semibold text-emerald-600 shrink-0">
					Total: GHS {totalRevenue.toLocaleString()}
				</span>
			</div>
			{!data || data.length === 0 || totalRevenue === 0 ? (
				<EmptyState
					variant="money"
					title="No revenue data yet"
					description="Sales and earnings generated from ticket passes and voting will appear here."
					className="py-4 h-[280px]"
					svgClassName="w-24 h-24 mb-2 opacity-90"
				/>
			) : (
				<ChartContainer config={chartConfig} className="h-[280px] w-full">
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
							<CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
							<XAxis
								dataKey="month"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								fontSize={12}
							/>
							<YAxis
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								fontSize={12}
								tickFormatter={(value) => `${value}`}
							/>
							<Tooltip content={<ChartTooltipContent />} />
							<Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
						</BarChart>
					</ResponsiveContainer>
				</ChartContainer>
			)}
		</div>
	);
}
