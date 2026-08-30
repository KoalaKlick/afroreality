import { notFound } from "next/navigation";
import { getPublicEventDetails } from "@/lib/dal/public";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { Section } from "@/components/Landing/shared/Section";
import { PanAfricanDivider } from "@/components/shared/PanAficDivider";
import { PoweredByFooter } from "@/components/shared/PoweredByFooter";
import { EventHero } from "@/components/event/public/EventHero";
import { EventVotingCategories } from "@/components/event/public/EventVotingCategories";
import { EventDetailsSection } from "@/components/event/public/EventDetailsSection";
import { PublicTicketGrid } from "@/components/event/public/PublicTicketGrid";
import { NoTicketIllustration } from "@/components/common/NoTicketIllustration";
import type { Metadata } from "next";

interface PublicEventPageProps {
	params: Promise<{
		slug: string;
		eventSlug: string;
	}>;
}

const BASE_URL =
	process.env.NEXT_PUBLIC_APP_URL ||
	process.env.NEXT_PUBLIC_DOMAIN_URL ||
	process.env.BASE_URL ||
	"https://afroreality.com";

export async function generateMetadata({
	params,
}: PublicEventPageProps): Promise<Metadata> {
	const { slug: orgSlug, eventSlug } = await params;
	const event = await getPublicEventDetails(orgSlug, eventSlug);
	if (!event) return {};

	const coverImage =
		getEventImageUrl(event.bannerUrl || event.flierUrl) ?? "/landing/a.webp";
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
	const socialLinks = event.socialLinks || [];

	const { primaryColor, secondaryColor, tertiaryColor } = organization;

	const brandVars = {
		"--color-brand-primary": primaryColor || "#009A44",
		"--color-brand-secondary": secondaryColor || "#FFD100",
		"--color-brand-tertiary": tertiaryColor || "#EF3340",
	} as React.CSSProperties;

	return (
		<main className="min-h-screen bg-background text-foreground flex flex-col" style={brandVars}>
			{/* 1. Hero Section */}
			<EventHero
				event={event as any}
				orgSlug={orgSlug}
				eventSlug={eventSlug}
			/>

			{/* 2. Voting Categories Section */}
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

			{/* 3. Ticket Section */}
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
						<div className="space-y-10">
							{ticketTypes.length > 0 ? (
								<>
									<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
										<div>
											<div className="flex items-center gap-3 mb-2">
												<h2 className="text-3xl font-bold uppercase tracking-tight">
													Get Tickets.
												</h2>
											</div>
											<p className="max-w-2xl text-sm text-muted-foreground">
												Select your ticket tier below and complete payment securely via Paystack or Mobile Money.
											</p>
										</div>
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
									<NoTicketIllustration className="size-44 mb-6 opacity-80" />
									<h2 className="text-3xl font-black uppercase tracking-tight mb-2">
										No Ticket Tiers Yet.
									</h2>
									<p className="mt-2 max-w-sm mx-auto text-sm text-muted-foreground">
										Ticket tiers haven&apos;t been configured for this event yet. Please check back later for availability.
									</p>
								</div>
							)}
						</div>
					</Section>
				</>
			)}

			<PanAfricanDivider />

			{/* 4. Event Details, Socials, Galleries & Sponsors */}
			<EventDetailsSection
				description={event.description}
				socialLinks={socialLinks}
				galleryLinks={galleryLinks}
				sponsors={sponsors}
			/>

			{/* 5. Brand Footer (Black with dashed top border and logo) */}
			<PoweredByFooter />
		</main>
	);
}
