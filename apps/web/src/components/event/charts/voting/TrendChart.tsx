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

export interface VoteTrendPoint {
	date: string;
	votes: number;
}

interface VotingTrendChartProps {
	readonly data: VoteTrendPoint[];
}

const chartConfig: ChartConfig = {
	votes: {
		label: "Votes",
		color: "var(--primary)",
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
	const votes = payload[0]?.value as number;
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
			<p className="font-semibold">{dateLabel}</p>
			<div className="flex items-center gap-2">
				<span className="size-2.5 rounded-full bg-primary" />
				<span className="text-muted-foreground">Votes:</span>
				<span className="font-medium">{(votes || 0).toLocaleString()}</span>
			</div>
		</div>
	);
}

function aggregateByPeriod(
	data: VoteTrendPoint[],
	period: Period,
): (VoteTrendPoint & { period: Period })[] {
	if (period === "daily") {
		return data.map((d) => ({ ...d, period }));
	}

	const grouped = new Map<string, number>();

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

		grouped.set(key, (grouped.get(key) ?? 0) + point.votes);
	}

	return [...grouped.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([date, votes]) => ({ date, votes, period }));
}

export function TrendChart({ data }: VotingTrendChartProps) {
	const [period, setPeriod] = useState<Period>("daily");

	const chartData = useMemo(() => {
		if (data.length === 0) {
			const today = new Date().toISOString().slice(0, 10);
			return [{ date: today, votes: 0, period }];
		}
		return aggregateByPeriod(data, period);
	}, [data, period]);

	return (
		<Card>
			<CardHeader className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					<TrendingUp className="size-4 text-primary" />
					<h3 className="font-semibold">Votes Over Time</h3>
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
						margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
					>
						<defs>
							<linearGradient id="votesGradient" x1="0" y1="0" x2="0" y2="1">
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
							allowDecimals={false}
							tick={{ fontSize: 12 }}
							width={40}
							className="fill-muted-foreground"
						/>
						<Tooltip content={TrendTooltip} />
						<Area
							type="monotone"
							dataKey="votes"
							stroke="var(--primary)"
							strokeWidth={2}
							fill="url(#votesGradient)"
						/>
					</AreaChart>
				</ResponsiveContainer>
			</ChartContainer>
		</Card>
	);
}
