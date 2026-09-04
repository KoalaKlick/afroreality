"use client";

import { Calendar, Clock, MapPin, Sparkles, MessageSquare, ListTree, Share2 } from "lucide-react";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NoStandardEventIllustration } from "@/components/common/NoStandardEventIllustration";
import { shareEvent } from "@/lib/utils/share-utils";

interface StandardEventContentProps {
	readonly event: {
		id: string;
		title: string;
		description?: string | null;
		category?: string | null;
		tags?: string[] | null;
		startDate?: Date | string | null;
		endDate?: Date | string | null;
		venueName?: string | null;
		venueAddress?: string | null;
		venueCity?: string | null;
		venueCountry?: string | null;
		isVirtual?: boolean;
		organization: {
			name: string;
			slug: string;
			logoUrl?: string | null;
			primaryColor?: string | null;
			secondaryColor?: string | null;
			tertiaryColor?: string | null;
		};
	};
	readonly orgSlug: string;
	readonly eventSlug: string;
}

export function StandardEventContent({
	event,
	orgSlug,
	eventSlug,
}: StandardEventContentProps) {
	const startDate = event.startDate ? new Date(event.startDate) : null;
	const endDate = event.endDate ? new Date(event.endDate) : null;

	const dateStr = startDate
		? startDate.toLocaleDateString("en-US", {
				weekday: "long",
				month: "long",
				day: "numeric",
				year: "numeric",
			})
		: "Date to be announced";

	const timeStr = startDate
		? startDate.toLocaleTimeString("en-US", {
				hour: "2-digit",
				minute: "2-digit",
			})
		: null;

	const endTimeStr = endDate
		? endDate.toLocaleTimeString("en-US", {
				hour: "2-digit",
				minute: "2-digit",
			})
		: null;

	const locationStr = event.isVirtual
		? "Virtual Event"
		: [event.venueName, event.venueCity, event.venueCountry].filter(Boolean).join(", ") ||
			"Venue to be announced";

	const hasContent = Boolean(
		(event.description && event.description.trim().length > 0) ||
		event.category ||
		(event.tags && event.tags.length > 0)
	);

	const handleShare = async () => {
		await shareEvent({
			title: event.title,
			organizationName: event.organization.name,
			description: event.description || undefined,
			dateStr: dateStr,
			locationStr: locationStr,
		});
	};

	if (!hasContent) {
		return (
			<div className="rounded-2xl border bg-card p-8 sm:p-12 transition-all">
				<div className="flex flex-col items-center justify-center text-center max-w-lg mx-auto">
					<NoStandardEventIllustration className="size-60 sm:size-72 mb-6 opacity-90" />
					<div className="flex items-center gap-2 mb-2">
						<Badge
							variant="secondary"
							className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border-primary/20"
						>
							Standard Event
						</Badge>
					</div>
					<h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-3 font-millik">
						Schedule &amp; Outline Coming Soon.
					</h3>
					<p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
						The organizer has not published the full timeline, session outline, or interactive discussion topics for this event yet. Check back soon for the complete schedule!
					</p>

					{/* Quick details chips */}
					<div className="flex flex-wrap items-center justify-center gap-2 mb-8">
						<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/60 text-xs font-medium text-foreground">
							<Calendar className="size-3.5 text-primary shrink-0" />
							<span>{dateStr}</span>
						</div>
						{timeStr && (
							<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/60 text-xs font-medium text-foreground">
								<Clock className="size-3.5 text-primary shrink-0" />
								<span>{timeStr}</span>
							</div>
						)}
						<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/60 text-xs font-medium text-foreground">
							<MapPin className="size-3.5 text-primary shrink-0" />
							<span className="truncate max-w-[200px]">{locationStr}</span>
						</div>
					</div>

					<Button
						variant="outline"
						size="sm"
						onClick={handleShare}
						className="gap-2 text-xs font-bold uppercase tracking-wider"
					>
						<Share2 className="size-3.5" /> Share Event
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Event Overview Card */}
			<div className="rounded-2xl border bg-card p-6 sm:p-8 space-y-6">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
					<div className="space-y-1">
						<div className="flex items-center gap-2">
							<Badge
								variant="secondary"
								className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border-primary/20"
							>
								Event Outline
							</Badge>
							{event.category && (
								<Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
									{event.category}
								</Badge>
							)}
						</div>
						<h2 className="text-2xl font-black uppercase tracking-tight text-foreground font-millik">
							About This Event.
						</h2>
					</div>

					<Button
						variant="outline"
						size="sm"
						onClick={handleShare}
						className="gap-1.5 text-xs font-semibold self-start sm:self-auto"
					>
						<Share2 className="size-3.5" /> Share
					</Button>
				</div>

				{/* Description */}
				{event.description && (
					<div className="text-sm text-muted-foreground leading-relaxed">
						<RichTextDisplay content={event.description} />
					</div>
				)}

				{/* Schedule & Logistics Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
					<div className="p-4 rounded-xl bg-muted/40 border border-border/60 flex items-start gap-3">
						<div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
							<Calendar className="size-4 text-primary" />
						</div>
						<div className="space-y-0.5">
							<span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
								Date &amp; Schedule
							</span>
							<p className="text-xs font-bold text-foreground">{dateStr}</p>
							{timeStr && (
								<p className="text-[11px] text-muted-foreground">
									{timeStr} {endTimeStr ? ` - ${endTimeStr}` : ""}
								</p>
							)}
						</div>
					</div>

					<div className="p-4 rounded-xl bg-muted/40 border border-border/60 flex items-start gap-3">
						<div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
							<MapPin className="size-4 text-primary" />
						</div>
						<div className="space-y-0.5">
							<span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
								Location &amp; Venue
							</span>
							<p className="text-xs font-bold text-foreground">{locationStr}</p>
							{event.venueAddress && (
								<p className="text-[11px] text-muted-foreground truncate">
									{event.venueAddress}
								</p>
							)}
						</div>
					</div>
				</div>

				{/* Tags */}
				{event.tags && event.tags.length > 0 && (
					<div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-border/40">
						<span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
							Tags:
						</span>
						{event.tags.map((tag) => (
							<span
								key={tag}
								className="text-xs font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md"
							>
								#{tag}
							</span>
						))}
					</div>
				)}
			</div>

			{/* Interactive Timeline & Topics Outline (Upcoming Interactive Flow) */}
			<div className="rounded-2xl border bg-card p-6 sm:p-8 space-y-6">
				<div className="flex items-center justify-between gap-4">
					<div className="space-y-1">
						<div className="flex items-center gap-2">
							<Badge
								variant="secondary"
								className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border-primary/20 flex items-center gap-1"
							>
								<Sparkles className="size-3" /> Interactive Flow
							</Badge>
						</div>
						<h3 className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-2 font-millik">
							<ListTree className="size-5 text-primary" />
							Event Timeline &amp; Interactive Topics
						</h3>
					</div>
				</div>

				<p className="text-xs text-muted-foreground leading-relaxed">
					Follow the official event schedule outline below. Interactive topic threads and live session discussions will synchronize with each milestone as the event unfolds.
				</p>

				{/* Timeline Skeleton / Outline Flow */}
				<div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/80">
					{/* Milestone 1 */}
					<div className="relative space-y-1.5">
						<div className="absolute -left-6 top-1 size-4 rounded-full border-2 border-primary bg-background flex items-center justify-center" />
						<div className="flex items-center gap-2">
							<span className="text-[10px] font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
								{timeStr || "09:00 AM"}
							</span>
							<h4 className="text-xs font-bold text-foreground uppercase tracking-wide">
								Opening &amp; Welcome Keynote
							</h4>
						</div>
						<p className="text-xs text-muted-foreground">
							Welcoming attendees, opening remarks by the organizer, and orientation for interactive sessions.
						</p>
					</div>

					{/* Milestone 2 */}
					<div className="relative space-y-1.5">
						<div className="absolute -left-6 top-1 size-4 rounded-full border-2 border-border bg-background" />
						<div className="flex items-center gap-2">
							<span className="text-[10px] font-mono font-bold text-muted-foreground px-2 py-0.5 rounded bg-muted">
								Main Session
							</span>
							<h4 className="text-xs font-bold text-foreground uppercase tracking-wide">
								Core Presentation &amp; Topic Deep Dives
							</h4>
						</div>
						<p className="text-xs text-muted-foreground">
							Curated panels and topic exploration coinciding with live audience interaction and discussion points.
						</p>
					</div>

					{/* Milestone 3 */}
					<div className="relative space-y-1.5">
						<div className="absolute -left-6 top-1 size-4 rounded-full border-2 border-border bg-background" />
						<div className="flex items-center gap-2">
							<span className="text-[10px] font-mono font-bold text-muted-foreground px-2 py-0.5 rounded bg-muted">
								Interactive
							</span>
							<h4 className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
								<MessageSquare className="size-3 text-primary" />
								Audience Q&amp;A &amp; Topic Conversations
							</h4>
						</div>
						<p className="text-xs text-muted-foreground">
							Interactive discussion space for attendees to participate, ask questions, and engage on session topics.
						</p>
					</div>

					{/* Milestone 4 */}
					<div className="relative space-y-1.5">
						<div className="absolute -left-6 top-1 size-4 rounded-full border-2 border-border bg-background" />
						<div className="flex items-center gap-2">
							<span className="text-[10px] font-mono font-bold text-muted-foreground px-2 py-0.5 rounded bg-muted">
								Wrap-Up
							</span>
							<h4 className="text-xs font-bold text-foreground uppercase tracking-wide">
								Networking &amp; Closing Remarks
							</h4>
						</div>
						<p className="text-xs text-muted-foreground">
							Concluding announcements, networking opportunities, and event follow-up resources.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
