"use client";

import { motion } from "motion/react";
import {
	Ticket,
	Vote,
	Smartphone,
	Zap,
	QrCode,
	BarChart3,
	ShieldCheck,
	Sparkles,
	CreditCard,
	Users,
} from "lucide-react";

const FEATURES = [
	{
		title: "Flexible Ticketing & Tiers",
		description:
			"Build multi-tier passes (VIP, Early Bird, Group), set capacity limits, enforce purchase limits, and issue QR-coded digital passes instantly.",
		icon: Ticket,
		tag: "Ticketing",
		badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
		featured: true,
	},
	{
		title: "Live Voting & Public Nominations",
		description:
			"Host award ceremonies and talent hunts. Accept public nominations, approve candidates, and let fans vote via web and mobile with instant live results.",
		icon: Vote,
		tag: "E-Voting",
		badgeColor: "bg-purple-500/10 text-purple-600 border-purple-500/20",
		featured: false,
	},
	{
		title: "USSD Offline Ticketing (*928#)",
		description:
			"No smartphone or internet data needed. Your audience can dial a shortcode from any mobile phone to buy tickets or cast votes using Mobile Money.",
		icon: Smartphone,
		tag: "USSD Support",
		badgeColor: "bg-amber-500/10 text-amber-600 border-amber-500/20",
		featured: true,
	},
	{
		title: "Instant Paystack Settlements",
		description:
			"Direct integration with MTN MoMo, Telecel Cash, AT Money, and Cards. Funds settle quickly to your organizer balance with automated bank withdrawals.",
		icon: CreditCard,
		tag: "Fintech",
		badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/20",
		featured: false,
	},
	{
		title: "Fast QR Check-in & Gate Control",
		description:
			"Turn any smartphone into a gate scanner. Verify tickets in milliseconds, track real-time attendance, and eliminate gate fraud or double-entry.",
		icon: QrCode,
		tag: "Gate Control",
		badgeColor: "bg-teal-500/10 text-teal-600 border-teal-500/20",
		featured: false,
	},
	{
		title: "Real-time Analytics & Team Roles",
		description:
			"Collaborate with your team securely. Assign scanner, manager, and cashier permissions while tracking ticket velocity and voter demographics.",
		icon: BarChart3,
		tag: "Intelligence",
		badgeColor: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
		featured: false,
	},
];

export function LandingFeatures() {
	return (
		<section id="features" className="py-20 md:py-28 bg-muted/20 border-y border-border/50 relative">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
					<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
						<Sparkles className="size-3.5" />
						<span>Enterprise Infrastructure</span>
					</div>
					<h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-foreground">
						Engineered for High-Scale Events
					</h2>
					<p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
						From intimate community sessions to 50,000-person stadium festivals, our
						robust platform provides everything organizers and attendees need.
					</p>
				</div>

				{/* Bento Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
					{FEATURES.map((feature, idx) => {
						const Icon = feature.icon;
						return (
							<motion.div
								key={feature.title}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.45, delay: idx * 0.07 }}
								className="group relative rounded-3xl border border-border/60 bg-card p-6 sm:p-8 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
							>
								<div className="space-y-4">
									{/* Top Tag & Icon */}
									<div className="flex items-center justify-between">
										<div className="size-12 rounded-2xl bg-muted flex items-center justify-center text-foreground group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
											<Icon className="size-6" />
										</div>
										<span
											className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${feature.badgeColor}`}
										>
											{feature.tag}
										</span>
									</div>

									{/* Title & Description */}
									<div className="space-y-2 pt-2">
										<h3 className="text-xl font-bold tracking-tight text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
											{feature.title}
										</h3>
										<p className="text-sm text-muted-foreground leading-relaxed">
											{feature.description}
										</p>
									</div>
								</div>

								{/* Bottom Accent line */}
								<div className="mt-6 pt-4 border-t border-border/40 flex items-center gap-2 text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
									<ShieldCheck className="size-4 text-emerald-500" />
									<span>Production Tested &amp; Scalable</span>
								</div>
							</motion.div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
