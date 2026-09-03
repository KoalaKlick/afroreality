"use client";

import { motion } from "motion/react";
import { Star, Quote } from "lucide-react";

const TESTIMONIALS = [
	{
		quote:
			"Handling over 12,000 festival passes and gate check-ins was completely seamless. The offline-ready QR scanner eliminated long gate queues entirely, and payouts settled straight to our bank account.",
		author: "Kwame Asante",
		role: "Executive Producer",
		organization: "AfroNation Experience",
		avatar: "/landing/j.webp",
		rating: 5,
	},
	{
		quote:
			"The USSD offline voting feature was an absolute game changer for our awards gala. Fans across Ghana and West Africa could dial *928# and cast votes via MoMo in under 30 seconds.",
		author: "Nana Yaa Boakye",
		role: "Founder & Director",
		organization: "Creative Arts Honors Africa",
		avatar: "/landing/h.webp",
		rating: 5,
	},
	{
		quote:
			"From multi-tier ticket sales to public speaker listings, the platform gave our conference an executive, state-of-the-art polish. Attendee conversions jumped by 40% compared to our previous tool.",
		author: "David Osei-Mensah",
		role: "Head of Operations",
		organization: "Tech in Africa Summit",
		avatar: "/landing/a.webp",
		rating: 5,
	},
];

export function LandingTestimonials() {
	return (
		<section className="py-20 md:py-28 relative overflow-hidden">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Section Header */}
				<div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
					<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
						<Star className="size-3.5 fill-current" />
						<span>Loved by Creators</span>
					</div>
					<h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-foreground">
						Trusted by Top Event Producers
					</h2>
					<p className="text-muted-foreground text-sm sm:text-base">
						See how leading organizers and cultural brands rely on us to deliver unforgettable experiences.
					</p>
				</div>

				{/* Cards Grid */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					{TESTIMONIALS.map((item, idx) => (
						<motion.div
							key={item.author}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.45, delay: idx * 0.08 }}
							className="relative rounded-3xl border border-border/60 bg-card p-8 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
						>
							<div className="space-y-4">
								{/* Rating Stars */}
								<div className="flex items-center gap-1 text-amber-500">
									{Array.from({ length: item.rating }).map((_, i) => (
										<Star key={i} className="size-4 fill-amber-400 text-amber-400" />
									))}
								</div>

								{/* Quote */}
								<p className="text-sm sm:text-base text-foreground/90 leading-relaxed italic">
									&ldquo;{item.quote}&rdquo;
								</p>
							</div>

							{/* Author Footer */}
							<div className="pt-6 mt-6 border-t border-border/40 flex items-center gap-3.5">
								<div className="size-11 rounded-full overflow-hidden bg-muted relative">
									<img
										src={item.avatar}
										alt={item.author}
										className="object-cover w-full h-full"
									/>
								</div>
								<div>
									<h4 className="text-sm font-bold text-foreground">
										{item.author}
									</h4>
									<p className="text-xs text-muted-foreground">
										{item.role}, <span className="text-foreground/80 font-medium">{item.organization}</span>
									</p>
								</div>
							</div>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
