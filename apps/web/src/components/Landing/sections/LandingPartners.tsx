"use client";

import { motion } from "motion/react";

const PARTNERS = [
	{ name: "AfroNation Global", tag: "Festival Host" },
	{ name: "Ghana Music Awards Europe", tag: "Voting & Awards" },
	{ name: "Tech In Ghana Summit", tag: "Conference" },
	{ name: "Echoes of Africa Foundation", tag: "Cultural Forum" },
	{ name: "Accra Nightlife Guild", tag: "Nightlife & Music" },
	{ name: "Diaspora Homecoming Alliance", tag: "Pan-African Summit" },
];

export function LandingPartners() {
	return (
		<section className="py-12 border-y border-border/50 bg-muted/20 overflow-hidden">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<p className="text-center text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-6">
					Trusted by leading organizers, festivals &amp; award shows across Africa
				</p>

				{/* Brand Ticker Container */}
				<div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 opacity-75 hover:opacity-100 transition-opacity">
					{PARTNERS.map((partner, idx) => (
						<motion.div
							key={partner.name}
							initial={{ opacity: 0, y: 10 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.4, delay: idx * 0.05 }}
							className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border/40 shadow-2xs hover:shadow-xs transition-shadow"
						>
							<div className="size-2 rounded-full bg-emerald-500" />
							<span className="font-extrabold text-xs sm:text-sm tracking-tight text-foreground">
								{partner.name}
							</span>
							<span className="text-[10px] uppercase font-bold text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded">
								{partner.tag}
							</span>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
