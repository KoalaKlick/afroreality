"use client";
// src/components/event/charts/PieChart.tsx
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Tooltip, Legend } from "recharts";
import type { TooltipContentProps } from "recharts";
import {
	ChartContainer,
	ChartLegendContent,
	type ChartConfig,
} from "@/components/ui/chart";
import { PieChart as PieChartIcon } from "lucide-react";
import type { VotingChartCategory } from "./BarChart";
import type { ReactNode } from "react";
import { Card, CardHeader } from "@/components/ui/card";

const PIE_COLORS = [
	"var(--primary)",
	"var(--color-amber-500, #f59e0b)",
	"var(--color-emerald-500, #10b981)",
	"var(--color-purple-500, #8b5cf6)",
	"var(--color-blue-500, #3b82f6)",
	"var(--color-rose-500, #f43f5e)",
	"var(--color-cyan-500, #06b6d4)",
];

function PieChartTooltip({ active, payload }: TooltipContentProps): ReactNode {
	if (!active || !payload?.length) return null;
	const entry = payload[0];
	const fullName = entry?.payload?.fullName as string;
	const nominees = entry?.payload?.nominees as number;
	const votes = entry?.payload?.votes as number;
	return (
		<div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
			<p className="font-semibold">{fullName}</p>
			<p className="text-muted-foreground">{nominees} nominees</p>
			<p className="text-muted-foreground">{(votes || 0).toLocaleString()} total votes</p>
		</div>
	);
}

interface VotingPieChartProps {
	readonly categories: VotingChartCategory[];
	readonly onCategoryClick?: (category: VotingChartCategory) => void;
}

export function PieChart({
	categories,
	onCategoryClick,
}: VotingPieChartProps) {
	const chartConfig: ChartConfig = {};
	categories.forEach((cat, i) => {
		chartConfig[cat.id] = {
			label: cat.name,
			color: PIE_COLORS[i % PIE_COLORS.length],
		};
	});

	const data = (categories || []).map((cat, i) => {
		const options = cat.votingOptions || [];
		return {
			name: cat.name.length > 18 ? `${cat.name.slice(0, 17)}…` : cat.name,
			fullName: cat.name,
			value: options.length,
			nominees: options.length,
			votes: options.reduce((s, o) => s + (o.votesCount || 0), 0),
			fill: PIE_COLORS[i % PIE_COLORS.length],
			categoryId: cat.id,
		};
	});

	return (
		<Card className="">
			<CardHeader className="mb-4 flex items-center gap-2">
				<PieChartIcon className="size-4 text-amber-500" />
				<h3 className="font-semibold">Nominees by Category</h3>
			</CardHeader>
			<ChartContainer config={chartConfig} className="h-72 w-full">
				<ResponsiveContainer width="100%" height="100%">
					<RechartsPieChart>
						<Pie
							data={data}
							cx="50%"
							cy="50%"
							innerRadius={45}
							outerRadius={75}
							paddingAngle={2}
							dataKey="value"
							nameKey="name"
							strokeWidth={0}
							cursor={onCategoryClick ? "pointer" : undefined}
							onClick={(_data, index) => {
								if (!onCategoryClick) return;
								const cat = categories[index];
								if (cat) onCategoryClick(cat);
							}}
						/>
						<Tooltip content={PieChartTooltip} />
						<Legend
							content={<ChartLegendContent className="flex-col items-start" />}
							layout="vertical"
							verticalAlign="middle"
							align="right"
							wrapperStyle={{ paddingLeft: 16 }}
						/>
					</RechartsPieChart>
				</ResponsiveContainer>
			</ChartContainer>
			{onCategoryClick && (
				<p className="mt-2 text-xs text-muted-foreground text-center">
					Click a slice to view category breakdown
				</p>
			)}
		</Card>
	);
}



