import type { Metadata } from "next";
import { LandingNavbar } from "@/components/Landing/LandingNavbar";
import { LandingHero } from "@/components/Landing/sections/LandingHero";
import { LandingPartners } from "@/components/Landing/sections/LandingPartners";
import {
	LandingEventsSection,
	type LandingEventItem,
} from "@/components/Landing/sections/LandingEventsSection";
import { LandingFeatures } from "@/components/Landing/sections/LandingFeatures";
import { LandingHowItWorks } from "@/components/Landing/sections/LandingHowItWorks";
import { LandingPricing } from "@/components/Landing/sections/LandingPricing";
import { LandingTestimonials } from "@/components/Landing/sections/LandingTestimonials";
import { LandingFAQ } from "@/components/Landing/sections/LandingFAQ";
import { LandingCTA } from "@/components/Landing/sections/LandingCTA";
import { LandingFooter } from "@/components/Landing/LandingFooter";
import { getPublicEventsList, getLandingStatsData } from "@/lib/dal/public";
import { PROJ_NAME } from "@/lib/constants/branding";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: `${PROJ_NAME} - Pan-African Event Ticketing & Live Voting Platform`,
		description:
			"Create, manage, and monetize African events with digital ticketing, live audience voting, instant Mobile Money settlements, and offline USSD access.",
	};
}

export default async function HomePage() {
	const [eventsResult, stats] = await Promise.all([
		getPublicEventsList({ limit: 6 }),
		getLandingStatsData(),
	]);

	return (
		<div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-emerald-500/20 selection:text-emerald-700">
			<LandingNavbar />
			<main className="flex-1">
				<LandingHero stats={stats} />
				<LandingPartners />
				<LandingEventsSection
					initialEvents={eventsResult.events as LandingEventItem[]}
				/>
				<LandingFeatures />
				<LandingHowItWorks />
				<LandingPricing />
				<LandingTestimonials />
				<LandingFAQ />
				<LandingCTA />
			</main>
			<LandingFooter />
		</div>
	);
}
