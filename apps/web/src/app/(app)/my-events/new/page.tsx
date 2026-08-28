export const dynamic = "force-dynamic";
import React from 'react';
import { requireSession } from '@/lib/session';
import { prisma } from '@repo/db';
import { EventCreationClient } from '@/components/event/creation/EventCreationClient';

export default async function NewEventPage() {
  const session = await requireSession();

  const membership = await prisma.teamMember.findFirst({
    where: { userId: session.userId },
  });

  return <EventCreationClient organizationId={membership?.organizationId || ''} />;
}
