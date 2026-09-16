"use server";
import { prisma } from '@repo/db';
import { serializeJsonSafe } from '../utils';

export async function castVoteAction({ data }: { data: any }): Promise<any> {
  const event = await prisma.event.findUnique({
    where: { id: data.eventId },
    select: { startDate: true, endDate: true, status: true },
  });
  if (!event) {
    throw new Error("Event not found");
  }
  const now = new Date();
  if (event.startDate && now < new Date(event.startDate)) {
    throw new Error("Voting for this event has not started yet.");
  }
  if (
    event.status === "ended" ||
    event.status === "cancelled" ||
    (event.endDate && now > new Date(event.endDate))
  ) {
    throw new Error("Voting for this event has ended.");
  }

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
