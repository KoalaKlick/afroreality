export const dynamic = "force-dynamic";
import React from 'react';
import { cookies } from 'next/headers';
import { requireSession } from '@/lib/session';
import { prisma } from '@repo/db';
import { EventCreationClient } from '@/components/event/creation/EventCreationClient';
import { ACTIVE_ORG_COOKIE_NAME } from '@/lib/constants/config';

export default async function NewEventPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireSession();
  const params = searchParams ? await searchParams : {};
  const cookieStore = await cookies();
  const cookieOrg = cookieStore.get(ACTIVE_ORG_COOKIE_NAME)?.value;
  const activeOrgId = typeof params?.org === 'string' ? params.org : cookieOrg;

  const membership = await prisma.teamMember.findFirst({
    where: {
      userId: session.userId,
      ...(activeOrgId ? { organizationId: activeOrgId } : {}),
    },
  });

  return <EventCreationClient organizationId={membership?.organizationId || ''} />;
}
