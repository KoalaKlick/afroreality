"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CustomizableEventStats } from "@/components/event/charts/CustomizableEventStats";
import { EventsFilter } from "@/components/event/core/EventsFilter";
import { EventsList } from "@/components/event/core/EventsList";
import { EventsEmptyState } from "@/components/event/core/EventsEmptyState";
import { DeleteEventDialog } from "@/components/event/core/DeleteEventDialog";
import type { EventItem } from "@/components/event/core/HorizontalEventCard";
import type { EventStatsData } from "@/components/event/core/EventStats";
import { deleteExistingEvent } from "@/lib/server-functions/event-mgmt";

interface MyEventsClientProps {
	readonly events: EventItem[];
	readonly stats: EventStatsData;
}

export function MyEventsClient({ events, stats }: MyEventsClientProps) {
	const router = useRouter();
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null);
	const [isDeleting, startTransition] = useTransition();

	const filtered = events.filter((e) => {
		const matchSearch =
			!search ||
			e.title?.toLowerCase().includes(search.toLowerCase()) ||
			e.location?.toLowerCase().includes(search.toLowerCase()) ||
			e.venueName?.toLowerCase().includes(search.toLowerCase());
		const matchStatus = statusFilter === "all" || e.status === statusFilter;
		return matchSearch && matchStatus;
	});

	const handleDelete = async () => {
		if (!eventToDelete) return;

		startTransition(async () => {
			try {
				await deleteExistingEvent({ data: { id: eventToDelete.id } });
				toast.success("Event deleted successfully");
				setEventToDelete(null);
				router.refresh();
			} catch (err: any) {
				toast.error(err?.message || "Failed to delete event");
			}
		});
	};

	return (
		<div className="flex flex-1 flex-col gap-6">
			{/* 3D Customizable Stats */}
			<CustomizableEventStats
				stats={stats}
				storageKey="afroreality:my-events-stats"
				defaultKeys={["total", "published", "ongoing", "ticketsSold"]}
			/>

			{/* Filter & Search Bar */}
			<EventsFilter
				search={search}
				onSearchChange={setSearch}
				statusFilter={statusFilter}
				onStatusFilterChange={setStatusFilter}
				showCreateButton={true}
				onCreateClick={() => {
					router.push("/my-events/create");
				}}
			/>

			{/* Empty State / Events List */}
			{events.length === 0 ? (
				<EventsEmptyState />
			) : (
				<EventsList
					events={filtered}
					isFilteredEmpty={filtered.length === 0}
					onResetFilters={() => {
						setSearch("");
						setStatusFilter("all");
					}}
					onDelete={(evt) => setEventToDelete(evt)}
				/>
			)}

			{/* Delete Confirmation Alert Dialog */}
			<DeleteEventDialog
				event={eventToDelete}
				isOpen={!!eventToDelete}
				isDeleting={isDeleting}
				onOpenChange={(open) => {
					if (!open && !isDeleting) setEventToDelete(null);
				}}
				onConfirm={handleDelete}
			/>
		</div>
	);
}
