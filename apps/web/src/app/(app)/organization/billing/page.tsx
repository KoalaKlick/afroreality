export const dynamic = "force-dynamic";

import React from "react";
import { notFound } from "next/navigation";
import { CreditCard } from "lucide-react";
import { prisma } from "@repo/db";
import { requireSession } from "@/lib/session";
import { getUserOrganizations, getOrganizationById } from "@/lib/dal/organization";
import {
	BillingSummary,
	CommunicationCreditsCard,
	FeeCalculator,
	PlatformFeesCard,
} from "@/components/organization/billing";
import { PageHeader } from "@/components/shared/page-header";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default async function OrgBillingPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const session = await requireSession();
	const params = await searchParams;
	const orgs = await getUserOrganizations(session.userId);

	if (orgs.length === 0) {
		notFound();
	}

	const activeOrgId =
		typeof params.org === "string" ? params.org : orgs[0]?.id;
	const organization = await getOrganizationById(activeOrgId, session.userId);

	if (!organization) {
		notFound();
	}

	const profile = await prisma.profile.findUnique({
		where: { id: session.userId },
		select: {
			pricingPlan: true,
			communicationCredits: true,
			isVerifiedPartner: true,
		},
	});

	const currentPlan = profile?.pricingPlan || "essential";
	const communicationCredits = Number(profile?.communicationCredits || 0);
	const isVerifiedPartner = profile?.isVerifiedPartner || false;

	return (
		<>
			<PageHeader
				breadcrumbs={[
					{ label: "Organization", href: "/organization/manage" },
					{ label: "Billing" },
				]}
			/>

			<div className="flex-1 flex-col space-y-6 mx-auto w-full">
				<Card>
					<CardHeader>
						<CardTitle className="text-2xl font-bold tracking-tight flex items-center gap-2">
							<CreditCard className="h-6 w-6 text-primary" />
							Billing & Plans
						</CardTitle>
						<CardDescription>
							Manage your subscription, view fees, and track communication
							credits.
						</CardDescription>
					</CardHeader>
				</Card>

				<BillingSummary
					currentPlan={currentPlan}
					communicationCredits={communicationCredits}
				/>

				<PlatformFeesCard isVerifiedPartner={isVerifiedPartner} />

				<FeeCalculator />

				<CommunicationCreditsCard balance={communicationCredits} />
			</div>
		</>
	);
}
