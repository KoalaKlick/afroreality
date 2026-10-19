"use client";

import React from "react";
import { getSponsorImageUrl } from "@/lib/image-url-utils";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface SponsorsListProps {
	readonly sponsors: Array<{
		id?: string;
		name: string;
		logoUrl?: string | null;
		logo?: string | null;
		tier?: string | null;
		websiteUrl?: string | null;
	}>;
	readonly labelPrefix?: string;
	readonly className?: string;
	readonly maxDisplay?: number;
	readonly size?: "sm" | "md" | "lg";
}

const sizeConfig = {
	sm: {
		container: "h-11  p-1.5 ",
		icon: "size-4",
		text: "text-[9px]",
	},
	md: {
		container: "h-14 sm:h-16 p-2",
		icon: "size-5",
		text: "text-[11px]",
	},
	lg: {
		container: "h-16 sm:h-20  p-2.5 sm:p-3",
		icon: "size-6",
		text: "text-xs",
	},
};

export function SponsorsList({
	sponsors,
	labelPrefix = "",
	className = "",
	maxDisplay = 20,
	size = "md",
}: SponsorsListProps) {
	if (!sponsors || sponsors.length === 0) return null;

	const displayedSponsors = sponsors.slice(0, maxDisplay);
	const isMarquee = displayedSponsors.length > 5;
	const currentSize = sizeConfig[size] || sizeConfig.md;

	const renderSponsorItem = (sponsor: any, key: string) => {
		const imgKey = sponsor.logoUrl || sponsor.logo;
		const imgUrl = imgKey ? getSponsorImageUrl(imgKey) : null;
		const sponsorName = sponsor.name || "Official Sponsor";

		const TriggerContent = (
			<div
				className={cn(
					"border border-border/80 bg-card hover:bg-card/90 flex items-center justify-center hover:border-primary/50 transition-all shadow-xs hover:shadow-md hover:scale-[1.03] active:scale-[0.98] cursor-pointer shrink-0 overflow-hidden",
					currentSize.container,
				)}
			>
				{imgUrl ? (
					<img
						src={imgUrl}
						alt={sponsorName}
						className="w-full h-full object-contain filter contrast-105 hover:brightness-105 transition-all duration-200"
						loading="lazy"
					/>
				) : (
					<div className="flex flex-col items-center justify-center gap-1 w-full text-center px-1">
						<Award className={cn("text-muted-foreground/60 shrink-0", currentSize.icon)} />
						<span className={cn("font-bold uppercase tracking-tight text-muted-foreground truncate w-full", currentSize.text)}>
							{sponsorName}
						</span>
					</div>
				)}
			</div>
		);

		return (
			<Tooltip key={key}>
				<TooltipTrigger asChild>
					{sponsor.websiteUrl ? (
						<a
							href={sponsor.websiteUrl}
							target="_blank"
							rel="noopener noreferrer"
						>
							{TriggerContent}
						</a>
					) : (
						TriggerContent
					)}
				</TooltipTrigger>
				<TooltipContent side="top" className="font-semibold">
					<p>{sponsorName}</p>
					{sponsor.tier && (
						<p className="text-[10px] text-muted-foreground font-normal capitalize">
							{sponsor.tier} Partner
						</p>
					)}
				</TooltipContent>
			</Tooltip>
		);
	};

	return (
		<TooltipProvider delayDuration={100}>
			<div className={`space-y-2 ${className}`}>
				{labelPrefix && (
					<span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block select-none">
						{labelPrefix}
					</span>
				)}
				{isMarquee ? (
					<div className="relative overflow-hidden w-full py-0.5 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
						<div
							className="flex w-max items-center gap-3 animate-marquee"
							style={{
								animationDuration: `${Math.max(12, displayedSponsors.length * 3.5)}s`,
							}}
						>
							{/* Double the list for seamless infinite loop */}
							{[...displayedSponsors, ...displayedSponsors].map((sponsor, idx) =>
								renderSponsorItem(sponsor, `${sponsor.id || sponsor.name}-${idx}`)
							)}
						</div>
					</div>
				) : (
					<div className="flex flex-wrap items-center gap-2.5">
						{displayedSponsors.map((sponsor, idx) =>
							renderSponsorItem(sponsor, sponsor.id || `${sponsor.name}-${idx}`)
						)}
					</div>
				)}
			</div>
		</TooltipProvider>
	);
}