"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Section } from "../Section";
import { Smartphone, ShieldCheck, ArrowRight } from "lucide-react";

export function LandingHero() {
	return (
		<Section class="mt-12 sm:mt-16 pt-6" content-class="relative space-y-10">
			{/* Text Area */}
			<div className="sm:z-20 relative space-y-5 text-center max-w-3xl mx-auto">
				<h1 className="font-bold text-3xl sm:text-5xl md:text-6xl tracking-tight text-foreground font-millik leading-tight">
					Power Events Across Africa{" "}
					<span className="text-[#e88722] block sm:inline">
						With Simplicity
					</span>
				</h1>

				<p className="max-w-2xl mx-auto text-muted-foreground text-sm sm:text-base leading-relaxed">
					Run events, sell tickets, collect live audience votes, and receive instant payouts across Africa.
					Works online, offline via USSD (*928#), and through native Mobile Money &amp; cards.
				</p>

				<div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
					<Link href="/register">
						<Button className="h-11 px-6 rounded-lg text-sm font-semibold bg-[#e88722] hover:bg-[#d66512] text-white shadow-none transition-all">
							Get Started Free
							<ArrowRight className="size-4 ml-2" />
						</Button>
					</Link>

					<Link href="/events">
						<Button variant="outline" className="h-11 px-6 rounded-lg text-sm font-semibold border-border hover:border-[#e88722]/60 hover:text-[#e88722] shadow-none">
							Explore Events
						</Button>
					</Link>
				</div>

				{/* Quick Trust Highlights */}
				<div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground pt-2">
					<span className="flex items-center gap-1.5 font-medium">
						<Smartphone className="size-3.5 text-[#e88722]" />
						USSD Dialing (*928#)
					</span>
					<span className="flex items-center gap-1.5 font-medium">
						<ShieldCheck className="size-3.5 text-[#ca0808]" />
						Instant Mobile Money Payouts
					</span>
				</div>
			</div>

			{/* Clean Preline-Style Showcase Visuals (Clean rounded-xl, no giant circular pill cuts, NO shadows) */}
			<div className="relative max-w-5xl mx-auto">
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div className="relative h-60 sm:h-72 rounded-xl overflow-hidden border border-border">
						<Image
							src="/landing/h.webp"
							alt="African festival celebration"
							fill
							priority
							className="object-cover hover:scale-105 transition-transform duration-300"
							sizes="(max-width: 768px) 100vw, 33vw"
						/>
					</div>

					<div className="relative h-60 sm:h-72 rounded-xl overflow-hidden border border-border">
						<Image
							src="/landing/a.webp"
							alt="Live African music concert"
							fill
							priority
							className="object-cover hover:scale-105 transition-transform duration-300"
							sizes="(max-width: 768px) 100vw, 33vw"
						/>
					</div>

					<div className="relative h-60 sm:h-72 rounded-xl overflow-hidden border border-border">
						<Image
							src="/landing/b.webp"
							alt="Pan-African community gathering"
							fill
							priority
							className="object-cover hover:scale-105 transition-transform duration-300"
							sizes="(max-width: 768px) 100vw, 33vw"
						/>
					</div>
				</div>
			</div>
		</Section>
	);
}
