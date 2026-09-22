import { prisma } from '@repo/db';
import { serializeJsonSafe } from '../utils';

export async function getUserOrganizations(userId: string): Promise<any[]> {
  const [memberships, createdOrgs] = await Promise.all([
    prisma.teamMember.findMany({
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
    }),
    prisma.organization.findMany({
      where: { createdBy: userId },
      include: {
        _count: { select: { team: true } },
        socialLinks: true,
      },
    }),
  ]);

  const memberOrgIds = new Set(memberships.map((m) => m.organizationId));
  const orgList = memberships.map((m) => ({
    ...m.organization,
    role: m.role,
    memberCount: m.organization._count.team,
    socialLinks: m.organization.socialLinks ?? [],
  }));

  for (const o of createdOrgs) {
    if (!memberOrgIds.has(o.id)) {
      orgList.push({
        ...o,
        role: 'owner',
        memberCount: o._count.team,
        socialLinks: o.socialLinks ?? [],
      });
    }
  }

  return serializeJsonSafe(orgList);
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

  const isCreator = org.createdBy === userId;
  const effectiveRole = role?.role ?? (isCreator ? 'owner' : null);

  // If user is neither a team member nor the organization creator, they do not have access
  if (!effectiveRole) {
    return null;
  }

  return serializeJsonSafe({ ...org, userRole: effectiveRole });
}
