"use client";

import { useState } from "react";
import { Calendar, Lock, Tag, Ticket as TicketIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TicketRenderer } from "@/components/shared/ticket-variants/TicketRenderer";
import { PublicTicketPaymentModal } from "@/components/event/public/PublicTicketPaymentModal";

interface PublicTicket {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly price: number;
  readonly currency: string;
  readonly quantityTotal: number | null;
  readonly quantitySold: number;
  readonly salesEnd: string | null;
  readonly status: string;
  readonly orderIdx: number;
  readonly color?: string | null;
  readonly primaryColor?: string | null;
  readonly secondaryColor?: string | null;
  readonly designVariant?: string | null;
}

interface PublicTicketGridProps {
  readonly tickets: PublicTicket[];
  readonly orgSlug: string;
  readonly eventSlug: string;
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

function formatDate(value: string | null) {
  if (!value) return "Open";
  return new Date(value).toLocaleString("en-GH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function PublicTicketGrid({
  tickets,
  orgSlug,
  eventSlug,
  event,
  organization,
}: PublicTicketGridProps) {
  const [selectedTicket, setSelectedTicket] = useState<PublicTicket | null>(
    null,
  );
  const [ticketToPurchase, setTicketToPurchase] = useState<PublicTicket | null>(
    null,
  );

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
  const orgSecondary =
    organization.secondaryColor || "var(--color-brand-tertiary)";

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2 xl:">
        {tickets.map((ticket) => {
          const primaryColor =
            ticket.primaryColor || ticket.color || orgPrimary;
          const secondaryColor = ticket.secondaryColor || orgSecondary;

          return (
            <button
              key={ticket.id}
              type="button"
              onClick={() => setSelectedTicket(ticket)}
              className="group text-left transition-all "
            >
              <div className="space-y-4">
                <TicketRenderer
                  variant={ticket.designVariant}
                  className="mx-auto"
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

                <div className="flex items-center justify-between gap-3 px-1">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Price <span className="text-brand-primary-600">({ticket.name})</span>
                    </p>
                    <p className="mt-1 text-xl font-black">
                      {formatAmount(Number(ticket.price), ticket.currency)}
                    </p>
                  </div>
                  {ticket.status !== "available" && (
                    <span
                      className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white"
                      style={{
                        background:
                          ticket.status === "sold_out"
                            ? "#1f2937"
                            : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                      }}
                    >
                      {ticket.status === "hidden"
                        ? "Members only"
                        : ticket.status.replace("_", " ")}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Sheet
        open={!!selectedTicket}
        onOpenChange={(open) => {
          if (!open) setSelectedTicket(null);
        }}
      >
        <SheetContent className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-lg">
          {selectedTicket && (
            <>
              <SheetHeader className="border-b px-6 py-4">
                <SheetTitle className="text-left text-xl font-black uppercase tracking-tight">
                  {selectedTicket.name}
                </SheetTitle>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="space-y-6">
                  <TicketRenderer
                    variant={selectedTicket.designVariant}
                    className="mx-auto"
                    primaryColor={
                      selectedTicket.primaryColor ||
                      selectedTicket.color ||
                      orgPrimary
                    }
                    secondaryColor={
                      selectedTicket.secondaryColor || orgSecondary
                    }
                    logoUrl={organization.logoUrl}
                    flierImage={event.flierImage}
                    bannerImage={event.bannerImage}
                    organizationName={organization.name}
                    eventName={event.title}
                    ticketType={selectedTicket.name}
                    dateTime={dateTime}
                    venue={venue}
                    ticketCode={`TIER-${selectedTicket.orderIdx + 1}`}
                    stacked={false}
                  />

                  <div className="rounded-md border bg-muted/20 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Price
                    </p>
                    <p className="mt-2 text-2xl font-black">
                      {formatAmount(
                        Number(selectedTicket.price),
                        selectedTicket.currency,
                      )}
                    </p>
                  </div>

                  {selectedTicket.description && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                        Details
                      </p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {selectedTicket.description}
                      </p>
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border bg-card p-4">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                        <Tag className="size-3.5" />
                        Status
                      </div>
                      <p className="mt-2 text-sm font-semibold capitalize">
                        {selectedTicket.status === "hidden"
                          ? "Members only"
                          : selectedTicket.status.replace("_", " ")}
                      </p>
                    </div>

                    <div className="rounded-md border bg-card p-4">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                        <TicketIcon className="size-3.5" />
                        Availability
                      </div>
                      <p className="mt-2 text-sm font-semibold">
                        {selectedTicket.quantityTotal
                          ? `${Math.max(selectedTicket.quantityTotal - selectedTicket.quantitySold, 0)} left`
                          : "Open stock"}
                      </p>
                    </div>

                    <div className="rounded-md border bg-card p-4 sm:col-span-2">
                      <div className="flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                        <Calendar className="size-3.5" />
                        Sales End
                      </div>
                      <p className="mt-2 text-sm font-semibold">
                        {formatDate(selectedTicket.salesEnd)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <SheetFooter className="border-t bg-background p-6">
                <Button
                  variant="afro-cta"
                  size="lg"
                  className="w-full"
                  disabled={
                    selectedTicket.status !== "available" ||
                    (selectedTicket.quantityTotal !== null &&
                      selectedTicket.quantityTotal -
                      selectedTicket.quantitySold <=
                      0)
                  }
                  onClick={() => {
                    setTicketToPurchase(selectedTicket);
                    setSelectedTicket(null);
                  }}
                >
                  Purchase Ticket
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

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
      />
    </>
  );
}
