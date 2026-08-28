"use client";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export const setupPrimaryButtonClassName =
	"w-full rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-none";

export const setupSecondaryButtonClassName =
	"w-full rounded-full bg-neutral-50 shadow-none border border-input hover:bg-neutral-100 text-foreground font-semibold";

export const setupGhostButtonClassName =
	"w-full rounded-full text-red-600 hover:text-red-700 hover:bg-red-500/5 font-semibold";

export const setupTextButtonClassName =
	"mx-auto h-auto w-auto px-0 text-sm font-semibold text-emerald-600 hover:bg-transparent hover:text-emerald-700";

interface OnboardingCardProps {
	children: ReactNode;
	className?: string;
}

export function OnboardingCard({ children, className }: Readonly<OnboardingCardProps>) {
	return (
		<div className={cn("w-full max-w-md mx-auto p-0", className)}>
			{children}
		</div>
	);
}

interface OnboardingHeaderProps {
	icon?: ReactNode;
	title?: string;
	description?: string;
}

export function OnboardingHeader({
	icon,
	title,
	description,
}: Readonly<OnboardingHeaderProps>) {
	return (
		<div className="text-center mb-6 sm:mb-7">
			{icon && (
				<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-600 ring-1 ring-yellow-500/40">
					{icon}
				</div>
			)}
			{title && <h2 className="text-xl font-semibold text-foreground">{title}</h2>}
			{description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
		</div>
	);
}

interface OnboardingActionsProps {
	children: ReactNode;
	className?: string;
}

export function OnboardingActions({
	children,
	className,
}: Readonly<OnboardingActionsProps>) {
	return (
		<div className={cn("mt-6 flex flex-col gap-3", className)}>{children}</div>
	);
}