"use server";
import { prisma } from '@repo/db';
import { revalidatePath } from 'next/cache';
import { requireSession } from '../session';
import { serializeJsonSafe } from '../utils';

export async function createVotingOption({ data }: { data: any }): Promise<any> {
  await requireSession();
  const option = await prisma.votingOption.create({
    data: {
      eventId: data.eventId,
      categoryId: data.categoryId,
      optionText: data.optionText.trim(),
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      nomineeCode: data.nomineeCode || null,
      status: 'approved',
    },
  });
  revalidatePath(`/my-events/${data.eventId}`);
  return serializeJsonSafe(option);
}

export async function updateVotingOption({ data }: { data: any }): Promise<any> {
  await requireSession();
  const { id, ...rest } = data;
  const updated = await prisma.votingOption.update({
    where: { id: id || data.optionId },
    data: rest,
  });
  return serializeJsonSafe(updated);
}

export async function updateVotingOptionStatus({ data }: { data: { id?: string; optionId?: string; status: any } }): Promise<any> {
  await requireSession();
  const targetId = data.id || data.optionId;
  if (!targetId) throw new Error('Missing option id');
  const updated = await prisma.votingOption.update({
    where: { id: targetId },
    data: { status: data.status },
  });
  return serializeJsonSafe(updated);
}

export async function deleteVotingOption({ data }: { data: any }): Promise<any> {
  await requireSession();
  const targetId = data.id || data.optionId;
  await prisma.votingOption.delete({ where: { id: targetId } });
  return { success: true };
}

export async function approveNomination({ data }: { data: any }): Promise<any> {
  return updateVotingOptionStatus({ data: { ...data, status: 'approved' } });
}

export async function rejectNomination({ data }: { data: any }): Promise<any> {
  return updateVotingOptionStatus({ data: { ...data, status: 'rejected' } });
}

export async function getSuggestedNomineeCode({ data }: { data: any }): Promise<string> {
  const count = await prisma.votingOption.count({ where: { categoryId: data.categoryId } });
  return `NOM${String(count + 1).padStart(3, '0')}`;
}
