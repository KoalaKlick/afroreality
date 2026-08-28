export const dynamic = "force-dynamic";
import React from 'react';
import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/session';
import { getUserOrganizations, getOrganizationById } from '@/lib/dal/organization';
import { OrgMembersClient } from '@/components/organization/members/OrgMembersClient';

export default async function OrgMembersPage({
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
    <OrgMembersClient
      organizationId={organization.id}
      organizationName={organization.name}
      allowJoinRequests={organization.allowJoinRequests ?? false}
      totalMembers={organization.team?.length || 0}
      currentUserId={session.userId}
      members={organization.team || []}
      invitations={organization.invitations || []}
      joinRequests={organization.membershipRequests || []}
    />
  );
}
