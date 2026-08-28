export const dynamic = "force-dynamic";
import React from 'react';
import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/session';
import { getUserOrganizations, getOrganizationById } from '@/lib/dal/organization';
import { OrgGeneralSettings } from '@/components/organization/management/OrgGeneralSettings';
import { PageHeader } from '@/components/shared/page-header';

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

  const activeOrgId = typeof params.org === 'string' ? params.org : orgs[0]?.id;
  const organization = await getOrganizationById(activeOrgId, session.userId);

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
