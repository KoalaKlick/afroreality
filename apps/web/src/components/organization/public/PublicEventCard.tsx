"use client";

import { cn } from "@/lib/utils";
import type { Event } from "@repo/db";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { Calendar, MapPin, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface PublicEventCardProps {
	readonly event: Event;
	readonly organizationSlug: string;
	readonly className?: string;
}

/** Status badge color map */
function getStatusStyle(status: string) {
	switch (status) {
		case "ended":
			return "bg-red-50 text-red-500 border-red-100";
		case "ongoing":
			return "bg-green-50 text-green-600 border-green-100";
		case "published":
			return "bg-blue-50 text-blue-600 border-blue-100";
		case "cancelled":
			return "bg-zinc-100 text-zinc-500 border-zinc-200";
		case "draft":
			return "bg-amber-50 text-amber-600 border-amber-100";
		default:
			return "bg-muted text-muted-foreground border-border";
	}
}

function formatDateRange(start: Date | null, end: Date | null) {
	const opts: Intl.DateTimeFormatOptions = {
		day: "numeric",
		month: "short",
		year: "numeric",
	};

	if (!start) return "Date TBD";

	const startStr = new Date(start).toLocaleDateString("en-GB", opts);

	if (!end) return startStr;

	const s = new Date(start);
	const e = new Date(end);

	// Same day → single date
	if (s.toDateString() === e.toDateString()) return startStr;

	const endStr = e.toLocaleDateString("en-GB", opts);
	return `${startStr} - ${endStr}`;
}

export function PublicEventCard({
	event,
	organizationSlug,
	className,
}: PublicEventCardProps) {
	const coverImageUrl =
		getEventImageUrl(event.flierImage) || "/landing/a.webp";
	const eventDetailsHref = `/${organizationSlug}/event/${event.slug}`;
	const locationParts = [event.venueCity, event.venueCountry].filter(Boolean);
	const locationStr =
		event.venueName ||
		(locationParts.length > 0 ? locationParts.join(", ") : null);

	return (
		<div className={cn("@container", className)}>
			<Link
				href={eventDetailsHref}
				className="group flex flex-col @sm:flex-row rounded-2xl border border-border/60 bg-card shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden"
			>
				{/* ── Text content ── */}
				<div className="flex-1 flex flex-col justify-between p-5 @sm:p-6 order-2 @sm:order-1">
					{/* Date */}
					<div className="space-y-2">
						<div className="flex items-center gap-1.5 text-xs text-primary font-medium">
							<Calendar className="size-3.5 shrink-0" />
							<span>
								{formatDateRange(event.startDate, event.endDate)}
							</span>
						</div>

						{/* Title */}
						<h3 className="text-base @sm:text-lg font-bold text-foreground leading-snug tracking-tight line-clamp-2 group-hover:text-primary transition-colors">
							{event.title}
						</h3>

						{/* Location */}
						{locationStr && (
							<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
								<MapPin className="size-3.5 shrink-0" />
								<span className="truncate">{locationStr}</span>
							</div>
						)}
					</div>

					{/* Status badge — bottom left */}
					{event.status && (
						<div className="mt-4 @sm:mt-auto @sm:pt-4">
							<span
								className={cn(
									"inline-block text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full border",
									getStatusStyle(event.status),
								)}
							>
								{event.status}
							</span>
						</div>
					)}
				</div>

				{/* ── Image ── */}
				<div className="relative @sm:w-[45%] @sm:max-w-[280px] shrink-0 aspect-[4/3] @sm:aspect-auto order-1 @sm:order-2 overflow-hidden">
					<Image
						src={coverImageUrl}
						alt={event.title}
						fill
						className="object-cover transition-transform duration-500 group-hover:scale-105"
						sizes="(max-width: 640px) 100vw, 280px"
						unoptimized
					/>

					{/* Heart icon overlay */}
					<button
						type="button"
						className="absolute top-3 right-3 z-10 size-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white hover:scale-110 transition-all duration-200 pointer-events-auto"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							// TODO: favorite/wishlist logic
						}}
						aria-label="Add to favorites"
					>
						<Heart className="size-4 text-foreground/70" />
					</button>
				</div>
			</Link>
		</div>
	);
}
