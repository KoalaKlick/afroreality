"use client";

import { cn } from "@/lib/utils";
import type { Event } from "@repo/db";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { Calendar, MapPin } from "lucide-react";
import Link from "next/link";

interface PublicEventCardProps {
	readonly event: Event;
	readonly organizationSlug: string;
	readonly className?: string;
}

export function PublicEventCard({
	event,
	organizationSlug,
	className,
}: PublicEventCardProps) {
	const accentColors = {
		voting: "text-brand-tertiary",
		ticketed: "text-brand-secondary",
		standard: "text-brand-primary",
		hybrid: "text-brand-primary",
	};

	const colorClass =
		accentColors[event.type as keyof typeof accentColors] ??
		"text-brand-primary";
	const coverImageUrl = getEventImageUrl(event.flierImage) ?? "/landing/a.webp";
	const eventDetailsHref = `/${organizationSlug}/event/${event.slug}`;

	return (
		<Link
			href={eventDetailsHref}
			className={cn(
				"group flex flex-col overflow-hidden rounded-2xl bg-card border border-border/80 transition-all duration-300 hover:border-primary/50 hover:shadow-lg",
				className,
			)}
		>
			<div className="relative aspect-16/9 w-full overflow-hidden bg-muted">
				<img
					src={coverImageUrl}
					alt={event.title}
					className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
				/>
				<div className="absolute top-3 right-3 rounded-full bg-background/80 px-2.5 py-1 text-xs font-semibold backdrop-blur-md capitalize">
					{event.type}
				</div>
			</div>

			<div className="flex flex-1 flex-col p-5">
				<h3 className="line-clamp-1 text-lg font-bold text-foreground group-hover:text-primary transition-colors">
					{event.title}
				</h3>

				{event.description && (
					<p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
						{event.description}
					</p>
				)}

				<div className="mt-auto pt-4 flex flex-col gap-2 border-t border-border/60 text-xs text-muted-foreground">
					{event.startDate && (
						<div className="flex items-center gap-2">
							<Calendar className="size-3.5 text-primary" />
							<span>{new Date(event.startDate).toLocaleDateString()}</span>
						</div>
					)}
					<div className="flex items-center gap-2">
						<MapPin className="size-3.5 text-primary" />
						<span className="truncate">
							{event.isVirtual
								? "Virtual Event"
								: [event.venueName, event.venueCity].filter(Boolean).join(", ") ||
									"Venue TBA"}
						</span>
					</div>
				</div>
			</div>
		</Link>
	);
}
