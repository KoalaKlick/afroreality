"use server";
import { getCurrentUser } from "@/lib/dal/auth";

import { prisma } from '@repo/db';
import { requireSession } from '../session';
import { serializeJsonSafe } from '../utils';

export async function acceptOrgInvitation({ data }: { data: any }): Promise<any> {
  const session = await requireSession();
  const token = data.token || data.invitationId;
  const invite = await prisma.organizationInvitation.findFirst({
    where: { OR: [{ token: token }, { id: token }] },
  });
  if (!invite) throw new Error('Invitation not found');

  await prisma.teamMember.create({
    data: {
      organizationId: invite.organizationId,
      userId: session.userId,
      role: invite.role,
    },
  });

  await prisma.organizationInvitation.update({
    where: { id: invite.id },
    data: { status: 'accepted' },
  });

  return { success: true };
}

export const acceptInvitation = acceptOrgInvitation;

export async function declineOrgInvitation({ data }: { data: any }): Promise<any> {
  await requireSession();
  const token = data.token || data.invitationId;
  const invite = await prisma.organizationInvitation.findFirst({
    where: { OR: [{ token: token }, { id: token }] },
  });
  if (invite) {
    await prisma.organizationInvitation.update({
      where: { id: invite.id },
      data: { status: 'declined' },
    });
  }
  return { success: true };
}

export async function resolveMembershipRequest({ data }: { data: any }): Promise<any> {
  const session = await requireSession();
  const request = await prisma.membershipRequest.findUnique({ where: { id: data.requestId || data.id } });
  if (!request) throw new Error('Request not found');

  if (data.action === 'approve' || data.approved) {
    await prisma.teamMember.create({
      data: {
        organizationId: request.organizationId,
        userId: request.userId,
        role: 'member',
      },
    });
    await prisma.membershipRequest.update({
      where: { id: request.id },
      data: { status: 'approved', resolvedBy: session.userId, resolvedAt: new Date() },
    });
  } else {
    await prisma.membershipRequest.update({
      where: { id: request.id },
      data: { status: 'rejected', resolvedBy: session.userId, resolvedAt: new Date() },
    });
  }
  return { success: true };
}



export async function getPendingInvitationsForEmail(): Promise<any[]> {
  try {
    const session = await getCurrentUser();
    if (!session || !session.email) return [];
    return [];
  } catch {
    return [];
  }
}
