import { prisma } from "@repo/db";
import { createTicketToken } from "@/lib/ticket-crypto";
import { sendTicketConfirmationEmail } from "@/lib/email/ticket";
import { sendNominationConfirmationEmail } from "@/lib/email/nomination";
import { sendTicketWhatsAppNotification, sendVoteReceiptWhatsAppNotification } from "@/lib/services/whatsapp";
import { getFrontendBaseUrl } from "@/lib/utils";

/**
 * Dispatches pending WhatsApp + Email notifications for already-completed payments.
 * Safe to call multiple times — uses atomic claims and dispatched flags.
 */
export async function dispatchPendingNotificationsIfAny({
	payment,
	metadata,
	paystackData,
}: {
	payment: any;
	metadata: any;
	paystackData?: any;
}) {
	try {
		const purpose = payment.purpose || metadata?.purpose || "general";

		// ── Tickets ──────────────────────────────────────────────────────────
		if (purpose === "ticket_purchase") {
			let order = payment.ticketOrders?.[0];
			if (!order) {
				order = await prisma.ticketOrder.findFirst({
					where: { paymentId: payment.id },
					include: { tickets: true },
				});
			}
			const tickets = order?.tickets || [];
			const alreadyDispatched = metadata?.notificationsDispatched === true;
			const unsentWhatsapp = tickets.some((t: any) => !t.whatsappSent);
			if ((!alreadyDispatched || unsentWhatsapp) && tickets.length > 0) {
				const eventId = metadata.eventId || order?.eventId;
				const buyerName = metadata.buyerName || metadata.attendeeName || order?.buyerName || `Attendee (${payment.email})`;
				const buyerPhone = metadata.buyerPhone || metadata.phone || metadata.phone_number || metadata.attendeePhone || order?.buyerPhone || null;
				const buyerEmail = metadata.buyerEmail || metadata.attendeeEmail || payment.email;

				const notifEvent = eventId ? await prisma.event.findUnique({
					where: { id: eventId },
					select: {
						title: true, flierImage: true, bannerImage: true,
						organization: { select: { name: true, primaryColor: true, secondaryColor: true, tertiaryColor: true } },
					},
				}) : null;

				const formattedTickets = tickets.map((t: any) => ({
					id: t.id,
					ticketCode: t.ticketCode,
					token: createTicketToken(t.id, t.ticketCode),
				}));
				const allAttendeeNames: string[] = tickets.filter((t: any) => t.attendeeName).map((t: any) => t.attendeeName);
				const orgColors = notifEvent?.organization ? {
					primary: notifEvent.organization.primaryColor || undefined,
					secondary: notifEvent.organization.secondaryColor || undefined,
					tertiary: notifEvent.organization.tertiaryColor || undefined,
				} : undefined;

				// WhatsApp — atomic claim
				if (buyerPhone && notifEvent && unsentWhatsapp) {
					try {
						const claimed = await prisma.ticket.updateMany({
							where: { id: { in: tickets.map((t: any) => t.id) }, whatsappSent: false },
							data: { whatsappSent: true },
						});
						if (claimed.count > 0) {
							await sendTicketWhatsAppNotification({
								phone: buyerPhone,
								attendeeName: buyerName,
								eventTitle: notifEvent.title || "Fextiva Event",
								ticketCode: formattedTickets.map((t: any) => t.ticketCode).join(", "),
								ticketToken: formattedTickets[0]?.token,
								bannerImageUrl: notifEvent.flierImage || notifEvent.bannerImage || undefined,
								attendeeNames: allAttendeeNames.length > 1 ? allAttendeeNames : undefined,
							});
						} else {
							console.log("[WhatsApp] Recovery: already claimed, skipping duplicate.");
						}
					} catch (waErr) {
						console.error("[WhatsApp] Recovery ticket notification failed:", waErr);
					}
				}

				// Email
				if (buyerEmail && notifEvent && !alreadyDispatched) {
					const baseUrl = getFrontendBaseUrl();
					const primaryTicket = formattedTickets[0];
					try {
						await sendTicketConfirmationEmail({
							email: String(buyerEmail).trim().toLowerCase(),
							attendeeName: buyerName,
							eventName: notifEvent.title,
							organizationName: notifEvent.organization?.name || "Fextiva",
							ticketTypeName: metadata.ticketTypeName || "Ticket",
							ticketCode: primaryTicket.ticketCode,
							viewUrl: `${baseUrl}/ticket/view?token=${primaryTicket.token}`,
							bannerUrl: notifEvent.flierImage || notifEvent.bannerImage,
							isFree: false,
							amountPaid: Number(metadata.baseAmount || metadata.totalToCharge || payment.amount || 0),
							currency: "GHS",
							isPrimaryBuyer: true,
							orderNumber: metadata.orderNumber || order?.orderNumber,
							totalTickets: tickets.length,
							allTicketCodes: formattedTickets.map((t: any) => t.ticketCode),
							attendeeNames: allAttendeeNames.length > 1 ? allAttendeeNames : undefined,
							orgColors,
						});
					} catch (emailErr) {
						console.error("[EMAIL:TICKET] Recovery email failed:", emailErr);
					}
				}

				await prisma.payment.update({
					where: { id: payment.id },
					data: { metadata: { ...metadata, notificationsDispatched: true } },
				}).catch(() => {});
			}
		}

		// ── Votes ────────────────────────────────────────────────────────────
		if (purpose === "voting" || purpose === "vote_purchase") {
			const voterPhone = metadata.voterPhone || metadata.phone || metadata.phone_number || paystackData?.customer?.phone;
			if (voterPhone && !metadata.voteNotificationSent) {
				const optionId = metadata.optionId || metadata.votingOptionId || metadata.option_id;
				const voteCount = Math.max(1, Number(metadata.voteCount) || Number(metadata.quantity) || 1);
				try {
					const option = optionId ? await prisma.votingOption.findUnique({
						where: { id: optionId },
						include: { category: true },
					}) : null;
					await sendVoteReceiptWhatsAppNotification({
						phone: voterPhone,
						voterName: metadata.voterName || undefined,
						nomineeName: option?.optionText || "Nominee",
						categoryName: option?.category?.name || undefined,
						votesCount: voteCount,
						reference: payment.reference,
					});
					await prisma.payment.update({
						where: { id: payment.id },
						data: { metadata: { ...metadata, voteNotificationSent: true } },
					}).catch(() => {});
				} catch (waErr) {
					console.error("[WhatsApp] Recovery vote receipt failed:", waErr);
				}
			}
		}

		// ── Nominations ──────────────────────────────────────────────────────
		if (purpose === "nomination" && !metadata.nominationNotificationSent) {
			const optionId = metadata.optionId || metadata.nomineeId;
			if (optionId) {
				try {
					const option = await prisma.votingOption.findUnique({
						where: { id: optionId },
						include: { category: true, event: { include: { organization: true } } },
					});
					if (option) {
						const recipientEmail = option.nominatedByEmail || option.email || payment.email;
						const org = option.event?.organization;
						if (recipientEmail) {
							await sendNominationConfirmationEmail({
								email: recipientEmail,
								recipientName: option.nominatedByName || recipientEmail,
								nomineeName: option.optionText,
								categoryName: option.category?.name || "Category",
								eventName: option.event?.title || "Event",
								status: option.status,
								deletionCode: option.status === "approved" ? option.deletionCode : null,
								organizationName: org?.name || "Fextiva",
								bannerUrl: option.event?.bannerImage || option.event?.flierImage,
								eventUrl: option.event?.slug ? `${getFrontendBaseUrl()}/event/${option.event.slug}` : undefined,
								orgColors: org ? { primary: org.primaryColor || undefined, secondary: org.secondaryColor || undefined, tertiary: org.tertiaryColor || undefined } : undefined,
							});
							await prisma.payment.update({
								where: { id: payment.id },
								data: { metadata: { ...metadata, nominationNotificationSent: true } },
							}).catch(() => {});
						}
					}
				} catch (nomErr) {
					console.error("[Nomination] Recovery email failed:", nomErr);
				}
			}
		}
	} catch (err) {
		console.error("[FULFILLMENT] dispatchPendingNotificationsIfAny error:", err);
	}
}
