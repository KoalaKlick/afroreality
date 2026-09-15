"use client";

import Link from "next/link";
import {
	Calendar,
	MapPin,
	Building2,
	Globe,
	ImageIcon,
	ChevronRight,
	Trophy,
	ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TagPill } from "@/components/ui/tag-pill";
import { formatEventDisplay } from "@/lib/utils/event-dto";
import { getSocialPlatform, getGalleryProvider } from "@/lib/utils/event-icons";
import { SocialLinksList } from "@/components/shared/SocialLinksList";
import { SponsorsList } from "@/components/shared/SponsorsList";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { PanAfricanDivider } from "@/components/shared/PanAficDivider";
import { EventLocationDisplayMap } from "@/components/shared/map";
import { OrgGeometricBanner } from "@/components/common/OrgGeometricBanner";

interface EventSidebarCardProps {
	readonly event: {
		id: string;
		title: string;
		slug: string;
		category?: string | null;
		tags?: string[];
		hasUssd?: boolean | null;
		ussdCode?: string | null;
		description: string | null;
		flierUrl?: string | null;
		bannerUrl?: string | null;
		startDate?: string | Date | null;
		endDate?: string | Date | null;
		venueName?: string | null;
		venueAddress?: string | null;
		venueCity?: string | null;
		venueCountry?: string | null;
		latitude?: number | null;
		longitude?: number | null;
		isVirtual?: boolean;
		virtualLink?: string | null;
		type?: string;
		organization: {
			id: string;
			name: string;
			slug: string;
			logoUrl?: string | null;
			primaryColor?: string;
			secondaryColor?: string;
			tertiaryColor?: string;
		};
		ticketTypes?: any[];
		votingCategories?: any[];
	};
	readonly socialLinks?: any[];
	readonly galleryLinks?: any[];
	readonly sponsors?: any[];
	readonly orgSlug: string;
	readonly eventSlug: string;
}

export function EventSidebarCard({
	event,
	socialLinks = [],
	galleryLinks = [],
	sponsors = [],
	orgSlug,
}: EventSidebarCardProps) {
	const {
		bannerImageUrl: bannerImage,
		logoImageUrl: logoImage,
		formattedDate,
		formattedTime,
		locationText,
	} = formatEventDisplay(event);

	return (
		<div
			className="rounded-2xl bg-card overflow-hidden flex flex-col h-full max-h-full border border-border/60 shadow-xs"
			style={{
				backgroundColor:
					"color-mix(in srgb, var(--color-brand-primary, #009A44) 3.5%, transparent)",
			}}
		>
			{/* Banner / Cover with Overlay Title & Org Logo */}
			<div className="relative h-48 sm:h-52 shrink-0 w-full overflow-hidden bg-muted">
				{bannerImage ? (
					<img
						src={bannerImage}
						alt={event.title}
						className="w-full h-full object-cover"
					/>
				) : (
					<OrgGeometricBanner
						primaryColor={event.organization.primaryColor}
						secondaryColor={event.organization.secondaryColor}
						tertiaryColor={event.organization.tertiaryColor}
					/>
				)}

				{/* Top-left Event Type Pill */}
				<div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
					<Badge className="text-[10px] font-bold uppercase bg-background/90 text-foreground backdrop-blur-md border border-border rounded-sm">
						{event.type || "Event"}
					</Badge>
				</div>

				{/* Bottom Gradient Backdrop for Title & Org info */}
				<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

				{/* Floating Header Info inside Banner to save vertical space */}
				<div className="absolute bottom-3 left-3 right-3 z-10 space-y-1.5">
					<Link
						href={`/${orgSlug}`}
						className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-background/90 hover:bg-background text-foreground backdrop-blur-md border border-border/80 text-[11px] font-semibold transition-all shadow-xs group w-fit max-w-full"
					>
						{logoImage ? (
							<img
								src={logoImage}
								alt={event.organization.name}
								className="size-3.5 rounded-full object-cover border border-border/50 shrink-0"
							/>
						) : (
							<Building2 className="size-3 text-primary shrink-0" />
						)}
						<span className="truncate group-hover:text-primary transition-colors max-w-[200px]">
							{event.organization.name}
						</span>
					</Link>

					<h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white leading-tight font-millik drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] line-clamp-2">
						{event.title}
					</h1>
				</div>
			</div>

			{/* Info & Meta Header */}
			<div className="p-5 sm:p-6 flex flex-col flex-1 min-h-0 space-y-4 overflow-hidden">
				<div className="space-y-3 shrink-0">
					{/* Event Meta Details */}
					<div className="space-y-2 text-xs text-muted-foreground">
						{formattedDate && (
							<div className="flex items-center gap-2.5">
								<Calendar className="size-3.5 text-primary shrink-0" />
								<span>
									{formattedDate} {formattedTime ? `at ${formattedTime}` : ""}
								</span>
							</div>
						)}
					</div>

					{/* Category & Tags */}
					{(event.category || (event.tags && event.tags.length > 0)) && (
						<div className="flex flex-wrap items-center gap-1.5 pt-0.5">
							{event.category && (
								<Badge
									className="text-xs font-bold rounded-sm px-2.5 py-0.5 bg-primary/15 text-primary border border-primary/30 shadow-2xs select-none"
								>
									{event.category}
								</Badge>
							)}
							{event.tags && event.tags.length > 0 && event.tags.map((tag: string) => (
								<TagPill key={tag} tag={tag} size="sm" variant="outline" />
							))}
						</div>
					)}
				</div>

				<PanAfricanDivider className="shrink-0" />

				{/* Scrollable Body: About Event, Socials, Galleries, Sponsors */}
				<div className="flex-1 min-h-0 overflow-y-auto pr-1.5 space-y-5 custom-scrollbar">
					{/* About Event */}
					<div className="space-y-2">
						<h3 className="text-xs font-medium font-millik tracking-widest uppercase text-muted-foreground">
							About the Event
						</h3>
						<div className="text-xs text-muted-foreground leading-relaxed">
							{event.description ? (
								<RichTextDisplay content={event.description} />
							) : (
								<p className="italic text-muted-foreground/60">
									No description provided for this event.
								</p>
							)}
						</div>
					</div>

					{/* Location Map */}
					{!event.isVirtual &&
						event.latitude !== null &&
						event.latitude !== undefined &&
						event.longitude !== null &&
						event.longitude !== undefined && (
							<div className="space-y-2 pt-3 border-t border-dashed">
								<h3 className="text-xs font-medium    text-muted-foreground flex items-center gap-2">
									<span className="uppercase tracking-widest font-millik">Venue Map</span>
								<span className="text-[11px] font-normal text-muted-foreground truncate flex items-center gap-1">
									<MapPin className="size-3 text-primary shrink-0" />
									{locationText}
								</span>
								</h3>
								
								<EventLocationDisplayMap
									latitude={event.latitude}
									longitude={event.longitude}
									venueName={event.venueName}
									heightClass="aspect-[7/2]"
								/>
							</div>
						)}

					{/* Event Social Links */}
					{socialLinks.length > 0 && (
						<div className="space-y-2.5 pt-3 border-t border-dashed">
							<h3 className="text-xs font-medium font-millik tracking-widest uppercase text-muted-foreground">
								Event Socials
							</h3>
							<SocialLinksList socialLinks={socialLinks} iconSize="sm" />
						</div>
					)}

					{/* External Photo Albums */}
					{galleryLinks.length > 0 && (
						<div className="space-y-2.5 pt-3 border-t border-dashed">
							<h3 className="text-xs font-medium font-millik tracking-widest uppercase text-muted-foreground flex items-center gap-1.5">
								<ExternalLink className="size-3.5 text-primary" />
								<span>External Albums</span>
							</h3>
							<div className="space-y-2">
								{galleryLinks.map((link: any) => {
									const provider = getGalleryProvider(link.url, "size-4");
									return (
										<a
											key={link.id || link.url}
											href={link.url}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center gap-2.5 p-2 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors group"
										>
											<div className="size-7 rounded-md bg-muted border flex items-center justify-center shrink-0">
												{provider.icon}
											</div>
											<div className="min-w-0 flex-1">
												<span className="text-xs font-medium text-foreground truncate block">
													{link.name || provider.name}
												</span>
												<span className="text-[10px] text-muted-foreground block truncate">
													{provider.name}
												</span>
											</div>
											<ChevronRight className="size-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
										</a>
									);
								})}
							</div>
						</div>
					)}

					{/* Sponsors */}
					{sponsors.length > 0 && (
						<div className="space-y-2.5 pt-3 border-t border-dashed">
							<h3 className="text-xs font-medium font-millik tracking-widest uppercase text-muted-foreground flex items-center gap-1.5">
								<span>Official Sponsors</span>
							</h3>
							<SponsorsList sponsors={sponsors} />
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
