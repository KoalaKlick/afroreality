"use client";

import Link from "next/link";
import {
	Ban,
	Calendar,
	CheckCircle,
	Clock,
	FileText,
	type LucideIcon,
	Ticket,
	TrendingUp,
	Users,
	Vote,
	Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatAmount } from "@/lib/utils";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";

/**
 * 3D stat icon paths mapped by name
 */
export const statIcons = {
	analytics: "/stat-icon/analytics-yellow.webp",
	cancel: "/stat-icon/cancel-red.webp",
	cediBlack: "/stat-icon/cedi-black.webp",
	cedi: "/stat-icon/cedi-green.webp",
	end: "/stat-icon/end-red.webp",
	euro: "/stat-icon/euro-green.webp",
	high: "/stat-icon/high-green.webp",
	locationBlack: "/stat-icon/location-black.webp",
	location: "/stat-icon/location-red.webp",
	ongoingGreen: "/stat-icon/ongoing-green.webp",
	ongoing: "/stat-icon/ongoing-yellow.webp",
	plus: "/stat-icon/plus-green.webp",
	search: "/stat-icon/search-red.webp",
	ticketRed: "/stat-icon/ticket-red.webp",
	ticket: "/stat-icon/ticket-yellow.webp",
	user: "/stat-icon/user-black.webp",
	vote: "/stat-icon/vote-red.webp",
	draft: "/stat-icon/draft-black.webp",
} as const;

/**
 * Individual Stat Card Props
 */
export interface StatCardProps {
	label: string;
	value: number | string;
	icon?: LucideIcon;
	iconSrc?: string;
	description?: string;
	href?: string;
	variant?: "default" | "success" | "warning" | "danger" | "info";
	className?: string;
	children?: ReactNode;
	onClick?: () => void;
}

/**
 * Derive card gradient from the icon filename's color suffix.
 * Bottom-right glow matches the icon color.
 */
function getIconColorStyles(iconSrc: string): {
	style: React.CSSProperties;
	className: string;
} {
	const filename = iconSrc.split("/").pop() ?? "";
	const base = filename.replace(".webp", "");
	const color = base.split("-").pop();

	const colorGlow: Record<string, string> = {
		red: "radial-gradient(circle at bottom right, rgba(239, 68, 68, 0.25), transparent 60%)",
		yellow: "radial-gradient(circle at bottom right, rgba(245, 158, 11, 0.25), transparent 60%)",
		green: "radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.25), transparent 60%)",
		black: "radial-gradient(circle at bottom right, rgba(156, 163, 175, 0.18), transparent 60%)",
	};

	const borderColor: Record<string, string> = {
		red: "border-red-500/20 dark:border-red-500/30",
		yellow: "border-amber-500/20 dark:border-amber-500/30",
		green: "border-emerald-500/20 dark:border-emerald-500/30",
		black: "border-border",
	};

	const backgroundImage =
		color && colorGlow[color] ? colorGlow[color] : undefined;
	const border =
		color && borderColor[color] ? borderColor[color] : "border-border";

	return {
		style: backgroundImage ? { backgroundImage } : {},
		className: border,
	};
}

/**
 * Format a number with compact notation for large values (1.2K, 1.5M, etc.)
 */
function formatCompact(value: number | string): string {
	if (typeof value === "string") return value;
	if (value >= 1_000_000)
		return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
	if (value >= 10_000)
		return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
	if (value >= 1_000) return value.toLocaleString("en-US");
	return value.toString();
}

/**
 * Get text size class based on display string length
 */
function getValueSizeClass(display: string): string {
	const len = display.length;
	if (len <= 4) return "text-4xl leading-10";
	if (len <= 7) return "text-3xl leading-9";
	if (len <= 11) return "text-2xl leading-8";
	return "text-xl leading-7";
}

/**
 * Reusable Stat Card Component
 */
export function StatCard({
	label,
	value,
	icon: Icon,
	iconSrc,
	description,
	href,
	variant = "default",
	className,
	children,
	onClick,
}: StatCardProps) {
	const variantStyles = {
		default: "bg-card",
		success: "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900",
		warning: "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900",
		danger: "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900",
		info: "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900",
	};

	const iconStyles = {
		default: "text-primary",
		success: "text-emerald-600 dark:text-emerald-400",
		warning: "text-amber-600 dark:text-amber-400",
		danger: "text-red-600 dark:text-red-400",
		info: "text-blue-600 dark:text-blue-400",
	};

	// Icon color suffix takes priority, then variant
	const iconColor = iconSrc ? getIconColorStyles(iconSrc) : null;
	const cardStyle = iconColor ? iconColor.className : variantStyles[variant];
	const cardInlineStyle = iconColor ? iconColor.style : undefined;

	const content = (() => {
		const isNumeric = typeof value === "number";
		const display = isNumeric ? formatCompact(value) : value;
		const sizeClass = getValueSizeClass(String(display));

		return (
			<Card
				className={cn(
					"relative p-5 group overflow-hidden border transition-all duration-300 hover:shadow-md min-h-[120px] flex flex-col justify-between bg-card",
					cardStyle,
					className,
					onClick && "cursor-pointer active:scale-[0.98]",
				)}
				style={{ ...cardInlineStyle }}
				onClick={onClick}
			>
				<CardContent className="p-0 flex-1 flex flex-col justify-between relative z-10">
					<div className="flex items-start justify-between gap-2">
						<div className="space-y-1.5 flex-1">
							<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								{label}
							</p>
							<p
								className={cn(
									sizeClass,
									"font-bold font-montserrat tracking-tight text-foreground",
								)}
							>
								{isNumeric ? (
									<AnimatedCounter value={value} duration={1.5} format={formatCompact} />
								) : (
									display
								)}
							</p>
							{description && (
								<p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
							)}
						</div>
						{!iconSrc && Icon && (
							<div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
								<Icon className={cn("size-5", iconStyles[variant])} />
							</div>
						)}
					</div>
					{children && (
						<div className="mt-3 relative z-20">{children}</div>
					)}
				</CardContent>

				{iconSrc && (
					// eslint-disable-next-line @next/next/no-img-element
					<img
						src={iconSrc}
						alt={label}
						className="size-24 object-contain opacity-40 dark:opacity-45 group-hover:opacity-85 group-hover:scale-110 transition-all duration-300 select-none pointer-events-none absolute -bottom-3 -right-3"
					/>
				)}
			</Card>
		);
	})();

	if (href) {
		return (
			<Link href={href} className="block">
				{content}
			</Link>
		);
	}

	return content;
}

/**
 * Stats Grid Container
 */
interface StatsGridProps {
	children: ReactNode;
	columns?: 2 | 3 | 4 | 5;
	className?: string;
}

export function StatsGrid({
	children,
	columns = 4,
	className,
}: StatsGridProps) {
	const colClasses = {
		2: "grid-cols-1 sm:grid-cols-2",
		3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
		4: "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4",
		5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
	};

	return (
		<div className={cn("grid gap-4", colClasses[columns], className)}>
			{children}
		</div>
	);
}

/**
 * Stats Section with Title
 */
interface StatsSectionProps {
	title?: string;
	description?: string;
	children: ReactNode;
	className?: string;
}

export function StatsSection({
	title,
	description,
	children,
	className,
}: StatsSectionProps) {
	return (
		<div className={cn("space-y-4", className)}>
			{(title ?? description) && (
				<div>
					{title && <h3 className="text-lg font-semibold">{title}</h3>}
					{description && (
						<p className="text-sm text-muted-foreground">{description}</p>
					)}
				</div>
			)}
			{children}
		</div>
	);
}

/**
 * Event Stats Data Type (matches DAL return)
 */
export interface EventStatsData {
	total: number;
	published: number;
	draft: number;
	ongoing: number;
	ended: number;
	cancelled: number;
	upcoming: number;
	byType: {
		voting: number;
		ticketed: number;
		hybrid: number;
		standard: number;
	};
	totalTicketsSold: number;
	totalRevenue: number;
	totalAttendees: number;
	totalVotes: number;
	mostAttendedEvent?: { id: string; title: string; attendees: number };
	upcomingEvent?: { id: string; title: string; startDate: Date };
	recentEvent?: { id: string; title: string; endDate: Date };
}

/**
 * Pre-built Event Stats Component
 */
interface EventStatsProps {
	stats: EventStatsData;
	showEngagement?: boolean;
	showByType?: boolean;
	className?: string;
}

export function EventStats({
	stats,
	showEngagement = true,
	showByType = false,
	className,
}: EventStatsProps) {
	return (
		<div className={cn("space-y-6", className)}>
			{/* Primary Stats */}
			<StatsGrid columns={4}>
				<StatCard
					label="Total Events"
					value={stats.total}
					iconSrc={statIcons.search}
				/>
				<StatCard
					label="Published"
					value={stats.published}
					iconSrc={statIcons.high}
				/>
				<StatCard
					label="Ongoing"
					value={stats.ongoing}
					iconSrc={statIcons.ongoing}
				/>
				<StatCard
					label="Drafts"
					value={stats.draft}
					iconSrc={statIcons.draft}
				/>
			</StatsGrid>

			{/* Engagement Stats */}
			{showEngagement &&
				(stats.totalTicketsSold > 0 || stats.totalVotes > 0) && (
					<StatsSection title="Engagement">
						<StatsGrid columns={4}>
							<StatCard
								label="Tickets Sold"
								value={stats.totalTicketsSold}
								iconSrc={statIcons.ticket}
							/>
							<StatCard
								label="Check-ins"
								value={stats.totalAttendees}
								iconSrc={statIcons.user}
							/>
							<StatCard
								label="Total Votes"
								value={stats.totalVotes}
								iconSrc={statIcons.vote}
							/>
							<StatCard
								label="Revenue"
								value={formatAmount(stats.totalRevenue)}
								iconSrc={statIcons.analytics}
							/>
						</StatsGrid>
					</StatsSection>
				)}

			{/* Event Type Breakdown */}
			{showByType && (
				<StatsSection title="By Event Type">
					<StatsGrid columns={4}>
						<StatCard
							label="Voting"
							value={stats.byType.voting}
							iconSrc={statIcons.vote}
						/>
						<StatCard
							label="Ticketed"
							value={stats.byType.ticketed}
							iconSrc={statIcons.ticketRed}
						/>
						<StatCard
							label="Hybrid"
							value={stats.byType.hybrid}
							iconSrc={statIcons.ongoingGreen}
						/>
						<StatCard
							label="Standard"
							value={stats.byType.standard}
							iconSrc={statIcons.plus}
						/>
					</StatsGrid>
				</StatsSection>
			)}
		</div>
	);
}

// Export icons for custom use
export const StatIcons = {
	Calendar,
	Users,
	Ticket,
	Vote,
	TrendingUp,
	Clock,
	CheckCircle,
	FileText,
	Zap,
	Ban,
};
