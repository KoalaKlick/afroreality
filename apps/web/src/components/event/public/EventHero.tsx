"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, Clock, MapPin, Info } from "lucide-react";
import { EventInfoPill } from "@/components/shared/EventInfoPill";
import { PublicRegistrationForm } from "@/components/event/public/PublicRegistrationForm";
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

export function EventHero({ event, orgSlug, eventSlug }: EventHeroProps) {
	const { organization } = event;
	const heroImageUrl =
		getEventImageUrl(event.bannerUrl) || getEventImageUrl(event.flierUrl);
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

	return (
		<div className="relative h-[50vh] min-h-[420px] w-full overflow-hidden">
			{heroImageUrl ? (
				<Image
					src={heroImageUrl}
					alt={event.title}
					fill
					className="object-cover"
					priority
					unoptimized
				/>
			) : (
				<div
					className="w-full h-full"
					style={{
						background: `linear-gradient(135deg, ${organization.primaryColor || "#009A44"}cc 0%, ${organization.secondaryColor || "#FFD100"}99 50%, ${organization.tertiaryColor || "#EF3340"}cc 100%)`,
					}}
				/>
			)}
			<div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
			<div className="absolute inset-0 flex items-end pb-12">
				<div className="max-w-7xl mx-auto px-6 w-full">
					<Link
						href={`/${orgSlug}`}
						className="flex items-center gap-2 text-white/80 hover:text-white text-sm mb-5 transition-colors"
					>
						{orgLogoUrl ? (
							<Image
								src={orgLogoUrl}
								alt={organization.name}
								width={40}
								height={40}
								className="rounded-md border bg-white/10 border-white/20 object-cover"
								unoptimized
							/>
						) : (
							<ArrowLeft className="size-4" />
						)}
						<span>Back to {organization.name}</span>
					</Link>

					<div className="inline-block items-center bg-primary text-primary-foreground text-xs font-bold uppercase py-1 px-3 rounded-sm mb-4 tracking-widest">
						{event.type.toUpperCase()}
					</div>

					<h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight mb-6">
						{event.title}
					</h1>

					{/* Event Schedule Bar */}
					<div className="flex flex-wrap gap-4 items-center">
						<EventInfoPill
							icon={Calendar}
							label="Date"
							value={dateStr}
						/>

						{timeStr && (
							<EventInfoPill
								icon={Clock}
								label="Time"
								value={timeStr}
							/>
						)}

						<EventInfoPill
							icon={MapPin}
							label="Venue"
							value={event.venueName || "TBA"}
							valueClassName="truncate max-w-[200px]"
						/>

						{endsOnStr && (
							<EventInfoPill
								icon={Calendar}
								label="Ends On"
								value={endsOnStr}
								className="bg-brand-tertiary/20 border-brand-tertiary/40"
							/>
						)}
					</div>

					{/* Action row */}
					<div className="mt-8 flex items-center gap-3 justify-between">
						<a
							href="#details"
							className="inline-flex items-center gap-2 border border-white/30 hover:border-white/60 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-md transition-all duration-200"
						>
							<Info className="size-3.5" />
							About Event
						</a>

						{event.type === "standard" && (
							<PublicRegistrationForm
								eventId={event.id}
								eventTitle={event.title}
								orgSlug={orgSlug}
								eventSlug={eventSlug}
							/>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
