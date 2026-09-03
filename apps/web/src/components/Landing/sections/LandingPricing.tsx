"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Infinity as InfinityIcon, ArrowRight } from "lucide-react";
import { Section } from "../Section";

const PRICING_PROMISES = [
	"Zero setup fees or monthly subscriptions",
	"Free events remain 100% free with unlimited attendees",
	"Automated wallet settlement on every transaction",
	"Direct payouts to Mobile Money & local bank accounts",
	"Transparent breakdown with zero hidden maintenance charges",
	"No lock-in contracts — withdraw your funds anytime",
];

export function LandingPricing() {
	return (
		<Section
			id="pricing"
			class="mt-20 md:mt-24 py-12 sm:py-16 bg-primary text-primary-foreground shadow-none"
			content-class="space-y-8 md:space-y-12"
		>
			{/* Section Header */}
			<div className="mx-auto text-center space-y-3 max-w-2xl">
				<h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white font-millik">
					Simple, Transparent{" "}
					<span className="text-white/95">Pay As You Go</span>
				</h2>

				<p className="text-white/90 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
					No monthly subscriptions. No hidden fees. Free events stay free, and you only pay when you make sales.
				</p>
			</div>

			{/* Main Pricing Card */}
			<div className="max-w-4xl mx-auto">
				<div className="relative bg-card text-card-foreground border border-border rounded-xl overflow-hidden shadow-none p-6 sm:p-10">
					<div className="space-y-8">
						<div className="flex flex-col md:flex-row gap-8 items-start">
							{/* Left: Rate Info */}
							<div className="basis-2/5 space-y-4">
								<Badge className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-md border border-primary/30 shadow-none">
									<InfinityIcon className="size-3.5 text-primary" />
									Pure Pay-As-You-Go
								</Badge>

								<div className="space-y-2">
									<h3 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground font-millik">
										Pay As You Earn
									</h3>
									<p className="text-sm font-semibold text-primary">
										Zero upfront cost. Zero monthly fees.
									</p>
									<p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
										Host free events to advertise your brand at no cost. For ticketed events and voting, we only take a small fee on successful sales. Your money goes straight to your wallet with clear, instant payouts.
									</p>
								</div>
							</div>

							{/* Right: Pricing Promises */}
							<div className="flex-1 space-y-4">
								<h3 className="font-bold text-base text-foreground">
									Our pricing commitments:
								</h3>
								<ul className="space-y-3">
									{PRICING_PROMISES.map((promise) => (
										<li
											key={promise}
											className="flex items-center gap-2.5 text-xs sm:text-sm text-foreground/90 font-medium"
										>
											<div className="size-4 rounded-md bg-primary/15 text-primary flex items-center justify-center shrink-0">
												<Check className="size-2.5" />
											</div>
											<span>{promise}</span>
										</li>
									))}
								</ul>
							</div>
						</div>

						{/* Action Button */}
						<div className="pt-5 border-t border-border">
							<Link href="/register" className="inline-block w-full sm:w-auto">
								<Button
									className="w-full sm:w-auto h-11 px-6 text-sm font-semibold bg-neutral-950 hover:bg-black text-white rounded-lg shadow-none"
								>
									Get Started Free
									<ArrowRight className="size-4 ml-2" />
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</div>
		</Section>
	);
}
