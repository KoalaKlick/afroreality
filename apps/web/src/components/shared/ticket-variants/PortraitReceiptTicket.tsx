"use client";

import { useMemo } from "react";
import Image from "next/image";
import QRCode from "react-qr-code";
import { QrCode, Calendar, MapPin, User, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { getOrgImageUrl } from "@/lib/image-url-utils";
import { generateColorShades } from "@/utils/theme/color-generator";

export interface PortraitReceiptTicketProps {
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

function ReceiptDivider() {
	return (
		<div className="w-full my-3 sm:my-4 border-b border-dashed border-slate-300" />
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
	const primaryShades = useMemo(
		() => generateColorShades(primaryColor),
		[primaryColor],
	);
	const logoDisplayUrl = getOrgImageUrl(logoUrl);
	const formattedDate = useMemo(() => formatPassDateTime(dateTime), [dateTime]);

	return (
		<div
			className={cn(
				"w-full max-w-[340px] xs:max-w-[360px] sm:max-w-[390px] mx-auto filter drop-shadow-2xl transition-all select-none",
				className,
			)}
		>
			{/* Top Sawtooth Edge */}
			<ReceiptSawtoothTop className="text-white" />

			{/* Main Receipt Body */}
			<div className="bg-white text-slate-900 px-5 sm:px-6 pt-3 pb-5 flex flex-col items-center relative overflow-hidden">
				{/* Subtle thermal paper texture */}
				<div
					className="absolute inset-0 opacity-[0.025] pointer-events-none"
					style={{
						backgroundImage:
							"repeating-linear-gradient(0deg, #000, #000 1px, transparent 1px, transparent 4px)",
					}}
				/>

				{/* Header: Organization & Receipt Type */}
				<div className="w-full flex items-center justify-between gap-2 pt-1 pb-2">
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

					<span
						className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-sm"
						style={{
							backgroundColor: primaryShades[50] || "#fef2f2",
							color: primaryColor,
							fontFamily: "'Courier New', Courier, monospace",
						}}
					>
						RECEIPT PASS
					</span>
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

				{/* Divider */}
				<ReceiptDivider />

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

				{/* Divider */}
				<ReceiptDivider />

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

				{/* Divider */}
				<div className="w-full border-b border-dashed border-slate-300 my-3" />

				{/* Ticket Code */}
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

			{/* Bottom Sawtooth Edge */}
			<ReceiptSawtoothBottom className="text-white" />
		</div>
	);
}
