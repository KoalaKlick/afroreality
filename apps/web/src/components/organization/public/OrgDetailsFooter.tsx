"use client";

import { Trophy, ImageIcon, ChevronRight } from "lucide-react";
import { Section } from "@/components/Landing/shared/Section";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { getGalleryProvider } from "@/lib/utils/event-icons";
import { RichTextDisplay } from "@/components/ui/rich-text-display";

interface OrgDetailsFooterProps {
	readonly organization: {
		id: string;
		name: string;
		description: string | null;
		websiteUrl?: string | null;
		contactEmail?: string | null;
		phone?: string | null;
		socialLinks?: Array<{ id?: string; url: string; platform?: string }>;
		primaryColor?: string;
	};
	readonly sponsors?: Array<{
		id?: string;
		name: string;
		logoUrl?: string | null;
		logo?: string | null;
	}>;
	readonly galleryLinks?: Array<{
		id?: string;
		name: string;
		url: string;
	}>;
}

export function OrgDetailsFooter({
	organization,
	sponsors = [],
	galleryLinks = [],
}: OrgDetailsFooterProps) {
	return (
		<Section
			maxWidth="7xl"
			className="py-14 border-t bg-background"
		>
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
				{/* Column 1: Organization Details (Takes more span, first column) */}
				<div className="lg:col-span-7 space-y-6">
					<h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight font-millik">
						About {organization.name}.
					</h3>
					<div className="text-sm text-muted-foreground leading-relaxed">
						{organization.description ? (
							<RichTextDisplay content={organization.description} />
						) : (
							<p className="italic text-muted-foreground/60">
								Dedicated to delivering exceptional events and fostering
								community engagement through innovation and excellence.
							</p>
						)}
					</div>
				</div>

				{/* Column 2: Partners & Photo Gallery Links on the right */}
				<div className="lg:col-span-5 space-y-10">
					{/* Our Partners */}
					<div className="space-y-4">
						<h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-3 font-millik">
							<Trophy className="size-5 text-primary" />
							<span>Our Partners.</span>
						</h3>
						{sponsors.length > 0 ? (
							<div className="flex flex-wrap gap-2.5">
								{sponsors.slice(0, 15).map((sponsor) => {
									const imgKey = sponsor.logoUrl || sponsor.logo;
									const imgUrl = imgKey ? getEventImageUrl(imgKey) : null;
									return (
										<div
											key={sponsor.id || sponsor.name}
											className="size-11 p-1.5 border rounded-lg bg-card flex items-center justify-center grayscale hover:grayscale-0 transition-all cursor-help"
											title={sponsor.name}
										>
											{imgUrl ? (
												<img
													src={imgUrl}
													alt={sponsor.name}
													className="object-contain max-h-full max-w-full"
												/>
											) : (
												<span className="text-[7px] font-bold text-center leading-none truncate uppercase tracking-tighter">
													{sponsor.name}
												</span>
											)}
										</div>
									);
								})}
							</div>
						) : (
							<p className="text-xs text-muted-foreground italic leading-relaxed">
								Partnering with leading brands for event excellence.
							</p>
						)}
					</div>

					{/* Photo Gallery Links */}
					{galleryLinks.length > 0 && (
						<div className="space-y-4 pt-2 border-t border-dashed">
							<h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-3 font-millik">
								<ImageIcon className="size-5 text-primary" />
								<span>Photo Galleries.</span>
							</h3>
							<div className="space-y-2.5">
								{galleryLinks.map((link) => {
									const provider = getGalleryProvider(link.url, "size-4");
									return (
										<a
											key={link.id || link.url}
											href={link.url}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center justify-between p-3 border rounded-xl bg-card hover:bg-muted/40 hover:border-primary/50 transition-all group"
										>
											<div className="flex items-center gap-3 min-w-0">
												<div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
													{provider.icon}
												</div>
												<span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate">
													{link.name || provider.name}
												</span>
											</div>
											<ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
										</a>
									);
								})}
							</div>
						</div>
					)}
				</div>
			</div>
		</Section>
	);
}
