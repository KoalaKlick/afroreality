"use client";

import { Section } from "../Section";

interface LandingStatsProps {
	readonly stats?: {
		totalEvents?: number;
		totalOrganizers?: number;
		totalTicketsSold?: number;
		totalVotes?: number;
	};
}

export function LandingStats({ stats }: LandingStatsProps) {
	const totalEvents = stats?.totalEvents ?? 120;
	const totalTicketsSold = stats?.totalTicketsSold ?? 55600;
	const totalVotes = stats?.totalVotes ?? 24500;

	return (
		<Section id="stats" class="mt-16 md:mt-20">
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mx-auto bg-card rounded-xl p-8 sm:p-10 border border-border text-center shadow-none">
				<div className="space-y-1">
					<div className="text-3xl sm:text-4xl font-black tracking-tight text-primary font-millik">
						{totalEvents}+
					</div>
					<div className="font-semibold text-xs sm:text-sm text-foreground">
						Events Created Across Africa
					</div>
					<p className="text-[11px] text-muted-foreground">
						Concerts, festivals &amp; pageants
					</p>
				</div>

				<div className="space-y-1 border-y sm:border-y-0 sm:border-x border-border py-4 sm:py-0">
					<div className="text-3xl sm:text-4xl font-black tracking-tight text-primary font-millik">
						{totalTicketsSold > 1000
							? `${(totalTicketsSold / 1000).toFixed(0)}K+`
							: `${totalTicketsSold}+`}
					</div>
					<div className="font-semibold text-xs sm:text-sm text-foreground">
						Digital Tickets Sold
					</div>
					<p className="text-[11px] text-muted-foreground">
						Via Mobile Money &amp; cards
					</p>
				</div>

				<div className="space-y-1">
					<div className="text-3xl sm:text-4xl font-black tracking-tight text-primary font-millik">
						{totalVotes > 1000
							? `${(totalVotes / 1000).toFixed(0)}K+`
							: `${totalVotes}+`}
					</div>
					<div className="font-semibold text-xs sm:text-sm text-foreground">
						Live Audience Votes
					</div>
					<p className="text-[11px] text-muted-foreground">
						Online &amp; offline via *928#
					</p>
				</div>
			</div>
		</Section>
	);
}
