"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Quote } from "lucide-react";
import { Section } from "../Section";
import { PROJ_NAME } from "@/lib/constants/branding";
import { getUssdRootDialCode } from "@/lib/utils/ussd";

function getInitials(name: string): string {
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
}

export function LandingTestimonials() {
	const ussdCode = getUssdRootDialCode();

	const testimonials = [
		{
			quote:
				"The live voting feature was a total game-changer for our annual awards show in Accra. Both web and USSD voting tallied accurately in real time with zero latency.",
			author: "Sarah Mensah",
			role: "Executive Producer",
			company: "Ghana Music Awards",
			avatar: "/landing/h.webp",
			location: "Accra, Ghana",
		},
		{
			quote:
				"We sold out our pan-African tech summit with attendees flying in from 14 countries. Instant Mobile Money payouts made our cashflow completely stress-free.",
			author: "Kwame Asante",
			role: "Founder",
			company: "Tech Across Africa",
			avatar: "/landing/j.webp",
			location: "Nairobi & Lagos",
		},
		{
			quote:
				`Offline USSD voting (${ussdCode}) allowed us to reach grassroots audiences without requiring internet access. It is the most inclusive ticketing platform in Africa.`,
			author: "Ama Serwaa",
			role: "Festival Director",
			company: "Heritage West Africa",
			avatar: "/landing/a.webp",
			location: "Kumasi, Ghana",
		},
	];

	return (
		<Section class="mt-20 md:mt-24" id="testimonials" content-class="space-y-10">
			{/* Section Header */}
			<div className="mx-auto text-center space-y-3 max-w-2xl">
				<h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground font-millik">
					Loved by African{" "}
					<span className="text-primary">Event Producers</span>
				</h2>

				<p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
					See how top event organizers and award committees across Africa scale their productions with{" "}
					<span className="capitalize font-semibold text-foreground">{PROJ_NAME}</span>.
				</p>
			</div>

			{/* Testimonials Grid (Preline Clean Style) */}
			<div className="grid md:grid-cols-3 gap-5">
				{testimonials.map((item) => (
					<Card
						key={item.author}
						className="border border-border h-full bg-card rounded-xl shadow-none hover:border-primary/50 transition-colors"
					>
						<CardContent className="p-6 h-full flex flex-col justify-between space-y-5">
							{/* Quote Icon */}
							<Quote className="size-6 text-primary rotate-180" />

							{/* Quote Text */}
							<p className="text-foreground text-xs sm:text-sm leading-relaxed flex-1 italic">
								&ldquo;{item.quote}&rdquo;
							</p>

							{/* Author Profile */}
							<div className="flex gap-3 items-center pt-1 border-t border-border">
								<Avatar className="size-9 border border-border">
									<AvatarImage src={item.avatar} alt={item.author} />
									<AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
										{getInitials(item.author)}
									</AvatarFallback>
								</Avatar>

								<div>
									<h4 className="font-bold text-xs sm:text-sm text-foreground">
										{item.author}
									</h4>
									<p className="text-[11px] text-muted-foreground">
										{item.role}, {item.company}
									</p>
									<span className="text-[10px] text-primary font-semibold block">
										{item.location}
									</span>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</Section>
	);
}
