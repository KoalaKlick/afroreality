// src/lib/services/whatsapp.ts
// WhatsApp Cloud API Integration for Fextiva (Afroreality)

const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN || "";
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const GRAPH_API_VERSION = "v22.0";

/**
 * Normalizes any phone number into international format without '+' or spaces.
 * E.g., "050 989 7757" -> "233509897757", "+233509897757" -> "233509897757"
 */
export function normalizePhoneNumber(phone: string, defaultCountryCode = "233"): string {
	const cleaned = phone.replace(/[^0-9]/g, "");
	if (cleaned.startsWith("0") && cleaned.length === 10) {
		return `${defaultCountryCode}${cleaned.slice(1)}`;
	}
	return cleaned;
}

export interface WhatsAppTemplateComponent {
	type: "header" | "body" | "button";
	sub_type?: "url" | "quick_reply";
	index?: string | number;
	parameters: Array<{
		type: "text" | "currency" | "date_time" | "image" | "document" | "video";
		text?: string;
		image?: { link: string };
		document?: { link: string; filename?: string };
	}>;
}

export interface SendWhatsAppResponse {
	success: boolean;
	messageId?: string;
	error?: string;
	raw?: any;
}

/**
 * Sends a raw text message via WhatsApp Cloud API.
 * Note: When initiated by business outside the 24-hour customer window, Meta requires templates.
 */
export async function sendWhatsAppTextMessage({
	to,
	text,
	previewUrl = false,
}: {
	to: string;
	text: string;
	previewUrl?: boolean;
}): Promise<SendWhatsAppResponse> {
	if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
		console.warn("[WhatsApp] Missing WHATSAPP_API_TOKEN or WHATSAPP_PHONE_NUMBER_ID");
		return { success: false, error: "WhatsApp credentials not configured" };
	}

	const formattedPhone = normalizePhoneNumber(to);

	try {
		const res = await fetch(
			`https://graph.facebook.com/${GRAPH_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					messaging_product: "whatsapp",
					recipient_type: "individual",
					to: formattedPhone,
					type: "text",
					text: {
						preview_url: previewUrl,
						body: text,
					},
				}),
			},
		);

		const data = await res.json();

		if (!res.ok || data.error) {
			console.error("[WhatsApp] Failed to send text message:", data.error);
			return {
				success: false,
				error: data.error?.message || "Failed to send WhatsApp message",
				raw: data,
			};
		}

		return {
			success: true,
			messageId: data.messages?.[0]?.id,
			raw: data,
		};
	} catch (error: any) {
		console.error("[WhatsApp] Exception while sending message:", error);
		return { success: false, error: error.message || "Network error" };
	}
}

/**
 * Sends an approved WhatsApp Template message.
 * Required by Meta for all outbound transactional notifications.
 */
export async function sendWhatsAppTemplateMessage({
	to,
	templateName,
	languageCode = "en_US",
	components = [],
}: {
	to: string;
	templateName: string;
	languageCode?: string;
	components?: WhatsAppTemplateComponent[];
}): Promise<SendWhatsAppResponse> {
	if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
		console.warn("[WhatsApp] Missing WHATSAPP_API_TOKEN or WHATSAPP_PHONE_NUMBER_ID");
		return { success: false, error: "WhatsApp credentials not configured" };
	}

	const formattedPhone = normalizePhoneNumber(to);

	try {
		const res = await fetch(
			`https://graph.facebook.com/${GRAPH_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					messaging_product: "whatsapp",
					to: formattedPhone,
					type: "template",
					template: {
						name: templateName,
						language: { code: languageCode },
						components: components.length > 0 ? components : undefined,
					},
				}),
			},
		);

		const data = await res.json();

		if (!res.ok || data.error) {
			console.error("[WhatsApp] Failed to send template message:", data.error);
			return {
				success: false,
				error: data.error?.message || "Failed to send WhatsApp template",
				raw: data,
			};
		}

		return {
			success: true,
			messageId: data.messages?.[0]?.id,
			raw: data,
		};
	} catch (error: any) {
		console.error("[WhatsApp] Exception while sending template:", error);
		return { success: false, error: error.message || "Network error" };
	}
}

/**
 * Helper to notify attendee upon ticket confirmation
 */
export async function sendTicketWhatsAppNotification({
	phone,
	attendeeName,
	eventTitle,
	ticketCode,
	ticketUrl,
}: {
	phone: string;
	attendeeName: string;
	eventTitle: string;
	ticketCode: string;
	ticketUrl?: string;
}): Promise<SendWhatsAppResponse> {
	// First attempt template message if registered
	const templateRes = await sendWhatsAppTemplateMessage({
		to: phone,
		templateName: "fextiva_ticket_confirmation",
		languageCode: "en_US",
		components: [
			{
				type: "body",
				parameters: [
					{ type: "text", text: attendeeName || "Attendee" },
					{ type: "text", text: eventTitle },
					{ type: "text", text: ticketCode },
				],
			},
		],
	});

	// If template is pending or not yet approved, attempt standard text message fallback
	if (!templateRes.success) {
		const fallbackText = `🎟️ *Fextiva Ticket Confirmed*\n\nHi ${attendeeName || "there"},\nYour ticket for *${eventTitle}* is confirmed!\n\n*Ticket Code:* ${ticketCode}${ticketUrl ? `\n\nView Ticket: ${ticketUrl}` : ""}\n\nThank you for choosing Fextiva!`;
		return sendWhatsAppTextMessage({ to: phone, text: fallbackText });
	}

	return templateRes;
}

/**
 * Helper to send voting receipt upon successful vote purchase
 */
export async function sendVoteReceiptWhatsAppNotification({
	phone,
	voterName,
	nomineeName,
	categoryName,
	votesCount,
	reference,
}: {
	phone: string;
	voterName?: string;
	nomineeName: string;
	categoryName?: string;
	votesCount: number | string;
	reference: string;
}): Promise<SendWhatsAppResponse> {
	// First attempt template message if registered
	const templateRes = await sendWhatsAppTemplateMessage({
		to: phone,
		templateName: "fextiva_vote_receipt",
		languageCode: "en_US",
		components: [
			{
				type: "body",
				parameters: [
					{ type: "text", text: voterName || "Voter" },
					{ type: "text", text: nomineeName },
					{ type: "text", text: String(votesCount) },
					{ type: "text", text: reference },
				],
			},
		],
	});

	// If template is pending, attempt fallback text
	if (!templateRes.success) {
		const fallbackText = `🏆 *Fextiva Vote Receipt*\n\nHi ${voterName || "there"},\nThank you for voting for *${nomineeName}*${categoryName ? ` in *${categoryName}*` : ""}!\n\n*Votes Cast:* ${votesCount}\n*Reference:* ${reference}\n\nThank you for using Fextiva!`;
		return sendWhatsAppTextMessage({ to: phone, text: fallbackText });
	}

	return templateRes;
}
