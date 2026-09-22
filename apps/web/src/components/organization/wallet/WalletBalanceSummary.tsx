"use client";
// src/components/organization/wallet/WalletBalanceSummary.tsx

import { SHARED_FINANCIAL_STATS, StatCard, statIcons } from "@/components/event/core/EventStats";

interface WalletBalanceSummaryProps {
	readonly organizationId: string;
	readonly availableBalance?: number;
	readonly ledgerBalance?: number;
	readonly pendingBalance?: number;
	readonly pendingDebits?: number;
	readonly totalRevenue?: number;
	readonly totalWithdrawn?: number;
	readonly currency?: string;
	readonly isLocked?: boolean;
}

export function WalletBalanceSummary({
	availableBalance = 0,
	ledgerBalance,
	pendingBalance = 0,
	pendingDebits = 0,
	totalRevenue = 0,
	totalWithdrawn = 0,
	currency = "GHS",
	isLocked = false,
}: WalletBalanceSummaryProps) {
	const balanceIcon = currency === "EUR" ? statIcons.euro : statIcons.cedi;

	const balanceDescription = isLocked
		? "Payouts suspended (Frozen)"
		: pendingDebits > 0
			? `Ready to withdraw • ${currency} ${pendingDebits.toFixed(2)} in progress`
			: ledgerBalance !== undefined && Math.abs(ledgerBalance - availableBalance) > 0.009
				? `Ready to withdraw • Ledger: ${currency} ${ledgerBalance.toFixed(2)}`
				: "Ready for withdrawal / payout";

	const totalPayoutsDescription = pendingDebits > 0
		? `${currency} ${totalWithdrawn.toFixed(2)} completed • ${currency} ${pendingDebits.toFixed(2)} in progress`
		: "Over time";

	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{/* 1. Available Balance */}
			<StatCard
				label={SHARED_FINANCIAL_STATS.availableBalance.label}
				value={`${currency} ${availableBalance.toFixed(2)}`}
				iconSrc={balanceIcon}
				description={balanceDescription}
			/>

			{/* 2. Pending Clearance */}
			<StatCard
				label={SHARED_FINANCIAL_STATS.pendingClearance.label}
				value={`${currency} ${pendingBalance.toFixed(2)}`}
				iconSrc={SHARED_FINANCIAL_STATS.pendingClearance.iconSrc}
				description="Processing / clearance"
			/>

			{/* 3. Total Inflows */}
			<StatCard
				label={SHARED_FINANCIAL_STATS.inflows.label}
				value={`${currency} ${totalRevenue.toFixed(2)}`}
				iconSrc={SHARED_FINANCIAL_STATS.inflows.iconSrc}
				description="Over time"
			/>

			{/* 4. Total Payouts */}
			<StatCard
				label={SHARED_FINANCIAL_STATS.totalPayouts.label}
				value={`${currency} ${totalWithdrawn.toFixed(2)}`}
				iconSrc={SHARED_FINANCIAL_STATS.totalPayouts.iconSrc}
				description={totalPayoutsDescription}
			/>
		</div>
	);
}
