export const dynamic = "force-dynamic";

import React from "react";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getEventDetail, getEventStatsAndTrends } from "@/lib/dal/event";
import { EventDetailClient } from "@/components/event/core/EventDetailClient";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;

  const event = await getEventDetail(id, session.userId);
  if (!event) {
    notFound();
  }

  const { eventStats, ticketTypeSales, voteTrend, ticketTrend } =
    await getEventStatsAndTrends(id);

  return (
    <EventDetailClient
      event={event}
      eventStats={eventStats}
      votingCategories={event.votingCategories || []}
      ticketTypes={event.ticketTypes || []}
      ticketTypeSales={ticketTypeSales}
      voteTrend={voteTrend}
      ticketTrend={ticketTrend}
      canEdit={true}
    />
  );
}
