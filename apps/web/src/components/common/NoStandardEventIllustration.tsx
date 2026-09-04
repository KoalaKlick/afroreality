import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement>;

export function NoStandardEventIllustration({ className, ...props }: Readonly<Props>) {
	const primary = { fill: "var(--color-primary, #009A44)" } as React.CSSProperties;
	const strokePrimary = { stroke: "var(--color-primary, #009A44)" } as React.CSSProperties;
	const tertiary = { fill: "var(--color-tertiary, #EF3340)" } as React.CSSProperties;

	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 540 420"
			fill="none"
			className={className}
			role="img"
			aria-hidden="true"
			focusable="false"
			{...props}
		>
			<title>Standard event outline and timeline illustration</title>

			{/* Soft background ambient glow */}
			<ellipse cx="270" cy="350" rx="210" ry="24" fill="currentColor" fillOpacity="0.05" />

			{/* Central Schedule / Board Panel */}
			<rect
				x="100"
				y="70"
				width="340"
				height="270"
				rx="24"
				className="fill-card stroke-border"
				strokeWidth="2"
			/>

			{/* Board Header Bar */}
			<path
				d="M100 94C100 80.7452 110.745 70 124 70H416C429.255 70 440 80.7452 440 94V115H100V94Z"
				fill="currentColor"
				fillOpacity="0.04"
			/>
			<circle cx="132" cy="92" r="5" style={tertiary} />
			<circle cx="150" cy="92" r="5" fill="#FFD100" />
			<circle cx="168" cy="92" r="5" style={primary} />

			{/* Board Header Title bar */}
			<rect x="205" y="87" width="130" height="10" rx="5" fill="currentColor" fillOpacity="0.12" />

			{/* ── Timeline Track on Left Side ── */}
			<line
				x1="160"
				y1="145"
				x2="160"
				y2="305"
				stroke="currentColor"
				strokeOpacity="0.15"
				strokeWidth="2.5"
				strokeDasharray="4 4"
			/>

			{/* ── Timeline Milestone 1 ── */}
			<circle cx="160" cy="155" r="9" className="fill-card" style={strokePrimary} strokeWidth="3" />
			<circle cx="160" cy="155" r="4" style={primary} />
			{/* Time pill */}
			<rect x="185" y="146" width="55" height="18" rx="5" style={primary} fillOpacity="0.12" />
			<rect x="193" y="152" width="38" height="6" rx="3" style={primary} />
			{/* Outline Session Bar */}
			<rect x="250" y="146" width="155" height="18" rx="6" fill="currentColor" fillOpacity="0.08" />

			{/* ── Timeline Milestone 2 (Active Session) ── */}
			<circle cx="160" cy="215" r="11" style={primary} />
			<circle cx="160" cy="215" r="5" fill="#ffffff" />
			{/* Pulse ring */}
			<circle cx="160" cy="215" r="17" style={strokePrimary} strokeWidth="1.5" strokeOpacity="0.3" />
			{/* Time pill */}
			<rect x="185" y="206" width="55" height="18" rx="5" style={primary} fillOpacity="0.18" />
			<rect x="193" y="212" width="38" height="6" rx="3" style={primary} />
			{/* Session description card */}
			<rect x="250" y="200" width="165" height="36" rx="8" className="fill-card stroke-primary/30" strokeWidth="1.5" />
			<rect x="262" y="210" width="80" height="7" rx="3.5" style={primary} />
			<rect x="262" y="222" width="130" height="5" rx="2.5" fill="currentColor" fillOpacity="0.18" />

			{/* ── Timeline Milestone 3 ── */}
			<circle cx="160" cy="285" r="9" className="fill-card" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
			<circle cx="160" cy="285" r="4" fill="currentColor" fillOpacity="0.3" />
			{/* Time pill */}
			<rect x="185" y="276" width="55" height="18" rx="5" fill="currentColor" fillOpacity="0.08" />
			<rect x="193" y="282" width="38" height="6" rx="3" fill="currentColor" fillOpacity="0.25" />
			{/* Outline Session Bar */}
			<rect x="250" y="276" width="140" height="18" rx="6" fill="currentColor" fillOpacity="0.07" />

			{/* ── Interactive Speech / Topic Bubbles floating at top right ── */}
			<g transform="translate(370, 40)">
				{/* Back Chat Bubble */}
				<rect
					x="0"
					y="0"
					width="90"
					height="50"
					rx="14"
					className="fill-card stroke-border"
					strokeWidth="2"
				/>
				<path d="M22 50L14 62L34 50H22Z" className="fill-card" />
				<rect x="16" y="16" width="58" height="6" rx="3" fill="currentColor" fillOpacity="0.15" />
				<rect x="16" y="28" width="40" height="6" rx="3" fill="currentColor" fillOpacity="0.10" />

				{/* Front Topic Bubble */}
				<g transform="translate(30, 20)">
					<rect
						x="0"
						y="0"
						width="100"
						height="56"
						rx="16"
						className="fill-card shadow-lg"
						style={strokePrimary}
						strokeWidth="2"
					/>
					<path d="M72 56L82 68L64 56H72Z" className="fill-card" />
					<rect x="16" y="16" width="68" height="7" rx="3.5" style={primary} />
					<rect x="16" y="28" width="48" height="5" rx="2.5" fill="currentColor" fillOpacity="0.25" />
					<circle cx="78" cy="30" r="4" style={tertiary} />
				</g>
			</g>

			{/* ── Interactive Stage Microphone Icon Badge at Bottom Left ── */}
			<g transform="translate(55, 260)">
				<circle cx="36" cy="36" r="34" className="fill-card stroke-border" strokeWidth="2" />
				<circle cx="36" cy="36" r="28" style={primary} fillOpacity="0.12" />
				{/* Mic head */}
				<rect x="31" y="22" width="10" height="18" rx="5" style={primary} />
				{/* Mic arc */}
				<path
					d="M26 31C26 36.5228 30.4772 41 36 41C41.5228 41 46 36.5228 46 31"
					style={strokePrimary}
					strokeWidth="2.5"
					strokeLinecap="round"
				/>
				<line x1="36" y1="41" x2="36" y2="48" style={strokePrimary} strokeWidth="2.5" strokeLinecap="round" />
				<line x1="29" y1="48" x2="43" y2="48" style={strokePrimary} strokeWidth="2.5" strokeLinecap="round" />
			</g>

			{/* Sparkles / decorative accents */}
			<path
				d="M80 110L82.5 117.5L90 120L82.5 122.5L80 130L77.5 122.5L70 120L77.5 117.5L80 110Z"
				fill="#FFD100"
			/>
			<path
				d="M470 190L472 195L477 197L472 199L470 204L468 199L463 197L468 195L470 190Z"
				style={tertiary}
			/>
		</svg>
	);
}
