"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight } from "lucide-react";
import { Section } from "../Section";
import { EventCard, type TawnyEventData } from "@/components/website/events/EventCard";
import { NoEventsIllustration } from "@/components/common/NoEventsIllustration";

// High quality fallback Pan-African events if DB is empty
const DEMO_EVENTS: TawnyEventData[] = [
];

interface LandingEventsSectionProps {
	readonly initialEvents?: TawnyEventData[];
}

export function LandingEventsSection({
	initialEvents,
}: LandingEventsSectionProps) {
	const events = initialEvents && initialEvents.length > 0 ? initialEvents : DEMO_EVENTS;

	return (
		<Section id="events" class="@container bg-secondary-100 py-10" content-class="space-y-8">
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
				<div className="flex flex-col items-center justify-center text-center py-16 px-4 border border-border rounded-2xl bg-card/40">
					<NoEventsIllustration className="w-44 sm:w-52 h-auto mb-4" />
					<h3 className="text-base sm:text-lg font-semibold mb-1">No Events Yet</h3>
					<p className="text-xs sm:text-sm text-muted-foreground mb-5 max-w-sm">
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
