"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "../Section";

const HERO_CARDS = [
	{
		id: "organizer",
		title: "Organizers & Hosts",
		img: "/landing/old-man.webp",
		translate: "-translate-y-4 sm:-translate-y-6 md:-translate-y-8 lg:-translate-y-10",
		rotate: "-rotate-[10deg] sm:-rotate-[14deg] md:-rotate-[16deg]",
		color: "bg-secondary dark:bg-secondary-600",
		zIndex: "z-10",
		imgScale: "scale-x-[-1]",
		topPercent: "22%",
	},
	{
		id: "creator",
		title: "Creators & Artists",
		img: "/landing/nnarks-engineer.webp",
		translate: "-translate-y-12 sm:-translate-y-18 md:-translate-y-28 lg:-translate-y-36",
		rotate: "rotate-0",
		color: "bg-primary dark:bg-primary-700",
		zIndex: "z-30",
		imgScale: "",
		topPercent: "30%",
	},
	{
		id: "attendee",
		title: "Attendees & Voters",
		img: "/landing/clock-it-man.webp",
		translate: "translate-y-2 sm:-translate-y-2 md:-translate-y-6 lg:-translate-y-10",
		rotate: "rotate-[10deg] sm:rotate-[14deg] md:rotate-[16deg]",
		color: "bg-tertiary-600 dark:bg-tertiary-700",
		zIndex: "z-20",
		imgScale: "",
		topPercent: "22%",
	},
];

export function LandingHero() {
	return (
		<Section class="mt-8 sm:mt-12 md:mt-16 pt-4 pb-8 overflow-hidden" content-class="relative space-y-10 sm:space-y-14">
			{/* Text & Action Area */}
			<div className="relative space-y-5 text-center max-w-3xl mx-auto z-20">
				<div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 tracking-wide uppercase">
					<span className="inline-block size-2 rounded-full bg-primary animate-pulse" />
					Africa&apos;s Most Customizable Event Platform
				</div>

				<h1 className="font-bold text-3xl sm:text-5xl md:text-6xl tracking-tight text-foreground font-millik leading-[1.1]">
					Your Event. Your Brand.{" "}
					<span className="text-primary block sm:inline">
						Across Africa.
					</span>
				</h1>

				<p className="max-w-xl mx-auto text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed">
					Launch free events for brand reach, sell tickets with instant payouts, or run trusted live voting. Fully branded with your colors and logo.
				</p>

				<div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
					<Link href="/register">
						<Button className="h-11 px-7 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all active:scale-95 cursor-pointer">
							Get Started Free
							<ArrowRight className="size-4 ml-2" />
						</Button>
					</Link>

					<Link href="/events">
						<Button variant="outline" className="h-11 px-7 rounded-xl text-sm font-semibold border-border hover:border-primary/60 hover:text-primary shadow-xs transition-all cursor-pointer">
							Explore Events
						</Button>
					</Link>
				</div>

				<div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-xs text-muted-foreground font-medium">
					<span className="flex items-center gap-1.5">
						<span className="size-1.5 rounded-full bg-primary" />
						Instant MoMo &amp; Bank Payouts
					</span>
					<span className="flex items-center gap-1.5">
						<span className="size-1.5 rounded-full bg-secondary" />
						Pure Pay As You Go
					</span>
					<span className="flex items-center gap-1.5">
						<span className="size-1.5 rounded-full bg-tertiary-600" />
						Zero Monthly Fees
					</span>
				</div>
			</div>

			{/* 3-Card Character Fan (Primary, Secondary, Tertiary) */}
			<div className="w-full max-w-4xl mx-auto px-2 sm:px-6 md:px-10 pt-10 sm:pt-14 md:pt-20">
				<div className="grid grid-cols-3 relative z-10 pointer-events-none">
					{HERO_CARDS.map((card) => (
						<div
							key={card.id}
							className={`group relative flex flex-col justify-end ${card.translate} ${card.rotate} ${card.zIndex} transition-transform duration-500`}
							style={{ transformOrigin: "bottom center" }}
						>
							<div
								className="relative pointer-events-none w-full overflow-hidden h-[180%] sm:h-[200%] place-content-end"
								style={{ borderRadius: "0rem" }}
							>
								{/* Colored card backing */}
								<div
									className={`absolute bottom-0 left-0 right-0 ${card.color} transition-shadow duration-500 shadow-lg`}
									style={{ top: card.topPercent, borderRadius: "0rem" }}
								/>

								{/* Image */}
								<div
									className="cursor-pointer relative z-10 pointer-events-auto flex justify-center items-end pt-[8%] transition-transform duration-300 group-hover:scale-105"
									style={{ transformOrigin: "bottom center" }}
								>
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={card.img}
										alt={card.title}
										className={`w-full h-auto object-contain object-bottom select-none pointer-events-none ${card.imgScale}`}
									/>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</Section>
	);
}
