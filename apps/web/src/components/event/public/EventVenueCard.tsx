"use client";

import { MapPin, Navigation } from "lucide-react";
import { EventLocationDisplayMap } from "@/components/shared/map";

interface EventVenueCardProps {
	readonly latitude: number;
	readonly longitude: number;
	readonly venueName?: string | null;
	readonly venueAddress?: string | null;
	readonly venueCity?: string | null;
	readonly venueCountry?: string | null;
}

export function EventVenueCard({
	latitude,
	longitude,
	venueName,
	venueAddress,
	venueCity,
	venueCountry,
}: EventVenueCardProps) {
	const locationParts = [venueName, venueAddress, venueCity, venueCountry].filter(Boolean);
	const locationText = locationParts.join(", ") || "Event Location";
	const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

	return (
		<div className="rounded-2xl bg-white dark:bg-card border border-border/80 shadow-xs overflow-hidden p-4 sm:p-5 space-y-3">
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2 min-w-0">
					<div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
						<MapPin className="size-3.5" />
					</div>
					<div className="min-w-0">
						<h3 className="text-xs font-bold uppercase tracking-widest font-millik text-foreground truncate">
							Venue Map
						</h3>
						<p className="text-[11px] text-muted-foreground truncate" title={locationText}>
							{locationText}
						</p>
					</div>
				</div>
			</div>

			<EventLocationDisplayMap
				latitude={latitude}
				longitude={longitude}
				venueName={venueName}
				heightClass="aspect-[7/3] w-full rounded-xl overflow-hidden"
			/>
		</div>
	);
}
