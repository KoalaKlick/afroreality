import type { Metadata } from "next";
import { LandingNavbar } from "@/components/Landing/LandingNavbar";
import { LandingHero } from "@/components/Landing/sections/LandingHero";
import { LandingPartners } from "@/components/Landing/sections/LandingPartners";
import { LandingEventsSection } from "@/components/Landing/sections/LandingEventsSection";
import { LandingFeatures } from "@/components/Landing/sections/LandingFeatures";
import { LandingHowItWorks } from "@/components/Landing/sections/LandingHowItWorks";
import { LandingPricing } from "@/components/Landing/sections/LandingPricing";
import { LandingTestimonials } from "@/components/Landing/sections/LandingTestimonials";
import { LandingStats } from "@/components/Landing/sections/LandingStats";
import { LandingFAQ } from "@/components/Landing/sections/LandingFAQ";
import { LandingCTA } from "@/components/Landing/sections/LandingCTA";
import { LandingFooter } from "@/components/Landing/LandingFooter";
import { UssdFloatingWidget } from "@/components/event/public/UssdFloatingWidget";
import { getPublicEventsList, getLandingStatsData } from "@/lib/dal/public";
import { PROJ_NAME } from "@/lib/constants/branding";
import type { TawnyEventData } from "@/components/website/events/EventCard";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: `${PROJ_NAME} - Create Unforgettable Events`,
		description:
			"All-in-one ticketing, payments & live voting platform. Launch events in minutes.",
	};
}

export default async function HomePage() {
	const [eventsResult, stats] = await Promise.all([
		getPublicEventsList({ limit: 4 }),
		getLandingStatsData(),
	]);

	return (
		<div className="min-h-screen w-full overflow-x-hidden space-y-20 bg-background text-foreground">
			<LandingNavbar />
			<main className="space-y-10">
				<LandingHero />
				<LandingPartners />
				<LandingEventsSection
					initialEvents={eventsResult.events as TawnyEventData[]}
				/>
				<LandingFeatures />
				<LandingHowItWorks />
				<LandingPricing />
				<LandingTestimonials />
				<LandingStats stats={stats} />
				<LandingFAQ />
				<LandingCTA />
			</main>
			<LandingFooter />

			{/* Floating Root USSD QR Code Widget */}
			<UssdFloatingWidget
				eventTitle={`${PROJ_NAME} African Ticketing & Voting`}
				ussdCode="root"
			/>
		</div>
	);
}
