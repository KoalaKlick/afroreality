"use client";

import { cn } from "@/lib/utils";
import type { Event } from "@repo/db";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { Ticket, Trophy, Calendar, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export interface OrgPublicEventCardProps {
	readonly event: Event & {
		organization?: {
			slug: string;
			name: string;
		};
	};
	readonly organizationSlug: string;
	readonly className?: string;
}

function getOrdinal(n: number): string {
	const remainder10 = n % 10;
	const remainder100 = n % 100;
	if (remainder10 === 1 && remainder100 !== 11) {
		return `${n}st`;
	}
	if (remainder10 === 2 && remainder100 !== 12) {
		return `${n}nd`;
	}
	if (remainder10 === 3 && remainder100 !== 13) {
		return `${n}rd`;
	}
	return `${n}th`;
}

/** Formats date range like "11th Apr, 2025 - 13th Apr, 2025" */
function formatEventDateRange(start: Date | string | null, end: Date | string | null): string {
	if (!start) return "Date TBD";

	const startDate = new Date(start);
	const startDay = getOrdinal(startDate.getDate());
	const startMonth = startDate.toLocaleDateString("en-US", { month: "short" });
	const startYear = startDate.getFullYear();
	const startFormatted = `${startDay} ${startMonth}, ${startYear}`;

	if (!end) return startFormatted;

	const endDate = new Date(end);
	if (startDate.toDateString() === endDate.toDateString()) {
		return startFormatted;
	}

	const endDay = getOrdinal(endDate.getDate());
	const endMonth = endDate.toLocaleDateString("en-US", { month: "short" });
	const endYear = endDate.getFullYear();
	const endFormatted = `${endDay} ${endMonth}, ${endYear}`;

	return `${startFormatted} - ${endFormatted}`;
}

/** Event type configuration with icons and labels for top-right badge using org theme colors */
function getEventTypeBadge(type?: string | null) {
	switch (type) {
		case "voting":
			return {
				icon: Trophy,
				label: "Live Voting",
				colorStyle: { color: "var(--color-brand-tertiary, #EF3340)" },
			};
		case "ticketed":
			return {
				icon: Ticket,
				label: "Ticketed Event",
				colorStyle: { color: "var(--color-brand-secondary, #FFD100)" },
			};
		case "hybrid":
			return {
				icon: Sparkles,
				label: "Hybrid (Tickets & Voting)",
				colorStyle: { color: "var(--color-brand-primary, #009A44)" },
			};
		case "standard":
		default:
			return {
				icon: Calendar,
				label: "General Event",
				colorStyle: { color: "var(--color-brand-primary, #009A44)" },
			};
	}
}

/** Status pill styling */
function getEventStatusBadge(status?: string | null) {
	switch (status) {
		case "ended":
			return {
				label: "Ended",
				className: "bg-rose-100/80 text-rose-600 border border-rose-200/60",
			};
		case "ongoing":
			return {
				label: "Live Now",
				className: "bg-emerald-100/80 text-emerald-700 border border-emerald-200/60",
			};
		case "published":
			return {
				label: "Upcoming",
				className: "bg-sky-100/80 text-sky-700 border border-sky-200/60",
			};
		case "cancelled":
			return {
				label: "Cancelled",
				className: "bg-zinc-100 text-zinc-500 border border-zinc-200",
			};
		case "draft":
			return {
				label: "Draft",
				className: "bg-amber-100/80 text-amber-700 border border-amber-200/60",
			};
		default:
			return {
				label: status ? status.charAt(0).toUpperCase() + status.slice(1) : "Published",
				className: "bg-muted text-muted-foreground border border-border",
			};
	}
}

export function OrgPublicEventCard({
	event,
	organizationSlug,
	className,
}: OrgPublicEventCardProps) {
	const coverImageUrl = getEventImageUrl(event.flierImage) || "/landing/a.webp";
	const eventDetailsHref = `/${organizationSlug}/event/${event.slug}`;

	const locationParts = [event.venueCity, event.venueCountry].filter(Boolean);
	const locationStr =
		event.venueName ||
		(locationParts.length > 0 ? locationParts.join(", ") : null);

	const dateRangeStr = formatEventDateRange(event.startDate, event.endDate);
	const typeBadge = getEventTypeBadge(event.type);
	const statusBadge = getEventStatusBadge(event.status);
	const TypeIcon = typeBadge.icon;

	return (
		<div className={cn("@container/card w-full", className)}>
			<Link
				href={eventDetailsHref}
				className="group flex flex-col @min-[480px]/card:flex-row-reverse rounded-2xl bg-card border border-border/80 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden"
			>
				{/* ── Image on right (when wide) / top (when narrow) ── */}
				<div className="relative w-full @min-[480px]/card:w-[45%] @min-[480px]/card:max-w-[280px] shrink-0 aspect-[16/9] @min-[480px]/card:aspect-auto min-h-[160px] overflow-hidden bg-muted">
					<Image
						src={coverImageUrl}
						alt={event.title}
						fill
						className="object-cover transition-transform duration-500 group-hover:scale-105"
						sizes="(max-width: 640px) 100vw, 320px"
						unoptimized
					/>

					{/* Pan-African Side Accent SVG */}
					<svg
						className="absolute right-0 top-0 h-full w-16 sm:w-20 z-10 opacity-75 pointer-events-none"
						style={typeBadge.colorStyle}
						viewBox="0 0 210 297"
						preserveAspectRatio="none"
						aria-hidden="true"
					>
						<path
							d="M 179.69167,0.37081617 196.23673,146.38046 179.15249,297.0266 l 31.2116,0.35696 V 0.01812264 Z"
							fill="currentColor"
						/>
					</svg>

					{/* Floating Event Type/Status icon at top-right */}
					<div
						className="absolute top-3 right-3 z-20 size-9 rounded-full bg-white/95 text-foreground shadow-md backdrop-blur-sm flex items-center justify-center border border-black/5 transition-transform duration-200 group-hover:scale-110"
						title={typeBadge.label}
						aria-label={typeBadge.label}
					>
						<TypeIcon className="size-4.5" style={typeBadge.colorStyle} />
					</div>
				</div>

				{/* ── Details on white card background ── */}
				<div className="flex-1 flex flex-col justify-between p-5 @min-[480px]/card:p-6 min-h-[160px]">
					<div className="space-y-1.5">
						{/* Date */}
						<p className="text-xs text-muted-foreground font-mono tracking-tight">
							{dateRangeStr}
						</p>

						{/* Title */}
						<h3 className="text-base @min-[480px]:text-lg font-bold text-foreground leading-snug tracking-tight line-clamp-2 group-hover:text-primary transition-colors">
							{event.title}
						</h3>

						{/* Location */}
						{locationStr && (
							<p className="text-xs text-muted-foreground/80 font-mono truncate">
								{locationStr}
							</p>
						)}
					</div>

					{/* Status badge pill at bottom-left */}
					<div className="pt-4 mt-auto flex items-center">
						<span
							className={cn(
								"inline-block text-[11px] font-medium px-3 py-0.5 rounded-md",
								statusBadge.className,
							)}
						>
							{statusBadge.label}
						</span>
					</div>
				</div>
			</Link>
		</div>
	);
}
