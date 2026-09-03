"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingCTA() {
	return (
		<section className="py-20 md:py-28 relative overflow-hidden">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-950 via-neutral-900 to-black border border-emerald-500/20 p-8 sm:p-14 lg:p-20 text-center shadow-2xl">
					{/* Glowing decorative ambient orbs */}
					<div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />
					<div className="absolute -bottom-32 -right-32 w-80 h-80 bg-emerald-600/20 rounded-full blur-[100px] pointer-events-none" />

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
						className="relative z-10 max-w-3xl mx-auto space-y-6"
					>
						{/* Pill */}
						<div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs sm:text-sm font-semibold tracking-tight">
							<Sparkles className="size-4 text-emerald-400" />
							<span>Start Selling in Under 5 Minutes</span>
						</div>

						{/* Headline */}
						<h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white leading-tight">
							Ready to Launch Your Next Event?
						</h2>

						{/* Description */}
						<p className="text-neutral-300 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
							Join top festival organizers, awards shows, and community creators who
							trust our infrastructure for digital ticketing, voting, and instant
							Mobile Money settlements.
						</p>

						{/* Actions */}
						<div className="flex flex-wrap items-center justify-center gap-4 pt-4">
							<Link href="/register">
								<Button
									size="lg"
									className="rounded-full px-8 h-12 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold text-sm tracking-wide gap-2 shadow-lg hover:shadow-emerald-500/25 transition-all"
								>
									<span>Create Event for Free</span>
									<ArrowRight className="size-4" />
								</Button>
							</Link>

							<Link href="/events">
								<Button
									variant="outline"
									size="lg"
									className="rounded-full px-8 h-12 border-neutral-700 bg-neutral-900/50 hover:bg-neutral-800 text-white font-bold text-sm tracking-wide transition-all"
								>
									Explore Events
								</Button>
							</Link>
						</div>

						{/* Guarantees */}
						<div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-400 font-medium">
							<div className="flex items-center gap-1.5">
								<CheckCircle2 className="size-4 text-emerald-400" />
								<span>Zero Setup Costs</span>
							</div>
							<div className="flex items-center gap-1.5">
								<CheckCircle2 className="size-4 text-emerald-400" />
								<span>Instant MoMo &amp; Card Settlements</span>
							</div>
							<div className="flex items-center gap-1.5">
								<CheckCircle2 className="size-4 text-emerald-400" />
								<span>24/7 Dedicated Support</span>
							</div>
						</div>
					</motion.div>
				</div>
			</div>
		</section>
	);
}
