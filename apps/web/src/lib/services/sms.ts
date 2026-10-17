// src/lib/services/sms.ts
// Arkesel SMS Integration for Fextiva
// API docs: https://sms.arkesel.com/api/v2/sms/send

import { prisma } from "@repo/db";
import { normalizePhoneNumber } from "@/lib/services/whatsapp";

const ARKESEL_API_KEY = process.env.ARKESEL_API_KEY || "";
const ARKESEL_API_URL = "https://sms.arkesel.com/api/v2/sms/send";
const SMS_SENDER_ID = process.env.ARKESEL_SENDER_ID || "Fextiva";

// SMS is capped at 160 chars per segment. We target single-segment messages.
const SMS_CHAR_LIMIT = 155; // ~5 chars reserved for safety

export interface SmsResponse {
	success: boolean;
	messageId?: string;
	error?: string;
	raw?: any;
}

/**
 * Truncates a string to maxLen, appending "…" if cut.
 */
function truncate(str: string, maxLen: number): string {
	if (str.length <= maxLen) return str;
	return str.slice(0, maxLen - 1) + "…";
}

/**
 * Normalizes a phone for Arkesel: must be in international format without '+'.
 * Arkesel accepts both "233XXXXXXXXX" and "+233XXXXXXXXX".
 * We strip the '+' sign.
 */
function toArkeselPhone(phone: string): string {
	const normalized = normalizePhoneNumber(phone);
	return normalized.startsWith("+") ? normalized.slice(1) : normalized;
}

/**
 * Logs the SMS send attempt to SmsMessageLog.
 */
async function logSms({
	recipientPhone,
	message,
	status,
	purpose,
	eventId,
	isBillable,
	errorMessage,
	rawPayload,
}: {
	recipientPhone: string;
	message: string;
	status: "sent" | "failed";
	purpose?: string;
	eventId?: string | null;
	isBillable: boolean;
	errorMessage?: string | null;
	rawPayload?: any;
}) {
	try {
		await prisma.smsMessageLog.create({
			data: {
				recipientPhone,
				message: message.slice(0, 500), // cap stored message length
				sender: SMS_SENDER_ID,
				provider: "arkesel",
				purpose: purpose || null,
				eventId: eventId || null,
				status,
				isBillable,
				estimatedCost: isBillable ? 0.005 : 0, // ~$0.005 USD per SMS (≈GH₵0.08)
				errorMessage: errorMessage || null,
				rawPayload: rawPayload || null,
			},
		});
	} catch (_) {
		// Non-fatal: logging failure must never break the flow
	}
}

/**
 * Low-level: send a raw SMS via Arkesel API.
 */
export async function sendSmsMessage({
	to,
	message,
	purpose,
	eventId,
}: {
	to: string;
	message: string;
	purpose?: string;
	eventId?: string | null;
}): Promise<SmsResponse> {
	if (!ARKESEL_API_KEY) {
		console.warn("[SMS] ARKESEL_API_KEY not configured — skipping SMS send.");
		await logSms({
			recipientPhone: to,
			message,
			status: "failed",
			purpose,
			eventId,
			isBillable: false,
			errorMessage: "ARKESEL_API_KEY not configured",
		});
		return { success: false, error: "SMS provider not configured" };
	}

	const phone = toArkeselPhone(to);

	try {
		const res = await fetch(ARKESEL_API_URL, {
			method: "POST",
			headers: {
				"api-key": ARKESEL_API_KEY,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				sender: SMS_SENDER_ID,
				message,
				recipients: [phone],
			}),
		});

		const data = await res.json();

		// Arkesel returns { status: "success", data: [...] } on success
		if (!res.ok || data?.status !== "success") {
			const errMsg = data?.message || data?.error || "Failed to send SMS";
			console.error("[SMS] Arkesel send failed:", data);
			await logSms({
				recipientPhone: phone,
				message,
				status: "failed",
				purpose,
				eventId,
				isBillable: false,
				errorMessage: errMsg,
				rawPayload: data,
			});
			return { success: false, error: errMsg, raw: data };
		}

		const messageId = data?.data?.[0]?.id || undefined;
		await logSms({
			recipientPhone: phone,
			message,
			status: "sent",
			purpose,
			eventId,
			isBillable: true,
			rawPayload: data,
		});

		return { success: true, messageId, raw: data };
	} catch (error: any) {
		console.error("[SMS] Exception while sending:", error);
		await logSms({
			recipientPhone: phone,
			message,
			status: "failed",
			purpose,
			eventId,
			isBillable: false,
			errorMessage: error?.message || "Network error",
		});
		return { success: false, error: error?.message || "Network error" };
	}
}

/**
 * Sends a ticket purchase confirmation SMS.
 * Designed to fit within a single 160-char SMS segment.
 *
 * Template (≤155 chars):
 * "Hi [name], ur ticket for [event] is confirmed!
 *  Code: [code]
 *  View: fextiva.com/t/[token]
 *  -Fextiva"
 */
export async function sendTicketSmsConfirmation({
	phone,
	attendeeName,
	eventTitle,
	ticketCode,
	ticketToken,
	eventId,
}: {
	phone: string;
	attendeeName: string;
	eventTitle: string;
	ticketCode: string;
	ticketToken?: string;
	eventId?: string | null;
}): Promise<SmsResponse> {
	const name = truncate(attendeeName.split(" ")[0] || attendeeName, 12);
	const event = truncate(eventTitle, 30);
	const code = ticketCode;

	let message: string;
	if (ticketToken) {
		// Short token URL — assume /t/TOKEN short-link exists or use full path
		const shortUrl = `fextiva.com/ticket/view?token=${ticketToken.slice(0, 20)}`;
		message = `Hi ${name}, ticket for ${event} confirmed!\nCode: ${code}\nView: ${shortUrl}\n-Fextiva`;
	} else {
		message = `Hi ${name}, ur ticket for ${event} is confirmed!\nTicket Code: ${code}\nThank you! -Fextiva`;
	}

	// Ensure under limit
	if (message.length > SMS_CHAR_LIMIT) {
		message = `Ticket confirmed for ${event}!\nCode: ${code}\n-Fextiva`;
	}

	return sendSmsMessage({ to: phone, message, purpose: "ticket_confirmation", eventId });
}

/**
 * Sends a vote receipt SMS after successful vote purchase.
 */
export async function sendVoteReceiptSms({
	phone,
	voterName,
	nomineeName,
	votesCount,
	reference,
	eventId,
}: {
	phone: string;
	voterName?: string;
	nomineeName: string;
	votesCount: number | string;
	reference: string;
	eventId?: string | null;
}): Promise<SmsResponse> {
	const name = voterName ? truncate(voterName.split(" ")[0] || voterName, 10) : null;
	const nominee = truncate(nomineeName, 25);
	const votes = String(votesCount);
	const ref = reference.slice(-10); // last 10 chars of ref is enough

	const greeting = name ? `Hi ${name}, ` : "";
	const message = truncate(
		`${greeting}${votes} vote(s) cast for ${nominee}!\nRef: ${ref}\nThank you! -Fextiva`,
		SMS_CHAR_LIMIT,
	);

	return sendSmsMessage({ to: phone, message, purpose: "vote_receipt", eventId });
}

/**
 * Sends a nominee progress report SMS.
 */
export async function sendNomineeReportSms({
	phone,
	nomineeName,
	eventTitle,
	categoryName,
	votesCount,
	rank,
	showRank,
	categoryUrl,
	singleCategoryEvent,
	voteDisplayType,
	votePercentage,
	eventId,
}: {
	phone: string;
	nomineeName: string;
	eventTitle: string;
	categoryName?: string;
	votesCount: number | string;
	rank: number | string;
	showRank?: boolean;
	categoryUrl?: string;
	singleCategoryEvent?: boolean;
	voteDisplayType?: "count" | "percentage";
	votePercentage?: number;
	eventId?: string | null;
}): Promise<SmsResponse> {
	const nominee = truncate(nomineeName, 20);
	const event = truncate(eventTitle, 25);
	const category = categoryName ? truncate(categoryName, 20) : null;
	const votes = typeof votesCount === "number" ? votesCount.toLocaleString() : String(votesCount);
	const progress = voteDisplayType === "percentage" && votePercentage !== undefined
		? `${votePercentage}%`
		: `${votes} vote${votes === "1" ? "" : "s"}`;
	const progressLink = categoryUrl || "https://fextiva.com";

	const rankLine = showRank !== false ? ` Rank #${rank}.` : "";
	const eventLabel = singleCategoryEvent && category
		? category
		: category
			? `${event} (${category})`
			: event;
	const messageWithEventLink =
		`\nHi ${nominee}, you have ${progress} in ${eventLabel}.${rankLine}\n` +
		`Share for more votes: ${progressLink}`;
	const messageWithHomepageLink =
		`\nHi ${nominee}, you have ${progress} in ${eventLabel}.${rankLine}\n` +
		"Share for more votes: https://fextiva.com";
	const messageWithoutLink =
		`FEXTIVA\nHi ${nominee}, you have ${progress} in ${eventLabel}.${rankLine}`;
	const message = [messageWithEventLink, messageWithHomepageLink, messageWithoutLink].find(
		(candidate) => candidate.length <= SMS_CHAR_LIMIT,
	) ?? messageWithoutLink;

	return sendSmsMessage({ to: phone, message, purpose: "nominee_report", eventId });
}

/**
 * Sends a nomination confirmation SMS.
 */
export async function sendNominationSms({
	phone,
	nomineeName,
	eventTitle,
	categoryName,
	status,
	nomineeCode,
	eventId,
}: {
	phone: string;
	nomineeName: string;
	eventTitle: string;
	categoryName?: string;
	status: string;
	nomineeCode?: string | null;
	eventId?: string | null;
}): Promise<SmsResponse> {
	const nominee = truncate(nomineeName, 22);
	const event = truncate(eventTitle, 22);
	const statusLabel = status === "approved" ? "approved" : "received";
	const catLine = categoryName ? ` (${truncate(categoryName, 16)})` : "";
	const codePart = nomineeCode ? ` Code: #${nomineeCode}.` : "";

	const message = truncate(
		`Nomination for ${nominee}${catLine} in ${event} has been ${statusLabel}.${codePart} -Fextiva`,
		SMS_CHAR_LIMIT,
	);

	return sendSmsMessage({ to: phone, message, purpose: "nomination", eventId });
}

/**
 * Aggregates SMS usage stats for the super admin dashboard.
 */
export interface SmsUsageSummary {
	totalSent: number;
	totalFailed: number;
	billableCount: number;
	estimatedSpendUsd: number;
	purposeBreakdown: Record<string, number>;
	recentLogs: Array<{
		id: string;
		recipientPhone: string;
		message: string | null;
		purpose: string | null;
		eventId: string | null;
		status: string;
		isBillable: boolean;
		estimatedCost: number;
		errorMessage: string | null;
		createdAt: string;
	}>;
}

export async function getSmsUsageOverview(): Promise<SmsUsageSummary> {
	try {
		const [totalCount, failedCount, billableCount, recentLogsRaw] = await Promise.all([
			prisma.smsMessageLog.count(),
			prisma.smsMessageLog.count({ where: { status: "failed" } }),
			prisma.smsMessageLog.count({ where: { isBillable: true } }),
			prisma.smsMessageLog.findMany({
				take: 2000,
				orderBy: { createdAt: "desc" },
				select: {
					id: true,
					recipientPhone: true,
					message: true,
					purpose: true,
					eventId: true,
					status: true,
					isBillable: true,
					estimatedCost: true,
					errorMessage: true,
					createdAt: true,
				},
			}),
		]);

		let estimatedSpendUsd = 0;
		const purposeBreakdown: Record<string, number> = {};

		recentLogsRaw.forEach((log) => {
			estimatedSpendUsd += Number(log.estimatedCost || 0.005);
			const p = log.purpose || "unknown";
			purposeBreakdown[p] = (purposeBreakdown[p] || 0) + 1;
		});

		return {
			totalSent: totalCount,
			totalFailed: failedCount,
			billableCount,
			estimatedSpendUsd: Number(estimatedSpendUsd.toFixed(4)),
			purposeBreakdown,
			recentLogs: recentLogsRaw.map((log) => ({
				id: log.id,
				recipientPhone: log.recipientPhone,
				message: log.message,
				purpose: log.purpose,
				eventId: log.eventId,
				status: log.status,
				isBillable: log.isBillable,
				estimatedCost: Number(log.estimatedCost || 0.005),
				errorMessage: log.errorMessage,
				createdAt: log.createdAt.toISOString(),
			})),
		};
	} catch (error) {
		console.error("[SMS Usage] Error:", error);
		return {
			totalSent: 0,
			totalFailed: 0,
			billableCount: 0,
			estimatedSpendUsd: 0,
			purposeBreakdown: {},
			recentLogs: [],
		};
	}
}
