// src/components/common/NoNomineeIllustration.tsx
import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement>;

export function NoNomineeIllustration({
	className,
	...props
}: Readonly<Props>) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 240 200"
			fill="none"
			className={className}
			role="img"
			aria-hidden="true"
			{...props}
		>
			<title>No nominees illustration</title>
			{/* Soft background glow */}
			<circle
				cx="120"
				cy="100"
				r="80"
				className="fill-primary/5"
			/>
			<circle
				cx="120"
				cy="100"
				r="60"
				className="fill-primary/10"
			/>

			{/* Left nominee silhouette */}
			<g opacity="0.35" transform="translate(45, 60)">
				<circle cx="25" cy="20" r="14" className="fill-muted-foreground" />
				<path
					d="M5 60 C 5 42, 14 38, 25 38 C 36 38, 45 42, 45 60"
					className="fill-muted-foreground"
				/>
			</g>

			{/* Right nominee silhouette */}
			<g opacity="0.35" transform="translate(145, 60)">
				<circle cx="25" cy="20" r="14" className="fill-muted-foreground" />
				<path
					d="M5 60 C 5 42, 14 38, 25 38 C 36 38, 45 42, 45 60"
					className="fill-muted-foreground"
				/>
			</g>

			{/* Center highlighted empty candidate frame */}
			<g transform="translate(85, 35)">
				<rect
					x="0"
					y="0"
					width="70"
					height="95"
					rx="14"
					className="fill-card stroke-primary/40"
					strokeWidth="2"
					strokeDasharray="4 4"
				/>
				<circle
					cx="35"
					cy="36"
					r="18"
					className="fill-primary/15 stroke-primary/30"
					strokeWidth="1.5"
				/>
				<path
					d="M15 80 C 15 62, 23 58, 35 58 C 47 58, 55 62, 55 80"
					className="fill-primary/20 stroke-primary/30"
					strokeWidth="1.5"
				/>
				{/* Plus badge on center */}
				<circle cx="52" cy="22" r="10" className="fill-primary" />
				<path
					d="M52 17 V27 M47 22 H57"
					stroke="white"
					strokeWidth="2"
					strokeLinecap="round"
				/>
			</g>

			{/* Podium / Base */}
			<rect
				x="30"
				y="145"
				width="180"
				height="8"
				rx="4"
				className="fill-muted stroke-border"
				strokeWidth="1"
			/>
		</svg>
	);
}
