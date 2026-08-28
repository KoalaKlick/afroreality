"use client";
// src/components/shared/ticket-variants/GeoTicketPass.tsx

import { QrCode } from "lucide-react";
import { useId, useState } from "react";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { generateColorShades } from "@/lib/utils/color-generator";
import type { TicketVariantProps } from "./types";

interface GeoTicketProps extends TicketVariantProps {
	readonly logoUrl?: string | null;
	readonly flierImage?: string | null;
	readonly bannerImage?: string | null;
	readonly qrPayload?: string;
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
			className="absolute inset-0 size-full pointer-events-none z-20"
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

function StubDash({ side, color }: { side: "left" | "right"; color: string }) {
	return (
		<div
			className={`absolute top-3 bottom-3 ${side === "left" ? "border-r" : "border-l"} border-dashed`}
			style={{ borderColor: color, [side === "left" ? "right" : "left"]: 0 }}
		/>
	);
}

function Stub({
	side,
	primaryShades,
	label,
}: {
	side: "left" | "right";
	primaryShades: Record<number, string>;
	label: string;
}) {
	const radius = side === "left" ? "rounded-l-xl" : "rounded-r-xl";
	return (
		<div
			className={`w-[72px] shrink-0 flex items-center justify-center relative ${radius} overflow-hidden`}
			style={{ background: primaryShades[700] || "#15803d" }}
		>
			<div
				className="absolute top-0 left-0 size-2.5"
				style={{ background: primaryShades[500] || "#22c55e" }}
			/>
			<div
				className="absolute top-0 right-0 size-2.5"
				style={{ background: primaryShades[500] || "#22c55e" }}
			/>
			<div
				className="absolute bottom-0 left-0 size-2.5"
				style={{ background: primaryShades[500] || "#22c55e" }}
			/>
			<div
				className="absolute bottom-0 right-0 size-2.5"
				style={{ background: primaryShades[500] || "#22c55e" }}
			/>

			<StubDash side={side} color={primaryShades[500] || "#22c55e"} />

			<span
				className="text-[10px] font-black tracking-[0.22em] uppercase relative z-10"
				style={{
					fontFamily: "'Courier New', monospace",
					color: primaryShades[100] || "#dcfce7",
					writingMode: "vertical-rl",
					transform: side === "left" ? "rotate(180deg)" : "none",
					whiteSpace: "nowrap",
				}}
			>
				{label}
			</span>
		</div>
	);
}

function TicketShell({
	primaryShades,
	secondaryShades,
	primaryColor,
	clipId,
	children,
}: {
	primaryShades: Record<number, string>;
	secondaryShades: Record<number, string>;
	primaryColor: string;
	clipId: string;
	children: React.ReactNode;
}) {
	return (
		<div
			className="flex flex-row items-stretch size-full relative"
			style={{
				clipPath: `url(#${clipId})`,
				backgroundColor: secondaryShades[50] || "#f8fafc",
				backgroundImage: `
					repeating-linear-gradient(0deg,  transparent, transparent 23px, ${primaryColor}07 24px),
					repeating-linear-gradient(90deg, transparent, transparent 23px, ${primaryColor}07 24px)
				`,
			}}
		>
			<TicketOutline color={primaryShades[200] || "#bbf7d0"} />
			{children}
		</div>
	);
}

function CornerOrnament({
	corner,
	color,
}: {
	corner: "tl" | "tr" | "bl" | "br";
	color: string;
}) {
	const rotations = { tl: 0, tr: 90, br: 180, bl: 270 };
	const pos: Record<string, React.CSSProperties> = {
		tl: { top: 8, left: 82 },
		tr: { top: 8, right: 82 },
		bl: { bottom: 8, left: 82 },
		br: { bottom: 8, right: 82 },
	};
	return (
		<svg
			width={20}
			height={20}
			viewBox="0 0 24 24"
			className="absolute pointer-events-none z-10 opacity-35"
			style={pos[corner]}
		>
			<g transform={`rotate(${rotations[corner]}, 12, 12)`}>
				{[4, 8, 12].map((r) => (
					<path
						key={r}
						d={`M 0 ${r} A ${r} ${r} 0 0 1 ${r} 0`}
						fill="none"
						stroke={color}
						strokeWidth="1.5"
					/>
				))}
			</g>
		</svg>
	);
}

export function GeoTicketPass({
	primaryColor = "#F97316",
	secondaryColor = "#14B8A6",
	organizationName = "AfroReality",
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
}: GeoTicketProps) {
	const [flipped, setFlipped] = useState(false);

	const primaryShades = generateColorShades(primaryColor);
	const secondaryShades = generateColorShades(secondaryColor);

	const uid = useId().replace(/:/g, "");
	const clipId = `ticket-geo-clip-${uid}`;

	const heroImageUrl = getEventImageUrl(flierImage);
	const stubLabel = (organizationName || "").slice(0, 10);

	const renderFront = () => (
		<TicketShell
			primaryShades={primaryShades}
			secondaryShades={secondaryShades}
			primaryColor={primaryColor}
			clipId={clipId}
		>
			<CornerOrnament corner="tl" color={primaryColor} />
			<CornerOrnament corner="tr" color={primaryColor} />
			<CornerOrnament corner="bl" color={primaryColor} />
			<CornerOrnament corner="br" color={primaryColor} />

			<Stub side="left" primaryShades={primaryShades} label={ticketType} />

			<div className="flex-1 flex items-center gap-3.5 px-5 py-4 overflow-hidden relative">
				{heroImageUrl && (
					<>
						<img
							src={heroImageUrl}
							alt={eventName}
							className="absolute inset-0 size-full object-cover opacity-25"
						/>
						<div
							className="absolute inset-0"
							style={{
								background: `linear-gradient(135deg, ${secondaryShades[50] || "#f0fdf4"} 20%, transparent 100%)`,
							}}
						/>
					</>
				)}

				<div className="flex-1 min-w-0 relative z-10">
					<span
						className="block text-xs font-black tracking-[0.22em] uppercase mb-0.5"
						style={{
							fontFamily: "'Courier New', monospace",
							color: primaryShades[700] || "#c2410c",
						}}
					>
						{ticketType}
					</span>
					<div className="text-base uppercase font-bold truncate leading-tight font-sans">
						{eventName}
					</div>
					<div className="flex flex-col gap-1 mt-1.5">
						<div>
							<div
								className="text-xs font-bold tracking-[0.15em] uppercase"
								style={{
									fontFamily: "'Courier New', monospace",
									color: primaryShades[700] || "#c2410c",
								}}
							>
								Date &amp; Time
							</div>
							<div className="text-sm font-medium">{dateTime}</div>
						</div>
						<div>
							<div
								className="text-xs font-bold tracking-[0.15em] uppercase"
								style={{
									fontFamily: "'Courier New', monospace",
									color: primaryShades[700] || "#c2410c",
								}}
							>
								Venue
							</div>
							<div className="text-[11px] font-medium truncate">{venue}</div>
						</div>
					</div>
				</div>
			</div>

			<Stub side="right" primaryShades={primaryShades} label={stubLabel} />
		</TicketShell>
	);

	const renderBack = () => (
		<TicketShell
			primaryShades={primaryShades}
			secondaryShades={secondaryShades}
			primaryColor={primaryColor}
			clipId={clipId}
		>
			<Stub side="left" primaryShades={primaryShades} label={buyerName} />

			<div className="flex-1 flex items-center justify-between gap-6 px-6 py-4 relative z-10">
				<div className="flex flex-col items-center gap-1.5">
					<div className="size-16 bg-white p-1 rounded border flex items-center justify-center">
						<QrCode className="size-12" style={{ color: primaryColor }} />
					</div>
					<span
						className="text-[8px] font-black uppercase tracking-widest text-muted-foreground"
						style={{ fontFamily: "'Courier New', monospace" }}
					>
						VALIDATE PASS
					</span>
				</div>
				<div className="flex-1 text-right space-y-1">
					<p
						className="text-[9px] font-black uppercase tracking-widest"
						style={{
							fontFamily: "'Courier New', monospace",
							color: primaryShades[700] || "#c2410c",
						}}
					>
						TICKET CODE
					</p>
					<p className="text-lg font-black font-mono tracking-widest">
						{ticketCode}
					</p>
					<p className="text-xs text-muted-foreground">{organizationName}</p>
				</div>
			</div>

			<Stub side="right" primaryShades={primaryShades} label={stubLabel} />
		</TicketShell>
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
