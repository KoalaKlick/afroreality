import { notFound } from "next/navigation";
import { getPublicEventDetails } from "@/lib/dal/public";
import { getEventImageUrl, getOrgImageUrl } from "@/lib/image-url-utils";
import { Section } from "@/components/Landing/shared/Section";
import { PanAfricanDivider } from "@/components/shared/PanAficDivider";
import { EventCreationCTABanner } from "@/components/shared/EventCreationCTABanner";
import { EventHero } from "@/components/event/public/EventHero";
import { EventSidebarCard } from "@/components/event/public/EventSidebarCard";
import { EventVotingCategories } from "@/components/event/public/EventVotingCategories";
import { EventDetailsSection } from "@/components/event/public/EventDetailsSection";
import { StandardEventContent } from "@/components/event/public/StandardEventContent";
import { PublicTicketGrid } from "@/components/event/public/PublicTicketGrid";
import { NoTicketIllustration } from "@/components/common/NoTicketIllustration";
import { UssdFloatingWidget } from "@/components/event/public/UssdFloatingWidget";
import { EventGallery } from "@/components/shared/EventGallery";
import { getFrontendBaseUrl } from "@/lib/utils";
import { ImageIcon, AlertTriangle } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface PublicEventPageProps {
	params: Promise<{
		slug: string;
		eventSlug: string;
	}>;
}

const BASE_URL = getFrontendBaseUrl();

export async function generateMetadata({
	params,
}: PublicEventPageProps): Promise<Metadata> {
	const { slug: orgSlug, eventSlug } = await params;
	const event = await getPublicEventDetails(orgSlug, eventSlug);
	if (!event) return {};

	const coverImage =
		getEventImageUrl(
			event.flierUrl ||
			event.bannerUrl ||
			(event as any).flierImage ||
			(event as any).bannerImage,
		) ?? "/landing/a.webp";
	const absoluteImage = coverImage.startsWith("http")
		? coverImage
		: `${BASE_URL.replace(/\/$/, "")}${coverImage}`;
	const pageUrl = `${BASE_URL.replace(/\/$/, "")}/${orgSlug}/event/${eventSlug}`;
	const rawDesc = event.description?.replaceAll(/<[^>]*>/g, "").slice(0, 180) || "";
	const description = rawDesc
		? `${rawDesc} - Hosted on Fextiva, the African event hosting, ticketing & secure voting platform.`
		: `${event.title} - organized by ${event.organization.name} on Fextiva, the African event hosting, ticketing & secure voting platform.`;

	return {
		title: `${event.title} | Fextiva African Event Hosting & Ticketing`,
		description,
		keywords: [
			'Event Hosting Platform',
			'African Ticketing',
			'Secure Event Voting',
			'Fextiva',
			`${event.title} tickets`,
			`${event.title} voting`,
			event.organization.name,
			event.venueCity || 'Ghana Events',
			'Online Event Ticketing Africa',
			'USSD Event Ticketing',
			'Eventbrite Africa Alternative',
		],
		category: 'Event Hosting, African Ticketing & Voting Platform',
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

export default async function PublicEventPage({
	params,
}: PublicEventPageProps) {
	const { slug: orgSlug, eventSlug } = await params;
	const event = await getPublicEventDetails(orgSlug, eventSlug);

	if (!event) {
		notFound();
	}

	const { organization } = event;

	const isTicketed = event.type === "ticketed" || event.type === "hybrid";
	const isVoting = event.type === "voting" || event.type === "hybrid";
	const isStandard = event.type === "standard" || (!isTicketed && !isVoting);

	const ticketTypes = event.ticketTypes || [];
	const votingCategories = event.votingCategories || [];
	const sponsors = event.sponsors || [];
	const galleryLinks = event.galleryLinks || [];
	const eventSocialLinks = event.socialLinks || [];
	const orgSocialLinks = organization.socialLinks || [];

	const isEnded =
		event.status === "ended" ||
		event.status === "cancelled" ||
		(Boolean(event.endDate) && new Date(event.endDate).getTime() < Date.now());

	// Merge event & organization social links so organizer handles repeat on the event page
	const socialLinksMap = new Map<string, any>();
	const normalizeUrl = (url: string) => {
		try {
			const u = new URL(url.startsWith("http") ? url : `https://${url}`);
			return (u.hostname + u.pathname).toLowerCase().replace(/\/$/, "");
		} catch {
			return url.toLowerCase().trim();
		}
	};

	for (const link of eventSocialLinks) {
		if (link.url) socialLinksMap.set(normalizeUrl(link.url), link);
	}
	for (const link of orgSocialLinks) {
		if (link.url && !socialLinksMap.has(normalizeUrl(link.url))) {
			socialLinksMap.set(normalizeUrl(link.url), link);
		}
	}
	if (organization.websiteUrl && !socialLinksMap.has(normalizeUrl(organization.websiteUrl))) {
		socialLinksMap.set(normalizeUrl(organization.websiteUrl), {
			id: "org-website",
			url: organization.websiteUrl,
			platform: "Website",
		});
	}

	const socialLinks = Array.from(socialLinksMap.values());

	const { primaryColor, secondaryColor, tertiaryColor } = organization;

	const brandVars = {
		"--color-brand-primary": primaryColor || "#009A44",
		"--color-brand-secondary": secondaryColor || "#FFD100",
		"--color-brand-tertiary": tertiaryColor || "#EF3340",
	} as React.CSSProperties;

	const ticketsContent = (
		<div className="space-y-6">
			{ticketTypes.length > 0 ? (
				<>
					<div className="flex flex-col gap-2">
						<h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
							Get Tickets.
						</h2>
						<p className="text-xs text-muted-foreground">
							Select your ticket tier below and complete payment securely.
						</p>
					</div>

					<PublicTicketGrid
						tickets={ticketTypes.map((ticket: any) => ({
							...ticket,
							price: Number(ticket.price),
							salesEnd:
								ticket.salesEnd instanceof Date
									? ticket.salesEnd.toISOString()
									: ticket.salesEnd ?? null,
							designVariant: ticket.designVariant,
						}))}
						orgSlug={orgSlug}
						eventSlug={eventSlug}
						isEnded={isEnded}
						event={{
							id: event.id,
							organizationId: event.organizationId,
							title: event.title,
							flierImage: event.flierUrl,
							bannerImage: event.bannerUrl,
							isVirtual: event.isVirtual,
							virtualLink: event.virtualLink,
							venueName: event.venueName,
							venueCity: event.venueCity,
							venueCountry: event.venueCountry,
							startDate:
								event.startDate instanceof Date
									? event.startDate.toISOString()
									: event.startDate ?? null,
						}}
						organization={{
							name: organization.name,
							logoUrl: organization.logoUrl,
							primaryColor: organization.primaryColor,
							secondaryColor: organization.secondaryColor,
						}}
					/>
				</>
			) : (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<NoTicketIllustration className="size-40 mb-4 opacity-80" />
					<h2 className="text-2xl font-black uppercase tracking-tight mb-2">
						No Ticket Tiers Yet.
					</h2>
					<p className="text-xs text-muted-foreground max-w-sm mx-auto">
						Ticket tiers haven&apos;t been configured for this event yet. Please check back later.
					</p>
				</div>
			)}
		</div>
	);

	// Schema.org JSON-LD structured data: Dynamic Event Page Blueprint aligned with Fextiva platform architecture
	const eventPageUrl = `${BASE_URL.replace(/\/$/, "")}/${orgSlug}/event/${eventSlug}`;
	const eventCover =
		getEventImageUrl(
			event.flierUrl ||
			event.bannerUrl ||
			(event as any).flierImage ||
			(event as any).bannerImage,
		) ?? "/landing/a.webp";
	const eventAbsoluteImage = eventCover.startsWith("http")
		? eventCover
		: `${BASE_URL.replace(/\/$/, "")}${eventCover}`;

	const countryToIsoCode: Record<string, string> = {
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
	const countryCode =
		countryToIsoCode[event.venueCountry] ||
		(event.venueCountry?.length === 2
			? event.venueCountry.toUpperCase()
			: "GH");

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
					validFrom: t.salesStart ? new Date(t.salesStart).toISOString() : undefined,
				}))
			: {
					"@type": "Offer",
					url: eventPageUrl,
					category: "Ticketing / Voting",
					price: 0,
					priceCurrency: "GHS",
					availability: "https://schema.org/InStock",
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
			url: `${BASE_URL.replace(/\/$/, "")}/${orgSlug}`,
			...(organization.logoUrl ? { logo: getOrgImageUrl(organization.logoUrl) } : {}),
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

	const schemaGraph: any = {
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
								url: BASE_URL,
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

	return (
		<main
			className="min-h-[100svh] bg-background @7xl:bg-primary- text-foreground flex flex-col justify-between"
			style={brandVars}
		>
			{/* Schema.org JSON-LD Structured Data */}
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
			/>

			{/* Mobile / Tablet View (< xl) */}
			<div className="flex flex-col xl:hidden flex-1">
				{isEnded && (
					<div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-3 flex items-center justify-center gap-2 text-amber-700 dark:text-amber-400">
						<AlertTriangle className="size-4 shrink-0" />
						<p className="text-xs font-bold uppercase tracking-wider">
							This event has ended &mdash; you&apos;re viewing an archive.
						</p>
					</div>
				)}
				<EventHero
					event={event as any}
					orgSlug={orgSlug}
					eventSlug={eventSlug}
					socialLinks={socialLinks}
					sponsors={sponsors}
				/>

				{isVoting && (
					<>
						<PanAfricanDivider />
						<EventVotingCategories
							categories={votingCategories}
							orgSlug={orgSlug}
							eventSlug={eventSlug}
						/>
					</>
				)}

				{isTicketed && (
					<>
						<PanAfricanDivider />
						<Section
							maxWidth="7xl"
							className="py-16 transition-colors"
							style={{
								backgroundColor:
									"color-mix(in srgb, var(--color-brand-primary, #009A44) 3.5%, transparent)",
							}}
						>
							{ticketsContent}
						</Section>
					</>
				)}

				{isStandard && (
					<>
						<PanAfricanDivider />
						<Section maxWidth="7xl" className="py-8">
							<StandardEventContent
								event={event as any}
								orgSlug={orgSlug}
								eventSlug={eventSlug}
							/>
						</Section>
					</>
				)}

				<PanAfricanDivider />

				<EventDetailsSection
					description={event.description}
					category={event.category}
					tags={event.tags}
					socialLinks={socialLinks}
					galleryLinks={galleryLinks}
					galleryImages={(event as any).galleryImages || []}
					sponsors={sponsors}
					latitude={event.latitude}
					longitude={event.longitude}
					venueName={event.venueName}
					venueAddress={event.venueAddress}
					venueCity={event.venueCity}
					venueCountry={event.venueCountry}
					isVirtual={event.isVirtual}
				/>
			</div>

			{/* Large Screen View (xl+) */}
			<div className="hidden xl:flex flex-col flex-1 min-h-[100svh] max-w-[96rem] w-full mx-auto px-6 lg:px-8 py-8">
				{isEnded && (
					<div className="mb-6 rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 flex items-center justify-center gap-2 text-amber-700 dark:text-amber-400">
						<AlertTriangle className="size-4 shrink-0" />
						<p className="text-xs font-bold uppercase tracking-wider">
							This event has ended &mdash; you&apos;re viewing an archive.
						</p>
					</div>
				)}
				<div className="grid grid-cols-12 gap-8 w-full items-start">
					{/* Left Column: Sticky Sidebar Panel */}
					<aside className="col-span-4 sticky top-6 max-h-[calc(100svh-3rem)] overflow-y-auto pr-1">
						<EventSidebarCard
							event={event}
							socialLinks={socialLinks}
							galleryLinks={galleryLinks}
							sponsors={sponsors}
							orgSlug={orgSlug}
							eventSlug={eventSlug}
						/>
					</aside>

					{/* Right Column: Content Feed */}
					<div className="col-span-8 space-y-6">
						{isVoting && (
							<div id="voting" className="rounded-2xl bg-card overflow-hidden">
								<EventVotingCategories
									categories={votingCategories}
									orgSlug={orgSlug}
									eventSlug={eventSlug}
								/>
							</div>
						)}

						{isTicketed && (
							<div
								id="tickets"
								className="rounded-2xl border bg-card p-8 transition-colors"
								style={{
									backgroundColor:
										"color-mix(in srgb, var(--color-brand-primary, #009A44) 3.5%, transparent)",
								}}
							>
								{ticketsContent}
							</div>
						)}

						{isStandard && (
							<StandardEventContent
								event={event as any}
								orgSlug={orgSlug}
								eventSlug={eventSlug}
							/>
						)}

						{/* Event Gallery for Desktop */}
						{((event as any).galleryImages?.length > 0) && (
							<div className="rounded-2xl border bg-card p-6 space-y-4">
								<h3 className="text-lg font-bold uppercase tracking-tight flex items-center gap-2">
									<ImageIcon className="size-5 text-primary" />
									Event Gallery
								</h3>
								<EventGallery
									images={(event as any).galleryImages}
									maxDisplay={5}
								/>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* CTA Banner & Brand Footer */}
			<EventCreationCTABanner orgSlug={orgSlug} />

			{/* Floating Bottom-Right USSD Widget */}
			{event.hasUssd && event.ussdCode && (
				<UssdFloatingWidget
					eventTitle={event.title}
					ussdCode={event.ussdCode}
					primaryColor={organization.primaryColor || undefined}
				/>
			)}
		</main>
	);
}
