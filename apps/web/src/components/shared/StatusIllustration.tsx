"use client";

import { cn } from "@/lib/utils";

export type StatusIllustrationVariant =
	| "valid"
	| "checked_in"
	| "invalid"
	| "locked"
	| "ready";

const SVG_MAP: Record<StatusIllustrationVariant, string> = {
	valid: "/svg/status-valid.svg",
	checked_in: "/svg/status-checked-in.svg",
	invalid: "/svg/status-invalid.svg",
	locked: "/svg/status-locked.svg",
	ready: "/svg/no-order.svg",
};

interface StatusIllustrationProps {
	readonly variant: StatusIllustrationVariant;
	readonly alt?: string;
	readonly className?: string;
}

/** Same clean undraw-style SVG language as EmptyState — for status / gate UI. */
export function StatusIllustration({
	variant,
	alt = "",
	className,
}: StatusIllustrationProps) {
	return (
		<div
			className={cn(
				"relative w-28 h-28 mx-auto flex items-center justify-center select-none",
				className,
			)}
		>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={SVG_MAP[variant]}
				alt={alt}
				className="w-full h-full object-contain drop-shadow-xs"
			/>
		</div>
	);
}
