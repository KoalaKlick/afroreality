"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { FextivaLogo } from "@/components/shared/FextivaLogo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface EventCreationCTABannerProps {
	readonly className?: string;
	readonly orgSlug?: string;
}

export function EventCreationCTABanner({
	className = "",
	orgSlug,
}: EventCreationCTABannerProps) {
	return (
		<footer className={`w-full ${className}`}>
			{/* Outer section: full-bleed painting background */}
			<div className="relative w-full overflow-hidden py-10 sm:py-12 lg:py-14">
				{/* Background painting — edge to edge */}
				<img
					src="/landing/cta/cta_image.png"
					alt=""
					aria-hidden="true"
					className="absolute inset-0 w-full h-full object-cover object-center"
				/>
				{/* Subtle dark scrim so inner Card pops */}
				<div className="absolute inset-0 bg-black/40" />

				{/* Inner container — reusable Card holds everything */}
				<div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
					<Card className="relative rounded-3xl shadow-2xl gap-0 py-0 flex flex-col md:flex-row justify-between">

						{/* Left: Text + buttons */}
						<div className="max-w-xl flex-1 flex flex-col justify-center px-6 md:pr-0 space-y-4 py-6 sm:px-12 sm:py-10 lg:px-16">
							<h2 className="text-3xl sm:text-5xl md:text-5xl font-black leading-tight tracking-tight text-foreground font-millik">
								About  <span className="text-primary">Unforgettable</span> Events ?
							</h2>

							<p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
								Join thousands of event organizers who trust fextiva to power
								their events
							</p>

							<div className="flex flex-wrap gap-3 pt-1">
								<Button asChild size="lg" variant="default" className="group gap-2">
									<Link href="/register">
										<span>Create Your First Event</span>
										<ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
									</Link>
								</Button>

								<Button asChild size="lg" variant="outline" className="group gap-2">
									<Link href={orgSlug ? `/${orgSlug}` : "/events"}>
										<CalendarDays className="size-4" />
										<span>See All Events</span>
									</Link>
								</Button>
							</div>
						</div>

						{/* Right: 3 people images — @container for responsive placement */}
						<div className="flex-1 grow relative min-h-72 @container pointer-events-none select-none">
							{/* Person 3 – back (dancing woman) */}
							<img
								src="/landing/cta/create-event-3.webp"
								alt=""
								aria-hidden="true"
								className="absolute bottom-0 z-[1] @max-md:right-0 @min-md:left-0 w-auto @max-md:h-full h-[85%] object-cover drop-shadow-lg hover:grayscale-75 transition-all duration-300 pointer-events-auto"
								loading="lazy"
							/>
							{/* Person 2 – middle (guitarist) */}
							{/* <img
							src="/landing/cta/create-event-2.webp"
							alt=""
							aria-hidden="true"
							className="absolute bottom-0 z-[3] right-[25%] md:right-[0%] w-auto h-[90%] object-cover drop-shadow-xl hover:grayscale-75 transition-all duration-300 pointer-events-auto"
							loading="lazy"
						/> */}
							{/* Person 1 – front right (celebrating organiser) */}
							<img
								src="/landing/cta/create-event-1.webp"
								alt=""
								aria-hidden="true"
								className="absolute bottom-0 z-[2] right-[-7%] @min-md:right-[-16%] w-auto h-[110%] object-cover @lg:w-100 drop-shadow-2xl hover:grayscale-75 transition-all duration-300 pointer-events-auto"
								loading="lazy"
							/>
						</div>
					</Card>
				</div>
			</div>

			{/* Brand footer strip */}
			<div className="w-full bg-background border-t px-6 sm:px-10 lg:px-16 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<Link href="/" className="inline-flex items-center">
						<FextivaLogo className="h-6 w-auto" />
					</Link>
					<span className="text-xs text-muted-foreground hidden sm:inline">|</span>
					<p className="text-xs text-muted-foreground font-medium">
						Powering Next-Gen African Events &amp; Live Voting
					</p>
				</div>
				<p className="text-xs text-muted-foreground">
					&copy; {new Date().getFullYear()} fextiva. All Rights Reserved.
				</p>
			</div>
		</footer>
	);
}