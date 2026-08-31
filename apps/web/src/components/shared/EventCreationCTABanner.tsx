"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AfroTixLogo } from "@/components/shared/AfroTixLogo";
import { Button } from "@/components/ui/button";

interface EventCreationCTABannerProps {
	readonly className?: string;
	readonly orgSlug?: string;
}

export function EventCreationCTABanner({
	className = "",
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
				{/* Subtle dark scrim so inner card pops */}
				<div className="absolute inset-0 bg-black/40" />

				{/* Inner white container — everything lives here */}
				<div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="relative bg-background rounded-3xl shadow-2xl overflow-hidden min-h-[340px] sm:min-h-[380px]">

						{/* Left: Text content */}
						<div className="relative z-10 flex flex-col justify-center px-8 py-10 sm:px-12 sm:py-12 lg:px-16 max-w-xl space-y-5">
							<h2 className="text-2xl sm:text-3xl md:text-[38px] font-black leading-tight tracking-tight text-foreground">
								Ready to Create Your Next{" "}
								<span
									className="bg-clip-text text-transparent"
									style={{
										backgroundImage:
											"linear-gradient(135deg, var(--color-brand-primary, #e05c00), var(--color-brand-secondary, #FFD100))",
									}}
								>
									Unforgettable Event?
								</span>
							</h2>

							<p className="text-muted-foreground text-sm sm:text-base font-medium leading-relaxed">
								Join thousands of event organizers who trust AfroReality to power
								their events. Start free — no credit card required.
							</p>

							<div className="pt-1">
								<Button
									asChild
									size="lg"
									className="h-12 px-7 rounded-xl font-bold transition-all group gap-2 shadow-md hover:shadow-lg text-white"
									style={{
										background:
											"linear-gradient(135deg, var(--color-brand-primary, #e05c00), var(--color-brand-secondary, #FFD100))",
									}}
								>
									<Link href="/register">
										<span>Create Your First Event</span>
										<ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
									</Link>
								</Button>
							</div>
						</div>

						{/* Right: 3 people images, absolutely positioned inside the white card */}
						<div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
							{/* Person 3 – back (dancing woman) */}
							<img
								src="/landing/cta/create-event-3.webp"
								alt=""
								aria-hidden="true"
								className="absolute bottom-0 right-[44%] sm:right-[42%] md:right-[40%] lg:right-[36%] z-10 h-[72%] sm:h-[78%] md:h-[84%] w-auto object-cover drop-shadow-lg"
								loading="lazy"
							/>
							{/* Person 2 – middle (guitarist) */}
							<img
								src="/landing/cta/create-event-2.webp"
								alt=""
								aria-hidden="true"
								className="absolute bottom-0 right-[18%] sm:right-[18%] md:right-[16%] lg:right-[12%] z-20 h-[80%] sm:h-[86%] md:h-[92%] w-auto object-cover drop-shadow-xl"
								loading="lazy"
							/>
							{/* Person 1 – front right (celebrating organiser) */}
							<img
								src="/landing/cta/create-event-1.webp"
								alt=""
								aria-hidden="true"
								className="absolute bottom-0 right-0 z-30 h-[86%] sm:h-[92%] md:h-[98%] w-auto object-cover drop-shadow-2xl"
								loading="lazy"
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Brand footer strip */}
			<div className="w-full bg-background border-t px-6 sm:px-10 lg:px-16 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<Link href="/" className="inline-flex items-center">
						<AfroTixLogo className="h-6 w-auto" />
					</Link>
					<span className="text-xs text-muted-foreground hidden sm:inline">|</span>
					<p className="text-xs text-muted-foreground font-medium">
						Powering Next-Gen African Events &amp; Live Voting
					</p>
				</div>
				<p className="text-xs text-muted-foreground">
					&copy; {new Date().getFullYear()} AfroReality. All Rights Reserved.
				</p>
			</div>
		</footer>
	);
}

