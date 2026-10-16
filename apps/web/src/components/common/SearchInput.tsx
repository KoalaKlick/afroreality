"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SearchInputProps {
	readonly value: string;
	readonly onChange: (value: string) => void;
	readonly placeholder?: string;
	readonly className?: string;
	readonly inputClassName?: string;
	readonly autoFocus?: boolean;
}

export function SearchInput({
	value,
	onChange,
	placeholder = "Search...",
	className,
	inputClassName,
	autoFocus = false,
}: SearchInputProps) {
	return (
		<div className={cn("relative w-full sm:w-[360px] md:w-[420px]", className)}>
			<div className="flex items-center h-10 sm:h-11 w-full bg-background border border-border focus-within:border-primary rounded-lg shadow-none overflow-hidden transition-colors">
				<div className="pl-3.5 pr-2 text-muted-foreground shrink-0 flex items-center justify-center">
					<Search className="size-4 text-primary" />
				</div>
				<input
					type="search"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					autoFocus={autoFocus}
					className={cn(
						"flex-1 min-w-0 bg-transparent border-0 focus:ring-0 focus:outline-none text-xs sm:text-sm h-full outline-none placeholder:text-muted-foreground text-foreground",
						inputClassName,
					)}
				/>
				{value && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="size-7 p-0 mr-1.5 hover:bg-muted shrink-0 rounded-md"
						onClick={() => onChange("")}
						aria-label="Clear search"
					>
						<X className="size-3.5" />
					</Button>
				)}
			</div>
		</div>
	);
}

export default SearchInput;
