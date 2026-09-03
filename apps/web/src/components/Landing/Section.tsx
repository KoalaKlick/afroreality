import React from "react";
import { cn } from "@/lib/utils";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
	as?: "section" | "div" | "article" | "main";
	maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "6xl" | "7xl";
	className?: string;
	class?: string;
	contentClassName?: string;
	"content-class"?: string;
	children: React.ReactNode;
}

const maxWidthClasses = {
	sm: "max-w-sm",
	md: "max-w-md",
	lg: "max-w-lg",
	xl: "max-w-xl",
	"2xl": "max-w-2xl",
	"4xl": "max-w-4xl",
	"6xl": "max-w-6xl",
	"7xl": "max-w-7xl",
};

export function Section({
	as = "section",
	maxWidth = "6xl",
	className = "",
	class: classProp = "",
	contentClassName = "",
	"content-class": contentClassProp = "",
	children,
	...props
}: SectionProps) {
	const Component = as;
	const resolvedClass = className || classProp;
	const resolvedContentClass = contentClassName || contentClassProp;

	return (
		<Component className={cn("w-full", resolvedClass)} {...props}>
			<div
				className={cn(
					maxWidthClasses[maxWidth],
					"mx-auto px-4 sm:px-6 lg:px-6",
					resolvedContentClass,
				)}
			>
				{children}
			</div>
		</Component>
	);
}
