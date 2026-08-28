"use client";
// src/components/event/charts/TypeBarChart.tsx
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
		<div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
			<p className="mb-1 font-semibold">{typeName}</p>
			<div className="flex items-center gap-2">
				<span className="size-2.5 rounded-full bg-primary" />
				<span className="text-muted-foreground">Sold:</span>
				<span className="font-medium">{sold}</span>
			</div>
			{capacity > 0 && (
				<div className="flex items-center gap-2">
					<span className="size-2.5 rounded-full bg-muted" />
					<span className="text-muted-foreground">Capacity:</span>
					<span className="font-medium">{capacity}</span>
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

	const data = sales.map((s) => ({
		name: s.name.length > 15 ? `${s.name.slice(0, 14)}…` : s.name,
		fullName: s.name,
		sold: s.sold,
		capacity: s.capacity,
	}));

	return (
		<Card className="">
			<CardHeader className="mb-4 flex items-center gap-2">
				<BarChart3 className="size-4 text-primary" />
				<h3 className="font-semibold">Sales by Ticket Type</h3>
			</CardHeader>
			<ChartContainer
				config={chartConfig}
				className="h-72 w-full [&>div]:aspect-auto!"
			>
				<ResponsiveContainer width="100%" height="100%">
					<BarChart
						data={data}
						margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
					>
						<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
						<XAxis
							dataKey="name"
							tick={{ fontSize: 12 }}
							className="fill-muted-foreground"
						/>
						<YAxis
							allowDecimals={false}
							tick={{ fontSize: 12 }}
							width={40}
							className="fill-muted-foreground"
						/>
						<Tooltip content={BarChartTooltip} />
						<Bar
							dataKey="sold"
							fill="var(--primary)"
							radius={[4, 4, 0, 0]}
						/>
					</BarChart>
				</ResponsiveContainer>
			</ChartContainer>
		</Card>
	);
}
