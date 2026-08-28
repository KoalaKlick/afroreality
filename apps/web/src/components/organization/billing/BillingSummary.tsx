// src/components/organization/billing/BillingSummary.tsx
import { CreditCard, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/status-badge";
import { cn } from "@/lib/utils";

interface BillingSummaryProps {
	readonly currentPlan: string;
	readonly communicationCredits: number;
	readonly className?: string;
}

const planLabels: Record<string, string> = {
	essential: "Essential Plan",
	pro: "Pro Plan",
	enterprise: "Enterprise Plan",
};

export function BillingSummary({
	currentPlan,
	communicationCredits,
	className,
}: BillingSummaryProps) {
	return (
		<div className={cn("grid gap-4 sm:grid-cols-2", className)}>
			<Card>
				<CardHeader>
					<CardTitle className="text-base flex items-center gap-2">
						<CreditCard className="size-4 text-primary" />
						Current Subscription
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-1">
					<div className="flex items-center gap-2">
						<span className="text-2xl font-bold capitalize">
							{planLabels[currentPlan] ?? `${currentPlan} Plan`}
						</span>
						<StatusBadge variant="active" text="Active" />
					</div>
					<p className="text-xs text-muted-foreground">
						Pay-as-you-go — no subscription fees, no hidden charges.
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-base flex items-center gap-2">
						<Sparkles className="size-4 text-amber-500" />
						Communication Credits
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-1">
					<div className="text-2xl font-bold">
						{Number(communicationCredits).toFixed(0)} Credits
					</div>
					<p className="text-xs text-muted-foreground">
						Used for SMS & WhatsApp ticket delivery. Email is always free.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
