"use client";

import { useId, useMemo, useRef, useState, useEffect } from "react";
import Image from "next/image";
import QRCode from "react-qr-code";
import { QrCode, Calendar, MapPin, User, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { getOrgImageUrl, getEventImageUrl } from "@/lib/image-url-utils";
import { generateColorShades } from "@/utils/theme/color-generator";

export interface PortraitReceiptTicketProps {
	readonly variant?: string | null;
	readonly primaryColor?: string;
	readonly secondaryColor?: string;
	readonly logoUrl?: string | null;
	readonly flierImage?: string | null;
	readonly bannerImage?: string | null;
	readonly organizationName?: string;
	readonly eventName?: string;
	readonly ticketType?: string;
	readonly dateTime?: string;
	readonly venue?: string;
	readonly ticketCode?: string;
	readonly qrPayload?: string;
	readonly buyerName?: string;
	readonly orderNumber?: string;
	readonly className?: string;
}

interface TicketDimensions {
	w: number;
	h: number;
	y1: number;
	y2: number;
}

/**
 * Builds the ticket silhouette SVG clip path in normalized [0, 1] coordinates.
 * Side notches are placed PRECISELY at y1 and y2 (the two cutting lines).
 */
function buildTicketClipPath(
	variant: string,
	dim: TicketDimensions,
	hasSawtooth: boolean,
): string {
	const { w, h, y1, y2 } = dim;
	const isGeo = variant === "geo" || variant === "geometric";

	const y1n = Math.max(0.08, Math.min(0.48, y1 / h));
	const y2n = Math.max(0.55, Math.min(0.96, y2 / h));

	if (isGeo) {
		const crx = 14 / w;
		const cry = 14 / h;
		const nrx = 12 / w;
		const nry = 12 / h;

		return [
			`M ${crx} 0`,
			`L ${1 - crx} 0`,
			`L 1 ${cry}`,
			`L 1 ${y1n - nry}`,
			`L ${1 - nrx} ${y1n}`,
			`L 1 ${y1n + nry}`,
			`L 1 ${y2n - nry}`,
			`L ${1 - nrx} ${y2n}`,
			`L 1 ${y2n + nry}`,
			`L 1 ${1 - cry}`,
			`L ${1 - crx} 1`,
			`L ${crx} 1`,
			`L 0 ${1 - cry}`,
			`L 0 ${y2n + nry}`,
			`L ${nrx} ${y2n}`,
			`L 0 ${y2n - nry}`,
			`L 0 ${y1n + nry}`,
			`L ${nrx} ${y1n}`,
			`L 0 ${y1n - nry}`,
			`L 0 ${cry}`,
			`Z`,
		].join(" ");
	}

	const cornerR = hasSawtooth ? 0 : 16;
	const notchR = 12;

	const crx = cornerR / w;
	const cry = cornerR / h;
	const nrx = notchR / w;
	const nry = notchR / h;

	if (hasSawtooth) {
		const numTeeth = 20;
		const toothW = 1 / numTeeth;
		// 9px tooth height in normalized units
		const toothH = Math.max(0.008, Math.min(0.025, 9 / h));

		// Top edge with sawtooth teeth: peaks at y = 0, valleys at y = toothH
		const topCommands: string[] = [`M 0 ${toothH.toFixed(5)}`];
		for (let i = 0; i < numTeeth; i++) {
			const peakX = ((i + 0.5) * toothW).toFixed(5);
			const valleyX = ((i + 1) * toothW).toFixed(5);
			topCommands.push(`L ${peakX} 0 L ${valleyX} ${toothH.toFixed(5)}`);
		}

		// Bottom edge with sawtooth teeth: peaks at y = 1, valleys at y = 1 - toothH
		const bottomCommands: string[] = [];
		for (let i = numTeeth - 1; i >= 0; i--) {
			const peakX = ((i + 0.5) * toothW).toFixed(5);
			const valleyX = (i * toothW).toFixed(5);
			bottomCommands.push(`L ${peakX} 1 L ${valleyX} ${(1 - toothH).toFixed(5)}`);
		}

		return [
			...topCommands,
			`L 1 ${(y1n - nry).toFixed(5)}`,
			`A ${nrx.toFixed(5)} ${nry.toFixed(5)} 0 0 0 1 ${(y1n + nry).toFixed(5)}`,
			`L 1 ${(y2n - nry).toFixed(5)}`,
			`A ${nrx.toFixed(5)} ${nry.toFixed(5)} 0 0 0 1 ${(y2n + nry).toFixed(5)}`,
			`L 1 ${(1 - toothH).toFixed(5)}`,
			...bottomCommands,
			`L 0 ${(y2n + nry).toFixed(5)}`,
			`A ${nrx.toFixed(5)} ${nry.toFixed(5)} 0 0 0 0 ${(y2n - nry).toFixed(5)}`,
			`L 0 ${(y1n + nry).toFixed(5)}`,
			`A ${nrx.toFixed(5)} ${nry.toFixed(5)} 0 0 0 0 ${(y1n - nry).toFixed(5)}`,
			`L 0 ${toothH.toFixed(5)}`,
			`Z`,
		].join(" ");
	}

	return [
		`M ${crx} 0`,
		`L ${1 - crx} 0`,
		`Q 1 0 1 ${cry}`,
		`L 1 ${y1n - nry}`,
		`A ${nrx} ${nry} 0 0 0 1 ${y1n + nry}`,
		`L 1 ${y2n - nry}`,
		`A ${nrx} ${nry} 0 0 0 1 ${y2n + nry}`,
		`L 1 ${1 - cry}`,
		`Q 1 1 ${1 - crx} 1`,
		`L ${crx} 1`,
		`Q 0 1 0 ${1 - cry}`,
		`L 0 ${y2n + nry}`,
		`A ${nrx} ${nry} 0 0 0 0 ${y2n - nry}`,
		`L 0 ${y1n + nry}`,
		`A ${nrx} ${nry} 0 0 0 0 ${y1n - nry}`,
		`L 0 ${cry}`,
		`Q 0 0 ${crx} 0`,
		`Z`,
	].join(" ");
}

function TicketClipPath({ id, path }: { id: string; path: string }) {
	return (
		<svg
			style={{
				position: "absolute",
				width: "1px",
				height: "1px",
				overflow: "hidden",
				opacity: 0,
				pointerEvents: "none",
			}}
			aria-hidden="true"
		>
			<defs>
				<clipPath id={id} clipPathUnits="objectBoundingBox">
					<path d={path} />
				</clipPath>
			</defs>
		</svg>
	);
}

function formatPassDateTime(val?: string) {
	if (!val) return "Date & Time TBA";
	try {
		const d = new Date(val);
		if (!isNaN(d.getTime())) {
			return (
				d.toLocaleDateString("en-US", {
					weekday: "short",
					day: "numeric",
					month: "short",
					year: "numeric",
				}) +
				" · " +
				d.toLocaleTimeString("en-US", {
					hour: "numeric",
					minute: "2-digit",
					hour12: true,
				})
			);
		}
	} catch {}
	return val;
}

export function PortraitReceiptTicket({
	variant = "classic",
	primaryColor = "#CE1126",
	secondaryColor = "#009A44",
	logoUrl,
	flierImage,
	bannerImage,
	organizationName = "Organizer",
	eventName = "Event Name",
	ticketType = "General Admission",
	dateTime = "Date & Time TBA",
	venue = "Venue TBA",
	ticketCode = "TIX-000000",
	qrPayload,
	buyerName = "Valued Guest",
	orderNumber,
	className,
}: PortraitReceiptTicketProps) {
	const clipId = useId().replace(/:/g, "_");
	const logoDisplayUrl = getOrgImageUrl(logoUrl);
	const flierDisplayUrl = getEventImageUrl(flierImage || bannerImage);
	const formattedDate = useMemo(() => formatPassDateTime(dateTime), [dateTime]);

	const normalizedVariant = (variant || "classic").toLowerCase().trim();
	const isRetro =
		normalizedVariant === "retro" ||
		normalizedVariant === "vintage" ||
		normalizedVariant === "roteract";
	const isGeo =
		normalizedVariant === "geo" || normalizedVariant === "geometric";
	const isModern =
		normalizedVariant === "modern" || normalizedVariant === "pass";
	const isReceipt = normalizedVariant === "receipt";
	const isClassic = !isRetro && !isGeo && !isModern && !isReceipt;

	// Classic, Modern, and Receipt all get the zigzag sawtooth ends
	const hasSawtoothEnds = isReceipt || isClassic || isModern;

	// Refs to measure EXACT Y position of the two cutting lines
	const containerRef = useRef<HTMLDivElement>(null);
	const topCutRef = useRef<HTMLDivElement>(null);
	const bottomCutRef = useRef<HTMLDivElement>(null);

	// Default fallback dimensions before measurement
	const [dimensions, setDimensions] = useState<TicketDimensions>({
		w: 360,
		h: 750,
		y1: 240,
		y2: 640,
	});

	// Measure and update exact cutting line Y coordinates
	useEffect(() => {
		const measure = () => {
			const c = containerRef.current;
			const t = topCutRef.current;
			const b = bottomCutRef.current;
			if (!c || !t || !b) return;

			const cRect = c.getBoundingClientRect();
			const tRect = t.getBoundingClientRect();
			const bRect = b.getBoundingClientRect();

			if (cRect.width === 0 || cRect.height === 0) return;

			const y1 = tRect.top + tRect.height / 2 - cRect.top;
			const y2 = bRect.top + bRect.height / 2 - cRect.top;

			setDimensions({
				w: Math.round(cRect.width),
				h: Math.round(cRect.height),
				y1: Math.round(y1),
				y2: Math.round(y2),
			});
		};

		measure();

		const ro = new ResizeObserver(() => {
			measure();
		});

		if (containerRef.current) {
			ro.observe(containerRef.current);
		}

		window.addEventListener("resize", measure);
		return () => {
			ro.disconnect();
			window.removeEventListener("resize", measure);
		};
	}, []);

	// Generate dynamic path with notches centered precisely at the cutting lines
	const activeClipPath = useMemo(() => {
		return buildTicketClipPath(normalizedVariant, dimensions, hasSawtoothEnds);
	}, [normalizedVariant, dimensions, hasSawtoothEnds]);

	return (
		<div
			className={cn(
				"relative w-full max-w-[340px] xs:max-w-[360px] sm:max-w-[390px] mx-auto filter drop-shadow-2xl transition-all select-none print:drop-shadow-none",
				className,
			)}
		>
			{/* SVG Clip Path Definition with exact cutting line notches */}
			<TicketClipPath id={clipId} path={activeClipPath} />



			{/* Main Ticket Body */}
			<div
				ref={containerRef}
				className={cn(
					"text-slate-900 px-6 sm:px-7 pt-4 pb-6 flex flex-col items-center relative overflow-hidden",
					isRetro ? "bg-[#fcfaf7]" : "bg-white",
				)}
				style={{
					clipPath: `url(#${clipId})`,
					WebkitPrintColorAdjust: "exact",
					printColorAdjust: "exact",
				}}
			>
				{/* Top Lanyard Slot for Modern Pass */}
				{isModern && !hasSawtoothEnds ? (
					<div className="w-12 h-1.5 rounded-full bg-slate-900/15 mb-2 -mt-1 mx-auto" />
				) : null}

				{/* Subtle paper texture overlay */}
				<div
					className="absolute inset-0 opacity-[0.025] pointer-events-none print:hidden"
					style={{
						backgroundImage:
							"repeating-linear-gradient(0deg, #000, #000 1px, transparent 1px, transparent 4px)",
					}}
				/>

				{/* ─── Header: Full-bleed Event Flyer Header ─── */}
				{flierDisplayUrl ? (
					<div
						className="relative -mx-6 sm:-mx-7 -mt-4 w-[calc(100%+3rem)] sm:w-[calc(100%+3.5rem)] h-[145px] sm:h-[160px] min-h-[145px] sm:min-h-[160px] flex flex-col justify-between items-center p-2.5 sm:p-3 overflow-hidden"
						style={{
							WebkitPrintColorAdjust: "exact",
							printColorAdjust: "exact",
						}}
					>
						{/* Background Flyer Image */}
						<Image
							src={flierDisplayUrl}
							alt={eventName}
							fill
							priority
							unoptimized
							className="object-cover"
						/>

						{/* Dark Glassy Overlay (No backdrop-blur in print mode so the image is not blanked out in PDF) */}
						<div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] print:backdrop-blur-none print:bg-black/45 pointer-events-none" />

						{/* Glass Sheen Gradient */}
						<div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/60 pointer-events-none print:hidden" />

						{/* Top: Organizer Logo ONLY (No Name) */}
						<div className="relative z-10 flex items-center justify-center pt-1.5 sm:pt-2">
							{logoDisplayUrl ? (
								<div className="relative size-7 sm:size-8 rounded-full overflow-hidden shrink-0 shadow-md">
									<Image
										src={logoDisplayUrl}
										alt={organizationName}
										fill
										unoptimized
										className="object-cover"
									/>
								</div>
							) : null}
						</div>

						{/* Middle: Event Name directly on the glassy background: White text with black border */}
						<div className="relative z-10 my-auto flex flex-col items-center gap-1.5 text-center max-w-[92%] px-2">
							<h2
								className="text-base sm:text-lg font-black uppercase tracking-tight text-center leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
								style={{
									fontFamily: "'Courier New', Courier, monospace",
									color: "#ffffff",
									WebkitTextStroke: "1.5px #000000",
									paintOrder: "stroke fill",
									textShadow: "0 2px 8px rgba(0,0,0,0.9)",
								}}
							>
								{eventName}
							</h2>

							{/* Ticket Type Tag */}
							<div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md print:backdrop-blur-none print:bg-black/60 border border-white/40 text-white shadow-sm">
								<Tag className="size-2.5 text-white/90" />
								<span
									className="text-[9px] font-bold uppercase tracking-wider text-white"
									style={{ fontFamily: "'Courier New', Courier, monospace" }}
								>
									01 × {ticketType}
								</span>
							</div>
						</div>
					</div>
				) : (
					/* Clean Fallback Header when no flyer image is uploaded */
					<div className="w-full flex flex-col items-center pt-1 pb-1">
						{/* Organizer Logo Only */}
						{logoDisplayUrl ? (
							<div className="relative size-8 rounded-full overflow-hidden shrink-0 mb-2">
								<Image
									src={logoDisplayUrl}
									alt={organizationName}
									fill
									className="object-cover"
									unoptimized
								/>
							</div>
						) : null}

						<h2
							className="text-lg sm:text-xl font-black uppercase tracking-tight text-center leading-snug mt-1 mb-2 text-slate-950 px-1"
							style={{ fontFamily: "'Courier New', Courier, monospace" }}
						>
							{eventName}
						</h2>

						<div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 mb-1">
							<Tag className="size-3 text-slate-500" />
							<span
								className="text-[11px] font-bold uppercase tracking-wider text-slate-800"
								style={{ fontFamily: "'Courier New', Courier, monospace" }}
							>
								01 × {ticketType}
							</span>
						</div>
					</div>
				)}

				{/* Cutting Line 1 (Upper Perforation): Dashed line extending edge-to-edge into side notches */}
				<div
					ref={topCutRef}
					className="-mx-6 sm:-mx-7 w-[calc(100%+3rem)] sm:w-[calc(100%+3.5rem)] my-3 border-b border-dashed border-slate-300 relative z-10"
				/>

				{/* Details Table */}
				<div className="w-full space-y-2.5 text-xs px-1">
					{/* Date & Time */}
					<div className="flex items-start justify-between gap-3">
						<div className="flex items-center gap-1.5 text-slate-500 shrink-0 font-medium">
							<Calendar className="size-3.5 text-slate-400" />
							<span
								className="text-[10px] uppercase font-bold tracking-wider"
								style={{ fontFamily: "'Courier New', Courier, monospace" }}
							>
								Date
							</span>
						</div>
						<span
							className="text-[11px] sm:text-xs font-bold text-slate-900 text-right max-w-[220px] leading-snug"
							style={{ fontFamily: "'Courier New', Courier, monospace" }}
						>
							{formattedDate}
						</span>
					</div>

					{/* Venue */}
					<div className="flex items-start justify-between gap-3">
						<div className="flex items-center gap-1.5 text-slate-500 shrink-0 font-medium">
							<MapPin className="size-3.5 text-slate-400" />
							<span
								className="text-[10px] uppercase font-bold tracking-wider"
								style={{ fontFamily: "'Courier New', Courier, monospace" }}
							>
								Venue
							</span>
						</div>
						<span
							className="text-[11px] sm:text-xs font-bold text-slate-900 text-right max-w-[220px] leading-snug"
							style={{ fontFamily: "'Courier New', Courier, monospace" }}
						>
							{venue}
						</span>
					</div>

					{/* Holder Name */}
					<div className="flex items-start justify-between gap-3">
						<div className="flex items-center gap-1.5 text-slate-500 shrink-0 font-medium">
							<User className="size-3.5 text-slate-400" />
							<span
								className="text-[10px] uppercase font-bold tracking-wider"
								style={{ fontFamily: "'Courier New', Courier, monospace" }}
							>
								Holder
							</span>
						</div>
						<span
							className="text-[11px] sm:text-xs font-black text-slate-950 text-right uppercase max-w-[220px] leading-snug"
							style={{ fontFamily: "'Courier New', Courier, monospace" }}
						>
							{buyerName}
						</span>
					</div>

					{/* Order Number */}
					{orderNumber ? (
						<div className="flex items-center justify-between gap-3 pt-0.5">
							<span
								className="text-[10px] uppercase font-bold tracking-wider text-slate-400"
								style={{ fontFamily: "'Courier New', Courier, monospace" }}
							>
								Order
							</span>
							<span
								className="text-[10px] font-mono text-slate-600"
								style={{ fontFamily: "'Courier New', Courier, monospace" }}
							>
								#{orderNumber}
							</span>
						</div>
					) : null}
				</div>

				{/* Subtle separator between Details and QR code */}
				<div className="w-full my-2.5 border-b border-slate-100" />

				{/* BIG Prominent QR Code */}
				<div className="flex flex-col items-center justify-center my-1.5">
					<div className="p-3 sm:p-4 rounded-xl bg-white border-2 border-slate-900/10 shadow-sm flex items-center justify-center">
						<div className="size-44 sm:size-48 flex items-center justify-center">
							{qrPayload ? (
								<QRCode
									value={qrPayload}
									size={512}
									style={{
										height: "100%",
										width: "100%",
										imageRendering: "pixelated",
									}}
									fgColor="#0f172a"
									bgColor="#ffffff"
									level="M"
								/>
							) : (
								<QrCode className="size-full text-slate-300" />
							)}
						</div>
					</div>

					<p
						className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-500 mt-2.5 text-center"
						style={{ fontFamily: "'Courier New', Courier, monospace" }}
					>
						Scan at gate for entry
					</p>
				</div>

				{/* Cutting Line 2 (Lower Perforation): Dashed line extending edge-to-edge into side notches */}
				<div
					ref={bottomCutRef}
					className="-mx-6 sm:-mx-7 w-[calc(100%+3rem)] sm:w-[calc(100%+3.5rem)] my-3 border-b border-dashed border-slate-300 relative z-10"
				/>

				{/* Ticket Code Stub */}
				<div className="w-full flex flex-col items-center gap-1.5 pt-1">
					<span
						className="text-xs sm:text-sm font-black tracking-[0.2em] text-slate-900 font-mono"
						style={{ fontFamily: "'Courier New', Courier, monospace" }}
					>
						{ticketCode}
					</span>

					<p
						className="text-[8px] font-bold tracking-[0.15em] uppercase text-slate-400 text-center mt-0.5"
						style={{ fontFamily: "'Courier New', Courier, monospace" }}
					>
						Single Admission Pass · Keep Private
					</p>
				</div>
			</div>


		</div>
	);
}
