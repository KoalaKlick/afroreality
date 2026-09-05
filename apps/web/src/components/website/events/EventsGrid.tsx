"use client";

import Link from "next/link";
import { EventCard, type TawnyEventData } from "./EventCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { NoEventsIllustration } from "@/components/common/NoEventsIllustration";

interface EventsGridProps {
	readonly events: TawnyEventData[];
	readonly loading?: boolean;
	readonly onReset?: () => void;
	readonly hasActiveFilters?: boolean;
}

export function EventsGrid({
	events,
	loading = false,
	onReset,
	hasActiveFilters = false,
}: EventsGridProps) {
	if (loading) {
		return (
			<div className="@container">
				<div className="grid gap-5 grid-cols-1 @lg:grid-cols-2 @2xl:grid-cols-3 @6xl:grid-cols-4">
					{Array.from({ length: 8 }).map((_, i) => (
						<div key={i} className="animate-pulse space-y-2.5">
							<div className="aspect-4/5 bg-muted rounded-xl border border-border shadow-none" />
							<div className="h-4 bg-muted rounded w-3/4" />
							<div className="h-3.5 bg-muted rounded w-1/2" />
						</div>
					))}
				</div>
			</div>
		);
	}

	if (events.length === 0) {
		return (
			<div className="border border-border rounded-2xl bg-card/30 p-6 sm:p-12">
				<EmptyState
					svgIcon={NoEventsIllustration}
					svgClassName="w-44 sm:w-52 h-auto mb-4"
					title="No Events Found"
					description={
						hasActiveFilters
							? "We couldn't find any events matching your search or filter criteria. Try adjusting your query or resetting filters."
							: "There are currently no events listed in this section. Check back soon or host your own African event!"
					}
					action={
						hasActiveFilters && onReset ? (
							<Button
								variant="outline"
								size="sm"
								onClick={onReset}
								className="rounded-lg text-xs font-semibold shadow-none hover:border-primary/50 hover:text-primary"
							>
								Clear Filters
							</Button>
						) : (
							<Button
								asChild
								size="sm"
								className="rounded-lg text-xs font-semibold shadow-none"
							>
								<Link href="/my-events/create">Host an Event</Link>
							</Button>
						)
					}
				/>
			</div>
		);
	}

	return (
		<div className="@container">
			<div className="grid gap-5 grid-cols-1 @lg:grid-cols-2 @2xl:grid-cols-3 @6xl:grid-cols-4">
				{events.map((event) => (
					<Link
						key={event.id}
						href={`/${event.organization.slug}/event/${event.slug}`}
						className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
					>
						<EventCard event={event} />
					</Link>
				))}
			</div>
		</div>
	);
}
