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
		useTransform(x, [-100, 100], [-30, 30]),
		springConfig,
	);
	const translateX = useSpring(
		useTransform(x, [-100, 100], [-35, 35]),
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

	const designationText = item.designation
		? item.designation.startsWith("#")
			? item.designation
			: `#${item.designation}`
		: "";

	return (
		<div
			className="group relative -mr-2.5 hover:z-50 cursor-pointer"
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => {
				setHovered(false);
				x.set(0);
			}}
		>
			<AnimatePresence>
				{hovered && (
					<motion.div
						initial={{ opacity: 0, y: 10, scale: 0.8 }}
						animate={{
							opacity: 1,
							y: 0,
							scale: 1,
							transition: {
								type: "spring",
								stiffness: 300,
								damping: 18,
							},
						}}
						exit={{ opacity: 0, y: 10, scale: 0.8 }}
						style={{
							translateX,
							rotate,
							whiteSpace: "nowrap",
						}}
						className="absolute -top-14 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center justify-center rounded-xl bg-popover/95 backdrop-blur-md px-3.5 py-1.5 shadow-2xl border border-border pointer-events-none"
					>
						<div className="relative z-30 text-xs font-black uppercase tracking-tight text-popover-foreground">
							{item.name}
						</div>
						{designationText && (
							<div className="text-[10px] font-bold font-mono text-primary">
								{designationText}
							</div>
						)}
					</motion.div>
				)}
			</AnimatePresence>

			{item.image ? (
				<img
					onMouseMove={handleMouseMove}
					src={item.image}
					alt={item.name}
					className="relative !m-0 h-9 w-9 shrink-0 rounded-full border-2 border-background object-cover object-top !p-0 shadow-sm transition duration-300 group-hover:scale-110 group-hover:border-primary"
				/>
			) : (
				<div
					onMouseMove={handleMouseMove}
					className="relative !m-0 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-background bg-muted text-muted-foreground shadow-sm transition duration-300 group-hover:scale-110 group-hover:border-primary"
				>
					<Users className="size-3.5" />
				</div>
			)}
		</div>
	);
}

export function AnimatedTooltip({ items }: { readonly items: TooltipItem[] }) {
	return (
		<div className="flex items-center">
			{items.map((item) => (
				<TooltipAvatar key={item.id} item={item} />
			))}
		</div>
	);
}
