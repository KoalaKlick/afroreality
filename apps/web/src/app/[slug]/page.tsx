import { notFound } from "next/navigation";
import { getPublicOrganizationProfile } from "@/lib/dal/public";
import { getSession } from "@/lib/session";
import { OrgProfileHero } from "@/components/organization/public/OrgProfileHero";
import { OrgDetailsFooter } from "@/components/organization/public/OrgDetailsFooter";
import { OrgEventsListSection } from "@/components/organization/public/OrgEventsListSection";
import { PanAfricanDivider } from "@/components/shared/PanAficDivider";
import { EventCreationCTABanner } from "@/components/shared/EventCreationCTABanner";
import { getOrgImageUrl } from "@/lib/image-url-utils";
import { getFrontendBaseUrl } from "@/lib/utils";
import type { Metadata } from "next";

interface OrgProfilePageProps {
	params: Promise<{ slug: string }>;
}

const FRONTEND_URL = getFrontendBaseUrl();

export async function generateMetadata({
	params,
}: OrgProfilePageProps): Promise<Metadata> {
	const { slug } = await params;
	const organization = await getPublicOrganizationProfile(slug);
	if (!organization) return {};

	const bannerImage =
		getOrgImageUrl(organization.bannerUrl || organization.logoUrl) ??
		"/landing/g.webp";
	const absoluteImage = bannerImage.startsWith("http")
		? bannerImage
		: `${FRONTEND_URL}/${bannerImage.replace(/^\//, "")}`;
	const pageUrl = `${FRONTEND_URL}/${slug}`;
	const description =
		organization.description ||
		`Official profile for ${organization.name} on fextiva.`;

	return {
		title: `${organization.name} | fextiva`,
		description,
		openGraph: {
			title: `${organization.name} | fextiva`,
			description,
			url: pageUrl,
			type: "website",
			images: [
				{
					url: absoluteImage,
					width: 1200,
					height: 630,
					alt: organization.name,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title: organization.name,
			description,
			images: [absoluteImage],
		},
	};
}

export default async function OrgProfilePage({ params }: OrgProfilePageProps) {
	const { slug } = await params;
	const organization = await getPublicOrganizationProfile(slug);

	if (!organization) {
		notFound();
	}

	const session = await getSession();
	const isUserAuthenticated = !!session?.userId;

	const rawEvents = organization.events || [];
	const eventsWithOrg = rawEvents.map((e: any) => ({
		...e,
		organization: {
			slug: organization.slug,
			name: organization.name,
		},
	}));

	// Collect unique sponsors from organization events
	const allSponsors = rawEvents.flatMap((e: any) => e.sponsors || []);
	const uniqueSponsors: Array<{
		id?: string;
		name: string;
		logoUrl?: string | null;
	}> = Array.from(new Map(allSponsors.map((s: any) => [s.name, s])).values()) as any;

	// Collect unique social links from organization and organization events
	const orgSocialLinks = organization.socialLinks || [];
	const eventSocialLinks = rawEvents.flatMap((e: any) => e.socialLinks || []);
	const combinedSocialLinks = [...orgSocialLinks, ...eventSocialLinks];
	const uniqueSocialLinks = Array.from(
		new Map(combinedSocialLinks.map((s: any) => [s.url, s])).values(),
	) as any[];

	const { primaryColor, secondaryColor, tertiaryColor } = organization;

	const brandVars = {
		"--color-brand-primary": primaryColor || "#009A44",
		"--color-brand-secondary": secondaryColor || "#FFD100",
		"--color-brand-tertiary": tertiaryColor || "#EF3340",
	} as React.CSSProperties;

	return (
		<main className="min-h-[100svh] bg-background text-foreground flex flex-col justify-between" style={brandVars}>
			<div className="flex-1 flex flex-col">
				{/* 1. Organization Hero Profile */}
				<OrgProfileHero
					organization={{
						id: organization.id,
						name: organization.name,
						slug: organization.slug,
						description: organization.description,
						logoUrl: organization.logoUrl,
						bannerUrl: organization.bannerUrl,
						websiteUrl: organization.websiteUrl,
						contactEmail: organization.contactEmail,
						primaryColor: organization.primaryColor || "#009A44",
						secondaryColor: organization.secondaryColor || "#FFD100",
						tertiaryColor: organization.tertiaryColor || "#EF3340",
						allowJoinRequests: organization.allowJoinRequests ?? true,
						_count: {
							members: organization._count?.members ?? 0,
						},
					}}
					baseUrl={FRONTEND_URL}
					isUserAuthenticated={isUserAuthenticated}
					hasPendingRequest={organization.isUserPendingJoin ?? false}
				/>

				<PanAfricanDivider />

				{/* 2. Events Showcase Section (with light primary bg) */}
				<div className="flex-1">
					<OrgEventsListSection
						title="Our Events."
						events={eventsWithOrg}
						organizationSlug={slug}
					/>
				</div>

				{/* 3. Organization Details Footer (Our Partners, About Org, Connect with Us) */}
				<OrgDetailsFooter
					organization={{
						id: organization.id,
						name: organization.name,
						description: organization.description,
						websiteUrl: organization.websiteUrl,
						contactEmail: organization.contactEmail,
						phone: organization.phone,
						socialLinks: uniqueSocialLinks,
						primaryColor: organization.primaryColor,
					}}
					sponsors={uniqueSponsors}
				/>
			</div>

			{/* 4. CTA Banner & Brand Footer */}
			<EventCreationCTABanner orgSlug={slug} />
		</main>
	);
}
