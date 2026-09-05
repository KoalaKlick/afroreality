"use client";
// src/components/event/charts/ticket/TypeBarChart.tsx
import {
	ResponsiveContainer,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { BarChart3 } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardHeader } from "@/components/ui/card";

export interface TicketTypeSales {
	id: string;
	name: string;
	sold: number;
	capacity: number;
}

interface TicketTypeBarChartProps {
	readonly sales: TicketTypeSales[];
}

function BarChartTooltip({ active, payload }: TooltipContentProps): ReactNode {
	if (!active || !payload?.length) return null;
	const typeName = payload[0]?.payload?.fullName as string;
	const sold = payload[0]?.value as number;
	const capacity = payload[0]?.payload?.capacity as number;

	return (
		<div className="rounded-xl border bg-background/95 backdrop-blur-sm p-3 text-sm shadow-xl min-w-[160px]">
			<p className="mb-2 font-semibold text-foreground border-b pb-1">{typeName}</p>
			<div className="flex items-center justify-between gap-3 text-xs mb-1">
				<div className="flex items-center gap-1.5">
					<span className="size-2 rounded-full bg-primary" />
					<span className="text-muted-foreground">Sold:</span>
				</div>
				<span className="font-bold text-foreground tabular-nums">{sold}</span>
			</div>
			{capacity > 0 && (
				<div className="flex items-center justify-between gap-3 text-xs">
					<div className="flex items-center gap-1.5">
						<span className="size-2 rounded-full bg-muted-foreground/40" />
						<span className="text-muted-foreground">Capacity:</span>
					</div>
					<span className="font-medium text-muted-foreground tabular-nums">{capacity}</span>
				</div>
			)}
		</div>
	);
}

export function TypeBarChart({ sales }: TicketTypeBarChartProps) {
	const chartConfig: ChartConfig = {
		sold: {
			label: "Tickets Sold",
			color: "var(--primary)",
		},
	};

	const data = (sales || []).map((s) => ({
		name: s.name.length > 15 ? s.name.slice(0, 14) + "..." : s.name,
		fullName: s.name,
		sold: s.sold,
		capacity: s.capacity,
	}));

	return (
		<Card className="">
			<CardHeader className="mb-4 flex items-center gap-2">
				<BarChart3 className="size-4 text-primary" />
				<h3 className="font-semibold text-foreground">Sales by Ticket Type</h3>
			</CardHeader>
			<ChartContainer
				config={chartConfig}
				className="h-72 w-full [&>div]:aspect-auto!"
			>
				<ResponsiveContainer width="100%" height="100%">
					<BarChart
						data={data}
						barCategoryGap="30%"
						margin={{ top: 10, right: 15, left: -10, bottom: 5 }}
					>
						<CartesianGrid strokeDasharray="3 3" className="stroke-muted/60" vertical={false} />
						<XAxis
							dataKey="name"
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
						<Bar
							dataKey="sold"
							fill="var(--primary)"
							radius={[4, 4, 0, 0]}
							maxBarSize={48}
							minPointSize={2}
						/>
					</BarChart>
				</ResponsiveContainer>
			</ChartContainer>
		</Card>
	);
}
