"use client";
// src/components/event/core/EventsFilter.tsx
import { Filter, Plus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
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

interface EventsFilterProps {
	readonly search: string;
	readonly onSearchChange: (value: string) => void;
	readonly statusFilter: string;
	readonly onStatusFilterChange: (status: string) => void;
	readonly statuses?: string[];
	readonly showCreateButton?: boolean;
	readonly onCreateClick?: () => void;
}

const DEFAULT_STATUSES = ["all", "published", "draft", "ongoing", "ended"];

export function EventsFilter({
	search,
	onSearchChange,
	statusFilter,
	onStatusFilterChange,
	statuses = DEFAULT_STATUSES,
	showCreateButton = false,
	onCreateClick,
}: EventsFilterProps) {
	return (
		<div className="flex flex-col sm:flex-row items-center gap-3 w-full">
			<div className="relative flex-1 w-full">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
				<Input
					placeholder="Search events by title or venue..."
					value={search}
					onChange={(e) => onSearchChange(e.target.value)}
					className="pl-9 pr-9"
				/>
				{search && (
					<button
						type="button"
						onClick={() => onSearchChange("")}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
					>
						<X className="size-4" />
					</button>
				)}
			</div>
			<div className="flex items-center gap-2 w-full sm:w-auto">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant={statusFilter !== "all" ? "default" : "outline"}
							size="sm"
							className="gap-1.5 shrink-0"
						>
							<Filter className="size-3.5" />
							<span className="capitalize">{statusFilter === "all" ? "Filter" : statusFilter}</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-40">
						<DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuRadioGroup
							value={statusFilter}
							onValueChange={onStatusFilterChange}
						>
							{statuses.map((st) => (
								<DropdownMenuRadioItem key={st} value={st} className="capitalize [&_[data-slot=dropdown-menu-radio-item-indicator]]:hidden">
									{st}
								</DropdownMenuRadioItem>
							))}
						</DropdownMenuRadioGroup>
					</DropdownMenuContent>
				</DropdownMenu>

				{showCreateButton && onCreateClick && (
					<Button onClick={onCreateClick} size="sm" className="gap-1.5 shrink-0">
						<Plus className="size-3.5" />
						Create Event
					</Button>
				)}
			</div>
		</div>
	);
}
