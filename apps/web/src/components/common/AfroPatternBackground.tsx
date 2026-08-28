import React from "react";
import { cn } from "@/lib/utils";

interface AfroPatternBackgroundProps {
	className?: string;
	opacity?: string;
}

export function AfroPatternBackground({
	className,
	opacity = "opacity-40 dark:opacity-20",
}: AfroPatternBackgroundProps) {
	return (
		<div
			className={cn(
				"absolute inset-0 pointer-events-none overflow-hidden select-none",
				className,
			)}
		>
			<svg
				className={cn("w-full h-full text-primary/30", opacity)}
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<defs>
					<pattern
						id="afro-kente-geometric-pattern"
						width="48"
						height="48"
						patternUnits="userSpaceOnUse"
					>
						<path
							d="M0 0h24v24H12V12h6v6M24 24h24v24H36V36h6v6M24 0h24v24H24M0 24h24v24H0"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.2"
						/>
						<rect
							x="6"
							y="6"
							width="4"
							height="4"
							fill="currentColor"
							fillOpacity="0.4"
						/>
						<rect
							x="30"
							y="30"
							width="4"
							height="4"
							fill="currentColor"
							fillOpacity="0.4"
						/>
					</pattern>
				</defs>
				<rect
					width="100%"
					height="100%"
					fill="url(#afro-kente-geometric-pattern)"
				/>
			</svg>
		</div>
	);
}
