import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventInfoPillProps {
	readonly icon: LucideIcon;
	readonly label: string;
	readonly value: React.ReactNode;
	readonly className?: string;
	readonly valueClassName?: string;
}

export function EventInfoPill({
	icon: Icon,
	label,
	value,
	className,
	valueClassName,
}: EventInfoPillProps) {
	return (
		<div
			className={cn(
				"inline-flex items-center gap-2.5 bg-muted/60 dark:bg-card border border-border rounded-lg px-3.5 py-2 text-foreground transition-colors shadow-none",
				className,
			)}
		>
			<Icon className="size-4 text-primary shrink-0" />
			<div className="flex items-center gap-2">
				<span className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider leading-none">
					{label}:
				</span>
				<span className={cn("text-xs sm:text-sm font-semibold text-foreground leading-none", valueClassName)}>
					{value}
				</span>
			</div>
		</div>
	);
}
