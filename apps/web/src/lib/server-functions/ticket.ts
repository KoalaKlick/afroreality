"use server";
import { prisma } from '@repo/db';
import { revalidatePath } from 'next/cache';
import { requireSession } from '../session';
import { serializeJsonSafe } from '../utils';
import { MIN_PAID_TICKET_PRICE } from '../constants/pricing';

import { logEventActivity } from '../audit/audit-logger';

export async function getEventTickets({ data }: { data: { organizationId?: string; eventId: string } }): Promise<any[]> {
  await requireSession();
  const tickets = await prisma.ticketType.findMany({
    where: { eventId: data.eventId },
    orderBy: { orderIdx: 'asc' },
  });
  return serializeJsonSafe(tickets);
}

export async function getTicketTypes({ data }: { data: { eventId: string } }): Promise<any[]> {
  const tickets = await prisma.ticketType.findMany({
    where: { eventId: data.eventId },
    orderBy: { orderIdx: 'asc' },
  });
  return serializeJsonSafe(tickets);
}

export async function createTicketType({ data }: { data: any }): Promise<any> {
  const session = await requireSession();

  const quantityTotal = data.quantityTotal !== undefined && data.quantityTotal !== null
    ? (data.quantityTotal === '' ? null : Number(data.quantityTotal))
    : (data.quantity !== undefined && data.quantity !== null && data.quantity !== '' ? Number(data.quantity) : null);

  // Enforce minimum paid ticket price
  const price = data.price !== undefined ? Number(data.price) : 0;
  if (price > 0 && price < MIN_PAID_TICKET_PRICE) {
    throw new Error(`Paid tickets must be at least ${MIN_PAID_TICKET_PRICE} GHS. Set to 0 for a free ticket.`);
  }

  const salesStart = data.salesStart
    ? new Date(data.salesStart)
    : (data.saleStart ? new Date(data.saleStart) : null);

  const salesEnd = data.salesEnd
    ? new Date(data.salesEnd)
    : (data.saleEnd ? new Date(data.saleEnd) : null);

  const ticket = await prisma.ticketType.create({
    data: {
      eventId: data.eventId,
      name: (data.name || 'General Admission').trim(),
      description: data.description || null,
      price: price,
      currency: data.currency || 'GHS',
      quantityTotal: quantityTotal,
      salesStart: salesStart,
      salesEnd: salesEnd,
      maxPerOrder: Number(data.maxPerOrder || data.maxPerUser) || 10,
      minPerOrder: Number(data.minPerOrder) || 1,
      status: data.status || 'available',
      primaryColor: data.primaryColor || data.color || null,
      secondaryColor: data.secondaryColor || null,
      color: data.color || data.primaryColor || null,
      designVariant: data.designVariant || 'classic',
      orderIdx: data.orderIdx !== undefined ? Number(data.orderIdx) : 0,
    },
  });

  // Log in Event Audit Trail
  await logEventActivity({
    eventId: data.eventId,
    organizationId: data.organizationId,
    userId: session.userId,
    action: "ticket_created",
    entityType: "ticket",
    entityId: ticket.id,
    description: `Created ticket tier "${ticket.name}" at ${ticket.currency} ${Number(ticket.price).toFixed(2)}${ticket.quantityTotal ? ` (${ticket.quantityTotal} capacity)` : " (Unlimited)"}`,
    metadata: {
      ticketId: ticket.id,
      ticketName: ticket.name,
      price: Number(ticket.price),
      currency: ticket.currency,
      quantityTotal: ticket.quantityTotal,
    },
  });

  revalidatePath(`/my-events/${data.eventId}`);
  return serializeJsonSafe(ticket);
}

export async function updateTicketType({ data }: { data: any }): Promise<any> {
  const session = await requireSession();
  const { id, eventId, organizationId, ...rest } = data;

  const existing = await prisma.ticketType.findUnique({
    where: { id },
  });
  if (!existing) {
    throw new Error("Ticket not found");
  }

  const updateData: any = {};
  if (rest.name !== undefined) updateData.name = rest.name.trim();
  if (rest.description !== undefined) updateData.description = rest.description || null;
  if (rest.price !== undefined) {
    const priceVal = Number(rest.price);
    if (priceVal > 0 && priceVal < MIN_PAID_TICKET_PRICE) {
      throw new Error(`Paid tickets must be at least ${MIN_PAID_TICKET_PRICE} GHS. Set to 0 for a free ticket.`);
    }
    updateData.price = priceVal;
  }
  if (rest.currency !== undefined) updateData.currency = rest.currency;
  if (rest.quantityTotal !== undefined) updateData.quantityTotal = rest.quantityTotal ? Number(rest.quantityTotal) : null;
  if (rest.salesStart !== undefined) updateData.salesStart = rest.salesStart ? new Date(rest.salesStart) : null;
  if (rest.salesEnd !== undefined) updateData.salesEnd = rest.salesEnd ? new Date(rest.salesEnd) : null;
  if (rest.maxPerOrder !== undefined) updateData.maxPerOrder = Number(rest.maxPerOrder);
  if (rest.minPerOrder !== undefined) updateData.minPerOrder = Number(rest.minPerOrder);
  if (rest.status !== undefined) updateData.status = rest.status;
  if (rest.primaryColor !== undefined) updateData.primaryColor = rest.primaryColor;
  if (rest.secondaryColor !== undefined) updateData.secondaryColor = rest.secondaryColor;
  if (rest.color !== undefined) updateData.color = rest.color;
  if (rest.designVariant !== undefined) updateData.designVariant = rest.designVariant;
  if (rest.orderIdx !== undefined) updateData.orderIdx = Number(rest.orderIdx);

  // Track price and other field differences for Audit Trail
  const changes: Record<string, { from: any; to: any }> = {};
  const isPriceChanged = rest.price !== undefined && Number(rest.price) !== Number(existing.price);

  if (isPriceChanged) {
    changes.price = {
      from: `${existing.currency || 'GHS'} ${Number(existing.price).toFixed(2)}`,
      to: `${(rest.currency || existing.currency) || 'GHS'} ${Number(rest.price).toFixed(2)}`,
    };
  }
  if (rest.name !== undefined && rest.name.trim() !== existing.name) {
    changes.name = { from: existing.name, to: rest.name.trim() };
  }
  if (rest.quantityTotal !== undefined && (rest.quantityTotal ? Number(rest.quantityTotal) : null) !== existing.quantityTotal) {
    changes.quantityTotal = {
      from: existing.quantityTotal ? `${existing.quantityTotal}` : "Unlimited",
      to: rest.quantityTotal ? `${rest.quantityTotal}` : "Unlimited",
    };
  }
  if (rest.status !== undefined && rest.status !== existing.status) {
    changes.status = { from: existing.status, to: rest.status };
  }

  const updated = await prisma.ticketType.update({
    where: { id },
    data: updateData,
  });

  const finalEventId = eventId || existing.eventId;

  // Record Audit Trail
  if (Object.keys(changes).length > 0) {
    const action = isPriceChanged ? "ticket_price_changed" : "ticket_updated";
    const description = isPriceChanged
      ? `Updated price for ticket "${updated.name}" from ${changes.price!.from} to ${changes.price!.to}`
      : `Updated ticket tier "${updated.name}" (${Object.keys(changes).join(", ")})`;

    await logEventActivity({
      eventId: finalEventId,
      organizationId,
      userId: session.userId,
      action,
      entityType: "ticket",
      entityId: id,
      description,
      metadata: {
        ticketId: id,
        ticketName: updated.name,
        changes,
        isPriceChanged,
      },
    });
  }

  if (finalEventId) {
    revalidatePath(`/my-events/${finalEventId}`);
  }
  return serializeJsonSafe(updated);
}

export async function deleteTicketType({ data }: { data: any }): Promise<any> {
  const session = await requireSession();
  const targetId = data.id || data.ticketTypeId;

  const existing = await prisma.ticketType.findUnique({
    where: { id: targetId },
  });

  await prisma.ticketType.delete({ where: { id: targetId } });

  if (existing) {
    await logEventActivity({
      eventId: existing.eventId,
      userId: session.userId,
      action: "ticket_deleted",
      entityType: "ticket",
      entityId: targetId,
      description: `Deleted ticket tier "${existing.name}" (Price: ${existing.currency || 'GHS'} ${Number(existing.price).toFixed(2)})`,
      metadata: {
        ticketId: targetId,
        ticketName: existing.name,
        price: Number(existing.price),
      },
    });
  }

  if (existing?.eventId) {
    revalidatePath(`/my-events/${existing.eventId}`);
  }

  return { success: true };
}
