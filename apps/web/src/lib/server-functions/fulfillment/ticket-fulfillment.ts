import { prisma } from "@repo/db";
import { createTicketToken } from "@/lib/ticket-crypto";
import { sendTicketConfirmationEmail } from "@/lib/email/ticket";
import { normalizePhoneNumber } from "@/lib/services/whatsapp";
import { getEventMessagingConfig } from "@/lib/server-functions/event-messaging-config";
import { dispatchTicketChannelNotification } from "@/lib/server-functions/fulfillment/notifications";
import { resolvePayerName } from "@/lib/server-functions/fulfillment/payer-name";
import { getFrontendBaseUrl } from "@/lib/utils";

function buildOrgColors(org: any) {
	if (!org) return undefined;
	return {
		primary: org.primaryColor || undefined,
		secondary: org.secondaryColor || undefined,
		tertiary: org.tertiaryColor || undefined,
	};
}

async function fetchNotifEvent(eventId: string) {
	return prisma.event.findUnique({
		where: { id: eventId },
		select: {
			title: true,
			flierImage: true,
			bannerImage: true,
			organization: {
				select: {
					name: true,
					primaryColor: true,
					secondaryColor: true,
					tertiaryColor: true,
				},
			},
		},
	});
}

export async function fulfillTicketPurchase({
	payment,
	metadata,
	paystackData,
}: {
	payment: any;
	metadata: any;
	paystackData?: any;
}): Promise<{ generatedTickets: any[] }> {
	let generatedTickets: any[] = [];
	let ticketOrderId = metadata.ticketOrderId || metadata.orderId || payment.ticketOrders?.[0]?.id;
	const ticketTypeId = metadata.ticketTypeId || metadata.optionId;
	const eventId = metadata.eventId;
	const quantity = Math.max(1, Number(metadata.quantity) || 1);
	const payerPhone =
		metadata.phoneNumber ||
		metadata.buyerPhone ||
		metadata.phone ||
		metadata.phone_number ||
		null;
	const resolvedPayerName = await resolvePayerName({
		paystackData,
		phone: payerPhone,
	});
	const buyerName =
		metadata.buyerName ||
		metadata.attendeeName ||
		resolvedPayerName ||
		`USSD Attendee (${payerPhone || payment.email})`;
	const buyerEmail = metadata.buyerEmail || metadata.attendeeEmail || payment.email;

	if (!ticketOrderId && ticketTypeId && eventId) {
		try {
			const newOrder = await prisma.ticketOrder.create({
				data: {
					eventId,
					paymentId: payment.id,
					orderNumber: `ORD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
					buyerName,
					buyerPhone: payerPhone,
					subtotal: payment.amount,
					status: "completed",
				},
				include: { tickets: true },
			});
			ticketOrderId = newOrder.id;
		} catch (err) {
			console.error("[TICKET] Failed to create TicketOrder for USSD:", err);
		}
	}

	if (!ticketOrderId) return { generatedTickets };

	const order = await prisma.ticketOrder.findUnique({
		where: { id: ticketOrderId },
		include: { tickets: true },
	});
	if (!order) return { generatedTickets };

	await prisma.ticketOrder.update({
		where: { id: ticketOrderId },
		data: { status: "completed" },
	});

	if (order.tickets.length === 0 && ticketTypeId) {
		const attendees = Array.isArray(metadata.attendees) ? metadata.attendees : [];
		for (let i = 0; i < quantity; i++) {
			const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
			const ticketCode = `TIX-${Date.now().toString().slice(-6)}-${randomSuffix}-${i + 1}`;
			const attendee = attendees[i];
			const isOtherRecipient =
				metadata.recipientPhone &&
				metadata.phoneNumber &&
				metadata.recipientPhone !== metadata.phoneNumber;
			const attendeeName =
				(attendee && typeof attendee.name === "string" && attendee.name.trim()) ||
				(isOtherRecipient ? `Attendee (${metadata.recipientPhone})` : buyerName);
			const attendeeEmail =
				(attendee && typeof attendee.email === "string" && attendee.email.trim()) ||
				buyerEmail ||
				null;
			const attendeePhone =
				(attendee && typeof attendee.phone === "string" && attendee.phone.trim()) ||
				metadata.recipientPhone ||
				payerPhone ||
				null;

			const ticket = await prisma.ticket.create({
				data: {
					orderId: order.id,
					eventId,
					ticketTypeId,
					ticketCode,
					attendeeName,
					attendeeEmail,
					attendeePhone,
				},
			});
			generatedTickets.push({
				id: ticket.id,
				ticketCode: ticket.ticketCode,
				token: createTicketToken(ticket.id, ticket.ticketCode),
			});
		}
		await prisma.ticketType.update({
			where: { id: ticketTypeId },
			data: { quantitySold: { increment: quantity } },
		});
	} else {
		generatedTickets = order.tickets.map((t) => ({
			id: t.id,
			ticketCode: t.ticketCode,
			token: createTicketToken(t.id, t.ticketCode),
		}));
	}

	await sendTicketNotifications({ payment, metadata, generatedTickets, order, resolvedBuyerName: buyerName });
	return { generatedTickets };
}

export async function sendTicketNotifications({
	payment,
	metadata,
	generatedTickets,
	order,
	resolvedBuyerName,
}: {
	payment: any;
	metadata: any;
	generatedTickets: any[];
	order: any;
	resolvedBuyerName?: string;
}) {
	const eventId = metadata.eventId;
	const buyerName =
		resolvedBuyerName ||
		metadata.buyerName ||
		metadata.attendeeName ||
		order?.buyerName ||
		`Attendee (${metadata.phoneNumber || payment.email})`;
	const recipientPhone =
		metadata.recipientPhone ||
		metadata.buyerPhone ||
		metadata.phone ||
		metadata.phone_number ||
		metadata.attendeePhone ||
		order?.buyerPhone ||
		null;
	const payerPhone = metadata.phoneNumber;
	const buyerEmail = metadata.buyerEmail || metadata.attendeeEmail || payment.email;
	const totalAmount = Number(metadata.baseAmount || metadata.totalToCharge || payment.amount || 0);
	const unitPrice = generatedTickets.length > 0 ? totalAmount / generatedTickets.length : 0;

	if (!eventId || generatedTickets.length === 0) return;

	const [notifEvent, messagingConfig] = await Promise.all([
		fetchNotifEvent(eventId),
		getEventMessagingConfig(eventId),
	]);
	if (!notifEvent) return;

	const orgColors = buildOrgColors(notifEvent.organization);
	const ticketChannel = messagingConfig?.ticketConfirmChannel || "whatsapp";

	const allAttendeeNames: string[] = [];
	if (generatedTickets.length > 1) {
		for (const tkt of generatedTickets) {
			const rec = await prisma.ticket.findUnique({
				where: { id: tkt.id },
				select: { attendeeName: true },
			});
			allAttendeeNames.push(rec?.attendeeName || "Attendee");
		}
	}

	// 1. Channel-aware ticket pass delivery to recipient
	if (recipientPhone) {
		const phone = normalizePhoneNumber(recipientPhone);
		if (phone) {
			await dispatchTicketChannelNotification({
				ticketIds: generatedTickets.map((t) => t.id),
				phone,
				attendeeName: buyerName,
				eventTitle: notifEvent.title,
				ticketCode: generatedTickets.map((t) => t.ticketCode).join(", "),
				ticketToken: generatedTickets[0]?.token,
				bannerImageUrl: notifEvent.flierImage || notifEvent.bannerImage || undefined,
				attendeeNames: allAttendeeNames.length > 1 ? allAttendeeNames : undefined,
				eventId,
				channel: ticketChannel,
			}).catch((err) => console.error("[Notify] Recipient ticket dispatch failed:", err));
		}
	}

	// 2. If bought for someone else, also notify the payer
	if (payerPhone && recipientPhone && payerPhone !== recipientPhone) {
		const payerNormalized = normalizePhoneNumber(payerPhone);
		if (payerNormalized) {
			await dispatchTicketChannelNotification({
				ticketIds: generatedTickets.map((t) => t.id),
				phone: payerNormalized,
				attendeeName: `Buyer (${payerPhone})`,
				eventTitle: notifEvent.title,
				ticketCode: generatedTickets.map((t) => t.ticketCode).join(", "),
				ticketToken: generatedTickets[0]?.token,
				bannerImageUrl: notifEvent.flierImage || notifEvent.bannerImage || undefined,
				attendeeNames: allAttendeeNames.length > 1 ? allAttendeeNames : undefined,
				eventId,
				channel: ticketChannel,
				isBuyerReceipt: true,
			}).catch((err) => console.error("[Notify] Buyer receipt dispatch failed:", err));
		}
	}

	const baseUrl = getFrontendBaseUrl();
	const primaryTicket = generatedTickets[0];
	const primaryPassViewUrl = `${baseUrl}/ticket/view?token=${primaryTicket.token}`;
	const cleanBuyerEmail = buyerEmail ? String(buyerEmail).trim().toLowerCase() : null;
	const emailedAddresses = new Set();

	if (cleanBuyerEmail) {
		emailedAddresses.add(cleanBuyerEmail);
		sendTicketConfirmationEmail({
			email: cleanBuyerEmail,
			attendeeName: buyerName,
			eventName: notifEvent.title,
			organizationName: notifEvent.organization?.name || "Fextiva",
			ticketTypeName: metadata.ticketTypeName || "Ticket",
			ticketCode: primaryTicket.ticketCode,
			viewUrl: primaryPassViewUrl,
			bannerUrl: notifEvent.flierImage || notifEvent.bannerImage,
			isFree: false,
			amountPaid: totalAmount,
			currency: "GHS",
			isPrimaryBuyer: true,
			orderNumber: metadata.orderNumber || order?.orderNumber,
			totalTickets: generatedTickets.length,
			allTicketCodes: generatedTickets.map((t) => t.ticketCode),
			attendeeNames: allAttendeeNames.length > 1 ? allAttendeeNames : undefined,
			orgColors,
		}).catch((err) =>
			console.error(`[EMAIL:TICKET] Buyer email failed:`, err),
		);
	}

	for (let i = 0; i < generatedTickets.length; i++) {
		const tkt = generatedTickets[i];
		const ticketRecord = await prisma.ticket.findUnique({
			where: { id: tkt.id },
			select: {
				attendeeName: true,
				attendeeEmail: true,
				attendeePhone: true,
				whatsappSent: true,
				smsSent: true,
				ticketType: { select: { name: true } },
			},
		});

		const passViewUrl = `${baseUrl}/ticket/view?token=${tkt.token}`;
		const recipientEmail = ticketRecord?.attendeeEmail?.trim().toLowerCase() ?? null;

		if (recipientEmail && !emailedAddresses.has(recipientEmail)) {
			emailedAddresses.add(recipientEmail);
			sendTicketConfirmationEmail({
				email: recipientEmail,
				attendeeName: ticketRecord?.attendeeName || "Attendee",
				eventName: notifEvent.title,
				organizationName: notifEvent.organization?.name || "Fextiva",
				ticketTypeName: ticketRecord?.ticketType?.name || metadata.ticketTypeName || "Ticket",
				ticketCode: tkt.ticketCode,
				viewUrl: passViewUrl,
				bannerUrl: notifEvent.flierImage || notifEvent.bannerImage,
				isFree: false,
				amountPaid: unitPrice,
				currency: "GHS",
				isPrimaryBuyer: false,
				totalTickets: 1,
				orgColors,
			}).catch((err) =>
				console.error(`[EMAIL:TICKET] Attendee email failed for ${tkt.ticketCode}:`, err),
			);
		}

		const attendeePhone = ticketRecord?.attendeePhone;
		const attendeeNotSent = !ticketRecord?.whatsappSent && !ticketRecord?.smsSent;
		if (attendeePhone && attendeePhone !== recipientPhone && attendeeNotSent) {
			const phone = normalizePhoneNumber(attendeePhone);
			if (phone) {
				dispatchTicketChannelNotification({
					ticketIds: [tkt.id],
					phone,
					attendeeName: ticketRecord?.attendeeName || "Attendee",
					eventTitle: notifEvent.title,
					ticketCode: tkt.ticketCode,
					ticketToken: tkt.token,
					bannerImageUrl: notifEvent.flierImage || notifEvent.bannerImage || undefined,
					eventId,
					channel: ticketChannel,
				}).catch((err) =>
					console.error(`[Notify] Attendee ticket dispatch failed for ${tkt.ticketCode}:`, err),
				);
			}
		}
	}
}
