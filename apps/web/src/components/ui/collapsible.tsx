"use client";
import { Collapsible as CollapsiblePrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Collapsible({
	...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
	return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

function CollapsibleTrigger({
	...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Trigger>) {
	return (
		<CollapsiblePrimitive.Trigger
			data-slot="collapsible-trigger"
			className={cn(
				"flex w-full items-center justify-between rounded-md px-2 py-1 text-sm font-medium hover:underline data-[state=open]:underline data-[state=open]:opacity-100",
			)}
			{...props}
		/>
	);
}

function CollapsibleContent({
	className,
	...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Content>) {
	return (
		<CollapsiblePrimitive.Content
			data-slot="collapsible-content"
			className={cn(
				"overflow-hidden text-sm transition-all",
				"data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
				className,
			)}
			{...props}
		/>
	);
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
