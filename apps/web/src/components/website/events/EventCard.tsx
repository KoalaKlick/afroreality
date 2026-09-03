"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { MapPin, Vote, Ticket } from "lucide-react";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { getUssdRootDialCode } from "@/lib/utils/ussd";

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
	minPrice?: number | null;
	maxPrice?: number | null;
	category?: string | null;
	organization: {
		name: string;
		slug: string;
		logoUrl?: string | null;
	};
}

interface EventCardProps {
	readonly event: TawnyEventData;
	readonly isPast?: boolean;
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

function formatPrice(
	price: number | null | undefined,
	currency = "GHS",
	isVoting = false,
): string {
	if (price === null || price === undefined || price === 0) {
		return isVoting ? "Free Vote" : "Free";
	}
	const currencySymbol = currency === "GHS" ? "GH₵" : currency;
	return `${currencySymbol} ${price.toFixed(2)} +`;
}

export function EventCard({ event, isPast = false }: EventCardProps) {
	const isVoting = event.type?.toLowerCase() === "voting";
	const rawPoster = event.flierImage || event.bannerImage;
	const posterUrl = getEventImageUrl(rawPoster);

	const eventCode = event.hasUssd
		? getUssdRootDialCode()
		: event.id.slice(0, 6).toUpperCase();

	const category = event.category || (isVoting ? "Live Voting" : "African Festival");
	const venue = [event.venueName, event.venueCity].filter(Boolean).join(", ") || "Ghana";

	const priceString = isVoting
		? formatPrice(event.minPrice ?? 1, "GHS", true)
		: formatPrice(event.minPrice, "GHS", false);

	return (
		<div className="group flex flex-col gap-2.5 relative cursor-pointer w-full max-w-[340px] mx-auto">
			{/* Poster Container (Preline Clean Style: rounded-xl, 1px border, zero shadows) */}
			<div className="relative w-full aspect-4/5 overflow-hidden rounded-xl bg-muted border border-border shadow-none">
				{posterUrl ? (
					<Image
						src={posterUrl}
						alt={event.title}
						fill
						className="object-cover transition-transform duration-300 group-hover:scale-105"
						sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
					/>
				) : (
					<div className="absolute inset-0 bg-muted/60 flex items-center justify-center">
						{isVoting ? (
							<Vote className="size-12 text-primary/50" />
						) : (
							<Ticket className="size-12 text-primary/50" />
						)}
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

				{/* Top-right USSD badge */}
				{!isPast && (
					<div className="absolute top-2.5 right-2.5 bg-background/95 backdrop-blur-md rounded-md px-2 py-1 border border-primary/30 shadow-none z-10">
						<span className="text-xs font-bold text-primary tracking-wide">
							{eventCode}
						</span>
					</div>
				)}

				{/* Bottom-right Price Box */}
				{isPast ? (
					<div className="absolute bottom-2.5 right-2.5 bg-background/95 backdrop-blur-md rounded-md px-3 py-1.5 text-center border border-border shadow-none z-10">
						<span className="text-xs font-semibold text-muted-foreground">
							Closed
						</span>
					</div>
				) : (
					<div className="absolute bottom-2.5 right-2.5 bg-background/95 backdrop-blur-md rounded-md p-2.5 text-center border border-border shadow-none min-w-[115px] z-10">
						<div className="text-[10px] text-muted-foreground font-medium mb-0.5">
							{isVoting ? "Price Per Vote" : "Tickets Per Person"}
						</div>
						<div className="text-sm font-bold text-foreground whitespace-nowrap">
							{priceString}
						</div>
					</div>
				)}
			</div>

			{/* Bottom Metadata */}
			<div className="flex flex-col gap-1 px-0.5">
				<div className="flex items-center">
					<Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-none">
						{category}
					</Badge>
				</div>
				<h3 className="font-bold text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors">
					{event.title}
				</h3>
				<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
					<MapPin className="size-3.5 shrink-0 text-primary" />
					<span className="truncate">{venue}</span>
				</div>
			</div>
		</div>
	);
}
