"use server";
import { prisma } from '@repo/db';
import { revalidatePath } from 'next/cache';
import { requireSession } from '../session';
import { serializeJsonSafe } from '../utils';

export async function inviteOrgMember({ data }: { data: any }): Promise<any> {
  const session = await requireSession();
  const token = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const invite = await prisma.organizationInvitation.create({
    data: {
      organizationId: data.organizationId,
      email: data.email.toLowerCase().trim(),
      role: data.role || 'member',
      invitedBy: session.userId,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  revalidatePath('/organization/members');
  return serializeJsonSafe(invite);
}

export const inviteOrganizationMember = inviteOrgMember;

export async function removeOrgMember({ data }: { data: any }): Promise<any> {
  await requireSession();
  const id = data.id || data.memberId;
  await prisma.teamMember.delete({ where: { id } });
  revalidatePath('/organization/members');
  return { success: true };
}

export const removeTeamMember = removeOrgMember;

export async function updateMemberRole({ data }: { data: any }): Promise<any> {
  await requireSession();
  const id = data.id || data.memberId;
  const updated = await prisma.teamMember.update({
    where: { id },
    data: { role: data.role },
  });
  revalidatePath('/organization/members');
  return serializeJsonSafe(updated);
}

export const updateTeamMemberRole = updateMemberRole;

export async function cancelInvitation({ data }: { data: any }): Promise<any> {
  await requireSession();
  const id = data.id || data.invitationId;
  await prisma.organizationInvitation.delete({ where: { id } });
  revalidatePath('/organization/members');
  return { success: true };
}

export const cancelOrgInvitation = cancelInvitation;

export async function resendInvitation({ data }: { data: any }): Promise<any> {
  await requireSession();
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
  revalidatePath('/organization/members');
  return { success: true };
}

export const handleJoinRequest = resolveMembershipRequest;
