"use server";
import { prisma } from '@repo/db';
import { requireSession } from '../session';
import { serializeJsonSafe } from '../utils';

export async function getEventsByOrg({ data }: { data: { organizationId?: string } }) {
  const session = await requireSession();
  const events = await prisma.event.findMany({
    where: {
      organizationId: data.organizationId,
      OR: [
        { creatorId: session.userId },
        { organization: { team: { some: { userId: session.userId } } } },
      ],
    },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      ticketTypes: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return serializeJsonSafe(events);
}
