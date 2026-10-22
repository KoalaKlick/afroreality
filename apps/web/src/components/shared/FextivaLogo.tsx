"use client";

import LogoSvg from "@/assets/logo.svg";
import { PROJ_NAME } from "@/lib/constants/branding";
import { cn } from "@/lib/utils";

export interface FextivaLogoProps {
	readonly className?: string;
	readonly showWordmark?: boolean;
	readonly layout?: "horizontal" | "vertical";
	readonly wordmarkClassName?: string;
	readonly containerClassName?: string;
	readonly text?: string;
	readonly withStroke?: boolean;
	readonly strokeWidth?: number;
	readonly strokeColor?: string;
	readonly holdDuration?: number;
	readonly gapDuration?: number;
	readonly repeat?: boolean;
}

export function FextivaLogo({
	className = "h-5 w-auto",
	showWordmark = false,
	layout = "horizontal",
	wordmarkClassName,
	containerClassName,
	text = PROJ_NAME,
}: FextivaLogoProps) {
	const logoElement = (
		<LogoSvg
			className={cn("h-6 w-auto block overflow-visible shrink-0", className)}
			aria-label={`${text || PROJ_NAME} Logo`}
		/>
	);

	if (!showWordmark) {
		return logoElement;
	}

	return (
		<div
			className={cn(
				"inline-flex items-center select-none gap-2",
				layout === "vertical" ? "flex-col text-center" : "flex-row",
				containerClassName,
			)}
		>
			{logoElement}
			<span
				className={cn(
					"font-millik font-black lowercase tracking-tight text-foreground transition-colors",
					layout === "vertical" ? "text-lg" : "text-xl",
					wordmarkClassName,
				)}
			>
				{text || PROJ_NAME}
			</span>
		</div>
	);
}
