"use client";

import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TicketRenderer } from "@/components/shared/ticket-variants/TicketRenderer";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { StatusBadge } from "@/components/common/status-badge";
import { cn } from "@/lib/utils";

export interface PublicTicket {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly price: number;
  readonly currency: string;
  readonly quantityTotal: number | null;
  readonly quantitySold: number;
  readonly salesStart?: string | null;
  readonly salesEnd: string | null;
  readonly status: string;
  readonly orderIdx: number;
  readonly color?: string | null;
  readonly primaryColor?: string | null;
  readonly secondaryColor?: string | null;
  readonly designVariant?: string | null;
}

interface PublicTicketDetailSheetProps {
  readonly ticket: PublicTicket | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSelectForPurchase: (ticket: PublicTicket) => void;
  readonly isEnded?: boolean;
  readonly event: {
    readonly id: string;
    readonly title: string;
    readonly flierImage?: string | null;
    readonly bannerImage?: string | null;
  };
  readonly organization: {
    readonly name: string;
    readonly logoUrl?: string | null;
    readonly primaryColor?: string | null;
    readonly secondaryColor?: string | null;
  };
  readonly dateTime: string;
  readonly venue: string;
  readonly brandVars?: React.CSSProperties;
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

export function PublicTicketDetailSheet({
  ticket,
  open,
  onOpenChange,
  onSelectForPurchase,
  isEnded = false,
  event,
  organization,
  dateTime,
  venue,
  brandVars,
}: PublicTicketDetailSheetProps) {
  if (!ticket) return null;

  const orgPrimary = organization.primaryColor || "var(--color-brand-primary)";
  const orgSecondary = organization.secondaryColor || "var(--color-brand-tertiary)";
  const primaryColor = ticket.primaryColor || ticket.color || orgPrimary;
  const secondaryColor = ticket.secondaryColor || orgSecondary;

  const now = Date.now();
  const isUpcoming = Boolean(
    ticket.salesStart && new Date(ticket.salesStart).getTime() > now
  );
  const isSalesEnded = Boolean(
    ticket.salesEnd && new Date(ticket.salesEnd).getTime() < now
  );
  const isSoldOut =
    ticket.quantityTotal !== null &&
    ticket.quantityTotal - ticket.quantitySold <= 0;

  const isDisabled =
    isEnded ||
    isUpcoming ||
    isSalesEnded ||
    ticket.status !== "available" ||
    isSoldOut;

  let buttonLabel = "Purchase Ticket";
  if (isEnded) buttonLabel = "Event Ended — Sales Closed";
  else if (isUpcoming) buttonLabel = `Sales Open ${formatDate(ticket.salesStart)}`;
  else if (isSalesEnded) buttonLabel = "Ticket Sales Ended";
  else if (ticket.status !== "available") buttonLabel = "Currently Unavailable";
  else if (isSoldOut) buttonLabel = "Sold Out";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-lg"
        style={brandVars}
      >
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="text-left text-xl font-black uppercase tracking-tight">
            {ticket.name}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Ticket Canvas Preview */}
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

          {/* Clean Price & Status Row */}
          <div className="flex items-center justify-between gap-4 py-2 border-b border-border/60">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Price
              </p>
              <p className="mt-0.5 text-2xl font-black">
                {formatAmount(Number(ticket.price), ticket.currency)}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              <StatusBadge
                variant={
                  isUpcoming
                    ? "upcoming"
                    : isSalesEnded
                      ? "ended"
                      : ticket.status === "available"
                        ? "active"
                        : ticket.status === "sold_out"
                          ? "closed"
                          : "restricted"
                }
                text={
                  isUpcoming
                    ? "Upcoming"
                    : isSalesEnded
                      ? "Sales Ended"
                      : ticket.status === "available"
                        ? "Available"
                        : ticket.status === "sold_out"
                          ? "Sold Out"
                          : ticket.status === "hidden"
                            ? "Members Only"
                            : ticket.status.replace("_", " ")
                }
                size="sm"
              />

              {ticket.quantityTotal !== null && (
                <span className="text-xs font-semibold text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded border">
                  {Math.max(ticket.quantityTotal - ticket.quantitySold, 0)} left
                </span>
              )}
            </div>
          </div>

          {/* Details (Rich text) */}
          {ticket.description && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Details
              </p>
              <RichTextDisplay
                content={ticket.description}
                className="text-sm leading-6 text-muted-foreground"
              />
            </div>
          )}

          {/* Sales End Alert */}
          {ticket.salesEnd && (
            <div
              className={cn(
                "rounded-xl p-3.5 flex items-center gap-2.5 text-xs border",
                isSalesEnded
                  ? "bg-destructive/10 border-destructive/30 text-destructive"
                  : "bg-muted/40 border-border/80 text-muted-foreground"
              )}
            >
              <Clock className="size-4 shrink-0 text-primary" />
              <span>
                {isSalesEnded ? (
                  <>Ticket sales ended on <strong>{formatDate(ticket.salesEnd)}</strong>.</>
                ) : (
                  <>Sales end on <strong className="text-foreground">{formatDate(ticket.salesEnd)}</strong>.</>
                )}
              </span>
            </div>
          )}
        </div>

        <SheetFooter className="border-t bg-background p-6">
          <div className="w-full space-y-2">
            {isUpcoming && (
              <p className="text-xs text-center font-medium text-amber-700 dark:text-amber-400">
                Sales have not started yet. Sales open on {formatDate(ticket.salesStart)}.
              </p>
            )}
            <Button
              variant="brand-cta"
              size="lg"
              className="w-full"
              disabled={isDisabled}
              onClick={() => onSelectForPurchase(ticket)}
            >
              {buttonLabel}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
