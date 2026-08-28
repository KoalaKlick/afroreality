"use client";

import React from "react";
import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";
import { Image } from "@/components/image/Image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getEventStatusBadge } from "@/lib/event-status";

export function EventCard({ event }: { event: any }) {
  const statusBadge = getEventStatusBadge(event);

  return (
    <Card className="overflow-hidden border border-neutral-200 transition-all hover:shadow-md dark:border-neutral-800">
      <Link href={`/my-events/${event.id}`}>
        <div className="relative aspect-video w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900">
          <Image src={event.coverImage} alt={event.title} className="h-full w-full object-cover" />
          <Badge variant={statusBadge.variant} className="absolute top-2.5 right-2.5">
            {statusBadge.label}
          </Badge>
        </div>
        <CardContent className="p-4">
          <h3 className="line-clamp-1 font-semibold text-neutral-900 dark:text-white">
            {event.title}
          </h3>
          <div className="mt-2.5 flex flex-col gap-1 text-xs text-neutral-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-emerald-600" />
              <span>{event.startDate ? new Date(event.startDate).toLocaleDateString() : "TBD"}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                <span className="line-clamp-1">{event.location}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
