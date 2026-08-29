"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { RevenueChart as RevenueChartType } from "./RevenueChart-client";

export const RevenueChart = dynamic(
	() => import("./RevenueChart-client").then((mod) => mod.RevenueChart),
	{
		ssr: false,
		loading: () => (
			<div className="h-[280px] w-full rounded-lg bg-muted/10 animate-pulse flex items-end justify-between p-6 gap-2">
				<div className="w-8 h-1/4 bg-muted/30 rounded" />
				<div className="w-8 h-1/2 bg-muted/30 rounded" />
				<div className="w-8 h-3/4 bg-muted/30 rounded" />
				<div className="w-8 h-2/3 bg-muted/30 rounded" />
				<div className="w-8 h-full bg-muted/30 rounded" />
			</div>
		),
	},
) as unknown as typeof RevenueChartType;
