"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

export interface TawnyOrganizerData {
	id: string;
	name: string;
	slug: string;
	description?: string | null;
	logoUrl?: string | null;
	bannerUrl?: string | null;
	eventsCount?: number;
	categories?: string[];
	verified?: boolean;
}

interface OrganizerCardProps {
	readonly organizer: TawnyOrganizerData;
}

function getInitials(name: string): string {
	return name
		.split(" ")
		.map((w) => w[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
}

export function OrganizerCard({ organizer }: OrganizerCardProps) {
	const categories = organizer.categories && organizer.categories.length > 0
		? organizer.categories
		: ["African Festivals", "Concerts", "Live Awards"];

	return (
		<Link
			href={`/${organizer.slug}`}
			className="group flex flex-col sm:flex-row sm:items-stretch gap-3 sm:gap-5 p-4 sm:p-5 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors shadow-none"
		>
			{/* Left Image / Initials (Preline clean rounded-lg) */}
			<div className="w-full sm:w-[180px] sm:shrink-0 aspect-[16/10] sm:aspect-[4/5] overflow-hidden bg-muted rounded-lg relative border border-border shadow-none">
				{organizer.logoUrl ? (
					<Image
						src={organizer.logoUrl}
						alt={organizer.name}
						fill
						className="object-cover group-hover:scale-105 transition-transform duration-300"
						sizes="(max-width: 640px) 100vw, 180px"
					/>
				) : (
					<div className="size-full flex items-center justify-center bg-muted text-primary font-bold text-3xl font-millik">
						{getInitials(organizer.name)}
					</div>
				)}
			</div>

			{/* Right Content */}
			<div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
				{/* Name & Verified Badge */}
				<div className="flex items-center gap-1.5">
					<h3 className="font-bold text-lg sm:text-xl text-foreground truncate group-hover:text-primary transition-colors">
						{organizer.name}
					</h3>
					<svg
						viewBox="0 0 20 20"
						xmlns="http://www.w3.org/2000/svg"
						className="size-4 shrink-0"
						aria-label="Verified African Organizer"
					>
						<path
							fill="#3B82F6"
							d="M10 0.8 12.15 2.2 14.8 1.6 15.8 4.1 18.4 5.2 17.8 7.85 19.2 10 17.8 12.15 18.4 14.8 15.9 14.8 18.4 12.15 17.8 10 19.2 7.85 17.8 5.2 18.4 4.2 15.9 1.6 14.8 2.2 12.15 0.8 10 2.2 7.85 1.6 5.2 4.2 4.1 5.2 1.6 7.85 2.2Z"
						/>
						<path
							d="M6.7 10.3l2.1 2.1 4.5-4.8"
							fill="none"
							stroke="#fff"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</div>

				<p className="text-xs sm:text-sm text-muted-foreground truncate">
					@{organizer.slug}
				</p>

				<div className="h-px bg-border my-2" />

				{organizer.description && (
					<p className="text-xs sm:text-sm text-foreground/80 line-clamp-2 mb-2 leading-relaxed">
						<span className="font-semibold text-foreground">
							{organizer.name}:
						</span>{" "}
						{organizer.description}
					</p>
				)}

				<div className="flex flex-wrap gap-1.5 pt-0.5">
					{categories.slice(0, 4).map((cat) => (
						<Badge
							key={cat}
							className="bg-primary/10 text-primary border-0 hover:bg-primary/20 text-[11px] font-semibold px-2 py-0.5 rounded-md shadow-none"
						>
							{cat}
						</Badge>
					))}
					{categories.length > 4 && (
						<Badge
							variant="outline"
							className="text-[11px] px-2 py-0.5 rounded-md border-border shadow-none"
						>
							+{categories.length - 4}
						</Badge>
					)}
				</div>
			</div>
		</Link>
	);
}
