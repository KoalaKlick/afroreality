"use client";

import { useId, useMemo, useRef, useState, useEffect } from "react";
import Image from "next/image";
import QRCode from "react-qr-code";
import { QrCode, Calendar, MapPin, User, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { getOrgImageUrl } from "@/lib/image-url-utils";
import { generateColorShades } from "@/utils/theme/color-generator";

export interface PortraitReceiptTicketProps {
	readonly variant?: string | null;
	readonly primaryColor?: string;
	readonly secondaryColor?: string;
	readonly logoUrl?: string | null;
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
 * Builds the exact ticket silhouette SVG path in normalized [0, 1] coordinates.
 * Side notches are placed PRECISELY at y1 and y2 (the two cutting/perforation lines).
 * Top and bottom edges are clean (no center notches).
 * No notches in the middle of the QR code.
 */
function buildTicketPath(
	variant: string,
	dim: TicketDimensions,
): string {
	const { w, h, y1, y2 } = dim;
	const isGeo = variant === "geo" || variant === "geometric";
	const isModern = variant === "modern" || variant === "pass";

	// Guard against unmeasured or edge-case coordinates
	const y1n = Math.max(0.08, Math.min(0.45, y1 / h));
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
			// Right edge to notch 1
			`L 1 ${y1n - nry}`,
			`L ${1 - nrx} ${y1n}`,
			`L 1 ${y1n + nry}`,
			// Right edge to notch 2
			`L 1 ${y2n - nry}`,
			`L ${1 - nrx} ${y2n}`,
			`L 1 ${y2n + nry}`,
			// Bottom-right corner
			`L 1 ${1 - cry}`,
			`L ${1 - crx} 1`,
			// Bottom edge
			`L ${crx} 1`,
			`L 0 ${1 - cry}`,
			// Left edge up to notch 2
			`L 0 ${y2n + nry}`,
			`L ${nrx} ${y2n}`,
			`L 0 ${y2n - nry}`,
			// Left edge up to notch 1
			`L 0 ${y1n + nry}`,
			`L ${nrx} ${y1n}`,
			`L 0 ${y1n - nry}`,
			// Top-left corner
			`L 0 ${cry}`,
			`Z`,
		].join(" ");
	}

	const cornerR = isModern ? 22 : 16;
	const notchR = 12; // 24px wide notch, 12px depth into ticket

	const crx = cornerR / w;
	const cry = cornerR / h;
	const nrx = notchR / w;
	const nry = notchR / h;

	return [
		// Start top edge after top-left corner
		`M ${crx} 0`,
		// Straight across top edge to top-right corner
		`L ${1 - crx} 0`,
		// Top-right corner
		`Q 1 0 1 ${cry}`,
		// Down right edge to notch 1 (at cutting line 1)
		`L 1 ${y1n - nry}`,
		// Semicircular notch curving inward (to left)
		`A ${nrx} ${nry} 0 0 0 1 ${y1n + nry}`,
		// Down right edge to notch 2 (at cutting line 2)
		`L 1 ${y2n - nry}`,
		// Semicircular notch curving inward (to left)
		`A ${nrx} ${nry} 0 0 0 1 ${y2n + nry}`,
		// Down right edge to bottom-right corner
		`L 1 ${1 - cry}`,
		// Bottom-right corner
		`Q 1 1 ${1 - crx} 1`,
		// Straight across bottom edge to bottom-left corner
		`L ${crx} 1`,
		// Bottom-left corner
		`Q 0 1 0 ${1 - cry}`,
		// Up left edge to notch 2 (at cutting line 2)
		`L 0 ${y2n + nry}`,
		// Semicircular notch curving inward (to right)
		`A ${nrx} ${nry} 0 0 0 0 ${y2n - nry}`,
		// Up left edge to notch 1 (at cutting line 1)
		`L 0 ${y1n + nry}`,
		// Semicircular notch curving inward (to right)
		`A ${nrx} ${nry} 0 0 0 0 ${y1n - nry}`,
		// Up left edge to top-left corner
		`L 0 ${cry}`,
		// Top-left corner
		`Q 0 0 ${crx} 0`,
		`Z`,
	].join(" ");
}

function TicketClipPath({ id, path }: { id: string; path: string }) {
	return (
		<svg
			style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
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

function TicketOutline({ color, path }: { color: string; path: string }) {
	return (
		<svg
			className="absolute inset-0 w-full h-full pointer-events-none z-20"
			viewBox="0 0 1 1"
			preserveAspectRatio="none"
		>
			<path
				d={path}
				fill="none"
				stroke={color}
				strokeWidth="1.75"
				vectorEffect="non-scaling-stroke"
			/>
		</svg>
	);
}

/**
 * Sawtooth / Serrated jagged tear edge for receipt top and bottom
 */
function ReceiptSawtoothTop({ className }: { className?: string }) {
	return (
		<svg
			className={cn("w-full h-2.5 block text-white -mb-px shrink-0", className)}
			viewBox="0 0 120 8"
			preserveAspectRatio="none"
			aria-hidden="true"
		>
			<path
				d="M0 8 L3 0 L6 8 L9 0 L12 8 L15 0 L18 8 L21 0 L24 8 L27 0 L30 8 L33 0 L36 8 L39 0 L42 8 L45 0 L48 8 L51 0 L54 8 L57 0 L60 8 L63 0 L66 8 L69 0 L72 8 L75 0 L78 8 L81 0 L84 8 L87 0 L90 8 L93 0 L96 8 L99 0 L102 8 L105 0 L108 8 L111 0 L114 8 L117 0 L120 8 Z"
				fill="currentColor"
			/>
		</svg>
	);
}

function ReceiptSawtoothBottom({ className }: { className?: string }) {
	return (
		<svg
			className={cn("w-full h-2.5 block text-white -mt-px shrink-0", className)}
			viewBox="0 0 120 8"
			preserveAspectRatio="none"
			aria-hidden="true"
		>
			<path
				d="M0 0 L3 8 L6 0 L9 8 L12 0 L15 8 L18 0 L21 8 L24 0 L27 8 L30 0 L33 8 L36 0 L39 8 L42 0 L45 8 L48 0 L51 8 L54 0 L57 8 L60 0 L63 8 L66 0 L69 8 L72 0 L75 8 L78 0 L81 8 L84 0 L87 8 L90 0 L93 8 L96 0 L99 8 L102 0 L105 8 L108 0 L111 8 L114 0 L117 8 L120 0 Z"
				fill="currentColor"
			/>
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
	const primaryShades = useMemo(
		() => generateColorShades(primaryColor),
		[primaryColor],
	);
	const logoDisplayUrl = getOrgImageUrl(logoUrl);
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

	// Refs to measure EXACT Y position of the two cutting lines
	const containerRef = useRef<HTMLDivElement>(null);
	const topCutRef = useRef<HTMLDivElement>(null);
	const bottomCutRef = useRef<HTMLDivElement>(null);

	// Default fallback dimensions before measurement
	const [dimensions, setDimensions] = useState<TicketDimensions>({
		w: 360,
		h: 700,
		y1: 145,
		y2: 590,
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

			// Exact center of the cutting lines relative to container top
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
	const activePath = useMemo(() => {
		if (isReceipt) return null;
		return buildTicketPath(normalizedVariant, dimensions);
	}, [isReceipt, normalizedVariant, dimensions]);

	return (
		<div
			className={cn(
				"relative w-full max-w-[340px] xs:max-w-[360px] sm:max-w-[390px] mx-auto filter drop-shadow-2xl transition-all select-none",
				className,
			)}
		>
			{/* SVG Clip Path Definition with exact cutting line notches */}
			{activePath ? <TicketClipPath id={clipId} path={activePath} /> : null}

			{/* Top Sawtooth Edge for Receipt Pass */}
			{isReceipt ? <ReceiptSawtoothTop className="text-white" /> : null}

			{/* Main Ticket Body */}
			<div
				ref={containerRef}
				className={cn(
					"text-slate-900 px-6 sm:px-7 pt-5 pb-6 flex flex-col items-center relative overflow-hidden",
					isRetro ? "bg-[#fcfaf7]" : "bg-white",
				)}
				style={activePath ? { clipPath: `url(#${clipId})` } : undefined}
			>
				{/* Top Lanyard Slot for Modern Pass */}
				{isModern ? (
					<div className="w-12 h-1.5 rounded-full bg-slate-900/15 mb-2 -mt-1 mx-auto" />
				) : null}

				{/* Subtle paper texture overlay */}
				<div
					className="absolute inset-0 opacity-[0.025] pointer-events-none"
					style={{
						backgroundImage:
							"repeating-linear-gradient(0deg, #000, #000 1px, transparent 1px, transparent 4px)",
					}}
				/>

				{/* Header: Organization Logo & Name */}
				<div className="w-full flex items-center justify-center gap-2 pt-1 pb-2">
					<div className="flex items-center gap-1.5 min-w-0">
						{logoDisplayUrl ? (
							<div className="relative size-5 rounded-full overflow-hidden shrink-0 border border-slate-200">
								<Image
									src={logoDisplayUrl}
									alt={organizationName}
									fill
									className="object-cover"
									unoptimized
								/>
							</div>
						) : null}
						<span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 truncate">
							{organizationName}
						</span>
					</div>
				</div>

				{/* Event Title */}
				<h2
					className="text-lg sm:text-xl font-black uppercase tracking-tight text-center leading-snug mt-1 mb-2 text-slate-950 px-1"
					style={{ fontFamily: "'Courier New', Courier, monospace" }}
				>
					{eventName}
				</h2>

				{/* Ticket Type Tag */}
				<div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 mb-1">
					<Tag className="size-3 text-slate-500" />
					<span
						className="text-[11px] font-bold uppercase tracking-wider text-slate-800"
						style={{ fontFamily: "'Courier New', Courier, monospace" }}
					>
						01 × {ticketType}
					</span>
				</div>

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

			{/* SVG Outline following the exact path silhouette */}
			{activePath ? (
				<TicketOutline color={primaryColor} path={activePath} />
			) : null}

			{/* Bottom Sawtooth Edge for Receipt Pass */}
			{isReceipt ? <ReceiptSawtoothBottom className="text-white" /> : null}
		</div>
	);
}
