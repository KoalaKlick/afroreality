"use client";

import React from "react";
import { getSocialPlatform } from "@/lib/utils/event-icons";

interface SocialLinksListProps {
	readonly socialLinks: Array<{ id?: string; url: string; platform?: string }>;
	readonly iconSize?: "sm" | "md";
	readonly labelPrefix?: string;
	readonly className?: string;
}

export function SocialLinksList({
	socialLinks,
	iconSize = "sm",
	labelPrefix,
	className = "",
}: SocialLinksListProps) {
	if (!socialLinks || socialLinks.length === 0) return null;

	const buttonDimensions = iconSize === "md" ? "size-10" : "size-8";
	const iconDimensions = iconSize === "md" ? "size-5" : "size-4";

	return (
		<div className={`flex flex-wrap items-center gap-2 ${className}`}>
			{labelPrefix && (
				<span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1 select-none">
					{labelPrefix}
				</span>
			)}
			{socialLinks.map((link) => {
				const plat = getSocialPlatform(link.url, iconDimensions);
				const titleName = link.platform || plat.name || "Social Link";

				return (
					<a
						key={link.id || link.url}
						href={link.url}
						target="_blank"
						rel="noopener noreferrer"
						className={`${buttonDimensions} rounded-full border border-border/80 bg-card flex items-center justify-center hover:bg-accent/10 hover:border-primary transition-all shadow-2xs hover:scale-105 active:scale-95 group`}
						title={titleName}
					>
						<div
							className={`flex items-center justify-center transition-colors ${
								plat.color || "text-foreground"
							}`}
						>
							{plat.icon}
						</div>
					</a>
				);
			})}
		</div>
	);
}