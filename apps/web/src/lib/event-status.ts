export type EventLifecycleStatus =
  | "draft"
  | "upcoming"
  | "ongoing"
  | "ended"
  | "cancelled";

export function getEventLifecycleStatus(event: {
  status?: string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
}): EventLifecycleStatus {
  if (event.status === "cancelled" || event.status === "CANCELLED") return "cancelled";
  if (event.status === "draft" || event.status === "DRAFT") return "draft";

  const now = new Date();
  const start = event.startDate ? new Date(event.startDate) : null;
  const end = event.endDate ? new Date(event.endDate) : null;

  if (start && now < start) return "upcoming";
  if (end && now > end) return "ended";
  if (start && (!end || now <= end)) return "ongoing";

  return "upcoming";
}

export function getEventStatusBadge(event: {
  status?: string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
}): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  const status = getEventLifecycleStatus(event);
  switch (status) {
    case "ongoing":
      return { label: "Ongoing", variant: "default" };
    case "upcoming":
      return { label: "Upcoming", variant: "secondary" };
    case "ended":
      return { label: "Ended", variant: "outline" };
    case "cancelled":
      return { label: "Cancelled", variant: "destructive" };
    case "draft":
    default:
      return { label: "Draft", variant: "outline" };
  }
}
