import { getEventImageUrl, getOrgImageUrl } from "@/lib/image-url-utils";

export interface EventDataInput {
	id?: string;
	title?: string;
	description?: string | null;
	startDate?: string | Date | null;
	endDate?: string | Date | null;
	isVirtual?: boolean | null;
	virtualLink?: string | null;
	venueName?: string | null;
	venueAddress?: string | null;
	venueCity?: string | null;
	venueCountry?: string | null;
	flierUrl?: string | null;
	bannerUrl?: string | null;
	flierImage?: string | null;
	bannerImage?: string | null;
	organization?: {
		name?: string;
		logoUrl?: string | null;
		primaryColor?: string | null;
		secondaryColor?: string | null;
		tertiaryColor?: string | null;
	} | null;
}

export interface FormattedEventDisplay {
	bannerImageUrl: string | null;
	logoImageUrl: string | null;
	formattedDate: string | null;
	formattedTime: string | null;
	formattedFullDate: string;
	endsOnStr: string | null;
	locationText: string;
	brandColors: {
		primary: string;
		secondary: string;
		tertiary: string;
	};
}

/**
 * Formats event data into standardized presentation properties for UI components.
 */
export function formatEventDisplay(event: EventDataInput): FormattedEventDisplay {
	const org = event.organization || {};

	const bannerImageUrl = getEventImageUrl(
		event.bannerUrl ||
			event.flierUrl ||
			event.bannerImage ||
			event.flierImage
	);

	const logoImageUrl = getOrgImageUrl(org.logoUrl);

	const startDate = event.startDate ? new Date(event.startDate) : null;
	const endDate = event.endDate ? new Date(event.endDate) : null;

	const formattedDate = startDate
		? startDate.toLocaleDateString("en-US", {
				weekday: "short",
				month: "short",
				day: "numeric",
				year: "numeric",
			})
		: null;

	const formattedTime = startDate
		? startDate.toLocaleTimeString("en-US", {
				hour: "2-digit",
				minute: "2-digit",
			})
		: null;

	const formattedFullDate = startDate
		? startDate.toLocaleDateString("en-US", {
				weekday: "long",
				year: "numeric",
				month: "long",
				day: "numeric",
			})
		: "Date TBA";

	const endsOnStr = endDate
		? endDate.toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
			})
		: null;

	const locationText = event.isVirtual
		? "Virtual Event"
		: [event.venueName, event.venueCity, event.venueCountry]
				.filter(Boolean)
				.join(", ") || "Location TBA";

	const brandColors = {
		primary: org.primaryColor || "#009A44",
		secondary: org.secondaryColor || "#FFD100",
		tertiary: org.tertiaryColor || "#EF3340",
	};

	return {
		bannerImageUrl,
		logoImageUrl,
		formattedDate,
		formattedTime,
		formattedFullDate,
		endsOnStr,
		locationText,
		brandColors,
	};
}

/**
 * React hook wrapper for formatEventDisplay.
 */
export function useEventDisplay(event: EventDataInput): FormattedEventDisplay {
	return formatEventDisplay(event);
}
