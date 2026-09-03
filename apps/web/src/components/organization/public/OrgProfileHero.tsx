"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
	Calendar,
	Users,
	Globe,
	Mail,
	Check,
	ArrowRight,
	Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrgImageUrl } from "@/lib/image-url-utils";
import { getSocialPlatform } from "@/lib/utils/event-icons";
import { shareEvent } from "@/lib/utils/share-utils";

interface OrgProfileHeroProps {
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
		primaryColor: string;
		secondaryColor: string;
		tertiaryColor: string;
		allowJoinRequests: boolean;
		socialLinks?: Array<{ id?: string; url: string; platform?: string }>;
		eventsCount?: number;
		_count: {
			members: number;
		};
	};
	readonly baseUrl?: string;
	readonly isUserAuthenticated: boolean;
	readonly hasPendingRequest: boolean;
}

function getInitials(name: string): string {
	return name
		.split(" ")
		.map((w) => w[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
}

export function OrgProfileHero({
	organization,
	isUserAuthenticated,
	hasPendingRequest: initialPending,
}: OrgProfileHeroProps) {
	const [isPending, startTransition] = useTransition();
	const bannerImageUrl = getOrgImageUrl(organization.bannerUrl);
	const logoImageUrl = getOrgImageUrl(organization.logoUrl);

	const { primaryColor, secondaryColor, tertiaryColor } = organization;

	const brandVars = {
		"--color-brand-primary": primaryColor || "#ca0808",
		"--color-brand-secondary": secondaryColor || "#e88722",
		"--color-brand-tertiary": tertiaryColor || "#53967a",
	} as React.CSSProperties;

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

	const handleShare = () => {
		shareEvent({
			title: organization.name,
			description: `Check out ${organization.name} on fextiva!`,
			url: window.location.href,
		});
	};

	const cleanWebsiteUrl = organization.websiteUrl
		? organization.websiteUrl.startsWith("http://") ||
			organization.websiteUrl.startsWith("https://")
			? organization.websiteUrl
			: `https://${organization.websiteUrl}`
		: null;

	const socialLinks = organization.socialLinks || [];
	const eventsCount = organization.eventsCount ?? 0;
	const membersCount = organization._count?.members ?? 0;

	return (
		<div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8" style={brandVars}>
			{/* Profile Header Outer Card (Preline Clean Style) */}
			<div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-none">
				{/* Banner */}
				<div className="relative h-44 sm:h-56 md:h-64 w-full rounded-xl overflow-hidden bg-muted/40 border border-border/40 shadow-none">
					{bannerImageUrl ? (
						<img
							src={bannerImageUrl}
							alt={organization.name}
							className="w-full h-full object-cover"
						/>
					) : (
						/* Diagonal Geometric SVG Box pattern using Organization Brand Colors */
						<svg
							viewBox="0 0 1200 300"
							preserveAspectRatio="none"
							className="w-full h-full"
							xmlns="http://www.w3.org/2000/svg"
						>
							{/* Soft light tinted backdrop */}
							<rect
								width="1200"
								height="300"
								fill={primaryColor || "#ca0808"}
								fillOpacity="0.08"
							/>

							{/* Diagonal Polygon 1: Secondary Brand Color */}
							<polygon
								points="0,0 420,0 160,300 0,300"
								fill={secondaryColor || "#e88722"}
								fillOpacity="0.85"
							/>

							{/* Diagonal Polygon 2: Primary Brand Color overlapping */}
							<polygon
								points="80,0 300,0 200,300 0,200"
								fill={primaryColor || "#ca0808"}
								fillOpacity="0.95"
							/>

							{/* Diagonal Polygon 3: Tertiary Brand Color corner accent */}
							<polygon
								points="0,0 160,0 0,160"
								fill={tertiaryColor || "#53967a"}
								fillOpacity="0.90"
							/>

							{/* Accent Diagonal Band */}
							<polygon
								points="260,0 520,0 320,300 220,300"
								fill={secondaryColor || "#e88722"}
								fillOpacity="0.35"
							/>
						</svg>
					)}
				</div>

				{/* Centered Profile Avatar */}
				<div className="relative -mt-14 sm:-mt-16 flex flex-col items-center z-10 px-4">
					<div className="relative size-28 sm:size-32 rounded-full border-4 border-card bg-card overflow-hidden flex items-center justify-center shadow-none">
						{logoImageUrl ? (
							<img
								src={logoImageUrl}
								alt={organization.name}
								className="size-full object-cover"
							/>
						) : (
							<div
								className="size-full flex items-center justify-center font-bold text-3xl sm:text-4xl font-millik"
								style={{
									backgroundColor: `${primaryColor || "#ca0808"}15`,
									color: primaryColor || "#ca0808",
								}}
							>
								{getInitials(organization.name)}
							</div>
						)}

						{/* Verified Badge */}
						<div
							className="absolute bottom-1 right-1 size-7 rounded-full text-white flex items-center justify-center border-2 border-card shadow-none"
							style={{ backgroundColor: primaryColor || "#ca0808" }}
							title="Verified African Organizer"
						>
							<Check className="size-3.5 stroke-[3]" />
						</div>
					</div>

					{/* Name & Slug */}
					<h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground font-millik mt-3 text-center">
						{organization.name}
					</h1>

					<p className="text-xs sm:text-sm text-muted-foreground text-center font-medium mt-0.5">
						@{organization.slug}
					</p>

					{organization.description && (
						<p className="text-xs sm:text-sm text-muted-foreground text-center max-w-xl mx-auto mt-2 line-clamp-2 leading-relaxed">
							{organization.description}
						</p>
					)}
				</div>

				{/* Divider line */}
				<div className="h-px bg-border my-5 sm:my-6" />

				{/* Bottom Bar: Left Tabs/Badges + Right Social Handles & Actions */}
				<div className="flex flex-col md:flex-row items-center justify-between gap-4">
					{/* Left: Organization Meta Tabs / Links */}
					<div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
						<div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/40 text-xs font-semibold text-foreground shadow-none">
							<Calendar className="size-3.5 text-primary" />
							<span>{eventsCount} Events</span>
						</div>

						<div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/40 text-xs font-semibold text-foreground shadow-none">
							<Users className="size-3.5 text-primary" />
							<span>{membersCount} Members</span>
						</div>

						{cleanWebsiteUrl && (
							<a
								href={cleanWebsiteUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground hover:text-primary transition-colors shadow-none"
							>
								<Globe className="size-3.5 text-primary" />
								<span>Website</span>
							</a>
						)}

						{organization.contactEmail && (
							<a
								href={`mailto:${organization.contactEmail}`}
								className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground hover:text-primary transition-colors shadow-none"
							>
								<Mail className="size-3.5 text-primary" />
								<span>Email</span>
							</a>
						)}
					</div>

					{/* Right: Social Media Handles & Action Buttons (Where unfollow is in the screenshot) */}
					<div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5">
						{/* Social Media Handles */}
						{socialLinks.length > 0 && (
							<div className="flex items-center gap-1.5 pr-1">
								{socialLinks.map((link) => {
									const plat = getSocialPlatform(link.url, "size-3.5");
									const titleName = link.platform || plat.name || "Social Link";

									return (
										<a
											key={link.id || link.url}
											href={link.url}
											target="_blank"
											rel="noopener noreferrer"
											className="size-8 rounded-lg border border-border bg-background hover:bg-muted flex items-center justify-center transition-colors shadow-none hover:border-primary/50 text-foreground hover:text-primary"
											title={titleName}
										>
											<div className="flex items-center justify-center">
												{plat.icon}
											</div>
										</a>
									);
								})}
							</div>
						)}

						{/* Share Button */}
						<Button
							variant="outline"
							size="sm"
							onClick={handleShare}
							className="h-8 px-3 rounded-lg text-xs font-semibold border-border hover:border-primary/50 hover:text-primary shadow-none"
						>
							<Share2 className="size-3.5 mr-1.5" />
							Share
						</Button>

						{/* Join / Action Button */}
						{organization.allowJoinRequests && (
							<Button
								size="sm"
								onClick={handleJoinRequest}
								disabled={isPending || initialPending}
								className="h-8 px-4 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-none"
							>
								{initialPending ? "Request Pending" : "Join Organizers"}
								{!initialPending && <ArrowRight className="ml-1.5 size-3.5" />}
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
