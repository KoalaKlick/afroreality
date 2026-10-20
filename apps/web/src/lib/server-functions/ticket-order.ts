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
        include: { event: true },
      });
      if (!ticketType || ticketType.eventId !== data.eventId) {
        throw new Error("Invalid ticket type");
      }

      if (ticketType.status !== "available") {
        throw new Error("This ticket tier is currently not available for purchase.");
      }

      const now = new Date();
      if (ticketType.salesStart && now < new Date(ticketType.salesStart)) {
        const startsFormatted = new Date(ticketType.salesStart).toLocaleString("en-GH", {
          dateStyle: "medium",
          timeStyle: "short",
        });
        throw new Error(`Ticket sales for "${ticketType.name}" have not started yet (starts ${startsFormatted}).`);
      }

      if (ticketType.salesEnd && now > new Date(ticketType.salesEnd)) {
        throw new Error(`Ticket sales for "${ticketType.name}" have ended.`);
      }

      if (ticketType.event?.status === "cancelled" || ticketType.event?.status === "ended") {
        throw new Error("Ticket sales for this event are closed.");
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
    const { getAuthState } = await import("@/lib/auth-guards");
    const { isPlatformAdmin } = await import("@/lib/admin/admin-auth");

    const auth = await getAuthState();
    if (!auth) {
      throw new Error("Authentication required.");
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: data.ticketId },
      include: {
        event: {
          include: { organization: true },
        },
      },
    });
    if (!ticket || ticket.eventId !== data.eventId) {
      throw new Error("Invalid ticket");
    }

    const isAdmin = await isPlatformAdmin(auth.email);
    const isEventCreator = ticket.event.creatorId === auth.userId;
    const isOrgCreator = ticket.event.organization?.createdBy === auth.userId;
    const membership = (isAdmin || isEventCreator || isOrgCreator)
      ? true
      : Boolean(
          await prisma.teamMember.findUnique({
            where: {
              organizationId_userId: {
                organizationId: ticket.event.organizationId,
                userId: auth.userId,
              },
            },
            select: { role: true },
          })
        );

    if (!membership) {
      throw new Error("You are not authorized to check in tickets for this event.");
    }

    const updated = await prisma.ticket.update({
      where: { id: data.ticketId },
      data: {
        checkInStatus: "checked_in",
        checkedInAt: new Date(),
        checkedInBy: auth.userId,
      },
    });

    return { success: true, ticket: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Check-in failed" };
  }
}
