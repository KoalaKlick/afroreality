import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getPublicEventDetails } from "@/lib/dal/public";
import { getEventImageUrl, getOrgImageUrl } from "@/lib/image-url-utils";
import { Section } from "@/components/Landing/shared/Section";
import { PanAfricanDivider } from "@/components/shared/PanAficDivider";
import { PoweredByFooter } from "@/components/shared/PoweredByFooter";
import { PublicTicketGrid } from "@/components/event/public/PublicTicketGrid";
import { PublicRegistrationForm } from "@/components/event/public/PublicRegistrationForm";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import { EventInfoPill } from "@/components/shared/EventInfoPill";
import { NoCategoryIllustration } from "@/components/common/NoCategoryIllustration";
import { NoTicketIllustration } from "@/components/common/NoTicketIllustration";
import { getSocialPlatform, getGalleryProvider } from "@/lib/utils/event-icons";
import {
	Calendar,
	MapPin,
	Clock,
	Vote,
	ArrowLeft,
	Info,
	Trophy,
	Users,
	ChevronRight,
	ImageIcon,
	Lock,
} from "lucide-react";
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
		: `${BASE_URL}${coverImage}`;
	const pageUrl = `${BASE_URL}/${orgSlug}/event/${eventSlug}`;
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
	const heroImageUrl =
		getEventImageUrl(event.bannerUrl) || getEventImageUrl(event.flierUrl);
	const orgLogoUrl = getOrgImageUrl(organization.logoUrl);

	const isTicketed = event.type === "ticketed" || event.type === "hybrid";
	const isVoting = event.type === "voting" || event.type === "hybrid";
	const isInternalVoting = event.votingMode === "internal";

	const ticketTypes = event.ticketTypes || [];
	const votingCategories = event.votingCategories || [];
	const sponsors = event.sponsors || [];
	const galleryLinks = event.galleryLinks || [];
	const socialLinks = event.socialLinks || [];

	const startDate = event.startDate ? new Date(event.startDate) : null;
	const dateStr = startDate
		? startDate.toLocaleDateString("en-US", {
				weekday: "long",
				year: "numeric",
				month: "long",
				day: "numeric",
			})
		: "Date TBA";

	const timeStr = startDate
		? startDate.toLocaleTimeString("en-US", {
				hour: "2-digit",
				minute: "2-digit",
			})
		: "";

	const endsOnStr = event.endDate
		? new Date(event.endDate).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
			})
		: null;

	const { primaryColor, secondaryColor, tertiaryColor } = organization;

	const brandVars = {
		"--color-brand-primary": primaryColor || "#009A44",
		"--color-brand-secondary": secondaryColor || "#FFD100",
		"--color-brand-tertiary": tertiaryColor || "#EF3340",
	} as React.CSSProperties;

	return (
		<main className="min-h-screen bg-background text-foreground" style={brandVars}>
			{/* Hero Section */}
			<div className="relative h-[50vh] min-h-[420px] w-full overflow-hidden">
				{heroImageUrl ? (
					<Image
						src={heroImageUrl}
						alt={event.title}
						fill
						className="object-cover"
						priority
						unoptimized
					/>
				) : (
					<div
						className="w-full h-full"
						style={{
							background: `linear-gradient(135deg, ${primaryColor || "#009A44"}cc 0%, ${secondaryColor || "#FFD100"}99 50%, ${tertiaryColor || "#EF3340"}cc 100%)`,
						}}
					/>
				)}
				<div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
				<div className="absolute inset-0 flex items-end pb-12">
					<div className="max-w-7xl mx-auto px-6 w-full">
						<Link
							href={`/${orgSlug}`}
							className="flex items-center gap-2 text-white/80 hover:text-white text-sm mb-5 transition-colors"
						>
							{orgLogoUrl ? (
								<Image
									src={orgLogoUrl}
									alt={organization.name}
									width={40}
									height={40}
									className="rounded-md border bg-white/10 border-white/20 object-cover"
									unoptimized
								/>
							) : (
								<ArrowLeft className="size-4" />
							)}
							<span>Back to {organization.name}</span>
						</Link>

						<div className="inline-block items-center bg-primary text-primary-foreground text-xs font-bold uppercase py-1 px-3 rounded-sm mb-4 tracking-widest">
							{event.type.toUpperCase()}
						</div>

						<h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight mb-6">
							{event.title}
						</h1>

						{/* Event Schedule Bar */}
						<div className="flex flex-wrap gap-4 items-center">
							<EventInfoPill
								icon={Calendar}
								label="Date"
								value={dateStr}
							/>

							{timeStr && (
								<EventInfoPill
									icon={Clock}
									label="Time"
									value={timeStr}
								/>
							)}

							<EventInfoPill
								icon={MapPin}
								label="Venue"
								value={event.venueName || "TBA"}
								valueClassName="truncate max-w-[200px]"
							/>

							{endsOnStr && (
								<EventInfoPill
									icon={Calendar}
									label="Ends On"
									value={endsOnStr}
									className="bg-brand-tertiary/20 border-brand-tertiary/40"
								/>
							)}
						</div>

						{/* Action row */}
						<div className="mt-8 flex items-center gap-3 justify-between">
							<a
								href="#details"
								className="inline-flex items-center gap-2 border border-white/30 hover:border-white/60 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-md transition-all duration-200"
							>
								<Info className="size-3.5" />
								About Event
							</a>

							{event.type === "standard" && (
								<PublicRegistrationForm
									eventId={event.id}
									eventTitle={event.title}
									orgSlug={orgSlug}
									eventSlug={eventSlug}
								/>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Voting Categories Section */}
			{isVoting && (
				<>
					<PanAfricanDivider />
					<Section maxWidth="7xl" className="py-16">
						<div>
							<div className="flex items-center gap-3 mb-12">
								<Vote className="size-8 text-primary" />
								<h2 className="text-3xl font-bold uppercase tracking-tight">
									Vote Categories.
								</h2>
							</div>

							{votingCategories.length > 0 ? (
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
									{votingCategories.map((category: any) => (
										<Link
											key={category.id}
											href={`/${orgSlug}/event/${eventSlug}/category/${category.id}`}
											className="group flex flex-col rounded-2xl border bg-card shadow-xs hover:shadow-xl transition-all duration-300 relative overflow-hidden"
										>
											{category.templateImage && (
												<div className="relative w-full h-48 shrink-0 overflow-hidden bg-muted">
													<Image
														src={getEventImageUrl(category.templateImage) || ""}
														alt={category.name}
														fill
														className="object-cover group-hover:scale-105 transition-transform duration-500"
														unoptimized
													/>
												</div>
											)}
											<div className="p-6 flex flex-col flex-1 bg-card">
												<div className="flex items-start justify-between mb-2">
													<div className="flex items-start gap-3 flex-1 min-w-0 pr-4">
														<div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
															<Trophy className="size-5 text-primary" />
														</div>
														<h3 className="text-xl font-bold uppercase tracking-tight group-hover:text-primary transition-colors line-clamp-2 mt-1">
															{category.name}
														</h3>
													</div>
													<div className="size-8 rounded-md bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
														<ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
													</div>
												</div>

												{!category.templateImage && category.description && (
													<p className="text-sm text-muted-foreground line-clamp-2 mb-6">
														{category.description}
													</p>
												)}

												<div className="mt-auto pt-4">
													{!category.templateImage && (
														<div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
															<Users className="size-4" />
															<span>
																{category.votingOptions?.length || 0}{" "}
																{category.votingOptions?.length === 1
																	? "nominee"
																	: "nominees"}
															</span>
														</div>
													)}

													{/* Preview of nominees */}
													{category.votingOptions && category.votingOptions.length > 0 && (
														<div className="flex flex-row items-center mt-1 pt-1 mb-1">
															<AnimatedTooltip
																items={category.votingOptions
																	.slice(0, 5)
																	.map((nominee: any) => ({
																		id: nominee.id,
																		name: nominee.optionText,
																		designation:
																			nominee.nomineeCode || "Nominee",
																		image:
																			getEventImageUrl(nominee.imageUrl) ||
																			"/landing/g.webp",
																	}))}
															/>
															{category.votingOptions.length > 5 && (
																<div className="relative size-10 ml-2 rounded-full border-2 border-background bg-primary flex items-center justify-center shrink-0 z-40 text-primary-foreground text-xs font-bold shadow-xs">
																	+{category.votingOptions.length - 5}
																</div>
															)}
														</div>
													)}
												</div>
											</div>
										</Link>
									))}
								</div>
							) : (
								<div className="flex flex-col items-center justify-center py-12 text-center">
									<NoCategoryIllustration className="size-56 mb-6 opacity-80" />
									<h4 className="text-xl font-bold uppercase tracking-tight mb-2">
										No categories yet.
									</h4>
									<p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
										Voting categories haven&apos;t been set up for this event yet. Check back soon!
									</p>
								</div>
							)}
						</div>
					</Section>
				</>
			)}

			{/* Ticket Section */}
			{isTicketed && (
				<>
					<PanAfricanDivider />
					<Section maxWidth="7xl" className="py-16">
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

			{/* Event Details & Footer Section */}
			<Section maxWidth="7xl" className="py-16 bg-card/30 border-t">
				<div className="mx-auto">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-16">
						{/* Left: About */}
						<div className="md:col-span-2 space-y-8 scroll-mt-10" id="details">
							<div className="space-y-4">
								<h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
									About the Event.
								</h2>
								<div className="prose prose-sm max-w-none text-foreground dark:prose-invert">
									{event.description ? (
										<div
											dangerouslySetInnerHTML={{ __html: event.description }}
										/>
									) : (
										<p className="italic text-muted-foreground">
											No description provided for this event.
										</p>
									)}
								</div>
							</div>

							{/* Social Links */}
							{socialLinks.length > 0 && (
								<div className="space-y-4 pt-4 border-t border-dashed">
									<h3 className="text-xs font-bold uppercase tracking-widest text-primary">
										Event Socials.
									</h3>
									<div className="flex flex-wrap gap-3">
										{socialLinks.map((link: any) => (
											<a
												key={link.id}
												href={link.url}
												target="_blank"
												rel="noopener noreferrer"
												className="size-10 rounded-xl border bg-card flex items-center justify-center hover:bg-primary/10 hover:border-primary hover:text-primary transition-all shadow-xs"
												title={link.url}
											>
												<div className="size-5 flex items-center justify-center">
													{getSocialPlatform(link.url, "size-full").icon}
												</div>
											</a>
										))}
									</div>
								</div>
							)}
						</div>

						{/* Right: Gallery & Sponsors */}
						<div className="space-y-12">
							{/* Gallery Links */}
							{galleryLinks.length > 0 && (
								<div className="space-y-6">
									<h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
										<ImageIcon className="size-5 text-primary" />
										Galleries.
									</h3>
									<div className="space-y-3">
										{galleryLinks.map((link: any) => (
											<a
												key={link.id}
												href={link.url}
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-center justify-between p-3.5 rounded-xl border bg-card hover:border-primary/50 transition-colors shadow-xs group"
											>
												<div className="flex items-center gap-3">
													<div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
														{getGalleryProvider(link.url, "size-4").icon}
													</div>
													<span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
														{getGalleryProvider(link.url).name}
													</span>
												</div>
												<ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
											</a>
										))}
									</div>
								</div>
							)}

							{/* Sponsors */}
							{sponsors.length > 0 && (
								<div className="space-y-6">
									<h3 className="text-xl font-bold uppercase tracking-tight">
										Sponsors &amp; Partners.
									</h3>
									<div className="grid grid-cols-2 gap-3">
										{sponsors.map((sponsor: any) => (
											<div
												key={sponsor.id || sponsor.name}
												className="flex items-center justify-center p-3 rounded-xl border bg-card shadow-xs min-h-[60px]"
											>
												{sponsor.logoUrl ? (
													<img
														src={getEventImageUrl(sponsor.logoUrl)}
														alt={sponsor.name}
														className="max-h-8 max-w-full object-contain"
													/>
												) : (
													<span className="text-xs font-bold text-center">
														{sponsor.name}
													</span>
												)}
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</Section>

			<PanAfricanDivider />
			<PoweredByFooter />
		</main>
	);
}
