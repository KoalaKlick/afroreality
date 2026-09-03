"use client";

import Link from "next/link";
import { OrganizerCard, type TawnyOrganizerData } from "@/components/website/events/OrganizerCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";

interface OrganizersGridProps {
	readonly organizers: TawnyOrganizerData[];
	readonly loading?: boolean;
	readonly onReset?: () => void;
	readonly hasActiveFilters?: boolean;
}

export function OrganizersGrid({
	organizers,
	loading = false,
	onReset,
	hasActiveFilters = false,
}: OrganizersGridProps) {
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
			<div className="border border-border rounded-2xl bg-card/30 p-6 sm:p-12">
				<EmptyState
					variant="users"
					svgClassName="w-40 h-40 sm:w-48 sm:h-48 mb-4"
					title="No Organizers Found"
					description={
						hasActiveFilters
							? "We couldn't find any organizers matching your search keyword. Try adjusting your query."
							: "There are currently no public organizations available. Create an organization to start hosting events!"
					}
					action={
						hasActiveFilters && onReset ? (
							<Button
								variant="outline"
								size="sm"
								onClick={onReset}
								className="rounded-lg text-xs font-semibold shadow-none hover:border-primary/50 hover:text-primary"
							>
								Clear Search
							</Button>
						) : (
							<Button
								asChild
								size="sm"
								className="rounded-lg text-xs font-semibold shadow-none"
							>
								<Link href="/organization/manage">Register Organization</Link>
							</Button>
						)
					}
				/>
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
