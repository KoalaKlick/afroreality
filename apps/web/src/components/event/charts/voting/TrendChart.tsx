"use client";
// src/components/event/charts/voting/TrendChart.tsx
import { useMemo, useState } from "react";
import {
	ResponsiveContainer,
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Brush,
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
import {
	TrendingUp,
	SlidersHorizontal,
	MoveHorizontal,
	Maximize2,
	Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type Period = "hourly" | "daily" | "weekly" | "monthly" | "yearly";

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
	if (Number.isNaN(d.getTime())) return dateStr;

	if (period === "hourly") {
		return d.toLocaleTimeString("en-US", {
			hour: "numeric",
			hour12: true,
		});
	}
	if (period === "monthly") {
		return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
	}
	if (period === "yearly") {
		return String(d.getFullYear());
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
	const isValidDate = !Number.isNaN(d.getTime());

	let dateLabel = dateStr;
	if (isValidDate) {
		if (period === "hourly") {
			dateLabel = `${d.toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
			})}, ${d.toLocaleTimeString("en-US", {
				hour: "numeric",
				minute: "2-digit",
				hour12: true,
			})}`;
		} else if (period === "monthly") {
			dateLabel = d.toLocaleDateString("en-US", {
				month: "long",
				year: "numeric",
			});
		} else if (period === "yearly") {
			dateLabel = `Year ${d.getFullYear()}`;
		} else if (period === "weekly") {
			dateLabel = `Week of ${d.toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
			})}`;
		} else {
			dateLabel = d.toLocaleDateString("en-US", {
				weekday: "short",
				month: "short",
				day: "numeric",
				year: "numeric",
			});
		}
	}

	return (
		<div className="rounded-lg border bg-background/95 backdrop-blur-md px-3.5 py-2 text-xs shadow-lg space-y-1 z-50">
			<p className="font-semibold text-foreground">{dateLabel}</p>
			<div className="flex items-center gap-2">
				<span className="size-2 rounded-full bg-primary" />
				<span className="text-muted-foreground">Votes:</span>
				<span className="font-bold text-foreground font-mono">
					{(votes || 0).toLocaleString()}
				</span>
			</div>
		</div>
	);
}

function aggregateByPeriod(
	data: VoteTrendPoint[],
	period: Period,
): (VoteTrendPoint & { period: Period })[] {
	if (data.length === 0) {
		const now = new Date();
		if (period === "hourly") {
			return Array.from({ length: 12 }, (_, i) => {
				const d = new Date(now.getTime() - (11 - i) * 3600 * 1000);
				d.setMinutes(0, 0, 0);
				return { date: d.toISOString(), votes: 0, period };
			});
		}
		if (period === "yearly") {
			return [
				{
					date: `${now.getFullYear() - 1}-01-01T00:00:00.000Z`,
					votes: 0,
					period,
				},
				{
					date: `${now.getFullYear()}-01-01T00:00:00.000Z`,
					votes: 0,
					period,
				},
			];
		}
		if (period === "monthly") {
			return Array.from({ length: 6 }, (_, i) => {
				const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
				return { date: d.toISOString(), votes: 0, period };
			});
		}
		if (period === "weekly") {
			return Array.from({ length: 4 }, (_, i) => {
				const d = new Date(now.getTime() - (3 - i) * 7 * 86400 * 1000);
				return { date: d.toISOString(), votes: 0, period };
			});
		}
		// daily
		return Array.from({ length: 7 }, (_, i) => {
			const d = new Date(now.getTime() - (6 - i) * 86400 * 1000);
			return { date: d.toISOString().slice(0, 10), votes: 0, period };
		});
	}

	const grouped = new Map<string, number>();

	for (const point of data) {
		const d = new Date(point.date);
		if (Number.isNaN(d.getTime())) continue;

		let key: string;
		if (period === "hourly") {
			const yr = d.getFullYear();
			const mo = String(d.getMonth() + 1).padStart(2, "0");
			const da = String(d.getDate()).padStart(2, "0");
			const hr = String(d.getHours()).padStart(2, "0");
			key = `${yr}-${mo}-${da}T${hr}:00`;
		} else if (period === "weekly") {
			const day = d.getDay();
			const diff = d.getDate() - day + (day === 0 ? -6 : 1);
			const monday = new Date(d);
			monday.setDate(diff);
			key = monday.toISOString().slice(0, 10);
		} else if (period === "monthly") {
			key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
		} else if (period === "yearly") {
			key = `${d.getFullYear()}-01-01`;
		} else {
			key = d.toISOString().slice(0, 10);
		}

		grouped.set(key, (grouped.get(key) ?? 0) + (point.votes || 0));
	}

	return [...grouped.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([date, votes]) => ({ date, votes, period }));
}

export function TrendChart({ data }: VotingTrendChartProps) {
	const [period, setPeriod] = useState<Period>("daily");
	const [showBrush, setShowBrush] = useState<boolean>(true);
	const [isScrollView, setIsScrollView] = useState<boolean>(false);

	const chartData = useMemo(() => {
		return aggregateByPeriod(data, period);
	}, [data, period]);

	const totalVotes = useMemo(() => {
		return chartData.reduce((acc, curr) => acc + curr.votes, 0);
	}, [chartData]);

	const peakPoint = useMemo(() => {
		if (chartData.length === 0) return null;
		return chartData.reduce(
			(max, curr) => (!max || curr.votes > max.votes ? curr : max),
			chartData[0],
		);
	}, [chartData]);

	// Auto-enable timeline brush slider if there are 8 or more data points
	const hasManyPoints = chartData.length >= 8;
	const enableBrush = showBrush && hasManyPoints;

	return (
		<Card className="overflow-hidden border border-border/60 shadow-xs">
			<CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/40">
				<div className="flex items-center gap-2.5">
					<div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
						<TrendingUp className="size-4.5" />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<h3 className="font-semibold text-sm text-foreground">
								Votes Over Time
							</h3>
							{totalVotes > 0 && (
								<Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 h-4.5">
									{totalVotes.toLocaleString()} votes
								</Badge>
							)}
						</div>
						<p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
							<span>Straight-line precision</span>
							{peakPoint && peakPoint.votes > 0 && (
								<>
									<span>•</span>
									<span className="text-primary font-medium">
										Peak: {peakPoint.votes.toLocaleString()} on{" "}
										{formatDateLabel(peakPoint.date, period)}
									</span>
								</>
							)}
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
					{/* Scroll View toggle for navigating wide X-axis data */}
					{hasManyPoints && (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => setIsScrollView((prev) => !prev)}
							className={cn(
								"h-8 px-2 text-xs gap-1 transition-all",
								isScrollView && "bg-primary/10 border-primary text-primary font-medium",
							)}
							title={isScrollView ? "Switch to Fit Screen View" : "Switch to Horizontal Scroll View"}
						>
							<MoveHorizontal className="size-3.5" />
							<span className="hidden xs:inline">
								{isScrollView ? "Scroll: ON" : "Scroll View"}
							</span>
						</Button>
					)}

					{/* Timeline Scrubber / Brush toggle */}
					{hasManyPoints && (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => setShowBrush((prev) => !prev)}
							className={cn(
								"h-8 px-2 text-xs gap-1 transition-all",
								showBrush && "bg-muted text-foreground",
							)}
							title="Toggle Timeline Zoom Slider"
						>
							<SlidersHorizontal className="size-3.5" />
							<span className="hidden xs:inline">Slider</span>
						</Button>
					)}

					{/* Period Selector: Hourly, Daily, Weekly, Monthly, Yearly */}
					<Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
						<SelectTrigger className="h-8 w-28 text-xs font-medium">
							<SelectValue />
						</SelectTrigger>
						<SelectContent align="end">
							<SelectItem value="hourly">
								<div className="flex items-center gap-1.5">
									<Clock className="size-3 text-muted-foreground" />
									<span>Hourly</span>
								</div>
							</SelectItem>
							<SelectItem value="daily">Daily</SelectItem>
							<SelectItem value="weekly">Weekly</SelectItem>
							<SelectItem value="monthly">Monthly</SelectItem>
							<SelectItem value="yearly">Yearly</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</CardHeader>

			{/* Chart Canvas Area */}
			<div className="p-4 pt-4">
				{isScrollView && (
					<div className="text-[11px] text-muted-foreground pb-2 flex items-center gap-1.5 italic">
						<MoveHorizontal className="size-3 text-primary animate-pulse" />
						<span>Pan / scroll horizontally to inspect points from past long ago</span>
					</div>
				)}

				<div
					className={cn(
						"w-full transition-all",
						isScrollView && "overflow-x-auto overflow-y-hidden pb-2 scrollbar-thin",
					)}
				>
					<div
						style={{
							minWidth: isScrollView
								? `${Math.max(100, chartData.length * 48)}px`
								: "100%",
						}}
					>
						<ChartContainer
							config={chartConfig}
							className={cn(
								"w-full [&>div]:aspect-auto!",
								enableBrush ? "h-80" : "h-72",
							)}
						>
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart
									data={chartData}
									margin={{ top: 10, right: 15, left: -10, bottom: enableBrush ? 0 : 5 }}
								>
									<defs>
										<linearGradient id="votesGradient" x1="0" y1="0" x2="0" y2="1">
											<stop
												offset="5%"
												stopColor="var(--primary)"
												stopOpacity={0.25}
											/>
											<stop
												offset="95%"
												stopColor="var(--primary)"
												stopOpacity={0.0}
											/>
										</linearGradient>
									</defs>
									<CartesianGrid strokeDasharray="3 3" className="stroke-muted/60" />
									<XAxis
										dataKey="date"
										tickFormatter={(v) => formatDateLabel(v, period)}
										tick={{ fontSize: 11 }}
										className="fill-muted-foreground"
										minTickGap={20}
									/>
									<YAxis
										allowDecimals={false}
										tick={{ fontSize: 11 }}
										width={40}
										className="fill-muted-foreground"
									/>
									<Tooltip content={TrendTooltip} />

									{/* Straight-line connection using type="linear" instead of curved parabola */}
									<Area
										type="linear"
										dataKey="votes"
										stroke="var(--primary)"
										strokeWidth={2}
										fill="url(#votesGradient)"
										dot={{
											r: chartData.length > 50 ? 0 : 2.5,
											fill: "var(--primary)",
											strokeWidth: 1,
											stroke: "var(--background)",
										}}
										activeDot={{
											r: 5,
											fill: "var(--primary)",
											strokeWidth: 2,
											stroke: "var(--background)",
										}}
									/>

									{/* Recharts Brush: Interactive timeline zoom and scrubber for past dates */}
									{enableBrush && (
										<Brush
											dataKey="date"
											height={26}
											stroke="var(--primary)"
											fill="hsl(var(--muted)/0.3)"
											tickFormatter={(v) => formatDateLabel(v, period)}
											className="text-[10px]"
										/>
									)}
								</AreaChart>
							</ResponsiveContainer>
						</ChartContainer>
					</div>
				</div>
			</div>
		</Card>
	);
}
