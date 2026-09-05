"use client";

import DottedMap from "dotted-map";
import { motion } from "motion/react";
import { useMemo, useRef } from "react";

interface MapProps {
	readonly dots?: Array<{
		start: { lat: number; lng: number; label?: string };
		end: { lat: number; lng: number; label?: string };
	}>;
	readonly lineColor?: string;
	readonly dotsColor?: string;
	readonly className?: string;
}

export default function WorldMap({
	dots = [],
	lineColor = "var(--primary, #ea580c)",
	dotsColor = "currentColor",
	className = "",
}: MapProps) {
	const svgRef = useRef<SVGSVGElement>(null);

	const svgMap = useMemo(() => {
		const map = new DottedMap({ height: 100, grid: "diagonal" });
		return map.getSVG({
			radius: 0.22,
			color: dotsColor,
			shape: "circle",
			backgroundColor: "transparent",
		});
	}, [dotsColor]);

	const projectPoint = (lat: number, lng: number) => {
		const x = (lng + 180) * (800 / 360);
		const y = (90 - lat) * (400 / 180);
		return { x, y };
	};

	const createCurvedPath = (
		start: { x: number; y: number },
		end: { x: number; y: number },
	) => {
		const midX = (start.x + end.x) / 2;
		const midY = Math.min(start.y, end.y) - 50;
		return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
	};

	return (
		<div
			className={`w-full aspect-[2/1] rounded-lg relative font-sans text-muted-foreground/30 dark:text-muted-foreground/20 ${className}`}
		>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
				className="h-full w-full [mask-image:linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)] [mask-composite:intersect] pointer-events-none select-none"
				alt="world map"
				height="495"
				width="1056"
				draggable={false}
			/>
			{dots.length > 0 && (
				<svg
					ref={svgRef}
					viewBox="0 0 800 400"
					className="w-full h-full absolute inset-0 pointer-events-none select-none [mask-image:linear-gradient(to_bottom,transparent_2%,white_15%,white_85%,transparent_98%)] [mask-composite:intersect]"
				>
					<defs>
						<linearGradient
							id="map-path-gradient"
							x1="0%"
							y1="0%"
							x2="100%"
							y2="0%"
						>
							<stop offset="0%" stopColor="white" stopOpacity="0" />
							<stop offset="5%" stopColor={lineColor} stopOpacity="1" />
							<stop offset="95%" stopColor={lineColor} stopOpacity="1" />
							<stop offset="100%" stopColor="white" stopOpacity="0" />
						</linearGradient>

						<radialGradient id="map-dot-glow" cx="50%" cy="50%" r="50%">
							<stop offset="0%" stopColor={lineColor} stopOpacity="0.35" />
							<stop offset="100%" stopColor={lineColor} stopOpacity="0" />
						</radialGradient>
					</defs>

					{dots.map((dot, i) => {
						const startPoint = projectPoint(dot.start.lat, dot.start.lng);
						const endPoint = projectPoint(dot.end.lat, dot.end.lng);
						return (
							<g key={`path-group-${dot.start.lat}-${dot.end.lat}-${i}`}>
								<motion.path
									d={createCurvedPath(startPoint, endPoint)}
									fill="none"
									stroke="url(#map-path-gradient)"
									strokeWidth="1.5"
									initial={{ pathLength: 0 }}
									animate={{ pathLength: 1 }}
									transition={{ duration: 1.5, delay: 0.3 * i, ease: "easeOut" }}
								/>
							</g>
						);
					})}

					{dots.map((dot, i) => (
						<g key={`points-group-${dot.start.lat}-${dot.end.lat}-${i}`}>
							{[dot.start, dot.end].map((pt, j) => {
								const { x, y } = projectPoint(pt.lat, pt.lng);
								return (
									<g key={`pt-${pt.lat}-${pt.lng}-${j}`}>
										{/* Soft radial glow */}
										<circle cx={x} cy={y} r="14" fill="url(#map-dot-glow)" />
										{/* Solid core dot */}
										<circle cx={x} cy={y} r="2.5" fill={lineColor} />
										{/* Pulsing ring */}
										<circle
											cx={x}
											cy={y}
											r="2.5"
											fill={lineColor}
											opacity="0.4"
										>
											<animate
												attributeName="r"
												from="2.5"
												to="11"
												dur="2.5s"
												begin={`${i * 0.4}s`}
												repeatCount="indefinite"
											/>
											<animate
												attributeName="opacity"
												from="0.4"
												to="0"
												dur="2.5s"
												begin={`${i * 0.4}s`}
												repeatCount="indefinite"
											/>
										</circle>
									</g>
								);
							})}
						</g>
					))}
				</svg>
			)}
		</div>
	);
}
