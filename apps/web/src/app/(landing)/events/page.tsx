import type { Metadata } from "next";
import {
	getPublicEventsList,
	getPublicOrganizersList,
} from "@/lib/dal/public";
import { EventsPageClient } from "@/components/events/EventsPageClient";
import { PROJ_NAME } from "@/lib/constants/branding";
import type { TawnyEventData } from "@/components/website/events/EventCard";
import type { TawnyOrganizerData } from "@/components/website/events/OrganizerCard";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: `Discover Events & Organizers - ${PROJ_NAME}`,
		description:
			"Find amazing events with ticket sales and voting happening right now. Discover top organizers on our platform.",
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

	const [eventsResult, organizersResult] = await Promise.all([
		getPublicEventsList({
			limit: 50,
			query: q,
			type: type !== "all" ? type : undefined,
		}),
		getPublicOrganizersList({
			limit: 30,
			query: q,
		}),
	]);

	return (
		<div className="min-h-screen">
			<EventsPageClient
				initialEvents={eventsResult.events as TawnyEventData[]}
				initialOrganizers={organizersResult.organizers as TawnyOrganizerData[]}
				defaultQuery={q}
				defaultType={type}
			/>
		</div>
	);
}
