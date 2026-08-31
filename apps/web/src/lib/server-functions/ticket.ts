"use server";
import { prisma } from '@repo/db';
import { revalidatePath } from 'next/cache';
import { requireSession } from '../session';
import { serializeJsonSafe } from '../utils';
import { MIN_PAID_TICKET_PRICE } from '../constants/pricing';

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
  await requireSession();

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

  revalidatePath(`/my-events/${data.eventId}`);
  return serializeJsonSafe(ticket);
}

export async function updateTicketType({ data }: { data: any }): Promise<any> {
  await requireSession();
  const { id, eventId, organizationId, ...rest } = data;

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

  const updated = await prisma.ticketType.update({
    where: { id },
    data: updateData,
  });

  if (eventId) {
    revalidatePath(`/my-events/${eventId}`);
  }
  return serializeJsonSafe(updated);
}

export async function deleteTicketType({ data }: { data: any }): Promise<any> {
  await requireSession();
  const targetId = data.id || data.ticketTypeId;
  await prisma.ticketType.delete({ where: { id: targetId } });
  return { success: true };
}
