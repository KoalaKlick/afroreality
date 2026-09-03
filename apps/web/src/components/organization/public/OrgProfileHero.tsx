"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
	Building2,
	Calendar,
	ArrowRight,
	Share2,
	Globe,
	Mail,
	Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrgImageUrl } from "@/lib/image-url-utils";
import { getSocialPlatform } from "@/lib/utils/event-icons";
import { shareEvent } from "@/lib/utils/share-utils";
import { requestToJoinOrganization } from "@/lib/server-functions/organization-join";

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
	const [hasPendingRequest, setHasPendingRequest] = useState(initialPending);
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
			try {
				const res = await requestToJoinOrganization({
					organizationId: organization.id,
				});
				if (res.success) {
					setHasPendingRequest(true);
					toast.success(
						"Request sent successfully! The organization admins will review it.",
					);
				} else {
					toast.error(res.error || "Failed to send request.");
				}
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Failed to send request.",
				);
			}
		});
	};

	const handleShare = () => {
		shareEvent({
			title: organization.name,
			description: `Check out ${organization.name} on fextiva!`,
			url: window.location.href,
		});
	};

	const socialLinks = organization.socialLinks || [];
	const eventsCount = organization.eventsCount ?? 0;
	const cleanWebsiteUrl = organization.websiteUrl
		? organization.websiteUrl.startsWith("http://") ||
			organization.websiteUrl.startsWith("https://")
			? organization.websiteUrl
			: `https://${organization.websiteUrl}`
		: null;

	return (
		<div className="relative w-full" style={brandVars}>
			{/* Full-width Banner */}
			<div className="relative h-48 md:h-64 w-full overflow-hidden bg-muted/30">
				{bannerImageUrl ? (
					<img
						src={bannerImageUrl}
						alt={organization.name}
						className="w-full h-full object-cover"
					/>
				) : (
					/* Diagonal Geometric SVG Box on left with organization colors */
					<svg
						viewBox="0 0 1440 260"
						preserveAspectRatio="none"
						className="w-full h-full"
						xmlns="http://www.w3.org/2000/svg"
					>
						{/* Soft light tinted backdrop with primary tint */}
						<rect
							width="1440"
							height="260"
							fill={primaryColor || "#ca0808"}
							fillOpacity="0.08"
						/>

						{/* Diagonal Polygon 1: Secondary Color */}
						<polygon
							points="0,0 520,0 200,260 0,260"
							fill={secondaryColor || "#e88722"}
							fillOpacity="0.85"
						/>

						{/* Diagonal Polygon 2: Primary Color */}
						<polygon
							points="100,0 380,0 260,260 0,180"
							fill={primaryColor || "#ca0808"}
							fillOpacity="0.95"
						/>

						{/* Diagonal Polygon 3: Tertiary Color corner */}
						<polygon
							points="0,0 180,0 0,180"
							fill={tertiaryColor || "#53967a"}
							fillOpacity="0.90"
						/>

						{/* Accent Diagonal Band */}
						<polygon
							points="320,0 640,0 380,260 260,260"
							fill={secondaryColor || "#e88722"}
							fillOpacity="0.35"
						/>
					</svg>
				)}
			</div>

			{/* Profile Info Overlay (Full Width Container, matching original arrangement) */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 md:-mt-16 relative z-10 pb-6">
				<div className="flex flex-col md:flex-row gap-6 items-start md:items-end justify-between">
					{/* Left: Logo & Details */}
					<div className="flex flex-col sm:flex-row gap-5 items-start sm:items-end">
						{/* Logo (No Shadow) */}
						<div className="relative size-24 md:size-32 rounded-2xl bg-card p-2 border border-border overflow-hidden shrink-0 flex items-center justify-center shadow-none">
							{logoImageUrl ? (
								<img
									src={logoImageUrl}
									alt={organization.name}
									className="w-full h-full object-cover rounded-xl"
								/>
							) : (
								<div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary rounded-xl font-bold text-3xl font-millik">
									{getInitials(organization.name)}
								</div>
							)}
						</div>

						{/* Name, Handle, & Metadata */}
						<div className="space-y-1">
							<h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground font-millik">
								{organization.name}
							</h1>
							<div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-muted-foreground font-medium">
								<span className="text-foreground/90 font-semibold">@{organization.slug}</span>
								{eventsCount > 0 && (
									<>
										<span>•</span>
										<div className="flex items-center gap-1">
											<Calendar className="size-3.5 text-primary" />
											<span>{eventsCount} Events</span>
										</div>
									</>
								)}
								{organization.contactEmail && (
									<>
										<span>•</span>
										<a
											href={`mailto:${organization.contactEmail}`}
											className="flex items-center gap-1 hover:text-primary transition-colors"
											title={organization.contactEmail}
										>
											<Mail className="size-3.5 text-primary" />
											<span className="truncate max-w-[140px] sm:max-w-[200px]">
												{organization.contactEmail}
											</span>
										</a>
									</>
								)}
								{organization.phone && (
									<>
										<span>•</span>
										<a
											href={`tel:${organization.phone}`}
											className="flex items-center gap-1 hover:text-primary transition-colors"
										>
											<Phone className="size-3.5 text-primary" />
											<span>{organization.phone}</span>
										</a>
									</>
								)}
								{cleanWebsiteUrl && (
									<>
										<span>•</span>
										<a
											href={cleanWebsiteUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center gap-1 hover:text-primary transition-colors"
											title={organization.websiteUrl || ""}
										>
											<Globe className="size-3.5 text-primary" />
											<span className="truncate max-w-[140px] sm:max-w-[180px]">
												{cleanWebsiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
											</span>
										</a>
									</>
								)}
							</div>
						</div>
					</div>

					{/* Right: Organization Social Media Handles & Action Buttons */}
					<div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end pt-2 md:pt-0">
						{/* Social Media Handles */}
						{socialLinks.length > 0 && (
							<div className="flex items-center gap-1.5 pr-1">
								{socialLinks.map((link) => {
									const plat = getSocialPlatform(link.url, "size-4");
									const titleName = link.platform || plat.name || "Social Link";

									return (
										<a
											key={link.id || link.url}
											href={link.url}
											target="_blank"
											rel="noopener noreferrer"
											className="size-9 rounded-lg border border-border bg-card hover:bg-muted flex items-center justify-center transition-colors shadow-none text-foreground hover:text-primary"
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
							className="h-9 px-3.5 rounded-lg text-xs font-semibold border-border hover:border-primary/50 hover:text-primary shadow-none"
						>
							<Share2 className="size-3.5 mr-1.5" />
							Share
						</Button>

						{/* Join Organizers Action Button */}
						{organization.allowJoinRequests && (
							<Button
								size="sm"
								onClick={handleJoinRequest}
								disabled={isPending || hasPendingRequest}
								className="h-9 px-4 rounded-lg font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-none"
							>
								{hasPendingRequest
									? "Request Pending"
									: "Request to Join Organizers"}
								{!hasPendingRequest && <ArrowRight className="ml-1.5 size-4" />}
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
