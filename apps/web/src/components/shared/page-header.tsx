"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItemConfig {
	label: React.ReactNode;
	href?: string;
	className?: string;
}

export interface PageHeaderProps {
	title?: string;
	heading?: string;
	description?: string;
	text?: string;
	breadcrumbs?: BreadcrumbItemConfig[];
	actions?: React.ReactNode;
	children?: React.ReactNode;
	className?: string;
}

export function PageHeader({
	title,
	heading,
	description,
	text,
	actions,
	children,
	className,
}: PageHeaderProps) {
	const mainTitle = title || heading;
	const subText = description || text;

	// If page provides title or description, render the page title banner
	if (mainTitle || subText) {
		return (
			<div className={cn("flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between", className)}>
				<div className="space-y-0.5">
					{mainTitle && (
						<h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
							{mainTitle}
						</h1>
					)}
					{subText && (
						<p className="text-sm text-muted-foreground">
							{subText}
						</p>
					)}
				</div>
				{actions && <div className="flex items-center gap-2 mt-2 sm:mt-0">{actions}</div>}
				{children}
			</div>
		);
	}

	// If actions provided without title, render action bar
	if (actions) {
		return <div className={cn("flex items-center justify-end gap-2", className)}>{actions}</div>;
	}

	// If only breadcrumbs passed (handled globally by AppHeader), render nothing redundant
	return null;
}
