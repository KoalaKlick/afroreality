"use client";

import Image from "next/image";
import { MapPin, Smartphone } from "lucide-react";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { getUssdDialCode, getUssdRootDialCode } from "@/lib/utils/ussd";
import { StatusBadge } from "@/components/common/status-badge";
import { NoEventsIllustration } from "@/components/common/NoEventsIllustration";

export interface TawnyEventData {
	id: string;
	title: string;
	slug: string;
	description?: string | null;
	type?: string;
	status?: string;
	startDate?: Date | string | null;
	endDate?: Date | string | null;
	flierImage?: string | null;
	bannerImage?: string | null;
	venueName?: string | null;
	venueCity?: string | null;
	venueCountry?: string | null;
	hasUssd?: boolean;
	ussdCode?: string | null;
	minPrice?: number | null;
	maxPrice?: number | null;
	category?: string | null;
	tags?: string[] | null;
	organization: {
		name: string;
		slug: string;
		logoUrl?: string | null;
	};
}

interface EventCardProps {
	readonly event: TawnyEventData;
	readonly isPast?: boolean;
	readonly className?: string;
}

function getMonth(date: Date | string | null | undefined): string {
	if (!date) return "TBA";
	const d = new Date(date);
	if (isNaN(d.getTime())) return "TBA";
	return d.toLocaleDateString("en-GB", { month: "short" }).toUpperCase();
}

function getDay(date: Date | string | null | undefined): string {
	if (!date) return "-";
	const d = new Date(date);
	if (isNaN(d.getTime())) return "-";
	return d.getDate().toString();
}

/** Derive a display status from event status + dates */
function getDisplayStatus(event: TawnyEventData, isPast: boolean): string {
	const status = event.status?.toLowerCase();
	if (status === "draft") return "draft";
	if (status === "cancelled") return "cancelled";
	if (status === "ended" || isPast) return "ended";
	if (status === "ongoing") return "ongoing";

	// For published events, determine upcoming vs ongoing based on dates
	if (event.startDate) {
		const now = new Date();
		const start = new Date(event.startDate);
		const end = event.endDate ? new Date(event.endDate) : null;
		if (now < start) return "upcoming";
		if (end && now > end) return "ended";
		if (now >= start) return "ongoing";
	}

	return "upcoming";
}

export function EventCard({ event, isPast = false, className }: EventCardProps) {
	const rawPoster = event.flierImage || event.bannerImage;
	const posterUrl = getEventImageUrl(rawPoster);

	const eventCode = event.hasUssd
		? (event.ussdCode ? getUssdDialCode(event.ussdCode) : getUssdRootDialCode())
		: null;

	const venue = [event.venueName, event.venueCity].filter(Boolean).join(", ") || "Ghana";
	const eventType = (event.type || "standard").toLowerCase();
	const displayStatus = getDisplayStatus(event, isPast);

	return (
		<div className={`group flex flex-col justify-between h-full gap-2.5 relative cursor-pointer w-full max-w-[340px] mx-auto p-2.5 rounded-2xl bg-card ${className || ""}`}>
			{/* Poster Container */}
			<div className="relative w-full aspect-4/5 overflow-hidden rounded-xl bg-muted shadow-none shrink-0">
				{posterUrl ? (
					<Image
						src={posterUrl}
						alt={event.title}
						fill
						className="object-cover transition-transform duration-300 group-hover:scale-105"
						sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
					/>
				) : (
					<div className="absolute inset-0 bg-muted/50 flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
						<NoEventsIllustration className="w-full h-full p-4 object-contain opacity-75" />
					</div>
				)}

				<div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-200" />

				{/* Top-left Date Badge */}
				<div className="absolute top-2.5 left-2.5 bg-background/95 backdrop-blur-md rounded-md py-1 px-2.5 flex flex-col items-center justify-center min-w-[48px] border border-border shadow-none z-10">
					<span className="text-[10px] font-bold uppercase text-muted-foreground">
						{getMonth(event.startDate)}
					</span>
					<span className="text-xl font-bold text-primary leading-none mt-0.5">
						{getDay(event.startDate)}
					</span>
				</div>

				{/* Top-right USSD badge - only shown if event has USSD enabled and not past */}
				{!isPast && event.hasUssd && eventCode && (
					<div className="absolute top-2.5 right-2.5 bg-background/95 backdrop-blur-md rounded-md px-2 py-1 border border-primary/30 shadow-none z-10 flex items-center gap-1">
						<Smartphone className="size-3 text-primary shrink-0" />
						<span className="text-xs font-bold text-primary tracking-wide font-mono">
							{eventCode}
						</span>
					</div>
				)}
			</div>

			{/* Bottom Metadata */}
			<div className="flex flex-col gap-1.5 px-0.5 flex-1 justify-between">
				<div className="flex flex-col gap-1.5">
					{/* Status Badges Row (category moved to bottom before tags) */}
					<div className="flex items-center gap-1.5 flex-wrap">
						<StatusBadge variant={eventType} size="sm" />
						<StatusBadge variant={displayStatus} size="sm" />
					</div>

					<h3 className="font-bold text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors">
						{event.title}
					</h3>
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
						<MapPin className="size-3.5 shrink-0 text-primary" />
						<span className="truncate">{venue}</span>
					</div>
				</div>

				{/* Category & Tags Row at bottom */}
				{(event.category || (event.tags && event.tags.length > 0)) && (
					<div className="flex items-center gap-1.5 flex-wrap pt-1 mt-auto">
						{event.category && (
							<span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
								{event.category}
							</span>
						)}
						{event.tags && event.tags.slice(0, 3).map((tag) => (
							<span
								key={tag}
								className="text-[10px] font-medium text-muted-foreground/80 bg-muted/50 px-1.5 py-0.5 rounded transition-colors"
							>
								#{tag}
							</span>
						))}
						{event.tags && event.tags.length > 3 && (
							<span className="text-[10px] text-muted-foreground/60 font-medium">
								+{event.tags.length - 3}
							</span>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
