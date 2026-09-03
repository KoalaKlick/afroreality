"use client";

import { Section } from "@/components/Landing/shared/Section";
import { getSocialPlatform, getGalleryProvider } from "@/lib/utils/event-icons";
import { SocialLinksList } from "@/components/shared/SocialLinksList";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { EventGallery } from "@/components/shared/EventGallery";
import { EventLocationDisplayMap } from "@/components/shared/map";
import { ImageIcon, ChevronRight, Trophy, MapPin } from "lucide-react";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { Badge } from "@/components/ui/badge";
import { TagPill } from "@/components/ui/tag-pill";

interface EventDetailsSectionProps {
	readonly description?: string | null;
	readonly category?: string | null;
	readonly tags?: string[];
	readonly socialLinks?: any[];
	readonly galleryLinks?: any[];
	readonly galleryImages?: string[];
	readonly sponsors?: any[];
	readonly latitude?: number | null;
	readonly longitude?: number | null;
	readonly venueName?: string | null;
	readonly venueAddress?: string | null;
	readonly venueCity?: string | null;
	readonly venueCountry?: string | null;
	readonly isVirtual?: boolean;
}

export function EventDetailsSection({
	description,
	category,
	tags = [],
	socialLinks = [],
	galleryLinks = [],
	galleryImages = [],
	sponsors = [],
	latitude,
	longitude,
	venueName,
	venueAddress,
	venueCity,
	venueCountry,
	isVirtual = false,
}: EventDetailsSectionProps) {
	const hasCoordinates =
		!isVirtual &&
		latitude !== null &&
		latitude !== undefined &&
		longitude !== null &&
		longitude !== undefined;

	return (
		<Section
			maxWidth="7xl"
			className="py-16 border-t bg-background"
		>
			<div className="mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-16">
					{/* Left: About (2 columns if gallery exists, otherwise full width) */}
					<div className={galleryLinks.length > 0 || galleryImages.length > 0 ? "md:col-span-2 space-y-8 scroll-mt-10" : "md:col-span-3 space-y-8 scroll-mt-10"} id="details">
						<div className="space-y-4">
							<h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
								About the Event.
							</h2>
							<div className="text-sm text-foreground leading-relaxed">
								{description ? (
									<RichTextDisplay content={description} />
								) : (
									<p className="italic text-muted-foreground">
										No description provided for this event.
									</p>
								)}
							</div>

							{(category || (tags && tags.length > 0)) && (
								<div className="flex flex-wrap items-center gap-1.5 pt-2">
									{category && (
										<Badge variant="secondary" className="font-semibold text-xs rounded-sm px-2.5 py-0.5 border">
											{category}
										</Badge>
									)}
									{tags && tags.length > 0 && tags.map((tag) => (
										<TagPill key={tag} tag={tag} size="sm" variant="secondary" />
									))}
								</div>
							)}
						</div>

						{hasCoordinates && (
							<div className="space-y-4 pt-4 border-t border-border">
								<h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
									<MapPin className="size-5 text-primary" />
									<span>Event Venue &amp; Map.</span>
								</h3>
								<EventLocationDisplayMap
									latitude={latitude}
									longitude={longitude}
									venueName={venueName}
								/>
							</div>
						)}
					</div>

					{/* Right: Galleries */}
					{(galleryLinks.length > 0 || galleryImages.length > 0) && (
						<div className="space-y-12">
							{galleryImages.length > 0 && (
								<div className="space-y-6">
									<h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
										<ImageIcon className="size-5 text-primary" />
										<span>Event Photos.</span>
									</h3>
									<EventGallery images={galleryImages} maxDisplay={5} />
								</div>
							)}
							{galleryLinks.length > 0 && (
								<div className="space-y-6">
									<h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
										<ImageIcon className="size-5 text-primary" />
										<span>Galleries.</span>
									</h3>
									<div className="space-y-3">
										{galleryLinks.map((link: any) => {
											const provider = getGalleryProvider(link.url, "size-5");
											return (
												<a
													key={link.id || link.url}
													href={link.url}
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center justify-between p-3.5 border hover:border-primary/50 transition-colors group"
												>
													<div className="flex items-center gap-3">
														<div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
															{provider.icon}
														</div>
														<span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
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
						</div>
					)}
				</div>
			</div>
		</Section>
	);
}
