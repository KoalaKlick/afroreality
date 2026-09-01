"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";

interface AnimatedCounterProps {
	readonly value: number;
	readonly duration?: number;
	readonly className?: string;
	readonly style?: React.CSSProperties;
	readonly format?: (value: number) => string;
}

export function AnimatedCounter({
	value,
	duration = 2,
	className,
	style,
	format,
}: AnimatedCounterProps) {
	const count = useMotionValue(0);
	const rounded = useTransform(count, (v) => Math.round(v));
	const display = useTransform(rounded, (v) =>
		format ? format(v) : String(v)
	);

	useEffect(() => {
		const controls = animate(count, value, { duration });
		return () => controls.stop();
	}, [value, duration]);

	return (
		<motion.span className={className} style={style}>
			{display}
		</motion.span>
	);
}
