"use client";
// src/components/event/core/HorizontalEventCard.tsx
import Link from "next/link";
import {
	Calendar,
	Edit,
	Eye,
	MapPin,
	MoreVertical,
	Trash2,
} from "lucide-react";
import { Image } from "@/components/image/Image";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/common/status-badge";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { formatDate } from "@/lib/utils";
import AddFilesIcon from "@/assets/add-files.svg";

const eventStatusVariants: Record<string, "published" | "draft" | "ongoing" | "ended" | "upcoming"> = {
	published: "published",
	draft: "draft",
	ongoing: "ongoing",
	ended: "ended",
	upcoming: "upcoming",
};

const eventTypeVariants: Record<string, "ticketed" | "voting" | "hybrid" | "standard"> = {
	ticketed: "ticketed",
	voting: "voting",
	hybrid: "hybrid",
	standard: "standard",
};

export interface EventItem {
	id: string;
	title: string;
	slug?: string | null;
	type: string;
	status: string;
	description?: string | null;
	flierImage?: string | null;
	startDate?: string | Date | null;
	venueName?: string | null;
	location?: string | null;
	isVirtual?: boolean;
}

interface HorizontalEventCardProps {
	readonly event: EventItem;
	readonly onDelete?: (event: EventItem) => void;
}

export function HorizontalEventCard({
	event,
	onDelete,
}: HorizontalEventCardProps) {
	const coverImageUrl = getEventImageUrl(event.flierImage);

	return (
		<div className="group relative flex flex-col sm:flex-row items-stretch rounded-xl  bg-card overflow-hidden shadow-xs hover:shadow-md transition-all">
			{/* Full-bleed image touching left, top, and bottom */}
			<div className="relative w-full sm:w-56 md:w-64 h-32 sm:h-48 shrink-0 bg-muted overflow-hidden">
{coverImageUrl ? (
				<Image
					src={coverImageUrl}
					alt={event.title}
					className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
				/>
			) : (
				<div className="flex size-full items-center justify-center bg-muted/60 p-4">
					<AddFilesIcon className="size-16" />
				</div>
			)}
			</div>

			{/* Event Details */}
			<div className="p-4 sm:p-5 flex-1 min-w-0 flex flex-col justify-between space-y-3">
				<div>
					<div className="flex items-start justify-between gap-3">
						<Link href={`/my-events/${event.id}` as any}
							className="font-semibold text-base sm:text-lg line-clamp-1 group-hover:text-primary transition-colors hover:underline"
						>
							{event.title}
						</Link>

						{/* Actions Dropdown */}
						<div onClick={(e) => e.preventDefault()}>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="size-8 shrink-0 -mr-2 -mt-1"
									>
										<MoreVertical className="size-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									{event.slug && (
										<DropdownMenuItem asChild>
											<Link href={`/events/${event.slug}` as any}>
												<Eye className="mr-2 size-4" />
												View Public Page
											</Link>
										</DropdownMenuItem>
									)}
									<DropdownMenuItem asChild>
										<Link href={`/my-events/${event.id}` as any}>
											<Edit className="mr-2 size-4" />
											Manage Event
										</Link>
									</DropdownMenuItem>
									{onDelete && (
										<>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												className="text-destructive focus:bg-destructive/10 focus:text-destructive"
												onSelect={(e) => {
													e.preventDefault();
													onDelete(event);
												}}
											>
												<Trash2 className="mr-2 size-4" />
												Delete Event
											</DropdownMenuItem>
										</>
									)}
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>

					<RichTextDisplay
						content={event.description}
						className="text-xs sm:text-sm line-clamp-2 mt-1"
						fallback="No description provided."
					/>
				</div>

				<div className="space-y-2 border-t pt-3">
					<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
						<div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
							<div className="flex items-center gap-1.5">
								<Calendar className="size-3.5 text-primary" />
								<span>
									{event.startDate ? formatDate(event.startDate) : "TBD"}
								</span>
							</div>
							<div className="flex items-center gap-1.5">
								<MapPin className="size-3.5 text-primary" />
								<span className="truncate">
									{event.venueName ||
										event.location ||
										(event.isVirtual ? "Virtual Event" : "Location TBD")}
								</span>
							</div>
						</div>
						<div className="flex items-center gap-1.5">
							<StatusBadge
								variant={eventStatusVariants[event.status] || "default"}
								text={event.status}
								size="sm"
								className="capitalize"
							/>
							<StatusBadge
								variant={eventTypeVariants[event.type] || "standard"}
								text={event.type}
								size="sm"
								className="capitalize"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
