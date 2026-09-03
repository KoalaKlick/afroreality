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
} from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
	{
		title: "Smart African Ticketing",
		description:
			"Create, manage, and sell tickets with automated QR codes, multi-currency support, and flexible VIP tiers.",
		icon: Ticket,
		iconBg: "bg-primary/10 text-primary",
	},
	{
		title: "Native Mobile Money & Cards",
		description:
			"Seamless integration with MTN MoMo, Telecel Cash, AT Money, M-Pesa, and cards via Paystack with instant settlements.",
		icon: CreditCard,
		iconBg: "bg-primary/10 text-primary",
	},
	{
		title: "Web & USSD Voting (*928#)",
		description:
			"Run national awards, pageants, and talent contests. Anyone across Africa can dial *928# offline or vote online in real-time.",
		icon: Vote,
		iconBg: "bg-primary/10 text-primary",
	},
	{
		title: "Team & Gate Crew Roles",
		description:
			"Assign scanner, manager, and cashier permissions to your event team to streamline gate check-ins and eliminate gate fraud.",
		icon: Users,
		iconBg: "bg-primary/10 text-primary",
	},
	{
		title: "Real-Time African Analytics",
		description:
			"Gain deep insights into attendee demographics, ticket sales velocity, and voter rankings across cities and countries.",
		icon: BarChart3,
		iconBg: "bg-primary/10 text-primary",
	},
	{
		title: "High-Traffic Scalability",
		description:
			"Enterprise infrastructure tested for 50,000+ attendee stadium festivals, high-speed gate scanning, and 99.9% uptime.",
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
