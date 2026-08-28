"use client";

import { ChevronRight, Settings2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Sheet,
	SheetBody,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { PROJ_NAME } from "@/lib/constants/branding";
import { formatAmount } from "@/lib/utils";
import {
	type EventStatsData,
	StatCard,
	StatsGrid,
	statIcons,
} from "../core/EventStats";

const MAX_STATS = 4;

interface StatDefinition {
	key: string;
	label: string;
	iconSrc: string;
	getValue: (stats: EventStatsData, profile?: ProfileStats) => number | string;
}

interface ProfileStats {
	organizationCount: number;
	createdEvents: number;
}

const EVENT_STATS: StatDefinition[] = [
	{
		key: "total",
		label: "Total Events",
		iconSrc: statIcons.search,
		getValue: (s) => s.total,
	},
	{
		key: "published",
		label: "Published",
		iconSrc: statIcons.high,
		getValue: (s) => s.published,
	},
	{
		key: "ongoing",
		label: "Ongoing",
		iconSrc: statIcons.ongoing,
		getValue: (s) => s.ongoing,
	},
	{
		key: "drafts",
		label: "Drafts",
		iconSrc: statIcons.draft,
		getValue: (s) => s.draft,
	},
	{
		key: "upcoming",
		label: "Upcoming",
		iconSrc: statIcons.ongoingGreen,
		getValue: (s) => s.upcoming,
	},
	{
		key: "ended",
		label: "Ended",
		iconSrc: statIcons.end,
		getValue: (s) => s.ended,
	},
	{
		key: "cancelled",
		label: "Cancelled",
		iconSrc: statIcons.cancel,
		getValue: (s) => s.cancelled,
	},
	{
		key: "ticketsSold",
		label: "Tickets Sold",
		iconSrc: statIcons.ticket,
		getValue: (s) => s.totalTicketsSold,
	},
	{
		key: "checkins",
		label: "Check-ins",
		iconSrc: statIcons.user,
		getValue: (s) => s.totalAttendees,
	},
	{
		key: "votes",
		label: "Total Votes",
		iconSrc: statIcons.vote,
		getValue: (s) => s.totalVotes,
	},
	{
		key: "revenue",
		label: "Revenue",
		iconSrc: statIcons.analytics,
		getValue: (s) => formatAmount(s.totalRevenue),
	},
	{
		key: "checkinRate",
		label: "Check-in Rate",
		iconSrc: statIcons.ongoingGreen,
		getValue: (s) =>
			s.totalTicketsSold > 0
				? `${Math.round((s.totalAttendees / s.totalTicketsSold) * 100)}%`
				: "—",
	},
];

const PROFILE_STATS: StatDefinition[] = [
	{
		key: "organizations",
		label: "Organizations",
		iconSrc: statIcons.locationBlack,
		getValue: (_s, p) => p?.organizationCount ?? 0,
	},
	{
		key: "createdEvents",
		label: "Created Events",
		iconSrc: statIcons.plus,
		getValue: (_s, p) => p?.createdEvents ?? 0,
	},
];

const DEFAULT_KEYS = ["total", "published", "ongoing", "ticketsSold"];

function loadSelectedKeys(storageKey: string, defaults: string[]): string[] {
	if (globalThis.window === undefined) return defaults;
	try {
		const stored = localStorage.getItem(storageKey);
		if (stored) {
			const parsed: unknown = JSON.parse(stored);
			if (
				Array.isArray(parsed) &&
				parsed.length > 0 &&
				parsed.every((k) => typeof k === "string")
			) {
				return parsed.slice(0, MAX_STATS);
			}
		}
	} catch {
		// ignore
	}
	return defaults;
}

interface CustomizableEventStatsProps {
	readonly stats: EventStatsData;
	readonly profileStats?: ProfileStats;
	readonly storageKey?: string;
	readonly defaultKeys?: string[];
	readonly actions?: React.ReactNode;
}

export function CustomizableEventStats({
	stats,
	profileStats,
	storageKey = `${PROJ_NAME.toLowerCase()}:my-events-stats`,
	defaultKeys = DEFAULT_KEYS,
	actions,
}: CustomizableEventStatsProps) {
	const pool = useMemo(
		() => (profileStats ? [...EVENT_STATS, ...PROFILE_STATS] : EVENT_STATS),
		[profileStats],
	);

	const [selected, setSelected] = useState<string[]>(defaultKeys);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setSelected(loadSelectedKeys(storageKey, defaultKeys));
		setMounted(true);
	}, [storageKey, defaultKeys]);

	const persist = useCallback(
		(keys: string[]) => {
			setSelected(keys);
			localStorage.setItem(storageKey, JSON.stringify(keys));
		},
		[storageKey],
	);

	const toggle = useCallback(
		(key: string) => {
			if (selected.includes(key)) {
				if (selected.length <= 1) return;
				persist(selected.filter((k) => k !== key));
			} else if (selected.length >= MAX_STATS) {
				// Swap: drop the last selected stat, add the new one
				persist([...selected.slice(0, -1), key]);
			} else {
				persist([...selected, key]);
			}
		},
		[selected, persist],
	);

	const activeKeys = mounted ? selected : defaultKeys;
	const activeStats = pool.filter((s) => activeKeys.includes(s.key));

return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-medium text-muted-foreground">Overview</h3>
				<div className="flex items-center gap-2">
					{pool.length > MAX_STATS && (
						<Sheet>
							<SheetTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
								>
									Show more
									<ChevronRight className="ml-1 h-3 w-3" />
								</Button>
							</SheetTrigger>
							<SheetContent side="right" className="w-full max-w-lg">
								<SheetHeader>
									<SheetTitle>All Stats</SheetTitle>
									<SheetDescription>
										Complete overview of your event metrics
									</SheetDescription>
								</SheetHeader>
								<SheetBody className="flex-1 overflow-y-auto p-0">
									<div className="mt-6">
										<StatsGrid columns={2}>
											{pool.map((stat) => (
												<StatCard
													key={stat.key}
													label={stat.label}
													value={stat.getValue(stats, profileStats)}
													iconSrc={stat.iconSrc}
												/>
											))}
										</StatsGrid>
									</div>
								</SheetBody>
							</SheetContent>
						</Sheet>
					)}
					{actions}
					<Popover>
						<PopoverTrigger asChild>
							<Button variant="ghost" size="icon" className="size-7">
								<Settings2 className="size-3.5" />
								<span className="sr-only">Customize stats</span>
							</Button>
						</PopoverTrigger>
						<PopoverContent align="end" className="w-64">
							<div className="space-y-3">
								<div>
									<p className="text-sm font-medium">Customize Stats</p>
									<p className="text-xs text-muted-foreground">
										Pick up to {MAX_STATS} , selecting a new one replaces the last
									</p>
								</div>
								<div className="space-y-2">
									{pool.map((stat) => {
										const isActive = selected.includes(stat.key);
										return (
											<div
												key={stat.key}
												className="flex items-center justify-between gap-2 text-sm"
											>
												<span>{stat.label}</span>
												<Switch
													checked={isActive}
													disabled={isActive && selected.length <= 1}
													onCheckedChange={() => toggle(stat.key)}
												/>
											</div>
										);
									})}
								</div>
							</div>
						</PopoverContent>
					</Popover>
				</div>
			</div>
			<StatsGrid columns={4}>
				{activeStats.map((stat) => (
					<StatCard
						key={stat.key}
						label={stat.label}
						value={stat.getValue(stats, profileStats)}
						iconSrc={stat.iconSrc}
					/>
				))}
			</StatsGrid>
		</div>
	);
}
