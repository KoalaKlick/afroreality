import { NoEventsIllustration } from "@/components/common/NoEventsIllustration";
import { notFound } from "next/navigation";
import { getPublicOrganizationProfile } from "@/lib/dal/public";
import { getSession } from "@/lib/session";
import { OrgProfileHero } from "@/components/organization/public/OrgProfileHero";
import { PublicEventCard } from "@/components/organization/public/PublicEventCard";
import { PanAfricanDivider } from "@/components/shared/PanAficDivider";
import { PoweredByFooter } from "@/components/shared/PoweredByFooter";
import { Calendar, Trophy } from "lucide-react";
import { getOrgImageUrl } from "@/lib/image-url-utils";
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

	const events = organization.events || [];
	const now = new Date();
	const upcomingEvents = events.filter(
		(e: any) => !e.endDate || new Date(e.endDate) >= now,
	);
	const pastEvents = events.filter(
		(e: any) => e.endDate && new Date(e.endDate) < now,
	);

	return (
		<div className="min-h-screen bg-background text-foreground flex flex-col">
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

			{/* Events Showcase */}
			<main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
				{/* Upcoming & Live Events */}
				<section className="space-y-6">
					<div className="flex items-center justify-between border-b pb-3">
						<div className="flex items-center gap-2">
							<Calendar className="size-5 text-primary" />
							<h2 className="text-xl font-bold tracking-tight text-foreground">
								Live &amp; Upcoming Events
							</h2>
						</div>
						<span className="text-xs text-muted-foreground font-semibold">
							{upcomingEvents.length}{" "}
							{upcomingEvents.length === 1 ? "Event" : "Events"}
						</span>
					</div>

					{upcomingEvents.length === 0 ? (
						<div className="text-center py-12 px-4 rounded-2xl border border-dashed bg-card/40 flex flex-col items-center justify-center">
<NoEventsIllustration className="size-48 mb-4 opacity-80" />
							<h4 className="font-semibold text-sm">No Upcoming Events</h4>
							<p className="text-xs text-muted-foreground mt-1">
								Check back soon or follow this organization for upcoming
								announcements.
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
							{upcomingEvents.map((event: any) => (
								<PublicEventCard
									key={event.id}
									event={event}
									organizationSlug={organization.slug}
								/>
							))}
						</div>
					)}
				</section>

				{/* Past Events */}
				{pastEvents.length > 0 && (
					<section className="space-y-6 pt-6 border-t">
						<div className="flex items-center justify-between border-b pb-3">
							<div className="flex items-center gap-2">
								<Trophy className="size-5 text-muted-foreground" />
								<h2 className="text-xl font-bold tracking-tight text-foreground">
									Past Events
								</h2>
							</div>
							<span className="text-xs text-muted-foreground font-semibold">
								{pastEvents.length}{" "}
								{pastEvents.length === 1 ? "Event" : "Events"}
							</span>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 opacity-85">
							{pastEvents.map((event: any) => (
								<PublicEventCard
									key={event.id}
									event={event}
									organizationSlug={organization.slug}
								/>
							))}
						</div>
					</section>
				)}
			</main>

			<PanAfricanDivider className="my-10" />
			<PoweredByFooter />
		</div>
	);
}
