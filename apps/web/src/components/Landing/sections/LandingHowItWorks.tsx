"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
	UserCheck,
	CalendarPlus,
	Share2,
	Wallet,
	QrCode,
	CreditCard,
	Search,
	Sparkles,
	ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

const ORGANIZER_STEPS = [
	{
		step: "01",
		title: "Create Your Event & Tiers",
		description:
			"Set up your event in minutes. Upload fliers, define ticket categories (VIP, Early Bird, Table), or configure live voting nominee categories.",
		icon: CalendarPlus,
	},
	{
		step: "02",
		title: "Publish & Activate USSD",
		description:
			"Instantly receive your dedicated public page link and optional offline USSD shortcode for broad grassroots reach across Africa.",
		icon: Share2,
	},
	{
		step: "03",
		title: "Sell Tickets & Tally Votes",
		description:
			"Accept payments via MTN MoMo, Telecel Cash, AT Money, and Cards with automated receipt issuance and live vote leaderboard updates.",
		icon: CreditCard,
	},
	{
		step: "04",
		title: "Fast Gate Scans & Payouts",
		description:
			"Use our camera scanner to validate QR passes in under a second. Withdraw your earnings straight to your bank account with zero delays.",
		icon: Wallet,
	},
];

const ATTENDEE_STEPS = [
	{
		step: "01",
		title: "Discover Local & Pan-African Events",
		description:
			"Search by city, category, or favorite organizers to explore trending concerts, cultural galas, awards, and conferences.",
		icon: Search,
	},
	{
		step: "02",
		title: "Select Tickets or Cast Votes",
		description:
			"Choose your preferred ticket tiers or pick your favorite nominee to support with transparent pricing and no hidden surcharges.",
		icon: Sparkles,
	},
	{
		step: "03",
		title: "Pay Easily Online or Offline",
		description:
			"Check out securely in seconds using Mobile Money, Debit/Credit cards, or dial the event's USSD shortcode from any mobile phone.",
		icon: CreditCard,
	},
	{
		step: "04",
		title: "Instant Digital Pass & Gate Entry",
		description:
			"Receive your digital QR pass via email and download immediately. Flash your ticket at the entrance for instant check-in.",
		icon: QrCode,
	},
];

export function LandingHowItWorks() {
	const [activeRole, setActiveRole] = useState<"organizers" | "attendees">("organizers");

	const currentSteps = activeRole === "organizers" ? ORGANIZER_STEPS : ATTENDEE_STEPS;

	return (
		<section id="how-it-works" className="py-20 md:py-28 relative">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Section Header */}
				<div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
					<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
						<span>Frictionless Journey</span>
					</div>
					<h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-foreground">
						How It Works
					</h2>
					<p className="text-muted-foreground text-sm sm:text-base">
						A streamlined flow crafted for both ambitious event creators and passionate attendees.
					</p>

					{/* Role Switcher Tabs */}
					<div className="inline-flex items-center p-1.5 rounded-2xl bg-muted border border-border/60 mt-4">
						<button
							type="button"
							onClick={() => setActiveRole("organizers")}
							className={cn(
								"px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold tracking-tight transition-all duration-200",
								activeRole === "organizers"
									? "bg-card text-foreground shadow-xs"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							For Organizers &amp; Creators
						</button>
						<button
							type="button"
							onClick={() => setActiveRole("attendees")}
							className={cn(
								"px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold tracking-tight transition-all duration-200",
								activeRole === "attendees"
									? "bg-card text-foreground shadow-xs"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							For Attendees &amp; Voters
						</button>
					</div>
				</div>

				{/* Steps Timeline Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
					{currentSteps.map((step, idx) => {
						const Icon = step.icon;
						return (
							<motion.div
								key={step.step}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.45, delay: idx * 0.08 }}
								className="relative flex flex-col justify-between rounded-3xl border border-border/60 bg-card p-6 sm:p-7 shadow-xs hover:shadow-lg transition-all duration-300"
							>
								{/* Step Number Top */}
								<div className="flex items-center justify-between mb-5">
									<div className="size-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black text-sm">
										<Icon className="size-5" />
									</div>
									<span className="text-2xl font-black text-muted-foreground/40">
										{step.step}
									</span>
								</div>

								{/* Title & Description */}
								<div className="space-y-2 flex-1">
									<h3 className="text-lg font-bold tracking-tight text-foreground">
										{step.title}
									</h3>
									<p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
										{step.description}
									</p>
								</div>
							</motion.div>
						);
					})}
				</div>

				{/* Bottom Action */}
				<div className="text-center mt-12">
					<Link href={activeRole === "organizers" ? "/register" : "/events"}>
						<Button
							size="lg"
							className="rounded-full px-8 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm tracking-wide gap-2 shadow-md hover:shadow-xl transition-all"
						>
							<span>{activeRole === "organizers" ? "Get Started as an Organizer" : "Browse Upcoming Events"}</span>
							<ArrowRight className="size-4" />
						</Button>
					</Link>
				</div>
			</div>
		</section>
	);
}
