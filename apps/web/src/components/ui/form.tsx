"use client";

import { Slot } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";

const Form = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		data-slot="form"
		className={cn("grid gap-6", className)}
		{...props}
	/>
));
Form.displayName = "Form";

const FormItem = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		data-slot="form-item"
		className={cn("grid gap-2", className)}
		{...props}
	/>
));
FormItem.displayName = "FormItem";

const FormLabel = React.forwardRef<
	HTMLLabelElement,
	React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
	<label
		ref={ref}
		data-slot="form-label"
		className={cn(
			"text-sm font-medium leading-none",
			"peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
			className,
		)}
		{...props}
	/>
));
FormLabel.displayName = "FormLabel";

const FormControl = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		data-slot="form-control"
		className={cn("w-full", className)}
		{...props}
	/>
));
FormControl.displayName = "FormControl";

const FormDescription = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
	<p
		ref={ref}
		data-slot="form-description"
		className={cn("text-sm text-muted-foreground", className)}
		{...props}
	/>
));
FormDescription.displayName = "FormDescription";

const FormMessage = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
	if (!children) return null;
	return (
		<p
			ref={ref}
			data-slot="form-message"
			className={cn("text-sm font-medium text-destructive", className)}
			{...props}
		>
			{children}
		</p>
	);
});
FormMessage.displayName = "FormMessage";

const FormField = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & {
		children: React.ReactNode;
	}
>(({ className, children, ...props }, ref) => (
	<div
		ref={ref}
		data-slot="form-field"
		className={cn("grid gap-2", className)}
		{...props}
	>
		{children}
	</div>
));
FormField.displayName = "FormField";

export {
	Form,
	FormItem,
	FormLabel,
	FormControl,
	FormDescription,
	FormMessage,
	FormField,
	Slot,
};
