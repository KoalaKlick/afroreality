"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, CalendarX } from "lucide-react";
import { Section } from "../Section";
import { EventCard, type TawnyEventData } from "@/components/website/events/EventCard";

// High quality fallback Pan-African events if DB is empty
const DEMO_EVENTS: TawnyEventData[] = [
	{
		id: "demo-1",
		title: "Afrochella Cultural & Music Gala",
		slug: "afrochella-cultural-gala",
		description: "Experience the vibrant sounds, fashion, and cuisine of contemporary Africa.",
		type: "ticketed",
		status: "published",
		startDate: new Date("2026-10-15T18:00:00Z"),
		flierImage: "/landing/a.webp",
		venueName: "Independence Square",
		venueCity: "Accra, Ghana",
		hasUssd: true,
		minPrice: 150,
		category: "Music & Concerts",
		organization: {
			name: "Culture Africa Collective",
			slug: "culture-africa",
		},
	},
	{
		id: "demo-2",
		title: "Ghana Creative Arts & Film Honors",
		slug: "ghana-creative-arts-honors",
		description: "Cast your votes for the breakthrough African films and actors of the year.",
		type: "voting",
		status: "published",
		startDate: new Date("2026-11-05T19:00:00Z"),
		flierImage: "/landing/b.webp",
		venueName: "National Theatre",
		venueCity: "Accra, Ghana",
		hasUssd: true,
		minPrice: 2,
		category: "Awards & Honors",
		organization: {
			name: "Film Guild West Africa",
			slug: "film-guild",
		},
	},
	{
		id: "demo-3",
		title: "Tech Across Africa Summit & Expo",
		slug: "tech-across-africa-summit",
		description: "Pan-African technology conference featuring product demos, keynotes, and founder showcases.",
		type: "ticketed",
		status: "published",
		startDate: new Date("2026-11-20T09:00:00Z"),
		flierImage: "/landing/c.webp",
		venueName: "Kempinski Gold Coast",
		venueCity: "Accra, Ghana",
		hasUssd: false,
		minPrice: 80,
		category: "Conferences",
		organization: {
			name: "Tech Across Africa",
			slug: "tech-africa",
		},
	},
	{
		id: "demo-4",
		title: "Lagos Highlife & Heritage Ball",
		slug: "lagos-highlife-heritage-ball",
		description: "An intimate evening of live orchestra, vintage horn sections, and cultural ballroom dance.",
		type: "ticketed",
		status: "published",
		startDate: new Date("2026-12-02T19:30:00Z"),
		flierImage: "/landing/d.webp",
		venueName: "Eko Convention Center",
		venueCity: "Lagos, Nigeria",
		hasUssd: true,
		minPrice: 200,
		category: "Cultural Festivals",
		organization: {
			name: "Vintage West Africa",
			slug: "vintage-west-africa",
		},
	},
];

interface LandingEventsSectionProps {
	readonly initialEvents?: TawnyEventData[];
}

export function LandingEventsSection({
	initialEvents,
}: LandingEventsSectionProps) {
	const events = initialEvents && initialEvents.length > 0 ? initialEvents : DEMO_EVENTS;

	return (
		<Section id="events" class="mt-20 md:mt-24 @container" content-class="space-y-8">
			{/* Section Header */}
			<div className="md:flex justify-between items-end gap-6">
				<div className="max-w-md space-y-2">
					<h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground font-millik">
						Discover Amazing{" "}
						<span className="text-primary">African Events</span>
					</h2>
					<p className="text-muted-foreground text-sm sm:text-base">
						Explore concerts, cultural galas, awards, and conferences happening across the continent and diaspora.
					</p>
				</div>

				<div className="flex items-center gap-3 mt-4 md:mt-0">
					<Link href="/register" className="hidden md:inline-flex">
						<Button className="h-9 px-4 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-none">
							Create Event
							<Plus className="size-3.5 ml-1.5" />
						</Button>
					</Link>

					<Link href="/events">
						<Button variant="outline" className="h-9 px-4 rounded-lg text-xs font-semibold border-border hover:border-primary/60 hover:text-primary shadow-none">
							View All Events
							<ArrowRight className="size-3.5 ml-1.5" />
						</Button>
					</Link>
				</div>
			</div>

			{/* Events Grid */}
			{events.length === 0 ? (
				<div className="text-center py-16 border border-border rounded-xl">
					<CalendarX className="size-10 text-muted-foreground mx-auto mb-3" />
					<h3 className="text-base font-semibold mb-1">No Events Yet</h3>
					<p className="text-xs text-muted-foreground mb-4">
						Be the first to host an event across Africa on our platform!
					</p>
					<Link href="/register">
						<Button className="h-9 px-4 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-none">
							Create Your Event
							<Plus className="size-3.5 ml-1.5" />
						</Button>
					</Link>
				</div>
			) : (
				<div className="grid gap-5 grid-cols-1 @lg:grid-cols-2 @2xl:grid-cols-3 @6xl:grid-cols-4">
					{events.slice(0, 6).map((event) => (
						<Link
							key={event.id}
							href={`/${event.organization.slug}/event/${event.slug}`}
							className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
						>
							<EventCard event={event} />
						</Link>
					))}
				</div>
			)}
		</Section>
	);
}
