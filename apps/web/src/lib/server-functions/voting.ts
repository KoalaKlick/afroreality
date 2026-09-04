"use server";
import { prisma } from '@repo/db';
import { revalidatePath } from 'next/cache';
import { requireSession } from '../session';
import { serializeJsonSafe } from '../utils';
import { MIN_VOTE_PRICE } from '../constants/pricing';

export async function getVotingCategories({ data }: { data: { eventId: string } }): Promise<any[]> {
  await requireSession();
  const categories = await prisma.votingCategory.findMany({
    where: { eventId: data.eventId },
    orderBy: { orderIdx: 'asc' },
    include: {
      votingOptions: {
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: { votingOptions: true },
      },
    },
  });
  return serializeJsonSafe(categories);
}

export async function createVotingCategory({ data }: { data: any }): Promise<any> {
  await requireSession();

  // Enforce minimum vote price for general (non-internal) voting
  const isInternal = data.votingMode === 'internal';
  const votePriceNum = Number(data.votePrice) || 0;
  if (!isInternal && votePriceNum < MIN_VOTE_PRICE) {
    throw new Error(`General voting requires a minimum vote price of ${MIN_VOTE_PRICE} GHS`);
  }
  if (votePriceNum > 0 && votePriceNum < MIN_VOTE_PRICE) {
    throw new Error(`Vote price must be at least ${MIN_VOTE_PRICE} GHS`);
  }

  const category = await prisma.votingCategory.create({
    data: {
      eventId: data.eventId,
      name: (data.name || 'Category').trim(),
      description: data.description || null,
      maxVotesPerUser: Number(data.maxVotesPerUser) || 1,
      allowMultiple: data.allowMultiple ?? false,
      allowPublicNomination: data.allowPublicNomination ?? false,
      nominationDeadline: data.nominationDeadline ? new Date(data.nominationDeadline) : null,
      requireApproval: data.requireApproval ?? true,
      nominationPrice: Number(data.nominationPrice) || 0,
      votePrice: Number(data.votePrice) || 0,
      showTotalVotesPublicly: data.showTotalVotesPublicly ?? true,
      showFinalImage: data.showFinalImage ?? true,
      templateImage: data.templateImage || null,
      templateConfig: data.templateConfig || undefined,
      orderIdx: data.orderIdx !== undefined ? Number(data.orderIdx) : 0,
    },
  });

  revalidatePath(`/my-events/${data.eventId}`);
  return serializeJsonSafe(category);
}

export async function updateVotingCategory({ data }: { data: any }): Promise<any> {
  await requireSession();
  const { id, eventId, votingMode, ...rest } = data;

  // Enforce minimum vote price for general (non-internal) voting
  if (rest.votePrice !== undefined) {
    const votePriceNum = Number(rest.votePrice) || 0;
    const isInternal = votingMode === 'internal';
    if (!isInternal && votePriceNum < MIN_VOTE_PRICE) {
      throw new Error(`General voting requires a minimum vote price of ${MIN_VOTE_PRICE} GHS`);
    }
    if (votePriceNum > 0 && votePriceNum < MIN_VOTE_PRICE) {
      throw new Error(`Vote price must be at least ${MIN_VOTE_PRICE} GHS`);
    }
  }

  const updateData: any = {};
  if (rest.name !== undefined) updateData.name = rest.name.trim();
  if (rest.description !== undefined) updateData.description = rest.description || null;
  if (rest.maxVotesPerUser !== undefined) updateData.maxVotesPerUser = Number(rest.maxVotesPerUser);
  if (rest.allowMultiple !== undefined) updateData.allowMultiple = rest.allowMultiple;
  if (rest.allowPublicNomination !== undefined) updateData.allowPublicNomination = rest.allowPublicNomination;
  if (rest.nominationDeadline !== undefined) updateData.nominationDeadline = rest.nominationDeadline ? new Date(rest.nominationDeadline) : null;
  if (rest.requireApproval !== undefined) updateData.requireApproval = rest.requireApproval;
  if (rest.nominationPrice !== undefined) updateData.nominationPrice = Number(rest.nominationPrice);
  if (rest.votePrice !== undefined) updateData.votePrice = Number(rest.votePrice);
  if (rest.showTotalVotesPublicly !== undefined) updateData.showTotalVotesPublicly = rest.showTotalVotesPublicly;
  if (rest.showFinalImage !== undefined) updateData.showFinalImage = rest.showFinalImage;
  if (rest.templateImage !== undefined) updateData.templateImage = rest.templateImage;
  if (rest.templateConfig !== undefined) updateData.templateConfig = rest.templateConfig;
  if (rest.orderIdx !== undefined) updateData.orderIdx = Number(rest.orderIdx);

  const updated = await prisma.votingCategory.update({
    where: { id },
    data: updateData,
  });

  if (eventId) {
    revalidatePath(`/my-events/${eventId}`);
  }
  return serializeJsonSafe(updated);
}

export async function deleteVotingCategory({ data }: { data: { id: string } }): Promise<any> {
  await requireSession();
  const votesCount = await prisma.vote.count({ where: { categoryId: data.id } });
  if (votesCount > 0) {
    throw new Error(
      `Cannot delete this category because it has already received ${votesCount.toLocaleString()} vote${votesCount > 1 ? "s" : ""}. Categories with recorded votes cannot be deleted to maintain contest integrity.`
    );
  }
  await prisma.votingCategory.delete({ where: { id: data.id } });
  return { success: true };
}
