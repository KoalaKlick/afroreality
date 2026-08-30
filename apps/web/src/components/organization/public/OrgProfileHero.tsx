"use client";

import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
	Building2,
	Globe,
	Mail,
	Users,
	ArrowRight,
	CheckCircle2,
	Share2,
	ExternalLink,
	Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrgImageUrl } from "@/lib/image-url-utils";

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
		primaryColor: string;
		secondaryColor: string;
		tertiaryColor: string;
		allowJoinRequests: boolean;
		_count: {
			members: number;
		};
	};
	readonly baseUrl?: string;
	readonly isUserAuthenticated: boolean;
	readonly hasPendingRequest: boolean;
}

export function OrgProfileHero({
	organization,
	baseUrl = "https://afroreality.com",
	isUserAuthenticated,
	hasPendingRequest: initialPending,
}: OrgProfileHeroProps) {
	const [isPending, startTransition] = useTransition();
	const [hasRequested, setHasRequested] = useState(initialPending);
	const bannerImageUrl = getOrgImageUrl(organization.bannerUrl);
	const logoImageUrl = getOrgImageUrl(organization.logoUrl);

	const { primaryColor, secondaryColor, tertiaryColor } = organization;

	const brandVars = {
		"--color-brand-primary": primaryColor || "#009A44",
		"--color-brand-secondary": secondaryColor || "#FFD100",
		"--color-brand-tertiary": tertiaryColor || "#EF3340",
	} as React.CSSProperties;

	// Normalize website URL to ensure it is always clickable with http/https
	const cleanWebsiteUrl = organization.websiteUrl
		? organization.websiteUrl.startsWith("http://") ||
			organization.websiteUrl.startsWith("https://")
			? organization.websiteUrl
			: `https://${organization.websiteUrl}`
		: null;

	const publicOrgUrl = `${baseUrl.replace(/\/$/, "")}/${organization.slug}`;

	const handleCopyOrgLink = async () => {
		if (navigator.clipboard) {
			await navigator.clipboard.writeText(publicOrgUrl);
			toast.success("Organization link copied to clipboard!");
		}
	};

	const handleJoinRequest = async () => {
		if (!isUserAuthenticated) {
			toast.info("Please log in or register to join this organization.");
			window.location.href = `/login?redirect=/${organization.slug}`;
			return;
		}

		startTransition(async () => {
			setHasRequested(true);
			toast.success(
				"Join request sent! The organization admins will review your request.",
			);
		});
	};

	return (
		<div className="relative" style={brandVars}>
			{/* Banner */}
			<div className="relative h-48 sm:h-64 md:h-80 w-full overflow-hidden bg-muted">
				{bannerImageUrl ? (
					<img
						src={bannerImageUrl}
						alt={`${organization.name} banner`}
						className="size-full object-cover"
					/>
				) : (
					<div
						className="size-full"
						style={{
							background: `linear-gradient(135deg, ${primaryColor || "#009A44"}22 0%, ${secondaryColor || "#FFD100"}22 100%)`,
						}}
					/>
				)}
				<div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
			</div>

			{/* Profile Info Row */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="relative -mt-16 sm:-mt-20 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pb-6 border-b border-border/80">
					<div className="flex items-end gap-4 sm:gap-6">
						{/* Logo */}
						<div className="relative size-24 sm:size-32 rounded-2xl bg-card border-4 border-background shadow-xl overflow-hidden shrink-0 flex items-center justify-center">
							{logoImageUrl ? (
								<img
									src={logoImageUrl}
									alt={`${organization.name} logo`}
									className="size-full object-cover"
								/>
							) : (
								<Building2 className="size-10 text-muted-foreground" />
							)}
						</div>

						{/* Names & stats */}
						<div className="space-y-1">
							<h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
								{organization.name}
							</h1>
							<div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-medium">
								<span className="flex items-center gap-1">
									<Users className="size-3.5" />
									{organization._count.members}{" "}
									{organization._count.members === 1 ? "Member" : "Members"}
								</span>

								{cleanWebsiteUrl && (
									<a
										href={cleanWebsiteUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-1 hover:text-primary transition-colors underline-offset-4 hover:underline"
									>
										<Globe className="size-3.5 text-primary" />
										<span>Website</span>
										<ExternalLink className="size-2.5 opacity-60" />
									</a>
								)}

								{organization.contactEmail && (
									<a
										href={`mailto:${organization.contactEmail}`}
										className="flex items-center gap-1 hover:text-primary transition-colors"
									>
										<Mail className="size-3.5 text-primary" />
										<span>{organization.contactEmail}</span>
									</a>
								)}

								{/* Clickable Public Link button */}
								<button
									type="button"
									onClick={handleCopyOrgLink}
									className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/80 hover:bg-muted text-foreground transition-colors cursor-pointer text-[11px] font-mono"
									title="Click to copy organization URL"
								>
									<Share2 className="size-3 text-primary" />
									<span>/{organization.slug}</span>
									<Copy className="size-2.5 opacity-50 ml-0.5" />
								</button>
							</div>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex items-center gap-2 w-full sm:w-auto">
						{organization.allowJoinRequests && (
							<div className="flex-1 sm:flex-initial">
								{hasRequested ? (
									<Button
										variant="outline"
										disabled
										className="w-full sm:w-auto text-xs gap-1.5 font-bold"
									>
										<CheckCircle2 className="size-3.5 text-green-500" />
										Membership Requested
									</Button>
								) : (
									<Button
										onClick={handleJoinRequest}
										disabled={isPending}
										className="w-full sm:w-auto text-xs gap-1.5 font-bold"
									>
										<span>Join Organization</span>
										<ArrowRight className="size-3.5" />
									</Button>
								)}
							</div>
						)}
					</div>
				</div>

				{organization.description && (
					<RichTextDisplay
						content={organization.description}
						className="mt-4 text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed"
					/>
				)}
			</div>
		</div>
	);
}
