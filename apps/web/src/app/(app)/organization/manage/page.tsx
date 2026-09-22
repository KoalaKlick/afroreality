export const dynamic = "force-dynamic";
import React from 'react';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { requireSession } from '@/lib/session';
import { getUserOrganizations, getOrganizationById } from '@/lib/dal/organization';
import { OrgGeneralSettings } from '@/components/organization/management/OrgGeneralSettings';
import { PageHeader } from '@/components/shared/page-header';
import { ACTIVE_ORG_COOKIE_NAME } from '@/lib/constants/config';

export default async function OrgManagePage({
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

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Organization', href: '/organization/manage' },
          { label: 'General Settings' },
        ]}
      />
      <OrgGeneralSettings organization={organization} />
    </div>
  );
}
