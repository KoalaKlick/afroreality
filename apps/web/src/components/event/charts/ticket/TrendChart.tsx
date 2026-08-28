"use client";
// src/components/event/charts/TrendChart.tsx
import { useMemo, useState } from "react";
import {
	ResponsiveContainer,
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

type Period = "daily" | "weekly" | "monthly";

export interface TicketTrendPoint {
	date: string;
	sales: number;
	revenue: number;
}

interface TicketTrendChartProps {
	readonly data: TicketTrendPoint[];
}

const chartConfig: ChartConfig = {
	sales: {
		label: "Tickets Sold",
		color: "var(--primary)",
	},
	revenue: {
		label: "Revenue",
		color: "var(--color-amber-500, #f59e0b)",
	},
};

function formatDateLabel(dateStr: string, period: Period): string {
	const d = new Date(dateStr);
	if (period === "monthly") {
		return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
	}
	if (period === "weekly") {
		return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
	}
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function TrendTooltip({
	active,
	payload,
	label,
}: TooltipContentProps): ReactNode {
	if (!active || !payload?.length) return null;
	const sales = payload.find((p) => p.dataKey === "sales")?.value as number;
	const revenue = payload.find((p) => p.dataKey === "revenue")?.value as number;
	const period = payload[0]?.payload?.period as Period;
	const dateStr = String(label);
	const d = new Date(dateStr);

	let dateLabel: string;
	if (period === "monthly") {
		dateLabel = d.toLocaleDateString("en-US", {
			month: "long",
			year: "numeric",
		});
	} else if (period === "weekly") {
		dateLabel = `Week of ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
	} else {
		dateLabel = d.toLocaleDateString("en-US", {
			weekday: "short",
			month: "short",
			day: "numeric",
		});
	}

	return (
		<div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
			<p className="font-semibold mb-2">{dateLabel}</p>
			<div className="space-y-1">
				<div className="flex items-center gap-2">
					<span className="size-2.5 rounded-full bg-primary" />
					<span className="text-muted-foreground">Tickets:</span>
					<span className="font-medium">{(sales || 0).toLocaleString()}</span>
				</div>
				<div className="flex items-center gap-2">
					<span className="size-2.5 rounded-full bg-amber-500" />
					<span className="text-muted-foreground">Revenue:</span>
					<span className="font-medium">GHS {(revenue || 0).toLocaleString()}</span>
				</div>
			</div>
		</div>
	);
}

function aggregateByPeriod(
	data: TicketTrendPoint[],
	period: Period,
): (TicketTrendPoint & { period: Period })[] {
	if (period === "daily") {
		return data.map((d) => ({ ...d, period }));
	}

	const grouped = new Map<string, { sales: number; revenue: number }>();

	for (const point of data) {
		const d = new Date(point.date);
		let key: string;

		if (period === "weekly") {
			const day = d.getDay();
			const diff = d.getDate() - day + (day === 0 ? -6 : 1);
			const monday = new Date(d);
			monday.setDate(diff);
			key = monday.toISOString().slice(0, 10);
		} else {
			key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
		}

		const current = grouped.get(key) ?? { sales: 0, revenue: 0 };
		grouped.set(key, {
			sales: current.sales + point.sales,
			revenue: current.revenue + point.revenue,
		});
	}

	return [...grouped.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([date, values]) => ({
			date,
			sales: values.sales,
			revenue: values.revenue,
			period,
		}));
}

export function TrendChart({ data }: TicketTrendChartProps) {
	const [period, setPeriod] = useState<Period>("daily");

	const chartData = useMemo(() => {
		if (data.length === 0) {
			const today = new Date().toISOString().slice(0, 10);
			return [{ date: today, sales: 0, revenue: 0, period }];
		}
		return aggregateByPeriod(data, period);
	}, [data, period]);

	return (
		<Card>
			<CardHeader className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					<TrendingUp className="size-4 text-primary" />
					<h3 className="font-semibold">Sales Trend</h3>
				</div>
				<Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
					<SelectTrigger className="h-8 w-28 text-xs">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="daily">Daily</SelectItem>
						<SelectItem value="weekly">Weekly</SelectItem>
						<SelectItem value="monthly">Monthly</SelectItem>
					</SelectContent>
				</Select>
			</CardHeader>

			<ChartContainer
				config={chartConfig}
				className="h-72 w-full [&>div]:aspect-auto!"
			>
				<ResponsiveContainer width="100%" height="100%">
					<AreaChart
						data={chartData}
						margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
					>
						<defs>
							<linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
								<stop
									offset="5%"
									stopColor="var(--primary)"
									stopOpacity={0.3}
								/>
								<stop
									offset="95%"
									stopColor="var(--primary)"
									stopOpacity={0}
								/>
							</linearGradient>
						</defs>
						<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
						<XAxis
							dataKey="date"
							tickFormatter={(v) => formatDateLabel(v, period)}
							tick={{ fontSize: 11 }}
							className="fill-muted-foreground"
						/>
						<YAxis
							yAxisId="left"
							allowDecimals={false}
							tick={{ fontSize: 12 }}
							width={30}
							className="fill-muted-foreground"
						/>
						<YAxis
							yAxisId="right"
							orientation="right"
							tick={{ fontSize: 10 }}
							width={50}
							className="fill-muted-foreground"
							tickFormatter={(v) =>
								`GHS ${v >= 1000 ? (v / 1000).toFixed(1) + "k" : v}`
							}
						/>
						<Tooltip content={TrendTooltip} />
						<Area
							yAxisId="left"
							type="monotone"
							dataKey="sales"
							stroke="var(--primary)"
							strokeWidth={2}
							fill="url(#salesGradient)"
						/>
						<Area
							yAxisId="right"
							type="monotone"
							dataKey="revenue"
							stroke="var(--color-amber-500, #f59e0b)"
							strokeWidth={1.5}
							strokeDasharray="4 4"
							fill="none"
						/>
					</AreaChart>
				</ResponsiveContainer>
			</ChartContainer>
			<div className="flex items-center justify-center gap-6 mt-2 pb-4 text-[10px] text-muted-foreground">
				<div className="flex items-center gap-1.5">
					<div className="size-2 rounded-full bg-primary" />
					<span>Ticket Sales</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div className="size-2 rounded-full bg-amber-500" />
					<span>Revenue (GHS)</span>
				</div>
			</div>
		</Card>
	);
}
