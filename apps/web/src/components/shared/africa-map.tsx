"use client";

import dynamic from "next/dynamic";
import type { AfricaMapProps } from "./africa-map-client";

export type { AfricaMapProps };
export { AfroTixLogo } from "./africa-map-client";

export const AfricaMap = dynamic(
	() => import("./africa-map-client").then((mod) => mod.AfricaMap),
	{
		ssr: false,
		loading: () => (
			<div className="w-full h-full min-h-[300px] flex items-center justify-center bg-transparent">
				<div className="size-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
			</div>
		),
	},
);

export default AfricaMap;
