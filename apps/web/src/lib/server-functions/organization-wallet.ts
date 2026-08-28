"use server";
import { prisma } from '@repo/db';
import { revalidatePath } from 'next/cache';
import { requireSession } from '../session';
import { serializeJsonSafe } from '../utils';

export async function getOrganizationWallet({ data }: { data: { organizationId: string } }): Promise<any> {
  await requireSession();
  const wallet = await prisma.wallet.findFirst({
    where: { organizationId: data.organizationId },
    include: {
      payouts: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  return serializeJsonSafe({
    balance: Number(wallet?.balance || 0),
    currency: wallet?.currency || 'GHS',
    payouts: wallet?.payouts || [],
  });
}
