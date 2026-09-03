"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Section } from "../Section";

export function LandingCTA() {
	return (
		<Section class="overflow-hidden mt-16 md:mt-20" content-class="relative">
			<div className="bg-[#ca0808] text-white rounded-2xl flex flex-col md:flex-row justify-between overflow-hidden border border-border/20 shadow-none">
				{/* Left Copy & CTA */}
				<div className="max-w-xl flex-1 px-6 sm:px-10 py-8 md:py-12 space-y-4 z-30">
					<h2 className="text-white text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight font-millik">
						Ready to Create Your Next{" "}
						<span className="text-white/95 block font-black">
							Unforgettable African Event?
						</span>
					</h2>

					<p className="text-white/85 text-xs sm:text-sm leading-relaxed">
						Join hundreds of visionary creators, festival directors, and award committees across Ghana, Nigeria, Kenya, and the diaspora.
					</p>

					<div className="pt-2">
						<Link href="/register">
							<Button
								className="h-11 px-6 rounded-lg text-sm font-semibold bg-neutral-950 hover:bg-black text-white shadow-none"
							>
								<span>Create Your First Event</span>
								<ArrowRight className="size-4 ml-2" />
							</Button>
						</Link>
					</div>
				</div>

				{/* Right Stacked / Layered Showcase Visuals (Reverted as requested) */}
				<div className="flex-1 relative min-h-72 sm:min-h-80 overflow-hidden w-full">
					{/* Primary Top Layer */}
					<div className="absolute bottom-0 right-0 sm:right-6 w-52 sm:w-64 h-[90%] z-20 rounded-t-xl overflow-hidden border-t-2 border-l-2 border-white/30">
						<Image
							src="/landing/a.webp"
							alt="African festival celebration"
							fill
							className="object-cover"
							sizes="250px"
						/>
					</div>

					{/* Middle Layer */}
					<div className="absolute bottom-0 right-24 sm:right-36 w-48 sm:w-56 h-[80%] z-10 rounded-t-xl overflow-hidden opacity-90 border-t border-l border-white/20">
						<Image
							src="/landing/h.webp"
							alt="Live African crowd"
							fill
							className="object-cover"
							sizes="240px"
						/>
					</div>

					{/* Backdrop Layer */}
					<div className="absolute bottom-0 right-44 sm:right-60 w-44 sm:w-52 h-[70%] z-0 rounded-t-xl overflow-hidden opacity-70 border-t border-white/10">
						<Image
							src="/landing/b.webp"
							alt="Concert stage lighting"
							fill
							className="object-cover"
							sizes="220px"
						/>
					</div>
				</div>
			</div>
		</Section>
	);
}
