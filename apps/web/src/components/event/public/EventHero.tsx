"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, Clock, MapPin, Info } from "lucide-react";
import { EventInfoPill } from "@/components/shared/EventInfoPill";
import { getEventImageUrl, getOrgImageUrl } from "@/lib/image-url-utils";

interface EventHeroProps {
	readonly event: {
		id: string;
		title: string;
		type: string;
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
}

export function EventHero({ event, orgSlug }: EventHeroProps) {
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
