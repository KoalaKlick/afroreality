"use client";

import { Globe, Mail, Phone, Trophy } from "lucide-react";
import { Section } from "@/components/Landing/shared/Section";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { getSocialPlatform } from "@/lib/utils/event-icons";
import { RichTextDisplay } from "@/components/ui/rich-text-display";

interface OrgDetailsFooterProps {
	readonly organization: {
		id: string;
		name: string;
		description: string | null;
		websiteUrl: string | null;
		contactEmail: string | null;
		phone?: string | null;
		socialLinks?: Array<{ id?: string; url: string; platform?: string }>;
		primaryColor?: string;
	};
	readonly sponsors?: Array<{
		id?: string;
		name: string;
		logoUrl?: string | null;
		logo?: string | null;
	}>;
}

export function OrgDetailsFooter({
	organization,
	sponsors = [],
}: OrgDetailsFooterProps) {
	// Normalize website URL
	const cleanWebsiteUrl = organization.websiteUrl
		? organization.websiteUrl.startsWith("http://") ||
			organization.websiteUrl.startsWith("https://")
			? organization.websiteUrl
			: `https://${organization.websiteUrl}`
		: null;

	return (
		<Section maxWidth="7xl" className="py-12 bg-card/40 border-t">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-16">
				{/* Column 1: Our Partners (Aggregated from events) */}
				<div className="space-y-6">
					<h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
						<Trophy className="size-5 text-primary" />
						Our Partners.
					</h3>
					{sponsors.length > 0 ? (
						<div className="flex flex-wrap gap-2.5">
							{sponsors.slice(0, 15).map((sponsor) => {
								const imgKey = sponsor.logoUrl || sponsor.logo;
								const imgUrl = imgKey ? getEventImageUrl(imgKey) : null;
								return (
									<div
										key={sponsor.id || sponsor.name}
										className="size-10 p-1.5 border rounded-lg bg-card flex items-center justify-center grayscale hover:grayscale-0 transition-all cursor-help shadow-xs"
										title={sponsor.name}
									>
										{imgUrl ? (
											<img
												src={imgUrl}
												alt={sponsor.name}
												className="object-contain max-h-full max-w-full"
											/>
										) : (
											<span className="text-[6px] font-bold text-center leading-none truncate uppercase tracking-tighter">
												{sponsor.name}
											</span>
										)}
									</div>
								);
							})}
						</div>
					) : (
						<p className="text-xs text-muted-foreground italic leading-relaxed">
							Partnering with leading brands for event excellence.
						</p>
					)}
				</div>

				{/* Column 2: About Organization */}
				<div className="space-y-6">
					<h3 className="text-xl font-black uppercase tracking-tight">
						About {organization.name}.
					</h3>
					<div className="text-xs text-muted-foreground leading-relaxed">
						{organization.description ? (
							<RichTextDisplay content={organization.description} />
						) : (
							<p className="italic text-muted-foreground/60">
								Dedicated to delivering exceptional events and fostering
								community engagement through innovation and excellence.
							</p>
						)}
					</div>
				</div>

				{/* Column 3: Connect with Us (Contacts & Socials) */}
				<div className="space-y-8">
					<h3 className="text-xl font-black uppercase tracking-tight">
						Connect with Us.
					</h3>
					<div className="space-y-4">
						{cleanWebsiteUrl && (
							<div className="flex items-center gap-3 group">
								<Globe className="size-4 text-primary group-hover:scale-110 transition-transform shrink-0" />
								<a
									href={cleanWebsiteUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="text-xs font-bold tracking-widest hover:text-primary transition-colors truncate"
								>
									{organization.websiteUrl}
								</a>
							</div>
						)}
						{organization.contactEmail && (
							<div className="flex items-center gap-3 group">
								<Mail className="size-4 text-primary group-hover:scale-110 transition-transform shrink-0" />
								<a
									href={`mailto:${organization.contactEmail}`}
									className="text-xs font-bold tracking-widest hover:text-primary transition-colors truncate"
								>
									{organization.contactEmail}
								</a>
							</div>
						)}
						{organization.phone && (
							<div className="flex items-center gap-3 group">
								<Phone className="size-4 text-primary group-hover:scale-110 transition-transform shrink-0" />
								<a
									href={`tel:${organization.phone}`}
									className="text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors"
								>
									{organization.phone}
								</a>
							</div>
						)}
					</div>

					{/* Dedicated Social Links */}
					{organization.socialLinks && organization.socialLinks.length > 0 && (
						<div className="pt-6 border-t border-dashed flex flex-wrap gap-2">
							{organization.socialLinks.map((link) => (
								<a
									key={link.id || link.url}
									href={link.url}
									target="_blank"
									rel="noopener noreferrer"
									className="size-10 rounded-full border bg-card flex items-center justify-center hover:bg-primary/10 hover:border-primary hover:text-primary transition-all shadow-xs"
									title={link.url}
								>
									<div className="size-5 flex items-center justify-center">
										{getSocialPlatform(link.url, "size-full").icon}
									</div>
								</a>
							))}
						</div>
					)}
				</div>
			</div>
		</Section>
	);
}
