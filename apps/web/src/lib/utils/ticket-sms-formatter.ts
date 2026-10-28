// apps/web/src/lib/utils/ticket-sms-formatter.ts
// Reusable, pure utility for building GSM-7 single-segment ticket SMS messages.
// Enforces a strict target of <= 155 characters (leaving 5 chars buffer under 160).

import { parseTicketCode } from "./ticket-code";

export interface BuildTicketSmsOptions {
	attendeeName: string;
	eventTitle: string;
	ticketCode: string;
	eventStartDate?: Date | string | null;
	ticketCount?: number;
	maxTargetChars?: number; // Defaults to 155
	subdomain?: string; // Defaults to "t.fextiva.com"
}

export interface TicketSmsResult {
	message: string;
	length: number;
	isSingleSegment: boolean;
	passCode: string;
	viewUrl: string;
}

/**
 * Replaces non-GSM-7 characters (smart quotes, em-dashes, accented characters)
 * with safe standard ASCII equivalents to prevent SMS gateways from downgrading
 * the message to UCS-2 (70-char limit).
 */
export function sanitizeGsm7Text(input: string): string {
	if (!input) return "";
	return input
		.replace(/[\u2018\u2019]/g, "'") // Smart single quotes
		.replace(/[\u201C\u201D]/g, '"') // Smart double quotes
		.replace(/[\u2013\u2014]/g, "-") // En/Em dashes
		.replace(/\u2026/g, "...") // Ellipsis character to 3 ASCII periods
		.replace(/[^\x20-\x7E\n]/g, "") // Strip any other non-ASCII chars
		.trim();
}

/**
 * Formats an event date compactly into GSM-7 safe text (e.g. "Sat, Dec 28, 6:00 PM").
 */
export function formatSmsEventDate(dateInput?: Date | string | null): string | null {
	if (!dateInput) return null;
	const d = new Date(dateInput);
	if (isNaN(d.getTime())) return null;

	const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

	const dayName = days[d.getUTCDay()] || "";
	const monthName = months[d.getUTCMonth()] || "";
	const dayNum = d.getUTCDate();

	let hours = d.getUTCHours();
	const minutes = d.getUTCMinutes();
	const ampm = hours >= 12 ? "PM" : "AM";
	hours = hours % 12;
	hours = hours ? hours : 12;
	const minStr = minutes === 0 ? "" : `:${minutes < 10 ? "0" + minutes : minutes}`;

	return `${dayName}, ${monthName} ${dayNum}, ${hours}${minStr} ${ampm}`;
}

/**
 * Builds the optimized ticket confirmation SMS content.
 * Dynamically maximizes the event title up to the available budget (target: 155 chars).
 */
export function buildTicketSmsContent(options: BuildTicketSmsOptions): TicketSmsResult {
	const {
		attendeeName,
		eventTitle,
		ticketCode,
		eventStartDate,
		ticketCount = 1,
		maxTargetChars = 155,
		subdomain = "t.fextiva.com",
	} = options;

	// 1. Sanitize & clamp attendee first name (max 12 chars)
	const rawName = sanitizeGsm7Text(attendeeName.split(" ")[0] || "there");
	const firstName = rawName.slice(0, 12) || "there";

	// 2. Extract pass code (prefer 6-char pass part for gate entry)
	const parsed = parseTicketCode(ticketCode);
	const passCode = parsed.passCode || ticketCode;
	const primaryCode = parsed.normalizedCode || ticketCode;

	// 3. Header line
	const header = ticketCount > 1
		? `Hi ${firstName}, ${ticketCount} passes confirmed!\n`
		: `Hi ${firstName}, ticket confirmed!\n`;

	// 4. Date & time line (if available)
	const dateStr = formatSmsEventDate(eventStartDate);
	const whenLine = dateStr ? `When: ${dateStr}\n` : "";

	// 5. Pass and Link lines (omits 'https://' to save 8 chars)
	const passLine = `Pass: ${passCode}\n`;
	const viewUrl = `${subdomain}/${primaryCode}`;
	const linkLine = `View: ${viewUrl}`;

	// 6. Dynamic Event Title calculation
	// Calculate exact remaining characters available for "Event: <title>\n"
	const fixedLength = header.length + whenLine.length + passLine.length + linkLine.length;
	const prefixEvent = "Event: ";
	const availableForTitle = Math.max(maxTargetChars - fixedLength - prefixEvent.length - 1, 15);

	const cleanTitle = sanitizeGsm7Text(eventTitle);
	let eventLine = "";

	if (cleanTitle.length <= availableForTitle) {
		eventLine = `${prefixEvent}${cleanTitle}\n`;
	} else {
		// Truncate cleanly using 3 standard ASCII dots '...'
		const sliceLen = Math.max(availableForTitle - 3, 5);
		eventLine = `${prefixEvent}${cleanTitle.slice(0, sliceLen).trimEnd()}...\n`;
	}

	let message = `${header}${eventLine}${whenLine}${passLine}${linkLine}`;

	// Edge-case emergency safety clamp: ensure never exceeds 155 characters
	if (message.length > maxTargetChars) {
		message = `${header}${passLine}${linkLine}`;
	}

	return {
		message,
		length: message.length,
		isSingleSegment: message.length <= 160,
		passCode,
		viewUrl,
	};
}

