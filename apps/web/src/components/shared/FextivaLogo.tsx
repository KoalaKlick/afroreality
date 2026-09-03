"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useInView, useAnimation } from "motion/react";
import { PROJ_NAME } from "@/lib/constants/branding";
import { cn } from "@/lib/utils";

export interface FextivaLogoProps {
	readonly className?: string;
	readonly holdDuration?: number;
	readonly gapDuration?: number;
	readonly repeat?: boolean;
	readonly withStroke?: boolean;
	readonly strokeWidth?: number;
	readonly strokeColor?: string;
	readonly showWordmark?: boolean;
	readonly layout?: "horizontal" | "vertical";
	readonly wordmarkClassName?: string;
	readonly containerClassName?: string;
	readonly text?: string;
}

const PATH_RED =
	"m 180.15227,50.760058 c -7.81,7.43 -15.63,14.87 -23.45,22.3 -2.82,-0.67 -8.32,-7.5 -10.72,-9.76 -6.46,-6.08 -12.97,-12.12 -19.33,-18.33 -3.09,-3.03 -6.2,-6.77 -9.79,-9.2 -2.31,-1.57 -8.39,-0.42 -11.16,-0.42 -7.779999,0 -15.560003,-0.09 -23.330003,-0.04 -3.26,0.02 -7.58,-0.71 -10.67,0.3 20.88,24.72 41.760003,49.43 62.650003,74.150002 -0.3,2.18 -1.43,4.13 -1.95,6.25 -1.6,6.54 -2.47,12.99 -2.08,19.75 0.36,6.31 1.86,13.14 4.23,18.99 1.11,2.73 2.97,5.15 3.73,8.01 -3.48,-0.76 -6.83,-6.55 -9.25,-9.16 -7.63,-8.2 -14.59,-16.95 -21.97,-25.37 C 80.932267,98.450058 55.992267,67.530058 30.022267,37.610058 c -7.12,-8.21 -14.08,-16.6 -21.0299995,-24.97 -1.47,-1.77 -7.3899999,-7.4099997 -7.6399999,-9.2099997 0.79,-1.3 9.9099994,-0.74 12.0199994,-0.75 12.44,-0.05 24.89,0.01 37.33,0.01 18.44,-0.01 36.89,0.04 55.330003,-0.01 4.83,-0.01 20.31,-1.25 23.93,0.31 2.96,1.27 5.92,5.2 8.31,7.3699997 7.09,6.45 14.04,13.08 21,19.66 5.14,4.86 10.33,9.67 15.38,14.63 1.7,1.67 4.99,3.72 5.5,6.11 z m -75.45,92.230002 c 7.27,8.26 14.54,16.51 21.81,24.77 -12.99,16.4 -26.939999,32.2 -40.500003,48.14 -3.26,3.84 -6.75,7.51 -9.84,11.49 -1.12,1.45 -3.18,3.23 -3.22,5.04 4.11,1.46 12.46,0.14 17.08,0.23 6.330004,0.12 12.670003,0.03 19.000003,0.03 2.09,0 5.7,0.72 7.57,-0.24 3.92,-2.01 7.44,-7.29 10.63,-10.33 9.39,-8.96 18.52,-18.15 27.88,-27.12 2.85,-2.73 6.08,-7.65 9.54,-9.46 1.37,-0.72 3.69,0.63 5,1.12 3.71,1.37 7.61,2.23 11.53,2.77 6.92,0.97 14.09,0.64 20.87,-1.11 3.45,-0.89 7.64,-3.53 11.09,-3.56 -2.46,4.62 -14.37,14.26 -18.74,18.53 -14.5,14.18 -29.25,28.07 -43.63,42.37 -5.01,4.99 -10.08,9.94 -15.21,14.79 -1.49,1.41 -3.62,4.87 -5.66,5.32 -4.91,1.1 -16.92,0.08 -22.53,0.05 -16.000003,-0.07 -32.010003,-0.15 -48.000003,0.02 -14,0.15 -28.01,-0.03 -42,-0.05 -2.78,-0.01 -13.5499994,0.73 -15.0499994,-0.7 0.3,-2.59 4.7899999,-6.36 6.4599999,-8.41 5.8999995,-7.29 12.0899995,-14.36 18.1099995,-21.57 18.27,-21.85 36.52,-43.67 54.92,-65.41 5.34,-6.32 10.56,-12.77 16.000004,-19 1.99,-2.28 4.189999,-6.37 6.889999,-7.71 z";

const PATH_ORANGE =
	"m 374.70227,2.6200583 c -0.1,3.06 -4.14,6.55 -6.09,8.8699997 -5.95,7.07 -12,14.03 -17.9,21.15 -18.21,21.95 -36.6,43.81 -55.32,65.34 -5.63,6.470002 -11.16,13.050002 -16.71,19.590002 -2.08,2.46 -4.2,6.41 -7.15,7.86 -5.76,-5.21 -10.54,-11.55 -15.52,-17.49 -1.86,-2.22 -4.93,-4.67 -5.64,-7.51 17.9,-21.560002 35.79,-43.110002 53.69,-64.670002 -6.52,-1.87 -24.92,-0.4 -32.69,-0.47 -3.01,-0.02 -8.99,-1.22 -11.62,0.36 -5,2.99 -10.5,10.03 -14.8,14.19 -10.22,9.9 -20.44,20.11 -31.25,29.37 -2.89,0.06 -6.32,-1.74 -9,-2.71 -4.69,-1.7 -10.86,-2.49 -15.83,-2.33 -5.24,0.16 -9.88,1.11 -14.67,1.91 -1.96,0.33 -4.06,1.99 -5.67,0.35 26,-24.6 52,-49.21 78,-73.8099997 z";

const PATH_GREEN =
	"m 374.34227,265.09006 c -1.44,1.33 -10.44,0.68 -12.97,0.71 -12.34,0.12 -24.67,0.06 -37,0.04 -17.22,-0.02 -34.45,-0.08 -51.67,-0.01 -7.05,0.03 -19.5,1.26 -25.93,-0.02 -2.66,-0.53 -10.43,-9.86 -12.78,-12.17 -8.34,-8.2 -16.7,-16.41 -25.08,-24.59 -3.77,-3.67 -9.55,-7.68 -12.11,-12.29 0.61,-2.25 3.57,-4.22 5.2,-5.87 3.34,-3.41 13.99,-15.72 17.7,-16.91 3.86,2.23 7.46,6.83 10.62,10 6.53,6.55 13.19,13.06 19.93,19.39 2.18,2.05 7.62,8.42 10.05,9.3 3.58,1.29 9.56,0.05 13.4,0.05 9.99,0 20.01,0.12 30,-0.03 0.21,-2.07 -7.42,-9.87 -9.14,-11.96 -9.56,-11.64 -19.67,-22.81 -29.19,-34.47 -5.37,-6.58 -10.7,-13.32 -16.31,-19.7 -2.34,-2.66 -6.55,-6.16 -7.73,-9.57 -0.56,-1.63 1.01,-3.73 1.54,-5.24 1.48,-4.16 2.47,-8.6 3,-12.99 0.76,-6.32 0.46,-13.47 -1.06,-19.65 -0.79,-3.23 -3.43,-7.82 -3.13,-11.02 9.39,7.56 17.8,20.6 26.07,29.79 25.42,28.22 48.96,58.18 73.57,87.1 8.17,9.6 16.26,19.32 24.25,29.06 1.53,1.86 8.73,9.28 8.77,11.05 z";

const CIRCLE_CX = 188.08884;
const CIRCLE_CY = 131.4982;
const CIRCLE_R = 39.827129;

export function FextivaLogo({
	className = "h-auto",
	holdDuration = 2800,
	gapDuration = 600,
	repeat = false,
	withStroke = false,
	strokeWidth = 16,
	strokeColor,
	showWordmark = false,
	layout = "horizontal",
	wordmarkClassName,
	containerClassName,
	text = PROJ_NAME,
}: FextivaLogoProps) {
	const ref = useRef<SVGSVGElement>(null);
	const isInView = useInView(ref, { once: false, amount: 0.5 });
	const controls = useAnimation();
	const dotControls = useAnimation();
	const cycleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isMounted = useRef(false);
	const [active, setActive] = useState(false);

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
			// Silently handle animation interruptions
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

	const effectiveStrokeColor = strokeColor || "var(--left-bg, #f8f5f1)";

	const svgElement = (
		<motion.svg
			ref={ref}
			className={cn("overflow-visible", className)}
			style={{ overflow: "visible" }}
			viewBox="0 0 378.23117 267.54901"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			initial="hidden"
			animate={controls}
			suppressHydrationWarning
		>
			<title suppressHydrationWarning>{`${text || PROJ_NAME} Logo`}</title>

			{/* Background outline silhouette when withStroke is enabled */}
			{withStroke && (
				<g
					stroke={effectiveStrokeColor}
					strokeWidth={strokeWidth}
					strokeLinejoin="round"
					strokeLinecap="round"
					fill={effectiveStrokeColor}
					className="transition-colors"
				>
					<path d={PATH_RED} fillRule="evenodd" />
					<path d={PATH_ORANGE} fillRule="evenodd" />
					<path d={PATH_GREEN} fillRule="evenodd" />
					<circle cx={CIRCLE_CX} cy={CIRCLE_CY} r={CIRCLE_R} />
				</g>
			)}

			<g>
				{/* Top-left & Bottom-left Red wing */}
				<path
					d={PATH_RED}
					fill="#ca0808"
					fillRule="evenodd"
					stroke="#ca0808"
					strokeWidth={0.25}
					strokeLinejoin="round"
					style={{ fill: "#ca0808", fillOpacity: 1 }}
				/>

				{/* Top-right Orange wing */}
				<path
					d={PATH_ORANGE}
					fill="#e88722"
					fillRule="evenodd"
					stroke="#e88722"
					strokeWidth={0.25}
					strokeLinejoin="round"
					style={{ fill: "#e88722", fillOpacity: 1 }}
				/>

				{/* Bottom-right Green wing */}
				<path
					d={PATH_GREEN}
					fill="#53967a"
					fillRule="evenodd"
					stroke="#53967a"
					strokeWidth={0.25}
					strokeLinejoin="round"
					style={{ fill: "#53967a", fillOpacity: 1 }}
				/>

				{/* Center Orange circle */}
				<circle
					cx={CIRCLE_CX}
					cy={CIRCLE_CY}
					r={CIRCLE_R}
					fill="#e88722"
					style={{ fill: "#e88722", fillOpacity: 1 }}
				/>
			</g>
		</motion.svg>
	);

	if (!showWordmark) {
		return svgElement;
	}

	return (
		<div
			className={cn(
				"inline-flex select-none",
				layout === "vertical"
					? "flex-col items-center gap-2 text-center"
					: "flex-row items-center gap-2.5",
				containerClassName,
			)}
		>
			{svgElement}
			<span
				className={cn(
					"font-millik font-black lowercase tracking-tight text-foreground transition-colors",
					layout === "vertical" ? "text-lg sm:text-xl" : "text-xl sm:text-2xl",
					wordmarkClassName,
				)}
				style={
					withStroke
						? ({
								WebkitTextStroke: `4px ${effectiveStrokeColor}`,
								paintOrder: "stroke fill",
							} as React.CSSProperties)
						: undefined
				}
			>
				{text || PROJ_NAME}
			</span>
		</div>
	);
}
