"use server";
import { prisma } from '@repo/db';
import { serializeJsonSafe } from '../utils';

export async function getEventDetailStats({ data }: { data: { eventId: string } }) {
  const [ticketOrders, votes, members] = await Promise.all([
    prisma.ticketOrder.findMany({
      where: { eventId: data.eventId, status: 'completed' },
      select: { subtotal: true },
    }),
    prisma.vote.count({ where: { eventId: data.eventId } }),
    prisma.eventMember.count({ where: { eventId: data.eventId } }),
  ]);

  const totalTicketRevenue = ticketOrders.reduce((sum, order) => sum + Number(order.subtotal), 0);

  return serializeJsonSafe({
    totalTicketRevenue,
    totalVotes: votes,
    totalMembers: members,
    ticketsSold: ticketOrders.length,
  });
}
