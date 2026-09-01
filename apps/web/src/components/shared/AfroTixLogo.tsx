"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useInView, useAnimation, type Variants } from "motion/react";
import { PROJ_NAME } from "@/lib/constants/branding";

interface fextivaLogoProps {
	readonly className?: string;
	readonly holdDuration?: number;
	readonly gapDuration?: number;
	readonly repeat?: boolean;
}

export function fextivaLogo({
	className = "h-auto",
	holdDuration = 2800,
	gapDuration = 600,
	repeat = false,
}: fextivaLogoProps) {
	const ref = useRef<SVGSVGElement>(null);
	const isInView = useInView(ref, { once: false, amount: 0.5 });
	const controls = useAnimation();
	const dotControls = useAnimation();
	const cycleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isMounted = useRef(false);
	const [active, setActive] = useState(false);

	const isfextiva = PROJ_NAME.toLowerCase().includes("fextiva");
	const namePart1 = isfextiva ? "Afro" : PROJ_NAME;
	const namePart2 = isfextiva ? "Reality" : "";

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

	return (
		<motion.svg
			ref={ref}
			className={className}
			viewBox="0 0 520 90"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			initial="hidden"
			animate={controls}
			suppressHydrationWarning
		>
			<title suppressHydrationWarning>{`${PROJ_NAME} Logo`}</title>
			<text
				y="75"
				fontFamily="'Poppins', Arial, sans-serif"
				fontSize="90"
				fontWeight="800"
				letterSpacing="-2"
				textAnchor="start"
			>
				<motion.tspan fill="#C41E3A" custom={0} variants={letterVariants}>
					{namePart1}
				</motion.tspan>
				{namePart2 && (
					<motion.tspan fill="#FFB800" custom={1} variants={letterVariants}>
						{namePart2}
					</motion.tspan>
				)}
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
