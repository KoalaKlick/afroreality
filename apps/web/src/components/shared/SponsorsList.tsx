"use client";

import React from "react";
import { getEventImageUrl } from "@/lib/image-url-utils";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Award } from "lucide-react";

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
}

export function SponsorsList({
	sponsors,
	labelPrefix = "Official Sponsors & Partners:",
	className = "",
	maxDisplay = 10,
}: SponsorsListProps) {
	if (!sponsors || sponsors.length === 0) return null;

	const displayedSponsors = sponsors.slice(0, maxDisplay);

	return (
		<TooltipProvider delayDuration={100}>
			<div className={`space-y-2 ${className}`}>
				{labelPrefix && (
					<span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block select-none">
						{labelPrefix}
					</span>
				)}
				<div className="flex flex-wrap items-center gap-2.5">
					{displayedSponsors.map((sponsor, idx) => {
						const imgKey = sponsor.logoUrl || sponsor.logo;
						const imgUrl = imgKey ? getEventImageUrl(imgKey) : null;
						const sponsorName = sponsor.name || "Official Sponsor";

						const TriggerContent = (
							<div
								className="size-9 border border-border/80 bg-card p-0.5 flex items-center justify-center hover:border-primary/50 transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer shrink-0"
							>
								{imgUrl ? (
									<img
										src={imgUrl}
										alt={sponsorName}
										className="w-full h-full object-contain "
									/>
								) : (
									<Award className="size-4 text-muted-foreground/60" />
								)}
							</div>
						);

						return (
							<Tooltip key={sponsor.id || `${sponsorName}-${idx}`}>
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
					})}
				</div>
			</div>
		</TooltipProvider>
	);
}