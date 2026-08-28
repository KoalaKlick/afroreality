"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { ONBOARDING_STEPS } from "@/lib/validations/profile";

interface OnboardingProgressProps {
  currentStep: number;
  className?: string;
}

export function OnboardingProgress({
  currentStep,
  className,
}: Readonly<OnboardingProgressProps>) {
  return (
    <div className={cn("w-full mb-6", className)}>
      <div className="flex items-center justify-between gap-2">
        {ONBOARDING_STEPS.map((step, index) => {
          const isCompleted = currentStep > index;
          const isCurrent = currentStep === index;

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200",
                    isCompleted && "bg-emerald-500 text-white shadow-xs",
                    isCurrent && "bg-emerald-500 text-white ring-4 ring-emerald-500/20",
                    !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : step.id}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium hidden sm:inline",
                    isCurrent ? "text-foreground font-semibold" : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>
              </div>

              {index < ONBOARDING_STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-3 h-0.5 flex-1 transition-all duration-300",
                    currentStep > index ? "bg-emerald-500" : "bg-neutral-200 dark:bg-neutral-800"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
