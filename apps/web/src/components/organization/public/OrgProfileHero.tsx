"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Building2, Globe, Mail, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
	readonly isUserAuthenticated: boolean;
	readonly hasPendingRequest: boolean;
}

export function OrgProfileHero({
	organization,
	isUserAuthenticated,
	hasPendingRequest: initialPending,
}: OrgProfileHeroProps) {
	const [isPending, startTransition] = useTransition();
	const [hasRequested, setHasRequested] = useState(initialPending);
	const bannerImageUrl = getOrgImageUrl(organization.bannerUrl);
	const logoImageUrl = getOrgImageUrl(organization.logoUrl);

	const { primaryColor, secondaryColor, tertiaryColor } = organization;

	const brandVars = {
		"--color-brand-primary": primaryColor,
		"--color-brand-secondary": secondaryColor,
		"--color-brand-tertiary": tertiaryColor,
	} as React.CSSProperties;

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
							background: `linear-gradient(135deg, ${primaryColor}22 0%, ${secondaryColor}22 100%)`,
						}}
					/>
				)}
				<div className="absolute inset-0 bg-linear-to-t from-background via-background/40 to-transparent" />
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
								{organization.websiteUrl && (
									<a
										href={organization.websiteUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-1 hover:text-foreground transition-colors"
									>
										<Globe className="size-3.5" /> Website
									</a>
								)}
								{organization.contactEmail && (
									<a
										href={`mailto:${organization.contactEmail}`}
										className="flex items-center gap-1 hover:text-foreground transition-colors"
									>
										<Mail className="size-3.5" /> Contact
									</a>
								)}
							</div>
						</div>
					</div>

					{/* Action Buttons */}
					{organization.allowJoinRequests && (
						<div className="w-full sm:w-auto">
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

				{organization.description && (
					<p className="mt-4 text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed">
						{organization.description}
					</p>
				)}
			</div>
		</div>
	);
}
