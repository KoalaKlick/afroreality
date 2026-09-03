import type { Metadata } from "next";
import {
	getPublicEventsList,
	getPublicOrganizersList,
	getLandingStatsData,
} from "@/lib/dal/public";
import { EventsPageClient } from "@/components/events/EventsPageClient";
import { PROJ_NAME } from "@/lib/constants/branding";
import type { LandingEventItem } from "@/components/Landing/sections/LandingEventsSection";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: `Discover Events & Organizers | ${PROJ_NAME}`,
		description:
			"Explore live African events, concerts, award nominations, and ticketing on our platform.",
	};
}

interface EventsPageProps {
	searchParams: Promise<{
		q?: string;
		type?: string;
	}>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
	const resolvedParams = await searchParams;
	const q = resolvedParams.q || "";
	const type = resolvedParams.type || "all";

	const [eventsResult, organizersResult, stats] = await Promise.all([
		getPublicEventsList({
			limit: 50,
			query: q,
			type: type !== "all" ? type : undefined,
		}),
		getPublicOrganizersList({
			limit: 30,
			query: q,
		}),
		getLandingStatsData(),
	]);

	return (
		<div className="pt-16 min-h-screen">
			<EventsPageClient
				initialEvents={eventsResult.events as LandingEventItem[]}
				initialOrganizers={organizersResult.organizers}
				stats={stats}
				defaultQuery={q}
				defaultType={type}
			/>
		</div>
	);
}
