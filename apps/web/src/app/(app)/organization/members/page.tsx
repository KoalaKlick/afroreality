export const dynamic = "force-dynamic";
import React from 'react';
import { cookies } from 'next/headers';
import { requireSession } from '@/lib/session';
import { getUserOrganizations, getOrganizationById } from '@/lib/dal/organization';
import { OrgMembersClient } from '@/components/organization/members/OrgMembersClient';
import { ACTIVE_ORG_COOKIE_NAME } from '@/lib/constants/config';

import { NoOrganizationState } from '@/components/organization/NoOrganizationState';
import { PageHeader } from '@/components/shared/page-header';

export default async function OrgMembersPage({
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
            { label: 'Organization', href: '/organization/members' },
            { label: 'Team Members' },
          ]}
        />
        <NoOrganizationState
          title="Organization Team"
          description="You are not currently part of an organization. Create an organization to invite members and manage team permissions."
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
            { label: 'Organization', href: '/organization/members' },
            { label: 'Team Members' },
          ]}
        />
        <NoOrganizationState
          title="Organization Team"
          description="You are not currently part of an organization. Create an organization to invite members and manage team permissions."
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
            { label: 'Organization', href: '/organization/members' },
            { label: 'Team Members' },
          ]}
        />
        <NoOrganizationState
          title="Organization Not Found"
          description="The requested organization could not be found or you do not have permission to view its members."
        />
      </div>
    );
  }

  const userMembership = organization.team?.find((m: any) => m.userId === session.userId);
  const isOwnerOrAdmin =
    organization.createdBy === session.userId ||
    userMembership?.role === 'owner' ||
    userMembership?.role === 'admin';

  return (
    <OrgMembersClient
      organizationId={organization.id}
      organizationName={organization.name}
      allowJoinRequests={organization.allowJoinRequests ?? false}
      totalMembers={organization.team?.length || 0}
      currentUserId={session.userId}
      canManageMembers={isOwnerOrAdmin}
      members={organization.team || []}
      invitations={organization.invitations || []}
      joinRequests={organization.requests || organization.membershipRequests || []}
    />
  );
}
