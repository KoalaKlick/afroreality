import { getEventImageUrl, getOrgImageUrl } from "@/lib/image-url-utils";
import type { Metadata } from "next";

const COUNTRY_TO_ISO_CODE: Record<string, string> = {
	Ghana: "GH",
	Nigeria: "NG",
	Kenya: "KE",
	"South Africa": "ZA",
	Rwanda: "RW",
	Uganda: "UG",
	Tanzania: "TZ",
	Cameroon: "CM",
	"Ivory Coast": "CI",
	"Côte d'Ivoire": "CI",
	Senegal: "SN",
};

interface BuildEventSchemaOptions {
	event: any;
	organization: any;
	orgSlug: string;
	eventSlug: string;
	baseUrl: string;
	ticketTypes: any[];
	sponsors: any[];
	isVoting: boolean;
}

/**
 * Builds Schema.org JSON-LD structured data graph for event pages.
 */
export function buildEventSchemaGraph({
	event,
	organization,
	orgSlug,
	eventSlug,
	baseUrl,
	ticketTypes,
	sponsors,
	isVoting,
}: BuildEventSchemaOptions) {
	const cleanBaseUrl = baseUrl.replace(/\/$/, "");
	const eventPageUrl = `${cleanBaseUrl}/${orgSlug}/event/${eventSlug}`;
	const eventCover =
		getEventImageUrl(
			event.flierUrl ||
			event.bannerUrl ||
			event.flierImage ||
			event.bannerImage,
		) ?? "/landing/a.webp";
	const eventAbsoluteImage = eventCover.startsWith("http")
		? eventCover
		: `${cleanBaseUrl}${eventCover}`;

	const countryCode =
		COUNTRY_TO_ISO_CODE[event.venueCountry] ||
		(event.venueCountry?.length === 2
			? event.venueCountry.toUpperCase()
			: "GH");

	const defaultValidFrom = event.createdAt
		? new Date(event.createdAt).toISOString()
		: event.startDate
			? new Date(event.startDate).toISOString()
			: new Date().toISOString();

	const eventOffers =
		ticketTypes.length > 0
			? ticketTypes.map((t: any) => ({
					"@type": "Offer",
					name: t.name,
					price: t.price,
					priceCurrency: "GHS",
					category: "Ticketing / Voting",
					availability:
						t.status === "available"
							? "https://schema.org/InStock"
							: "https://schema.org/SoldOut",
					url: eventPageUrl,
					validFrom: t.salesStart
						? new Date(t.salesStart).toISOString()
						: t.createdAt
							? new Date(t.createdAt).toISOString()
							: defaultValidFrom,
				}))
			: {
					"@type": "Offer",
					url: eventPageUrl,
					category: "Ticketing / Voting",
					price: 0,
					priceCurrency: "GHS",
					availability: "https://schema.org/InStock",
					validFrom: defaultValidFrom,
				};

	const eventJsonLd: any = {
		"@type": "Event",
		name: `${event.title} on Fextiva`,
		description:
			event.description?.replaceAll(/<[^>]*>/g, "").slice(0, 300) ||
			`${event.title} - African event hosting, ticketing and secure voting on Fextiva.`,
		url: eventPageUrl,
		image: [eventAbsoluteImage],
		startDate: event.startDate ? new Date(event.startDate).toISOString() : undefined,
		endDate: event.endDate ? new Date(event.endDate).toISOString() : undefined,
		eventStatus: "https://schema.org/EventScheduled",
		eventAttendanceMode: event.isVirtual
			? "https://schema.org/OnlineEventAttendanceMode"
			: "https://schema.org/OfflineEventAttendanceMode",
		location: event.isVirtual
			? {
					"@type": "VirtualLocation",
					url: event.virtualLink || eventPageUrl,
				}
			: {
					"@type": "Place",
					name: event.venueName || event.venueCity || "Event Venue",
					address: {
						"@type": "PostalAddress",
						streetAddress: event.venueAddress || undefined,
						addressLocality: event.venueCity || undefined,
						addressCountry: countryCode,
					},
					...(event.latitude && event.longitude
						? {
								geo: {
									"@type": "GeoCoordinates",
									latitude: event.latitude,
									longitude: event.longitude,
								},
							}
						: {}),
				},
		organizer: {
			"@type": "Organization",
			name: organization.name,
			url: `${cleanBaseUrl}/${orgSlug}`,
			...(organization.logoUrl ? { logo: getOrgImageUrl(organization.logoUrl) } : {}),
		},
		performer: {
			"@type": "PerformingGroup",
			name: organization.name,
			url: `${cleanBaseUrl}/${orgSlug}`,
		},
		offers: eventOffers,
		...(sponsors.length > 0
			? {
					sponsor: sponsors.map((s: any) => ({
						"@type": "Organization",
						name: s.name,
					})),
				}
			: {}),
	};

	return {
		"@context": "https://schema.org",
		"@graph": [
			eventJsonLd,
			...(isVoting
				? [
						{
							"@type": "WebPage",
							"@id": `${eventPageUrl}#voting`,
							name: `${event.title} - Secure African Event Voting`,
							description: `Cast secure votes for nominees and contestants in ${event.title} on Fextiva event voting platform.`,
							isPartOf: {
								"@type": "WebSite",
								name: "Fextiva",
								url: cleanBaseUrl,
								description:
									"Premier African Event Hosting, Ticketing & Secure Voting Platform",
							},
							about: {
								"@type": "Thing",
								name: "VotingSystem",
								description:
									"Secure Pan-African event voting system for pageants, awards, and competitions",
							},
						},
					]
				: []),
		],
	};
}

/**
 * Builds Metadata for public event pages.
 */
export function buildEventPageMetadata(
	event: any,
	orgSlug: string,
	eventSlug: string,
	baseUrl: string,
): Metadata {
	const cleanBaseUrl = baseUrl.replace(/\/$/, "");
	const coverImage =
		getEventImageUrl(
			event.flierUrl ||
			event.bannerUrl ||
			event.flierImage ||
			event.bannerImage,
		) ?? "/landing/a.webp";
	const absoluteImage = coverImage.startsWith("http")
		? coverImage
		: `${cleanBaseUrl}${coverImage}`;
	const pageUrl = `${cleanBaseUrl}/${orgSlug}/event/${eventSlug}`;
	const rawDesc = event.description?.replaceAll(/<[^>]*>/g, "").slice(0, 180) || "";
	const description = rawDesc
		? `${rawDesc} - Hosted on Fextiva, the African event hosting, ticketing & secure voting platform.`
		: `${event.title} - organized by ${event.organization.name} on Fextiva, the African event hosting, ticketing & secure voting platform.`;

	return {
		title: `${event.title} | Fextiva African Event Hosting & Ticketing`,
		description,
		keywords: [
			"Event Hosting Platform",
			"African Ticketing",
			"Secure Event Voting",
			"Fextiva",
			`${event.title} tickets`,
			`${event.title} voting`,
			event.organization.name,
			event.venueCity || "Ghana Events",
			"Online Event Ticketing Africa",
			"USSD Event Ticketing",
			"Eventbrite Africa Alternative",
		],
		category: "Event Hosting, African Ticketing & Voting Platform",
		openGraph: {
			title: `${event.title} - ${event.organization.name} | Fextiva`,
			description,
			url: pageUrl,
			type: "website",
			siteName: "Fextiva - African Event Hosting, Ticketing & Secure Voting",
			images: [
				{
					url: absoluteImage,
					width: 1200,
					height: 630,
					alt: `${event.title} - African Event Ticketing & Voting on Fextiva`,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title: `${event.title} | Fextiva`,
			description,
			images: [absoluteImage],
		},
	};
}
