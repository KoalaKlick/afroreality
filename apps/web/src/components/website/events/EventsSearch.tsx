"use client";

import { Search, X, SlidersHorizontal, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface EventsSearchProps {
	readonly searchQuery: string;
	readonly onSearchChange: (value: string) => void;
	readonly selectedType: string;
	readonly onTypeChange: (type: string) => void;
	readonly selectedCategory: string;
	readonly onCategoryChange: (category: string) => void;
	readonly activeFilter: string;
	readonly onFilterChange: (filter: string) => void;
	readonly mode?: "events" | "organizers";
	readonly placeholder?: string;
}

const EVENT_TYPES = [
	{ value: "all", label: "All African Events" },
	{ value: "ticketed", label: "Tickets & Passes" },
	{ value: "voting", label: "Live & USSD Voting" },
];

const CATEGORIES = [
	{ value: "all", label: "All Categories" },
	{ value: "music", label: "Music & Concerts" },
	{ value: "awards", label: "Awards & Galas" },
	{ value: "conference", label: "Tech & Business Summits" },
	{ value: "festival", label: "Cultural Festivals" },
	{ value: "culture", label: "Arts & Fashion" },
	{ value: "sports", label: "Sports & Competitions" },
	{ value: "other", label: "Other Gatherings" },
];

export function EventsSearch({
	searchQuery,
	onSearchChange,
	selectedType,
	onTypeChange,
	selectedCategory,
	onCategoryChange,
	activeFilter,
	onFilterChange,
	mode = "events",
	placeholder,
}: EventsSearchProps) {
	return (
		<div className="space-y-3">
			{/* Search Input with Integrated Filters Trigger (Preline Clean Style) */}
			<div className="relative w-full sm:w-[520px]">
				<div className="flex items-center h-10 sm:h-11 w-full bg-background border border-border focus-within:border-[#e88722] rounded-lg shadow-none overflow-hidden transition-colors">
					<div className="pl-3.5 pr-2 text-muted-foreground shrink-0">
						<Search className="size-4 text-[#e88722]" />
					</div>
					<input
						type="search"
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						placeholder={
							placeholder ||
							(mode === "events"
								? "Search for events across Africa..."
								: "Search for African organizers...")
						}
						className="flex-1 min-w-0 bg-transparent border-0 focus:ring-0 focus:outline-none text-xs sm:text-sm h-full outline-none placeholder:text-muted-foreground text-foreground"
					/>

					{searchQuery && (
						<Button
							variant="ghost"
							size="sm"
							className="size-7 p-0 mr-1 hover:bg-muted shrink-0 rounded-md"
							onClick={() => onSearchChange("")}
						>
							<X className="size-3.5" />
						</Button>
					)}

					{/* FILTERS dropdown on the right of search bar */}
					<DropdownMenu>
						<DropdownMenuTrigger as-child>
							<button
								type="button"
								className="h-full px-3.5 gap-1.5 text-xs font-semibold tracking-wide bg-muted/40 text-foreground border-l border-border flex items-center shrink-0 transition-colors hover:text-[#e88722]"
							>
								<span>FILTERS</span>
								<SlidersHorizontal className="size-3 text-[#ca0808]" />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-52 shadow-none border border-border">
							<DropdownMenuLabel>Event Type</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuRadioGroup
								value={selectedType}
								onValueChange={onTypeChange}
							>
								{EVENT_TYPES.map((type) => (
									<DropdownMenuRadioItem
										key={type.value}
										value={type.value}
									>
										{type.label}
									</DropdownMenuRadioItem>
								))}
							</DropdownMenuRadioGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{/* Quick Filters Row with Solid Buttons */}
			<div className="flex items-center justify-between gap-4 w-full">
				<div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mb-1">
					{mode === "events" ? (
						<>
							{["ALL", "POPULAR", "UPCOMING", "RECENT"].map((pill) => (
								<Button
									key={pill}
									variant="outline"
									onClick={() => onFilterChange(pill.toLowerCase())}
									className={cn(
										"rounded-lg text-xs font-semibold tracking-wide border-border h-8 px-3 shrink-0 transition-colors shadow-none",
										activeFilter === pill.toLowerCase()
											? "bg-[#e88722] text-white border-[#e88722] hover:bg-[#d66512]"
											: "bg-background text-foreground hover:bg-muted hover:border-[#e88722]/50",
									)}
								>
									{pill}
								</Button>
							))}
						</>
					) : (
						<>
							{["ALL", "POPULAR", "ACTIVE"].map((pill) => (
								<Button
									key={pill}
									variant="outline"
									onClick={() => onFilterChange(pill.toLowerCase())}
									className={cn(
										"rounded-lg text-xs font-semibold tracking-wide border-border h-8 px-3 shrink-0 transition-colors shadow-none",
										activeFilter === pill.toLowerCase()
											? "bg-[#e88722] text-white border-[#e88722] hover:bg-[#d66512]"
											: "bg-background text-foreground hover:bg-muted hover:border-[#e88722]/50",
									)}
								>
									{pill}
								</Button>
							))}
						</>
					)}
				</div>

				{/* SORT BY Category Dropdown */}
				<div className="shrink-0">
					<DropdownMenu>
						<DropdownMenuTrigger as-child>
							<Button
								variant="outline"
								className="rounded-lg gap-1.5 text-xs font-semibold tracking-wide border-border bg-background h-8 px-3 hover:border-[#e88722]/60 hover:text-[#e88722] shadow-none"
							>
								<span>SORT BY</span>
								<ListFilter className="size-3.5 text-[#e88722]" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56 shadow-none border border-border">
							<DropdownMenuLabel>African Event Category</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuRadioGroup
								value={selectedCategory}
								onValueChange={onCategoryChange}
							>
								{CATEGORIES.map((cat) => (
									<DropdownMenuRadioItem key={cat.value} value={cat.value}>
										{cat.label}
									</DropdownMenuRadioItem>
								))}
							</DropdownMenuRadioGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</div>
	);
}
