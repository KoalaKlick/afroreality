// src/components/organization/billing/PlatformFeesCard.tsx
import { CreditCard, Shield } from "lucide-react";
import { CASHOUT_CONFIG, PLATFORM_FEES } from "@/lib/constants/pricing";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface PlatformFeesCardProps {
	readonly isVerifiedPartner?: boolean;
	readonly className?: string;
}

export function PlatformFeesCard({
	isVerifiedPartner,
	className,
}: PlatformFeesCardProps) {
	return (
		<Card className={cn("bg-card p-6", className)}>
			<div className="flex items-center gap-2 mb-6">
				<CreditCard className="w-5 h-5 text-[#009A44]" />
				<h3 className="font-semibold text-lg">Platform Fees</h3>
				{isVerifiedPartner && (
					<span className="ml-auto inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFCD00]/10 text-[#b8960a] text-[10px] font-bold uppercase tracking-wider">
						<Shield className="w-3 h-3" />
						Verified Partner
					</span>
				)}
			</div>

			<div className="rounded-md border border-primary-200 bg-[#009A44]/3 p-5">
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
					{Object.entries(PLATFORM_FEES).map(([type, config]) => (
						<div key={type} className="rounded-lg bg-background/60 border p-3">
							<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
								{type === "vote"
									? "Votes"
									: type === "nomination"
										? "Nominations"
										: "Tickets"}
							</p>
							<p className="text-sm font-bold text-[#009A44]">
								{config.percentage * 100}%{" "}
								{config.fixed > 0 ? `+ GHS ${config.fixed}` : ""}
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
