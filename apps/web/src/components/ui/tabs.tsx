"use client";
import { cva, type VariantProps } from "class-variance-authority";
import { Tabs as TabsPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Tabs({
	className,
	orientation = "horizontal",
	...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
	return (
		<TabsPrimitive.Root
			data-slot="tabs"
			data-orientation={orientation}
			orientation={orientation}
			className={cn(
				"group/tabs flex gap-2 data-[orientation=horizontal]:flex-col",
				className,
			)}
			{...props}
		/>
	);
}

const tabsListVariants = cva(
	"group/tabs-list inline-flex w-full sm:w-fit items-center justify-center rounded p-[3px] text-muted-foreground overflow-x-auto group-data-[orientation=horizontal]/tabs:min-h-9 group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col data-[variant=line]:rounded-none",
	{
		variants: {
			variant: {
				default: "bg-muted",
				line: "gap-1 bg-transparent",
				brand: "bg-background border border-border rounded-xl h-11 space-x-1 shadow-xs",
				afro: "bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(234,179,8,0.14),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(22,163,74,0),transparent_26%)] border border-[rgba(234,179,8,0.18)] h-11 space-x-1",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

function TabsList({
	className,
	variant = "default",
	...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
	VariantProps<typeof tabsListVariants>) {
	return (
		<TabsPrimitive.List
			data-slot="tabs-list"
			data-variant={variant}
			className={cn(tabsListVariants({ variant }), className)}
			{...props}
		/>
	);
}

const tabsTriggerVariants = cva(
	"relative inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-sm px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start focus-visible:outline-none focus:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				default: "text-foreground/60 hover:text-foreground group-data-[variant=default]/tabs-list:data-[state=active]:shadow-sm group-data-[variant=line]/tabs-list:data-[state=active]:shadow-none dark:text-muted-foreground dark:hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground dark:data-[state=active]:bg-input/30 dark:data-[state=active]:text-foreground",
				line: "text-foreground/60 hover:text-foreground bg-transparent data-[state=active]:bg-transparent dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-transparent after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:bottom-[-5px] group-data-[orientation=horizontal]/tabs:after:h-0.5 group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-right-1 group-data-[orientation=vertical]/tabs:after:w-0.5 data-[state=active]:after:opacity-100",
				brand: "text-foreground/70 hover:text-foreground data-[state=active]:text-foreground data-[state=active]:font-semibold nth-[3n+1_of_[data-slot=tabs-trigger]]:hover:bg-[#02a605]/10 nth-[3n+1_of_[data-slot=tabs-trigger]]:data-[state=active]:bg-[#02a605]/18 nth-[3n+2_of_[data-slot=tabs-trigger]]:hover:bg-[#ffe100]/12 nth-[3n+2_of_[data-slot=tabs-trigger]]:data-[state=active]:bg-[#ffe100]/20 nth-[3n+3_of_[data-slot=tabs-trigger]]:hover:bg-[#dc2626]/10 nth-[3n+3_of_[data-slot=tabs-trigger]]:data-[state=active]:bg-[#dc2626]/18",
				afro: "group-data-[variant=afro]/tabs-list:text-foreground group-data-[variant=afro]/tabs-list:hover:text-foreground group-data-[variant=afro]/tabs-list:data-[state=active]:text-foreground group-data-[variant=afro]/tabs-list:data-[state=active]:shadow-sm group-data-[variant=afro]/tabs-list:data-[state=active]:bg-background/80 font-medium",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

function TabsTrigger({
	className,
	variant = "default",
	...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> &
	VariantProps<typeof tabsTriggerVariants>) {
	return (
		<TabsPrimitive.Trigger
			data-slot="tabs-trigger"
			data-variant={variant}
			className={cn(tabsTriggerVariants({ variant }), className)}
			{...props}
		/>
	);
}

function TabsContent({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
	return (
		<TabsPrimitive.Content
			data-slot="tabs-content"
			className={cn("flex-1 outline-none", className)}
			{...props}
		/>
	);
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants, tabsTriggerVariants };
