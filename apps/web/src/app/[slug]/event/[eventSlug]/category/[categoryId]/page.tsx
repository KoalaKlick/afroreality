import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicCategoryDetails } from "@/lib/dal/public";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { PublicNomineeSheet } from "@/components/event/public/PublicNomineeSheet";
import { CategorySidebarCard } from "@/components/event/public/CategorySidebarCard";
import { PanAfricanDivider } from "@/components/shared/PanAficDivider";
import { EventCreationCTABanner } from "@/components/shared/EventCreationCTABanner";
import { Section } from "@/components/Landing/shared/Section";
import { OrgGeometricBanner } from "@/components/common/OrgGeometricBanner";
import { getSocialPlatform, getGalleryProvider } from "@/lib/utils/event-icons";
import { SocialLinksList } from "@/components/shared/SocialLinksList";
import { SponsorsList } from "@/components/shared/SponsorsList";
import {
	ChevronRight,
	Trophy,
	ArrowLeft,
	Lock,
	ImageIcon,
	ExternalLink,
	Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { UssdFloatingWidget } from "@/components/event/public/UssdFloatingWidget";
import { getFrontendBaseUrl } from "@/lib/utils";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface CategoryPageProps {
	params: Promise<{
		slug: string;
		eventSlug: string;
		categoryId: string;
	}>;
}

const BASE_URL = getFrontendBaseUrl();

export async function generateMetadata({
	params,
}: CategoryPageProps): Promise<Metadata> {
	const { slug: orgSlug, eventSlug, categoryId } = await params;
	const data = await getPublicCategoryDetails(orgSlug, eventSlug, categoryId);
	if (!data) return {};

	const { event, category } = data;
	const coverImage =
		getEventImageUrl(category.templateImage || event.flierUrl) ??
		"/landing/g.webp";
	const absoluteImage = coverImage.startsWith("http")
		? coverImage
		: `${BASE_URL}${coverImage}`;
	const pageUrl = `${BASE_URL}/${orgSlug}/event/${eventSlug}/category/${categoryId}`;

	return {
		title: `${category.name} | ${event.title}`,
		description:
			category.description ||
			`Vote for your favorite nominee in ${category.name} at ${event.title}.`,
		openGraph: {
			title: `${category.name} | ${event.title}`,
			description: category.description || `Vote for nominees in ${category.name}.`,
			url: pageUrl,
			type: "website",
			images: [
				{
					url: absoluteImage,
					width: 1200,
					height: 630,
					alt: category.name,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title: `${category.name} | ${event.title}`,
			description: category.description || `Vote in ${category.name}.`,
			images: [absoluteImage],
		},
	};
}

export default async function PublicCategoryPage({
	params,
}: CategoryPageProps) {
	const { slug: orgSlug, eventSlug, categoryId } = await params;
	const data = await getPublicCategoryDetails(orgSlug, eventSlug, categoryId);

	if (!data) {
		notFound();
	}

	const { event, category } = data;
	const { organization } = event;
	const isInternalVoting = event.votingMode === "internal";

	const isEnded =
		event.status === "ended" ||
		event.status === "cancelled" ||
		(Boolean(event.endDate) && new Date(event.endDate).getTime() < Date.now());

	const isUpcoming = Boolean(
		event.startDate && new Date(event.startDate).getTime() > Date.now()
	);

	const { primaryColor, secondaryColor, tertiaryColor } = organization;
	const brandPrimary = primaryColor || "#009A44";
	const brandVars = {
		"--color-brand-primary": brandPrimary,
		"--color-brand-secondary": secondaryColor || "#FFD100",
		"--color-brand-tertiary": tertiaryColor || "#EF3340",
	} as React.CSSProperties;

	const sponsors = event.sponsors || [];
	const galleryLinks = event.galleryLinks || [];
	const eventSocialLinks = event.socialLinks || [];
	const orgSocialLinks = organization.socialLinks || [];

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

	const nomineeContent = (
		<PublicNomineeSheet
			category={{
				id: category.id,
				name: category.name,
				description: category.description,
				votePrice: Number(category.votePrice || 0),
				nominationPrice: Number(category.nominationPrice || 0),
				allowPublicNomination: category.allowPublicNomination,
				allowMultiple: false,
				showTotalVotesPublicly: category.showTotalVotesPublicly,
				templateConfig: (category as any).templateConfig,
				votingOptions: category.votingOptions || [],
			}}
			eventId={event.id}
			isEnded={isEnded}
			isUpcoming={isUpcoming}
			startDate={event.startDate}
			votingMode={event.votingMode || "general"}
			brandVars={brandVars}
			orgSlug={orgSlug}
			eventSlug={eventSlug}
		/>
	);

	const heroImg = getEventImageUrl(
		category.templateImage || event.flierUrl || event.bannerUrl || (event as any).flierImage
	);

	return (
		<main
			className="min-h-[100svh] text-foreground flex flex-col justify-between"
			style={{
				...brandVars,
				backgroundColor: `color-mix(in srgb, ${brandPrimary} 7%, #ffffff)`,
			}}
		>
			{/* Mobile / Tablet View (< xl) */}
			<div className="flex flex-col xl:hidden flex-1 @container/content">
				<div className="relative w-full overflow-hidden bg-background">
					<div className="relative h-48 sm:h-64 md:h-80 w-full overflow-hidden bg-muted/30">
						{heroImg ? (
							<img
								src={heroImg}
								alt={category.name}
								className="w-full h-full object-cover"
							/>
						) : (
							<OrgGeometricBanner
								primaryColor={organization.primaryColor}
								secondaryColor={organization.secondaryColor}
								tertiaryColor={organization.tertiaryColor}
							/>
						)}
					</div>

					<header className="border-b border-border/80 bg-card/60 backdrop-blur-md sticky top-0 z-40">
						<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between text-xs">
							<div className="flex items-center gap-2 truncate">
								<Link
									href={`/${orgSlug}`}
									className="font-semibold text-muted-foreground hover:text-foreground transition-colors"
								>
									{organization.name}
								</Link>
								<ChevronRight className="size-3.5 text-muted-foreground/60" />
								<Link
									href={`/${orgSlug}/event/${eventSlug}`}
									className="font-semibold text-muted-foreground hover:text-foreground transition-colors truncate"
								>
									{event.title}
								</Link>
								<ChevronRight className="size-3.5 text-muted-foreground/60" />
								<span className="font-bold text-foreground truncate">
									{category.name}
								</span>
							</div>

							<Button asChild variant="ghost" size="sm" className="h-8 gap-1 text-xs">
								<Link href={`/${orgSlug}/event/${eventSlug}`}>
									<ArrowLeft className="size-3.5" /> Back to Event
								</Link>
							</Button>
						</div>
					</header>

					{isUpcoming && event.startDate && (
						<div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-3 flex items-center justify-center gap-2 text-amber-700 dark:text-amber-400">
							<Clock className="size-4 shrink-0" />
							<p className="text-xs font-bold uppercase tracking-wider">
								Voting has not started yet &mdash; opens on {new Date(event.startDate).toLocaleString("en-GH", {
									dateStyle: "medium",
									timeStyle: "short",
								})}.
							</p>
						</div>
					)}

					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
						<div className="space-y-6 max-w-4xl">
							<div className="flex flex-wrap items-center gap-2">
								<Badge
									className="text-xs font-bold rounded-sm px-2.5 py-0.5 bg-primary/15 text-primary border border-primary/30 shadow-2xs select-none"
								>
									Voting Category
								</Badge>
								{isInternalVoting && (
									<Badge
										variant="outline"
										className="text-xs text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-900/60 gap-1 rounded-sm"
									>
										<Lock className="size-3" /> Member Ballot
									</Badge>
								)}
							</div>

							<h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight uppercase leading-[1.1] font-millik">
								{category.name}
							</h1>

							{category.description && (
								<div className="max-w-3xl text-sm sm:text-base text-muted-foreground leading-relaxed">
									<RichTextDisplay content={category.description} />
								</div>
							)}
						</div>
					</div>
				</div>

				<PanAfricanDivider />

				<div
					className="flex-1 w-full py-12 transition-colors"
				>
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="mb-6">
							<h2 className="text-xl font-medium font-millik tracking-widest uppercase text-muted-foreground">
								Nominees &amp; Candidates
							</h2>
							<p className="text-xs text-muted-foreground mt-0.5">
								Cast your votes or submit a public nomination below.
							</p>
						</div>
						{nomineeContent}
					</div>
				</div>

				{(sponsors.length > 0 || galleryLinks.length > 0 || socialLinks.length > 0) && (
					<Section maxWidth="7xl" className="py-14 border-t bg-background">
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
							{sponsors.length > 0 && (
								<div className="space-y-4">
									<h3 className="text-xl font-medium font-millik tracking-widest uppercase text-muted-foreground flex items-center gap-2.5">
										<Trophy className="size-4 text-primary" />
										<span>Official Sponsors</span>
									</h3>
									<div className="flex flex-wrap gap-2.5">
										{sponsors.slice(0, 15).map((sponsor: any) => {
											const imgKey = sponsor.logoUrl || sponsor.logo;
											const imgUrl = imgKey ? getEventImageUrl(imgKey) : null;
											return (
												<div
													key={sponsor.id || sponsor.name}
													className="size-10 p-1.5 border rounded-lg bg-card flex items-center justify-center grayscale hover:grayscale-0 transition-all cursor-help"
													title={sponsor.name}
												>
													{imgUrl ? (
														<img
															src={imgUrl}
															alt={sponsor.name}
															className="object-contain max-h-full max-w-full"
														/>
													) : (
														<span className="text-[6px] font-bold text-center leading-none truncate uppercase tracking-tighter">
															{sponsor.name}
														</span>
													)}
												</div>
											);
										})}
									</div>
								</div>
							)}

							{galleryLinks.length > 0 && (
								<div className="space-y-4">
									<h3 className="text-xl font-medium font-millik tracking-widest uppercase text-muted-foreground flex items-center gap-2.5">
										<ExternalLink className="size-4 text-primary" />
										<span>External Photo Albums</span>
									</h3>
									<div className="space-y-2.5">
										{galleryLinks.map((link: any) => {
											const provider = getGalleryProvider(link.url, "size-5");
											return (
												<a
													key={link.id || link.url}
													href={link.url}
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center justify-between p-3 rounded-xl border bg-card hover:border-primary/50 transition-colors group"
												>
													<div className="flex items-center gap-3 min-w-0">
														<div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
															{provider.icon}
														</div>
														<div className="min-w-0">
															<span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors block truncate">
																{link.name || provider.name}
															</span>
															<span className="text-[11px] text-muted-foreground">
																View album on {provider.name}
															</span>
														</div>
													</div>
													<ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
												</a>
											);
										})}
									</div>
								</div>
							)}

							{socialLinks.length > 0 && (
								<div className="space-y-4">
									<h3 className="text-xs font-medium font-millik tracking-widest uppercase text-muted-foreground">
										Event Socials
									</h3>
									<div className="flex flex-wrap gap-2.5">
										{socialLinks.map((link: any) => {
											const plat = getSocialPlatform(link.url, "size-5");
											return (
												<a
													key={link.id || link.url}
													href={link.url}
													target="_blank"
													rel="noopener noreferrer"
													className="size-10 rounded-full border bg-card flex items-center justify-center hover:bg-primary/10 hover:border-primary transition-all"
													title={plat.name || link.url}
												>
													<div className="size-5 flex items-center justify-center">
														{plat.icon}
													</div>
												</a>
											);
										})}
									</div>
								</div>
							)}
						</div>
					</Section>
				)}
			</div>

			{/* Large Screen View (xl+) */}
			<div className="hidden xl:flex flex-1 min-h-[100svh] max-w-[96rem] w-full mx-auto px-6 lg:px-8 py-8">
				<div className="grid grid-cols-12 gap-8 w-full items-start">
					{/* Left Column: Sticky Category Info Panel */}
					<aside className="col-span-4 sticky top-6 max-h-[calc(100svh-3rem)] overflow-y-auto pr-1">
						<CategorySidebarCard
							category={category}
							event={event}
							sponsors={sponsors}
							galleryLinks={galleryLinks}
							socialLinks={socialLinks}
							orgSlug={orgSlug}
							eventSlug={eventSlug}
						/>
					</aside>

					{/* Right Column: Nominees Feed */}
					<div className="col-span-8 space-y-6 @container/content">
						{isUpcoming && event.startDate && (
							<div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 flex items-center gap-2.5 text-amber-700 dark:text-amber-400">
								<Clock className="size-4 shrink-0" />
								<p className="text-xs font-bold uppercase tracking-wider">
									Voting has not started yet &mdash; opens on {new Date(event.startDate).toLocaleString("en-GH", {
										dateStyle: "medium",
										timeStyle: "short",
									})}.
								</p>
							</div>
						)}
						<div className="space-y-6">
							<div className="mb-6">
								<h2 className="text-xl font-medium font-millik tracking-widest uppercase text-muted-foreground">
									Nominees & Candidates
								</h2>
								<p className="text-xs text-muted-foreground mt-0.5">
									Cast your votes or submit a public nomination below.
								</p>
							</div>
							{nomineeContent}
						</div>
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
					primaryColor={primaryColor || undefined}
				/>
			)}
		</main>
	);
}
