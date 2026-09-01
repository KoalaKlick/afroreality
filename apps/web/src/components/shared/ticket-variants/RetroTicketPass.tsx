"use client";
// src/components/shared/ticket-variants/RetroTicketPass.tsx

import { QrCode } from "lucide-react";
import { useId, useState } from "react";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { generateColorShades } from "@/lib/utils/color-generator";
import { cn } from "@/lib/utils";
import type { TicketVariantProps } from "./types";

interface RetroTicketProps extends TicketVariantProps {
	readonly logoUrl?: string | null;
	readonly flierImage?: string | null;
	readonly bannerImage?: string | null;
	readonly qrPayload?: string;
	readonly exportMode?: boolean;
	readonly exportSide?: "front" | "back" | "both";
	readonly buyerName?: string;
	readonly stacked?: boolean;
}

const RETRO_PATH =
	"M 0,0.1 C 0,0.05 0.05,0 0.1,0 L 0.9,0 C 0.95,0 1,0.05 1,0.1 L 1,0.4 C 0.98,0.4 0.96,0.42 0.96,0.5 C 0.96,0.58 0.98,0.6 1,0.6 L 1,0.9 C 1,0.95 0.95,1 0.9,1 L 0.1,1 C 0.05,1 0,0.95 0,0.9 L 0,0.6 C 0.02,0.6 0.04,0.58 0.04,0.5 C 0.04,0.42 0.02,0.4 0,0.4 Z";

function TicketClipPath({ id }: { id: string }) {
	return (
		<svg
			style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
			aria-hidden="true"
		>
			<defs>
				<clipPath id={id} clipPathUnits="objectBoundingBox">
					<path d={RETRO_PATH} />
				</clipPath>
			</defs>
		</svg>
	);
}

function TicketOutline({ color }: { color: string }) {
	return (
		<svg
			className="absolute inset-0 size-full pointer-events-none z-20"
			viewBox="0 0 1 1"
			preserveAspectRatio="none"
		>
			<path
				d={RETRO_PATH}
				fill="none"
				stroke={color}
				strokeWidth="1.5"
				vectorEffect="non-scaling-stroke"
			/>
		</svg>
	);
}

function DotPattern({ color }: { color: string }) {
	return (
		<div
			className="absolute inset-0 opacity-[0.03] pointer-events-none"
			style={{
				backgroundImage: `radial-gradient(${color} 1px, transparent 1px)`,
				backgroundSize: "12px 12px",
			}}
		/>
	);
}

export function RetroTicketPass({
	primaryColor = "#CE1126",
	secondaryColor = "#009A44",
	organizationName = "fextiva",
	eventName = "Sample Event 2026",
	ticketType = "General Admission",
	dateTime = "18 Mar 2026, 7:00 PM",
	venue = "Convention Center, Accra",
	ticketCode = "XXXX-XXXXXX",
	flierImage,
	className,
	exportMode = false,
	exportSide = "both",
	buyerName = "Valued Guest",
	stacked = false,
}: RetroTicketProps) {
	const uid = useId().replace(/:/g, "");
	const clipId = `ticket-retro-clip-${uid}`;
	const [flipped, setFlipped] = useState(false);
	const primaryShades = generateColorShades(primaryColor);
	const secondaryShades = generateColorShades(secondaryColor);

	const flierDisplayUrl = getEventImageUrl(flierImage);

	const renderFront = () => (
		<div
			className="relative flex h-full overflow-hidden w-full"
			style={{
				clipPath: `url(#${clipId})`,
				backgroundColor: secondaryShades[50] || "#f4f1ea",
				color: "#1a1a1a",
				fontFamily: "'Courier New', Courier, monospace",
			}}
		>
			<DotPattern color={primaryColor} />
			<TicketOutline color={primaryShades[200] || "#fca5a5"} />

			{/* Texture Overlay (Grain) */}
			<div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-black/5" />

			{/* Top Edge Perforation Visual */}
			<div className="absolute top-0 left-0 right-0 h-1 flex justify-around px-4">
				{Array.from({ length: 20 }).map((_, i) => (
					<div
						key={i}
						className="size-1.5 -translate-y-1/2 rounded-full bg-muted/40"
					/>
				))}
			</div>

			{/* Left: Event Visual */}
			<div className="w-1/3 h-full relative border-r-2 border-dashed border-black/10">
				{flierDisplayUrl ? (
					<img
						src={flierDisplayUrl}
						alt="Event"
						className="size-full object-cover grayscale-[0.3] sepia-[0.2]"
					/>
				) : (
					<div className="size-full flex items-center justify-center bg-black/5">
						<span className="text-[10px] font-bold rotate-[-45deg] opacity-20">
							NO IMAGE
						</span>
					</div>
				)}
				<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
				<div className="absolute bottom-3 left-3 right-3 text-white">
					<div className="text-[8px] font-bold tracking-tighter opacity-70">
						ADMIT ONE
					</div>
					<div className="text-[10px] font-bold truncate uppercase">
						{organizationName}
					</div>
				</div>
			</div>

			{/* Center/Right: Details */}
			<div className="flex-1 flex flex-col p-5 relative">
				<div className="absolute top-4 right-4 border-2 border-black/80 px-2 py-0.5 rotate-3 font-black text-xs">
					{ticketType?.toUpperCase()}
				</div>

				<div className="space-y-4">
					<div>
						<div className="text-[10px] font-bold text-muted-foreground mb-0.5">
							EVENT TITLE
						</div>
						<h3
							className="text-xl font-black leading-tight tracking-tight uppercase line-clamp-2"
							style={{ color: primaryColor }}
						>
							{eventName}
						</h3>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<div className="text-[8px] font-bold text-muted-foreground mb-0.5">
								DATE &amp; TIME
							</div>
							<div className="text-[11px] font-bold leading-none">
								{dateTime}
							</div>
						</div>
						<div>
							<div className="text-[8px] font-bold text-muted-foreground mb-0.5">
								VENUE
							</div>
							<div className="text-[11px] font-bold leading-none truncate">
								{venue}
							</div>
						</div>
					</div>
				</div>

				<div className="mt-auto flex items-end justify-between">
					<div>
						<div className="text-[8px] font-bold text-muted-foreground mb-0.5">
							HOLDER
						</div>
						<div className="text-[11px] font-black uppercase">
							{buyerName || "---"}
						</div>
					</div>
					<div className="text-right">
						<div className="text-[8px] font-bold text-muted-foreground mb-0.5">
							TICKET ID
						</div>
						<div className="text-[11px] font-mono tracking-widest">
							{ticketCode}
						</div>
					</div>
				</div>
			</div>

			{/* Perforation Line */}
			<div 
				className="absolute left-[33.33%] top-0 bottom-0 w-[2px]" 
				style={{
					backgroundImage: 'linear-gradient(to bottom, transparent 33%, rgba(0,0,0,0.1) 0%)',
					backgroundPosition: 'left',
					backgroundSize: '1px 12px',
					backgroundRepeat: 'repeat-y'
				}}
			/>
		</div>
	);

	const renderBack = () => (
		<div
			className="relative flex h-full overflow-hidden w-full"
			style={{
				clipPath: `url(#${clipId})`,
				backgroundColor: secondaryShades[100] || "#ece9df",
				color: "#1a1a1a",
				fontFamily: "'Courier New', Courier, monospace",
			}}
		>
			<DotPattern color={primaryColor} />
			<TicketOutline color={primaryShades[200] || "#fca5a5"} />
			<div className="size-full flex items-center justify-center p-6">
				<div className="flex flex-col items-center gap-2">
					<div className="border-4 border-black p-2 bg-white rotate-[-1deg]">
						<QrCode className="size-16 text-slate-900" />
					</div>
					<div className="text-center space-y-1">
						<div className="text-[10px] font-black tracking-[0.2em]">
							VALIDATE AT GATE
						</div>
						<div className="text-[8px] opacity-60 max-w-[200px]">
							DO NOT FOLD OR MUTILATE. VOID IF DETACHED. fextiva OFFICIAL
							DOCUMENT.
						</div>
					</div>
				</div>
			</div>
		</div>
	);

	if (exportMode) {
		return (
			<div className="flex flex-col gap-8 p-0 bg-transparent w-[560px]">
				{(exportSide === "both" || exportSide === "front") && (
					<div className="relative w-[560px] h-[210px] shrink-0 overflow-hidden">
						<TicketClipPath id={clipId} />
						{renderFront()}
					</div>
				)}
				{(exportSide === "both" || exportSide === "back") && (
					<div className="relative w-[560px] h-[210px] shrink-0 overflow-hidden">
						<TicketClipPath id={clipId} />
						{renderBack()}
					</div>
				)}
			</div>
		);
	}

	return (
		<div
			className={cn("cursor-pointer select-none", className)}
			style={{ perspective: 1200 }}
		>
			<TicketClipPath id={clipId} />

			<div
				className="relative w-full max-w-[560px] h-[210px]"
				onClick={() => setFlipped((f) => !f)}
			>
				<div
					className="absolute inset-0 z-10"
					style={{
						transformStyle: "preserve-3d",
						transition: "transform 0.6s cubic-bezier(.4,0,.2,1)",
						transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
					}}
				>
					<div
						className="absolute inset-0"
						style={{
							backfaceVisibility: "hidden",
							WebkitBackfaceVisibility: "hidden",
						}}
					>
						{renderFront()}
					</div>

					<div
						className="absolute inset-0"
						style={{
							backfaceVisibility: "hidden",
							WebkitBackfaceVisibility: "hidden",
							transform: "rotateY(180deg)",
						}}
					>
						{renderBack()}
					</div>
				</div>
			</div>
		</div>
	);
}
