"use client";

import { useState } from "react";
import { Ticket as TicketIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NoTicketIllustration } from "@/components/common/NoTicketIllustration";
import { TicketRenderer } from "@/components/shared/ticket-variants/TicketRenderer";
import { StatusBadge } from "@/components/common/status-badge";
import { PublicTicketPaymentModal } from "@/components/event/public/PublicTicketPaymentModal";
import {
  PublicTicketDetailSheet,
  type PublicTicket,
} from "@/components/event/public/PublicTicketDetailSheet";

export type { PublicTicket };

interface PublicTicketGridProps {
  readonly tickets: PublicTicket[];
  readonly orgSlug: string;
  readonly eventSlug: string;
  readonly isEnded?: boolean;
  readonly event: {
    readonly id: string;
    readonly organizationId: string;
    readonly title: string;
    readonly flierImage?: string | null;
    readonly bannerImage?: string | null;
    readonly isVirtual?: boolean;
    readonly virtualLink?: string | null;
    readonly venueName?: string | null;
    readonly venueCity?: string | null;
    readonly venueCountry?: string | null;
    readonly startDate?: string | null;
  };
  readonly organization: {
    readonly id?: string;
    readonly name: string;
    readonly logoUrl?: string | null;
    readonly primaryColor?: string | null;
    readonly secondaryColor?: string | null;
  };
}

function formatAmount(amount: number, currency: string) {
  return amount === 0
    ? "Free"
    : new Intl.NumberFormat("en-GH", {
        style: "currency",
        currency,
      }).format(amount);
}

function formatDate(value?: string | null) {
  if (!value) return "Open";
  return new Date(value).toLocaleString("en-GH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatShortDate(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GH", {
    month: "short",
    day: "numeric",
  });
}

export function PublicTicketGrid({
  tickets,
  orgSlug,
  eventSlug,
  isEnded = false,
  event,
  organization,
}: PublicTicketGridProps) {
  const [selectedTicket, setSelectedTicket] = useState<PublicTicket | null>(null);
  const [ticketToPurchase, setTicketToPurchase] = useState<PublicTicket | null>(null);

  const venue = event.isVirtual
    ? event.virtualLink || "Virtual event"
    : event.venueName || event.venueCity || event.venueCountry || "Venue TBA";

  const dateTime = event.startDate
    ? new Date(event.startDate).toLocaleString("en-GH", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Date to be announced";

  const orgPrimary = organization.primaryColor || "var(--color-brand-primary)";
  const orgSecondary = organization.secondaryColor || "var(--color-brand-tertiary)";

  const brandVars = {
    "--color-brand-primary": organization.primaryColor || "#009A44",
    "--color-brand-secondary": organization.secondaryColor || "#FFD100",
    "--color-brand-tertiary": (organization as any).tertiaryColor || "#EF3340",
  } as React.CSSProperties;

  if (!tickets || tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl bg-card">
        <NoTicketIllustration className="size-44 mb-4 opacity-85" />
        <h4 className="text-xl font-medium font-millik tracking-widest uppercase text-muted-foreground mb-1">
          No Tickets Available
        </h4>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Ticket tiers haven&apos;t been configured for this event yet. Please check back later.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        {tickets.map((ticket) => {
          const primaryColor = ticket.primaryColor || ticket.color || orgPrimary;
          const secondaryColor = ticket.secondaryColor || orgSecondary;

          const now = Date.now();
          const isUpcoming = Boolean(ticket.salesStart && new Date(ticket.salesStart).getTime() > now);
          const isSalesEnded = Boolean(ticket.salesEnd && new Date(ticket.salesEnd).getTime() < now);
          const isSoldOut =
            ticket.quantityTotal !== null &&
            ticket.quantityTotal - ticket.quantitySold <= 0;

          const isDisabled =
            isEnded ||
            isUpcoming ||
            isSalesEnded ||
            ticket.status !== "available" ||
            isSoldOut;

          const buttonLabel = isEnded
            ? "Closed"
            : isUpcoming
              ? `Opens ${formatShortDate(ticket.salesStart)}`
              : isSalesEnded
                ? "Ended"
                : isSoldOut
                  ? "Sold Out"
                  : ticket.status !== "available"
                    ? "Unavailable"
                    : Number(ticket.price) === 0
                      ? "Get Free"
                      : `Buy (GHS ${Number(ticket.price).toFixed(2)})`;

          return (
            <div
              key={ticket.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedTicket(ticket)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedTicket(ticket);
                }
              }}
              className="group text-left transition-all w-full h-full flex flex-col justify-between"
            >
              <div className="space-y-3.5 h-full flex flex-col justify-between w-full">
                {/* Visual Ticket Preview */}
                <TicketRenderer
                  variant={ticket.designVariant}
                  className="w-full mx-auto"
                  primaryColor={primaryColor}
                  secondaryColor={secondaryColor}
                  logoUrl={organization.logoUrl}
                  flierImage={event.flierImage}
                  bannerImage={event.bannerImage}
                  organizationName={organization.name}
                  eventName={event.title}
                  ticketType={ticket.name}
                  dateTime={dateTime}
                  venue={venue}
                  ticketCode={`TIER-${ticket.orderIdx + 1}`}
                  stacked={false}
                />

                {/* Price and Cute Action Button */}
                <div className="flex items-center justify-between gap-3 px-1 pt-2 border-t border-border/40">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground truncate">
                      Price <span className="text-brand-primary-600">({ticket.name})</span>
                    </p>
                    <p className="mt-0.5 text-xl font-black">
                      {formatAmount(Number(ticket.price), ticket.currency)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {ticket.status !== "available" && !isUpcoming && !isSalesEnded && (
                      <StatusBadge
                        variant={ticket.status === "sold_out" ? "closed" : "restricted"}
                        text={ticket.status === "hidden" ? "Members only" : ticket.status.replace("_", " ")}
                        size="sm"
                      />
                    )}

                    {/* Cute Direct Buy Button (matching the Vote button style) */}
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTicketToPurchase(ticket);
                      }}
                      className="text-xs font-bold gap-1.5 h-8 px-3.5"
                      disabled={isDisabled}
                    >
                      <TicketIcon className="size-3.5" />
                      <span>{buttonLabel}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ticket Details Sheet (Modular, clean, un-carded) */}
      <PublicTicketDetailSheet
        ticket={selectedTicket}
        open={!!selectedTicket}
        onOpenChange={(open) => {
          if (!open) setSelectedTicket(null);
        }}
        onSelectForPurchase={(ticket) => {
          setTicketToPurchase(ticket);
          setSelectedTicket(null);
        }}
        isEnded={isEnded}
        event={{
          id: event.id,
          title: event.title,
          flierImage: event.flierImage,
          bannerImage: event.bannerImage,
        }}
        organization={organization}
        dateTime={dateTime}
        venue={venue}
        brandVars={brandVars}
      />

      {/* Public Ticket Payment Modal */}
      <PublicTicketPaymentModal
        ticket={ticketToPurchase}
        open={!!ticketToPurchase}
        onOpenChange={(open) => {
          if (!open) setTicketToPurchase(null);
        }}
        event={{
          id: event.id,
          title: event.title,
          organizationId: event.organizationId,
        }}
        routing={{
          orgSlug,
          eventSlug,
        }}
        organization={organization}
        brandVars={brandVars}
      />
    </>
  );
}
