import { NoCategoryIllustration } from "@/components/common/NoCategoryIllustration";
import { NoTicketIllustration } from "@/components/common/NoTicketIllustration";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicEventDetails } from "@/lib/dal/public";
import { getEventImageUrl, getOrgImageUrl } from "@/lib/image-url-utils";
import { PublicTicketGrid } from "@/components/event/public/PublicTicketGrid";
import { PublicNomineeSheet } from "@/components/event/public/PublicNomineeSheet";
import { PublicNominationModal } from "@/components/event/public/PublicNominationModal";
import { PanAfricanDivider } from "@/components/shared/PanAficDivider";
import { PoweredByFooter } from "@/components/shared/PoweredByFooter";
import {
	Calendar,
	MapPin,
	Clock,
	Vote,
	Ticket,
	Globe,
	ChevronRight,
	Share2,
	Trophy,
	Users,
	Sparkles,
	ImageIcon,
	ExternalLink,
	Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { formatDate, formatAmount } from "@/lib/utils";
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
		getEventImageUrl(event.bannerUrl || event.flierUrl) ?? "/landing/g.webp";
	const absoluteImage = coverImage.startsWith("http")
		? coverImage
		: `${BASE_URL}${coverImage}`;
	const pageUrl = `${BASE_URL}/${orgSlug}/event/${eventSlug}`;
	const description =
		event.description?.slice(0, 200) ||
		`${event.title} organized by ${event.organization.name} on AfroReality.`;

	return {
		title: `${event.title} | ${event.organization.name}`,
		description,
		openGraph: {
			title: `${event.title} | ${event.organization.name}`,
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
	const bannerUrl = getEventImageUrl(event.bannerUrl);
	const flierUrl = getEventImageUrl(event.flierUrl);
	const orgLogoUrl = getOrgImageUrl(organization.logoUrl);

	const isTicketed = event.type === "ticketed" || event.type === "hybrid";
	const isVoting = event.type === "voting" || event.type === "hybrid";
	const isInternalVoting = event.votingMode === "internal";

	const ticketTypes = event.ticketTypes || [];
	const votingCategories = event.votingCategories || [];
	const sponsors = event.sponsors || [];
	const galleryLinks = event.galleryLinks || [];

	const formattedStartDate = event.startDate
		? formatDate(event.startDate, true)
		: null;
	const formattedEndDate = event.endDate
		? formatDate(event.endDate, true)
		: null;

	return (
		<div className="min-h-screen bg-background text-foreground flex flex-col">
			{/* Top Breadcrumb Navigation Bar */}
			<header className="border-b border-border/80 bg-card/60 backdrop-blur-md sticky top-0 z-40">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between text-xs">
					<div className="flex items-center gap-2 truncate">
						<Link
							href={`/${orgSlug}`}
							className="font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
						>
							{orgLogoUrl && (
								<img
									src={orgLogoUrl}
									alt=""
									className="size-5 rounded-full object-cover border"
								/>
							)}
							{organization.name}
						</Link>
						<ChevronRight className="size-3.5 text-muted-foreground/60" />
						<span className="font-bold text-foreground truncate">
							{event.title}
						</span>
					</div>

					<div className="flex items-center gap-2">
						<Badge
							variant="outline"
							className="text-[10px] uppercase font-bold tracking-wider capitalize"
						>
							{event.type} Event
						</Badge>
					</div>
				</div>
			</header>

			{/* Hero Banner Section */}
			<section className="relative bg-muted/40 border-b border-border/80 overflow-hidden">
				{/* Background Banner Image with Blur Overlay */}
				{bannerUrl ? (
					<div className="absolute inset-0 size-full overflow-hidden">
						<img
							src={bannerUrl}
							alt=""
							className="size-full object-cover opacity-25 dark:opacity-20 blur-sm scale-105"
						/>
						<div className="absolute inset-0 bg-linear-to-t from-background via-background/80 to-transparent" />
					</div>
				) : (
					<div className="absolute inset-0 bg-linear-to-b from-primary/5 via-background to-background" />
				)}

				<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
						{/* Left: Flier Preview */}
						<div className="lg:col-span-4 flex justify-center">
							<div className="relative w-full max-w-xs sm:max-w-sm rounded-2xl overflow-hidden shadow-2xl border-2 border-border/80 bg-card aspect-4/5">
								{flierUrl ? (
									<img
										src={flierUrl}
										alt={event.title}
										className="size-full object-cover"
									/>
								) : (
									<div className="size-full flex flex-col items-center justify-center text-muted-foreground bg-muted/30">
										<ImageIcon className="size-12 mb-2 opacity-40" />
										<span className="text-xs font-semibold">Event Flier</span>
									</div>
								)}
							</div>
						</div>

						{/* Right: Event Information & Key Highlights */}
						<div className="lg:col-span-8 space-y-6">
							<div className="space-y-3">
								<div className="flex flex-wrap items-center gap-2">
									<Badge
										variant="secondary"
										className="text-xs bg-primary/10 text-primary border-primary/20 font-bold"
									>
										{event.category || "Official Event"}
									</Badge>
									{isInternalVoting && (
										<Badge
											variant="outline"
											className="text-xs text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-900/60 gap-1"
										>
											<Lock className="size-3" /> Member Election
										</Badge>
									)}
								</div>

								<h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-tight">
									{event.title}
								</h1>

								<Link
									href={`/${orgSlug}`}
									className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
								>
									<span>Organized by</span>
									<strong className="text-foreground group-hover:underline">
										{organization.name}
									</strong>
								</Link>
							</div>

							{/* Key Metadata Badges */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
								{formattedStartDate && (
									<div className="flex items-center gap-3 p-3.5 rounded-xl bg-card/80 border border-border/60 backdrop-blur-xs">
										<div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
											<Calendar className="size-5" />
										</div>
										<div className="min-w-0">
											<p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
												Date &amp; Time
											</p>
											<p className="text-xs font-semibold text-foreground truncate">
												{formattedStartDate}
											</p>
										</div>
									</div>
								)}

								<div className="flex items-center gap-3 p-3.5 rounded-xl bg-card/80 border border-border/60 backdrop-blur-xs">
									<div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
										<MapPin className="size-5" />
									</div>
									<div className="min-w-0">
										<p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
											Location / Venue
										</p>
										<p className="text-xs font-semibold text-foreground truncate">
											{event.isVirtual
												? "Online / Virtual Event"
												: [event.venueName, event.venueCity, event.venueCountry]
															.filter(Boolean)
															.join(", ") || "Venue TBA"}
										</p>
									</div>
								</div>
							</div>

							{/* Quick Anchor Action Buttons */}
							<div className="flex flex-wrap items-center gap-3 pt-2">
								{isTicketed && ticketTypes.length > 0 && (
									<Button asChild size="lg" className="font-bold text-xs gap-2">
										<a href="#tickets">
											<Ticket className="size-4" /> Get Tickets
										</a>
									</Button>
								)}

								{isVoting && votingCategories.length > 0 && (
									<Button
										asChild
										variant={isTicketed ? "outline" : "default"}
										size="lg"
										className="font-bold text-xs gap-2"
									>
										<a href="#voting">
											<Vote className="size-4" /> Cast Vote
										</a>
									</Button>
								)}
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Main Event Body Content */}
			<main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
				{/* 1. About the Event */}
				{event.description && (
					<section className="space-y-4">
						<div className="flex items-center gap-2 border-b pb-3">
							<Sparkles className="size-4 text-primary" />
							<h2 className="text-xl font-bold text-foreground">
								About This Event
							</h2>
						</div>
						<div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
							<RichTextDisplay content={event.description} />
						</div>
					</section>
				)}

				{/* 2. Tickets Section (if ticketed) */}
				{isTicketed && (
					<section id="tickets" className="space-y-6 pt-4 scroll-mt-20">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
							<div>
								<h2 className="text-2xl font-black text-foreground tracking-tight">
									Tickets &amp; Passes
								</h2>
								<p className="text-xs text-muted-foreground">
									Choose your admission tier and claim tickets instantly
								</p>
							</div>
						</div>

						<PublicTicketGrid
							tickets={ticketTypes.map((t: any) => ({
								id: t.id,
								name: t.name,
								description: t.description,
								price: Number(t.price),
								currency: t.currency || "GHS",
								quantityTotal: t.quantityTotal,
								quantitySold: t.quantitySold,
								salesEnd: t.salesEnd,
								status: t.status,
								orderIdx: t.orderIdx,
								color: t.color,
								primaryColor: t.primaryColor,
								secondaryColor: t.secondaryColor,
								designVariant: t.designVariant,
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
								startDate: event.startDate,
							}}
							organization={{
								id: organization.id,
								name: organization.name,
								logoUrl: organization.logoUrl,
								primaryColor: organization.primaryColor,
								secondaryColor: organization.secondaryColor,
							}}
						/>
					</section>
				)}

				{/* 3. Voting Categories Section (if voting) */}
				{isVoting && (
					<section id="voting" className="space-y-8 pt-4 scroll-mt-20">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
							<div>
								<h2 className="text-2xl font-black text-foreground tracking-tight">
									{isInternalVoting ? "Election Categories" : "Vote for Nominees"}
								</h2>
								<p className="text-xs text-muted-foreground">
									{isInternalVoting
										? "Confidential ballot for registered organization members"
										: "Select your favorite candidates and support them with votes"}
								</p>
							</div>
						</div>

						{votingCategories.length === 0 ? (
							<div className="text-center py-12 px-4 rounded-xl border border-dashed bg-muted/20 flex flex-col items-center justify-center">
<NoCategoryIllustration className="size-48 mb-4 opacity-80" />
								<h4 className="font-semibold text-base">No Categories Published</h4>
								<p className="text-xs text-muted-foreground mt-1">
									Voting categories will appear here once finalized by organizers.
								</p>
							</div>
						) : (
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
								{votingCategories.map((category: any) => {
									const options = category.votingOptions || [];
									return (
										<Link
											key={category.id}
											href={`/${orgSlug}/event/${eventSlug}/category/${category.id}`}
											className="group flex flex-col rounded-2xl border bg-card shadow-xs hover:shadow-xl transition-all duration-300 relative overflow-hidden"
										>
											{category.templateImage && (
												<div className="relative w-full h-44 shrink-0 overflow-hidden bg-muted">
													<img
														src={getEventImageUrl(category.templateImage) || ""}
														alt={category.name}
														className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
													/>
												</div>
											)}

											<div className="p-6 flex flex-col flex-1 bg-card">
												<div className="flex items-start justify-between mb-3">
													<div className="flex items-start gap-3 flex-1 min-w-0 pr-2">
														<div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
															<Trophy className="w-5 h-5 text-primary" />
														</div>
														<h3 className="text-lg font-bold text-foreground uppercase tracking-tight group-hover:text-primary transition-colors line-clamp-2 mt-1">
															{category.name}
														</h3>
													</div>
													<div className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
														<ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
													</div>
												</div>

												{!category.templateImage && category.description && (
													<RichTextDisplay
														content={category.description}
														className="text-xs text-muted-foreground line-clamp-2 mb-4"
													/>
												)}

												<div className="mt-auto pt-3 border-t border-border/60">
													<div className="flex items-center justify-between gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
														<div className="flex items-center gap-1.5">
															<Users className="w-3.5 h-3.5 text-primary" />
															<span>
																{options.length} {options.length === 1 ? "nominee" : "nominees"}
															</span>
														</div>

														<span className="text-[10px] font-bold text-primary hover:underline">
															View Nominees →
														</span>
													</div>

													{options.length > 0 && (
														<div className="flex flex-row items-center pt-2">
															<AnimatedTooltip
																items={options.slice(0, 5).map((nominee: any) => ({
																	id: nominee.id,
																	name: nominee.optionText,
																	designation: nominee.nomineeCode ? `#${nominee.nomineeCode}` : "Nominee",
																	image: getEventImageUrl(nominee.imageUrl),
																}))}
															/>
															{options.length > 5 && (
																<div className="relative w-10 h-10 ml-2 rounded-full border-2 border-background bg-secondary text-secondary-foreground flex items-center justify-center shrink-0 z-40 text-xs font-bold shadow-xs">
																	+{options.length - 5}
																</div>
															)}
														</div>
													)}
												</div>
											</div>
										</Link>
									);
								})}
							</div>
						)}
					</section>
				)}

				{/* 4. Event Sponsors */}
				{sponsors.length > 0 && (
					<section className="space-y-6 pt-4 border-t">
						<div className="text-center space-y-1">
							<h3 className="text-lg font-bold text-foreground">
								Official Sponsors &amp; Partners
							</h3>
							<p className="text-xs text-muted-foreground">
								Proudly supported by our partner organizations
							</p>
						</div>

						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 items-center justify-center">
							{sponsors.map((sponsor: any) => {
								const logo = getEventImageUrl(sponsor.logoUrl);
								return (
									<div
										key={sponsor.id}
										className="p-4 rounded-xl border bg-card/60 flex items-center justify-center h-20 hover:border-primary/40 transition-colors"
										title={sponsor.name}
									>
										{logo ? (
											<img
												src={logo}
												alt={sponsor.name}
												className="max-h-12 max-w-full object-contain"
											/>
										) : (
											<span className="text-xs font-bold text-muted-foreground text-center truncate">
												{sponsor.name}
											</span>
										)}
									</div>
								);
							})}
						</div>
					</section>
				)}

				{/* 5. Official Galleries */}
				{galleryLinks.length > 0 && (
					<section className="space-y-4 pt-4 border-t">
						<h3 className="text-lg font-bold text-foreground">
							Event Albums &amp; Media
						</h3>
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
							{galleryLinks.map((album: any) => (
								<a
									key={album.id}
									href={album.url}
									target="_blank"
									rel="noopener noreferrer"
									className="p-4 rounded-xl border bg-card hover:border-primary/50 transition-colors flex items-center justify-between group"
								>
									<div>
										<h4 className="text-xs font-bold text-foreground group-hover:underline">
											{album.title}
										</h4>
										<p className="text-[10px] text-muted-foreground capitalize">
											{album.provider || "Media Gallery"}
										</p>
									</div>
									<ExternalLink className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
								</a>
							))}
						</div>
					</section>
				)}
			</main>

			<PanAfricanDivider className="my-12" />
			<PoweredByFooter />
		</div>
	);
}
