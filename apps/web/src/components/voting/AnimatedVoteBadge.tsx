"use client";

import React, { useEffect, useState, useRef } from "react";
import { BarChart2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedVoteBadgeProps {
	readonly currentVotes: number;
	readonly totalVotes: number;
	readonly displayType?: "count" | "percentage";
	readonly isRecentlyVoted?: boolean;
	readonly addedVotes?: number;
	readonly className?: string;
}

/**
 * Animated Vote Standing Badge with smooth number interpolation
 * and an upward-floating "+N" vote gain badge when a vote is confirmed.
 */
export function AnimatedVoteBadge({
	currentVotes,
	totalVotes,
	displayType = "count",
	isRecentlyVoted = false,
	addedVotes = 0,
	className,
}: AnimatedVoteBadgeProps) {
	// Effective target count and total
	const targetCount = currentVotes + (isRecentlyVoted ? addedVotes : 0);
	const targetTotal = totalVotes + (isRecentlyVoted ? addedVotes : 0);
	const targetPct = targetTotal > 0 ? (targetCount / targetTotal) * 100 : 0;

	// Number to display (interpolated smoothly)
	const [displayedNum, setDisplayedNum] = useState<number>(() =>
		isRecentlyVoted ? currentVotes : targetCount
	);
	const animRef = useRef<number | null>(null);

	useEffect(() => {
		if (!isRecentlyVoted || addedVotes <= 0) {
			setDisplayedNum(displayType === "count" ? targetCount : targetPct);
			return;
		}

		const startVal = displayType === "count" ? currentVotes : (totalVotes > 0 ? (currentVotes / totalVotes) * 100 : 0);
		const endVal = displayType === "count" ? targetCount : targetPct;
		const duration = 900; // ms
		const startTime = performance.now();

		function easeOutCubic(t: number): number {
			return 1 - Math.pow(1 - t, 3);
		}

		function step(now: number) {
			const elapsed = now - startTime;
			const progress = Math.min(elapsed / duration, 1);
			const eased = easeOutCubic(progress);
			const current = startVal + (endVal - startVal) * eased;

			setDisplayedNum(current);

			if (progress < 1) {
				animRef.current = requestAnimationFrame(step);
			} else {
				setDisplayedNum(endVal);
			}
		}

		animRef.current = requestAnimationFrame(step);

		return () => {
			if (animRef.current) cancelAnimationFrame(animRef.current);
		};
	}, [isRecentlyVoted, currentVotes, totalVotes, targetCount, targetPct, addedVotes, displayType]);

	const formattedValue =
		displayType === "count"
			? `${Math.round(displayedNum).toLocaleString()} votes`
			: `${displayedNum.toFixed(1)}%`;

	return (
		<div
			className={cn(
				"relative inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold transition-all duration-500",
				"bg-background/95 backdrop-blur-md border shadow-xs text-foreground",
				isRecentlyVoted
					? "border-primary ring-2 ring-primary/40 shadow-md shadow-primary/20 scale-105"
					: "border-border/70",
				className
			)}
		>
			<style>{`
				@keyframes voteFloatingGain {
					0% {
						transform: translate3d(0, 4px, 0) scale(0.7);
						opacity: 0;
					}
					25% {
						transform: translate3d(0, -6px, 0) scale(1.08);
						opacity: 1;
					}
					70% {
						transform: translate3d(0, -14px, 0) scale(1);
						opacity: 0.9;
					}
					100% {
						transform: translate3d(0, -22px, 0) scale(0.85);
						opacity: 0;
					}
				}
			`}</style>

			<BarChart2
				className={cn(
					"size-3 transition-colors duration-300",
					isRecentlyVoted ? "text-primary animate-pulse" : "text-primary"
				)}
			/>

			<span className="font-mono tabular-nums tracking-tight">
				{formattedValue}
			</span>

			{/* Floating "+N" / "+N%" pill when vote is confirmed */}
			{isRecentlyVoted && addedVotes > 0 && (
				<span
					className="absolute -top-1 right-0 pointer-events-none z-30 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-black text-white shadow-md will-change-transform"
					style={{
						backgroundColor: "var(--color-brand-primary, #009A44)",
						animation: "voteFloatingGain 2.4s cubic-bezier(0.2, 0.9, 0.3, 1) forwards",
					}}
				>
					<TrendingUp className="size-2.5 stroke-[3]" />
					+{addedVotes}
				</span>
			)}
		</div>
	);
}
