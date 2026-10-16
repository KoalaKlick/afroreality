"use client";

import { ExternalLink, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventLocationDisplayMapProps {
	readonly latitude?: number | null;
	readonly longitude?: number | null;
	readonly venueName?: string | null;
	readonly className?: string;
	readonly heightClass?: string;
}

export function EventLocationDisplayMap({
	latitude,
	longitude,
	venueName,
	className,
	heightClass = "aspect-video",
}: EventLocationDisplayMapProps) {
	const hasCoordinates =
		latitude !== null &&
		latitude !== undefined &&
		longitude !== null &&
		longitude !== undefined &&
		!isNaN(Number(latitude)) &&
		!isNaN(Number(longitude));

	if (!hasCoordinates) {
		return null;
	}

	const lat = Number(latitude);
	const lng = Number(longitude);

	const embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
	const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

	return (
		<div
			className={cn(
				"relative w-full rounded-2xl overflow-hidden bg-muted/30 border border-border/60 shadow-xs group select-none",
				heightClass,
				className,
			)}
		>
			{/* Google Maps iframe positioned to hide the intrusive bottom shortcuts/terms bar */}
			<iframe
				title={venueName || "Google Map Event Location"}
				src={embedUrl}
				className="absolute inset-0 w-full border-0"
				style={{
					height: "calc(100% + 36px)",
					marginBottom: "-36px",
				}}
				loading="lazy"
				referrerPolicy="no-referrer-when-downgrade"
			/>
		</div>
	);
}
