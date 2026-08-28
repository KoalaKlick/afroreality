"use server";

import { prisma } from "@repo/db";
import { getSession } from "@/lib/dal/auth";

export async function createTicketOrder({ data }: { data: any }): Promise<any> {
  const session = await getSession();
  const userId = session?.id;

  try {
    const order = await prisma.$transaction(async (tx) => {
      const ticketType = await tx.ticketType.findUnique({
        where: { id: data.ticketTypeId },
      });
      if (!ticketType || ticketType.eventId !== data.eventId) {
        throw new Error("Invalid ticket type");
      }

      const sold = await tx.ticket.count({
        where: {
          ticketTypeId: data.ticketTypeId,
          order: { status: "completed" },
        },
      });

      if (
        ticketType.quantityTotal !== null &&
        sold + data.quantity > ticketType.quantityTotal
      ) {
        throw new Error("Not enough tickets available");
      }

      const orderNumber = `ORD-${crypto.randomUUID().slice(0, 8)}`;
      const subtotal = Number(ticketType.price) * data.quantity;
      const fees = 0;
      const discountAmount = 0;
      const totalAmount = subtotal + fees - discountAmount;

      const order = await tx.ticketOrder.create({
        data: {
          eventId: data.eventId,
          orderNumber,
          buyerName: data.buyerName,
          buyerPhone: data.buyerPhone || null,
          buyerId: userId || null,
          subtotal,
          fees,
          discountAmount,
          status: "pending",
        },
      });

      return order;
    });

    return { success: true, order };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create ticket order" };
  }
}

export async function checkInTicket({ data }: { data: { ticketId: string; eventId: string } }): Promise<any> {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: data.ticketId },
    });
    if (!ticket || ticket.eventId !== data.eventId) {
      throw new Error("Invalid ticket");
    }

    const updated = await prisma.ticket.update({
      where: { id: data.ticketId },
      data: {
        checkInStatus: "checked_in",
        checkedInAt: new Date(),
      },
    });

    return { success: true, ticket: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Check-in failed" };
  }
}
