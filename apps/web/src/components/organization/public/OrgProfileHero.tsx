"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Building2, Users, ArrowRight } from "lucide-react";
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
	isUserAuthenticated,
	hasPendingRequest: initialPending,
}: OrgProfileHeroProps) {
	const [isPending, startTransition] = useTransition();
	const bannerImageUrl = getOrgImageUrl(organization.bannerUrl);
	const logoImageUrl = getOrgImageUrl(organization.logoUrl);

	const { primaryColor, secondaryColor, tertiaryColor } = organization;

	const brandVars = {
		"--color-brand-primary": primaryColor || "#009A44",
		"--color-brand-secondary": secondaryColor || "#FFD100",
		"--color-brand-tertiary": tertiaryColor || "#EF3340",
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

	return (
		<div className="relative" style={brandVars}>
			{/* Banner */}
			<div className="relative h-48 md:h-64 w-full overflow-hidden bg-muted">
				{bannerImageUrl ? (
					<img
						src={bannerImageUrl}
						alt={organization.name}
						className="w-full h-full object-cover"
					/>
				) : (
					<div
						className="w-full h-full"
						style={{
							background: `linear-gradient(135deg, ${primaryColor || "#009A44"}cc 0%, ${secondaryColor || "#FFD100"}99 50%, ${tertiaryColor || "#EF3340"}cc 100%)`,
						}}
					/>
				)}
			</div>

			{/* Profile Info Overlay */}
			<div className="max-w-6xl mx-auto px-4 -mt-12 md:-mt-16 relative z-10">
				<div className="flex flex-col md:flex-row gap-6 items-end md:items-center">
					{/* Logo (No Shadow) */}
					<div className="relative size-24 md:size-32 rounded-2xl bg-card p-2 border border-border overflow-hidden shrink-0 flex items-center justify-center">
						{logoImageUrl ? (
							<img
								src={logoImageUrl}
								alt={organization.name}
								className="w-full h-full object-cover rounded-xl"
							/>
						) : (
							<div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary rounded-xl">
								<Building2 className="size-12" />
							</div>
						)}
					</div>

					{/* Stats & Actions */}
					<div className="flex-1 space-y-2 text-center md:text-left">
						<h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground">
							{organization.name}
						</h1>
						<div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground font-medium">
							<div className="flex items-center gap-1">
								<Users className="size-4" />
								<span>{organization._count.members} Members</span>
							</div>
						</div>
					</div>

					{/* Action Button */}
					{organization.allowJoinRequests && (
						<div className="pb-2 w-full md:w-auto">
							<Button
								size="default"
								onClick={handleJoinRequest}
								disabled={isPending || initialPending}
								className="w-full md:w-auto font-bold text-xs"
							>
								{initialPending
									? "Request Pending"
									: "Request to Join Organizers"}
								{!initialPending && <ArrowRight className="ml-2 size-4" />}
							</Button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
