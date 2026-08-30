"use client";

import Link from "next/link";
import Image from "next/image";
import { Vote, Trophy, Users, ChevronRight } from "lucide-react";
import { Section } from "@/components/Landing/shared/Section";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import { NoCategoryIllustration } from "@/components/common/NoCategoryIllustration";
import { getEventImageUrl } from "@/lib/image-url-utils";

interface EventVotingCategoriesProps {
	readonly categories: any[];
	readonly orgSlug: string;
	readonly eventSlug: string;
}

export function EventVotingCategories({
	categories,
	orgSlug,
	eventSlug,
}: EventVotingCategoriesProps) {
	return (
		<Section
			maxWidth="7xl"
			className="py-4 transition-colors"
			style={{
				backgroundColor:
					"color-mix(in srgb, var(--color-brand-primary, #009A44) 3.5%, transparent)",
			}}
		>
			<div>
				<div className="flex items-center gap-3 mb-12">
					<Vote className="size-8 text-primary" />
					<h2 className="text-3xl font-bold uppercase tracking-tight">
						Vote Categories.
					</h2>
				</div>

				{categories.length > 0 ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
						{categories.map((category) => (
							<Link
								key={category.id}
								href={`/${orgSlug}/event/${eventSlug}/category/${category.id}`}
								className="group flex flex-col rounded-2xl border bg-card transition-all duration-300 relative overflow-hidden hover:border-primary/50"
							>
								{category.templateImage && (
									<div className="relative w-full h-48 shrink-0 overflow-hidden bg-muted">
										<Image
											src={getEventImageUrl(category.templateImage) || ""}
											alt={category.name}
											fill
											className="object-cover group-hover:scale-105 transition-transform duration-500"
											unoptimized
										/>
									</div>
								)}
								<div className="p-6 flex flex-col flex-1 bg-card">
									<div className="flex items-start justify-between mb-2">
										<div className="flex items-start gap-3 flex-1 min-w-0 pr-4">
											<div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
												<Trophy className="size-5 text-primary" />
											</div>
											<h3 className="text-xl font-bold uppercase tracking-tight group-hover:text-primary transition-colors line-clamp-2 mt-1">
												{category.name}
											</h3>
										</div>
										<div className="size-8 rounded-md bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
											<ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
										</div>
									</div>

									{!category.templateImage && category.description && (
										<p className="text-sm text-muted-foreground line-clamp-2 mb-6">
											{category.description}
										</p>
									)}

									<div className="mt-auto pt-4">
										{!category.templateImage && (
											<div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
												<Users className="size-4" />
												<span>
													{category.votingOptions?.length || 0}{" "}
													{category.votingOptions?.length === 1
														? "nominee"
														: "nominees"}
												</span>
											</div>
										)}

										{/* Preview of nominees */}
										{category.votingOptions && category.votingOptions.length > 0 && (
											<div className="flex flex-row items-center mt-1 pt-1 mb-1">
												<AnimatedTooltip
													items={category.votingOptions
														.slice(0, 5)
														.map((nominee: any) => ({
															id: nominee.id,
															name: nominee.optionText,
															designation:
																nominee.nomineeCode || "Nominee",
															image:
																getEventImageUrl(nominee.imageUrl) ||
																"/landing/g.webp",
														}))}
												/>
												{category.votingOptions.length > 5 && (
													<div className="relative size-10 ml-2 rounded-full border-2 border-background bg-primary flex items-center justify-center shrink-0 z-40 text-primary-foreground text-xs font-bold">
														+{category.votingOptions.length - 5}
													</div>
												)}
											</div>
										)}
									</div>
								</div>
							</Link>
						))}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<NoCategoryIllustration className="size-56 mb-6 opacity-80" />
						<h4 className="text-xl font-bold uppercase tracking-tight mb-2">
							No categories yet.
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
