"use client";
// src/components/event/charts/voting/BarChart.tsx
import {
	ResponsiveContainer,
	BarChart as RechartsBarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { BarChart3, Users } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardHeader } from "@/components/ui/card";

export interface VotingChartCategory {
	id: string;
	name: string;
	votingOptions: {
		id: string;
		optionText: string;
		votesCount: number;
		imageUrl?: string | null;
	}[];
}

interface VotingBarChartProps {
	readonly categories: VotingChartCategory[];
	readonly onCategoryClick?: (category: VotingChartCategory) => void;
}

export const NOMINEE_BAR_COLORS = [
	"#ef4444", // Red / Coral
	"#f59e0b", // Amber / Gold
	"#10b981", // Emerald / Green
	"#3b82f6", // Blue
	"#8b5cf6", // Purple / Violet
	"#ec4899", // Pink
	"#06b6d4", // Cyan
	"#f97316", // Orange
	"#14b8a6", // Teal
	"#6366f1", // Indigo
];

function BarChartTooltip({ active, payload }: TooltipContentProps): ReactNode {
	if (!active || !payload?.length) return null;
	const categoryName = payload[0]?.payload?.fullName as string;
	return (
		<div className="rounded-xl border bg-background/95 backdrop-blur-sm p-3 text-sm shadow-xl min-w-[200px]">
			<p className="mb-2 font-semibold text-foreground border-b pb-1">{categoryName}</p>
			<div className="space-y-1.5">
				{payload.map((entry) => {
					const idx = String(entry.dataKey).replace("nominee", "");
					const name = entry.payload?.["nomineeName" + idx] as string;
					const votes = entry.payload?.["nomineeVotes" + idx] ?? entry.value ?? 0;
					if (!name) return null;
					return (
						<div key={String(entry.dataKey)} className="flex items-center justify-between gap-3 text-xs">
							<div className="flex items-center gap-2 min-w-0">
								<span
									className="size-2.5 rounded-full shrink-0 shadow-sm"
									style={{ backgroundColor: entry.color }}
								/>
								<span className="truncate text-muted-foreground font-medium">{name}</span>
							</div>
							<span className="font-bold text-foreground tabular-nums">{votes}</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}

export function BarChart({
	categories,
	onCategoryClick,
}: VotingBarChartProps) {
	const safeCategories = categories || [];
	const maxNominees = Math.max(
		...safeCategories.map((c) => c.votingOptions?.length ?? 0),
		0,
	);

	const chartConfig: ChartConfig = {};
	for (let i = 0; i < maxNominees; i++) {
		chartConfig["nominee" + i] = {
			label: "Nominee " + (i + 1),
			color: NOMINEE_BAR_COLORS[i % NOMINEE_BAR_COLORS.length],
		};
	}

	const data = safeCategories.map((cat) => {
		const entry: Record<string, string | number> = {
			category: cat.name.length > 15 ? cat.name.slice(0, 14) + "..." : cat.name,
			categoryId: cat.id,
			fullName: cat.name,
		};
		const sorted = [...(cat.votingOptions || [])].sort(
			(a, b) => b.votesCount - a.votesCount,
		);
		sorted.forEach((opt, i) => {
			entry["nominee" + i] = opt.votesCount;
			entry["nomineeVotes" + i] = opt.votesCount;
			entry["nomineeName" + i] = opt.optionText;
		});
		return entry;
	});

	// Single category check
	const singleCategory = safeCategories.length === 1 ? safeCategories[0] : null;

	return (
		<Card className="flex flex-col justify-between">
			<div>
				<CardHeader className="mb-2 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<BarChart3 className="size-4 text-primary" />
						<h3 className="font-semibold text-foreground">Votes by Category</h3>
					</div>
					{singleCategory && (
						<span className="text-xs text-muted-foreground flex items-center gap-1 font-medium bg-muted/50 px-2 py-0.5 rounded-full">
							<Users className="size-3" />
							{singleCategory.votingOptions?.length || 0} Nominees
						</span>
					)}
				</CardHeader>

				<ChartContainer
					config={chartConfig}
					className="h-72 w-full [&>div]:aspect-auto!"
				>
					<ResponsiveContainer width="100%" height="100%">
						<RechartsBarChart
							data={data}
							barCategoryGap="25%"
							barGap={4}
							margin={{ top: 10, right: 15, left: -10, bottom: 5 }}
							onClick={(state) => {
								if (!onCategoryClick || !state?.activeLabel) return;
								const entry = data.find((d) => d.category === state.activeLabel);
								if (entry) {
									const cat = safeCategories.find((c) => c.id === entry.categoryId);
									if (cat) onCategoryClick(cat);
								}
							}}
						>
							<CartesianGrid strokeDasharray="3 3" className="stroke-muted/60" vertical={false} />
							<XAxis
								dataKey="category"
								tick={{ fontSize: 12 }}
								className="fill-muted-foreground font-medium"
								axisLine={false}
								tickLine={false}
							/>
							<YAxis
								allowDecimals={false}
								tick={{ fontSize: 12 }}
								width={40}
								className="fill-muted-foreground font-medium"
								axisLine={false}
								tickLine={false}
							/>
							<Tooltip content={BarChartTooltip} cursor={{ fill: "currentColor", opacity: 0.04 }} />
							{Array.from({ length: maxNominees }, (_, i) => {
								const dataKey = "nominee" + i;
								return (
									<Bar
										key={dataKey}
										dataKey={dataKey}
										fill={NOMINEE_BAR_COLORS[i % NOMINEE_BAR_COLORS.length]}
										radius={[4, 4, 0, 0]}
										maxBarSize={36}
										minPointSize={3}
										cursor="pointer"
									/>
								);
							})}
						</RechartsBarChart>
					</ResponsiveContainer>
				</ChartContainer>

				{/* Nominee Legend Pill Badges */}
				{singleCategory && singleCategory.votingOptions?.length > 0 && (
					<div className="px-4 pt-3 pb-1 flex flex-wrap gap-2 items-center justify-center border-t border-border/40 mt-2">
						{singleCategory.votingOptions
							.slice()
							.sort((a, b) => b.votesCount - a.votesCount)
							.map((opt, i) => (
								<div
									key={opt.id || i}
									className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/40 border border-border/50 text-xs text-muted-foreground"
								>
									<span
										className="size-2.5 rounded-full shrink-0 shadow-xs"
										style={{ backgroundColor: NOMINEE_BAR_COLORS[i % NOMINEE_BAR_COLORS.length] }}
									/>
									<span className="font-medium text-foreground truncate max-w-[120px]">{opt.optionText}</span>
									<span className="text-[11px] font-bold text-muted-foreground ml-0.5">({opt.votesCount})</span>
								</div>
							))}
					</div>
				)}
			</div>

			{onCategoryClick && (
				<p className="mt-2 text-xs text-muted-foreground text-center pb-2">
					Click a category to view detailed breakdown
				</p>
			)}
		</Card>
	);
}
