import { prisma } from '@repo/db';
import { serializeJsonSafe } from '../utils';

export async function getUserOrganizations(userId: string): Promise<any[]> {
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    include: {
      organization: {
        include: {
          _count: { select: { team: true } },
          socialLinks: true,
        },
      },
    },
    orderBy: { joinedAt: 'asc' },
  });

  return serializeJsonSafe(
    memberships.map((m) => ({
      ...m.organization,
      role: m.role,
      memberCount: m.organization._count.team,
      socialLinks: m.organization.socialLinks ?? [],
    }))
  );
}

export async function getOrganizationById(id: string, userId: string): Promise<any> {
  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      socialLinks: true,
      team: {
        include: {
          user: {
            select: { id: true, fullName: true, email: true, avatarUrl: true, phone: true },
          },
        },
      },
      invitations: {
        where: { status: 'pending' },
      },
      requests: { where: { status: 'pending' },
        include: {
          user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        },
      },
      events: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          type: true,
          startDate: true,
        },
      },
    },
  });

  if (!org) return null;

  const role = await prisma.teamMember.findUnique({
    where: { organizationId_userId: { organizationId: id, userId } },
    select: { role: true },
  });

  return serializeJsonSafe({ ...org, userRole: role?.role ?? null });
}
