"use server";
import { prisma } from '@repo/db';
import { revalidatePath } from 'next/cache';
import { requireSession } from '../session';
import { serializeJsonSafe } from '../utils';
import { MIN_VOTE_PRICE } from '../constants/pricing';

import { logEventActivity } from '../audit/audit-logger';

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
  const session = await requireSession();

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

  // Log in Event Audit Trail
  await logEventActivity({
    eventId: data.eventId,
    organizationId: data.organizationId,
    userId: session.userId,
    action: "category_created",
    entityType: "category",
    entityId: category.id,
    description: `Created voting category "${category.name}" (Vote: GHS ${Number(category.votePrice).toFixed(2)}, Nomination: GHS ${Number(category.nominationPrice).toFixed(2)})`,
    metadata: {
      categoryId: category.id,
      categoryName: category.name,
      votePrice: Number(category.votePrice),
      nominationPrice: Number(category.nominationPrice),
    },
  });

  revalidatePath(`/my-events/${data.eventId}`);
  return serializeJsonSafe(category);
}

export async function updateVotingCategory({ data }: { data: any }): Promise<any> {
  const session = await requireSession();
  const { id, eventId, votingMode, ...rest } = data;

  const existing = await prisma.votingCategory.findUnique({
    where: { id },
  });
  if (!existing) {
    throw new Error("Category not found");
  }

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

  // Track field changes for audit trail, especially price changes
  const changes: Record<string, { from: any; to: any }> = {};
  const isVotePriceChanged = rest.votePrice !== undefined && Number(rest.votePrice) !== Number(existing.votePrice);
  const isNominationPriceChanged = rest.nominationPrice !== undefined && Number(rest.nominationPrice) !== Number(existing.nominationPrice);

  if (isVotePriceChanged) {
    changes.votePrice = {
      from: `GHS ${Number(existing.votePrice).toFixed(2)}`,
      to: `GHS ${Number(rest.votePrice).toFixed(2)}`,
    };
  }
  if (isNominationPriceChanged) {
    changes.nominationPrice = {
      from: `GHS ${Number(existing.nominationPrice).toFixed(2)}`,
      to: `GHS ${Number(rest.nominationPrice).toFixed(2)}`,
    };
  }
  if (rest.name !== undefined && rest.name.trim() !== existing.name) {
    changes.name = { from: existing.name, to: rest.name.trim() };
  }
  if (rest.allowPublicNomination !== undefined && rest.allowPublicNomination !== existing.allowPublicNomination) {
    changes.publicNomination = {
      from: existing.allowPublicNomination ? "Enabled" : "Disabled",
      to: rest.allowPublicNomination ? "Enabled" : "Disabled",
    };
  }
  if (rest.requireApproval !== undefined && rest.requireApproval !== existing.requireApproval) {
    changes.requireApproval = {
      from: existing.requireApproval ? "Yes" : "No",
      to: rest.requireApproval ? "Yes" : "No",
    };
  }

  const updated = await prisma.votingCategory.update({
    where: { id },
    data: updateData,
  });

  const finalEventId = eventId || existing.eventId;

  // Log in Event Audit Trail
  if (Object.keys(changes).length > 0) {
    let action = "category_updated";
    let description = `Updated category "${updated.name}"`;

    if (isVotePriceChanged && isNominationPriceChanged) {
      action = "category_price_changed";
      description = `Changed vote price (${changes.votePrice!.from} → ${changes.votePrice!.to}) and nomination price (${changes.nominationPrice!.from} → ${changes.nominationPrice!.to}) for "${updated.name}"`;
    } else if (isVotePriceChanged) {
      action = "vote_price_changed";
      description = `Changed vote price for "${updated.name}" from ${changes.votePrice!.from} to ${changes.votePrice!.to}`;
    } else if (isNominationPriceChanged) {
      action = "nomination_price_changed";
      description = `Changed nomination price for "${updated.name}" from ${changes.nominationPrice!.from} to ${changes.nominationPrice!.to}`;
    } else {
      description = `Updated category "${updated.name}" (${Object.keys(changes).join(", ")})`;
    }

    await logEventActivity({
      eventId: finalEventId,
      userId: session.userId,
      action,
      entityType: "category",
      entityId: id,
      description,
      metadata: {
        categoryId: id,
        categoryName: updated.name,
        changes,
        isVotePriceChanged,
        isNominationPriceChanged,
      },
    });
  }

  if (finalEventId) {
    revalidatePath(`/my-events/${finalEventId}`);
  }
  return serializeJsonSafe(updated);
}

export async function deleteVotingCategory({ data }: { data: { id: string } }): Promise<any> {
  const session = await requireSession();
  const votesCount = await prisma.vote.count({ where: { categoryId: data.id } });
  if (votesCount > 0) {
    throw new Error(
      `Cannot delete this category because it has already received ${votesCount.toLocaleString()} vote${votesCount > 1 ? "s" : ""}. Categories with recorded votes cannot be deleted to maintain contest integrity.`
    );
  }

  const existing = await prisma.votingCategory.findUnique({
    where: { id: data.id },
  });

  await prisma.votingCategory.delete({ where: { id: data.id } });

  if (existing) {
    await logEventActivity({
      eventId: existing.eventId,
      userId: session.userId,
      action: "category_deleted",
      entityType: "category",
      entityId: data.id,
      description: `Deleted category "${existing.name}" (Vote: GHS ${Number(existing.votePrice).toFixed(2)}, Nomination: GHS ${Number(existing.nominationPrice).toFixed(2)})`,
      metadata: {
        categoryId: data.id,
        categoryName: existing.name,
        votePrice: Number(existing.votePrice),
        nominationPrice: Number(existing.nominationPrice),
      },
    });
  }

  if (existing?.eventId) {
    revalidatePath(`/my-events/${existing.eventId}`);
  }

  return { success: true };
}

export async function reorderVotingCategories({
  data,
}: {
  data: { eventId?: string; categoryIds: string[] };
}): Promise<{ success: boolean }> {
  await requireSession();
  if (!data.categoryIds || data.categoryIds.length === 0) {
    return { success: true };
  }

  await prisma.$transaction(
    data.categoryIds.map((id, index) =>
      prisma.votingCategory.update({
        where: { id },
        data: { orderIdx: index },
      })
    )
  );

  if (data.eventId) {
    revalidatePath(`/my-events/${data.eventId}`);
  }
  return { success: true };
}
