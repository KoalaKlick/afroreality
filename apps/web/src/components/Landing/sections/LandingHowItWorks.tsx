"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Section } from "../Section";
import { ArrowRight } from "lucide-react";

const STEPS = [
	{
		step: "01",
		title: "Create Your Event",
		description:
			"Set up your event in minutes with our intuitive builder. Upload your flier, configure tickets in local African currencies or configure voting categories.",
	},
	{
		step: "02",
		title: "Sell Tickets & Collect Votes",
		description:
			"Share your event link and USSD code (*928#). Attendees pay effortlessly via MTN MoMo, Telecel, AT Money, and Cards.",
	},
	{
		step: "03",
		title: "Scan at Gate & Get Paid",
		description:
			"Scan digital QR passes with any smartphone camera at the entrance. Revenues settle straight to your mobile money or bank account.",
	},
];

export function LandingHowItWorks() {
	return (
		<Section
			id="how-it-works"
			class="mt-20 md:mt-24"
			content-class="grid md:grid-cols-2 gap-8 items-center"
		>
			{/* Left Column: Title, CTA & Steps */}
			<div className="space-y-6">
				<div className="space-y-3">
					<h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight font-millik">
						Launch Your Event in{" "}
						<span className="text-primary block">3 Simple Steps</span>
					</h2>

					<Link href="/register" className="inline-block pt-1">
						<Button className="h-10 px-5 rounded-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-none text-sm">
							Get Started
							<ArrowRight className="size-4 ml-1.5" />
						</Button>
					</Link>
				</div>

				<div className="space-y-3 pt-2">
					{STEPS.map((step) => (
						<Card
							key={step.step}
							className="p-5 border border-border rounded-xl shadow-none transition-colors hover:border-primary/50 space-y-1"
						>
							<span className="text-sm font-bold text-primary block">
								Step {step.step}
							</span>
							<h3 className="text-base font-bold text-foreground">
								{step.title}
							</h3>
							<p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
								{step.description}
							</p>
						</Card>
					))}
				</div>
			</div>

			{/* Right Column: Clean Preline-Style Hero Illustration */}
			<div className="h-full flex items-center justify-center">
				<div className="relative aspect-4/5 w-full max-w-md overflow-hidden rounded-xl border border-border shadow-none">
					<Image
						src="/landing/hero-womam-1.webp"
						alt="African event host"
						fill
						className="object-cover"
						sizes="(max-width: 768px) 100vw, 450px"
					/>
				</div>
			</div>
		</Section>
	);
}
