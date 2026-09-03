"use client";

import { motion } from "motion/react";
import { Check, Sparkles, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const PRICING_PLANS = [
	{
		name: "Free Events",
		description: "Ideal for community workshops, meetups, webinars, and free entry gatherings.",
		fee: "0%",
		subtext: "Free forever, no credit card required",
		features: [
			"Unlimited attendee registrations",
			"Digital QR Code passes via email",
			"Mobile camera scanner gate app",
			"Public event page & attendee export",
			"Standard email support",
		],
		buttonText: "Create Free Event",
		href: "/register",
		highlighted: false,
	},
	{
		name: "Ticketed Events",
		description: "For concerts, festivals, parties, conferences, and revenue-generating experiences.",
		fee: "3.5%",
		subtext: "+ GHS 0.50 per paid ticket sold",
		features: [
			"All Free tier features included",
			"MTN MoMo, Telecel, AT & Card payments",
			"Multiple ticket tiers (VIP, Tables, Early Bird)",
			"Discount promo codes & group deals",
			"Automated bank & MoMo balance payouts",
			"Real-time analytics & transaction audit",
		],
		buttonText: "Start Selling Tickets",
		href: "/register",
		highlighted: true,
	},
	{
		name: "Awards & Voting",
		description: "For beauty pageants, music honors, campus competitions, and community polls.",
		fee: "Custom / 5%",
		subtext: "Per paid vote or nomination fee",
		features: [
			"Unlimited voting categories & nominees",
			"USSD Dial support (*928#) for offline fans",
			"Real-time fraud detection & vote audits",
			"Public nominations portal with entry fees",
			"Custom voting window schedules",
			"Dedicated account manager & live support",
		],
		buttonText: "Launch Voting Event",
		href: "/register",
		highlighted: false,
	},
];

export function LandingPricing() {
	return (
		<section id="pricing" className="py-20 md:py-28 bg-muted/20 border-y border-border/50 relative">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
					<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
						<Zap className="size-3.5" />
						<span>Simple &amp; Transparent</span>
					</div>
					<h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-foreground">
						No Upfront Fees. Pay As You Grow.
					</h2>
					<p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
						We only earn when you succeed. No monthly subscriptions, no setup charges,
						and no surprise fees.
					</p>
				</div>

				{/* Pricing Cards Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
					{PRICING_PLANS.map((plan, idx) => (
						<motion.div
							key={plan.name}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.45, delay: idx * 0.08 }}
							className={`relative rounded-3xl border p-8 flex flex-col justify-between transition-all duration-300 ${
								plan.highlighted
									? "bg-card border-emerald-500 shadow-xl shadow-emerald-500/10 scale-100 lg:-translate-y-2 ring-1 ring-emerald-500"
									: "bg-card/70 border-border/60 shadow-xs hover:shadow-lg"
							}`}
						>
							{plan.highlighted && (
								<div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-emerald-600 text-white font-extrabold text-[11px] uppercase tracking-wider shadow-sm">
									Most Popular
								</div>
							)}

							<div>
								{/* Plan Header */}
								<div className="space-y-2">
									<h3 className="text-xl font-bold tracking-tight text-foreground">
										{plan.name}
									</h3>
									<p className="text-xs text-muted-foreground leading-relaxed min-h-[36px]">
										{plan.description}
									</p>
								</div>

								{/* Price Rate */}
								<div className="my-6 pb-6 border-b border-border/50">
									<div className="flex items-baseline gap-1">
										<span className="text-4xl font-black tracking-tight text-foreground">
											{plan.fee}
										</span>
									</div>
									<p className="text-xs text-muted-foreground mt-1 font-medium">
										{plan.subtext}
									</p>
								</div>

								{/* Features List */}
								<ul className="space-y-3 text-xs sm:text-sm text-muted-foreground">
									{plan.features.map((feat) => (
										<li key={feat} className="flex items-start gap-2.5">
											<Check className="size-4 shrink-0 text-emerald-500 mt-0.5" />
											<span className="leading-snug">{feat}</span>
										</li>
									))}
								</ul>
							</div>

							{/* Button CTA */}
							<div className="mt-8 pt-6 border-t border-border/40">
								<Link href={plan.href} className="w-full block">
									<Button
										className={`w-full rounded-full py-5 font-bold text-sm tracking-wide gap-2 transition-all ${
											plan.highlighted
												? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg"
												: "variant-outline"
										}`}
										variant={plan.highlighted ? "default" : "outline"}
									>
										<span>{plan.buttonText}</span>
										<ArrowRight className="size-4" />
									</Button>
								</Link>
							</div>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
