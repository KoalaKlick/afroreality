import { Section } from "@/components/Landing/shared/Section";
import { getEventImageUrl } from "@/lib/image-url-utils";

interface OrgProfileSponsorsProps {
	readonly sponsors: Array<{
		id?: string;
		name: string;
		logoUrl?: string | null;
	}>;
}

export function OrgProfileSponsors({ sponsors }: OrgProfileSponsorsProps) {
	if (!sponsors || sponsors.length === 0) return null;

	return (
		<Section maxWidth="7xl" className="py-12 bg-card/40 border-t">
			<div className="space-y-4">
				<h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
					Partners &amp; Sponsors
				</h3>
				<div className="flex flex-wrap items-center gap-6">
					{sponsors.map((sponsor) => (
						<div
							key={sponsor.id || sponsor.name}
							className="flex items-center gap-2 px-3.5 py-2 rounded-xl border bg-background shadow-xs text-xs font-semibold"
						>
							{sponsor.logoUrl ? (
								<img
									src={getEventImageUrl(sponsor.logoUrl)}
									alt={sponsor.name}
									className="h-6 w-auto object-contain"
								/>
							) : (
								<span>{sponsor.name}</span>
							)}
						</div>
					))}
				</div>
			</div>
		</Section>
	);
}
