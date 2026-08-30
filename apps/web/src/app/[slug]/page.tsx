import { notFound } from "next/navigation";
import { getPublicOrganizationProfile } from "@/lib/dal/public";
import { getSession } from "@/lib/session";
import { OrgProfileHero } from "@/components/organization/public/OrgProfileHero";
import { EventsSection } from "@/components/Landing/sections/revamp-events";
import { Section } from "@/components/Landing/shared/Section";
import { PanAfricanDivider } from "@/components/shared/PanAficDivider";
import { PoweredByFooter } from "@/components/shared/PoweredByFooter";
import { getOrgImageUrl, getEventImageUrl } from "@/lib/image-url-utils";
import type { Metadata } from "next";

interface OrgProfilePageProps {
	params: Promise<{ slug: string }>;
}

const BASE_URL =
	process.env.NEXT_PUBLIC_APP_URL ||
	process.env.NEXT_PUBLIC_DOMAIN_URL ||
	"https://afroreality.com";

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
		: `${BASE_URL}${bannerImage}`;
	const pageUrl = `${BASE_URL}/${slug}`;
	const description =
		organization.description ||
		`Official profile for ${organization.name} on AfroReality.`;

	return {
		title: `${organization.name} | AfroReality`,
		description,
		openGraph: {
			title: `${organization.name} | AfroReality`,
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
	const uniqueSponsors = Array.from(
		new Map(allSponsors.map((s: any) => [s.name, s])).values(),
	);

	return (
		<main className="min-h-screen bg-background text-foreground flex flex-col">
			{/* Organization Hero Profile */}
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
				isUserAuthenticated={isUserAuthenticated}
				hasPendingRequest={organization.isUserPendingJoin ?? false}
			/>

			<PanAfricanDivider />

			{/* Events Showcase Section */}
			<EventsSection
				title="Our Events."
				useBrand
				items={eventsWithOrg}
			/>

			{/* Organization Sponsors Footer Section */}
			{uniqueSponsors.length > 0 && (
				<>
					<PanAfricanDivider />
					<Section maxWidth="7xl" className="py-12 bg-card/40 border-t">
						<div className="space-y-4">
							<h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
								Partners &amp; Sponsors
							</h3>
							<div className="flex flex-wrap items-center gap-6">
								{uniqueSponsors.map((sponsor: any) => (
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
				</>
			)}

			<PanAfricanDivider />
			<PoweredByFooter />
		</main>
	);
}
