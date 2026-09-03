"use client";

import Link from "next/link";
import { EventCard, type TawnyEventData } from "./EventCard";
import { CalendarX } from "lucide-react";

interface EventsGridProps {
	readonly events: TawnyEventData[];
	readonly loading?: boolean;
}

export function EventsGrid({ events, loading = false }: EventsGridProps) {
	if (loading) {
		return (
			<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
				{Array.from({ length: 8 }).map((_, i) => (
					<div key={i} className="animate-pulse space-y-2.5">
						<div className="aspect-4/5 bg-muted rounded-xl border border-border shadow-none" />
						<div className="h-4 bg-muted rounded w-3/4" />
						<div className="h-3.5 bg-muted rounded w-1/2" />
					</div>
				))}
			</div>
		);
	}

	if (events.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center border border-border rounded-xl">
				<div className="size-12 rounded-lg bg-muted flex items-center justify-center mb-3">
					<CalendarX className="size-6 text-muted-foreground" />
				</div>
				<h3 className="text-base font-semibold mb-1 text-foreground">
					No events found
				</h3>
				<p className="text-muted-foreground max-w-sm text-xs">
					We couldn&apos;t find any events matching your search. Try adjusting your
					filters or search term.
				</p>
			</div>
		);
	}

	return (
		<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
			{events.map((event) => (
				<Link
					key={event.id}
					href={`/${event.organization.slug}/event/${event.slug}`}
					className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
				>
					<EventCard event={event} />
				</Link>
			))}
		</div>
	);
}
