"use client";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
	{
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground hover:bg-primary/90",
				primary:
					"bg-primary-600 text-primary-foreground hover:bg-primary-600/80",
				destructive:
					"bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
				outline:
					"border bg-background hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
				secondary: "bg-secondary-500 text-white hover:bg-secondary-600/80",
				tertiary: "bg-tertiary-700 text-white hover:bg-tertiary/95",
				sepia: "bg-sepia-400 text-sepia-900 hover:bg-sepia-400/90",
				ghost:
					"hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
				link: "text-primary underline-offset-4 hover:underline",
			brand: "bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--color-brand-tertiary)_16%,transparent),transparent_28%),radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--color-brand-secondary)_14%,transparent),transparent_24%),radial-gradient(circle_at_bottom_left,color-mix(in_srgb,var(--color-brand-primary)_0%,transparent),transparent_26%)] border border-brand-secondary/18 text-foreground hover:bg-accent/10",
			"brand-cta":
					"bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--color-brand-tertiary)_16%,transparent),transparent_28%),radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--color-brand-secondary)_14%,transparent),transparent_24%),radial-gradient(circle_at_bottom_left,color-mix(in_srgb,var(--color-brand-primary)_0%,transparent),transparent_26%)] border border-brand-secondary/18 text-foreground hover:bg-accent/10",
			},
			size: {
				default: "h-9 px-4 py-2 has-[>svg]:px-3",
				xs: "h-6 gap-1 rounded-sm px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
				sm: "h-8 gap-1.5 rounded-sm px-3 has-[>svg]:px-2.5",
				lg: "h-10 rounded-sm px-6 has-[>svg]:px-4",
				icon: "size-9",
				"icon-xs": "size-6 rounded-sm [&_svg:not([class*='size-'])]:size-3",
				"icon-sm": "size-8",
				"icon-lg": "size-10",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant = "default",
	size = "default",
	asChild = false,
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? Slot.Root : "button";

	return (
		<Comp
			data-slot="button"
			data-variant={variant}
			data-size={size}
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
