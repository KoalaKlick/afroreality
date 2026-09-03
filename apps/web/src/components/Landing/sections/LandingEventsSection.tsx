"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import {
	Calendar,
	MapPin,
	ArrowRight,
	Smartphone,
	Ticket,
	Vote,
	Layers,
	Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { cn } from "@/lib/utils";

export interface LandingEventItem {
	id: string;
	title: string;
	slug: string;
	description?: string | null;
	type: "ticketed" | "voting" | "hybrid" | string;
	status: string;
	startDate?: Date | string | null;
	endDate?: Date | string | null;
	flierImage?: string | null;
	bannerImage?: string | null;
	venueName?: string | null;
	venueCity?: string | null;
	venueCountry?: string | null;
	hasUssd?: boolean;
	minPrice?: number | null;
	maxPrice?: number | null;
	organization: {
		name: string;
		slug: string;
		logoUrl?: string | null;
	};
}

// Fallback high-quality curated events if DB has no published events yet
const DEMO_EVENTS: LandingEventItem[] = [
	{
		id: "demo-1",
		title: "Afrochella Cultural & Music Gala 2026",
		slug: "afrochella-cultural-gala-2026",
		description: "Experience the vibrant sounds, fashion, and culinary marvels of contemporary Africa.",
		type: "ticketed",
		status: "published",
		startDate: new Date("2026-10-15T18:00:00Z"),
		endDate: new Date("2026-10-16T02:00:00Z"),
		flierImage: "/landing/a.webp",
		venueName: "Independence Square",
		venueCity: "Accra",
		venueCountry: "Ghana",
		hasUssd: true,
		minPrice: 150,
		maxPrice: 500,
		organization: {
			name: "Culture Africa Collective",
			slug: "culture-africa",
			logoUrl: "/logo.svg",
		},
	},
	{
		id: "demo-2",
		title: "Ghana Creative Arts & Film Honors",
		slug: "ghana-creative-arts-honors",
		description: "Cast your votes for the breakthrough film, director, and stage actors of the year.",
		type: "voting",
		status: "published",
		startDate: new Date("2026-11-05T19:00:00Z"),
		endDate: new Date("2026-11-06T00:00:00Z"),
		flierImage: "/landing/b.webp",
		venueName: "National Theatre of Ghana",
		venueCity: "Accra",
		venueCountry: "Ghana",
		hasUssd: true,
		minPrice: null,
		maxPrice: null,
		organization: {
			name: "Film Guild West Africa",
			slug: "film-guild-wa",
			logoUrl: "/logo.svg",
		},
	},
	{
		id: "demo-3",
		title: "AfroTech Summit & Developer Jam",
		slug: "afrotech-summit-jam",
		description: "Pan-African technology conference featuring product demos, keynotes, and hackathons.",
		type: "hybrid",
		status: "published",
		startDate: new Date("2026-11-20T09:00:00Z"),
		endDate: new Date("2026-11-22T17:00:00Z"),
		flierImage: "/landing/c.webp",
		venueName: "Kempinski Gold Coast City",
		venueCity: "Accra",
		venueCountry: "Ghana",
		hasUssd: false,
		minPrice: 80,
		maxPrice: 300,
		organization: {
			name: "Tech Across Africa",
			slug: "tech-africa",
			logoUrl: "/logo.svg",
		},
	},
	{
		id: "demo-4",
		title: "Lagos Highlife Heritage Ball",
		slug: "lagos-highlife-heritage-ball",
		description: "An intimate evening of live orchestra, vintage horn sections, and vintage attire.",
		type: "ticketed",
		status: "published",
		startDate: new Date("2026-12-02T19:30:00Z"),
		endDate: new Date("2026-12-03T01:00:00Z"),
		flierImage: "/landing/d.webp",
		venueName: "Eko Convention Hall",
		venueCity: "Lagos",
		venueCountry: "Nigeria",
		hasUssd: true,
		minPrice: 200,
		maxPrice: 650,
		organization: {
			name: "Vintage West Africa",
			slug: "vintage-west-africa",
			logoUrl: "/logo.svg",
		},
	},
	{
		id: "demo-5",
		title: "African Emerging Designers Runway",
		slug: "african-emerging-designers-runway",
		description: "Vote for the top indigenous textile innovators and attend the flagship runway showcase.",
		type: "hybrid",
		status: "published",
		startDate: new Date("2026-12-14T17:00:00Z"),
		endDate: new Date("2026-12-14T23:00:00Z"),
		flierImage: "/landing/g.webp",
		venueName: "Grand Arena Accra",
		venueCity: "Accra",
		venueCountry: "Ghana",
		hasUssd: true,
		minPrice: 120,
		maxPrice: 400,
		organization: {
			name: "Pan-African Fashion Week",
			slug: "pafw",
			logoUrl: "/logo.svg",
		},
	},
	{
		id: "demo-6",
		title: "University Battle of the Bands",
		slug: "university-battle-of-the-bands",
		description: "Inter-collegiate battle of live music acts with crowd audience voting and instant results.",
		type: "voting",
		status: "published",
		startDate: new Date("2026-12-28T16:00:00Z"),
		endDate: new Date("2026-12-28T22:00:00Z"),
		flierImage: "/landing/h.webp",
		venueName: "Legon Amphitheatre",
		venueCity: "Accra",
		venueCountry: "Ghana",
		hasUssd: true,
		minPrice: null,
		maxPrice: null,
		organization: {
			name: "Campus Live Events",
			slug: "campus-live",
			logoUrl: "/logo.svg",
		},
	},
];

interface LandingEventsSectionProps {
	readonly initialEvents?: LandingEventItem[];
}

function formatDate(dateVal?: Date | string | null) {
	if (!dateVal) return "Date TBA";
	const d = new Date(dateVal);
	return d.toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

function getTypeBadge(type: string) {
	switch (type.toLowerCase()) {
		case "voting":
			return {
				label: "Live Voting",
				icon: Vote,
				className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/40",
			};
		case "ticketed":
			return {
				label: "Tickets",
				icon: Ticket,
				className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40",
			};
		case "hybrid":
		default:
			return {
				label: "Tickets & Voting",
				icon: Layers,
				className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/40",
			};
	}
}

export function LandingEventsSection({
	initialEvents,
}: LandingEventsSectionProps) {
	const [activeTab, setActiveTab] = useState<string>("all");

	const rawEvents = initialEvents && initialEvents.length > 0 ? initialEvents : DEMO_EVENTS;

	const filteredEvents = rawEvents.filter((item) => {
		if (activeTab === "all") return true;
		return item.type.toLowerCase() === activeTab.toLowerCase();
	});

	return (
		<section id="events" className="py-20 md:py-28 relative">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Section Header */}
				<div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
					<div>
						<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
							<Ticket className="size-3.5" />
							<span>Discover Experiences</span>
						</div>
						<h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-foreground">
							Featured Events &amp; Awards
						</h2>
						<p className="text-muted-foreground text-sm sm:text-base mt-2 max-w-xl">
							Explore curated festivals, ticketed gatherings, and real-time voting
							competitions powered by our platform.
						</p>
					</div>

					{/* Filter Pills */}
					<div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted/60 border border-border/50 self-start md:self-auto overflow-x-auto max-w-full">
						{[
							{ id: "all", label: "All Events" },
							{ id: "ticketed", label: "Tickets" },
							{ id: "voting", label: "Voting" },
							{ id: "hybrid", label: "Hybrid" },
						].map((tab) => (
							<button
								key={tab.id}
								type="button"
								onClick={() => setActiveTab(tab.id)}
								className={cn(
									"px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 whitespace-nowrap",
									activeTab === tab.id
										? "bg-card text-foreground shadow-xs font-bold"
										: "text-muted-foreground hover:text-foreground hover:bg-muted/80",
								)}
							>
								{tab.label}
							</button>
						))}
					</div>
				</div>

				{/* Event Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
					{filteredEvents.slice(0, 6).map((event, idx) => {
						const typeInfo = getTypeBadge(event.type);
						const TypeIcon = typeInfo.icon;
						const flierUrl = getEventImageUrl(event.flierImage) || "/landing/a.webp";
						const eventHref = `/${event.organization.slug}/event/${event.slug}`;
						const location = [event.venueName, event.venueCity].filter(Boolean).join(", ");

						return (
							<motion.div
								key={event.id}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.45, delay: idx * 0.06 }}
								className="group flex flex-col rounded-3xl border border-border/60 bg-card overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
							>
								{/* Image Thumbnail with Badges */}
								<Link href={eventHref} className="relative aspect-[16/10] w-full overflow-hidden block">
									<Image
										src={flierUrl}
										alt={event.title}
										fill
										className="object-cover transition-transform duration-500 group-hover:scale-105"
										sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

									{/* Badges on Image */}
									<div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
										<Badge
											variant="outline"
											className={cn("px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur-md border gap-1.5 shadow-2xs", typeInfo.className)}
										>
											<TypeIcon className="size-3" />
											<span>{typeInfo.label}</span>
										</Badge>

										{event.hasUssd && (
											<Badge className="bg-amber-500/90 text-black font-extrabold text-[10px] tracking-wider px-2 py-0.5 border-0 shadow-2xs gap-1">
												<Smartphone className="size-3" />
												<span>USSD LIVE</span>
											</Badge>
										)}
									</div>

									{/* Date Tag */}
									<div className="absolute bottom-3 left-3.5 z-10 flex items-center gap-1.5 text-xs font-semibold text-white/90">
										<Calendar className="size-3.5 text-emerald-400" />
										<span>{formatDate(event.startDate)}</span>
									</div>
								</Link>

								{/* Card Content */}
								<div className="p-5 flex-1 flex flex-col justify-between space-y-4">
									<div className="space-y-2">
										{/* Organization Header */}
										<Link
											href={`/${event.organization.slug}`}
											className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
										>
											<div className="relative size-4 rounded-full overflow-hidden bg-primary/10">
												<Image
													src={event.organization.logoUrl || "/logo.svg"}
													alt={event.organization.name}
													fill
													className="object-cover"
												/>
											</div>
											<span className="truncate">{event.organization.name}</span>
										</Link>

										{/* Event Title */}
										<Link href={eventHref}>
											<h3 className="text-lg font-bold text-foreground leading-snug line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
												{event.title}
											</h3>
										</Link>

										{/* Location */}
										{location && (
											<p className="flex items-center gap-1.5 text-xs text-muted-foreground line-clamp-1">
												<MapPin className="size-3.5 shrink-0 text-muted-foreground/80" />
												<span className="truncate">{location}</span>
											</p>
										)}
									</div>

									{/* Bottom Action and Pricing */}
									<div className="pt-3 border-t border-border/50 flex items-center justify-between">
										<div className="flex flex-col">
											<span className="text-[10px] uppercase font-bold text-muted-foreground">
												Entry / Access
											</span>
											<span className="text-sm font-extrabold text-foreground">
												{event.type === "voting"
													? "Nomination & Voting"
													: event.minPrice
														? `From GHS ${event.minPrice}`
														: "Free Admission"}
											</span>
										</div>

										<Link href={eventHref}>
											<Button
												size="sm"
												variant="secondary"
												className="rounded-full px-4 text-xs font-bold gap-1 group-hover:bg-emerald-600 group-hover:text-white transition-colors"
											>
												<span>View Event</span>
												<ArrowRight className="size-3" />
											</Button>
										</Link>
									</div>
								</div>
							</motion.div>
						);
					})}
				</div>

				{/* Explore All Events CTA Button */}
				<div className="text-center mt-14">
					<Link href="/events">
						<Button
							size="lg"
							variant="outline"
							className="rounded-full px-8 h-12 border-border/80 hover:bg-muted font-bold text-sm tracking-wide gap-2 shadow-xs hover:shadow-md transition-all"
						>
							<span>Explore All Public Events</span>
							<ArrowRight className="size-4 text-emerald-600" />
						</Button>
					</Link>
				</div>
			</div>
		</section>
	);
}
