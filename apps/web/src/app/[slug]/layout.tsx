import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicOrganizationProfile } from "@/lib/dal/public";
import { getOrgImageUrl } from "@/lib/image-url-utils";
import { BrandingSync } from "@/components/providers/BrandingSync";

export const dynamic = "force-dynamic";

interface OrgLayoutProps {
	readonly children: React.ReactNode;
	readonly params: Promise<{ slug: string }>;
}

export async function generateMetadata({
	params,
}: OrgLayoutProps): Promise<Metadata> {
	const { slug } = await params;
	const organization = await getPublicOrganizationProfile(slug);
	if (!organization) return {};

	const faviconUrl =
		getOrgImageUrl(organization.faviconUrl) ||
		getOrgImageUrl(organization.logoUrl);
	if (!faviconUrl) return {};

	return {
		icons: {
			icon: faviconUrl,
			shortcut: faviconUrl,
			apple: faviconUrl,
		},
	};
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
	const { slug } = await params;
	const organization = await getPublicOrganizationProfile(slug);

	if (!organization) {
		notFound();
	}

	return (
		<div className="@container">
			<BrandingSync
				primaryColor={organization.primaryColor}
				secondaryColor={organization.secondaryColor}
				tertiaryColor={organization.tertiaryColor}
			/>
			{children}
		</div>
	);
}
