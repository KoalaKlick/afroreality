"use client";

import { OrganizerCard, type TawnyOrganizerData } from "@/components/website/events/OrganizerCard";
import { Users } from "lucide-react";

interface OrganizersGridProps {
	readonly organizers: TawnyOrganizerData[];
	readonly loading?: boolean;
}

export function OrganizersGrid({ organizers, loading = false }: OrganizersGridProps) {
	if (loading) {
		return (
			<div className="flex flex-col gap-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<div
						key={i}
						className="animate-pulse p-5 border border-border rounded-xl bg-card flex flex-col sm:flex-row gap-4 shadow-none"
					>
						<div className="w-full sm:w-[180px] aspect-[16/10] sm:aspect-[4/5] bg-muted rounded-lg" />
						<div className="flex-1 space-y-2.5 py-1">
							<div className="h-5 bg-muted rounded w-1/3" />
							<div className="h-3.5 bg-muted rounded w-1/4" />
							<div className="h-px bg-muted" />
							<div className="h-3.5 bg-muted rounded w-3/4" />
							<div className="flex gap-2 pt-1">
								<div className="h-5 bg-muted rounded-md w-16" />
								<div className="h-5 bg-muted rounded-md w-16" />
							</div>
						</div>
					</div>
				))}
			</div>
		);
	}

	if (organizers.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center border border-border rounded-xl">
				<div className="size-12 rounded-lg bg-muted flex items-center justify-center mb-3">
					<Users className="size-6 text-muted-foreground" />
				</div>
				<h3 className="text-base font-semibold mb-1 text-foreground">
					No organizers found
				</h3>
				<p className="text-muted-foreground max-w-sm text-xs">
					We couldn&apos;t find any organizers matching your search. Try adjusting
					your filters or search term.
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-3">
			{organizers.map((organizer) => (
				<OrganizerCard key={organizer.id} organizer={organizer} />
			))}
		</div>
	);
}
