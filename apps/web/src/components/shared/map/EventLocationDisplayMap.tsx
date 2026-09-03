"use client";

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

	// Strictly render ONLY when latitude and longitude are set
	if (!hasCoordinates) {
		return null;
	}

	// Google Maps embed URL zoomed into z=17 for detailed landmark view
	const embedUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&t=&z=17&ie=UTF8&iwloc=&output=embed`;

	return (
		<div
			className={cn(
				"relative w-full rounded-2xl overflow-hidden bg-muted/20 border border-border/60 shadow-sm",
				heightClass,
				className,
			)}
		>
			<iframe
				title={venueName || "Event Location Map"}
				src={embedUrl}
				className="w-full h-full border-0"
				loading="lazy"
				referrerPolicy="no-referrer-when-downgrade"
				allowFullScreen
			/>
		</div>
	);
}
