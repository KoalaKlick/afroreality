"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
	Calendar,
	MapPin,
	ArrowRight,
	Smartphone,
	Ticket,
	Vote,
	Layers,
	Users,
	Sparkles,
	Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EventsSearch } from "./EventsSearch";
import { OrganizersGrid, type PublicOrganizerItem } from "./OrganizersGrid";
import { NoEventsIllustration } from "@/components/common/NoEventsIllustration";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { cn } from "@/lib/utils";
import type { LandingEventItem } from "@/components/Landing/sections/LandingEventsSection";

interface EventsPageClientProps {
	readonly initialEvents: LandingEventItem[];
	readonly initialOrganizers: PublicOrganizerItem[];
	readonly stats?: {
		totalEvents?: number;
		totalOrganizers?: number;
		totalTicketsSold?: number;
		totalVotes?: number;
	};
	readonly defaultQuery?: string;
	readonly defaultType?: string;
}

function formatDate(dateVal?: Date | string | null) {
	if (!dateVal) return "Date TBA";
	const d = new Date(dateVal);
	return d.toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

function getTypeBadge(type: string) {
	switch (type.toLowerCase()) {
		case "voting":
			return {
				label: "Live Voting",
				icon: Vote,
				className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/40",
			};
		case "ticketed":
			return {
				label: "Tickets",
				icon: Ticket,
				className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40",
			};
		case "hybrid":
		default:
			return {
				label: "Tickets & Voting",
				icon: Layers,
				className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/40",
			};
	}
}

export function EventsPageClient({
	initialEvents,
	initialOrganizers,
	stats,
	defaultQuery = "",
	defaultType = "all",
}: EventsPageClientProps) {
	const [activeTab, setActiveTab] = useState<"events" | "organizers">("events");
	const [searchQuery, setSearchQuery] = useState(defaultQuery);
	const [selectedType, setSelectedType] = useState(defaultType);
	const [selectedCategory, setSelectedCategory] = useState("All Categories");

	// Filter events based on active filters
	const filteredEvents = useMemo(() => {
		return initialEvents.filter((item) => {
			// Type match
			if (selectedType !== "all" && item.type.toLowerCase() !== selectedType.toLowerCase()) {
				return false;
			}

			// Category match (if selected and not "All Categories")
			if (selectedCategory && selectedCategory !== "All Categories") {
				const catLower = selectedCategory.toLowerCase();
				const textCombined = `${item.title} ${item.description || ""} ${item.type}`.toLowerCase();
				if (!textCombined.includes(catLower.replace("&", "").trim())) {
					// Soft match
				}
			}

			// Search query match
			if (searchQuery.trim().length > 0) {
				const q = searchQuery.toLowerCase().trim();
				const titleMatch = item.title.toLowerCase().includes(q);
				const descMatch = item.description?.toLowerCase().includes(q) ?? false;
				const cityMatch = item.venueCity?.toLowerCase().includes(q) ?? false;
				const orgMatch = item.organization.name.toLowerCase().includes(q);
				return titleMatch || descMatch || cityMatch || orgMatch;
			}

			return true;
		});
	}, [initialEvents, selectedType, selectedCategory, searchQuery]);

	// Filter organizers based on search query
	const filteredOrganizers = useMemo(() => {
		if (!searchQuery.trim()) return initialOrganizers;
		const q = searchQuery.toLowerCase().trim();
		return initialOrganizers.filter(
			(org) =>
				org.name.toLowerCase().includes(q) ||
				(org.description && org.description.toLowerCase().includes(q)),
		);
	}, [initialOrganizers, searchQuery]);

	// Counters
	const totalEventsCount = initialEvents.length;
	const totalOrganizersCount = initialOrganizers.length;
	const ticketedEventsCount = initialEvents.filter(
		(e) => e.type === "ticketed" || e.type === "hybrid",
	).length;
	const votingEventsCount = initialEvents.filter(
		(e) => e.type === "voting" || e.type === "hybrid",
	).length;

	return (
		<div className="space-y-12 pb-24">
			{/* Page Header Section */}
			<div className="relative pt-12 pb-8 border-b border-border/50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
					{/* Dual Tab Switcher */}
					<div className="flex justify-start">
						<div className="inline-flex rounded-2xl p-1.5 bg-muted/80 border border-border/60 shadow-2xs">
							<button
								type="button"
								onClick={() => setActiveTab("events")}
								className={cn(
									"px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold tracking-tight transition-all duration-200 flex items-center gap-2",
									activeTab === "events"
										? "bg-card text-foreground shadow-xs"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								<Calendar className="size-4 text-emerald-600" />
								<span>Events ({totalEventsCount})</span>
							</button>
							<button
								type="button"
								onClick={() => setActiveTab("organizers")}
								className={cn(
									"px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold tracking-tight transition-all duration-200 flex items-center gap-2",
									activeTab === "organizers"
										? "bg-card text-foreground shadow-xs"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								<Users className="size-4 text-emerald-600" />
								<span>Organizers ({totalOrganizersCount})</span>
							</button>
						</div>
					</div>

					{/* Title & Subheading */}
					<div className="space-y-2">
						<h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-foreground">
							{activeTab === "events" ? (
								<>
									Discover Pan-African{" "}
									<span className="text-emerald-600">Events</span>
								</>
							) : (
								<>
									Trusted Event{" "}
									<span className="text-emerald-600">Organizers</span>
								</>
							)}
						</h1>
						<p className="text-muted-foreground text-sm sm:text-base max-w-2xl leading-relaxed">
							{activeTab === "events"
								? "Find and attend festivals, conferences, awards galas, and live voting competitions happening right now."
								: "Connect with verified event creators, agencies, and institutions driving cultural innovation across the continent."}
						</p>
					</div>

					{/* Search & Filter Bar */}
					<div className="pt-2">
						<EventsSearch
							searchQuery={searchQuery}
							onSearchChange={setSearchQuery}
							selectedType={selectedType}
							onTypeChange={setSelectedType}
							selectedCategory={selectedCategory}
							onCategoryChange={setSelectedCategory}
							mode={activeTab}
						/>
					</div>
				</div>
			</div>

			{/* Main Content Area */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<AnimatePresence mode="wait">
					{activeTab === "events" ? (
						<motion.div
							key="events-tab"
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -12 }}
							transition={{ duration: 0.3 }}
						>
							{filteredEvents.length > 0 ? (
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
									{filteredEvents.map((event, idx) => {
										const typeInfo = getTypeBadge(event.type);
										const TypeIcon = typeInfo.icon;
										const flierUrl =
											getEventImageUrl(event.flierImage) || "/landing/a.webp";
										const eventHref = `/${event.organization.slug}/event/${event.slug}`;
										const location = [event.venueName, event.venueCity]
											.filter(Boolean)
											.join(", ");

										return (
											<motion.div
												key={event.id}
												initial={{ opacity: 0, y: 20 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ duration: 0.4, delay: idx * 0.04 }}
												className="group flex flex-col rounded-3xl border border-border/60 bg-card overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
											>
												{/* Image Thumbnail with Badges */}
												<Link
													href={eventHref}
													className="relative aspect-[16/10] w-full overflow-hidden block"
												>
													<Image
														src={flierUrl}
														alt={event.title}
														fill
														className="object-cover transition-transform duration-500 group-hover:scale-105"
														sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
													/>
													<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

													{/* Badges on Image */}
													<div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
														<Badge
															variant="outline"
															className={cn(
																"px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur-md border gap-1.5 shadow-2xs",
																typeInfo.className,
															)}
														>
															<TypeIcon className="size-3" />
															<span>{typeInfo.label}</span>
														</Badge>

														{event.hasUssd && (
															<Badge className="bg-amber-500/90 text-black font-extrabold text-[10px] tracking-wider px-2 py-0.5 border-0 shadow-2xs gap-1">
																<Smartphone className="size-3" />
																<span>USSD LIVE</span>
															</Badge>
														)}
													</div>

													{/* Date Tag */}
													<div className="absolute bottom-3 left-3.5 z-10 flex items-center gap-1.5 text-xs font-semibold text-white/90">
														<Calendar className="size-3.5 text-emerald-400" />
														<span>{formatDate(event.startDate)}</span>
													</div>
												</Link>

												{/* Card Content */}
												<div className="p-5 flex-1 flex flex-col justify-between space-y-4">
													<div className="space-y-2">
														{/* Organization Header */}
														<Link
															href={`/${event.organization.slug}`}
															className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
														>
															<div className="relative size-4 rounded-full overflow-hidden bg-primary/10">
																<Image
																	src={
																		event.organization.logoUrl || "/logo.svg"
																	}
																	alt={event.organization.name}
																	fill
																	className="object-cover"
																/>
															</div>
															<span className="truncate">
																{event.organization.name}
															</span>
														</Link>

														{/* Event Title */}
														<Link href={eventHref}>
															<h3 className="text-lg font-bold text-foreground leading-snug line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
																{event.title}
															</h3>
														</Link>

														{/* Location */}
														{location && (
															<p className="flex items-center gap-1.5 text-xs text-muted-foreground line-clamp-1">
																<MapPin className="size-3.5 shrink-0 text-muted-foreground/80" />
																<span className="truncate">{location}</span>
															</p>
														)}
													</div>

													{/* Bottom Action and Pricing */}
													<div className="pt-3 border-t border-border/50 flex items-center justify-between">
														<div className="flex flex-col">
															<span className="text-[10px] uppercase font-bold text-muted-foreground">
																Entry / Access
															</span>
															<span className="text-sm font-extrabold text-foreground">
																{event.type === "voting"
																	? "Nomination & Voting"
																	: event.minPrice
																		? `From GHS ${event.minPrice}`
																		: "Free Admission"}
															</span>
														</div>

														<Link href={eventHref}>
															<Button
																size="sm"
																variant="secondary"
																className="rounded-full px-4 text-xs font-bold gap-1 group-hover:bg-emerald-600 group-hover:text-white transition-colors"
															>
																<span>View Event</span>
																<ArrowRight className="size-3" />
															</Button>
														</Link>
													</div>
												</div>
											</motion.div>
										);
									})}
								</div>
							) : (
								<div className="text-center py-20 rounded-3xl border border-dashed border-border/70 bg-card/40 p-8 space-y-4">
									<NoEventsIllustration className="w-56 h-auto mx-auto opacity-80" />
									<h3 className="text-2xl font-bold text-foreground">
										No Matching Events
									</h3>
									<p className="text-sm text-muted-foreground max-w-sm mx-auto">
										We couldn&apos;t find any events matching your filters. Try
										adjusting your search query or reset the filters.
									</p>
									<Button
										variant="outline"
										onClick={() => {
											setSearchQuery("");
											setSelectedType("all");
											setSelectedCategory("All Categories");
										}}
										className="rounded-full px-6"
									>
										Clear All Filters
									</Button>
								</div>
							)}
						</motion.div>
					) : (
						<motion.div
							key="organizers-tab"
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -12 }}
							transition={{ duration: 0.3 }}
						>
							<OrganizersGrid organizers={filteredOrganizers} />
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
