"use client";

import { Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { ChartContainer, ChartTooltipContent, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { EmptyState } from "@/components/shared/EmptyState";

interface EventTypePieChartProps {
	readonly byType: {
		voting?: number;
		ticketed?: number;
		hybrid?: number;
		standard?: number;
	};
}

const COLORS = ["#02a605", "#ffe100", "#dc2626", "#6b7280"];

const chartConfig = {
	voting: { label: "Voting", color: "#02a605" },
	ticketed: { label: "Ticketed", color: "#ffe100" },
	hybrid: { label: "Hybrid", color: "#dc2626" },
	standard: { label: "Standard", color: "#6b7280" },
} satisfies ChartConfig;

export function EventTypePieChart({ byType }: EventTypePieChartProps) {
	const voting = byType?.voting || 0;
	const ticketed = byType?.ticketed || 0;
	const hybrid = byType?.hybrid || 0;
	const standard = byType?.standard || 0;

	const data = [
		{ name: "Voting", value: voting, key: "voting" },
		{ name: "Ticketed", value: ticketed, key: "ticketed" },
		{ name: "Hybrid", value: hybrid, key: "hybrid" },
		{ name: "Standard", value: standard, key: "standard" },
	].filter((d) => d.value > 0);

	const total = data.reduce((sum, d) => sum + d.value, 0);

	return (
		<div className="rounded-xl bg-card p-6 shadow-xs border border-border/50">
			<div className="mb-4 flex items-center gap-2">
				<PieChartIcon className="size-4 text-amber-500" />
				<h3 className="font-semibold text-foreground text-sm">Event Types</h3>
			</div>
			{total === 0 ? (
				<EmptyState
					variant="data"
					title="No event data yet"
					description="Created events will be categorized by type (Voting, Ticketed, Hybrid, Standard)."
					className="py-4 h-[280px]"
					svgClassName="w-24 h-24 mb-2 opacity-90"
				/>
			) : (
				<ChartContainer config={chartConfig} className="h-[280px] w-full">
					<ResponsiveContainer width="100%" height="100%">
						<PieChart>
							<Pie
								data={data.map((entry) => ({
									...entry,
									fill: COLORS[["voting", "ticketed", "hybrid", "standard"].indexOf(entry.key)],
								}))}
								cx="50%"
								cy="50%"
								innerRadius={45}
								outerRadius={75}
								paddingAngle={3}
								dataKey="value"
								nameKey="name"
								strokeWidth={0}
							/>
							<Tooltip content={<ChartTooltipContent hideLabel />} />
							<Legend content={<ChartLegendContent />} />
						</PieChart>
					</ResponsiveContainer>
				</ChartContainer>
			)}
		</div>
	);
}
