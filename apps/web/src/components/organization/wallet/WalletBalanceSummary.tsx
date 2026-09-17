"use client";
// src/components/organization/wallet/WalletBalanceSummary.tsx

import { SHARED_FINANCIAL_STATS, StatCard, statIcons } from "@/components/event/core/EventStats";
import { FextivaLogo } from "@/components/shared/FextivaLogo";

interface WalletBalanceSummaryProps {
	readonly organizationId: string;
	readonly availableBalance?: number;
	readonly pendingBalance?: number;
	readonly totalRevenue?: number;
	readonly totalWithdrawn?: number;
	readonly currency?: string;
	readonly isLocked?: boolean;
}

export function WalletBalanceSummary({
	availableBalance = 0,
	pendingBalance = 0,
	totalRevenue = 0,
	totalWithdrawn = 0,
	currency = "GHS",
	isLocked = false,
}: WalletBalanceSummaryProps) {
	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{/* 1. Available Balance */}
			<StatCard
				label={SHARED_FINANCIAL_STATS.availableBalance.label}
				value={`${currency} ${availableBalance.toFixed(2)}`}
				glowColor="primary"
				watermarkNode={<FextivaLogo showWordmark={false} className="size-14 sm:size-16" />}
				description={isLocked ? "Payouts suspended (Frozen)" : "Ready for withdrawal / payout"}
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
				description="Over time"
			/>
		</div>
	);
}
