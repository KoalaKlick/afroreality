export const dynamic = "force-dynamic";

import React from "react";
import { requireSession } from "@/lib/session";
import { getEventsList, getEventStats } from "@/lib/dal/event";
import { MyEventsClient } from "@/components/event/core/MyEventsClient";
import { serializeJsonSafe } from "@/lib/utils";

export const metadata = {
  title: "My Events - AfroReality",
  description: "Manage, monitor, and create events for your organizations.",
};

export default async function MyEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : undefined;
  const search = typeof params.search === "string" ? params.search : undefined;

  const [events, stats] = await Promise.all([
    getEventsList(session.userId, { status, search }),
    getEventStats(session.userId),
  ]);

  return (
    <MyEventsClient
      events={serializeJsonSafe(events) as any}
      stats={serializeJsonSafe(stats) as any}
    />
  );
}
