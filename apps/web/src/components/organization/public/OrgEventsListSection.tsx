"use client";

import Link from "next/link";
import { EventCard, type TawnyEventData } from "@/components/website/events/EventCard";
import { Section } from "@/components/Landing/shared/Section";
import { NoEventsIllustration } from "@/components/common/NoEventsIllustration";

interface OrgEventsListSectionProps {
	readonly title?: string;
	readonly events: TawnyEventData[];
	readonly organizationSlug: string;
}

export function OrgEventsListSection({
	title = "Our Events.",
	events = [],
	organizationSlug,
}: OrgEventsListSectionProps) {
	if (events.length === 0) {
		return (
			<Section
				id="events"
				className="py-16 md:py-20"
				style={{
					backgroundColor:
						"color-mix(in srgb, var(--color-brand-primary, #009A44) 3.5%, transparent)",
				}}
			>
				<h2 className="text-3xl md:text-5xl font-black text-center uppercase mb-12 tracking-tight font-millik">
					{title}
				</h2>
				<div className="flex flex-col items-center justify-center text-center py-8">
					<NoEventsIllustration className="w-60 h-auto mb-6" />
					<p className="text-lg font-bold text-foreground">No events yet.</p>
					<p className="text-sm text-muted-foreground mt-1">
						Check back soon for upcoming events from this organization.
					</p>
				</div>
			</Section>
		);
	}

	return (
		<Section
			id="events"
			className="py-16 md:py-20 @container overflow-hidden transition-colors "
			style={{
				backgroundColor:
					"color-mix(in srgb, var(--color-brand-primary, #009A44) 3.5%, transparent)",
			}}
		>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<h2 className="text-3xl md:text-5xl font-black text-center uppercase mb-12 md:mb-16 tracking-tight font-millik">
					{title}
				</h2>

				{/* Responsive grid using the same EventCard as events/landing pages */}
				<div className="grid grid-cols-1 @lg:grid-cols-2 @2xl:grid-cols-3 @6xl:grid-cols-4 gap-5 lg:gap-6">
					{events.map((event) => (
						<Link
							key={event.id}
							href={`/${organizationSlug}/event/${event.slug}`}
							className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
						>
							<EventCard event={event} />
						</Link>
					))}
				</div>
			</div>
		</Section>
	);
}
