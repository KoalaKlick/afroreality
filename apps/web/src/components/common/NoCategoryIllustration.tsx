// src/components/common/NoCategoryIllustration.tsx
import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement>;

export function NoCategoryIllustration({
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
			<title>No categories illustration</title>
			{/* Ambient background rings */}
			<circle cx="120" cy="100" r="80" className="fill-primary/5" />
			<circle cx="120" cy="100" r="60" className="fill-primary/10" />

			{/* Left background category card */}
			<g opacity="0.35" transform="translate(35, 65)">
				<rect
					x="0"
					y="0"
					width="55"
					height="65"
					rx="10"
					className="fill-muted stroke-muted-foreground/30"
					strokeWidth="1.5"
				/>
				<rect x="10" y="14" width="35" height="6" rx="3" className="fill-muted-foreground/40" />
				<rect x="10" y="26" width="24" height="4" rx="2" className="fill-muted-foreground/30" />
				<circle cx="27" cy="46" r="8" className="fill-muted-foreground/20" />
			</g>

			{/* Right background category card */}
			<g opacity="0.35" transform="translate(150, 65)">
				<rect
					x="0"
					y="0"
					width="55"
					height="65"
					rx="10"
					className="fill-muted stroke-muted-foreground/30"
					strokeWidth="1.5"
				/>
				<rect x="10" y="14" width="35" height="6" rx="3" className="fill-muted-foreground/40" />
				<rect x="10" y="26" width="24" height="4" rx="2" className="fill-muted-foreground/30" />
				<circle cx="27" cy="46" r="8" className="fill-muted-foreground/20" />
			</g>

			{/* Center prominent category badge / award frame */}
			<g transform="translate(80, 30)">
				<rect
					x="0"
					y="0"
					width="80"
					height="105"
					rx="14"
					className="fill-card stroke-primary/50"
					strokeWidth="2"
					strokeDasharray="4 4"
				/>
				{/* Category trophy / rosette icon in center */}
				<circle
					cx="40"
					cy="42"
					r="22"
					className="fill-primary/15 stroke-primary/30"
					strokeWidth="1.5"
				/>
				<path
					d="M33 32 H47 V42 C47 46 44 49 40 49 C36 49 33 46 33 42 Z"
					className="fill-primary/30 stroke-primary"
					strokeWidth="1.5"
				/>
				<path
					d="M30 35 C28 35 27 37 27 40 C27 43 30 44 33 44 M50 44 C53 44 56 43 56 40 C56 37 55 35 50 35"
					className="stroke-primary"
					strokeWidth="1.5"
					strokeLinecap="round"
				/>
				<path
					d="M40 49 V54 M35 54 H45"
					className="stroke-primary"
					strokeWidth="1.5"
					strokeLinecap="round"
				/>

				{/* Placeholder lines for category name and description */}
				<rect x="15" y="74" width="50" height="6" rx="3" className="fill-primary/30" />
				<rect x="22" y="86" width="36" height="4" rx="2" className="fill-muted-foreground/30" />

				{/* Add (+) badge on top right */}
				<circle cx="68" cy="14" r="10" className="fill-primary" />
				<path
					d="M68 9 V19 M63 14 H73"
					stroke="white"
					strokeWidth="2"
					strokeLinecap="round"
				/>
			</g>

			{/* Floor Shadow Line */}
			<rect
				x="25"
				y="150"
				width="190"
				height="8"
				rx="4"
				className="fill-muted stroke-border"
				strokeWidth="1"
			/>
		</svg>
	);
}
