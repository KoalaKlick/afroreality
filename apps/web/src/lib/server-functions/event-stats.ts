"use server";
import { serializeJsonSafe } from '../utils';

export async function getEventOverviewStats({ data }: { data: { eventId: string } }) {
  return serializeJsonSafe({
    views: 0,
    totalTickets: 0,
    totalVotes: 0,
    revenue: 0,
  });
}
