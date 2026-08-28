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
				"relative flex items-center justify-between gap-4 p-4 rounded-md text-left transition-all overflow-hidden",
				"bg-muted/30 hover:bg-muted/50",
				isSelected && "bg-primary/10",
			)}
		>
			{/* Content */}
			<div className="relative z-10 flex-1 min-w-0">
				<span className={cn(
					"font-medium",
					isSelected ? "text-primary" : "text-foreground",
				)}>
					{label}
				</span>
				<p className="text-xs text-muted-foreground mt-1 line-clamp-2">
					{description}
				</p>
			</div>

			{/* Illustration at right, full height, overflow hidden */}
			<div
				className={cn(
					"relative shrink-0 h-20 w-20 flex items-center justify-center",
					"opacity-80",
					isSelected && "opacity-100",
				)}
			>
				<div className="absolute inset-0 flex items-center justify-center">
					{illustration}
				</div>
			</div>
		</button>
	);
}
