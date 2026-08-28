"use client";
// src/components/event/core/EventsEmptyState.tsx
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NoEventsIllustration } from "@/components/common/NoEventsIllustration";

interface EventsEmptyStateProps {
	readonly title?: string;
	readonly description?: string;
	readonly createHref?: string;
	readonly buttonText?: string;
	readonly onAction?: () => void;
}

export function EventsEmptyState({
	title = "No events yet",
	description = "Create your first event to start selling tickets and engaging your audience.",
	createHref = "/my-events/new",
	buttonText = "Create Your First Event",
	onAction,
}: EventsEmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center py-16 text-center">
			<NoEventsIllustration className="w-56 h-auto mb-6 opacity-90" />
			<h2 className="text-xl font-semibold mb-2">{title}</h2>
			<p className="text-sm text-muted-foreground mb-6 max-w-sm">
				{description}
			</p>
			{onAction ? (
				<Button onClick={onAction} className="gap-2">
					<Plus className="size-4" />
					{buttonText}
				</Button>
			) : (
				<Button asChild className="gap-2">
					<Link href={createHref}>
						<Plus className="size-4" />
						{buttonText}
					</Link>
				</Button>
			)}
		</div>
	);
}
