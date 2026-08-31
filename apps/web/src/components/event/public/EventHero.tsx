"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, Clock, MapPin, Info, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventInfoPill } from "@/components/shared/EventInfoPill";
import { getEventImageUrl, getOrgImageUrl } from "@/lib/image-url-utils";
import { shareEvent } from "@/lib/utils/share-utils";
import { getSocialPlatform } from "@/lib/utils/event-icons";

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
		event.flierUrl ||
			event.bannerUrl ||
			(event as any).flierImage ||
			(event as any).bannerImage,
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

	const { primaryColor, secondaryColor, tertiaryColor } = organization;

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
			{/* Top Navigation Bar */}
			<div className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-30">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
					<Link
						href={`/${orgSlug}`}
						className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors group"
					>
						<ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
						<span>Back to {organization.name}</span>
					</Link>

					<div className="flex items-center gap-3">
						<div className="flex items-center gap-2">
							{orgLogoUrl ? (
								<img
									src={orgLogoUrl}
									alt={organization.name}
									className="rounded-full border size-6 object-cover"
								/>
							) : null}
							<span className="text-xs font-black uppercase tracking-tight text-foreground truncate max-w-[150px] sm:max-w-xs">
								{organization.name}
							</span>
						</div>

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
			</div>

			{/* Main Hero Header */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
					{/* Left: Event Details & Info */}
					<div className="lg:col-span-7 space-y-6">
						{/* Organization badge */}
						<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-semibold">
							<span className="size-2 rounded-full bg-primary animate-pulse" />
							<span className="text-muted-foreground">Official Event by</span>
							<span className="font-bold text-foreground">
								{organization.name}
							</span>
						</div>

						{/* Event Title */}
						<h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-foreground leading-[1.1]">
							{event.title}
						</h1>

						{/* Event Metadata Pills */}
						<div className="flex flex-wrap gap-3 pt-2">
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

						{/* Event Social Links in Header */}
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

						{/* Event Sponsors in Header */}
						{sponsors.length > 0 && (
							<div className="pt-2 space-y-2">
								<span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
									Official Sponsors &amp; Partners:
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

					{/* Right: Event Poster / Flier */}
					<div className="lg:col-span-5 flex justify-center lg:justify-end">
						<div className="relative w-full max-w-sm rounded-2xl overflow-hidden border border-border bg-card">
							{heroImageUrl ? (
								<div className="relative aspect-4/5 w-full">
									<Image
										src={heroImageUrl}
										alt={event.title}
										fill
										className="object-cover"
										priority
										unoptimized
									/>
								</div>
							) : (
								<div
									className="aspect-4/5 w-full flex flex-col items-center justify-center p-6 text-center"
									style={{
										background: `linear-gradient(135deg, ${primaryColor || "#009A44"}22 0%, ${secondaryColor || "#FFD100"}22 50%, ${tertiaryColor || "#EF3340"}22 100%)`,
									}}
								>
									<Info className="size-12 text-muted-foreground/50 mb-3" />
									<p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
										{event.title}
									</p>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
