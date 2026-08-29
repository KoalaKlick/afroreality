"use client";

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
	organizationSlug?: string | null;
}

interface HorizontalEventCardProps {
	readonly event: EventItem;
	readonly onDelete?: (event: EventItem) => void;
	readonly orgSlug?: string;
}

export function HorizontalEventCard({
	event,
	onDelete,
	orgSlug,
}: HorizontalEventCardProps) {
	const coverImageUrl = getEventImageUrl(event.flierImage);
	const targetOrgSlug = orgSlug || event.organizationSlug || "org";
	const publicUrl = event.slug ? `/${targetOrgSlug}/event/${event.slug}` : `/${targetOrgSlug}`;

	return (
		<div className="group relative flex flex-col sm:flex-row items-stretch rounded-xl bg-card overflow-hidden shadow-xs hover:shadow-md transition-all">
			{/* Full-bleed image touching left, top, and bottom */}
			<div className="relative w-full sm:w-56 md:w-64 h-32 sm:h-48 shrink-0 bg-muted overflow-hidden">
				{coverImageUrl ? (
					<Image
						src={coverImageUrl}
						alt={event.title}
						className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
					/>
				) : (
					<div className="size-full flex flex-col items-center justify-center bg-muted/60 text-muted-foreground gap-1.5 p-4 text-center">
						<AddFilesIcon className="size-8 opacity-40" />
						<span className="text-[11px]">No Flier Uploaded</span>
					</div>
				)}
			</div>

			{/* Card Body */}
			<div className="flex-1 p-4 flex flex-col justify-between space-y-3 min-w-0">
				<div className="space-y-1.5">
					<div className="flex items-start justify-between gap-2">
						<div className="space-y-1">
							<Link
								href={`/my-events/${event.id}`}
								className="font-bold text-sm sm:text-base text-foreground hover:text-primary transition-colors line-clamp-1"
							>
								{event.title}
							</Link>

							<div className="flex items-center gap-2 flex-wrap">
								<StatusBadge
									variant={eventStatusVariants[event.status] || "draft"}
								/>
								<StatusBadge
									variant={eventTypeVariants[event.type] || "standard"}
								/>
							</div>
						</div>

						{/* Action Menu */}
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
								<DropdownMenuItem asChild>
									<Link href={publicUrl as any} target="_blank">
										<Eye className="mr-2 size-4" />
										View Public Page
									</Link>
								</DropdownMenuItem>
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
											onClick={() => onDelete(event)}
											className="text-destructive focus:text-destructive"
										>
											<Trash2 className="mr-2 size-4" />
											Delete Event
										</DropdownMenuItem>
									</>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					{event.description && (
						<RichTextDisplay
							content={event.description}
							
							className="text-xs text-muted-foreground line-clamp-2"
						/>
					)}
				</div>

				{/* Meta Info: Date and Venue */}
				<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-2 border-t border-border/60">
					{event.startDate && (
						<div className="flex items-center gap-1.5 font-medium">
							<Calendar className="size-3.5 text-primary shrink-0" />
							<span>{formatDate(event.startDate)}</span>
						</div>
					)}

					{(event.venueName || event.location || event.isVirtual) && (
						<div className="flex items-center gap-1.5 font-medium">
							<MapPin className="size-3.5 text-primary shrink-0" />
							<span className="truncate max-w-[200px]">
								{event.isVirtual
									? "Virtual Event"
									: [event.venueName, event.location]
											.filter(Boolean)
											.join(", ")}
							</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

