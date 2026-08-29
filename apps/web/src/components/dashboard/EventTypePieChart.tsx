"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { EventTypePieChart as EventTypePieChartType } from "./EventTypePieChart-client";

export const EventTypePieChart = dynamic(
	() =>
		import("./EventTypePieChart-client").then((mod) => mod.EventTypePieChart),
	{
		ssr: false,
		loading: () => (
			<div className="h-[280px] w-full rounded-lg bg-muted/10 animate-pulse flex items-center justify-center">
				<div className="size-32 rounded-full border-4 border-muted/30 border-t-emerald-500 animate-spin" />
			</div>
		),
	},
) as unknown as typeof EventTypePieChartType;
