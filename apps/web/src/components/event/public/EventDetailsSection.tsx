"use client";

import { Section } from "@/components/Landing/shared/Section";
import { getSocialPlatform, getGalleryProvider } from "@/lib/utils/event-icons";
import { SocialLinksList } from "@/components/shared/SocialLinksList";
import { SponsorsList } from "@/components/shared/SponsorsList";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { EventGallery } from "@/components/shared/EventGallery";
import { EventLocationDisplayMap } from "@/components/shared/map";
import { ImageIcon, ChevronRight, Trophy, MapPin, ExternalLink, Calendar, Clock, Video } from "lucide-react";
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
	readonly startDate?: Date | string | null;
	readonly endDate?: Date | string | null;
	readonly latitude?: number | null;
	readonly longitude?: number | null;
	readonly venueName?: string | null;
	readonly venueAddress?: string | null;
	readonly venueCity?: string | null;
	readonly venueCountry?: string | null;
	readonly isVirtual?: boolean;
	readonly virtualLink?: string | null;
	readonly showAboutSection?: boolean;
}

function formatDateDisplay(date?: Date | string | null): string {
	if (!date) return "";
	const d = new Date(date);
	if (isNaN(d.getTime())) return "";
	return d.toLocaleDateString("en-GH", {
		weekday: "short",
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

function formatTimeDisplay(date?: Date | string | null): string {
	if (!date) return "";
	const d = new Date(date);
	if (isNaN(d.getTime())) return "";
	return d.toLocaleTimeString("en-GH", {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});
}

export function EventDetailsSection({
	description,
	category,
	tags = [],
	socialLinks = [],
	galleryLinks = [],
	galleryImages = [],
	sponsors = [],
	startDate,
	endDate,
	latitude,
	longitude,
	venueName,
	venueAddress,
	venueCity,
	venueCountry,
	isVirtual = false,
	virtualLink,
	showAboutSection = true,
}: EventDetailsSectionProps) {
	const hasCoordinates =
		!isVirtual &&
		latitude !== null &&
		latitude !== undefined &&
		longitude !== null &&
		longitude !== undefined;

	const hasRightContent =
		galleryLinks.length > 0 ||
		galleryImages.length > 0 ||
		sponsors.length > 0;

	const hasDateInfo = Boolean(startDate);
	const hasVenueInfo = isVirtual || Boolean(venueName || venueAddress || venueCity);

	// If neither schedule, about, coordinates, nor right content exist, don't render an empty section
	if (!hasDateInfo && !hasVenueInfo && !showAboutSection && !hasCoordinates && !hasRightContent) {
		return null;
	}

	return (
		<Section
			maxWidth="7xl"
			className="py-12 border-t bg-background"
		>
			<div className="mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-12 gap-12">
					{/* Left: Schedule, Venue, About and/or Venue Map */}
					<div
						className={
							hasRightContent
								? "md:col-span-7 space-y-8 scroll-mt-10"
								: "md:col-span-12 space-y-8 scroll-mt-10"
						}
						id="details"
					>
						{/* Schedule & Location Cards nicely arranged below category list */}
						{(hasDateInfo || hasVenueInfo) && (
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								{hasDateInfo && (
									<div className="rounded-xl border border-border/80 bg-card p-4 flex items-start gap-3.5 shadow-2xs">
										<div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
											<Calendar className="size-4.5" />
										</div>
										<div className="space-y-1 min-w-0 flex-1">
											<h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-millik">
												Event Date &amp; Time
											</h3>
											<p className="text-sm font-bold text-foreground truncate">
												{formatDateDisplay(startDate)}
											</p>
											<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
												<Clock className="size-3 text-primary shrink-0" />
												<span>
													{formatTimeDisplay(startDate)}
													{endDate && ` – ${formatTimeDisplay(endDate)}`}
												</span>
											</div>
										</div>
									</div>
								)}

								{hasVenueInfo && (
									<div className="rounded-xl border border-border/80 bg-card p-4 flex items-start gap-3.5 shadow-2xs">
										<div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
											{isVirtual ? <Video className="size-4.5" /> : <MapPin className="size-4.5" />}
										</div>
										<div className="space-y-1 min-w-0 flex-1">
											<h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-millik">
												{isVirtual ? "Virtual Event" : "Location / Venue"}
											</h3>
											{isVirtual ? (
												<p className="text-sm font-bold text-foreground">
													Online Stream
												</p>
											) : (
												<>
													<p className="text-sm font-bold text-foreground truncate">
														{venueName || [venueCity, venueCountry].filter(Boolean).join(", ") || "Venue TBA"}
													</p>
													{(venueAddress || venueCity) && (
														<p className="text-xs text-muted-foreground truncate">
															{[venueAddress, venueCity, venueCountry].filter(Boolean).join(", ")}
														</p>
													)}
												</>
											)}
										</div>
									</div>
								)}
							</div>
						)}

						{showAboutSection && (
							<div className="space-y-4">
								<h2 className="text-xl font-medium font-millik tracking-widest uppercase text-muted-foreground flex items-center gap-2.5">
									About the Event
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
											<Badge className="font-bold text-xs rounded-sm px-2.5 py-0.5 bg-primary/15 text-primary border border-primary/30 shadow-2xs select-none">
												{category}
											</Badge>
										)}
										{tags && tags.length > 0 && tags.map((tag) => (
											<TagPill key={tag} tag={tag} size="sm" variant="secondary" />
										))}
									</div>
								)}
							</div>
						)}

						{hasCoordinates && (
							<div className={showAboutSection ? "space-y-4 pt-4 border-t border-border" : "space-y-4"}>
								<h3 className="text-xl font-medium font-millik tracking-widest uppercase text-muted-foreground flex items-center gap-2.5">
									<MapPin className="size-4 text-primary" />
									<span>Event Venue & Map</span>
								</h3>
								<EventLocationDisplayMap
									latitude={latitude}
									longitude={longitude}
									venueName={venueName}
								/>
							</div>
						)}
					</div>

					{/* Right: Media, External Albums & Sponsors */}
					{hasRightContent && (
						<div className="space-y-10 md:col-span-5">
							{galleryImages.length > 0 && (
								<div className="space-y-4">
									<div>
										<h3 className="text-xl font-medium font-millik tracking-widest uppercase text-muted-foreground flex items-center gap-2.5">
											<ImageIcon className="size-4 text-primary" />
											<span>Event Photos</span>
										</h3>
										<p className="text-xs text-muted-foreground mt-0.5">
											Featured photo highlights from the event
										</p>
									</div>
									<EventGallery images={galleryImages} maxDisplay={5} />
								</div>
							)}

							{galleryLinks.length > 0 && (
								<div className="space-y-4">
									<div>
										<h3 className="text-xl font-medium font-millik tracking-widest uppercase text-muted-foreground flex items-center gap-2.5">
											<ExternalLink className="size-4 text-primary" />
											<span>External Photo Albums</span>
										</h3>
										<p className="text-xs text-muted-foreground mt-0.5">
											Full photo collections on Google Drive, Pixieset &amp; cloud storage
										</p>
									</div>
									<div className="space-y-3">
										{galleryLinks.map((link: any) => {
											const provider = getGalleryProvider(link.url, "size-5");
											return (
												<a
													key={link.id || link.url}
													href={link.url}
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center justify-between p-3.5 border rounded-xl bg-card hover:border-primary/50 transition-colors group"
												>
													<div className="flex items-center gap-3 min-w-0">
														<div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
															{provider.icon}
														</div>
														<div className="min-w-0">
															<span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors block truncate">
																{link.name || provider.name}
															</span>
															<span className="text-[11px] text-muted-foreground flex items-center gap-1">
																<span>View album on {provider.name}</span>
																<ExternalLink className="size-2.5 opacity-70" />
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

							{sponsors.length > 0 && (
								<div className="space-y-4">
									<div>
										<h3 className="text-xl font-medium font-millik tracking-widest uppercase text-muted-foreground flex items-center gap-2.5">
											<Trophy className="size-4 text-primary" />
											<span>Official Sponsors</span>
										</h3>
										<p className="text-xs text-muted-foreground mt-0.5">
											Partners &amp; supporters for this event
										</p>
									</div>
									<SponsorsList sponsors={sponsors} size="lg" labelPrefix="" />
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</Section>
	);
}
