import { notFound } from "next/navigation";
import { getPublicEventDetails } from "@/lib/dal/public";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { Section } from "@/components/Landing/shared/Section";
import { PanAfricanDivider } from "@/components/shared/PanAficDivider";
import { EventCreationCTABanner } from "@/components/shared/EventCreationCTABanner";
import { EventHero } from "@/components/event/public/EventHero";
import { EventSidebarCard } from "@/components/event/public/EventSidebarCard";
import { EventVotingCategories } from "@/components/event/public/EventVotingCategories";
import { EventDetailsSection } from "@/components/event/public/EventDetailsSection";
import { PublicTicketGrid } from "@/components/event/public/PublicTicketGrid";
import { NoTicketIllustration } from "@/components/common/NoTicketIllustration";
import { getFrontendBaseUrl } from "@/lib/utils";
import type { Metadata } from "next";

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
	const description =
		event.description?.replaceAll(/<[^>]*>/g, "").slice(0, 200) ||
		`${event.title} - organized by ${event.organization.name} on AfroReality.`;

	return {
		title: `${event.title} - ${event.organization.name}`,
		description,
		openGraph: {
			title: `${event.title} - ${event.organization.name}`,
			description,
			url: pageUrl,
			type: "website",
			images: [
				{
					url: absoluteImage,
					width: 1200,
					height: 630,
					alt: event.title,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title: event.title,
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

	const ticketTypes = event.ticketTypes || [];
	const votingCategories = event.votingCategories || [];
	const sponsors = event.sponsors || [];
	const galleryLinks = event.galleryLinks || [];
	const eventSocialLinks = event.socialLinks || [];
	const orgSocialLinks = organization.socialLinks || [];

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

	return (
		<main
			className="min-h-[100svh] bg-background text-foreground flex flex-col justify-between"
			style={brandVars}
		>
			{/* Mobile / Tablet View (< xl) */}
			<div className="flex flex-col xl:hidden flex-1">
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

				<PanAfricanDivider />

				<EventDetailsSection
					description={event.description}
					socialLinks={socialLinks}
					galleryLinks={galleryLinks}
					sponsors={sponsors}
				/>
			</div>

			{/* Large Screen View (xl+) */}
			<div className="hidden xl:flex flex-1 min-h-[100svh] max-w-[96rem] w-full mx-auto px-6 lg:px-8 py-8">
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
							<div id="voting" className="rounded-2xl border bg-card overflow-hidden">
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
					</div>
				</div>
			</div>

			{/* CTA Banner & Brand Footer */}
			<EventCreationCTABanner orgSlug={orgSlug} />
		</main>
	);
}
