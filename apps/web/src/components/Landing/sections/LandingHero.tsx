"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Play, Star, TicketIcon, VoteIcon } from "lucide-react";
import { Section } from "../Section";
import DrippingSvg from "@/assets/landing/dripping.svg";

const AVATAR_INITIALS = [
	{ label: "KG", bg: "bg-secondary-500 text-white" },
	{ label: "AM", bg: "bg-indigo-500 text-white" },
	{ label: "TD", bg: "bg-tertiary-600 text-white" },
	{ label: "+8k", bg: "bg-primary-600 text-white" },
];

export function LandingHero() {
	return (
		<Section
			className="relative pt-8 sm:pt-14 pb-0 overflow-visible"
			contentClassName="relative space-y-6 sm:space-y-8 overflow-visible"
		>
			{/* ── Headline ── */}
			<div className="relative z-20 text-center space-y-4 max-w-3xl pt-10 mx-auto">
				<h1 className="font-millik text-[2rem] sm:text-4xl md:text-5xl leading-[1.05] tracking-tight">
					<span className="bg-gradient-to-r from-primary-700 via-primary-500 to-secondary-500 bg-clip-text text-transparent">
						Your Event. Your Brand.
					</span>
					<br />
					<span className="bg-gradient-to-r from-secondary-600 via-secondary-500 to-secondary-400 bg-clip-text text-transparent">
						Across Africa.
					</span>
				</h1>

				<div className="flex justify-center -mt-2 sm:-mt-3">
					<DrippingSvg className="h-6 sm:h-8 md:h-10 w-auto" aria-hidden="true" />
				</div>

				<p className="max-w-xl mx-auto text-foreground/70 text-sm sm:text-lg leading-relaxed">
					Launch free events for brand reach, sell tickets
					with instant payouts, or run trusted live voting.
					Fully branded with your colours and logo.
				</p>

				<div className="flex flex-cl xs:flex-row items-center justify-center gap-3.5 pt-3">
					<Link
						href="/events"
						className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-4 sm:px-8 py-2 text-sm sm:text-base font-semibold text-white shadow-lg shadow-primary-600/25 transition-all duration-300 hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/30 active:scale-[0.98]"
					>
						Explore Events
						<ArrowRight className="size-4.5 transition-transform duration-200 group-hover:translate-x-1" />
					</Link>
					<Link
						href="/register"
						className="group inline-flex items-center justify-center gap-2.5 rounded-full border border-foreground/15 bg-white px-7 py-2 text-sm sm:text-base font-semibold text-foreground shadow-sm transition-all duration-300 hover:border-foreground/30 hover:bg-stone-50 active:scale-[0.98]"
					>
						<span className="flex size-5 items-center justify-center rounded-full bg-tertiary-600 text-white shadow-xs">
							<Play className="size-2.5 fill-background" />
						</span>
						Host for Free
					</Link>
				</div>

				<div className=" items-center justify-center pt-2 hidden xl:flex">
					<div className="inline-flex  items-center justify-center gap-3 rounded-full border border-foreground/10 bg-white px-5 py-2 sm:py-2.5 shadow-sm">
						<div className="flex -space-x-2">
							{AVATAR_INITIALS.map((av) => (
								<span
									key={av.label}
									className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-white ${av.bg}`}
								>
									{av.label}
								</span>
							))}
						</div>

						<div className="flex items-center gap-0.5">
							{[1, 2, 3, 4, 5].map((star) => (
								<Star key={star} className="size-3.5 fill-secondary-400 text-secondary-400" />
							))}
						</div>

						<span className="text-xs sm:text-sm text-foreground/70">
							Trusted by{" "}
							<span className="font-bold text-foreground">10,000+ creators</span>{" "}
							across 22+ countries
						</span>
					</div>
				</div>
			</div>

			{/* ── Three Images + Floating Cards Section ── */}
			<div className="relative z-10 w-full max-w-5xl mx-auto px-2 sm:px-4">
				<div className="relative h-[430px] sm:h-[40px] md:h-[540px] xl:h-auto xl:flex xl:items-end xl:justify-between xl:gap-6">
					{/* Left — Guitar Man with Arch Shape */}
					<div className="absolute bottom-0 left-[2%] sm:left-[6%] w-[26%] sm:w-[23%] md:w-[21%] xl:static xl:shrink-0 xl:w-[19%] transition-all duration-300">
						<div className="relative aspect-[768/1376] rounded-[3.5rem] sm:rounded-[5rem] md:rounded-[6rem] xl:rounded-[7rem] overflow-hidden shadow-lg border border-white/60 bg-[#eeece8]">
							<Image
								src="/landing/man_with_guitar.webp"
								alt="Man with guitar"
								fill
								className="object-cover object-bottom"
								sizes="(max-width: 640px) 30vw, 24vw"
								priority
							/>
						</div>
					</div>

					{/* Floating Card 1 — Live Voting */}
					<div className="absolute top-[32%] sm:top-[30%] left-[2%] sm:left-[6%] xl:top-auto xl:bottom-[25%] xl:left-[19%] z-20 rotate-[-33deg] xl:rotate-[-10deg] hover:rotate-0 transition-all duration-300 pointer-events-auto">
						<div className="flex items-center gap-2 sm:gap-2.5 rounded-lg sm:rounded-xl bg-white dark:bg-card px-3 py-2 sm:px-4 sm:py-2.5 shadow-xl shadow-stone-300/40 dark:shadow-black/30 border border-stone-100/90 dark:border-border">
							<div className="flex size-7.5 sm:size-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary">
								<VoteIcon className="size-4 sm:size-4.5 text-primary" />
							</div>
							<div className="text-left">
								<p className="font-bold text-stone-900 dark:text-stone-100 text-xs sm:text-sm md:text-[0.95rem] leading-tight">
									Live Voting
								</p>
								<p className="text-stone-400 dark:text-stone-400 font-medium text-[9px] sm:text-[11px]">
									Fraud-proof &amp; fast
								</p>
							</div>
						</div>
					</div>

					{/* Center — Happy Woman in Circle */}
					<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[30%] sm:w-[27%] md:w-[25%] xl:static xl:translate-x-0 xl:flex-shrink-0 xl:w-[25%] transition-all duration-300">
						<div className="relative aspect-square rounded-full overflow-hidden shadow-lg border">
							<Image
								src="/landing/happy_paddy.webp"
								alt="Happy woman in red dress"
								fill
								className="object-cover object-[center_top]"
								sizes="(max-width: 640px) 36vw, 30vw"
								priority
							/>
						</div>
					</div>

					{/* Floating Card 2 — Instant Payouts */}
					<div className="absolute top-[34%] sm:top-[32%] right-[2%] sm:right-[6%] xl:top-auto xl:bottom-[27%] xl:right-[24%] z-20 rotate-[33deg] xl:rotate-[10deg] hover:-rotate-3 transition-all duration-300 pointer-events-auto">
						<div className="flex items-center gap-2 sm:gap-2.5 rounded-lg sm:rounded-xl bg-white dark:bg-card px-3 py-2 sm:px-4 sm:py-2.5 shadow-xl shadow-stone-300/40 dark:shadow-black/30 border border-stone-100/90 dark:border-border">
							<div className="flex size-7.5 sm:size-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-tertiary-50 dark:bg-tertiary-950/40 text-tertiary">
								<TicketIcon className="size-4 sm:size-4.5 text-tertiary" />
							</div>
							<div className="text-left">
								<p className="font-bold text-stone-900 dark:text-stone-100 text-xs sm:text-sm md:text-[0.95rem] leading-tight">
									Instant Payouts
								</p>
								<p className="text-stone-400 dark:text-stone-400 font-medium text-[9px] sm:text-[11px]">
									Straight to your wallet
								</p>
							</div>
						</div>
					</div>

					{/* Right — Jump Man on red rounded rectangle */}
					<div className="absolute bottom-0 right-[2%] sm:right-[6%] w-[35%] sm:w-[31%] md:w-[28%] xl:static xl:flex-shrink-0 xl:w-[27%] transition-all duration-300">
						<div className="relative aspect-[1408/768] -rotate-[16deg] origin-[-6%_100%] shadow-xl rounded-2xl sm:rounded-3xl md:rounded-[2.2rem] overflow-hidden bg-primary-600">
							<Image
								src="/landing/jump_man.webp"
								alt="Man jumping with joy"
								fill
								className="object-cover"
								sizes="(max-width: 640px) 35vw, 31vw"
								priority
							/>
						</div>
					</div>
				</div>
				<div className=" items-center justify-center pt-2 flex xl:hidden">
					<div className="inline-flex flex-wrap items-center justify-center gap-x-3  rounded-full border border-foreground/10 bg-white px-5 py-2 sm:py-2.5 shadow-sm">
						<div className="flex -space-x-2">
							{AVATAR_INITIALS.map((av) => (
								<span
									key={av.label}
									className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-white ${av.bg}`}
								>
									{av.label}
								</span>
							))}
						</div>

						<div className="flex items-center gap-0.5">
							{[1, 2, 3, 4, 5].map((star) => (
								<Star key={star} className="size-3.5 fill-secondary-400 text-secondary-400" />
							))}
						</div>

						<span className="text-xs sm:text-sm text-foreground/70">
							Trusted by{" "}
							<span className="font-bold text-foreground">10,000+ creators</span>{" "}
							across 22+ countries
						</span>
					</div>
				</div>
			</div>

		</Section>
	);
}
