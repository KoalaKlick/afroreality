export const dynamic = "force-dynamic";
import React from 'react';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { requireSession } from '@/lib/session';
import { getUserOrganizations, getOrganizationById } from '@/lib/dal/organization';
import { getOrgWallet, getOrgTransactions, getOrgPayouts, getOrgActivityLogs } from '@/lib/server-functions/wallet';
import { OrgWalletClient } from '@/components/organization/wallet/OrgWalletClient';
import { ACTIVE_ORG_COOKIE_NAME } from '@/lib/constants/config';

export default async function OrgWalletPage({
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

  const cookieStore = await cookies();
  const cookieOrg = cookieStore.get(ACTIVE_ORG_COOKIE_NAME)?.value;
  const requestedOrgId = typeof params.org === 'string' ? params.org : cookieOrg;
  const activeOrg = orgs.find((o: any) => o.id === requestedOrgId) || orgs[0];
  const organization = await getOrganizationById(activeOrg.id, session.userId);

  if (!organization) {
    notFound();
  }

  const [wallet, transactionsRes, payoutsRes, activityLogsRes] = await Promise.all([
    getOrgWallet({ data: { organizationId: organization.id } }),
    getOrgTransactions({ data: { organizationId: organization.id, page: 1, limit: 20 } }),
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
