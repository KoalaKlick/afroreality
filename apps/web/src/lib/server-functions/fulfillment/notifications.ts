import { prisma } from "@repo/db";
import { createTicketToken } from "@/lib/ticket-crypto";
import { sendTicketConfirmationEmail } from "@/lib/email/ticket";
import { sendNominationConfirmationEmail } from "@/lib/email/nomination";
import {
	sendTicketWhatsAppNotification,
	sendVoteReceiptWhatsAppNotification,
} from "@/lib/services/whatsapp";
import {
	sendTicketSmsConfirmation,
	sendVoteReceiptSms,
	sendNominationSms,
} from "@/lib/services/sms";
import { getEventMessagingConfig } from "@/lib/server-functions/event-messaging-config";
import { getFrontendBaseUrl } from "@/lib/utils";

// ─── Channel Routing Helpers ──────────────────────────────────────────────────

/**
 * Routes a ticket WhatsApp notification with atomic claim.
 * Returns true if sent.
 */
async function dispatchTicketWhatsApp({
	ticketIds,
	phone,
	attendeeName,
	eventTitle,
	ticketCode,
	ticketToken,
	bannerImageUrl,
	attendeeNames,
	eventId,
}: {
	ticketIds: string[];
	phone: string;
	attendeeName: string;
	eventTitle: string;
	ticketCode: string;
	ticketToken?: string;
	bannerImageUrl?: string;
	attendeeNames?: string[];
	eventId?: string;
}): Promise<boolean> {
	try {
		const claimed = await prisma.ticket.updateMany({
			where: { id: { in: ticketIds }, whatsappSent: false },
			data: { whatsappSent: true },
		});
		if (claimed.count === 0) return false; // already sent

		const result = await sendTicketWhatsAppNotification({
			phone,
			attendeeName,
			eventTitle,
			ticketCode,
			ticketToken,
			bannerImageUrl,
			attendeeNames,
		});
		return result.success;
	} catch (err) {
		console.error("[WA] dispatchTicketWhatsApp error:", err);
		return false;
	}
}

/**
 * Routes a ticket SMS notification with atomic claim.
 * Returns true if sent.
 */
async function dispatchTicketSms({
	ticketIds,
	phone,
	attendeeName,
	eventTitle,
	ticketCode,
	ticketToken,
	eventId,
}: {
	ticketIds: string[];
	phone: string;
	attendeeName: string;
	eventTitle: string;
	ticketCode: string;
	ticketToken?: string;
	eventId?: string;
}): Promise<boolean> {
	try {
		const claimed = await prisma.ticket.updateMany({
			where: { id: { in: ticketIds }, smsSent: false },
			data: { smsSent: true },
		});
		if (claimed.count === 0) return false;

		const result = await sendTicketSmsConfirmation({
			phone,
			attendeeName,
			eventTitle,
			ticketCode,
			ticketToken,
			eventId,
		});
		return result.success;
	} catch (err) {
		console.error("[SMS] dispatchTicketSms error:", err);
		return false;
	}
}

/**
 * Dispatches ticket confirmation on the configured channel.
 * Channel logic:
 *   "whatsapp"     → WA only
 *   "sms"          → SMS only
 *   "whatsapp_sms" → WA first; if WA fails, fallback to SMS (cost-optimized)
 *   "none"         → skip
 */
export async function dispatchTicketChannelNotification({
	ticketIds,
	phone,
	attendeeName,
	eventTitle,
	ticketCode,
	ticketToken,
	bannerImageUrl,
	attendeeNames,
	eventId,
	channel,
}: {
	ticketIds: string[];
	phone: string;
	attendeeName: string;
	eventTitle: string;
	ticketCode: string;
	ticketToken?: string;
	bannerImageUrl?: string;
	attendeeNames?: string[];
	eventId?: string;
	channel: string;
}): Promise<void> {
	if (channel === "none") return;

	if (channel === "whatsapp") {
		await dispatchTicketWhatsApp({ ticketIds, phone, attendeeName, eventTitle, ticketCode, ticketToken, bannerImageUrl, attendeeNames, eventId });
		return;
	}

	if (channel === "sms") {
		await dispatchTicketSms({ ticketIds, phone, attendeeName, eventTitle, ticketCode, ticketToken, eventId });
		return;
	}

	if (channel === "whatsapp_sms") {
		// Try WA first — if success, done. If fail, fallback to SMS.
		const waSent = await dispatchTicketWhatsApp({ ticketIds, phone, attendeeName, eventTitle, ticketCode, ticketToken, bannerImageUrl, attendeeNames, eventId });
		if (!waSent) {
			await dispatchTicketSms({ ticketIds, phone, attendeeName, eventTitle, ticketCode, ticketToken, eventId });
		}
		return;
	}
}

// ─── Main Dispatcher ──────────────────────────────────────────────────────────

/**
 * Dispatches pending WhatsApp + SMS + Email notifications for already-completed payments.
 * Safe to call multiple times — uses atomic claims and dispatched flags.
 * Reads per-event messaging config to determine which channel to use.
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

		// ── Tickets ────────────────────────────────────────────────────────────
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
			const unsentSms = tickets.some((t: any) => !t.smsSent);

			if (tickets.length > 0 && (!alreadyDispatched || unsentWhatsapp || unsentSms)) {
				const eventId = metadata.eventId || order?.eventId;
				const buyerName = metadata.buyerName || metadata.attendeeName || order?.buyerName || `Attendee (${payment.email})`;
				const buyerPhone = metadata.buyerPhone || metadata.phone || metadata.phone_number || metadata.attendeePhone || order?.buyerPhone || null;
				const buyerEmail = metadata.buyerEmail || metadata.attendeeEmail || payment.email;

				const [notifEvent, messagingConfig] = await Promise.all([
					eventId ? prisma.event.findUnique({
						where: { id: eventId },
						select: {
							title: true, flierImage: true, bannerImage: true,
							organization: { select: { name: true, primaryColor: true, secondaryColor: true, tertiaryColor: true } },
						},
					}) : Promise.resolve(null),
					eventId ? getEventMessagingConfig(eventId) : Promise.resolve(null),
				]);

				const ticketChannel = messagingConfig?.ticketConfirmChannel || "whatsapp";
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

				// Channel dispatch for buyer
				if (buyerPhone && notifEvent && (unsentWhatsapp || unsentSms)) {
					await dispatchTicketChannelNotification({
						ticketIds: tickets.map((t: any) => t.id),
						phone: buyerPhone,
						attendeeName: buyerName,
						eventTitle: notifEvent.title || "Fextiva Event",
						ticketCode: formattedTickets.map((t: any) => t.ticketCode).join(", "),
						ticketToken: formattedTickets[0]?.token,
						bannerImageUrl: notifEvent.flierImage || notifEvent.bannerImage || undefined,
						attendeeNames: allAttendeeNames.length > 1 ? allAttendeeNames : undefined,
						eventId,
						channel: ticketChannel,
					});
				}

				// Email (always, unless alreadyDispatched)
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

		// ── Votes ──────────────────────────────────────────────────────────────
		if (purpose === "voting" || purpose === "vote_purchase") {
			const voterPhone = metadata.voterPhone || metadata.phone || metadata.phone_number || paystackData?.customer?.phone;
			if (voterPhone && !metadata.voteNotificationSent) {
				const optionId = metadata.optionId || metadata.votingOptionId || metadata.option_id;
				const eventId = metadata.eventId;
				const voteCount = Math.max(1, Number(metadata.voteCount) || Number(metadata.quantity) || 1);

				const [option, messagingConfig] = await Promise.all([
					optionId ? prisma.votingOption.findUnique({
						where: { id: optionId },
						include: { category: true },
					}) : Promise.resolve(null),
					eventId ? getEventMessagingConfig(eventId) : Promise.resolve(null),
				]);

				const voteChannel = messagingConfig?.voteReceiptChannel || "whatsapp";

				try {
					let sent = false;

					if (voteChannel === "whatsapp" || voteChannel === "whatsapp_sms") {
						const waResult = await sendVoteReceiptWhatsAppNotification({
							phone: voterPhone,
							voterName: metadata.voterName || undefined,
							nomineeName: option?.optionText || "Nominee",
							categoryName: option?.category?.name || undefined,
							votesCount: voteCount,
							reference: payment.reference,
						});
						sent = waResult.success;
					}

					if (voteChannel === "sms" || (voteChannel === "whatsapp_sms" && !sent)) {
						await sendVoteReceiptSms({
							phone: voterPhone,
							voterName: metadata.voterName || undefined,
							nomineeName: option?.optionText || "Nominee",
							votesCount: voteCount,
							reference: payment.reference,
							eventId,
						});
					}

					await prisma.payment.update({
						where: { id: payment.id },
						data: { metadata: { ...metadata, voteNotificationSent: true } },
					}).catch(() => {});
				} catch (err) {
					console.error("[Notify] Vote receipt failed:", err);
				}
			}
		}

		// ── Nominations ────────────────────────────────────────────────────────
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
						const recipientPhone = option.phone || metadata.phone || metadata.phone_number || null;
						const org = option.event?.organization;
						const eventId = option.eventId;

						const messagingConfig = eventId ? await getEventMessagingConfig(eventId) : null;
						const nomChannel = messagingConfig?.nominationChannel || "email";

						const orgColors = org ? {
							primary: org.primaryColor || undefined,
							secondary: org.secondaryColor || undefined,
							tertiary: org.tertiaryColor || undefined,
						} : undefined;

						// Email leg
						if (recipientEmail && (nomChannel === "email" || nomChannel === "email_whatsapp")) {
							await sendNominationConfirmationEmail({
								email: recipientEmail,
								recipientName: option.nominatedByName || recipientEmail,
								nomineeName: option.optionText,
								categoryName: option.category?.name || "Category",
								eventName: option.event?.title || "Event",
								status: option.status,
								nomineeCode: option.nomineeCode,
								deletionCode: option.status === "approved" ? option.deletionCode : null,
								organizationName: org?.name || "Fextiva",
								bannerUrl: option.event?.bannerImage || option.event?.flierImage,
								eventUrl: option.event?.slug ? `${getFrontendBaseUrl()}/event/${option.event.slug}` : undefined,
								orgColors,
							}).catch((e: any) => console.error("[EMAIL:NOM] email failed:", e));
						}

						// WhatsApp leg
						if (recipientPhone && nomChannel === "email_whatsapp") {
							await sendVoteReceiptWhatsAppNotification({
								phone: recipientPhone,
								nomineeName: option.optionText,
								votesCount: 0,
								reference: payment.reference,
							}).catch(() => {});
						}

						// SMS leg
						if (recipientPhone && nomChannel === "sms") {
							await sendNominationSms({
								phone: recipientPhone,
								nomineeName: option.optionText,
								eventTitle: option.event?.title || "Event",
								categoryName: option.category?.name,
								status: option.status,
								nomineeCode: option.nomineeCode,
								eventId,
							}).catch(() => {});
						}

						await prisma.payment.update({
							where: { id: payment.id },
							data: { metadata: { ...metadata, nominationNotificationSent: true } },
						}).catch(() => {});
					}
				} catch (nomErr) {
					console.error("[Nomination] Recovery notification failed:", nomErr);
				}
			}
		}
	} catch (err) {
		console.error("[FULFILLMENT] dispatchPendingNotificationsIfAny error:", err);
	}
}
