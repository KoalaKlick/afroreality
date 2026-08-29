"use client";

import React, { useState, useRef } from "react";
import {
	motion,
	useTransform,
	AnimatePresence,
	useMotionValue,
	useSpring,
} from "motion/react";
import { Users } from "lucide-react";

export interface TooltipItem {
	id: number | string;
	name: string;
	designation: string;
	image?: string | null;
}

function TooltipAvatar({ item }: { readonly item: TooltipItem }) {
	const [hovered, setHovered] = useState(false);
	const animationFrameRef = useRef<number | null>(null);

	const springConfig = { stiffness: 100, damping: 15 };
	const x = useMotionValue(0);
	const rotate = useSpring(
		useTransform(x, [-100, 100], [-45, 45]),
		springConfig,
	);
	const translateX = useSpring(
		useTransform(x, [-100, 100], [-50, 50]),
		springConfig,
	);

	const handleMouseMove = (event: React.MouseEvent<HTMLElement>) => {
		if (animationFrameRef.current) {
			cancelAnimationFrame(animationFrameRef.current);
		}
		animationFrameRef.current = requestAnimationFrame(() => {
			const halfWidth = (event.target as HTMLElement).offsetWidth / 2;
			x.set(event.nativeEvent.offsetX - halfWidth);
		});
	};

	return (
		<div
			className="group relative -mr-3 hover:z-50"
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => {
				setHovered(false);
				x.set(0);
			}}
		>
			<AnimatePresence>
				{hovered && (
					<motion.div
						initial={{ opacity: 0, y: 20, scale: 0.6 }}
						animate={{
							opacity: 1,
							y: 0,
							scale: 1,
							transition: {
								type: "spring",
								stiffness: 260,
								damping: 10,
							},
						}}
						exit={{ opacity: 0, y: 20, scale: 0.6 }}
						style={{
							translateX,
							rotate,
							whiteSpace: "nowrap",
						}}
						className="absolute -top-16 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center justify-center rounded-md bg-primary px-4 py-2 text-xs shadow-xl"
					>
						<div className="absolute inset-x-10 -bottom-px z-30 h-px w-[20%] bg-gradient-to-r from-transparent via-primary to-transparent" />
						<div className="absolute -bottom-px left-10 z-30 h-px w-[40%] bg-gradient-to-r from-transparent via-secondary to-transparent" />
						<div className="relative z-30 text-base font-bold text-white">
							{item.name}
						</div>
						<div className="text-xs text-white">{item.designation}</div>
					</motion.div>
				)}
			</AnimatePresence>

			{item.image ? (
				<img
					onMouseMove={handleMouseMove}
					height={100}
					width={100}
					src={item.image}
					alt={item.name}
					className="relative !m-0 h-10 w-10 shrink-0 rounded-full border-2 border-white object-cover object-top !p-0 transition duration-500 group-hover:z-30 group-hover:scale-105"
				/>
			) : (
				<div
					onMouseMove={handleMouseMove}
					className="relative !m-0 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-primary/20 to-secondary/20 transition duration-500 group-hover:z-30 group-hover:scale-105"
				>
					<Users className="h-4 w-4 text-muted-foreground/50" />
				</div>
			)}
		</div>
	);
}

export function AnimatedTooltip({ items }: { readonly items: TooltipItem[] }) {
	return (
		<>
			{items.map((item) => (
				<TooltipAvatar key={item.id} item={item} />
			))}
		</>
	);
}
