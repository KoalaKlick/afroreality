"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Section } from "../Section";
import { ArrowRight } from "lucide-react";

export function LandingHero() {
	return (
		<Section class="mt-12 sm:mt-16 pt-6" content-class="relative space-y-10">
			{/* Text Area */}
			<div className="sm:z-20 relative space-y-5 text-center max-w-3xl mx-auto">
				<div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 tracking-wide uppercase">
					<span className="inline-block size-2 rounded-full bg-primary animate-pulse" />
					Africa&apos;s Most Customizable Event Platform
				</div>

				<h1 className="font-bold text-3xl sm:text-5xl md:text-6xl tracking-tight text-foreground font-millik leading-tight">
					Your Event. Your Brand.{" "}
					<span className="text-primary block sm:inline">
						Across Africa.
					</span>
				</h1>

				<p className="max-w-xl mx-auto text-muted-foreground text-sm sm:text-base leading-relaxed">
					Launch free events for brand reach, sell tickets with instant payouts, or run trusted live voting. Fully branded with your colors and logo.
				</p>

				<div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
					<Link href="/register">
						<Button className="h-11 px-6 rounded-lg text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-none transition-all">
							Get Started Free
							<ArrowRight className="size-4 ml-2" />
						</Button>
					</Link>

					<Link href="/events">
						<Button variant="outline" className="h-11 px-6 rounded-lg text-sm font-semibold border-border hover:border-primary/60 hover:text-primary shadow-none">
							Explore Events
						</Button>
					</Link>
				</div>

				<div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-xs text-muted-foreground font-medium">
					<span className="flex items-center gap-1.5">
						<span className="size-1.5 rounded-full bg-primary" />
						Free General Events
					</span>
					<span className="flex items-center gap-1.5">
						<span className="size-1.5 rounded-full bg-primary" />
						100% Your Branding
					</span>
					<span className="flex items-center gap-1.5">
						<span className="size-1.5 rounded-full bg-primary" />
						Online &amp; USSD Voting
					</span>
				</div>
			</div>

			{/* Clean Preline-Style Showcase Visuals (Clean rounded-xl, 1px border, NO shadows) */}
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
