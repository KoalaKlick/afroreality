import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicCategoryDetails } from "@/lib/dal/public";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { PublicNomineeSheet } from "@/components/event/public/PublicNomineeSheet";
import { CategorySidebarCard } from "@/components/event/public/CategorySidebarCard";
import { PanAfricanDivider } from "@/components/shared/PanAficDivider";
import { EventCreationCTABanner } from "@/components/shared/EventCreationCTABanner";
import { Section } from "@/components/Landing/shared/Section";
import { getSocialPlatform, getGalleryProvider } from "@/lib/utils/event-icons";
import {
	ChevronRight,
	Trophy,
	ArrowLeft,
	Lock,
	ImageIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { getFrontendBaseUrl } from "@/lib/utils";
import type { Metadata } from "next";

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

	const { primaryColor, secondaryColor, tertiaryColor } = organization;

	const brandVars = {
		"--color-brand-primary": primaryColor || "#009A44",
		"--color-brand-secondary": secondaryColor || "#FFD100",
		"--color-brand-tertiary": tertiaryColor || "#EF3340",
	} as React.CSSProperties;

	const sponsors = event.sponsors || [];
	const galleryLinks = event.galleryLinks || [];
	const socialLinks = event.socialLinks || [];

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
			className="min-h-[100svh] bg-background text-foreground flex flex-col justify-between"
			style={brandVars}
		>
			{/* Mobile / Tablet View (< xl) */}
			<div className="flex flex-col xl:hidden flex-1 @container/content">
				{heroImg && (
					<div className="relative h-48 sm:h-64 w-full overflow-hidden bg-muted">
						<img
							src={heroImg}
							alt={category.name}
							className="w-full h-full object-cover"
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
					</div>
				)}

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

				<section className="border-b border-border/80 bg-muted/30 py-10">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
						<div className="flex flex-wrap items-center gap-2">
							<Badge
								variant="secondary"
								className="text-xs bg-primary/10 text-primary border-primary/20 font-bold"
							>
								Voting Category
							</Badge>
							{isInternalVoting && (
								<Badge
									variant="outline"
									className="text-xs text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-900/60 gap-1"
								>
									<Lock className="size-3" /> Member Ballot
								</Badge>
							)}
						</div>

						<h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight uppercase">
							{category.name}
						</h1>

						{category.description && (
							<div className="max-w-3xl text-sm text-muted-foreground leading-relaxed">
								<RichTextDisplay content={category.description} />
							</div>
						)}

						{/* Event Social Links in Category Header */}
						{socialLinks.length > 0 && (
							<div className="flex items-center gap-2 pt-2">
								<span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1">
									Follow:
								</span>
								<div className="flex flex-wrap gap-2">
									{socialLinks.map((link: any) => {
										const plat = getSocialPlatform(link.url, "size-4");
										return (
											<a
												key={link.id || link.url}
												href={link.url}
												target="_blank"
												rel="noopener noreferrer"
												className="size-8 rounded-full border bg-card flex items-center justify-center hover:bg-primary/10 hover:border-primary transition-all"
												title={plat.name || link.url}
											>
												<div className="size-4 flex items-center justify-center">
													{plat.icon}
												</div>
											</a>
										);
									})}
								</div>
							</div>
						)}

						{/* Sponsors in Category Header */}
						{sponsors.length > 0 && (
							<div className="pt-2 space-y-2">
								<span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
									Sponsors &amp; Partners:
								</span>
								<div className="flex flex-wrap items-center gap-2.5">
									{sponsors.slice(0, 8).map((sponsor: any) => {
										const imgKey = sponsor.logoUrl || sponsor.logo;
										const imgUrl = imgKey ? getEventImageUrl(imgKey) : null;
										return (
											<div
												key={sponsor.id || sponsor.name}
												className="h-10 px-3 py-1.5 border rounded-xl bg-card/80 backdrop-blur-xs flex items-center justify-center"
												title={sponsor.name}
											>
												{imgUrl ? (
													<img
														src={imgUrl}
														alt={sponsor.name}
														className="max-h-6 max-w-[90px] object-contain"
													/>
												) : (
													<span className="text-[10px] font-bold truncate max-w-[90px]">
														{sponsor.name}
													</span>
												)}
											</div>
										);
									})}
								</div>
							</div>
						)}
					</div>
				</section>

				<PanAfricanDivider />

				<main
					className="flex-1 w-full py-12 transition-colors"
					style={{
						backgroundColor:
							"color-mix(in srgb, var(--color-brand-primary, #009A44) 3.5%, transparent)",
					}}
				>
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						{nomineeContent}
					</div>
				</main>

				<Section maxWidth="7xl" className="py-14 border-t bg-background">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-16">
						<div id="about-category" className="space-y-6 scroll-mt-24">
							<h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
								<Trophy className="size-5 text-primary" />
								<span>About Category.</span>
							</h3>
							<div className="text-xs text-muted-foreground leading-relaxed">
								{category.description ? (
									<RichTextDisplay content={category.description} />
								) : (
									<p className="italic text-muted-foreground/60">
										Help your favorite nominee win by casting your vote!
									</p>
								)}
							</div>
							<div className="pt-4 border-t border-dashed">
								<Link
									href={`/${orgSlug}/event/${eventSlug}/#details`}
									className="inline-flex items-center text-xs font-bold text-primary hover:underline gap-1"
								>
									<span>View full event details</span>
									<ChevronRight className="size-3.5" />
								</Link>
							</div>
						</div>

						<div className="space-y-6">
							<h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
								<Trophy className="size-5 text-primary" />
								<span>Sponsors.</span>
							</h3>
							{sponsors.length > 0 ? (
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
							) : (
								<p className="text-xs text-muted-foreground italic leading-relaxed">
									Partnering for event excellence.
								</p>
							)}
						</div>

						<div className="space-y-8">
							{galleryLinks.length > 0 && (
								<div className="space-y-4">
									<h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
										<ImageIcon className="size-5 text-primary" />
										<span>Galleries.</span>
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
													<div className="flex items-center gap-3">
														<div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
															{provider.icon}
														</div>
														<span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate">
															{provider.name}
														</span>
													</div>
													<ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
												</a>
											);
										})}
									</div>
								</div>
							)}

							{socialLinks.length > 0 && (
								<div className="space-y-4 pt-4 border-t border-dashed">
									<h3 className="text-xs font-bold uppercase tracking-widest text-primary">
										Event Socials.
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
					</div>
				</Section>
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
						<div
							className="rounded-2xl bg-card p-8 transition-colors"
							style={{
								backgroundColor:
									"color-mix(in srgb, var(--color-brand-primary, #009A44) 3.5%, transparent)",
							}}
						>
							<div className="mb-6">
								<h2 className="text-2xl font-black uppercase tracking-tight">
									Nominees &amp; Candidates.
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
		</main>
	);
}
