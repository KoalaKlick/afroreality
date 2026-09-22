// src/components/organization/billing/PlatformFeesCard.tsx
import { CreditCard, Shield } from "lucide-react";
import { CASHOUT_CONFIG, PLATFORM_FEES } from "@/lib/constants/pricing";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export interface FeeRateDisplayItem {
	percentage: number;
	fixedAmount: number;
	isCustomOverride?: boolean;
	currency?: string;
	minFee?: number | null;
	maxFee?: number | null;
}

interface PlatformFeesCardProps {
	readonly isVerifiedPartner?: boolean;
	readonly className?: string;
	readonly fees?: Record<string, FeeRateDisplayItem>;
}

export function PlatformFeesCard({
	isVerifiedPartner,
	className,
	fees,
}: PlatformFeesCardProps) {
	const feeChannels = [
		{
			key: "vote",
			label: "Votes",
			percentage: fees?.vote ? fees.vote.percentage * 100 : PLATFORM_FEES.vote.percentage * 100,
			fixed: fees?.vote ? fees.vote.fixedAmount : PLATFORM_FEES.vote.fixed,
			isCustom: fees?.vote?.isCustomOverride,
		},
		{
			key: "ticket",
			label: "Tickets",
			percentage: fees?.ticket ? fees.ticket.percentage * 100 : PLATFORM_FEES.ticket.percentage * 100,
			fixed: fees?.ticket ? fees.ticket.fixedAmount : PLATFORM_FEES.ticket.fixed,
			isCustom: fees?.ticket?.isCustomOverride,
		},
		{
			key: "nomination",
			label: "Nominations",
			percentage: fees?.nomination ? fees.nomination.percentage * 100 : PLATFORM_FEES.nomination.percentage * 100,
			fixed: fees?.nomination ? fees.nomination.fixedAmount : PLATFORM_FEES.nomination.fixed,
			isCustom: fees?.nomination?.isCustomOverride,
		},
	];

	const hasAnyCustomOverride = feeChannels.some((f) => f.isCustom);

	return (
		<Card className={cn("bg-card p-6", className)}>
			<div className="flex items-center gap-2 mb-6">
				<CreditCard className="w-5 h-5 text-primary-600" />
				<h3 className="font-semibold text-lg">Platform Fees</h3>
				{hasAnyCustomOverride ? (
					<span className="ml-auto inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
						<Shield className="w-3 h-3" />
						Custom Negotiated Rates Active
					</span>
				) : isVerifiedPartner ? (
					<span className="ml-auto inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFCD00]/10 text-[#b8960a] text-[10px] font-bold uppercase tracking-wider">
						<Shield className="w-3 h-3" />
						Verified Partner
					</span>
				) : null}
			</div>

			<div className="rounded-md border border-primary-200 bg-primary/3 p-5">
				<p className="text-2xl font-black mb-1">
					Free
					<span className="text-xs font-normal text-muted-foreground ml-1">
						/ no subscription
					</span>
				</p>
				<p className="text-xs text-muted-foreground mb-4">
					Pay-as-you-go — we only earn when you do
				</p>

				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
					{feeChannels.map((channel) => (
						<div key={channel.key} className="rounded-lg bg-background/60 border p-3 relative">
							<div className="flex items-center justify-between mb-1">
								<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
									{channel.label}
								</p>
								{channel.isCustom && (
									<span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
										Custom
									</span>
								)}
							</div>
							<p className="text-sm font-bold text-[#009A44]">
								{Number(channel.percentage.toFixed(1))}%{" "}
								{channel.fixed > 0 ? `+ GHS ${Number(channel.fixed).toFixed(2)}` : ""}
							</p>
						</div>
					))}
				</div>

				<div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
					<span className="text-[#009A44] text-xs font-bold">✓</span>
					Payouts settle {CASHOUT_CONFIG.settlementLabel.toLowerCase()} via your
					payout account.
				</div>
			</div>
		</Card>
	);
}
