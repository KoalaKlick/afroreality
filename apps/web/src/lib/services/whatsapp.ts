// src/lib/services/whatsapp.ts
// WhatsApp Cloud API Integration for Fextiva

import { getFrontendBaseUrl } from "@/lib/utils";
import { prisma } from "@repo/db";

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

/**
 * Returns true only if the URL is a public HTTPS URL that Meta's servers
 * can reach. Private CDN hostnames (e.g. Cloudflare R2 pub-*.r2.dev) are
 * not reachable by Meta and will cause error #100.
 */
function isMetaAccessibleImageUrl(url: string | undefined | null): boolean {
	if (!url) return false;
	try {
		const parsed = new URL(url);
		if (parsed.protocol !== "https:") return false;
		// Reject known private/CDN patterns that Meta cannot fetch
		const blockedPatterns = [
			/\.r2\.dev$/i,          // Cloudflare R2
			/\.r2\.cloudflarestorage\.com$/i,
			/localhost/i,
			/127\.0\.0\.1/,
			/\.local$/i,
		];
		return !blockedPatterns.some((re) => re.test(parsed.hostname));
	} catch {
		return false;
	}
}

/**
 * Rewrites a CDN/R2 image URL to go through the app's own image proxy
 * so that third-party services (e.g. Meta's WhatsApp API) can fetch it.
 *
 * Example:
 *   https://pub-abc.r2.dev/events/img.webp
 *   → https://fextiva.com/api/image-proxy?url=https%3A%2F%2Fpub-abc.r2.dev%2F...
 *
 * If the URL is already publicly accessible, it is returned unchanged.
 */
function toProxiedImageUrl(url: string | undefined | null): string | null {
	if (!url) return null;
	// If Meta can already reach it, use it directly
	if (isMetaAccessibleImageUrl(url)) return url;
	const baseUrl = getFrontendBaseUrl();
	// Only proxy if we have a real public base URL (not localhost)
	if (!baseUrl || baseUrl.includes("localhost")) return null;
	return `${baseUrl}/api/image-proxy?url=${encodeURIComponent(url)}`;
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
			try {
				await prisma.whatsAppMessageLog.create({
					data: {
						recipientPhone: formattedPhone,
						templateName: "direct_text",
						category: "SERVICE",
						status: "failed",
						isBillable: false,
						errorMessage: data.error?.message || "Failed to send WhatsApp message",
						rawPayload: data,
					},
				});
			} catch (_) {}
			return {
				success: false,
				error: data.error?.message || "Failed to send WhatsApp message",
				raw: data,
			};
		}

		const messageId = data.messages?.[0]?.id;
		if (messageId) {
			try {
				await prisma.whatsAppMessageLog.create({
					data: {
						messageId,
						recipientPhone: formattedPhone,
						templateName: "direct_text",
						category: "SERVICE",
						status: "sent",
						isBillable: true,
						estimatedCost: 0.007,
						rawPayload: data,
					},
				});
			} catch (_) {}
		}

		return {
			success: true,
			messageId,
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
			try {
				await prisma.whatsAppMessageLog.create({
					data: {
						recipientPhone: formattedPhone,
						templateName,
						category: "UTILITY",
						status: "failed",
						isBillable: false,
						errorMessage: data.error?.message || "Failed to send WhatsApp template",
						rawPayload: data,
					},
				});
			} catch (_) {}
			return {
				success: false,
				error: data.error?.message || "Failed to send WhatsApp template",
				raw: data,
			};
		}

		const messageId = data.messages?.[0]?.id;
		if (messageId) {
			try {
				await prisma.whatsAppMessageLog.create({
					data: {
						messageId,
						recipientPhone: formattedPhone,
						templateName,
						category: "UTILITY",
						status: "sent",
						isBillable: true,
						estimatedCost: 0.007,
						rawPayload: data,
					},
				});
			} catch (_) {}
		}

		return {
			success: true,
			messageId,
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
	ticketToken,
	bannerImageUrl,
}: {
	phone: string;
	attendeeName: string;
	eventTitle: string;
	ticketCode: string;
	ticketUrl?: string;
	ticketToken?: string;
	bannerImageUrl?: string;
}): Promise<SendWhatsAppResponse> {
	const baseUrl = getFrontendBaseUrl();
	const defaultLogoBanner = baseUrl.startsWith("http") && !baseUrl.includes("localhost")
		? `${baseUrl}/android-chrome-512x512.png`
		: "https://fextiva.com/android-chrome-512x512.png";

	// Rewrite blocked CDN URLs (e.g. R2) through our own domain proxy so Meta can fetch them.
	// Falls back to null (no header) if we can't make a public URL.
	const safeImageUrl = toProxiedImageUrl(bannerImageUrl) ?? toProxiedImageUrl(defaultLogoBanner);

	const bodyAndButton: WhatsAppTemplateComponent[] = [
		{
			type: "body",
			parameters: [
				{ type: "text", text: attendeeName || "Attendee" },
				{ type: "text", text: eventTitle },
				{ type: "text", text: ticketCode },
				{ type: "text", text: attendeeName || "Attendee" },
			],
		},
	];

	if (ticketToken || ticketCode) {
		bodyAndButton.push({
			type: "button",
			sub_type: "url",
			index: "0",
			parameters: [{ type: "text", text: ticketToken || ticketCode }],
		});
	}

	// Build components: with header image if the URL is safe, without otherwise
	const componentsWithHeader: WhatsAppTemplateComponent[] = safeImageUrl
		? [
				{
					type: "header",
					parameters: [{ type: "image", image: { link: safeImageUrl } }],
				},
				...bodyAndButton,
		  ]
		: bodyAndButton;

	// 1. Attempt with header (or without if image is unsafe)
	let templateRes = await sendWhatsAppTemplateMessage({
		to: phone,
		templateName: "fextiva_ticket_confirmation_en",
		languageCode: "en",
		components: componentsWithHeader,
	});

	// 2. If failed AND we sent with a header image, retry without the header
	if (!templateRes.success && safeImageUrl) {
		templateRes = await sendWhatsAppTemplateMessage({
			to: phone,
			templateName: "fextiva_ticket_confirmation_en",
			languageCode: "en",
			components: bodyAndButton,
		});
	}

	// 3. If template is still unavailable/pending, fall back to plain text
	if (!templateRes.success) {
		const fallbackText = `🎟️ *Fextiva Ticket Confirmed*\n\nHi ${attendeeName || "there"},\nYour ticket for *${eventTitle}* is confirmed!\n\n*Ticket ID:* ${ticketCode}${ticketUrl ? `\n\nView Ticket: ${ticketUrl}` : ""}\n\nThank you for choosing Fextiva!`;
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
		templateName: "fextiva_vote_receipt_en",
		languageCode: "en",
		components: [
			{
				type: "body",
				parameters: [
					{ type: "text", text: voterName || "Voter" },
					{ type: "text", text: nomineeName },
					{ type: "text", text: categoryName || "Official Selection" },
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

/**
 * Helper to send scheduled or on-demand nominee voting progress report
 */
export async function sendNomineeReportWhatsAppNotification({
	phone,
	nomineeName,
	eventTitle,
	categoryName,
	votesCount,
	rank,
	leaderboardUrl,
	categoryUrl,
	categoryPath,
	eventSlug,
	categoryId,
	orgSlug,
	bannerImageUrl,
	showRank = true,
}: {
	phone: string;
	nomineeName: string;
	eventTitle: string;
	categoryName?: string;
	votesCount: number | string;
	rank: number | string;
	showRank?: boolean;
	leaderboardUrl?: string;
	categoryUrl?: string;
	categoryPath?: string;
	eventSlug?: string;
	categoryId?: string;
	orgSlug?: string;
	bannerImageUrl?: string;
}): Promise<SendWhatsAppResponse> {
	const formattedVotes = typeof votesCount === "number" ? votesCount.toLocaleString() : String(votesCount);
	const formattedRank = showRank ? (String(rank).startsWith("#") ? String(rank) : `#${rank}`) : "Confidential";

	const baseUrl = getFrontendBaseUrl();
	const defaultLogoBanner =
		baseUrl.startsWith("http") && !baseUrl.includes("localhost")
			? `${baseUrl}/android-chrome-512x512.png`
			: "https://fextiva.com/android-chrome-512x512.png";

	// Rewrite R2/CDN URLs through our proxy so Meta can fetch them
	const safeHeaderImage = toProxiedImageUrl(bannerImageUrl) ?? toProxiedImageUrl(defaultLogoBanner);

	// The public portal path for this nominee's category
	// e.g. "afrofest/event/awards-2026/category/cm123..." or shortlink "c/cm123..."
	const publicCategoryPath =
		categoryPath ||
		(orgSlug && eventSlug && categoryId
			? `${orgSlug}/event/${eventSlug}/category/${categoryId}`
			: categoryId
				? `c/${categoryId}`
				: orgSlug && eventSlug
					? `${orgSlug}/event/${eventSlug}`
					: categoryUrl
						? categoryUrl.replace(/^https?:\/\/[^\/]+\//, "")
						: eventSlug || "");

	// Dynamic parameter for the "View Progress" button (replaces {{1}} in https://fextiva.com/{{1}})
	const buttonParam = publicCategoryPath;

	// When organizer hides standings/positions, first attempt the 4-variable utility template (fextiva_nominee_summary_en)
	if (!showRank) {
		const noRankComponents: WhatsAppTemplateComponent[] = [
			{
				type: "header",
				parameters: [
					{
						type: "image",
						image: { link: safeHeaderImage || "https://fextiva.com/android-chrome-512x512.png" },
					},
				],
			},
			{
				type: "body",
				parameters: [
					{ type: "text", text: nomineeName },
					{ type: "text", text: eventTitle },
					{ type: "text", text: categoryName || "Official Selection" },
					{ type: "text", text: formattedVotes },
				],
			},
		];

		if (buttonParam) {
			noRankComponents.push({
				type: "button",
				sub_type: "url",
				index: "0",
				parameters: [{ type: "text", text: buttonParam }],
			});
		}

		let noRankRes = await sendWhatsAppTemplateMessage({
			to: phone,
			templateName: "fextiva_nominee_summary_en",
			languageCode: "en",
			components: noRankComponents,
		});

		if (!noRankRes.success) {
			const noHeader = noRankComponents.filter((c) => c.type !== "header");
			const retryNoHeader = await sendWhatsAppTemplateMessage({
				to: phone,
				templateName: "fextiva_nominee_summary_en",
				languageCode: "en",
				components: noHeader,
			});
			if (retryNoHeader.success) {
				noRankRes = retryNoHeader;
			}
		}

		if (noRankRes.success) {
			return noRankRes;
		}
	}

	// Primary template components (structured with Header image, Body variables, and URL button)
	const componentsWithHeader: WhatsAppTemplateComponent[] = [
		{
			type: "header",
			parameters: [
				{
					type: "image",
					image: { link: safeHeaderImage || "https://fextiva.com/android-chrome-512x512.png" },
				},
			],
		},
		{
			type: "body",
			parameters: [
				{ type: "text", text: nomineeName },
				{ type: "text", text: eventTitle },
				{ type: "text", text: categoryName || "Official Selection" },
				{ type: "text", text: formattedVotes },
				{ type: "text", text: formattedRank },
			],
		},
	];

	if (buttonParam) {
		componentsWithHeader.push({
			type: "button",
			sub_type: "url",
			index: "0",
			parameters: [{ type: "text", text: buttonParam }],
		});
	}

	// Candidate template names to try in order (fextiva_nominee_progress_en is new primary)
	const candidateTemplates = [
		"fextiva_nominee_progress_en",
		"fextiva_nominee_activity_en",
		"fextiva_nominee_status_en",
		"fextiva_nominee_update_en",
		"fextiva_nominee_report_en",
	];

	let templateRes: SendWhatsAppResponse = { success: false, error: "Not initiated" };

	for (const tName of candidateTemplates) {
		// 1. Try with Header + Body + Button
		templateRes = await sendWhatsAppTemplateMessage({
			to: phone,
			templateName: tName,
			languageCode: "en",
			components: componentsWithHeader,
		});
		if (templateRes.success) break;

		// 2. Try without Media Header (in case template was registered as text-only)
		const componentsWithoutHeader = componentsWithHeader.filter((c) => c.type !== "header");
		templateRes = await sendWhatsAppTemplateMessage({
			to: phone,
			templateName: tName,
			languageCode: "en",
			components: componentsWithoutHeader,
		});
		if (templateRes.success) break;
	}

	// 5. If all templates fail or pending approval, fallback to clean, nicely formatted direct text message
	if (!templateRes.success) {
		const progressUrl =
			categoryUrl ||
			(publicCategoryPath ? `https://fextiva.com/${publicCategoryPath}` : leaderboardUrl) ||
			"https://fextiva.com";
		const rankLine = showRank
			? `\n• *Account Placement Index:* ${formattedRank}`
			: `\n• *Account Placement Index:* Confidential (Gala Reveal)`;
		const fallbackText = `📋 *Account Confirmation Update*\n\nHello ${nomineeName},\n\nHere is your account confirmation update for *${eventTitle}* (Category: *${categoryName || "Official Selection"}*):\n\n• *Recorded Vote Transactions:* ${formattedVotes}${rankLine}\n\nYou can verify your activity on the Fextiva portal.\n\n🔗 *View Category & Standings:* ${progressUrl}`;
		return sendWhatsAppTextMessage({ to: phone, text: fallbackText });
	}

	return templateRes;
}

/**
 * Process inbound Meta WhatsApp Cloud API status webhook callback.
 * Updates message delivery/read status, captures billable conversation metrics,
 * and maintains aggregate platform usage numbers.
 */
export async function processWhatsAppWebhook(body: any): Promise<{
	processedCount: number;
	statusesUpdated: number;
}> {
	if (!body || body.object !== "whatsapp_business_account") {
		return { processedCount: 0, statusesUpdated: 0 };
	}

	let processedCount = 0;
	let statusesUpdated = 0;

	for (const entry of body.entry || []) {
		for (const change of entry.changes || []) {
			const value = change.value;
			if (!value) continue;

			// Handle message statuses (sent, delivered, read, failed)
			const statuses = value.statuses || [];
			for (const item of statuses) {
				processedCount++;
				const messageId = item.id;
				const statusStr = item.status; // "sent" | "delivered" | "read" | "failed"
				const recipientPhone = item.recipient_id;
				const pricingCategory =
					item.pricing?.category || item.conversation?.origin?.type || "utility";
				const isBillable = item.pricing?.billable ?? true;
				const errorMsg =
					item.errors?.[0]?.message || item.errors?.[0]?.title || null;

				try {
					await prisma.whatsAppMessageLog.upsert({
						where: { messageId },
						create: {
							messageId,
							recipientPhone: recipientPhone || "unknown",
							status: statusStr,
							pricingCategory,
							isBillable,
							estimatedCost: pricingCategory === "marketing" ? 0.025 : 0.007,
							errorMessage: errorMsg,
							rawPayload: item,
						},
						update: {
							status: statusStr,
							pricingCategory,
							isBillable,
							errorMessage: errorMsg,
							rawPayload: item,
						},
					});
					statusesUpdated++;
				} catch (err) {
					console.error("[WhatsApp Webhook] Failed to upsert log for:", messageId, err);
				}
			}
		}
	}

	return { processedCount, statusesUpdated };
}
