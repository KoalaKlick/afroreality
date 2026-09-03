"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
	Building2,
	Users,
	ArrowRight,
	Globe,
	Mail,
	Phone,
	Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrgImageUrl, getEventImageUrl } from "@/lib/image-url-utils";
import { getSocialPlatform } from "@/lib/utils/event-icons";
import { SocialLinksList } from "@/components/shared/SocialLinksList";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { PanAfricanDivider } from "@/components/shared/PanAficDivider";

interface OrgSidebarCardProps {
	readonly organization: {
		id: string;
		name: string;
		slug: string;
		description: string | null;
		logoUrl: string | null;
		bannerUrl: string | null;
		websiteUrl: string | null;
		contactEmail: string | null;
		phone?: string | null;
		primaryColor?: string;
		secondaryColor?: string;
		tertiaryColor?: string;
		allowJoinRequests?: boolean;
		_count?: {
			members: number;
		};
	};
	readonly socialLinks?: Array<{ id?: string; url: string; platform?: string }>;
	readonly sponsors?: Array<{
		id?: string;
		name: string;
		logoUrl?: string | null;
		logo?: string | null;
	}>;
	readonly isUserAuthenticated?: boolean;
	readonly hasPendingRequest?: boolean;
}

export function OrgSidebarCard({
	organization,
	socialLinks = [],
	sponsors = [],
	isUserAuthenticated = false,
	hasPendingRequest: initialPending = false,
}: OrgSidebarCardProps) {
	const [isPending, startTransition] = useTransition();
	const bannerImageUrl = getOrgImageUrl(organization.bannerUrl);
	const logoImageUrl = getOrgImageUrl(organization.logoUrl);

	const { primaryColor, secondaryColor, tertiaryColor } = organization;

	const handleJoinRequest = async () => {
		if (!isUserAuthenticated) {
			toast.error("Please log in to request joining this organization.");
			window.location.href = `/login?redirect=/${organization.slug}`;
			return;
		}

		startTransition(async () => {
			toast.success(
				"Request sent successfully! The organization admins will review it.",
			);
		});
	};

	const cleanWebsiteUrl = organization.websiteUrl
		? organization.websiteUrl.startsWith("http://") ||
			organization.websiteUrl.startsWith("https://")
			? organization.websiteUrl
			: `https://${organization.websiteUrl}`
		: null;

	return (
		<div className="rounded-2xl border bg-card overflow-hidden flex flex-col">
			{/* Banner */}
			<div className="relative h-36 w-full overflow-hidden bg-muted">
				{bannerImageUrl ? (
					<img
						src={bannerImageUrl}
						alt={organization.name}
						className="w-full h-full object-cover"
					/>
				) : (
					<svg
						viewBox="0 0 1440 260"
						preserveAspectRatio="none"
						className="w-full h-full"
						xmlns="http://www.w3.org/2000/svg"
					>
						<rect
							width="1440"
							height="260"
							fill={primaryColor || "#ca0808"}
							fillOpacity="0.08"
						/>
						<polygon
							points="0,0 520,0 200,260 0,260"
							fill={secondaryColor || "#e88722"}
							fillOpacity="0.85"
						/>
						<polygon
							points="100,0 380,0 260,260 0,180"
							fill={primaryColor || "#ca0808"}
							fillOpacity="0.95"
						/>
						<polygon
							points="0,0 180,0 0,180"
							fill={tertiaryColor || "#53967a"}
							fillOpacity="0.90"
						/>
						<polygon
							points="320,0 640,0 380,260 260,260"
							fill={secondaryColor || "#e88722"}
							fillOpacity="0.35"
						/>
					</svg>
				)}
			</div>

			{/* Profile Info */}
			<div className="p-6 space-y-6">
				{/* Logo & Title */}
				<div className="flex items-start gap-4 -mt-14 relative z-10">
					<div className="size-20 rounded-2xl bg-background p-1 border-4 border-background overflow-hidden shrink-0 flex items-center justify-center shadow-none">
						{logoImageUrl ? (
							<img
								src={logoImageUrl}
								alt={organization.name}
								className="w-full h-full object-cover rounded-xl"
							/>
						) : (
							<div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary rounded-xl">
								<Building2 className="size-8" />
							</div>
						)}
					</div>

					<div className="pt-8 min-w-0 flex-1">
						<h1 className="text-xl font-black uppercase tracking-tight text-foreground truncate">
							{organization.name}
						</h1>
						{/* <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mt-0.5">
							<Users className="size-3.5" />
							<span>{organization._count?.members ?? 0} Members</span>
						</div> */}
					</div>
				</div>

				{/* Join Request Action */}
				{organization.allowJoinRequests && (
					<Button
						size="sm"
						onClick={handleJoinRequest}
						disabled={isPending || initialPending}
						className="w-full font-bold text-xs h-9"
					>
						{initialPending ? "Request Pending" : "Request to Join Organizers"}
						{!initialPending && <ArrowRight className="ml-1.5 size-3.5" />}
					</Button>
				)}

				<PanAfricanDivider />

				{/* About Organization */}
				<div className="space-y-2.5">
					<h3 className="text-xs font-black uppercase tracking-widest text-foreground">
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

				<PanAfricanDivider />

				{/* Contact Details */}
				<div className="space-y-3">
					<h3 className="text-xs font-black uppercase tracking-widest text-foreground">
						Connect with Us.
					</h3>

					<div className="space-y-2 text-xs">
						{cleanWebsiteUrl && (
							<div className="flex items-center gap-2.5 group">
								<Globe className="size-3.5 text-primary shrink-0" />
								<a
									href={cleanWebsiteUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="font-bold hover:text-primary transition-colors truncate"
								>
									{organization.websiteUrl}
								</a>
							</div>
						)}
						{organization.contactEmail && (
							<div className="flex items-center gap-2.5 group">
								<Mail className="size-3.5 text-primary shrink-0" />
								<a
									href={`mailto:${organization.contactEmail}`}
									className="font-bold hover:text-primary transition-colors truncate"
								>
									{organization.contactEmail}
								</a>
							</div>
						)}
						{organization.phone && (
							<div className="flex items-center gap-2.5 group">
								<Phone className="size-3.5 text-primary shrink-0" />
								<a
									href={`tel:${organization.phone}`}
									className="font-bold uppercase tracking-wider hover:text-primary transition-colors"
								>
									{organization.phone}
								</a>
							</div>
						)}
					</div>

					{/* Circular SVG Social Badges */}
					{socialLinks.length > 0 && (
						<div className="pt-3 border-t border-dashed">
							<SocialLinksList socialLinks={socialLinks} iconSize="sm" />
						</div>
					)}
				</div>

				{/* Partners / Sponsors */}
				{sponsors.length > 0 && (
					<>
						<PanAfricanDivider />
						<div className="space-y-3">
							<h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
								<Trophy className="size-3.5 text-primary" />
								<span>Our Partners.</span>
							</h3>
							<div className="flex flex-wrap gap-2">
								{sponsors.slice(0, 12).map((sponsor) => {
									const imgKey = sponsor.logoUrl || sponsor.logo;
									const imgUrl = imgKey ? getEventImageUrl(imgKey) : null;
									return (
										<div
											key={sponsor.id || sponsor.name}
											className="size-8 p-1 border rounded-lg bg-card flex items-center justify-center grayscale hover:grayscale-0 transition-all cursor-help"
											title={sponsor.name}
										>
											{imgUrl ? (
												<img
													src={imgUrl}
													alt={sponsor.name}
													className="object-contain max-h-full max-w-full"
												/>
											) : (
												<span className="text-[5px] font-bold text-center leading-none truncate uppercase">
													{sponsor.name}
												</span>
											)}
										</div>
									);
								})}
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
