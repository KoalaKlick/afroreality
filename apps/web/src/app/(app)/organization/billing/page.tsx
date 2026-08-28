export const dynamic = "force-dynamic";
import React from 'react';
import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/session';
import { getUserOrganizations, getOrganizationById } from '@/lib/dal/organization';
import { BillingSummary } from '@/components/organization/billing/BillingSummary';
import { PlatformFeesCard } from '@/components/organization/billing/PlatformFeesCard';
import { FeeCalculator } from '@/components/organization/billing/FeeCalculator';
import { CommunicationCreditsCard } from '@/components/organization/billing/CommunicationCreditsCard';
import { PageHeader } from '@/components/shared/page-header';

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

  const activeOrgId = typeof params.org === 'string' ? params.org : orgs[0]?.id;
  const organization = await getOrganizationById(activeOrgId, session.userId);

  if (!organization) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Platform Fees"
        description="View pricing structure, estimate platform fees, and manage SMS credits."
      />
      <div className="grid gap-6 md:grid-cols-2">
        <BillingSummary currentPlan="essential" communicationCredits={0} />
        <PlatformFeesCard />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <FeeCalculator />
        <CommunicationCreditsCard balance={0} />
      </div>
    </div>
  );
}
