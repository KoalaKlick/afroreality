export const dynamic = "force-dynamic";
import React from 'react';
import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/session';
import { getUserOrganizations, getOrganizationById } from '@/lib/dal/organization';
import { getOrgWallet, getOrgTransactions, getOrgPayouts, getOrgActivityLogs } from '@/lib/server-functions/wallet';
import { OrgWalletClient } from '@/components/organization/wallet/OrgWalletClient';

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

  const activeOrgId = typeof params.org === 'string' ? params.org : orgs[0]?.id;
  const organization = await getOrganizationById(activeOrgId, session.userId);

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
