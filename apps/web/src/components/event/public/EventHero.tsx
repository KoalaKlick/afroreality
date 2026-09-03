"use client";

import Link from "next/link";
import { ArrowLeft, Calendar, Clock, MapPin, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventInfoPill } from "@/components/shared/EventInfoPill";
import { getEventImageUrl, getOrgImageUrl } from "@/lib/image-url-utils";
import { shareEvent } from "@/lib/utils/share-utils";
import { SocialLinksList } from "@/components/shared/SocialLinksList";
import { SponsorsList } from "@/components/shared/SponsorsList";

interface EventHeroProps {
	readonly event: {
		id: string;
		title: string;
		type: string;
		description?: string | null;
		startDate?: Date | string | null;
		endDate?: Date | string | null;
		venueName?: string | null;
		bannerUrl?: string | null;
		flierUrl?: string | null;
		hasUssd?: boolean | null;
		ussdCode?: string | null;
		organization: {
			name: string;
			slug: string;
			logoUrl?: string | null;
			primaryColor?: string | null;
			secondaryColor?: string | null;
			tertiaryColor?: string | null;
		};
	};
	readonly orgSlug: string;
	readonly eventSlug: string;
	readonly socialLinks?: any[];
	readonly sponsors?: any[];
}

export function EventHero({
	event,
	orgSlug,
	socialLinks = [],
	sponsors = [],
}: EventHeroProps) {
	const { organization } = event;

	const heroImageUrl = getEventImageUrl(
		event.bannerUrl ||
			event.flierUrl ||
			(event as any).bannerImage ||
			(event as any).flierImage,
	);
	const orgLogoUrl = getOrgImageUrl(organization.logoUrl);

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

	const primaryColor = organization.primaryColor || "#009A44";

	const handleShareEvent = async () => {
		await shareEvent({
			title: event.title,
			organizationName: organization.name,
			description: event.description,
			dateStr: dateStr,
			locationStr: event.venueName,
			imageUrl: heroImageUrl,
		});
	};

	return (
		<div className="relative w-full overflow-hidden bg-background">
			{/* ── Top Hero Banner (matching category detail page) ── */}
			{heroImageUrl && (
				<div className="relative h-48 sm:h-64 md:h-80 w-full overflow-hidden bg-muted">
					<img
						src={heroImageUrl}
						alt={event.title}
						className="w-full h-full object-cover"
					/>
				</div>
			)}

			{/* ── Sticky Top Navigation Bar ── */}
			<header className="border-b border-border/80 bg-card/60 backdrop-blur-md sticky top-0 z-40">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
					<Link
						href={`/${orgSlug}`}
						className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors group"
					>
						<ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
						<span>Back to {organization.name}</span>
					</Link>

					<div className="flex items-center gap-3">
						<div className="hidden sm:flex items-center gap-2">
							{orgLogoUrl ? (
								<img
									src={orgLogoUrl}
									alt={organization.name}
									className="rounded-full border size-6 object-cover"
								/>
							) : null}
							<span className="text-xs font-black uppercase tracking-tight text-foreground truncate max-w-[120px] md:max-w-xs">
								{organization.name}
							</span>
						</div>

						{/* Social Media Handles */}
						{socialLinks.length > 0 && (
							<SocialLinksList socialLinks={socialLinks} iconSize="sm" />
						)}

						<Button
							variant="outline"
							size="sm"
							onClick={handleShareEvent}
							className="rounded-full text-xs font-bold gap-1.5 h-8 border-border hover:border-primary/50"
							title="Share Event"
						>
							<Share2 className="size-3.5" />
							<span className="hidden sm:inline">Share</span>
						</Button>
					</div>
				</div>
			</header>

			{/* ── Main Hero Details ── */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
				<div className="space-y-6 max-w-4xl">

					{/* Event Title */}
					<h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-foreground leading-[1.1] font-millik">
						{event.title}
					</h1>

					{/* Event Metadata Pills */}
					<div className="flex flex-wrap gap-3 pt-1">
						<EventInfoPill
							icon={Calendar}
							label="Date"
							value={
								<span>
									{dateStr}
									{endsOnStr ? ` (Ends ${endsOnStr})` : ""}
								</span>
							}
						/>
						{timeStr && (
							<EventInfoPill
								icon={Clock}
								label="Time"
								value={timeStr}
							/>
						)}
						{event.venueName && (
							<EventInfoPill
								icon={MapPin}
								label="Venue"
								value={event.venueName}
							/>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
