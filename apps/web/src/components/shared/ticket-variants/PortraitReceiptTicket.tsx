"use client";

import { useId, useMemo, useRef, useState, useEffect } from "react";
import Image from "next/image";
import QRCode from "react-qr-code";
import {
	QrCode,
	Calendar,
	MapPin,
	User,
	Tag,
	Navigation,
	ExternalLink,
	Award,
	Globe,
	RotateCw,
	ShieldCheck,
	Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
	getOrgImageUrl,
	getEventImageUrl,
	getSponsorImageUrl,
} from "@/lib/image-url-utils";

export interface TicketSponsorItem {
	readonly id: string;
	readonly name: string;
	readonly logo?: string | null;
}

export interface PortraitReceiptTicketProps {
	readonly variant?: string | null;
	readonly primaryColor?: string;
	readonly secondaryColor?: string;
	readonly logoUrl?: string | null;
	readonly flierImage?: string | null;
	readonly bannerImage?: string | null;
	readonly organizationName?: string;
	readonly organizationWebsite?: string | null;
	readonly eventName?: string;
	readonly ticketType?: string;
	readonly dateTime?: string;
	readonly venue?: string;
	readonly venueName?: string | null;
	readonly venueAddress?: string | null;
	readonly venueCity?: string | null;
	readonly venueCountry?: string | null;
	readonly latitude?: number | null;
	readonly longitude?: number | null;
	readonly isVirtual?: boolean;
	readonly virtualLink?: string | null;
	readonly sponsors?: readonly TicketSponsorItem[];
	readonly ticketCode?: string;
	readonly qrPayload?: string;
	readonly buyerName?: string;
	readonly orderNumber?: string;
	readonly className?: string;
	readonly disableFlip?: boolean;
	readonly defaultFlipped?: boolean;
	readonly flipped?: boolean;
	readonly onFlipChange?: (flipped: boolean) => void;
	readonly exportMode?: boolean;
	readonly exportSide?: "front" | "back" | "both";
}

interface TicketDimensions {
	w: number;
	h: number;
	y1: number;
	y2: number;
}

const BARCODE_BARS = [
	2, 1, 1, 2, 1, 3, 1, 1, 2, 1, 2, 1, 1, 3, 1, 2, 1, 1, 2, 1,
	3, 1, 1, 2, 1, 2, 1, 1, 3, 1, 2, 1, 1, 2, 1, 2, 1, 1, 2, 1,
];

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
		const toothH = Math.max(0.008, Math.min(0.025, 9 / h));

		const topCommands: string[] = [`M 0 ${toothH.toFixed(5)}`];
		for (let i = 0; i < numTeeth; i++) {
			const peakX = ((i + 0.5) * toothW).toFixed(5);
			const valleyX = ((i + 1) * toothW).toFixed(5);
			topCommands.push(`L ${peakX} 0 L ${valleyX} ${toothH.toFixed(5)}`);
		}

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
	venueName,
	venueAddress,
	venueCity,
	venueCountry,
	latitude,
	longitude,
	isVirtual = false,
	virtualLink,
	sponsors = [],
	ticketCode = "TIX-000000",
	qrPayload,
	buyerName = "Valued Guest",
	orderNumber,
	className,
	disableFlip = false,
	defaultFlipped = false,
	flipped: controlledFlipped,
	onFlipChange,
	exportMode = false,
	exportSide = "both",
}: PortraitReceiptTicketProps) {
	const clipId = useId().replace(/:/g, "_");
	const logoDisplayUrl = getOrgImageUrl(logoUrl);
	const flierDisplayUrl = getEventImageUrl(flierImage || bannerImage);
	const formattedDate = useMemo(() => formatPassDateTime(dateTime), [dateTime]);

	const [internalFlipped, setInternalFlipped] = useState(defaultFlipped);
	const isControlled = typeof controlledFlipped === "boolean";
	const isFlipped = isControlled ? controlledFlipped : internalFlipped;

	const handleFlip = () => {
		if (disableFlip || exportMode) return;
		const next = !isFlipped;
		if (!isControlled) {
			setInternalFlipped(next);
		}
		onFlipChange?.(next);
	};

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

	const hasSawtoothEnds = isReceipt || isClassic || isModern;

	const containerRef = useRef<HTMLDivElement>(null);
	const topCutRef = useRef<HTMLDivElement>(null);
	const bottomCutRef = useRef<HTMLDivElement>(null);

	const [dimensions, setDimensions] = useState<TicketDimensions>({
		w: 360,
		h: 750,
		y1: 240,
		y2: 640,
	});

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

	const activeClipPath = useMemo(() => {
		return buildTicketClipPath(normalizedVariant, dimensions, hasSawtoothEnds);
	}, [normalizedVariant, dimensions, hasSawtoothEnds]);

	const googleMapsUrl = useMemo(() => {
		if (
			latitude !== null &&
			latitude !== undefined &&
			longitude !== null &&
			longitude !== undefined &&
			!isNaN(Number(latitude)) &&
			!isNaN(Number(longitude))
		) {
			return `https://www.google.com/maps/search/?api=1&query=${Number(latitude)},${Number(longitude)}`;
		}
		const locationQuery =
			[venueName, venueAddress, venueCity, venueCountry]
				.filter(Boolean)
				.join(", ") ||
			venue ||
			"";
		return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationQuery)}`;
	}, [latitude, longitude, venueName, venueAddress, venueCity, venueCountry, venue]);

	const venueTitle = venueName || venue || "Venue TBA";
	const venueLocationStr =
		[venueAddress, venueCity, venueCountry].filter(Boolean).join(", ") ||
		(!venueName ? "" : venue);

	const renderFront = () => (
		<div
			ref={containerRef}
			className={cn(
				"text-slate-900 px-6 sm:px-7 pt-4 pb-6 flex flex-col items-center relative overflow-hidden",
				isRetro ? "bg-[#fcfaf7]" : "bg-card",
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
					<Image
						src={flierDisplayUrl}
						alt={eventName}
						fill
						priority
						unoptimized
						className="object-cover"
					/>
					<div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] print:backdrop-blur-none print:bg-black/45 pointer-events-none" />
					<div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/60 pointer-events-none print:hidden" />

					{/* Top: Organizer Logo ONLY */}
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

					{/* Middle: Event Name & Ticket Tag */}
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
				<div className="w-full flex flex-col items-center pt-1 pb-1">
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

			{/* Cutting Line 1 (Upper Perforation) */}
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
						className="text-sm font-semibold text-slate-900 text-right max-w-[220px] leading-snug"
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
						className="text-sm font-semibold text-slate-900 text-right max-w-[220px] leading-snug"
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
						className="text-sm font-semibold text-slate-950 text-right uppercase max-w-[220px] leading-snug"
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

			{/* Separator */}
			<div className="w-full my-2.5 border-b border-slate-100" />

			{/* Prominent QR Code */}
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
			</div>

			{/* Cutting Line 2 (Lower Perforation) */}
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
	);

	const renderBack = () => (
		<div
			className={cn(
				"text-slate-900 flex flex-col justify-between relative overflow-hidden size-full select-none",
				isRetro ? "bg-[#fcfaf7]" : "bg-card",
			)}
			style={{
				clipPath: `url(#${clipId})`,
				WebkitPrintColorAdjust: "exact",
				printColorAdjust: "exact",
			}}
		>
			{/* Subtle paper texture overlay */}
			<div
				className="absolute inset-0 opacity-[0.025] pointer-events-none print:hidden"
				style={{
					backgroundImage:
						"repeating-linear-gradient(0deg, #000, #000 1px, transparent 1px, transparent 4px)",
				}}
			/>

			{/* Exact Perforation Line 1: Centered precisely through upper side notches */}
			<div
				className="absolute left-0 right-0 border-b border-dashed border-slate-300 pointer-events-none z-20"
				style={{
					top: `${dimensions.y1}px`,
					transform: "translateY(-50%)",
				}}
			/>

			{/* Exact Perforation Line 2: Centered precisely through lower side notches */}
			<div
				className="absolute left-0 right-0 border-b border-dashed border-slate-300 pointer-events-none z-20"
				style={{
					top: `${dimensions.y2}px`,
					transform: "translateY(-50%)",
				}}
			/>

			{/* ─── Top Tier: Venue & Location (Height matches y1) ─── */}
			<div
				className="w-full px-6 sm:px-7 pt-4 pb-2.5 flex flex-col justify-between relative z-10 box-border shrink-0"
				style={{ height: `${dimensions.y1}px` }}
			>
				{/* Top Lanyard Slot for Modern Pass */}
				{isModern && !hasSawtoothEnds ? (
					<div className="w-12 h-1.5 rounded-full bg-slate-900/15 mb-1 -mt-1 mx-auto shrink-0" />
				) : null}

				<div className="flex items-center justify-between gap-2 shrink-0">
					<div className="flex items-center gap-1.5 text-slate-500 font-semibold">
						<MapPin className="size-3.5 text-rose-500 shrink-0" />
						<span
							className="text-[10px] uppercase font-bold tracking-wider text-slate-600"
							style={{ fontFamily: "'Courier New', Courier, monospace" }}
						>
							Venue & Location
						</span>
					</div>
					{isVirtual ? (
						<span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
							Virtual Event
						</span>
					) : (
						<span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
							Official Venue
						</span>
					)}
				</div>

				<div className="my-auto py-1 min-w-0">
					<p
						className="text-xs sm:text-sm font-black text-slate-950 leading-snug truncate"
						style={{ fontFamily: "'Courier New', Courier, monospace" }}
					>
						{venueTitle}
					</p>
					{venueLocationStr && (
						<p className="text-[11px] text-slate-600 mt-0.5 leading-tight font-medium line-clamp-2">
							{venueLocationStr}
						</p>
					)}
				</div>

				{/* Location Action Button */}
				<div className="shrink-0 pt-0.5">
					{isVirtual ? (
						virtualLink ? (
							<a
								href={virtualLink}
								target="_blank"
								rel="noopener noreferrer"
								onClick={(e) => e.stopPropagation()}
								className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs hover:opacity-95 transition-all active:scale-[0.98]"
								style={{ backgroundColor: primaryColor }}
							>
								<Globe className="size-3.5" />
								<span>Join Virtual Meeting</span>
								<ExternalLink className="size-3 opacity-80" />
							</a>
						) : (
							<div className="text-center py-1 text-[10px] text-slate-500 font-medium bg-slate-50 rounded-lg border border-slate-200/60">
								Access link will be shared prior to start
							</div>
						)
					) : (
						<a
							href={googleMapsUrl}
							target="_blank"
							rel="noopener noreferrer"
							onClick={(e) => e.stopPropagation()}
							className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs hover:opacity-95 transition-all active:scale-[0.98] group/map"
							style={{ backgroundColor: primaryColor }}
						>
							<Navigation className="size-3.5 transition-transform group-hover/map:scale-110" />
							<span>Get Directions on Google Maps</span>
							<ExternalLink className="size-3 opacity-80" />
						</a>
					)}
				</div>
			</div>

			{/* ─── Middle Tier: Sponsors & Partners (Height matches y2 - y1) ─── */}
			<div
				className="w-full px-6 sm:px-7 py-3 flex flex-col justify-between relative z-10 box-border min-h-0 flex-1"
				style={{ height: `${dimensions.y2 - dimensions.y1}px` }}
			>
				<div className="w-full rounded-xl bg-slate-50/80 border border-slate-200/80 p-2.5 sm:p-3 flex flex-col gap-2 shadow-2xs min-h-0 h-full">
					<div className="flex items-center justify-between gap-2 shrink-0">
						<div className="flex items-center gap-1.5 text-slate-500 font-semibold">
							<Award className="size-3.5 text-amber-500 shrink-0" />
							<span
								className="text-[10px] uppercase font-bold tracking-wider text-slate-600"
								style={{ fontFamily: "'Courier New', Courier, monospace" }}
							>
								Official Sponsors & Partners
							</span>
						</div>
						<span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
							{sponsors && sponsors.length > 0
								? `${sponsors.length} Partner${sponsors.length > 1 ? "s" : ""}`
								: "Official"}
						</span>
					</div>

					

					{/* Sponsors Grid */}
					{sponsors && sponsors.length > 0 ? (
						<div className="grid grid-cols-2 gap-1.5 overflow-y-auto no-scrollbar flex-1 min-h-0 pr-0.5">
							{sponsors.map((s) => {
								const sLogo = getSponsorImageUrl(s.logo);
								return (
									<div
										key={s.id}
										className="flex items-center gap-1.5 p-1.5 rounded-lg border border-slate-200/90 bg-white shadow-2xs min-w-0"
									>
										<div className="relative size-6 rounded-md overflow-hidden shrink-0 bg-slate-50 border border-slate-200/60 flex items-center justify-center">
											{sLogo ? (
												<Image
													src={sLogo}
													alt={s.name}
													fill
													unoptimized
													className="object-contain p-0.5"
												/>
											) : (
												<span className="text-[9px] font-black text-slate-400 uppercase">
													{s.name.charAt(0)}
												</span>
											)}
										</div>
										<span
											className="text-[10px] font-bold text-slate-800 truncate"
											title={s.name}
										>
											{s.name}
										</span>
									</div>
								);
							})}
						</div>
					) : (
						<div className="flex-1 flex flex-col items-center justify-center py-2 text-center rounded-lg border border-dashed border-slate-200/80 bg-white/60">
							<p className="text-[10px] font-bold text-slate-700">Official Event Admission Pass</p>
							<p className="text-[9px] text-slate-400 mt-0.5">Powered by Fextiva</p>
						</div>
					)}
				</div>
			</div>

			{/* ─── Bottom Tier: Stub (Height matches h - y2) ─── */}
			<div
				className="w-full px-6 sm:px-7 pt-2.5 pb-4 flex flex-col items-center justify-between relative z-10 box-border shrink-0"
				style={{ height: `${dimensions.h - dimensions.y2}px` }}
			>
				<span
					className="text-xs sm:text-sm font-black tracking-[0.2em] text-slate-900 font-mono"
					style={{ fontFamily: "'Courier New', Courier, monospace" }}
				>
					{ticketCode}
				</span>

				{/* Stylized Barcode Graphic */}
				<div className="flex items-center justify-center gap-[2px] h-3.5 opacity-60">
					{BARCODE_BARS.map((w, i) => (
						<div
							key={i}
							className="h-full bg-slate-900 rounded-[0.5px]"
							style={{ width: `${w * 1.5}px` }}
						/>
					))}
				</div>

				
			</div>
		</div>
	);

	if (exportMode) {
		if (exportSide === "back") {
			return (
				<div
					className={cn(
						"relative w-full max-w-[340px] xs:max-w-[360px] sm:max-w-[390px] mx-auto filter drop-shadow-lg select-none",
						className,
					)}
				>
					<TicketClipPath id={clipId} path={activeClipPath} />
					{renderBack()}
				</div>
			);
		}
		if (exportSide === "front") {
			return (
				<div
					className={cn(
						"relative w-full max-w-[340px] xs:max-w-[360px] sm:max-w-[390px] mx-auto filter drop-shadow-lg select-none",
						className,
					)}
				>
					<TicketClipPath id={clipId} path={activeClipPath} />
					{renderFront()}
				</div>
			);
		}
		return (
			<div
				className={cn(
					"flex flex-col gap-6 relative w-full max-w-[340px] xs:max-w-[360px] sm:max-w-[390px] mx-auto filter drop-shadow-lg select-none",
					className,
				)}
			>
				<TicketClipPath id={clipId} path={activeClipPath} />
				{renderFront()}
				{renderBack()}
			</div>
		);
	}

	return (
		<div className="w-full flex flex-col items-center">
			<div
				className={cn(
					"relative w-full max-w-[340px] xs:max-w-[360px] sm:max-w-[390px] mx-auto filter drop-shadow-lg transition-all select-none print:drop-shadow-none",
					className,
				)}
				style={{
					perspective: 1200,
					cursor: disableFlip ? undefined : "grab",
				}}
			>
				{/* SVG Clip Path Definition with exact cutting line notches */}
				<TicketClipPath id={clipId} path={activeClipPath} />

				{/* 3D Flippable Ticket Card */}
				<div
					className={cn(
						"relative w-full",
						!disableFlip && "active:cursor-grabbing",
					)}
					style={{
						transformStyle: "preserve-3d",
						transition: "transform 0.65s cubic-bezier(0.4, 0, 0.2, 1)",
						transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
					}}
					onClick={disableFlip ? undefined : handleFlip}
					title={disableFlip ? undefined : "Click to flip pass"}
				>
					{/* FRONT FACE */}
					<div
						className="relative w-full"
						style={{
							backfaceVisibility: "hidden",
							WebkitBackfaceVisibility: "hidden",
						}}
					>
						{renderFront()}
					</div>

					{/* BACK FACE */}
					<div
						className="absolute inset-0 size-full"
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

			{/* Interactive Flip Hint Button below card */}
			{!disableFlip && (
				<div className="mt-3 flex items-center justify-center print:hidden">
					<button
						type="button"
						onClick={handleFlip}
						className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card/90 hover:bg-card border border-border/70 text-[11px] font-semibold text-muted-foreground hover:text-foreground backdrop-blur-md transition-all shadow-xs cursor-pointer active:scale-95 group"
					>
						<RotateCw className="size-3 text-primary transition-transform group-hover:rotate-180 duration-500" />
						<span>
							{isFlipped
								? "Flip to view QR code"
								: "Flip to view location & sponsors"}
						</span>
					</button>
				</div>
			)}
		</div>
	);
}
