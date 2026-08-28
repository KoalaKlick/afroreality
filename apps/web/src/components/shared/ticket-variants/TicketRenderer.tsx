"use client";

import { TicketCard } from "./TicketPreview";
import { TicketCard2 } from "./TicketPreview2";
import { TicketCardGeo } from "./TicketPreviewGeo";
import { TicketCardRetro } from "./TicketPreviewRetro";

interface TicketRendererProps {
  readonly variant?: "classic" | "modern" | "geo" | string | null;
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly tertiaryColor?: string;
  readonly logoUrl?: string | null;
  readonly flierImage?: string | null;
  readonly bannerImage?: string | null;
  readonly organizationName?: string;
  readonly eventName?: string;
  readonly ticketType?: string;
  readonly dateTime?: string;
  readonly venue?: string;
  readonly ticketCode?: string;
  readonly qrPayload?: string;
  readonly className?: string;
  readonly stacked?: boolean;
  readonly exportMode?: boolean;
  readonly exportSide?: "front" | "back" | "both";
  readonly buyerName?: string;
}

export function TicketRenderer({
  variant = "classic",
  ...props
}: TicketRendererProps) {
  switch (variant) {
    case "geo":
      return <TicketCardGeo {...props} />;
    case "retro":
      return <TicketCardRetro {...props} />;
    case "modern":
      return <TicketCard2 {...props} />;
    case "classic":
    default:
      return <TicketCard {...props} />;
  }
}
