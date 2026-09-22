"use client";

import Link from "next/link";
import Image from "next/image";
import { Vote, Users, ChevronRight, Clock } from "lucide-react";
import { Section } from "@/components/Landing/shared/Section";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import { NoCategoryIllustration } from "@/components/common/NoCategoryIllustration";
import { getEventImageUrl } from "@/lib/image-url-utils";

interface EventVotingCategoriesProps {
	readonly categories: any[];
	readonly orgSlug: string;
	readonly eventSlug: string;
	readonly isUpcoming?: boolean;
	readonly startDate?: string | Date | null;
}

function stripHtml(html?: string | null): string {
	if (!html) return "";
	return html.replace(/<[^>]*>?/gm, "").trim();
}

export function EventVotingCategories({
	categories,
	orgSlug,
	eventSlug,
	isUpcoming = false,
	startDate,
}: EventVotingCategoriesProps) {
	return (
		<Section
			maxWidth="7xl"
			className="py-4 transition-colors @container"
			style={{
				backgroundColor:
					"color-mix(in srgb, var(--color-brand-primary, #009A44) 3.5%, transparent)",
			}}
		>
			<div>
				<div className="flex items-center gap-3 mb-4">
					<h2 className="text-xl font-medium font-millik tracking-widest uppercase text-muted-foreground">
						Vote Categories
					</h2>
				</div>

				{isUpcoming && startDate && (
					<div className="mb-4 bg-amber-500/10 px-4 py-3 flex items-center gap-2.5 text-amber-700 dark:text-amber-400">
						<Clock className="size-4 shrink-0" />
						<p className="text-xs font-medium uppercase ">
							Voting has not started yet  opens on {new Date(startDate).toLocaleString("en-GH", {
								dateStyle: "medium",
								timeStyle: "short",
							})}.
						</p>
					</div>
				)}

				{categories.length > 0 ? (
					<div className="grid grid-cols-1 @lg:grid-cols-2 @2xl:grid-cols-3 @6xl:grid-cols-4 gap-6">
						{categories.map((category) => (
							<div key={category.id} className="@container h-full">
								<Link
									href={`/${orgSlug}/event/${eventSlug}/category/${category.id}`}
									className="group relative flex flex-col @sm:flex-row justify-between h-full gap-3 rounded-2xl bg-card p-2.5 @sm:p-3 transition-all duration-300 hover:shadow-md cursor-pointer"
								>
									{/* Poster Container (Left in row, Top in col) */}
									<div className="relative aspect-4/5 w-full @sm:w-40 @md:w-48 @lg:w-48 rounded-xl bg-muted shadow-none shrink-0">
										<div className="relative w-full h-full overflow-hidden rounded-xl">
											{category.templateImage ? (
												<Image
													src={getEventImageUrl(category.templateImage) || ""}
													alt={category.name}
													fill
													className="object-cover transition-transform duration-300 group-hover:scale-105"
													sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
													unoptimized
												/>
											) : (
												<div className="absolute inset-0 bg-muted/50 flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
													<NoCategoryIllustration className="w-full h-full p-4 object-contain opacity-75" />
												</div>
											)}

											<div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-200" />
										</div>

										{/* Left-aligned Nominees Avatars at bottom of poster image */}
										{category.votingOptions && category.votingOptions.length > 0 && (
											<div className="absolute bottom-3 left-3 z-20 flex items-center">
												<AnimatedTooltip
													items={category.votingOptions
														.slice(0, 4)
														.map((nominee: any) => ({
															id: nominee.id,
															name: nominee.optionText,
															designation: nominee.nomineeCode || "Nominee",
															image: getEventImageUrl(nominee.imageUrl) || null,
														}))}
												/>
												{category.votingOptions.length > 4 && (
													<div className="relative h-9 w-9 -ml-1 rounded-full border-2 border-background bg-primary flex items-center justify-center shrink-0 z-30 text-primary-foreground text-[11px] font-bold shadow-xs">
														+{category.votingOptions.length - 4}
													</div>
												)}
											</div>
										)}
									</div>

									{/* Category Meta & Action (Right in row, Bottom in col) */}
									<div className="flex-1 flex flex-col justify-between min-w-0 gap-2.5">
										{/* Meta: Title & Description */}
										<div className="flex flex-col gap-1 px-0.5">
											<h3 className="font-bold text-base @sm:text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors tracking-tight uppercase">
												{category.name}
											</h3>

											{category.description && (
												<p className="text-xs text-muted-foreground line-clamp-2 @sm:line-clamp-3 leading-relaxed">
													{stripHtml(category.description)}
												</p>
											)}
										</div>

										{/* Bottom Action Bar */}
										<div className="pt-2 mt-auto border-t border-border/50 flex items-center justify-between gap-2">
											<span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5 uppercase tracking-wider">
												<Users className="size-3.5 text-primary" />
												<span>
													{category.votingOptions?.length || 0}{" "}
													{category.votingOptions?.length === 1
														? "Nominee"
														: "Nominees"}
												</span>
											</span>
											<div className="size-7 rounded-full bg-muted/60 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
												<ChevronRight className="size-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
											</div>
										</div>
									</div>
								</Link>
							</div>
						))}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<NoCategoryIllustration className="size-56 mb-6 opacity-80" />
						<h4 className="text-xl font-medium font-millik tracking-widest uppercase text-muted-foreground mb-2">
							No Categories Yet
						</h4>
						<p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
							Voting categories haven&apos;t been set up for this event yet. Check back soon!
						</p>
					</div>
				)}
			</div>
		</Section>
	);
}
