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
	// Generate an accent color based on event type
	const accentColors = {
		voting: "text-brand-tertiary",
		ticketed: "text-brand-secondary",
		standard: "text-brand-primary",
		hybrid: "text-brand-primary",
	};

	const colorClass =
		accentColors[event.type as keyof typeof accentColors] ??
		"text-brand-primary";
	const coverImageUrl =
		getEventImageUrl(event.flierImage) || "/landing/a.webp";
	const eventDetailsHref = `/${organizationSlug}/event/${event.slug}`;

	return (
		<Link
			href={eventDetailsHref}
			className={cn(
				"group relative block cursor-pointer overflow-hidden rounded-2xl aspect-4/3 border border-border/60 shadow-xs hover:shadow-xl transition-all duration-300",
				className,
			)}
		>
			{/* Background image */}
			<div
				className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
				style={{ backgroundImage: `url(${coverImageUrl})` }}
			/>

			{/* Dark gradient overlay */}
			<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-colors group-hover:from-black/80" />

			{/* Side accent (derived from landing page style) */}
			<svg
				className={cn(
					"absolute right-0 top-0 h-full w-24 z-10 opacity-80",
					colorClass,
				)}
				viewBox="0 0 210 297"
				preserveAspectRatio="none"
				aria-hidden="true"
			>
				<path
					d="M 179.69167,0.37081617 196.23673,146.38046 179.15249,297.0266 l 31.2116,0.35696 V 0.01812264 Z"
					fill="currentColor"
				/>
			</svg>

			{/* Content */}
			<div className="absolute inset-0 p-5 pr-10 flex flex-col justify-end text-white z-20">
				<div className="space-y-1 mb-3">
					<h3 className="font-black uppercase text-lg leading-tight tracking-tight drop-shadow-xs">
						{event.title}
					</h3>
					<div className="flex items-center gap-2 text-white/80 text-xs">
						<Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
						<span>
							{event.startDate
								? new Date(event.startDate).toLocaleDateString("en-US", {
										month: "short",
										day: "numeric",
										year: "numeric",
									})
								: "Date TBD"}
						</span>
					</div>
					{event.venueName && (
						<div className="flex items-center gap-2 text-white/80 text-xs">
							<MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
							<span className="truncate">{event.venueName}</span>
						</div>
					)}
				</div>

				<div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
					<span
						className={cn(
							"text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-md tracking-widest border border-white/10",
							colorClass,
						)}
					>
						{event.type}
					</span>
					<span className="text-[11px] font-bold uppercase underline underline-offset-4 hover:text-white transition-colors">
						View Details →
					</span>
				</div>
			</div>
		</Link>
	);
}
