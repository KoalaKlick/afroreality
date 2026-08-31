"use client";

import { Section } from "@/components/Landing/shared/Section";
import { getSocialPlatform, getGalleryProvider } from "@/lib/utils/event-icons";
import { SocialLinksList } from "@/components/shared/SocialLinksList";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { ImageIcon, ChevronRight, Trophy } from "lucide-react";
import { RichTextDisplay } from "@/components/ui/rich-text-display";

interface EventDetailsSectionProps {
	readonly description?: string | null;
	readonly socialLinks?: any[];
	readonly galleryLinks?: any[];
	readonly sponsors?: any[];
}

export function EventDetailsSection({
	description,
	socialLinks = [],
	galleryLinks = [],
	sponsors = [],
}: EventDetailsSectionProps) {
	return (
		<Section
			maxWidth="7xl"
			className="py-16 border-t bg-background"
		>
			<div className="mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-16">
					{/* Left: About (2 columns if gallery exists, otherwise full width) */}
					<div className={galleryLinks.length > 0 ? "md:col-span-2 space-y-8 scroll-mt-10" : "md:col-span-3 space-y-8 scroll-mt-10"} id="details">
						<div className="space-y-4">
							<h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
								About the Event.
							</h2>
							<div className="text-sm text-foreground leading-relaxed">
								{description ? (
									<RichTextDisplay content={description} />
								) : (
									<p className="italic text-muted-foreground">
										No description provided for this event.
									</p>
								)}
							</div>
						</div>
					</div>

					{/* Right: Galleries */}
					{galleryLinks.length > 0 && (
						<div className="space-y-12">
							<div className="space-y-6">
								<h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
									<ImageIcon className="size-5 text-primary" />
									<span>Galleries.</span>
								</h3>
								<div className="space-y-3">
									{galleryLinks.map((link: any) => {
										const provider = getGalleryProvider(link.url, "size-5");
										return (
											<a
												key={link.id || link.url}
												href={link.url}
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-center justify-between p-3.5 rounded-xl border bg-card hover:border-primary/50 transition-colors group"
											>
												<div className="flex items-center gap-3">
													<div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
														{provider.icon}
													</div>
													<span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
														{provider.name}
													</span>
												</div>
												<ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
											</a>
										);
									})}
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</Section>
	);
}
