// src/components/event/creation/SelectionCard.tsx
import { cn } from "@/lib/utils";

interface SelectionCardProps {
	readonly illustration: React.ReactNode;
	readonly label: string;
	readonly description: string;
	readonly isSelected: boolean;
	readonly onClick: () => void;
}

export function SelectionCard({
	illustration,
	label,
	description,
	isSelected,
	onClick,
}: SelectionCardProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"relative flex items-center justify-between gap-4 p-4 rounded-xl border text-left transition-all overflow-hidden shadow-none cursor-pointer",
				isSelected
					? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/30"
					: "border-border bg-card hover:bg-muted/40 text-foreground",
			)}
		>
			{/* Content */}
			<div className="relative z-10 flex-1 min-w-0">
				<span
					className={cn(
						"font-semibold text-sm transition-colors",
						isSelected ? "text-primary" : "text-foreground",
					)}
				>
					{label}
				</span>
				<p className="text-xs text-muted-foreground mt-1 line-clamp-2">
					{description}
				</p>
			</div>

			{/* Illustration at right */}
			<div
				className={cn(
					"relative shrink-0 h-16 w-16 sm:h-20 sm:w-20 flex items-center justify-center transition-colors duration-200",
					isSelected ? "text-primary opacity-100" : "text-muted-foreground/60 opacity-60",
				)}
			>
				<div className="absolute inset-0 flex items-center justify-center">
					{illustration}
				</div>
			</div>
		</button>
	);
}
