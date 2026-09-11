import { notFound } from "next/navigation";
import { getPublicOrganizationProfile } from "@/lib/dal/public";
import { BrandingSync } from "@/components/providers/BrandingSync";
import { PaymentConfirmationModal } from "@/components/event/public/PaymentConfirmationModal";

export const dynamic = "force-dynamic";

interface OrgLayoutProps {
	readonly children: React.ReactNode;
	readonly params: Promise<{ slug: string }>;
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
			<PaymentConfirmationModal />
			{children}
		</div>
	);
}
