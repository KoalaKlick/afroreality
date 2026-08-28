"use server";
import { prisma } from '@repo/db';
import { serializeJsonSafe } from '../utils';

export async function castVoteAction({ data }: { data: any }): Promise<any> {
  const vote = await prisma.vote.create({
    data: {
      eventId: data.eventId,
      categoryId: data.categoryId,
      optionId: data.optionId,
      voteCount: data.voteCount || 1,
      voterEmail: data.voterEmail || null,
      voterPhone: data.voterPhone || null,
    },
  });
  return serializeJsonSafe(vote);
}

export async function submitPublicNomination({ data }: { data: any }): Promise<any> {
  const option = await prisma.votingOption.create({
    data: {
      eventId: data.eventId,
      categoryId: data.categoryId,
      optionText: data.optionText,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      status: 'pending',
    },
  });
  return serializeJsonSafe(option);
}
