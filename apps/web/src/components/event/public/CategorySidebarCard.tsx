"use client";

import Link from "next/link";
import {
	Trophy,
	ArrowLeft,
	Lock,
	ImageIcon,
	ChevronRight,
	Calendar,
	MapPin,
	Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getEventImageUrl, getOrgImageUrl } from "@/lib/image-url-utils";
import { getSocialPlatform, getGalleryProvider } from "@/lib/utils/event-icons";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { PanAfricanDivider } from "@/components/shared/PanAficDivider";

interface CategorySidebarCardProps {
	readonly category: {
		id: string;
		name: string;
		description?: string | null;
		votePrice?: number;
		nominationPrice?: number;
		allowPublicNomination?: boolean;
		templateImage?: string | null;
	};
	readonly event: {
		id: string;
		title: string;
		slug: string;
		votingMode?: string;
		flierUrl?: string | null;
		bannerUrl?: string | null;
		startDate?: string | Date | null;
		venueName?: string | null;
		venueCity?: string | null;
		venueCountry?: string | null;
		organization: {
			name: string;
			slug: string;
			logoUrl?: string | null;
		};
	};
	readonly sponsors?: any[];
	readonly galleryLinks?: any[];
	readonly socialLinks?: any[];
	readonly orgSlug: string;
	readonly eventSlug: string;
}

export function CategorySidebarCard({
	category,
	event,
	sponsors = [],
	galleryLinks = [],
	socialLinks = [],
	orgSlug,
	eventSlug,
}: CategorySidebarCardProps) {
	const isInternalVoting = event.votingMode === "internal";
	const orgLogo = getOrgImageUrl(event.organization.logoUrl);
	const templateImg = getEventImageUrl(
		category.templateImage || event.flierUrl || event.bannerUrl || (event as any).flierImage
	);

	return (
		<div className="rounded-2xl border bg-card overflow-hidden flex flex-col h-full max-h-full">
			{/* Template / Cover Header - Stays Fixed */}
			{templateImg && (
				<div className="relative h-36 shrink-0 w-full overflow-hidden bg-muted">
					<img
						src={templateImg}
						alt={category.name}
						className="w-full h-full object-cover"
					/>
				</div>
			)}

			<div className="p-6 flex flex-col flex-1 min-h-0 space-y-5 overflow-hidden">
				{/* Back link & Event context - Stays Fixed */}
				<div className="space-y-3 shrink-0">
					<Button asChild variant="ghost" size="sm" className="h-8 -ml-2 gap-1.5 text-xs">
						<Link href={`/${orgSlug}/event/${eventSlug}`}>
							<ArrowLeft className="size-3.5" /> Back to Event
						</Link>
					</Button>

					<div className="space-y-1">
						<div className="flex flex-wrap items-center gap-2">
							<Badge
								variant="secondary"
								className="text-[10px] bg-primary/10 text-primary border-primary/20 font-bold uppercase tracking-wider"
							>
								Voting Category
							</Badge>
							{isInternalVoting && (
								<Badge
									variant="outline"
									className="text-[10px] text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-900/60 gap-1"
								>
									<Lock className="size-3" /> Member Ballot
								</Badge>
							)}
						</div>

						<h1 className="text-xl font-black uppercase tracking-tight text-foreground leading-snug">
							{category.name}
						</h1>

						<Link
							href={`/${orgSlug}/event/${eventSlug}`}
							className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 pt-1"
						>
							{orgLogo ? (
								<img
									src={orgLogo}
									alt={event.organization.name}
									className="size-3.5 rounded-full object-cover border"
								/>
							) : (
								<Building2 className="size-3" />
							)}
							<span className="truncate">{event.title}</span>
						</Link>
					</div>
				</div>

				<PanAfricanDivider className="shrink-0" />

				{/* Scrollable Body: About Category, Socials, Sponsors */}
				<div className="flex-1 min-h-0 overflow-y-auto pr-1.5 space-y-5 custom-scrollbar">
					{/* About Category */}
					<div className="space-y-2">
						<h3 className="text-xs font-black uppercase tracking-widest text-foreground">
							About Category.
						</h3>
						<div className="text-xs text-muted-foreground leading-relaxed">
							{category.description ? (
								<RichTextDisplay content={category.description} />
							) : (
								<p className="italic text-muted-foreground/60">
									Vote for your favorite candidate or submit an exceptional nominee to win!
								</p>
							)}
						</div>
					</div>

					{/* Event Socials */}
					{socialLinks.length > 0 && (
						<div className="space-y-2.5 pt-3 border-t border-dashed">
							<h3 className="text-xs font-black uppercase tracking-widest text-foreground">
								Event Socials.
							</h3>
							<div className="flex flex-wrap gap-2">
								{socialLinks.map((link: any) => {
									const plat = getSocialPlatform(link.url, "size-4");
									return (
										<a
											key={link.id || link.url}
											href={link.url}
											target="_blank"
											rel="noopener noreferrer"
											className="size-8 rounded-full border bg-card flex items-center justify-center hover:bg-primary/10 hover:border-primary transition-all"
											title={plat.name || link.url}
										>
											<div className="size-4 flex items-center justify-center">
												{plat.icon}
											</div>
										</a>
									);
								})}
							</div>
						</div>
					)}

					{/* Sponsors */}
					{sponsors.length > 0 && (
						<div className="space-y-2.5 pt-3 border-t border-dashed">
							<h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-1.5">
								<Trophy className="size-3.5 text-primary" />
								<span>Sponsors.</span>
							</h3>
							<div className="grid grid-cols-3 gap-2">
								{sponsors.slice(0, 9).map((sponsor: any) => (
									<div
										key={sponsor.id || sponsor.name}
										className="flex items-center justify-center p-2 rounded-lg border bg-card h-12"
										title={sponsor.name}
									>
										{sponsor.logoUrl ? (
											<img
												src={getEventImageUrl(sponsor.logoUrl)}
												alt={sponsor.name}
												className="max-h-6 max-w-full object-contain"
											/>
										) : (
											<span className="text-[7px] font-bold text-center leading-tight truncate">
												{sponsor.name}
											</span>
										)}
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
