"use client";
// src/components/shared/africa-map.tsx

import { motion, useAnimation, useInView, type Variants } from "motion/react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { africaPaths, type CountryPath } from "./africa-paths";

// Pan-African inspired color palette
const PAN_AFRICAN_COLORS = [
	"#E31B23",
	"#FCD116",
	"#009739",
	"#000000",
	"#CE1126",
	"#007A3D",
	"#F0E130",
	"#C8102E",
	"#006B3F",
] as const;

export interface AfricaMapProps {
	readonly images?: readonly string[];
	readonly interval?: number;
	readonly showHoverColor?: boolean;
	readonly showTransitionColor?: boolean;
	readonly staggerDelay?: number;
}

// Static country path component
const CountryPathComponent = memo(function CountryPathComponent({
	country,
	color,
	revealDelay,
	baseImageIdx,
	targetImageIdx,
	isTransitioning,
	showColorPulse,
	showHoverColor,
	hasInitiallyRevealed,
}: {
	country: CountryPath;
	color: string;
	revealDelay: number;
	baseImageIdx: number;
	targetImageIdx: number;
	isTransitioning: boolean;
	showColorPulse: boolean;
	showHoverColor: boolean;
	hasInitiallyRevealed: boolean;
}) {
	return (
		<g className="country-group">
			{/* Initial color layer */}
			<path
				d={country.d}
				fill={color}
				stroke="rgba(255,255,255,0.3)"
				strokeWidth="1"
				style={{
					opacity: hasInitiallyRevealed ? 0 : 1,
					transition: hasInitiallyRevealed
						? `opacity 0.6s ease-out ${revealDelay}s`
						: "none",
				}}
			/>

			{/* Base image layer */}
			<path
				d={country.d}
				fill={`url(#map-image-${baseImageIdx})`}
				stroke="rgba(255,255,255,0.2)"
				strokeWidth="1"
				style={{
					opacity: hasInitiallyRevealed ? 1 : 0,
					transition: hasInitiallyRevealed
						? `opacity 0.6s ease-out ${revealDelay}s`
						: "none",
				}}
			/>

			{/* Transition image layer */}
			<path
				d={country.d}
				fill={`url(#map-image-${targetImageIdx})`}
				stroke="rgba(255,255,255,0.2)"
				strokeWidth="1"
				style={{
					opacity: isTransitioning ? 1 : 0,
					transition: isTransitioning
						? `opacity 0.6s ease-out ${revealDelay}s`
						: "none",
					willChange: "opacity",
				}}
			/>

			{/* Color pulse layer */}
			{showColorPulse && hasInitiallyRevealed && (
				<path
					d={country.d}
					fill={color}
					className="animate-pulse-fade"
					style={{
						animationDelay: `${revealDelay}s`,
					}}
				/>
			)}

			{/* Hover layer */}
			{showHoverColor && (
				<path
					d={country.d}
					fill={color}
					className="cursor-pointer transition-opacity duration-150 opacity-0 hover:opacity-85"
					style={{ pointerEvents: "all" }}
				/>
			)}
			<title>{country.name}</title>
		</g>
	);
});

export function AfricaMap({
	images = ["/landing/g.webp", "/landing/b.webp", "/landing/h.webp"],
	interval = 9000,
	showHoverColor = true,
	showTransitionColor = false,
	staggerDelay = 0.02,
}: AfricaMapProps) {
	const [baseIdx, setBaseIdx] = useState(0);
	const [targetIdx, setTargetIdx] = useState(0);
	const [isTransitioning, setIsTransitioning] = useState(false);
	const [showPulse, setShowPulse] = useState(true);
	const [initialReveal, setInitialReveal] = useState(false);
	const [isMounted, setIsMounted] = useState(false);

	const totalAnimationDuration = africaPaths.length * staggerDelay * 1000 + 600;

	const revealOrder = useMemo(() => {
		if (!isMounted) {
			return africaPaths.map((_, i) => i);
		}
		const indices = africaPaths.map((_, i) => i);
		for (let i = indices.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			const tmp = indices[i] as number;
			indices[i] = indices[j] as number;
			indices[j] = tmp;
		}
		return indices;
	}, [isMounted]);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	const colorMap = useMemo(
		() =>
			africaPaths.map(
				(_, i) => PAN_AFRICAN_COLORS[i % PAN_AFRICAN_COLORS.length] || "#E31B23",
			),
		[],
	);

	useEffect(() => {
		const revealTimer = setTimeout(() => {
			setInitialReveal(true);
		}, 100);

		const pulseTimer = setTimeout(
			() => setShowPulse(false),
			totalAnimationDuration + 100,
		);
		return () => {
			clearTimeout(revealTimer);
			clearTimeout(pulseTimer);
		};
	}, [totalAnimationDuration]);

	useEffect(() => {
		if (images.length <= 1) return;

		const timer = setInterval(() => {
			const nextIdx = (targetIdx + 1) % images.length;
			setTargetIdx(nextIdx);
			setIsTransitioning(true);

			if (showTransitionColor) setShowPulse(true);

			setTimeout(() => {
				setBaseIdx(nextIdx);
				setIsTransitioning(false);
				setShowPulse(false);
			}, totalAnimationDuration);
		}, interval);

		return () => clearInterval(timer);
	}, [
		images.length,
		interval,
		targetIdx,
		totalAnimationDuration,
		showTransitionColor,
	]);

	const getRevealDelay = (originalIndex: number) => {
		return revealOrder.indexOf(originalIndex) * staggerDelay;
	};

	return (
		<div className="relative w-full h-full overflow-hidden">
			<style>{`
				@keyframes pulse-fade {
					0% { opacity: 0; }
					40% { opacity: 0.85; }
					100% { opacity: 0; }
				}
				.animate-pulse-fade {
					animation: pulse-fade 0.4s ease-out forwards;
					will-change: opacity;
				}
			`}</style>

			<svg
				viewBox="0 0 1000 1001"
				className="absolute inset-0 w-full h-full"
				xmlns="http://www.w3.org/2000/svg"
				preserveAspectRatio="xMidYMid slice"
				aria-labelledby="africa-map-title"
			>
				<title id="africa-map-title">Africa Map</title>
				<defs>
					{images.map((img, idx) => (
						<pattern
							key={img}
							id={`map-image-${idx}`}
							patternUnits="userSpaceOnUse"
							width="1000"
							height="1001"
						>
							<image
								href={img}
								width="1000"
								height="1001"
								preserveAspectRatio="xMidYMid slice"
							/>
						</pattern>
					))}
				</defs>

				<g id="africa-countries">
					{africaPaths.map((country, idx) => (
						<CountryPathComponent
							key={country.name}
							country={country}
							color={colorMap[idx] || "#E31B23"}
							revealDelay={getRevealDelay(idx)}
							baseImageIdx={baseIdx}
							targetImageIdx={targetIdx}
							isTransitioning={isTransitioning}
							showColorPulse={showPulse}
							showHoverColor={showHoverColor}
							hasInitiallyRevealed={initialReveal}
						/>
					))}
				</g>
			</svg>
		</div>
	);
}

interface FextivaLogoProps {
	readonly className?: string;
	readonly holdDuration?: number;
	readonly gapDuration?: number;
	readonly repeat?: boolean;
}

export function FextivaLogo({
	className = "h-auto",
	holdDuration = 2800,
	gapDuration = 600,
	repeat = false,
}: FextivaLogoProps) {
	const ref = useRef<SVGSVGElement>(null);
	const isInView = useInView(ref, { once: false, amount: 0.5 });
	const controls = useAnimation();
	const dotControls = useAnimation();
	const cycleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isMounted = useRef(false);
	const [active, setActive] = useState(false);

	const letterVariants: Variants = {
		hidden: { opacity: 0, y: 16 },
		visible: (i: number) => ({
			opacity: 1,
			y: 0,
			transition: {
				delay: i * 0.13,
				duration: 0.55,
				ease: [0.22, 1, 0.36, 1],
			},
		}),
		exit: (i: number) => ({
			opacity: 0,
			y: -14,
			transition: {
				delay: i * 0.08,
				duration: 0.38,
				ease: [0.55, 0, 0.78, 0],
			},
		}),
	};

	const dotVariants: Variants = {
		hidden: { opacity: 0, scale: 0 },
		visible: {
			opacity: 1,
			scale: [0, 1.5, 0.9, 1.15, 1],
			transition: {
				delay: 0.32,
				duration: 0.7,
				ease: [0.22, 1, 0.36, 1],
			},
		},
		pulse: {
			scale: [1, 1.2, 1],
			transition: {
				duration: 1.6,
				repeat: Infinity,
				repeatDelay: 2.4,
				ease: "easeInOut",
			},
		},
		exit: {
			opacity: 0,
			scale: 0,
			transition: {
				duration: 0.3,
				ease: [0.55, 0, 0.78, 0],
			},
		},
	};

	const runCycle = useCallback(async () => {
		if (!isMounted.current) return;
		try {
			await controls.start("visible");
			if (!isMounted.current) return;
			await dotControls.start("visible");
			if (!isMounted.current) return;
			dotControls.start("pulse");

			if (!repeat) return;

			cycleRef.current = setTimeout(async () => {
				if (!isMounted.current) return;
				await dotControls.start("exit");
				if (!isMounted.current) return;
				await controls.start("exit");

				if (!isMounted.current) return;
				cycleRef.current = setTimeout(() => {
					if (!isMounted.current) return;
					controls.set("hidden");
					dotControls.set("hidden");
					runCycle();
				}, gapDuration);
			}, holdDuration);
		} catch {
			// Silently ignore animation interruptions
		}
	}, [controls, dotControls, repeat, holdDuration, gapDuration]);

	useEffect(() => {
		isMounted.current = true;
		return () => {
			isMounted.current = false;
			if (cycleRef.current) clearTimeout(cycleRef.current);
			controls.stop();
			dotControls.stop();
		};
	}, [controls, dotControls]);

	useEffect(() => {
		if (!isMounted.current) return;

		if (isInView && !active) {
			setActive(true);
			controls.set("hidden");
			dotControls.set("hidden");
			requestAnimationFrame(() => {
				if (isMounted.current) runCycle();
			});
		}

		if (!isInView && active) {
			setActive(false);
			if (cycleRef.current) clearTimeout(cycleRef.current);
			controls.stop();
			dotControls.stop();
			controls.set("hidden");
			dotControls.set("hidden");
		}
	}, [isInView, active, controls, dotControls, runCycle]);

	return (
		<motion.svg
			ref={ref}
			className={className}
			viewBox="0 0 480 90"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			initial="hidden"
			animate={controls}
			suppressHydrationWarning
		>
			<title suppressHydrationWarning>fextiva Logo</title>
			<text
				y="80"
				fontFamily="'Poppins', Arial, sans-serif"
				fontSize="105"
				fontWeight="800"
				letterSpacing="-2"
				textAnchor="start"
			>
				<motion.tspan fill="#C41E3A" custom={0} variants={letterVariants}>
					Fextiva
				</motion.tspan>
				<motion.tspan
					fill="#228B22"
					variants={dotVariants}
					animate={dotControls}
				>
					.
				</motion.tspan>
			</text>
		</motion.svg>
	);
}

export default AfricaMap;
