// apps/web/src/lib/utils/ticket-code.ts
// Standardized 5-1-6 (12 chars total) ticket code generator & parser for Fextiva.
// Format: XXXXX-YYYYYY (e.g. E7K2M-9M4P10)
// Alphabet: Crockford-style Base32 avoiding 0/O, 1/I, and L to prevent human confusion.

import * as crypto from "crypto";

export const TICKET_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const ALPHABET_LENGTH = TICKET_CODE_ALPHABET.length; // 32

/**
 * Generates a cryptographically random string using the friendly Base32 alphabet.
 */
function randomBase32(length: number): string {
	const bytes = crypto.randomBytes(length);
	let result = "";
	for (let i = 0; i < length; i++) {
		result += TICKET_CODE_ALPHABET[bytes[i]! % ALPHABET_LENGTH];
	}
	return result;
}

/**
 * Generates or deterministically derives a 5-character event code.
 * If eventId (UUID) is provided, it hashes the UUID so that all tickets
 * for the same event share the exact same 5-character prefix without requiring a DB migration.
 */
export function generateEventCode(eventId?: string | null): string {
	if (!eventId) {
		return randomBase32(5);
	}

	// Deterministic hash of the event UUID to 5 Base32 characters
	const hash = crypto.createHash("sha256").update(eventId.trim().toLowerCase()).digest();
	let result = "";
	for (let i = 0; i < 5; i++) {
		result += TICKET_CODE_ALPHABET[hash[i]! % ALPHABET_LENGTH];
	}
	return result;
}

/**
 * Generates a 6-character random pass code (e.g. 9M4P10).
 * Provides 32^6 = 1,073,741,824 unique combinations per event.
 */
export function generatePassCode(): string {
	return randomBase32(6);
}

/**
 * Generates a complete 12-character ticket code: XXXXX-YYYYYY (e.g. E7K2M-9M4P10).
 */
export function generateTicketCode(eventId?: string | null): {
	eventCode: string;
	passCode: string;
	ticketCode: string;
} {
	const eventCode = generateEventCode(eventId);
	const passCode = generatePassCode();
	const ticketCode = `${eventCode}-${passCode}`;
	return { eventCode, passCode, ticketCode };
}

/**
 * Parses and normalizes any ticket code input.
 * Handles:
 *  - Standard: "E7K2M-9M4P10"
 *  - Unhyphenated: "E7K2M9M4P10"
 *  - Gate entry pass only: "9M4P10"
 *  - Legacy codes: "TIX-123456-ABCDE-1"
 */
export function parseTicketCode(rawCode: string): {
	eventCode?: string;
	passCode: string;
	normalizedCode: string;
	isNewFormat: boolean;
} {
	const cleaned = (rawCode || "").trim().toUpperCase();

	// Case 1: Standard 5-6 format (E7K2M-9M4P10)
	const hyphenMatch = cleaned.match(/^([2-9A-Z]{5})-([2-9A-Z]{6})$/i);
	if (hyphenMatch) {
		return {
			eventCode: hyphenMatch[1],
			passCode: hyphenMatch[2]!,
			normalizedCode: `${hyphenMatch[1]}-${hyphenMatch[2]}`,
			isNewFormat: true,
		};
	}

	// Case 2: Unhyphenated 11 chars (E7K2M9M4P10)
	const plainMatch = cleaned.match(/^([2-9A-Z]{5})([2-9A-Z]{6})$/i);
	if (plainMatch) {
		return {
			eventCode: plainMatch[1],
			passCode: plainMatch[2]!,
			normalizedCode: `${plainMatch[1]}-${plainMatch[2]}`,
			isNewFormat: true,
		};
	}

	// Case 3: Pass-only 6 chars entered by gate attendant (e.g. 9M4P10)
	if (/^[2-9A-Z]{6}$/i.test(cleaned)) {
		return {
			passCode: cleaned,
			normalizedCode: cleaned,
			isNewFormat: true,
		};
	}

	// Case 4: Legacy / arbitrary code (TIX-...)
	return {
		passCode: cleaned,
		normalizedCode: cleaned,
		isNewFormat: false,
	};
}

