// src/components/event/core/DeleteEventDialog.tsx
import { AnimatedDeleteDialog } from "@/components/common/AnimatedDeleteDialog";
import type { EventItem } from "./HorizontalEventCard";

interface DeleteEventDialogProps {
	readonly event: EventItem | null;
	readonly isOpen: boolean;
	readonly isDeleting?: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly onConfirm: () => void;
}

export function DeleteEventDialog({
	event,
	isOpen,
	isDeleting,
	onOpenChange,
	onConfirm,
}: DeleteEventDialogProps) {
	return (
		<AnimatedDeleteDialog
			isOpen={isOpen}
			isDeleting={isDeleting}
			onOpenChange={onOpenChange}
			onConfirm={onConfirm}
			title="Delete Event"
			itemName={event?.title ?? "this event"}
			itemType="Event"
			description={`Are you sure you want to delete "${event?.title}"? All associated tickets, orders, and event data will be permanently removed.`}
		/>
	);
}
