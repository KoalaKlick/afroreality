"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Section } from "../Section";

export function LandingCTA() {
	return (
		<Section class="overflow-hidden mt-16 md:mt-20" content-class="relative">
			<div className="bg-primary text-primary-foreground rounded-2xl flex flex-col md:flex-row justify-between items-stretch overflow-hidden border border-border/20 shadow-none">
				{/* Left Copy & CTA */}
				<div className="max-w-lg flex-1 px-6 sm:px-10 py-8 md:py-14 space-y-4 z-30 flex flex-col justify-center">
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

				{/* Right Stacked Showcase Visuals: Bleeds to bottom, white translucent borders, comfortable spacing without left cutoff */}
				<div className="flex-1 relative w-full min-h-[280px] sm:min-h-[340px] md:min-h-[380px] self-stretch overflow-hidden mt-2 md:mt-0">
					{/* Primary Front Layer (Rightmost) */}
					<div className="absolute bottom-0 right-0 sm:right-4 w-52 sm:w-60 md:w-64 h-[94%] z-20 rounded-t-xl overflow-hidden border-t-2 border-white/35">
						<Image
							src="/landing/a.webp"
							alt="African festival celebration"
							fill
							className="object-cover"
							sizes="(max-width: 768px) 240px, 300px"
						/>
					</div>

					{/* Middle Layer */}
					<div className="absolute  bg-primary-600 bottom-0 right-20 sm:right-28 md:right-32 w-48 sm:w-56 md:w-60 h-[82%] z-10 rounded-t-xl overflow-hidden border-t-2  border-white/25">
						<Image
							src="/landing/h.webp"
							alt="Live African crowd"
							fill
							className="object-cover opacity-75"
							sizes="(max-width: 768px) 220px, 270px"
						/>
					</div>

					{/* Backdrop Layer: properly offset so the rounded top-left corner and left border are fully visible */}
					<div className="absolute  bottom-0  right-40 sm:right-52 md:right-60 w-44 sm:w-52 md:w-56 h-[70%] z-0 rounded-t-xl overflow-hidden border-t-2 border-l-2 border-white/20">
						<Image
							src="/landing/b.webp"
							alt="Concert stage lighting"
							fill
							className="object-cover opacity-50"
							sizes="(max-width: 768px) 200px, 240px"
						/>
					</div>
				</div>
			</div>
		</Section>
	);
}
