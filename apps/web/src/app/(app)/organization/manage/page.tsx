export const dynamic = "force-dynamic";
import React from 'react';
import { cookies } from 'next/headers';
import { requireSession } from '@/lib/session';
import { getUserOrganizations, getOrganizationById } from '@/lib/dal/organization';
import { OrgGeneralSettings } from '@/components/organization/management/OrgGeneralSettings';
import { PageHeader } from '@/components/shared/page-header';
import { ACTIVE_ORG_COOKIE_NAME } from '@/lib/constants/config';

import { NoOrganizationState } from '@/components/organization/NoOrganizationState';

export default async function OrgManagePage({
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
            { label: 'Organization', href: '/organization/manage' },
            { label: 'General Settings' },
          ]}
        />
        <NoOrganizationState
          title="Organization Settings"
          description="You are not currently part of an organization. Create an organization to manage settings, profile details, and team members."
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
            { label: 'Organization', href: '/organization/manage' },
            { label: 'General Settings' },
          ]}
        />
        <NoOrganizationState
          title="Organization Settings"
          description="You are not currently part of an organization. Create an organization to manage settings, profile details, and team members."
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
            { label: 'Organization', href: '/organization/manage' },
            { label: 'General Settings' },
          ]}
        />
        <NoOrganizationState
          title="Organization Not Found"
          description="The requested organization could not be found or you do not have permission to view its settings."
        />
      </div>
    );
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
