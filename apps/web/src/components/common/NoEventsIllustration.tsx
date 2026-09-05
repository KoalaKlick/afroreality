import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

type Props = SVGProps<SVGSVGElement>;

export function NoEventsIllustration({ className, ...props }: Readonly<Props>) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 320 200"
			fill="none"
			role="img"
			aria-hidden="true"
			focusable="false"
			className={cn("w-full h-auto max-w-[280px] select-none", className)}
			{...props}
		>
			<title>No events illustration</title>
			<defs>
				{/* Soft drop shadows */}
				<filter id="card-shadow-bottom" x="-10%" y="-10%" width="130%" height="140%">
					<feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#0f172a" floodOpacity="0.04" />
				</filter>
				<filter id="card-shadow-mid" x="-10%" y="-10%" width="130%" height="140%">
					<feDropShadow dx="0" dy="8" stdDeviation="14" floodColor="#0f172a" floodOpacity="0.06" />
				</filter>
				<filter id="card-shadow-top" x="-10%" y="-10%" width="130%" height="140%">
					<feDropShadow dx="0" dy="12" stdDeviation="18" floodColor="#0f172a" floodOpacity="0.08" />
				</filter>
			</defs>

			{/* ── Bottom Card (Layer 3) ── */}
			<g filter="url(#card-shadow-bottom)">
				<rect
					x="42"
					y="80"
					width="236"
					height="96"
					rx="18"
					className="fill-card stroke-border/40"
					strokeWidth="1.5"
				/>
				{/* Left icon placeholder */}
				<rect
					x="56"
					y="96"
					width="42"
					height="42"
					rx="10"
					className="fill-muted/60 dark:fill-muted/40"
				/>
				{/* Right lines */}
				<rect
					x="110"
					y="104"
					width="128"
					height="12"
					rx="6"
					className="fill-muted/60 dark:fill-muted/40"
				/>
				<rect
					x="110"
					y="124"
					width="80"
					height="12"
					rx="6"
					className="fill-muted/40 dark:fill-muted/25"
				/>
			</g>

			{/* ── Middle Card (Layer 2) ── */}
			<g filter="url(#card-shadow-mid)">
				<rect
					x="26"
					y="44"
					width="268"
					height="98"
					rx="20"
					className="fill-card stroke-border/50"
					strokeWidth="1.5"
				/>
				{/* Left icon placeholder */}
				<rect
					x="42"
					y="60"
					width="46"
					height="46"
					rx="12"
					className="fill-muted/75 dark:fill-muted/50"
				/>
				{/* Right lines */}
				<rect
					x="100"
					y="70"
					width="168"
					height="13"
					rx="6.5"
					className="fill-muted/75 dark:fill-muted/50"
				/>
				<rect
					x="100"
					y="91"
					width="110"
					height="13"
					rx="6.5"
					className="fill-muted/50 dark:fill-muted/30"
				/>
			</g>

			{/* ── Top Card (Layer 1) ── */}
			<g filter="url(#card-shadow-top)">
				<rect
					x="10"
					y="8"
					width="300"
					height="100"
					rx="22"
					className="fill-card stroke-border/60"
					strokeWidth="1.5"
				/>
				{/* Left icon placeholder */}
				<rect
					x="26"
					y="24"
					width="50"
					height="50"
					rx="14"
					className="fill-muted/90 dark:fill-muted/65"
				/>
				{/* Right lines */}
				<rect
					x="90"
					y="34"
					width="100"
					height="14"
					rx="7"
					className="fill-muted/90 dark:fill-muted/65"
				/>
				<rect
					x="90"
					y="56"
					width="180"
					height="14"
					rx="7"
					className="fill-muted/60 dark:fill-muted/40"
				/>
			</g>
		</svg>
	);
}
