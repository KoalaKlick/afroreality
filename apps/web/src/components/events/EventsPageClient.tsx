"use client";

import { useState, useMemo } from "react";
import { EventsSearch } from "@/components/website/events/EventsSearch";
import { EventsGrid } from "@/components/website/events/EventsGrid";
import { OrganizersGrid } from "@/components/events/OrganizersGrid";
import { LandingCTA } from "@/components/Landing/sections/LandingCTA";
import { LandingFooter } from "@/components/Landing/LandingFooter";
import type { TawnyEventData } from "@/components/website/events/EventCard";
import type { TawnyOrganizerData } from "@/components/website/events/OrganizerCard";
import { cn } from "@/lib/utils";

interface EventsPageClientProps {
	readonly initialEvents: TawnyEventData[];
	readonly initialOrganizers: TawnyOrganizerData[];
	readonly defaultQuery?: string;
	readonly defaultType?: string;
}

export function EventsPageClient({
	initialEvents,
	initialOrganizers,
	defaultQuery = "",
	defaultType = "all",
}: EventsPageClientProps) {
	const [activeTab, setActiveTab] = useState<"events" | "organizers">("events");
	const [searchQuery, setSearchQuery] = useState(defaultQuery);
	const [selectedType, setSelectedType] = useState(defaultType);
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [activeFilter, setActiveFilter] = useState("all");

	// Filtered events
	const filteredEvents = useMemo(() => {
		return initialEvents.filter((event) => {
			// Type filter
			if (selectedType !== "all") {
				if (selectedType === "ticketed" && event.type === "voting") return false;
				if (selectedType === "voting" && event.type !== "voting") return false;
			}

			// Category filter
			if (selectedCategory !== "all") {
				const cat = (event.category || "").toLowerCase();
				if (!cat.includes(selectedCategory.toLowerCase())) {
					// Soft match
				}
			}

			// Search query
			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase().trim();
				const titleMatch = event.title.toLowerCase().includes(q);
				const descMatch = event.description?.toLowerCase().includes(q) ?? false;
				const venueMatch = event.venueName?.toLowerCase().includes(q) ?? false;
				const cityMatch = event.venueCity?.toLowerCase().includes(q) ?? false;
				const orgMatch = event.organization.name.toLowerCase().includes(q);
				return titleMatch || descMatch || venueMatch || cityMatch || orgMatch;
			}

			return true;
		});
	}, [initialEvents, selectedType, selectedCategory, searchQuery]);

	// Filtered organizers
	const filteredOrganizers = useMemo(() => {
		if (!searchQuery.trim()) return initialOrganizers;
		const q = searchQuery.toLowerCase().trim();
		return initialOrganizers.filter(
			(org) =>
				org.name.toLowerCase().includes(q) ||
				(org.description && org.description.toLowerCase().includes(q)) ||
				org.slug.toLowerCase().includes(q),
		);
	}, [initialOrganizers, searchQuery]);

	return (
		<div className="min-h-screen bg-background overflow-x-hidden">
			<main className="pt-6 sm:pt-8">
				{/* Hero Section */}
				<section className="relative py-6 sm:py-8 overflow-hidden">
					<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-6">
						{/* Tab Switcher (Preline Clean Style) */}
						<div className="flex justify-start mb-5 sm:mb-6">
							<div className="inline-flex rounded-lg border border-border p-1 bg-muted/40 shadow-none">
								<button
									type="button"
									onClick={() => setActiveTab("events")}
									className={cn(
										"px-5 py-1.5 text-xs sm:text-sm rounded-md transition-all cursor-pointer font-semibold shadow-none",
										activeTab === "events"
											? "bg-primary text-primary-foreground"
											: "text-muted-foreground hover:text-foreground",
									)}
								>
									African Events
								</button>
								<button
									type="button"
									onClick={() => setActiveTab("organizers")}
									className={cn(
										"px-5 py-1.5 text-xs sm:text-sm rounded-md transition-all cursor-pointer font-semibold shadow-none",
										activeTab === "organizers"
											? "bg-primary text-primary-foreground"
											: "text-muted-foreground hover:text-foreground",
									)}
								>
									Organizers
								</button>
							</div>
						</div>

						{/* Heading */}
						<div className="mb-5 sm:mb-6">
							<h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground font-millik">
								{activeTab === "events" ? (
									<>
										Discover Amazing{" "}
										<span className="text-primary">
											African Events
										</span>
									</>
								) : (
									<>
										Trusted{" "}
										<span className="text-primary">
											Event Organizers
										</span>
									</>
								)}
							</h1>
							<p className="text-sm sm:text-base text-muted-foreground mt-1.5 font-medium">
								{activeTab === "events"
									? "Explore festivals, awards, galas, and summits with ticket sales and USSD voting across Africa."
									: "Discover and connect with top event organizers and award producers across African nations."}
							</p>
						</div>

						{/* Search Bar & Filters */}
						<div className="w-full">
							<EventsSearch
								searchQuery={searchQuery}
								onSearchChange={setSearchQuery}
								selectedType={selectedType}
								onTypeChange={setSelectedType}
								selectedCategory={selectedCategory}
								onCategoryChange={setSelectedCategory}
								activeFilter={activeFilter}
								onFilterChange={setActiveFilter}
								mode={activeTab}
								placeholder={
									activeTab === "events"
										? "Search for African events..."
										: "Search for organizers across Africa..."
								}
							/>
						</div>
					</div>
				</section>

				{/* Results Section */}
				<section className="pb-16 sm:pb-20">
					<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-6">
						{activeTab === "events" ? (
							<EventsGrid events={filteredEvents} />
						) : (
							<OrganizersGrid organizers={filteredOrganizers} />
						)}
					</div>
				</section>
			</main>

			<LandingCTA />
			<LandingFooter />
		</div>
	);
}
