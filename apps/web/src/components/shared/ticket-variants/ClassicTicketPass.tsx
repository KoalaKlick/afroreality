"use client";
// src/components/shared/ticket-variants/ClassicTicketPass.tsx

import { QrCode } from "lucide-react";
import { useId, useState } from "react";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { generateColorShades } from "@/lib/utils/color-generator";
import type { TicketVariantProps } from "./types";

interface ClassicTicketProps extends TicketVariantProps {
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

function StubDash({
	side,
	borderColor,
}: {
	side: "left" | "right";
	borderColor: string;
}) {
	const dashBorder = side === "left" ? "border-r" : "border-l";
	return (
		<div
			className={`absolute top-3 bottom-3 ${dashBorder} border-dashed`}
			style={{
				borderColor: borderColor,
				[side === "left" ? "right" : "left"]: 0,
			}}
		/>
	);
}

function Stub({
	side,
	primaryColor,
	backgroundColor,
	borderColor,
	label,
}: {
	side: "left" | "right";
	primaryColor: string;
	backgroundColor: string;
	borderColor: string;
	label: string;
}) {
	const radius = side === "left" ? "rounded-l-xl" : "rounded-r-xl";

	return (
		<div
			className={`w-[72px] shrink-0 flex items-center justify-center relative ${radius}`}
			style={{ background: backgroundColor }}
		>
			<StubDash side={side} borderColor={borderColor} />
			<span
				className="text-[10px] font-black tracking-[0.22em] uppercase opacity-70"
				style={{
					fontFamily: "'Courier New', monospace",
					color: primaryColor,
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
	backgroundColor,
	outlineColor,
	clipId,
	children,
}: {
	backgroundColor: string;
	outlineColor: string;
	clipId: string;
	children: React.ReactNode;
}) {
	return (
		<div
			className="flex flex-row bg-background items-stretch w-full h-full relative"
			style={{
				clipPath: `url(#${clipId})`,
				backgroundImage: `linear-gradient(${backgroundColor}, ${backgroundColor}), repeating-linear-gradient(0deg, transparent, transparent 23px, rgba(0,0,0,0.025) 24px)`,
			}}
		>
			<TicketOutline color={outlineColor} />
			{children}
		</div>
	);
}

/** Ghost ticket for the stacked deck effect — clipped the same way */
function GhostTicket({
	backgroundColor,
	outlineColor,
	stubColor,
	clipId,
	translateX = 20,
	translateY = 30,
	rotate = 5,
	zIndex = 0,
}: {
	backgroundColor: string;
	outlineColor: string;
	stubColor: string;
	clipId: string;
	translateX: number;
	translateY: number;
	rotate: number;
	zIndex: number;
}) {
	return (
		<div
			className="absolute inset-0 pointer-events-none rounded-xl"
			style={{
				transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotate}deg)`,
				transformOrigin: "center center",
				zIndex,
				clipPath: `url(#${clipId})`,
				backgroundColor: "#ffffff",
				backgroundImage: `linear-gradient(${backgroundColor}, ${backgroundColor}), repeating-linear-gradient(0deg, transparent, transparent 23px, rgba(0,0,0,0.02) 24px)`,
			}}
		>
			<TicketOutline color={outlineColor} />
			<div
				className="absolute left-0 top-0 bottom-0 w-[72px] rounded-l-xl"
				style={{ background: stubColor }}
			/>
			<div
				className="absolute right-0 top-0 bottom-0 w-[72px] rounded-r-xl"
				style={{ background: stubColor }}
			/>
		</div>
	);
}

const GHOSTS = [
	{ translateX: 24, translateY: 3, rotate: 22, zIndex: 1 },
	{ translateX: 14, translateY: 2, rotate: 13, zIndex: 2 },
	{ translateX: 6, translateY: 1, rotate: 5, zIndex: 3 },
];

export function ClassicTicketPass({
	primaryColor = "#009A44",
	secondaryColor = "#CE1126",
	organizationName = "AfroReality",
	eventName = "Sample Event 2026",
	ticketType = "General Admission",
	dateTime = "18 Mar 2026, 7:00 PM",
	venue = "Convention Center, Accra",
	ticketCode = "XXXX-XXXXXX",
	flierImage,
	className,
	stacked = false,
	exportMode = false,
	exportSide = "both",
	buyerName = "Valued Guest",
}: ClassicTicketProps) {
	const [flipped, setFlipped] = useState(false);

	const primaryShades = generateColorShades(primaryColor);
	const secondaryShades = generateColorShades(secondaryColor);

	const uid = useId().replace(/:/g, "");
	const clipId = `ticket-clip-${uid}`;
	const ghostClipId = `ticket-ghost-clip-${uid}`;

	const heroImageUrl = getEventImageUrl(flierImage);
	const stubLabel = (organizationName || "").slice(0, 10);

	const barWidths = [
		3, 1.5, 1.5, 3, 1.5, 2, 1.5, 3, 1.5, 1.5, 3, 2, 1.5, 3, 1.5, 2, 3, 1.5, 3,
		1.5, 2, 3, 1.5, 1.5, 3, 2, 3, 1.5, 1.5, 3,
	];
	const barHeights = [
		38, 26, 26, 38, 26, 38, 26, 26, 38, 26, 26, 38, 26, 38, 26, 26, 38, 26, 38,
		26, 26, 38, 26, 26, 38, 26, 38, 26, 26, 38,
	];

	const renderFront = () => (
		<TicketShell
			backgroundColor={secondaryShades[50] || "#FDFBF7"}
			outlineColor={primaryShades[200] || "#A7F3D0"}
			clipId={clipId}
		>
			<Stub
				side="left"
				primaryColor={primaryColor}
				backgroundColor={primaryShades[100] || "#D1FAE5"}
				borderColor={primaryShades[200] || "#A7F3D0"}
				label={ticketType}
			/>

			<div className="flex-1 flex items-center gap-3.5 px-5 py-4 overflow-hidden relative">
				{heroImageUrl && (
					<>
						<img
							src={heroImageUrl}
							alt={eventName}
							className="absolute inset-0 size-full object-cover opacity-20"
						/>
						<div
							className="absolute inset-0"
							style={{
								background: `linear-gradient(135deg, ${primaryShades[50] || "#F0FDF4"}, transparent 100%)`,
							}}
						/>
					</>
				)}

				<div className="flex-1 min-w-0 relative z-10">
					<span
						className="block text-xs font-black tracking-[0.22em] uppercase mb-0.5"
						style={{
							fontFamily: "'Courier New', monospace",
							color: primaryColor,
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
									color: primaryColor,
								}}
							>
								Date &amp; Time
							</div>
							<div
								className="text-sm text-[#3d3530]"
								style={{ fontFamily: "Georgia, serif" }}
							>
								{dateTime}
							</div>
						</div>
						<div>
							<div
								className="text-xs font-bold tracking-[0.15em] uppercase"
								style={{
									fontFamily: "'Courier New', monospace",
									color: primaryColor,
								}}
							>
								Venue
							</div>
							<div
								className="text-[11px] text-[#3d3530] truncate"
								style={{ fontFamily: "Georgia, serif" }}
							>
								{venue}
							</div>
						</div>
					</div>
				</div>

				<div
					className="self-stretch w-px shrink-0 relative z-10"
					style={{ background: primaryShades[100] || "#D1FAE5" }}
				/>

				<div className="shrink-0 flex flex-col items-center gap-1 relative z-10">
					<div
						className="text-[9px] font-black tracking-[0.15em] uppercase text-center opacity-60"
						style={{
							fontFamily: "'Courier New', monospace",
							color: primaryColor,
						}}
					>
						Organizer
					</div>
					<div
						className="text-[11px] font-bold text-center"
						style={{
							fontFamily: "Georgia, serif",
							color: primaryShades[700] || "#047857",
						}}
					>
						{organizationName}
					</div>
				</div>
			</div>

			<Stub
				side="right"
				primaryColor={primaryColor}
				backgroundColor={primaryShades[100] || "#D1FAE5"}
				borderColor={primaryShades[200] || "#A7F3D0"}
				label={stubLabel}
			/>
		</TicketShell>
	);

	const renderBack = () => (
		<TicketShell
			backgroundColor={secondaryShades[50] || "#FDFBF7"}
			outlineColor={primaryShades[200] || "#A7F3D0"}
			clipId={clipId}
		>
			<Stub
				side="left"
				primaryColor={primaryColor}
				backgroundColor={primaryShades[100] || "#D1FAE5"}
				borderColor={primaryShades[200] || "#A7F3D0"}
				label={buyerName.slice(0, 12)}
			/>

			<div className="flex-1 flex items-center gap-6 px-6 py-4">
				<div className="flex flex-col items-center gap-1.5 shrink-0">
					<div
						className="size-16 rounded flex items-center justify-center bg-white p-1"
						style={{ backgroundColor: primaryShades[50] || "#F0FDF4" }}
					>
						<QrCode className="size-12" style={{ color: primaryColor }} />
					</div>
					<div
						className="text-[8px] font-black tracking-[0.1em] uppercase opacity-40 text-center"
						style={{
							fontFamily: "'Courier New', monospace",
							color: primaryColor,
						}}
					>
						Scan to verify
					</div>
				</div>

				<div
					className="self-stretch w-px shrink-0"
					style={{ background: primaryShades[100] || "#D1FAE5" }}
				/>

				<div className="flex flex-col items-center gap-2 flex-1">
					<div
						className="text-[9px] font-black tracking-[0.3em] uppercase opacity-50"
						style={{
							fontFamily: "'Courier New', monospace",
							color: primaryColor,
						}}
					>
						Ticket No.
					</div>
					<div
						className="text-xl font-black tracking-[0.15em] opacity-85"
						style={{
							fontFamily: "'Courier New', monospace",
							color: primaryColor,
						}}
					>
						{ticketCode}
					</div>
					<div className="flex items-center gap-0.5">
						{barWidths.map((w, i) => (
							<div
								key={i}
								className="rounded-[1px] opacity-60"
								style={{
									width: w,
									height: barHeights[i],
									background: primaryColor,
								}}
							/>
						))}
					</div>
					<div
						className="text-[8px] opacity-40"
						style={{
							fontFamily: "'Courier New', monospace",
							color: primaryColor,
						}}
					>
						{organizationName}
					</div>
				</div>
			</div>

			<Stub
				side="right"
				primaryColor={primaryColor}
				backgroundColor={primaryShades[100] || "#D1FAE5"}
				borderColor={primaryShades[200] || "#A7F3D0"}
				label={stubLabel}
			/>
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
			className={`cursor-pointer select-none @container ${className ?? ""}`}
			style={{ perspective: 1200 }}
		>
			<TicketClipPath id={clipId} />
			<TicketClipPath id={ghostClipId} />

			<div
				className="relative w-full max-w-[560px] h-[210px]"
				onClick={() => setFlipped((f) => !f)}
			>
				{stacked &&
					GHOSTS.map((g, i) => (
						<GhostTicket
							key={i}
							backgroundColor={secondaryShades[50] || "#FDFBF7"}
							outlineColor={primaryShades[200] || "#A7F3D0"}
							stubColor={primaryShades[50] || "#F0FDF4"}
							clipId={ghostClipId}
							{...g}
						/>
					))}

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
