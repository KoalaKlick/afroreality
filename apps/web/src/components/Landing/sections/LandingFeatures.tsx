"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Section } from "../Section";
import {
	Ticket,
	CreditCard,
	Vote,
	Users,
	BarChart3,
	ShieldCheck,
	Palette,
	Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
	{
		title: "Your Brand, Front & Center",
		description:
			"Your colors, your logo, your identity. Make every event page look completely yours.",
		icon: Palette,
		iconBg: "bg-primary/10 text-primary",
	},
	{
		title: "Free Events & Brand Reach",
		description:
			"Host free community events, product launches, and club nights to build authentic audience trust.",
		icon: Megaphone,
		iconBg: "bg-primary/10 text-primary",
	},
	{
		title: "Instant QR Ticketing",
		description:
			"Sell tickets in seconds with automated QR codes, VIP tiers, and multi-currency support.",
		icon: Ticket,
		iconBg: "bg-primary/10 text-primary",
	},
	{
		title: "MoMo & Card Settlements",
		description:
			"Direct payouts via MTN MoMo, Telecel, AT Money, M-Pesa, and cards with instant settlements.",
		icon: CreditCard,
		iconBg: "bg-primary/10 text-primary",
	},
	{
		title: "Online & USSD Voting (*928#)",
		description:
			"Run trusted awards and pageants. Audience votes online or dials *928# offline with zero friction.",
		icon: Vote,
		iconBg: "bg-primary/10 text-primary",
	},
	{
		title: "Gate Crew & Anti-Fraud",
		description:
			"Equip your door crew with high-speed scanner roles to eliminate ticket fraud on entry.",
		icon: Users,
		iconBg: "bg-primary/10 text-primary",
	},
	{
		title: "Live Analytics",
		description:
			"Track sales velocity, voter leaderboards, and attendee traffic in real time.",
		icon: BarChart3,
		iconBg: "bg-primary/10 text-primary",
	},
	{
		title: "Stadium-Grade Scale",
		description:
			"Battle-tested infrastructure with 99.9% uptime for massive African crowds.",
		icon: ShieldCheck,
		iconBg: "bg-primary/10 text-primary",
	},
];

export function LandingFeatures() {
	return (
		<Section id="features" class="mt-20 md:mt-24" content-class="space-y-10">
			{/* Section Header */}
			<div className="mx-auto text-center space-y-3 max-w-2xl">
				<h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground font-millik">
					Everything You Need to{" "}
					<span className="text-primary">
						Succeed in Africa
					</span>
				</h2>

				<p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
					Tailor-made infrastructure designed specifically for the unique dynamics of African events, payments, and audiences.
				</p>
			</div>

			{/* Features Grid (Preline Clean Style) */}
			<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
				{FEATURES.map((feature) => {
					const Icon = feature.icon;
					return (
						<Card
							key={feature.title}
							className="rounded-xl border border-border bg-card transition-colors hover:border-primary/50 shadow-none"
						>
							<CardContent className="p-6 space-y-3">
								{/* Icon */}
								<div
									className={cn(
										"size-10 rounded-lg flex items-center justify-center",
										feature.iconBg,
									)}
								>
									<Icon className="size-5" />
								</div>

								{/* Content */}
								<h3 className="text-lg font-bold text-foreground">
									{feature.title}
								</h3>
								<p className="text-sm text-muted-foreground leading-relaxed">
									{feature.description}
								</p>
							</CardContent>
						</Card>
					);
				})}
			</div>
		</Section>
	);
}
