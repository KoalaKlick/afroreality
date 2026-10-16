// src/lib/utils/phone.ts
// Phone normalization, comparison, and Ghanaian MoMo network detection utilities.

/**
 * Normalizes a phone number to standard international format without '+' or leading zeros.
 * E.g. "050 989 7757" -> "233509897757", "+233 50 989 7757" -> "233509897757"
 */
export function normalizePhoneNumber(phone: string, defaultCountryCode = "233"): string {
	const cleaned = phone.replace(/[^0-9]/g, "");
	if (cleaned.startsWith("0") && cleaned.length === 10) {
		return `${defaultCountryCode}${cleaned.slice(1)}`;
	}
	return cleaned;
}

/**
 * Formats a phone number into the standard local format for Mobile Money account inputs (e.g., "0501234567").
 */
export function formatToLocalMomoNumber(phone: string, defaultCountryCode = "233"): string {
	const cleaned = phone.replace(/[^0-9]/g, "");
	if (cleaned.startsWith(defaultCountryCode) && cleaned.length === defaultCountryCode.length + 9) {
		return `0${cleaned.slice(defaultCountryCode.length)}`;
	}
	if (cleaned.startsWith("0") && cleaned.length === 10) {
		return cleaned;
	}
	if (cleaned.length === 9) {
		return `0${cleaned}`;
	}
	return cleaned;
}

/**
 * Robustly checks if two phone numbers refer to the same phone.
 * Handles local vs international formats, whitespace, dashes, and country prefixes.
 */
export function isSamePhoneNumber(phoneA?: string | null, phoneB?: string | null): boolean {
	if (!phoneA || !phoneB) return false;

	const cleanA = phoneA.replace(/[^0-9]/g, "");
	const cleanB = phoneB.replace(/[^0-9]/g, "");

	if (!cleanA || !cleanB) return false;
	if (cleanA === cleanB) return true;

	// Normalize with default country code 233
	const normA = cleanA.startsWith("0") && cleanA.length === 10 ? `233${cleanA.slice(1)}` : cleanA;
	const normB = cleanB.startsWith("0") && cleanB.length === 10 ? `233${cleanB.slice(1)}` : cleanB;

	if (normA === normB) return true;

	// Compare last 9 significant digits if both numbers are at least 9 digits long
	if (cleanA.length >= 9 && cleanB.length >= 9) {
		return cleanA.slice(-9) === cleanB.slice(-9);
	}

	return false;
}

/**
 * Detects the Ghanaian Mobile Money network code from a local or international phone number.
 * MTN Ghana: 024, 054, 055, 059, 053, 025 (code: MTN)
 * Vodafone / Telecel Cash: 020, 050 (code: VOD)
 * AirtelTigo Money: 027, 057, 026, 056 (code: ATL)
 */
export function detectMomoNetworkFromPhone(
	phone: string,
): { code: "MTN" | "VOD" | "ATL"; name: string } | null {
	const localNumber = formatToLocalMomoNumber(phone);
	if (localNumber.length < 3) return null;

	const prefix3 = localNumber.slice(0, 3);

	const mtnPrefixes = ["024", "054", "055", "059", "053", "025"];
	if (mtnPrefixes.includes(prefix3)) {
		return { code: "MTN", name: "MTN Mobile Money" };
	}

	const telecelPrefixes = ["020", "050"];
	if (telecelPrefixes.includes(prefix3)) {
		return { code: "VOD", name: "Vodafone / Telecel Cash" };
	}

	const airtelTigoPrefixes = ["027", "057", "026", "056"];
	if (airtelTigoPrefixes.includes(prefix3)) {
		return { code: "ATL", name: "AirtelTigo Money" };
	}

	return null;
}
