"use client";
// src/components/ui/chart.tsx
import * as React from "react";
import type { Payload } from "recharts/types/component/DefaultTooltipContent";
import type { LegendPayload } from "recharts/types/component/DefaultLegendContent";
import { cn } from "@/lib/utils";

export type ChartConfig = Record<
	string,
	{
		label?: React.ReactNode;
		color?: string;
	}
>;

type ChartContextProps = {
	config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

export function useChart() {
	const context = React.useContext(ChartContext);
	if (!context) {
		throw new Error("useChart must be used within a <ChartContainer />");
	}
	return context;
}

export function ChartContainer({
	id,
	className,
	children,
	config,
	...props
}: React.ComponentProps<"div"> & {
	config: ChartConfig;
	children: React.ReactNode;
}) {
	const uniqueId = React.useId();
	const chartId = `chart-${id || uniqueId.replaceAll(":", "")}`;

	const colorConfig = Object.entries(config).filter(([, cfg]) => cfg.color);
	const cssVars = colorConfig.reduce<Record<string, string>>((acc, [key, cfg]) => {
		if (cfg.color) acc[`--color-${key}`] = cfg.color;
		return acc;
	}, {});

	return (
		<ChartContext.Provider value={React.useMemo(() => ({ config }), [config])}>
			<div
				data-chart={chartId}
				className={cn(
					"[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border flex aspect-video justify-center text-xs [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-hidden [&_.recharts-surface]:outline-hidden",
					className,
				)}
				style={cssVars}
				{...props}
			>
				{children}
			</div>
		</ChartContext.Provider>
	);
}

interface ChartTooltipContentProps {
	readonly active?: boolean;
	readonly payload?: Payload[];
	readonly label?: string;
	readonly className?: string;
	readonly hideLabel?: boolean;
	readonly hideIndicator?: boolean;
	readonly indicator?: "line" | "dot" | "dashed";
	readonly labelFormatter?: (value: string, payload: Payload[]) => React.ReactNode;
	readonly formatter?: (value: unknown, name: string) => React.ReactNode;
}

export function ChartTooltipContent({
	active,
	payload,
	label,
	className,
	hideLabel = false,
	hideIndicator = false,
	indicator = "dot",
	labelFormatter,
	formatter,
}: ChartTooltipContentProps) {
	const { config } = useChart();

	if (!active || !payload?.length) return null;

	return (
		<div
			className={cn(
				"grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
				className,
			)}
		>
			{!hideLabel && (
				<div className="font-medium">
					{labelFormatter ? labelFormatter(label ?? "", payload) : label}
				</div>
			)}
			<div className="grid gap-1.5">
				{payload.map((item, index) => {
					const itemConfig = config[String(item.dataKey ?? "")];
					const indicatorColor = (item.payload?.fill as string | undefined) || item.color;

					return (
						<div
							key={String(item.dataKey ?? index)}
							className="flex w-full items-center gap-2"
						>
							{!hideIndicator && (
								<div
									className={cn(
										"shrink-0 rounded-[2px]",
										indicator === "dot" && "size-2.5 rounded-full",
										indicator === "line" && "w-1 h-3",
										indicator === "dashed" && "w-0 h-3 border-[1.5px] border-dashed bg-transparent",
									)}
									style={{ backgroundColor: indicator === "dashed" ? undefined : indicatorColor, borderColor: indicatorColor }}
								/>
							)}
							<div className="flex flex-1 justify-between leading-none">
								<span className="text-muted-foreground">
									{itemConfig?.label || String(item.name ?? "")}
								</span>
								{formatter ? (
									formatter(item.value, String(item.name ?? ""))
								) : (
									<span className="font-mono font-medium tabular-nums text-foreground">
										{typeof item.value === "number" ? item.value.toLocaleString() : String(item.value ?? "")}
									</span>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

interface ChartLegendContentProps {
	readonly className?: string;
	readonly payload?: LegendPayload[];
	readonly verticalAlign?: "top" | "bottom";
}

export function ChartLegendContent({
	className,
	payload,
	verticalAlign = "bottom",
}: ChartLegendContentProps) {
	const { config } = useChart();

	if (!payload?.length) return null;

	return (
		<div
			className={cn(
				"flex items-center justify-center gap-4",
				verticalAlign === "top" ? "pb-3" : "pt-3",
				className,
			)}
		>
			{payload.map((item, index) => {
				const configKey = String(item.dataKey || item.value || "value");
				const key = `${configKey}-${index}`;
				const itemConfig = config[configKey];

				return (
					<div key={key} className="flex items-center gap-1.5">
						<div
							className="size-2 shrink-0 rounded-[2px]"
							style={{ backgroundColor: item.color ?? undefined }}
						/>
						<span className="text-muted-foreground text-xs">
							{itemConfig?.label || String(item.value ?? "")}
						</span>
					</div>
				);
			})}
		</div>
	);
}