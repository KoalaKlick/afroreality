"use client";

import { Search, X, Filter, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EventsSearchProps {
	readonly searchQuery: string;
	readonly onSearchChange: (value: string) => void;
	readonly selectedType: string;
	readonly onTypeChange: (type: string) => void;
	readonly selectedCategory?: string;
	readonly onCategoryChange?: (category: string) => void;
	readonly mode?: "events" | "organizers";
	readonly placeholder?: string;
}

const EVENT_TYPES = [
	{ id: "all", label: "All Types" },
	{ id: "ticketed", label: "Ticketed" },
	{ id: "voting", label: "Live Voting" },
	{ id: "hybrid", label: "Tickets & Voting" },
];

const CATEGORIES = [
	"All Categories",
	"Concerts & Music",
	"Arts & Culture",
	"Awards & Gala",
	"Tech & Business",
	"Campus & Youth",
	"Sports & Fitness",
];

export function EventsSearch({
	searchQuery,
	onSearchChange,
	selectedType,
	onTypeChange,
	selectedCategory = "All Categories",
	onCategoryChange,
	mode = "events",
	placeholder,
}: EventsSearchProps) {
	const hasActiveFilters =
		searchQuery.trim().length > 0 ||
		selectedType !== "all" ||
		(selectedCategory && selectedCategory !== "All Categories");

	const handleReset = () => {
		onSearchChange("");
		onTypeChange("all");
		if (onCategoryChange) onCategoryChange("All Categories");
	};

	return (
		<div className="w-full space-y-4">
			{/* Top Search Input Row */}
			<div className="flex flex-col sm:flex-row gap-3 items-center">
				<div className="relative flex-1 w-full">
					<Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
					<Input
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						placeholder={
							placeholder ||
							(mode === "events"
								? "Search events by title, venue, or city..."
								: "Search organizers by organization name or description...")
						}
						className="pl-11 pr-10 h-12 rounded-2xl bg-card border-border/70 text-sm shadow-xs focus-visible:ring-emerald-500"
					/>
					{searchQuery && (
						<button
							type="button"
							onClick={() => onSearchChange("")}
							className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full"
							aria-label="Clear search input"
						>
							<X className="size-4" />
						</button>
					)}
				</div>

				{/* Event Type Filter Pills (Events Mode Only) */}
				{mode === "events" && (
					<div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted/50 border border-border/50 self-stretch sm:self-auto overflow-x-auto">
						{EVENT_TYPES.map((type) => (
							<button
								key={type.id}
								type="button"
								onClick={() => onTypeChange(type.id)}
								className={cn(
									"px-3.5 py-2 text-xs font-semibold rounded-xl transition-all duration-200 whitespace-nowrap",
									selectedType === type.id
										? "bg-card text-foreground shadow-xs font-bold"
										: "text-muted-foreground hover:text-foreground hover:bg-muted/70",
								)}
							>
								{type.label}
							</button>
						))}
					</div>
				)}

				{/* Clear Filters Button */}
				{hasActiveFilters && (
					<Button
						variant="ghost"
						size="sm"
						onClick={handleReset}
						className="h-11 rounded-2xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
					>
						<X className="size-3.5 mr-1 text-red-500" />
						Reset Filters
					</Button>
				)}
			</div>

			{/* Category Badges (Events Mode Only) */}
			{mode === "events" && onCategoryChange && (
				<div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
					<span className="text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
						<SlidersHorizontal className="size-3" />
						Categories:
					</span>
					{CATEGORIES.map((cat) => {
						const isSelected = selectedCategory === cat;
						return (
							<button
								key={cat}
								type="button"
								onClick={() => onCategoryChange(cat)}
								className={cn(
									"px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border",
									isSelected
										? "bg-emerald-600 text-white border-emerald-600 font-semibold shadow-xs"
										: "bg-card/70 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted",
								)}
							>
								{cat}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
