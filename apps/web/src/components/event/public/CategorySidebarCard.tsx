"use client";

import Link from "next/link";
import {
	Trophy,
	ArrowLeft,
	Lock,
	ImageIcon,
	ChevronRight,
	Calendar,
	MapPin,
	Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { formatEventDisplay } from "@/lib/utils/event-dto";
import { getSocialPlatform, getGalleryProvider } from "@/lib/utils/event-icons";
import { SocialLinksList } from "@/components/shared/SocialLinksList";
import { SponsorsList } from "@/components/shared/SponsorsList";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { PanAfricanDivider } from "@/components/shared/PanAficDivider";
import { OrgGeometricBanner } from "@/components/common/OrgGeometricBanner";

interface CategorySidebarCardProps {
	readonly category: {
		id: string;
		name: string;
		description?: string | null;
		votePrice?: number;
		nominationPrice?: number;
		allowPublicNomination?: boolean;
		templateImage?: string | null;
	};
	readonly event: {
		id: string;
		title: string;
		slug: string;
		votingMode?: string;
		flierUrl?: string | null;
		bannerUrl?: string | null;
		startDate?: string | Date | null;
		venueName?: string | null;
		venueCity?: string | null;
		venueCountry?: string | null;
		organization: {
			name: string;
			slug: string;
			logoUrl?: string | null;
			primaryColor?: string | null;
			secondaryColor?: string | null;
			tertiaryColor?: string | null;
		};
	};
	readonly sponsors?: any[];
	readonly galleryLinks?: any[];
	readonly socialLinks?: any[];
	readonly orgSlug: string;
	readonly eventSlug: string;
}

export function CategorySidebarCard({
	category,
	event,
	sponsors = [],
	galleryLinks = [],
	socialLinks = [],
	orgSlug,
	eventSlug,
}: CategorySidebarCardProps) {
	const isInternalVoting = event.votingMode === "internal";
	const { bannerImageUrl: eventBannerImg, logoImageUrl: orgLogo } = formatEventDisplay(event);
	const templateImg = getEventImageUrl(category.templateImage) || eventBannerImg;

	return (
		<div
			className="rounded-2xl bg-card overflow-hidden flex flex-col h-full max-h-full border border-border/60 shadow-xs"
			style={{
				backgroundColor:
					"color-mix(in srgb, var(--color-brand-primary, #009A44) 3.5%, transparent)",
			}}
		>
			{/* Banner / Cover with Overlay Title & Event Badge */}
			<div className="relative h-48 sm:h-52 shrink-0 w-full overflow-hidden bg-muted">
				{templateImg ? (
					<img
						src={templateImg}
						alt={category.name}
						className="w-full h-full object-cover"
					/>
				) : (
					<OrgGeometricBanner
						primaryColor={event.organization.primaryColor}
						secondaryColor={event.organization.secondaryColor}
						tertiaryColor={event.organization.tertiaryColor}
					/>
				)}

				{/* Top-left Back link & status badge */}
				<div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10">
					<Button asChild variant="ghost" size="sm" className="h-7 px-2.5 gap-1.5 text-xs bg-background/90 text-foreground backdrop-blur-md border border-border rounded-sm hover:bg-background shadow-xs">
						<Link href={`/${orgSlug}/event/${eventSlug}`}>
							<ArrowLeft className="size-3.5" /> Back to Event
						</Link>
					</Button>

					{isInternalVoting && (
						<Badge
							variant="outline"
							className="text-[10px] text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-900/60 gap-1 bg-background/90 backdrop-blur-md h-7 rounded-sm shadow-xs"
						>
							<Lock className="size-3" /> Member Ballot
						</Badge>
					)}
				</div>

				{/* Bottom Gradient Backdrop for Title & Info */}
				<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

				{/* Floating Header Info inside Banner to save vertical space */}
				<div className="absolute bottom-3 left-3 right-3 z-10 space-y-1.5">
					<Link
						href={`/${orgSlug}/event/${eventSlug}`}
						className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-background/90 hover:bg-background text-foreground backdrop-blur-md border border-border/80 text-[11px] font-semibold transition-all shadow-xs group w-fit max-w-full"
					>
						{orgLogo ? (
							<img
								src={orgLogo}
								alt={event.organization.name}
								className="size-3.5 rounded-full object-cover border border-border/50 shrink-0"
							/>
						) : (
							<Building2 className="size-3 text-primary shrink-0" />
						)}
						<span className="truncate group-hover:text-primary transition-colors max-w-[200px]">
							{event.title}
						</span>
					</Link>

					<h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white leading-tight font-millik drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] line-clamp-2">
						{category.name}
					</h1>
				</div>
			</div>

			{/* Info & Scrollable Body */}
			<div className="p-5 sm:p-6 flex flex-col flex-1 min-h-0 space-y-4 overflow-hidden">
				<PanAfricanDivider className="shrink-0" />

				{/* Scrollable Body: About Category, Socials, Sponsors */}
				<div className="flex-1 min-h-0 overflow-y-auto pr-1.5 space-y-5 custom-scrollbar">
					{/* About Category */}
					<div className="space-y-2">
						<h3 className="text-xs font-medium font-millik tracking-widest uppercase text-muted-foreground">
							About Category
						</h3>
						<div className="text-xs text-muted-foreground leading-relaxed">
							{category.description ? (
								<RichTextDisplay content={category.description} />
							) : (
								<p className="italic text-muted-foreground/60">
									Vote for your favorite candidate or submit an exceptional nominee to win!
								</p>
							)}
						</div>
					</div>

					{/* Event Socials */}
					{socialLinks.length > 0 && (
						<div className="space-y-2.5 pt-3 border-t border-dashed">
							<h3 className="text-xs font-medium font-millik tracking-widest uppercase text-muted-foreground">
								Event Socials
							</h3>
							<SocialLinksList socialLinks={socialLinks} iconSize="sm" />
						</div>
					)}

					{/* Sponsors */}
					{sponsors.length > 0 && (
						<div className="space-y-2.5 pt-3 border-t border-dashed">
							<h3 className="text-xs font-medium font-millik tracking-widest uppercase text-muted-foreground flex items-center gap-1.5">
								<Trophy className="size-3.5 text-primary" />
								<span>Official Sponsors</span>
							</h3>
							<SponsorsList sponsors={sponsors} labelPrefix="" />
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
