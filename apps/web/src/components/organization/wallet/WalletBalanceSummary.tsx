"use client";
// src/components/organization/wallet/WalletBalanceSummary.tsx

import { StatCard, statIcons } from "@/components/event/core/EventStats";

interface WalletBalanceSummaryProps {
	readonly organizationId: string;
	readonly availableBalance?: number;
	readonly pendingBalance?: number;
	readonly totalRevenue?: number;
	readonly totalWithdrawn?: number;
	readonly currency?: string;
}

export function WalletBalanceSummary({
	availableBalance = 0,
	pendingBalance = 0,
	totalRevenue = 0,
	totalWithdrawn = 0,
	currency = "GHS",
}: WalletBalanceSummaryProps) {
	const balanceIcon = currency === "EUR" ? statIcons.euro : statIcons.cedi;

	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{/* 1. Available Balance */}
			<StatCard
				label="Available Balance"
				value={`${currency} ${availableBalance.toFixed(2)}`}
				iconSrc={balanceIcon}
			/>

			{/* 2. Pending Clearance */}
			<StatCard
				label="Pending Clearance"
				value={`${currency} ${pendingBalance.toFixed(2)}`}
				iconSrc={statIcons.ongoing}
			/>

			{/* 3. Total Inflows */}
			<StatCard
				label="Total Inflows"
				value={`${currency} ${totalRevenue.toFixed(2)}`}
				iconSrc={statIcons.analytics}
			/>

			{/* 4. Total Payouts */}
			<StatCard
				label="Total Payouts"
				value={`${currency} ${totalWithdrawn.toFixed(2)}`}
				iconSrc={statIcons.ticket}
			/>
		</div>
	);
}
