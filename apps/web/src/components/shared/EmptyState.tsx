"use client";

import type { LucideIcon } from "lucide-react";
import type React from "react";
import { cn } from "@/lib/utils";

export type EmptyStateVariant =
	| "money"
	| "message"
	| "users"
	| "orders"
	| "order"
	| "payment"
	| "data";

export interface EmptyStateProps {
	readonly variant?: EmptyStateVariant;
	readonly icon?: LucideIcon;
	readonly svgIcon?: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
	readonly title: string;
	readonly description: string;
	readonly action?: React.ReactNode;
	readonly className?: string;
	readonly svgClassName?: string;
	readonly children?: React.ReactNode;
}

const SVG_MAP: Record<EmptyStateVariant, string> = {
	money: "/svg/no-money.svg",
	message: "/svg/no-message.svg",
	users: "/svg/no-users.svg",
	orders: "/svg/no-order.svg",
	order: "/svg/no-order.svg",
	payment: "/svg/no-payment-card.svg",
	data: "/svg/no-data.svg",
};

export function EmptyState({
	variant = "data",
	icon: Icon,
	svgIcon: SvgIcon,
	title,
	description,
	action,
	className,
	svgClassName,
	children,
}: EmptyStateProps) {
	const svgSrc = SVG_MAP[variant] || SVG_MAP.data;

	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center py-8 px-6 text-center select-none",
				className,
			)}
		>
			{Icon ? (
				<div className="mb-4 flex items-center justify-center">
					<div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center">
						<Icon className="w-7 h-7 text-muted-foreground/60" />
					</div>
				</div>
			) : SvgIcon ? (
				<SvgIcon
					className={cn("w-28 h-auto mb-3 text-emerald-600 dark:text-emerald-500", svgClassName)}
				/>
			) : (
				<div className={cn("relative w-28 h-28 mb-3 flex items-center justify-center", svgClassName)}>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={svgSrc}
						alt={title}
						className="w-full h-full object-contain drop-shadow-xs"
					/>
				</div>
			)}
			<h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
			<p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
				{description}
			</p>
			{action && <div className="mt-4">{action}</div>}
			{children}
		</div>
	);
}
