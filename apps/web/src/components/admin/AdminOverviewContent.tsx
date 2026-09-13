"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
	Building2,
	Calendar,
	Users,
	Wallet,
	TrendingUp,
	ShieldAlert,
	ArrowUpRight,
	Clock,
	CheckCircle2,
	Sparkles,
	Coins,
	Percent,
	Landmark,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatAmount } from "@/lib/utils";
import type { AdminOverviewStats } from "@/lib/dal/admin";

interface AdminOverviewContentProps {
	stats: AdminOverviewStats;
}

export function AdminOverviewContent({ stats }: AdminOverviewContentProps) {
	const [activeCurrency, setActiveCurrency] = useState<"GHS" | "USD" | "NGN">("GHS");

	const grossVolume = stats.totalGrossVolume[activeCurrency] || 0;
	const platformShare = stats.totalPlatformShare[activeCurrency] || 0;
	const organizerShare = stats.totalOrganizerShare[activeCurrency] || 0;
	const walletFloat = stats.totalWalletFloat[activeCurrency] || 0;

	return (
		<div className="flex flex-col gap-6 rounded-none shadow-none">
			{/* Currency Selector Bar */}
			<div className="flex items-center justify-between border-b border-border pb-3 rounded-none shadow-none">
				<div className="flex items-center gap-2">
					<span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
						Financial Currency Scope:
					</span>
					<div className="flex items-center gap-1">
						{(["GHS", "USD", "NGN"] as const).map((cur) => (
							<button
								key={cur}
								type="button"
								onClick={() => setActiveCurrency(cur)}
								className={`px-2.5 py-1 text-xs font-bold transition-all rounded-none shadow-none border ${
									activeCurrency === cur
										? "bg-primary text-primary-foreground border-primary"
										: "bg-muted/40 text-muted-foreground hover:text-foreground border-border"
								}`}
							>
								{cur}
							</button>
						))}
					</div>
				</div>

				<div className="text-xs text-muted-foreground font-mono">
					{stats.totalOrganizers} Organizers • {stats.totalEvents} Total Events
				</div>
			</div>

			{/* Top Metric Cards - 4 Key Financial & Operational Pillars */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 rounded-none shadow-none">
				{/* 1. Gross Platform Inflow */}
				<Card className="rounded-none shadow-none border border-border bg-card">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
							Gross Platform Inflow
						</CardTitle>
						<div className="h-7 w-7 bg-amber-500/10 text-amber-600 flex items-center justify-center rounded-none shadow-none">
							<TrendingUp className="h-4 w-4" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold tracking-tight text-foreground font-mono">
							{formatAmount(grossVolume, activeCurrency)}
						</div>
						<p className="text-[11px] text-muted-foreground mt-1">
							All ticket orders & vote payments
						</p>
						<div className="mt-3 pt-2 border-t border-border flex justify-between items-center text-xs">
							<span className="text-muted-foreground">Volume status</span>
							<Badge variant="outline" className="rounded-none shadow-none border-border text-[10px] font-bold">
								Live Gross
							</Badge>
						</div>
					</CardContent>
				</Card>

				{/* 2. Our Platform Share (Company Earnings) */}
				<Card className="rounded-none shadow-none border border-primary/50 bg-primary/5">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-[11px] font-bold uppercase tracking-wider text-primary">
							Our Platform Share (Revenue)
						</CardTitle>
						<div className="h-7 w-7 bg-primary text-primary-foreground flex items-center justify-center rounded-none shadow-none">
							<Coins className="h-4 w-4" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold tracking-tight text-primary font-mono">
							{formatAmount(platformShare, activeCurrency)}
						</div>
						<p className="text-[11px] text-muted-foreground mt-1">
							Company fee retained from organizers
						</p>
						<div className="mt-3 pt-2 border-t border-primary/20 flex justify-between items-center text-xs">
							<span className="text-muted-foreground">Effective take</span>
							<span className="font-bold text-primary text-xs">
								{grossVolume > 0 ? `${((platformShare / grossVolume) * 100).toFixed(1)}%` : "5.0%"}
							</span>
						</div>
					</CardContent>
				</Card>

				{/* 3. Organizers' Net Share */}
				<Card className="rounded-none shadow-none border border-border bg-card">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
							Organizers' Net Share
						</CardTitle>
						<div className="h-7 w-7 bg-blue-500/10 text-blue-600 flex items-center justify-center rounded-none shadow-none">
							<Building2 className="h-4 w-4" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold tracking-tight text-foreground font-mono">
							{formatAmount(organizerShare, activeCurrency)}
						</div>
						<p className="text-[11px] text-muted-foreground mt-1">
							Net earnings due to event hosts
						</p>
						<div className="mt-3 pt-2 border-t border-border flex justify-between items-center text-xs">
							<Link
								href="/super/organizers"
								className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
							>
								View organizers
								<ArrowUpRight className="h-3 w-3" />
							</Link>
						</div>
					</CardContent>
				</Card>

				{/* 4. Total Wallet Float / Escrow Held */}
				<Card className="rounded-none shadow-none border border-border bg-card">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
							Active Wallet Float
						</CardTitle>
						<div className="h-7 w-7 bg-purple-500/10 text-purple-600 flex items-center justify-center rounded-none shadow-none">
							<Wallet className="h-4 w-4" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold tracking-tight text-foreground font-mono">
							{formatAmount(walletFloat, activeCurrency)}
						</div>
						<p className="text-[11px] text-muted-foreground mt-1">
							Balances held across organizer wallets
						</p>
						<div className="mt-3 pt-2 border-t border-border flex justify-between items-center text-xs">
							<Link
								href="/super/wallets"
								className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
							>
								Wallets oversight
								<ArrowUpRight className="h-3 w-3" />
							</Link>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Status Grid - Flat & Tabular */}
			<div className="grid grid-cols-2 sm:grid-cols-5 border border-border divide-x divide-y sm:divide-y-0 divide-border rounded-none shadow-none bg-card">
				<div className="p-3">
					<span className="text-[10px] uppercase font-bold text-muted-foreground block">
						Live Ongoing
					</span>
					<span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
						{stats.eventsByStatus.ongoing}
					</span>
				</div>
				<div className="p-3">
					<span className="text-[10px] uppercase font-bold text-muted-foreground block">
						Published
					</span>
					<span className="text-lg font-bold text-blue-600 dark:text-blue-400 font-mono mt-0.5 block">
						{stats.eventsByStatus.published}
					</span>
				</div>
				<div className="p-3">
					<span className="text-[10px] uppercase font-bold text-muted-foreground block">
						Ended
					</span>
					<span className="text-lg font-bold text-muted-foreground font-mono mt-0.5 block">
						{stats.eventsByStatus.ended}
					</span>
				</div>
				<div className="p-3">
					<span className="text-[10px] uppercase font-bold text-muted-foreground block">
						Drafts
					</span>
					<span className="text-lg font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5 block">
						{stats.eventsByStatus.draft}
					</span>
				</div>
				<div className="p-3">
					<span className="text-[10px] uppercase font-bold text-muted-foreground block">
						Cancelled / Delisted
					</span>
					<span className="text-lg font-bold text-rose-600 dark:text-rose-400 font-mono mt-0.5 block">
						{stats.eventsByStatus.cancelled}
					</span>
				</div>
			</div>

			{/* Middle Row: Ongoing Events with Our Share Breakdown & Platform Transactions */}
			<div className="grid gap-6 lg:grid-cols-12 rounded-none shadow-none">
				{/* Ongoing Events Monitor (7 cols) */}
				<Card className="lg:col-span-7 rounded-none shadow-none border border-border">
					<CardHeader className="flex flex-row items-center justify-between border-b border-border pb-3">
						<div>
							<CardTitle className="text-sm font-bold flex items-center gap-2">
								<Sparkles className="h-4 w-4 text-emerald-500" />
								Active / Ongoing Events & Revenue Breakdown
							</CardTitle>
							<CardDescription className="text-xs">
								Live events with Gross Volume vs Our Share vs Organizer Share
							</CardDescription>
						</div>
						<Button variant="ghost" size="sm" asChild className="text-xs rounded-none shadow-none">
							<Link href="/super/events?status=ongoing">View All</Link>
						</Button>
					</CardHeader>
					<CardContent className="p-0">
						{stats.ongoingEvents.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
								<Clock className="h-8 w-8 mb-2 opacity-40" />
								<p className="text-sm font-medium">No live events ongoing right now</p>
								<p className="text-xs mt-0.5">Events scheduled for today will appear here</p>
							</div>
						) : (
							<div className="divide-y divide-border">
								{stats.ongoingEvents.map((ev) => (
									<div
										key={ev.id}
										className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
									>
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2">
												<Badge
													variant="outline"
													className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[9px] uppercase font-bold rounded-none shadow-none"
												>
													Live Now
												</Badge>
												<span className="text-xs font-bold text-muted-foreground truncate">
													{ev.organization.name}
												</span>
											</div>
											<h4 className="text-sm font-bold text-foreground truncate mt-1">
												{ev.title}
											</h4>
											<div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
												{ev.venueName && <span>{ev.venueName}</span>}
												<span>{ev.ticketsSold} tickets sold</span>
											</div>
										</div>

										<div className="flex items-center gap-3 sm:flex-col sm:items-end shrink-0 text-xs">
											<div>
												<span className="text-muted-foreground mr-1.5">Gross:</span>
												<span className="font-bold text-foreground font-mono">
													{formatAmount(ev.grossRevenue, "GHS")}
												</span>
											</div>
											<div className="flex items-center gap-2">
												<span className="text-primary font-semibold font-mono">
													Our Share: {formatAmount(ev.ourShare, "GHS")}
												</span>
												<span className="text-muted-foreground font-mono">
													(Org: {formatAmount(ev.organizerShare, "GHS")})
												</span>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Recent Platform Transactions (5 cols) */}
				<Card className="lg:col-span-5 rounded-none shadow-none border border-border">
					<CardHeader className="flex flex-row items-center justify-between border-b border-border pb-3">
						<div>
							<CardTitle className="text-sm font-bold">Platform Activity & Fees</CardTitle>
							<CardDescription className="text-xs">
								Recent inflows and fee withholdings
							</CardDescription>
						</div>
						<Button variant="ghost" size="sm" asChild className="text-xs rounded-none shadow-none">
							<Link href="/super/wallets">Wallets</Link>
						</Button>
					</CardHeader>
					<CardContent className="p-0">
						{stats.recentTransactions.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
								<Wallet className="h-8 w-8 mb-2 opacity-40" />
								<p className="text-sm font-medium">No recent transactions recorded</p>
							</div>
						) : (
							<div className="divide-y divide-border">
								{stats.recentTransactions.map((tx) => {
									const isCredit = tx.type === "credit";
									return (
										<div
											key={tx.id}
											className="p-3.5 flex items-center justify-between gap-3 text-xs"
										>
											<div className="min-w-0 flex-1">
												<p className="font-bold text-foreground truncate">
													{tx.organizationName}
												</p>
												<p className="text-[11px] text-muted-foreground truncate capitalize">
													{tx.category.replace("_", " ")} • {new Date(tx.createdAt).toLocaleDateString()}
												</p>
											</div>
											<div className="text-right shrink-0">
												<span
													className={`font-bold font-mono ${
														isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
													}`}
												>
													{isCredit ? "+" : "-"}{formatAmount(tx.amount, tx.currency)}
												</span>
												{tx.feeAmount > 0 && (
													<p className="text-[10px] text-primary font-semibold font-mono">
														Fee: {formatAmount(tx.feeAmount, tx.currency)}
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
