"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";

interface VoteSuccessAnimationProps {
	readonly className?: string;
	readonly size?: "sm" | "md" | "lg";
	readonly showFloatingReactions?: boolean;
	readonly brandVars?: React.CSSProperties;
	readonly primaryColor?: string;
	readonly secondaryColor?: string;
	readonly tertiaryColor?: string;
}

/**
 * Modern Twitter/social-media style Vote Success Animation.
 * Uses official Fextiva brand colors (#009A44 green, #FFD100 gold, #EF3340 red)
 * or the organizer's custom brand colors via CSS variables.
 *
 * Features:
 * 1. Initial Twitter-like pop & spring bounce with expanding ripple ring and radial particle burst.
 * 2. Consistent hovering/floating hero Thumbs-Up SVG with a glowing success aura.
 * 3. Continuous floating reactions (thumbs up, hearts, sparkle stars) that gently drift upward and vanish over time.
 * 4. High-performance GPU-accelerated CSS keyframes (transform & opacity only).
 */
export function VoteSuccessAnimation({
	className,
	size = "md",
	showFloatingReactions = true,
	brandVars,
	primaryColor,
	secondaryColor,
	tertiaryColor,
}: VoteSuccessAnimationProps) {
	const uniqueId = useId().replace(/:/g, "");

	// Extract brand colors: Organizer override -> brandVars -> Fextiva defaults (#009A44, #FFD100, #EF3340)
	const primary =
		primaryColor ||
		(brandVars as any)?.["--color-brand-primary"] ||
		"var(--color-brand-primary, #009A44)";
	const secondary =
		secondaryColor ||
		(brandVars as any)?.["--color-brand-secondary"] ||
		"var(--color-brand-secondary, #FFD100)";
	const tertiary =
		tertiaryColor ||
		(brandVars as any)?.["--color-brand-tertiary"] ||
		"var(--color-brand-tertiary, #EF3340)";

	const sizeConfig = {
		sm: {
			wrapper: "h-24 w-full",
			badge: "size-14",
			icon: "size-7",
			particlesRadius: 36,
		},
		md: {
			wrapper: "h-28 w-full",
			badge: "size-18",
			icon: "size-9",
			particlesRadius: 46,
		},
		lg: {
			wrapper: "h-32 w-full",
			badge: "size-20",
			icon: "size-10",
			particlesRadius: 54,
		},
	}[size];

	// Particle burst in Fextiva / Organizer palette (primary, secondary, tertiary)
	const particles = [
		{ angle: 0, color: primary, delay: 0.05, size: 5 },
		{ angle: 30, color: secondary, delay: 0.1, size: 4 },
		{ angle: 60, color: primary, delay: 0.08, size: 6 },
		{ angle: 90, color: tertiary, delay: 0.12, size: 5 },
		{ angle: 120, color: secondary, delay: 0.06, size: 4 },
		{ angle: 150, color: primary, delay: 0.14, size: 5 },
		{ angle: 180, color: secondary, delay: 0.04, size: 6 },
		{ angle: 210, color: tertiary, delay: 0.11, size: 4 },
		{ angle: 240, color: primary, delay: 0.07, size: 5 },
		{ angle: 270, color: secondary, delay: 0.13, size: 4 },
		{ angle: 300, color: primary, delay: 0.09, size: 5 },
		{ angle: 330, color: tertiary, delay: 0.05, size: 6 },
	];

	// Stream of floating reactions in brand colors that float and vanish by time
	const floatingReactions = [
		{
			id: 1,
			type: "thumb",
			left: "22%",
			delay: "0.1s",
			duration: "2.4s",
			drift: "-14px",
			color: primary,
			size: 20,
		},
		{
			id: 2,
			type: "heart",
			left: "74%",
			delay: "0.35s",
			duration: "2.6s",
			drift: "16px",
			color: tertiary,
			size: 18,
		},
		{
			id: 3,
			type: "thumb",
			left: "38%",
			delay: "0.7s",
			duration: "2.7s",
			drift: "-8px",
			color: primary,
			size: 22,
		},
		{
			id: 4,
			type: "star",
			left: "65%",
			delay: "0.95s",
			duration: "2.5s",
			drift: "12px",
			color: secondary,
			size: 16,
		},
		{
			id: 5,
			type: "heart",
			left: "28%",
			delay: "1.3s",
			duration: "2.8s",
			drift: "-12px",
			color: tertiary,
			size: 17,
		},
		{
			id: 6,
			type: "thumb",
			left: "55%",
			delay: "1.6s",
			duration: "2.6s",
			drift: "10px",
			color: secondary,
			size: 24,
		},
		{
			id: 7,
			type: "star",
			left: "18%",
			delay: "1.9s",
			duration: "2.7s",
			drift: "-10px",
			color: secondary,
			size: 15,
		},
		{
			id: 8,
			type: "thumb",
			left: "80%",
			delay: "2.2s",
			duration: "2.9s",
			drift: "14px",
			color: primary,
			size: 19,
		},
	];

	return (
		<div
			className={cn(
				"relative flex items-center justify-center overflow-visible select-none pointer-events-none",
				sizeConfig.wrapper,
				className
			)}
			style={brandVars}
			aria-hidden="true"
		>
			<style>{`
				@keyframes votePopBounce_${uniqueId} {
					0% {
						transform: scale(0.1) rotate(-16deg);
						opacity: 0;
					}
					45% {
						transform: scale(1.28) rotate(8deg);
						opacity: 1;
					}
					65% {
						transform: scale(0.92) rotate(-3deg);
					}
					82% {
						transform: scale(1.06) rotate(1deg);
					}
					100% {
						transform: scale(1) rotate(0deg);
					}
				}

				@keyframes voteConsistentFloat_${uniqueId} {
					0%, 100% {
						transform: translateY(0px) rotate(0deg);
					}
					50% {
						transform: translateY(-6px) rotate(2deg);
					}
				}

				@keyframes voteRingExpand_${uniqueId} {
					0% {
						transform: scale(0.3);
						opacity: 0.95;
					}
					50% {
						opacity: 0.6;
					}
					100% {
						transform: scale(2.4);
						opacity: 0;
					}
				}

				@keyframes voteAuraPulse_${uniqueId} {
					0%, 100% {
						transform: scale(1);
						opacity: 0.35;
					}
					50% {
						transform: scale(1.2);
						opacity: 0.7;
					}
				}

				@keyframes voteParticleBurst_${uniqueId} {
					0% {
						transform: translate(0, 0) scale(0);
						opacity: 1;
					}
					60% {
						opacity: 1;
						transform: translate(var(--p-dx), var(--p-dy)) scale(1.1);
					}
					100% {
						transform: translate(calc(var(--p-dx) * 1.3), calc(var(--p-dy) * 1.3)) scale(0);
						opacity: 0;
					}
				}

				@keyframes voteFloatAndVanish_${uniqueId} {
					0% {
						transform: translate3d(0, 15px, 0) scale(0.4) rotate(0deg);
						opacity: 0;
					}
					18% {
						transform: translate3d(calc(var(--f-drift) * 0.4), -20px, 0) scale(1.05) rotate(calc(var(--f-drift) * 0.4));
						opacity: 0.95;
					}
					55% {
						transform: translate3d(var(--f-drift), -55px, 0) scale(1) rotate(calc(var(--f-drift) * 0.7));
						opacity: 0.85;
					}
					85% {
						transform: translate3d(calc(var(--f-drift) * 1.2), -90px, 0) scale(0.9) rotate(var(--f-drift));
						opacity: 0.4;
					}
					100% {
						transform: translate3d(calc(var(--f-drift) * 1.4), -115px, 0) scale(0.7) rotate(var(--f-drift));
						opacity: 0;
					}
				}
			`}</style>

			{/* ── 1. Floating Reactions Stream (Fextiva & Organizer Brand Colors) ── */}
			{showFloatingReactions && (
				<div className="absolute inset-x-0 bottom-0 top-0 overflow-visible pointer-events-none">
					{floatingReactions.map((item) => (
						<div
							key={item.id}
							className="absolute bottom-2 will-change-transform"
							style={
								{
									left: item.left,
									"--f-drift": item.drift,
									animation: `voteFloatAndVanish_${uniqueId} ${item.duration} cubic-bezier(0.22, 1, 0.36, 1) infinite`,
									animationDelay: item.delay,
								} as React.CSSProperties
							}
						>
							<div
								className="drop-shadow-md transition-transform"
								style={{ color: item.color }}
							>
								{item.type === "thumb" && (
									<ThumbsUpSvg size={item.size} fill={item.color} />
								)}
								{item.type === "heart" && (
									<HeartSvg size={item.size} fill={item.color} />
								)}
								{item.type === "star" && (
									<StarSparkleSvg size={item.size} fill={item.color} />
								)}
							</div>
						</div>
					))}
				</div>
			)}

			{/* ── 2. Twitter-Style Expanding Ripple Ring in Brand Primary ── */}
			<div
				className="absolute rounded-full border-2 pointer-events-none"
				style={{
					width: sizeConfig.particlesRadius * 1.3,
					height: sizeConfig.particlesRadius * 1.3,
					borderColor: primary,
					animation: `voteRingExpand_${uniqueId} 0.85s cubic-bezier(0.1, 0.8, 0.25, 1) forwards`,
				}}
			/>

			{/* ── 3. Radial Particle Burst (Brand colors) ── */}
			<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
				{particles.map((p, i) => {
					const rad = (p.angle * Math.PI) / 180;
					const dx = Math.round(Math.cos(rad) * sizeConfig.particlesRadius);
					const dy = Math.round(Math.sin(rad) * sizeConfig.particlesRadius);

					return (
						<span
							key={i}
							className="absolute rounded-full will-change-transform"
							style={
								{
									width: p.size,
									height: p.size,
									backgroundColor: p.color,
									boxShadow: `0 0 8px ${p.color}`,
									"--p-dx": `${dx}px`,
									"--p-dy": `${dy}px`,
									animation: `voteParticleBurst_${uniqueId} 0.75s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
									animationDelay: `${p.delay}s`,
								} as React.CSSProperties
							}
						/>
					);
				})}
			</div>

			{/* ── 4. Floating & Consistent Hero Thumbs-Up Container ── */}
			<div
				className="relative z-10 flex items-center justify-center will-change-transform"
				style={{
					animation: `voteConsistentFloat_${uniqueId} 3s ease-in-out infinite 0.65s`,
				}}
			>
				{/* Success Glow Aura in Brand Primary */}
				<div
					className="absolute -inset-2 rounded-full blur-md"
					style={{
						backgroundColor: "color-mix(in srgb, var(--color-brand-primary, #009A44) 30%, transparent)",
						animation: `voteAuraPulse_${uniqueId} 2.5s ease-in-out infinite`,
					}}
				/>

				{/* Hero Badge with Elastic Pop in Solid Brand Color */}
				<div
					className={cn(
						"relative rounded-full flex items-center justify-center shadow-lg border border-white/20",
						"text-white will-change-transform",
						sizeConfig.badge
					)}
					style={{
						backgroundColor: primary,
						boxShadow: `0 10px 25px -4px color-mix(in srgb, ${primary} 40%, transparent)`,
						animation: `votePopBounce_${uniqueId} 0.65s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards`,
					}}
				>
					{/* Hero Thumbs-Up SVG Icon */}
					<div className={cn("text-white drop-shadow-xs", sizeConfig.icon)}>
						<ThumbsUpHeroSvg className="size-full fill-current" />
					</div>
				</div>
			</div>
		</div>
	);
}

/**
 * High-craft SVG Thumbs-Up Hero with polished curves,
 * inner definition, and wrist/cuff detailing.
 */
function ThumbsUpHeroSvg({ className }: { readonly className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
		>
			{/* Cuff / Base */}
			<rect
				x="2"
				y="10.5"
				width="4"
				height="11"
				rx="1.75"
				fill="currentColor"
			/>
			{/* Hand, Thumb & Fingers */}
			<path
				d="M7.5 11.2C7.5 10.3 8.1 9.5 9 9.25L11.8 8.35C12.5 8.12 13 7.55 13.25 6.85L13.8 5C14.3 3.35 16.2 2.65 17.5 3.65C18.3 4.25 18.55 5.35 18.2 6.3L16.9 9.5H20.6C21.9 9.5 22.95 10.6 22.8 11.9L21.8 19C21.65 20.15 20.65 21 19.5 21H9.5C8.4 21 7.5 20.1 7.5 19V11.2Z"
				fill="currentColor"
			/>
		</svg>
	);
}

/**
 * Lightweight SVG Thumbs-Up for floating reaction stream.
 */
function ThumbsUpSvg({ size = 20, fill = "currentColor" }: { readonly size?: number; readonly fill?: string }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<rect x="2" y="10" width="4" height="11.5" rx="1.5" fill={fill} opacity="0.85" />
			<path
				d="M7.5 11C7.5 10.2 8.1 9.5 8.9 9.25L11.5 8.35C12.15 8.12 12.6 7.6 12.85 6.95L13.4 5.2C13.85 3.7 15.6 3.05 16.8 3.95C17.5 4.5 17.7 5.5 17.4 6.35L16.2 9.5H19.8C21 9.5 22 10.5 21.85 11.7L20.95 18.8C20.8 19.8 19.9 20.6 18.9 20.6H9.5C8.4 20.6 7.5 19.7 7.5 18.6V11Z"
				fill={fill}
			/>
		</svg>
	);
}

/**
 * Lightweight SVG Heart for floating reaction stream.
 */
function HeartSvg({ size = 18, fill = "currentColor" }: { readonly size?: number; readonly fill?: string }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"
				fill={fill}
			/>
		</svg>
	);
}

/**
 * Lightweight SVG Star Sparkle for celebration burst.
 */
function StarSparkleSvg({ size = 16, fill = "currentColor" }: { readonly size?: number; readonly fill?: string }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M12 2L14.2 9.2L22 12L14.2 14.8L12 22L9.8 14.8L2 12L9.8 9.2L12 2Z"
				fill={fill}
			/>
		</svg>
	);
}
