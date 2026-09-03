"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import {
	Calendar,
	ArrowRight,
	Sparkles,
	ShieldCheck,
	QrCode,
	Vote,
	Smartphone,
	CheckCircle2,
	TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PROJ_NAME } from "@/lib/constants/branding";

interface LandingHeroProps {
	readonly stats?: {
		totalEvents?: number;
		totalOrganizers?: number;
		totalTicketsSold?: number;
		totalVotes?: number;
	};
}

export function LandingHero({ stats }: LandingHeroProps) {
	const totalEvents = stats?.totalEvents ?? 120;
	const totalTicketsSold = stats?.totalTicketsSold ?? 8500;
	const totalVotes = stats?.totalVotes ?? 24000;

	return (
		<section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
			{/* Ambient background glow & grid */}
			<div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
				<div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[400px] bg-gradient-to-tr from-emerald-500/15 via-amber-500/10 to-red-500/10 blur-[130px] rounded-full" />
				<div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-40 dark:opacity-10" />
			</div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
					{/* Left Column: Headlines & Call to Action */}
					<motion.div
						initial={{ opacity: 0, y: 24 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
						className="lg:col-span-7 space-y-6 text-center lg:text-left"
					>
						{/* Trust Pill */}
						<div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-semibold tracking-tight backdrop-blur-md">
							<Sparkles className="size-4 text-emerald-600 animate-pulse" />
							<span>The Ultimate African Event & Ticketing Platform</span>
						</div>

						{/* Main Title */}
						<h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-foreground leading-[1.05] uppercase">
							Create, Manage &amp;{" "}
							<span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 bg-clip-text text-transparent">
								Scale Events.
							</span>
						</h1>

						{/* Subheadline */}
						<p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
							Empower your festivals, awards, conferences, and community gatherings
							with frictionless ticket sales, real-time live voting, instant Mobile
							Money payouts, and offline USSD access across Africa.
						</p>

						{/* Actions */}
						<div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
							<Link href="/register">
								<Button
									size="lg"
									className="rounded-full px-7 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-wide text-sm shadow-md hover:shadow-xl transition-all duration-300 gap-2"
								>
									<span>Create an Event</span>
									<ArrowRight className="size-4" />
								</Button>
							</Link>

							<Link href="/events">
								<Button
									variant="outline"
									size="lg"
									className="rounded-full px-7 h-12 border-border/80 hover:bg-muted font-bold text-sm tracking-wide transition-all gap-2"
								>
									<Calendar className="size-4 text-primary" />
									<span>Explore Events</span>
								</Button>
							</Link>
						</div>

						{/* USSD and Trust Highlights */}
						<div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs text-muted-foreground">
							<div className="flex items-center gap-1.5 font-medium">
								<Smartphone className="size-4 text-emerald-600" />
								<span>USSD Dial Support (*928#)</span>
							</div>
							<div className="flex items-center gap-1.5 font-medium">
								<QrCode className="size-4 text-emerald-600" />
								<span>Fast QR Check-in</span>
							</div>
							<div className="flex items-center gap-1.5 font-medium">
								<ShieldCheck className="size-4 text-emerald-600" />
								<span>Verified Payouts</span>
							</div>
						</div>
					</motion.div>

					{/* Right Column: Dynamic Interactive Showcase Card */}
					<motion.div
						initial={{ opacity: 0, scale: 0.94 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.75, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
						className="lg:col-span-5 relative"
					>
						<div className="relative mx-auto max-w-md rounded-3xl border border-border/60 bg-card/75 backdrop-blur-xl p-5 sm:p-6 shadow-2xl transition-all duration-300 hover:shadow-emerald-500/10">
							{/* Floating live tag */}
							<div className="absolute -top-3.5 right-6 z-20">
								<Badge className="bg-emerald-500 text-white font-bold uppercase tracking-wider text-[11px] shadow-sm px-3 py-1 gap-1.5 border-0">
									<span className="size-2 rounded-full bg-white animate-ping" />
									Live Experience
								</Badge>
							</div>

							{/* Hero Visual Card Top */}
							<div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-border/40 shadow-inner">
								<Image
									src="/landing/hero-womam-1.webp"
									alt="Event showcase"
									fill
									priority
									className="object-cover transition-transform duration-700 hover:scale-105"
									sizes="(max-width: 768px) 100vw, 480px"
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

								<div className="absolute bottom-3 left-4 right-4 text-white">
									<p className="text-[11px] uppercase tracking-widest text-emerald-400 font-bold">
										Featured Festival &amp; Voting
									</p>
									<h4 className="text-lg font-black uppercase tracking-tight line-clamp-1">
										AfroBeat Heritage Awards &amp; Gala
									</h4>
								</div>
							</div>

							{/* Card Body & Feature Tickers */}
							<div className="mt-5 space-y-4">
								{/* Quick metrics grid */}
								<div className="grid grid-cols-2 gap-2.5">
									<div className="rounded-xl border border-border/50 bg-muted/30 p-3 flex flex-col">
										<span className="text-[11px] text-muted-foreground font-medium">
											Total Ticket Sales
										</span>
										<span className="text-lg font-bold text-foreground mt-0.5">
											{totalTicketsSold.toLocaleString()} tickets
										</span>
										<span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
											<TrendingUp className="size-3" /> +24% this week
										</span>
									</div>

									<div className="rounded-xl border border-border/50 bg-muted/30 p-3 flex flex-col">
										<span className="text-[11px] text-muted-foreground font-medium">
											Public Cast Votes
										</span>
										<span className="text-lg font-bold text-foreground mt-0.5">
											{totalVotes.toLocaleString()} votes
										</span>
										<span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
											<Vote className="size-3" /> USSD &amp; Web Live
										</span>
									</div>
								</div>

								{/* Interactive Pill Indicators */}
								<div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
									<div className="flex items-center gap-1.5 text-muted-foreground">
										<CheckCircle2 className="size-4 text-emerald-500" />
										<span>Paystack Instant Settlements</span>
									</div>
									<Link
										href="/events"
										className="font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
									>
										<span>View Details</span>
										<ArrowRight className="size-3" />
									</Link>
								</div>
							</div>
						</div>
					</motion.div>
				</div>

				{/* Platform Trust & Numbers Strip */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6, delay: 0.3 }}
					className="mt-20 pt-10 border-t border-border/60 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center"
				>
					<div className="space-y-1">
						<p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
							{totalEvents}+
						</p>
						<p className="text-xs sm:text-sm text-muted-foreground font-medium">
							Active Public Events
						</p>
					</div>
					<div className="space-y-1">
						<p className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
							{totalTicketsSold.toLocaleString()}+
						</p>
						<p className="text-xs sm:text-sm text-muted-foreground font-medium">
							Tickets Checked-In
						</p>
					</div>
					<div className="space-y-1">
						<p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
							{totalVotes.toLocaleString()}+
						</p>
						<p className="text-xs sm:text-sm text-muted-foreground font-medium">
							Live Audience Votes
						</p>
					</div>
					<div className="space-y-1">
						<p className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
							99.9%
						</p>
						<p className="text-xs sm:text-sm text-muted-foreground font-medium">
							Transaction Reliability
						</p>
					</div>
				</motion.div>
			</div>
		</section>
	);
}
