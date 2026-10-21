"use client";

import { useState } from "react";
import Link from "next/link";
import {
	Building2,
	Wallet,
	TrendingUp,
	Coins,
	ArrowUpRight,
	Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatAmount, cn } from "@/lib/utils";
import type { AdminOverviewStats } from "@/lib/dal/admin";

interface AdminOverviewContentProps {
	stats: AdminOverviewStats;
}

function MetricCard({
	label,
	value,
	hint,
	icon: Icon,
	href,
	hrefLabel,
}: {
	label: string;
	value: string;
	hint: string;
	icon: typeof TrendingUp;
	href?: string;
	hrefLabel?: string;
}) {
	return (
		<Card className="border-border/70 shadow-none">
			<CardContent className="p-4 flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="text-[11px] font-medium text-muted-foreground">{label}</p>
					<p className="text-xl font-semibold text-foreground font-mono mt-1 tracking-tight">
						{value}
					</p>
					<p className="text-[11px] text-muted-foreground mt-1">{hint}</p>
					{href && hrefLabel && (
						<Link
							href={href}
							className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground hover:underline mt-2"
						>
							{hrefLabel}
							<ArrowUpRight className="size-3" />
						</Link>
					)}
				</div>
				<div className="size-8 rounded-md bg-muted/60 border border-border/50 flex items-center justify-center text-muted-foreground shrink-0">
					<Icon className="size-4" />
				</div>
			</CardContent>
		</Card>
	);
}

export function AdminOverviewContent({ stats }: AdminOverviewContentProps) {
	const [activeCurrency, setActiveCurrency] = useState<"GHS" | "USD" | "NGN">("GHS");

	const grossVolume = stats.totalGrossVolume[activeCurrency] || 0;
	const platformShare = stats.totalPlatformShare[activeCurrency] || 0;
	const organizerShare = stats.totalOrganizerShare[activeCurrency] || 0;
	const walletFloat = stats.totalWalletFloat[activeCurrency] || 0;

	const statusItems = [
		{ label: "Ongoing", value: stats.eventsByStatus.ongoing },
		{ label: "Published", value: stats.eventsByStatus.published },
		{ label: "Ended", value: stats.eventsByStatus.ended },
		{ label: "Drafts", value: stats.eventsByStatus.draft },
		{ label: "Cancelled", value: stats.eventsByStatus.cancelled },
	];

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
				<div>
					<p className="text-xs text-muted-foreground">
						{stats.totalOrganizers} organizers · {stats.totalEvents} events
					</p>
				</div>
				<div className="flex items-center gap-1 rounded-lg border border-border/70 bg-card p-0.5 w-fit">
					{(["GHS", "USD", "NGN"] as const).map((cur) => (
						<button
							key={cur}
							type="button"
							onClick={() => setActiveCurrency(cur)}
							className={cn(
								"px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
								activeCurrency === cur
									? "bg-muted text-foreground"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							{cur}
						</button>
					))}
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<MetricCard
					label="Gross inflow"
					value={formatAmount(grossVolume, activeCurrency)}
					hint="Tickets and votes"
					icon={TrendingUp}
				/>
				<MetricCard
					label="Platform share"
					value={formatAmount(platformShare, activeCurrency)}
					hint={
						grossVolume > 0
							? `${((platformShare / grossVolume) * 100).toFixed(1)}% of gross`
							: "Company fee retained"
					}
					icon={Coins}
				/>
				<MetricCard
					label="Organizer share"
					value={formatAmount(organizerShare, activeCurrency)}
					hint="Net due to hosts"
					icon={Building2}
					href="/super/organizers"
					hrefLabel="View organizers"
				/>
				<MetricCard
					label="Wallet float"
					value={formatAmount(walletFloat, activeCurrency)}
					hint="Held across wallets"
					icon={Wallet}
					href="/super/wallets"
					hrefLabel="Wallets"
				/>
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-5 gap-px rounded-xl border border-border/70 bg-border/70 overflow-hidden">
				{statusItems.map((item) => (
					<div key={item.label} className="bg-card p-3 sm:p-4">
						<p className="text-[11px] text-muted-foreground">{item.label}</p>
						<p className="text-lg font-semibold font-mono text-foreground mt-0.5">
							{item.value}
						</p>
					</div>
				))}
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<Card className="border-border/70 shadow-none">
					<CardHeader className="p-4 border-b border-border/60 flex flex-row items-center justify-between gap-2 space-y-0">
						<CardTitle className="text-sm font-semibold">Live events</CardTitle>
						<Button variant="ghost" size="sm" asChild className="h-8 text-xs">
							<Link href="/super/events?status=ongoing">View all</Link>
						</Button>
					</CardHeader>
					<CardContent className="p-0">
						{stats.ongoingEvents.length === 0 ? (
							<EmptyState
								variant="events"
								title="No live events"
								description="Ongoing events will show here with revenue breakdown."
								className="py-10"
							/>
						) : (
							<div className="divide-y divide-border/60">
								{stats.ongoingEvents.map((ev) => (
									<div
										key={ev.id}
										className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
									>
										<div className="min-w-0">
											<div className="flex items-center gap-2">
												<Badge
													variant="outline"
													className="text-[10px] font-medium border-border/70"
												>
													Live
												</Badge>
												<span className="text-xs text-muted-foreground truncate">
													{ev.organization.name}
												</span>
											</div>
											<p className="text-sm font-semibold text-foreground truncate mt-1">
												{ev.title}
											</p>
											<p className="text-[11px] text-muted-foreground mt-0.5">
												{ev.ticketsSold} tickets sold
											</p>
										</div>
										<div className="text-xs sm:text-right shrink-0 space-y-0.5 font-mono">
											<p className="text-muted-foreground">
												Gross{" "}
												<span className="text-foreground font-medium">
													{formatAmount(ev.grossRevenue, "GHS")}
												</span>
											</p>
											<p className="text-muted-foreground">
												Platform{" "}
												<span className="text-foreground font-medium">
													{formatAmount(ev.ourShare, "GHS")}
												</span>
											</p>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				<Card className="border-border/70 shadow-none">
					<CardHeader className="p-4 border-b border-border/60 flex flex-row items-center justify-between gap-2 space-y-0">
						<CardTitle className="text-sm font-semibold">Recent activity</CardTitle>
						<Button variant="ghost" size="sm" asChild className="h-8 text-xs">
							<Link href="/super/wallets">Wallets</Link>
						</Button>
					</CardHeader>
					<CardContent className="p-0">
						{stats.recentTransactions.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
								<Clock className="size-6 mb-2 opacity-40" />
								<p className="text-sm font-medium text-foreground">No recent activity</p>
							</div>
						) : (
							<div className="divide-y divide-border/60">
								{stats.recentTransactions.map((tx) => {
									const isCredit = tx.type === "credit";
									return (
										<div
											key={tx.id}
											className="p-3.5 flex items-center justify-between gap-3 text-xs"
										>
											<div className="min-w-0">
												<p className="font-semibold text-foreground truncate">
													{tx.organizationName}
												</p>
												<p className="text-[11px] text-muted-foreground truncate capitalize">
													{tx.category.replace("_", " ")} ·{" "}
													{new Date(tx.createdAt).toLocaleDateString()}
												</p>
											</div>
											<div className="text-right shrink-0 font-mono">
												<span className="font-semibold text-foreground">
													{isCredit ? "+" : "-"}
													{formatAmount(tx.amount, tx.currency)}
												</span>
												{tx.feeAmount > 0 && (
													<p className="text-[10px] text-muted-foreground">
														Fee {formatAmount(tx.feeAmount, tx.currency)}
													</p>
												)}
											</div>
										</div>
									);
								})}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
