"use client";
// src/components/event/core/EventsList.tsx
import { Button } from "@/components/ui/button";
import { NoEventsIllustration } from "@/components/common/NoEventsIllustration";
import { HorizontalEventCard, type EventItem } from "./HorizontalEventCard";

interface EventsListProps {
	readonly events: EventItem[];
	readonly isFilteredEmpty?: boolean;
	readonly onResetFilters?: () => void;
	readonly onDelete?: (event: EventItem) => void;
}

export function EventsList({
	events,
	isFilteredEmpty,
	onResetFilters,
	onDelete,
}: EventsListProps) {
	if (isFilteredEmpty || events.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<NoEventsIllustration className="w-48 sm:w-56 h-auto mb-6 opacity-80" />
				<h3 className="text-xl font-semibold mb-2">No matching events</h3>
				<p className="text-sm text-muted-foreground mb-6 max-w-sm">
					We couldn't find any events matching your search or filters.
				</p>
				{onResetFilters && (
					<Button
						variant="outline"
						size="sm"
						onClick={onResetFilters}
					>
						Clear Filters
					</Button>
				)}
			</div>
		);
	}

	return (
		<div className="grid gap-4">
			{events.map((event) => (
				<HorizontalEventCard
					key={event.id}
					event={event}
					onDelete={onDelete}
				/>
			))}
		</div>
	);
}
