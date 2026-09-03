"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Infinity as InfinityIcon, ArrowRight } from "lucide-react";
import { Section } from "../Section";

const FEATURES = [
	"Unlimited African events",
	"Unlimited digital QR passes",
	"Web & USSD (*928#) live voting",
	"MTN, Telecel, AT Mobile Money",
	"Visa, Mastercard & bank transfers",
	"Real-time event & voting analytics",
	"Gate crew & scanner permissions",
	"Instant organizer wallet payouts",
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
					Free to Start,{" "}
					<span className="text-white/95">Pay As You Grow</span>
				</h2>

				<p className="text-white/90 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
					Zero monthly subscription fees. No upfront charges. Only pay when you make sales across Africa.
				</p>
			</div>

			{/* Main Pricing Card (Preline Clean Style: rounded-xl, 1px border, NO shadows) */}
			<div className="max-w-4xl mx-auto">
				<div className="relative bg-card text-card-foreground border border-border rounded-xl overflow-hidden shadow-none p-6 sm:p-10">
					<div className="space-y-8">
						<div className="flex flex-col md:flex-row gap-8 items-start">
							{/* Left: Rate Info */}
							<div className="basis-2/5 space-y-3">
								<Badge className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-md border border-primary/30 shadow-none">
									<InfinityIcon className="size-3.5 text-primary" />
									Pay As You Earn
								</Badge>

								<div className="space-y-1.5">
									<div className="flex items-baseline gap-2">
										<span className="text-5xl sm:text-6xl font-black tracking-tight text-foreground font-millik">
											5
										</span>
										<span className="text-3xl sm:text-4xl font-black text-primary">
											%
										</span>
									</div>
									<p className="text-base font-bold text-foreground">
										per successful transaction
									</p>
									<p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
										You keep{" "}
										<span className="text-base text-primary font-bold">
											95%
										</span>{" "}
										of every ticket sale and vote. We only earn when you succeed.
									</p>
								</div>
							</div>

							{/* Right: Features List */}
							<div className="flex-1 space-y-4">
								<h3 className="font-bold text-base text-foreground">
									Everything included:
								</h3>
								<ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									{FEATURES.map((feature) => (
										<li
											key={feature}
											className="flex items-center gap-2.5 text-xs sm:text-sm text-foreground/90 font-medium"
										>
											<div className="size-4 rounded-md bg-primary/15 text-primary flex items-center justify-center shrink-0">
												<Check className="size-2.5" />
											</div>
											<span>{feature}</span>
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
