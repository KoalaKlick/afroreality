"use server";
import { serializeJsonSafe } from '../utils';

export async function getEventTrends({ data }: { data: { eventId: string } }) {
  return serializeJsonSafe({
    ticketTrend: [],
    voteTrend: [],
    ticketTypeSales: [],
  });
}
