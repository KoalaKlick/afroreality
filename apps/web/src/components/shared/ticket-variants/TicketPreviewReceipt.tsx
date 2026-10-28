"use client";

import React, { useState } from "react";
import Image from "next/image";
import QRCode from "react-qr-code";
import { QrCode, Tag, Calendar, MapPin, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateColorShades } from "@/utils/theme/color-generator";
import { getEventImageUrl, getOrgImageUrl } from "@/lib/image-url-utils";

interface TicketProps {
	readonly primaryColor: string;
	readonly secondaryColor: string;
	readonly tertiaryColor?: string;
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
	readonly className?: string;
	readonly exportMode?: boolean;
	readonly exportSide?: "front" | "back" | "both";
	readonly buyerName?: string;
	readonly stacked?: boolean;
	readonly disableFlip?: boolean;
	readonly defaultFlipped?: boolean;
}

/**
 * Vertical sawtooth tear edge for horizontal receipt (Left End)
 */
function SawtoothLeft({ className }: { className?: string }) {
	return (
		<svg
			className={cn("h-full w-2.5 block text-white -mr-px shrink-0 select-none", className)}
			viewBox="0 0 8 120"
			preserveAspectRatio="none"
			aria-hidden="true"
		>
			<path
				d="M8,0 L0,3 L8,6 L0,9 L8,12 L0,15 L8,18 L0,21 L8,24 L0,27 L8,30 L0,33 L8,36 L0,39 L8,42 L0,45 L8,48 L0,51 L8,54 L0,57 L8,60 L0,63 L8,66 L0,69 L8,72 L0,75 L8,78 L0,81 L8,84 L0,87 L8,90 L0,93 L8,96 L0,99 L8,102 L0,105 L8,108 L0,111 L8,114 L0,117 L8,120 Z"
				fill="currentColor"
			/>
		</svg>
	);
}

/**
 * Vertical sawtooth tear edge for horizontal receipt (Right End)
 */
function SawtoothRight({ className }: { className?: string }) {
	return (
		<svg
			className={cn("h-full w-2.5 block text-white -ml-px shrink-0 select-none", className)}
			viewBox="0 0 8 120"
			preserveAspectRatio="none"
			aria-hidden="true"
		>
			<path
				d="M0,0 L8,3 L0,6 L8,9 L0,12 L8,15 L0,18 L8,21 L0,24 L8,27 L0,30 L8,33 L0,36 L8,39 L0,42 L8,45 L0,48 L8,51 L0,54 L8,57 L0,60 L8,63 L0,66 L8,69 L0,72 L8,75 L0,78 L8,81 L0,84 L8,87 L0,90 L8,93 L0,96 L8,99 L0,102 L8,105 L0,108 L8,111 L0,114 L8,117 L0,120 Z"
				fill="currentColor"
			/>
		</svg>
	);
}

export function TicketCardReceipt({
	primaryColor,
	secondaryColor,
	logoUrl,
	flierImage,
	organizationName = "Organizer",
	eventName = "Sample Event 2026",
	ticketType = "General Admission",
	dateTime = "Date & Time TBA",
	venue = "Venue TBA",
	ticketCode = "XXXXX-YYYYYY",
	qrPayload,
	className = "",
	exportMode = false,
	exportSide = "both",
	buyerName = "Valued Guest",
	disableFlip = false,
	defaultFlipped = false,
}: TicketProps) {
	const [flipped, setFlipped] = useState(defaultFlipped);
	const primaryShades = generateColorShades(primaryColor);
	const logoDisplayUrl = getOrgImageUrl(logoUrl);
	const flierDisplayUrl = getEventImageUrl(flierImage);

	// Handle flip click
	const handleFlip = () => {
		if (disableFlip || exportMode) return;
		setFlipped((prev) => !prev);
	};

	// Front Side Layout (Horizontal Receipt)
	const renderFront = () => (
		<div className="flex flex-row items-stretch w-full h-full relative select-none">
			<SawtoothLeft className="text-white" />
			<div className="flex-1 bg-white text-slate-900 p-3 sm:p-4 flex flex-row items-center gap-3 sm:gap-4 relative overflow-hidden">
				{/* Flier watermark */}
				{flierDisplayUrl ? (
					<Image
						src={flierDisplayUrl}
						alt={eventName}
						fill
						className="object-cover opacity-10 pointer-events-none"
						unoptimized
					/>
				) : null}

				{/* Left main info */}
				<div className="flex-1 min-w-0 flex flex-col justify-between h-full relative z-10">
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-1.5 min-w-0">
							{logoDisplayUrl ? (
								<div className="relative size-4 rounded-full overflow-hidden shrink-0">
									<Image src={logoDisplayUrl} alt={organizationName} fill className="object-cover" unoptimized />
								</div>
							) : null}
							<span className="text-[9px] font-black uppercase tracking-wider text-slate-500 truncate">
								{organizationName}
							</span>
						</div>
						<span
							className="text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
							style={{ backgroundColor: primaryShades[50] || "#fef2f2", color: primaryColor }}
						>
							RECEIPT PASS
						</span>
					</div>

					<div>
						<h3 className="text-xs sm:text-sm font-black uppercase tracking-tight text-slate-950 truncate" style={{ fontFamily: "'Courier New', monospace" }}>
							{eventName}
						</h3>
						<div className="inline-flex items-center gap-1 text-[9px] font-bold uppercase text-slate-600 mt-0.5">
							<Tag className="size-2.5 text-slate-400" />
							<span>{ticketType}</span>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-1 text-[8px] sm:text-[9px] text-slate-500">
						<div className="flex items-center gap-1 truncate">
							<Calendar className="size-2.5 shrink-0 text-slate-400" />
							<span className="truncate">{dateTime}</span>
						</div>
						<div className="flex items-center gap-1 truncate">
							<MapPin className="size-2.5 shrink-0 text-slate-400" />
							<span className="truncate">{venue}</span>
						</div>
					</div>
				</div>

				{/* Perforated vertical line */}
				<div className="h-full border-r border-dashed border-slate-300 relative z-10 shrink-0" />

				{/* Right Stub: Ticket Code & mini QR */}
				<div className="w-24 sm:w-28 shrink-0 flex flex-col items-center justify-center text-center gap-1.5 relative z-10">
					<div className="size-16 sm:size-18 p-1 rounded-lg bg-white border border-slate-200 shadow-xs flex items-center justify-center">
						{qrPayload ? (
							<QRCode value={qrPayload} size={64} style={{ height: "100%", width: "100%" }} fgColor="#0f172a" bgColor="#ffffff" />
						) : (
							<QrCode className="size-full text-slate-300" />
						)}
					</div>
					<span className="text-[9px] sm:text-[10px] font-mono font-black tracking-wider text-slate-900 truncate max-w-full">
						{ticketCode}
					</span>
				</div>
			</div>
			<SawtoothRight className="text-white" />
		</div>
	);

	// Back Side Layout (Horizontal Receipt Full QR)
	const renderBack = () => (
		<div className="flex flex-row items-stretch w-full h-full relative select-none">
			<SawtoothLeft className="text-white" />
			<div className="flex-1 bg-white text-slate-900 p-3 sm:p-4 flex flex-row items-center justify-around gap-4 relative overflow-hidden">
				<div className="flex flex-col items-center justify-center">
					<div className="size-24 sm:size-28 p-1.5 rounded-xl bg-white border-2 border-slate-900/10 shadow-sm flex items-center justify-center">
						{qrPayload ? (
							<QRCode value={qrPayload} size={128} style={{ height: "100%", width: "100%" }} fgColor="#0f172a" bgColor="#ffffff" />
						) : (
							<QrCode className="size-full text-slate-300" />
						)}
					</div>
					<span className="text-[8px] font-bold tracking-widest uppercase text-slate-500 mt-1">
						Scan at gate
					</span>
				</div>

				<div className="flex flex-col justify-center gap-1.5 min-w-0">
					<span className="text-[10px] sm:text-xs font-mono font-black tracking-wider text-slate-900">
						{ticketCode}
					</span>
					<div className="flex items-center gap-1 text-[9px] text-slate-600">
						<User className="size-3 text-slate-400" />
						<span className="font-bold truncate">{buyerName}</span>
					</div>
					<p className="text-[8px] text-slate-400 tracking-wider uppercase font-mono mt-1">
						Single Admission Pass
					</p>
				</div>
			</div>
			<SawtoothRight className="text-white" />
		</div>
	);

	if (exportMode) {
		return (
			<div className={cn("w-full max-w-140 aspect-[560/210] mx-auto filter drop-shadow-md", className)}>
				{exportSide === "front" ? renderFront() : exportSide === "back" ? renderBack() : renderFront()}
			</div>
		);
	}

	return (
		<div
			onClick={handleFlip}
			className={cn(
				"w-full max-w-140 aspect-[560/210] mx-auto filter drop-shadow-xl transition-all cursor-pointer relative",
				className,
			)}
			title={disableFlip ? undefined : "Click to flip pass"}
		>
			{flipped ? renderBack() : renderFront()}
		</div>
	);
}
