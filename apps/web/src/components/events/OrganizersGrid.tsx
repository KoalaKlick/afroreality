"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { Calendar, ArrowRight, ExternalLink, ShieldCheck, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface PublicOrganizerItem {
	id: string;
	name: string;
	slug: string;
	description?: string | null;
	logoUrl?: string | null;
	bannerUrl?: string | null;
	primaryColor?: string | null;
	websiteUrl?: string | null;
	eventsCount?: number;
}

interface OrganizersGridProps {
	readonly organizers: PublicOrganizerItem[];
}

export function OrganizersGrid({ organizers }: OrganizersGridProps) {
	if (organizers.length === 0) {
		return (
			<div className="text-center py-20 rounded-3xl border border-dashed border-border/70 bg-card/40 p-8">
				<div className="size-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-4">
					<Building2 className="size-8" />
				</div>
				<h3 className="text-xl font-bold text-foreground mb-2">
					No Organizers Found
				</h3>
				<p className="text-sm text-muted-foreground max-w-md mx-auto">
					No event organizers match your search criteria. Try adjusting your search query or check back soon.
				</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
			{organizers.map((org, idx) => {
				const eventsCount = org.eventsCount ?? 0;

				return (
					<motion.div
						key={org.id}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4, delay: idx * 0.05 }}
						className="group flex flex-col justify-between rounded-3xl border border-border/60 bg-card overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
					>
						<div>
							{/* Top Banner or Color Accent */}
							<div
								className="h-24 w-full relative bg-gradient-to-r from-emerald-600/30 via-teal-600/20 to-neutral-800/40"
								style={{
									backgroundColor: org.primaryColor ? `${org.primaryColor}25` : undefined,
								}}
							>
								{org.bannerUrl && (
									<Image
										src={org.bannerUrl}
										alt={org.name}
										fill
										className="object-cover opacity-60"
									/>
								)}
								<div className="absolute top-3 right-3">
									<Badge
										variant="secondary"
										className="bg-card/80 backdrop-blur-md text-[11px] font-bold px-2.5 py-0.5 border shadow-2xs"
									>
										{eventsCount} {eventsCount === 1 ? "Event" : "Events"}
									</Badge>
								</div>
							</div>

							{/* Org Info */}
							<div className="p-6 pt-0 relative">
								{/* Logo Avatar overlapping banner */}
								<div className="-mt-10 mb-4 inline-block">
									<div className="relative size-16 rounded-2xl border-4 border-card bg-card overflow-hidden shadow-md flex items-center justify-center">
										{org.logoUrl ? (
											<Image
												src={org.logoUrl}
												alt={org.name}
												fill
												className="object-cover"
											/>
										) : (
											<div className="size-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg uppercase">
												{org.name.slice(0, 2)}
											</div>
										)}
									</div>
								</div>

								{/* Title */}
								<div className="space-y-2">
									<div className="flex items-center gap-1.5">
										<h3 className="text-lg font-bold text-foreground tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
											{org.name}
										</h3>
										<ShieldCheck className="size-4 text-emerald-500 shrink-0" />
									</div>

									{/* Description */}
									<p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed min-h-[54px]">
										{org.description || "Official event organizer and host."}
									</p>
								</div>
							</div>
						</div>

						{/* Card Footer Actions */}
						<div className="p-6 pt-4 border-t border-border/40 flex items-center justify-between">
							<span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
								<Calendar className="size-3.5 text-emerald-600" />
								<span>{eventsCount} Published</span>
							</span>

							<Link href={`/${org.slug}`}>
								<Button
									size="sm"
									variant="outline"
									className="rounded-full text-xs font-bold gap-1 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all"
								>
									<span>View Profile</span>
									<ArrowRight className="size-3" />
								</Button>
							</Link>
						</div>
					</motion.div>
				);
			})}
		</div>
	);
}
