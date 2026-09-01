// src/components/organization/billing/CommunicationCreditsCard.tsx
import { ArrowRight, MessageSquare, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMMUNICATION_CREDITS } from "@/lib/constants/pricing";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface CommunicationCreditsCardProps {
	readonly balance: number;
	readonly className?: string;
}

export function CommunicationCreditsCard({
	balance,
	className,
}: CommunicationCreditsCardProps) {
	return (
		<Card className={cn("bg-card p-6 @container", className)}>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<MessageSquare className="w-5 h-5 text-[#CE1126]" />
					<h3 className="font-semibold">Communication Credits</h3>
				</div>
				<span className="text-2xl font-black bg- text-[#009A44]">
					{balance.toFixed(0)}
				</span>
			</div>

			<div className="grid grid-cols-1 @lg:grid-cols-2 @2xl:grid-cols-4 gap-3">
				{Object.entries(COMMUNICATION_CREDITS.perMessage).map(
					([channel, cost]) => (
						<div
							key={channel}
							className="rounded-md bg-muted/50 p-3 text-center"
						>
							<p className="text-xs text-muted-foreground capitalize">
								{channel}
							</p>
							<p className="text-sm font-bold mt-0.5">
								{cost > 0 ? `${cost} credit/msg` : "Free"}
							</p>
						</div>
					),
				)}
			</div>

			<div className="space-y-2 mt-6">
				<div className="flex items-center gap-2 mb-3">
					<Package className="w-4 h-4 text-[#FFCD00]" />
					<h4 className="text-sm font-semibold">Purchase Bundles</h4>
				</div>
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
					{COMMUNICATION_CREDITS.bundles.map((bundle) => (
						<button
							key={bundle.id}
							type="button"
							className={cn(
								"relative flex flex-col items-center p-3 rounded-lg border-2 transition-all hover:shadow-sm",
								bundle.popular
									? "border-[#FFCD00] bg-[#FFCD00]/5"
									: "border-muted hover:border-muted-foreground/30",
							)}
							disabled
						>
							{bundle.popular && (
								<span className="absolute -top-2 px-1.5 py-0.5 rounded-full bg-[#FFCD00] text-[#1a1a2e] text-[8px] font-bold uppercase tracking-wider">
									Popular
								</span>
							)}
							<p className="text-lg font-black">{bundle.credits}</p>
							<p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
								credits
							</p>
							<p className="text-sm font-bold text-[#009A44] mt-1">
								GHS {bundle.price}
							</p>
						</button>
					))}
				</div>
			</div>

			<Button variant="outline" size="sm" className="w-full mt-4" disabled>
				<ArrowRight className="w-4 h-4 mr-2" />
				Purchase Credits (Coming Soon)
			</Button>
		</Card>
	);
}
