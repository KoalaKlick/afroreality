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
		<div className="rounded-2xl border bg-card overflow-hidden flex flex-col h-full max-h-full">
			{/* Banner / Cover - Stays Fixed */}
			<div className="relative h-44 shrink-0 w-full overflow-hidden bg-muted">
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

				<div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
					<Badge className="text-[10px] font-bold uppercase bg-background/90 text-foreground backdrop-blur-md border border-border rounded-sm">
						{event.type || "Event"}
					</Badge>
				</div>
			</div>

			{/* Info & Meta Header - Stays Fixed */}
			<div className="p-6 flex flex-col flex-1 min-h-0 space-y-5 overflow-hidden">
				<div className="space-y-3 shrink-0">
					{/* Org Link & Event Title */}
					<div className="space-y-2">
						<Link
							href={`/${orgSlug}`}
							className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors group"
						>
							{logoImage ? (
								<img
									src={logoImage}
									alt={event.organization.name}
									className="size-4 rounded-full object-cover border"
								/>
							) : (
								<Building2 className="size-3.5" />
							)}
							<span className="truncate">{event.organization.name}</span>
						</Link>

						<h1 className="text-xl font-black uppercase tracking-tight text-foreground leading-snug font-millik">
							{event.title}
						</h1>
					</div>

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
						<div className="flex items-center gap-2.5">
							{event.isVirtual ? (
								<Globe className="size-3.5 text-primary shrink-0" />
							) : (
								<MapPin className="size-3.5 text-primary shrink-0" />
							)}
							<span className="truncate">{locationText}</span>
						</div>
					</div>

					{/* Category & Tags */}
					{(event.category || (event.tags && event.tags.length > 0)) && (
						<div className="flex flex-wrap items-center gap-1.5 pt-1">
							{event.category && (
								<Badge
									variant="secondary"
									className="text-xs font-semibold rounded-sm px-2 py-0.5 border"
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
						<h3 className="text-xs font-black uppercase tracking-widest text-foreground">
							About the Event.
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
								<h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-1.5">
									<MapPin className="size-3.5 text-primary" />
									<span>Venue Map.</span>
								</h3>
								<EventLocationDisplayMap
									latitude={event.latitude}
									longitude={event.longitude}
									venueName={event.venueName}
									heightClass="aspect-video"
								/>
							</div>
						)}

					{/* Event Social Links */}
					{socialLinks.length > 0 && (
						<div className="space-y-2.5 pt-3 border-t border-dashed">
							<h3 className="text-xs font-black uppercase tracking-widest text-foreground">
								Event Socials.
							</h3>
							<SocialLinksList socialLinks={socialLinks} iconSize="sm" />
						</div>
					)}

					{/* Galleries */}
					{galleryLinks.length > 0 && (
						<div className="space-y-2.5 pt-3 border-t border-dashed">
							<h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-1.5">
								<ImageIcon className="size-3.5 text-primary" />
								<span>Galleries.</span>
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
											<span className="text-xs font-medium text-foreground truncate flex-1">
												{link.name || "View Gallery"}
											</span>
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
							<h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-1.5">
								<Trophy className="size-3.5 text-primary" />
								<span>Official Sponsors.</span>
							</h3>
							<SponsorsList sponsors={sponsors} />
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
