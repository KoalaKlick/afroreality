"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface WhatsAppDoodleBackgroundProps {
	readonly primaryColor?: string;
	readonly className?: string;
}

export function WhatsAppDoodleBackground({
	primaryColor = "#009A44",
	className,
}: WhatsAppDoodleBackgroundProps) {
	const rawId = useId();
	const patternId = `doodle-pattern-${rawId.replace(/:/g, "")}`;

	return (
		<div
			className={cn(
				"absolute inset-0 pointer-events-none z-0 overflow-hidden print:hidden transition-colors duration-700",
				className,
			)}
			style={{ backgroundColor: primaryColor }}
			aria-hidden="true"
		>
			{/* Soft ambient lighting for depth */}
			<div
				className="absolute inset-0 pointer-events-none transition-all duration-700"
				style={{
					background:
						"radial-gradient(circle at 50% 30%, rgba(255,255,255,0.12) 0%, rgba(0,0,0,0.18) 100%)",
				}}
			/>

			{/* WhatsApp-style Repeatable Skeletal SVG Pattern in white */}
			<svg
				className="absolute inset-0 size-full text-white opacity-25 transition-opacity duration-700"
				xmlns="http://www.w3.org/2000/svg"
			>
				<defs>
					<pattern
						id={patternId}
						x="0"
						y="0"
						width="200"
						height="200"
						patternUnits="userSpaceOnUse"
					>
						<g
							fill="none"
							stroke="currentColor"
							strokeWidth="1.4"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							{/* 1. Ticket Pass Outline */}
							<path d="M16 16h24a2 2 0 0 1 2 2v4a3 3 0 0 0 0 6v4a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2v-4a3 3 0 0 0 0-6v-4a2 2 0 0 1 2-2z" />
							<path d="M28 16v18" strokeDasharray="2 2" />

							{/* 2. Music Notes */}
							<path d="M78 28a3 3 0 1 1-3-3c1.6 0 3 1.3 3 3V12l14-3v14a3 3 0 1 1-3-3c1.6 0 3 1.3 3 3" />
							<path d="M78 17l14-3" />

							{/* 3. Four-point Sparkle */}
							<path d="M142 16c0 4-3 7-7 7 4 0 7 3 7 7 0-4 3-7 7-7-4 0-7-3-7-7z" />

							{/* 4. Chat Bubble */}
							<path d="M170 28a7 7 0 0 1 11-4 7 7 0 0 1 2 9l2 5-5-2a7 7 0 0 1-10-8z" />
							<circle cx="174" cy="27" r="0.7" fill="currentColor" />
							<circle cx="178" cy="27" r="0.7" fill="currentColor" />

							{/* 5. Heart */}
							<path d="M30 68c-2.5-3-6.5-3-9 0-2.5 3-1 7 2 10l7 6.5 7-6.5c3-3 4.5-7 2-10-2.5-3-6.5-3-9 0z" />

							{/* 6. Coffee Mug */}
							<path d="M70 70h14v7a7 7 0 0 1-14 0v-7z" />
							<path d="M84 72h3a2 2 0 0 1 0 4h-3" />
							<path d="M68 85h18" />
							<path d="M74 65c0-2 1-3 1-5" />
							<path d="M80 65c0-2 1-3 1-5" />

							{/* 7. Camera */}
							<rect x="117" y="72" width="18" height="13" rx="2" />
							<circle cx="126" cy="78.5" r="3.5" />
							<path d="M122 72l1.5-2.5h5l1.5 2.5" />

							{/* 8. Location Pin */}
							<path d="M175 73a5 5 0 0 0-5 5c0 4 5 9 5 9s5-5 5-9a5 5 0 0 0-5-5z" />
							<circle cx="175" cy="78" r="1.5" />

							{/* 9. Headphones */}
							<path d="M16 130v-4a10 10 0 0 1 20 0v4" />
							<rect x="13" y="129" width="5" height="7" rx="2" />
							<rect x="34" y="129" width="5" height="7" rx="2" />

							{/* 10. Calendar */}
							<rect x="67" y="119" width="16" height="14" rx="2" />
							<path d="M67 124h16" />
							<path d="M71 116v4M79 116v4" />
							<circle cx="75" cy="128" r="1" fill="currentColor" />

							{/* 11. Small Star Sparkle */}
							<path d="M112 125l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" />

							{/* 12. Party Popper & Confetti */}
							<path d="M150 143l12-6-6-12-6 18z" />
							<path d="M156 137l-3-6M160 134l4-4M166 136l4 2" />

							{/* 13. Globe / Planet */}
							<circle cx="34" cy="176" r="7" />
							<path d="M24 179c3-2 17-4 20-1" />

							{/* 14. Megaphone */}
							<path d="M80 173v6l10 4v-14l-10 4z" />
							<path d="M80 175h-4a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h4" />
							<path d="M83 181v3" />

							{/* 15. Classic 5-point Star */}
							<path d="M136 169l2 4 4.5.5-3.5 3 1 4.5-4-2.5-4 2.5 1-4.5-3.5-3 4.5-.5z" />

							{/* 16. Smile Face */}
							<circle cx="180" cy="173" r="7" />
							<path d="M177 175a3.5 3.5 0 0 0 6 0" />
							<circle cx="178" cy="171" r="0.6" fill="currentColor" />
							<circle cx="182" cy="171" r="0.6" fill="currentColor" />
						</g>
					</pattern>
				</defs>
				<rect width="100%" height="100%" fill={`url(#${patternId})`} />
			</svg>
		</div>
	);
}
