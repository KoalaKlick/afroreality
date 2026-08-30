"use client";

import { Section } from "@/components/Landing/shared/Section";
import { getSocialPlatform, getGalleryProvider } from "@/lib/utils/event-icons";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { ImageIcon, ChevronRight } from "lucide-react";

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
		<Section maxWidth="7xl" className="py-16 bg-card/30 border-t">
			<div className="mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-16">
					{/* Left: About */}
					<div className="md:col-span-2 space-y-8 scroll-mt-10" id="details">
						<div className="space-y-4">
							<h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
								About the Event.
							</h2>
							<div className="prose prose-sm max-w-none text-foreground dark:prose-invert">
								{description ? (
									<div
										dangerouslySetInnerHTML={{ __html: description }}
									/>
								) : (
									<p className="italic text-muted-foreground">
										No description provided for this event.
									</p>
								)}
							</div>
						</div>

						{/* Social Links */}
						{socialLinks.length > 0 && (
							<div className="space-y-4 pt-4 border-t border-dashed">
								<h3 className="text-xs font-bold uppercase tracking-widest text-primary">
									Event Socials.
								</h3>
								<div className="flex flex-wrap gap-3">
									{socialLinks.map((link: any) => (
										<a
											key={link.id}
											href={link.url}
											target="_blank"
											rel="noopener noreferrer"
											className="size-10 rounded-xl border bg-card flex items-center justify-center hover:bg-primary/10 hover:border-primary hover:text-primary transition-all shadow-xs"
											title={link.url}
										>
											<div className="size-5 flex items-center justify-center">
												{getSocialPlatform(link.url, "size-full").icon}
											</div>
										</a>
									))}
								</div>
							</div>
						)}
					</div>

					{/* Right: Gallery & Sponsors */}
					<div className="space-y-12">
						{/* Gallery Links */}
						{galleryLinks.length > 0 && (
							<div className="space-y-6">
								<h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
									<ImageIcon className="size-5 text-primary" />
									Galleries.
								</h3>
								<div className="space-y-3">
									{galleryLinks.map((link: any) => (
										<a
											key={link.id}
											href={link.url}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center justify-between p-3.5 rounded-xl border bg-card hover:border-primary/50 transition-colors shadow-xs group"
										>
											<div className="flex items-center gap-3">
												<div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
													{getGalleryProvider(link.url, "size-4").icon}
												</div>
												<span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
													{getGalleryProvider(link.url).name}
												</span>
											</div>
											<ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
										</a>
									))}
								</div>
							</div>
						)}

						{/* Sponsors */}
						{sponsors.length > 0 && (
							<div className="space-y-6">
								<h3 className="text-xl font-bold uppercase tracking-tight">
									Sponsors &amp; Partners.
								</h3>
								<div className="grid grid-cols-2 gap-3">
									{sponsors.map((sponsor: any) => (
										<div
											key={sponsor.id || sponsor.name}
											className="flex items-center justify-center p-3 rounded-xl border bg-card shadow-xs min-h-[60px]"
										>
											{sponsor.logoUrl ? (
												<img
													src={getEventImageUrl(sponsor.logoUrl)}
													alt={sponsor.name}
													className="max-h-8 max-w-full object-contain"
												/>
											) : (
												<span className="text-xs font-bold text-center">
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
		</Section>
	);
}
