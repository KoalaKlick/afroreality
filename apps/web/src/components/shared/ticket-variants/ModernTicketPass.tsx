"use client";
// src/components/shared/ticket-variants/ModernTicketPass.tsx

import { QrCode } from "lucide-react";
import { useId, useState } from "react";
import { getEventImageUrl, getOrgImageUrl } from "@/lib/image-url-utils";
import { generateColorShades } from "@/lib/utils/color-generator";
import type { TicketVariantProps } from "./types";

interface ModernTicketProps extends TicketVariantProps {
	readonly tertiaryColor?: string;
	readonly logoUrl?: string | null;
	readonly flierImage?: string | null;
	readonly bannerImage?: string | null;
	readonly qrPayload?: string;
	readonly stacked?: boolean;
	readonly exportMode?: boolean;
	readonly exportSide?: "front" | "back" | "both";
	readonly buyerName?: string;
}

const TICKET_PATH_RELATIVE = [
	`M ${12 / 560} 0`,
	`L ${(72 - 12) / 560} 0 A ${12 / 560} ${12 / 210} 0 0 0 ${(72 + 12) / 560} 0`,
	`L ${(560 - 72 - 12) / 560} 0 A ${12 / 560} ${12 / 210} 0 0 0 ${(560 - 72 + 12) / 560} 0`,
	`L ${(560 - 12) / 560} 0`,
	`Q 1 0 1 ${12 / 210}`,
	`L 1 ${(105 - 12) / 210} A ${12 / 560} ${12 / 210} 0 0 0 1 ${(105 + 12) / 210}`,
	`L 1 ${(210 - 12) / 210}`,
	`Q 1 1 ${(560 - 12) / 560} 1`,
	`L ${(560 - 72 + 12) / 560} 1 A ${12 / 560} ${12 / 210} 0 0 0 ${(560 - 72 - 12) / 560} 1`,
	`L ${(72 + 12) / 560} 1 A ${12 / 560} ${12 / 210} 0 0 0 ${(72 - 12) / 560} 1`,
	`L ${12 / 560} 1`,
	`Q 0 1 0 ${(210 - 12) / 210}`,
	`L 0 ${(105 + 12) / 210} A ${12 / 560} ${12 / 210} 0 0 0 0 ${(105 - 12) / 210}`,
	`L 0 ${12 / 210}`,
	`Q 0 0 ${12 / 560} 0`,
	`Z`,
].join(" ");

function TicketClipPath({ id }: { id: string }) {
	return (
		<svg
			style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
			aria-hidden="true"
		>
			<defs>
				<clipPath id={id} clipPathUnits="objectBoundingBox">
					<path d={TICKET_PATH_RELATIVE} />
				</clipPath>
			</defs>
		</svg>
	);
}

function TicketOutline({ color }: { color: string }) {
	return (
		<svg
			className="absolute inset-0 w-full h-full pointer-events-none z-20"
			viewBox="0 0 1 1"
			preserveAspectRatio="none"
		>
			<path
				d={TICKET_PATH_RELATIVE}
				fill="none"
				stroke={color}
				strokeWidth="1.5"
				vectorEffect="non-scaling-stroke"
			/>
		</svg>
	);
}

function DiagonalAccent({ color }: { color: string }) {
	return (
		<svg
			className="absolute inset-0 w-full h-full pointer-events-none opacity-40 z-10"
			viewBox="0 0 560 210"
			preserveAspectRatio="none"
		>
			<line
				x1="180"
				y1="0"
				x2="180"
				y2="210"
				stroke={color}
				strokeWidth="1"
				strokeDasharray="4 4"
			/>
		</svg>
	);
}

function Lozenge({ color }: { color: string }) {
	return (
		<span
			className="inline-block size-1.5 rotate-45 shrink-0"
			style={{ background: color }}
		/>
	);
}

function HRule({ color }: { color: string }) {
	return (
		<div className="flex items-center gap-1 w-full opacity-30">
			<Lozenge color={color} />
			<div className="flex-1 h-px" style={{ background: color }} />
			<Lozenge color={color} />
		</div>
	);
}

export function ModernTicketPass({
	primaryColor = "#1877F2",
	secondaryColor = "#7C3AED",
	organizationName = "fextiva",
	eventName = "Sample Event 2026",
	ticketType = "VIP Pass",
	dateTime = "18 Mar 2026, 7:00 PM",
	venue = "Convention Center, Accra",
	ticketCode = "XXXX-XXXXXX",
	flierImage,
	logoUrl,
	className,
	exportMode = false,
	exportSide = "both",
	buyerName = "Valued Guest",
}: ModernTicketProps) {
	const [flipped, setFlipped] = useState(false);

	const primaryShades = generateColorShades(primaryColor);
	const secondaryShades = generateColorShades(secondaryColor);

	const uid = useId().replace(/:/g, "");
	const clipId = `ticket-modern-clip-${uid}`;

	const logoDisplayUrl = getOrgImageUrl(logoUrl);
	const heroImageUrl = getEventImageUrl(flierImage);

	const renderFront = () => (
		<div
			className="absolute inset-0 flex flex-row"
			style={{
				clipPath: `url(#${clipId})`,
				backgroundColor: "#0d0d0d",
				backgroundImage: `
					radial-gradient(ellipse at 80% 50%, ${secondaryShades[900] || "#3b0764"} 0%, transparent 60%),
					repeating-linear-gradient(
						90deg,
						transparent,
						transparent 39px,
						rgba(255,255,255,0.018) 40px
					)
				`,
			}}
		>
			<TicketOutline color={primaryShades[700] || "#1d4ed8"} />
			<DiagonalAccent color={primaryColor} />

			{/* Left: Photo / Hero Panel */}
			<div className="relative shrink-0 overflow-hidden w-[180px]">
				{heroImageUrl ? (
					<>
						<img
							src={heroImageUrl}
							alt={eventName}
							className="absolute inset-0 size-full object-cover"
						/>
						<div
							className="absolute inset-0"
							style={{
								background:
									"linear-gradient(to right, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.1) 100%)",
							}}
						/>
					</>
				) : (
					<div
						className="absolute inset-0"
						style={{
							background: `linear-gradient(135deg, ${primaryShades[900] || "#1e3a8a"} 0%, ${secondaryShades[950] || "#2e1065"} 100%)`,
						}}
					/>
				)}

				<div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5">
					{logoDisplayUrl && (
						<div className="relative size-5 rounded-xs overflow-hidden shrink-0 ring-1 ring-white/20">
							<img
								src={logoDisplayUrl}
								alt={organizationName}
								className="size-full object-cover"
							/>
						</div>
					)}
					<span
						className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/70 truncate max-w-[120px]"
						style={{ fontFamily: "'Courier New', monospace" }}
					>
						{organizationName}
					</span>
				</div>

				<div className="absolute top-3 left-3 z-10">
					<span
						className="text-[8px] font-black uppercase tracking-[0.25em] px-2 py-0.5 rounded-xs"
						style={{
							background: primaryColor,
							color: "#0d0d0d",
							fontFamily: "'Courier New', monospace",
						}}
					>
						{ticketType}
					</span>
				</div>
			</div>

			{/* Right: Info Panel */}
			<div className="flex-1 flex flex-col justify-between px-5 py-4 min-w-0 relative z-10">
				<div>
					<div
						className="text-[10px] font-black tracking-[0.35em] uppercase mb-1.5"
						style={{
							fontFamily: "'Courier New', monospace",
							color: primaryShades[200] || "#bfdbfe",
						}}
					>
						Event
					</div>
					<HRule color={primaryShades[400] || "#60a5fa"} />
					<div
						className="mt-2 font-bold uppercase leading-tight tracking-wide text-white text-base truncate"
						style={{
							fontFamily: "'Georgia', serif",
							textShadow: `0 0 40px ${primaryShades[500] || "#3b82f6"}`,
						}}
					>
						{eventName}
					</div>
				</div>

				<div className="space-y-2 mt-auto">
					<div className="flex gap-4">
						<div className="min-w-0">
							<div
								className="text-[8px] font-black tracking-[0.25em] uppercase mb-0.5"
								style={{
									fontFamily: "'Courier New', monospace",
									color: primaryShades[400] || "#60a5fa",
								}}
							>
								Date &amp; Time
							</div>
							<div
								className="text-xs font-medium"
								style={{
									fontFamily: "'Georgia', serif",
									color: primaryShades[100] || "#dbeafe",
								}}
							>
								{dateTime}
							</div>
						</div>
						<div className="min-w-0">
							<div
								className="text-[8px] font-black tracking-[0.25em] uppercase mb-0.5"
								style={{
									fontFamily: "'Courier New', monospace",
									color: primaryShades[400] || "#60a5fa",
								}}
							>
								Venue
							</div>
							<div
								className="text-xs font-medium truncate"
								style={{
									fontFamily: "'Georgia', serif",
									color: primaryShades[100] || "#dbeafe",
								}}
							>
								{venue}
							</div>
						</div>
					</div>
					<HRule color={primaryShades[400] || "#60a5fa"} />
				</div>
			</div>
		</div>
	);

	const renderBack = () => (
		<div
			className="absolute inset-0 flex flex-row p-6"
			style={{
				clipPath: `url(#${clipId})`,
				backgroundColor: "#0d0d0d",
				backgroundImage: `radial-gradient(circle at 50% 50%, ${secondaryShades[900] || "#3b0764"} 0%, #0d0d0d 80%)`,
			}}
		>
			<TicketOutline color={primaryShades[700] || "#1d4ed8"} />
			<div className="size-full flex items-center justify-between gap-6 z-10">
				<div className="flex flex-col items-center gap-2">
					<div className="size-20 bg-white p-2 rounded flex items-center justify-center">
						<QrCode className="size-16 text-slate-950" />
					</div>
					<span
						className="text-[8px] font-black uppercase tracking-[0.2em] text-white/50"
						style={{ fontFamily: "'Courier New', monospace" }}
					>
						AUTHENTICATED PASS
					</span>
				</div>
				<div className="flex-1 space-y-2 text-right">
					<p
						className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40"
						style={{ fontFamily: "'Courier New', monospace" }}
					>
						TICKET CODE
					</p>
					<p
						className="text-lg font-bold font-mono tracking-widest"
						style={{ color: primaryColor }}
					>
						{ticketCode}
					</p>
					<p className="text-xs text-white/60">{buyerName}</p>
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
			className={`cursor-pointer select-none ${className}`}
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
