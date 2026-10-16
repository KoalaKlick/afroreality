export const dynamic = "force-dynamic";
import React from 'react';
import { cookies } from 'next/headers';
import { requireSession } from '@/lib/session';
import { getUserOrganizations, getOrganizationById } from '@/lib/dal/organization';
import { getOrgWallet, getOrgTransactions, getOrgPayouts, getOrgActivityLogs } from '@/lib/server-functions/wallet';
import { OrgWalletClient } from '@/components/organization/wallet/OrgWalletClient';
import { ACTIVE_ORG_COOKIE_NAME } from '@/lib/constants/config';

import { NoOrganizationState } from '@/components/organization/NoOrganizationState';
import { PageHeader } from '@/components/shared/page-header';

export default async function OrgWalletPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const orgs = await getUserOrganizations(session.userId);

  if (orgs.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Organization', href: '/organization/wallet' },
            { label: 'Wallet & Payouts' },
          ]}
        />
        <NoOrganizationState
          title="Organization Wallet"
          description="You are not currently part of an organization. Create an organization to access your revenue wallet and configure payout details."
        />
      </div>
    );
  }

  const cookieStore = await cookies();
  const cookieOrg = cookieStore.get(ACTIVE_ORG_COOKIE_NAME)?.value;
  const requestedOrgId = typeof params.org === 'string' ? params.org : cookieOrg;
  const activeOrg = orgs.find((o: any) => o.id === requestedOrgId) || orgs[0];

  if (!activeOrg) {
    return (
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Organization', href: '/organization/wallet' },
            { label: 'Wallet & Payouts' },
          ]}
        />
        <NoOrganizationState
          title="Organization Wallet"
          description="You are not currently part of an organization. Create an organization to access your revenue wallet and configure payout details."
        />
      </div>
    );
  }

  const organization = await getOrganizationById(activeOrg.id, session.userId);

  if (!organization) {
    return (
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Organization', href: '/organization/wallet' },
            { label: 'Wallet & Payouts' },
          ]}
        />
        <NoOrganizationState
          title="Organization Not Found"
          description="The requested organization could not be found or you do not have permission to view its wallet."
        />
      </div>
    );
  }

  const [wallet, transactionsRes, payoutsRes, activityLogsRes] = await Promise.all([
    getOrgWallet({ data: { organizationId: organization.id } }),
    getOrgTransactions({ data: { organizationId: organization.id, page: 1, limit: 100 } }),
    getOrgPayouts({ data: { organizationId: organization.id, page: 1, limit: 20 } }),
    getOrgActivityLogs({ data: { organizationId: organization.id, page: 1, limit: 20 } }),
  ]);

  return (
    <OrgWalletClient
      organization={organization}
      wallet={wallet}
      transactions={transactionsRes.items}
      totalTransactions={transactionsRes.total}
      payouts={payoutsRes.items}
      totalPayouts={payoutsRes.total}
      activityLogs={activityLogsRes.items}
    />
  );
}
