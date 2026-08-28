import type * as React from "react";
import { cn } from "@/lib/utils";

function Card({
	className,
	variant = "background",
	...props
}: React.ComponentProps<"div"> & { variant?: "afro" | "afro-4"|"background" }) {
	return (
		<div
			data-slot="card"
			data-variant={variant}
			className={cn(
				"bg-card text-card-foreground flex flex-col gap-6 rounded-xl shadow-xs py-6",
				variant === "afro" &&
					"border border-[rgba(47,106,74,0.12)] bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.04),transparent_28%),radial-gradient(circle_at_top_right,rgba(234,179,8,0.04),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(22,163,74,0.04),transparent_26%)]",
				className,
			)}
			{...props}
		/>
	);
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-header"
			className={cn(
				"@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
				className,
			)}
			{...props}
		/>
	);
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-title"
			className={cn("leading-none font-semibold", className)}
			{...props}
		/>
	);
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-description"
			className={cn("text-sm text-muted-foreground", className)}
			{...props}
		/>
	);
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-action"
			className={cn(
				"col-start-2 row-span-2 row-start-1 self-start justify-self-end",
				className,
			)}
			{...props}
		/>
	);
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-content"
			className={cn("px-6", className)}
			{...props}
		/>
	);
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-footer"
			className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
			{...props}
		/>
	);
}

export {
	Card,
	CardHeader,
	CardFooter,
	CardTitle,
	CardAction,
	CardDescription,
	CardContent,
};
