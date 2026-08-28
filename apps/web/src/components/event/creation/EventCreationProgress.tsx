// src/components/event/creation/EventCreationProgress.tsx
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventCreationProgressProps {
	readonly currentStep: number;
	readonly totalSteps?: number;
}

const stepLabels = [
	"Basic Info",
	"Date & Location",
	"Media & Settings",
	"Extras",
];

export function EventCreationProgress({
	currentStep,
}: EventCreationProgressProps) {
	return (
		<nav aria-label="Event creation steps" className="w-full mb-6">
			<ol className="flex items-center gap-2 sm:gap-3 text-sm flex-wrap">
				{stepLabels.map((label, index) => {
					const isCompleted = index < currentStep;
					const isCurrent = index === currentStep;

					return (
						<li key={label} className="flex items-center gap-2 sm:gap-3">
							<span
								className={cn(
									"transition-colors duration-200 select-none",
									isCurrent && "font-semibold text-primary",
									isCompleted && "text-foreground font-medium",
									!isCurrent && !isCompleted && "text-muted-foreground/50",
								)}
							>
								{label}
							</span>
							{index < stepLabels.length - 1 && (
								<ChevronRight className="size-4 text-muted-foreground/40 shrink-0" />
							)}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
