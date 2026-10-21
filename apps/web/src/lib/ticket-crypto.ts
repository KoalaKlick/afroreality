import * as crypto from "crypto";

const DEFAULT_FALLBACK_SECRET = "fextiva_ticket_secret_key_default_2026";

/**
 * Single canonical source of truth for ticket encryption & signing.
 * Configured via TICKET_SECRET_KEY in environment variables.
 */
export function getTicketSecret(): string {
	return process.env.TICKET_SECRET_KEY || DEFAULT_FALLBACK_SECRET;
}

/**
 * Generates an HMAC-SHA256 signature for the given payload.
 */
export function generateTicketSignature(payload: string, secretOverride?: string): string {
	const secret = secretOverride || getTicketSecret();
	return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Verifies if the provided signature matches the payload (constant-time).
 * Checks the configured TICKET_SECRET_KEY, with legacy fallback to preserve
 * verification of previously purchased tickets.
 */
export function verifyTicketSignature(payload: string, signature: string): boolean {
	if (!signature || typeof signature !== "string") return false;

	const primarySecret = getTicketSecret();
	const secretsToCheck =
		primarySecret === DEFAULT_FALLBACK_SECRET
			? [primarySecret]
			: [primarySecret, DEFAULT_FALLBACK_SECRET];

	for (const secret of secretsToCheck) {
		try {
			const expected = generateTicketSignature(payload, secret);
			const a = Buffer.from(expected, "utf8");
			const b = Buffer.from(signature, "utf8");
			if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
				return true;
			}
		} catch {
			// continue
		}
	}
	return false;
}

/**
 * Creates a base64 encoded token containing ticket info and its signature.
 * Token format: base64(JSON.stringify({ ticketId, ticketCode, sig }))
 */
export function createTicketToken(ticketId: string, ticketCode: string): string {
	const payload = `${ticketId}:${ticketCode}`;
	const sig = generateTicketSignature(payload);
	const data = { tId: ticketId, tCode: ticketCode, sig };
	return Buffer.from(JSON.stringify(data)).toString("base64url");
}

/**
 * Decodes and verifies a ticket token. Returns the ticket data if valid, null otherwise.
 */
export function verifyTicketToken(
	token: string,
): { ticketId: string; ticketCode: string } | null {
	try {
		if (!token || typeof token !== "string") return null;
		const cleanToken = token.trim();
		let decoded: string;
		try {
			decoded = Buffer.from(cleanToken, "base64url").toString("utf-8");
		} catch {
			decoded = Buffer.from(decodeURIComponent(cleanToken), "base64url").toString("utf-8");
		}

		const data = JSON.parse(decoded);

		if (!data.tId || !data.tCode || !data.sig) {
			return null;
		}

		const payload = `${data.tId}:${data.tCode}`;
		if (!verifyTicketSignature(payload, data.sig)) {
			return null;
		}

		return { ticketId: data.tId, ticketCode: data.tCode };
	} catch (error) {
		console.error("Failed to verify ticket token:", error);
		return null;
	}
}

/** Constant-time string equality for webhook secrets. */
export function safeEqualString(a: string, b: string): boolean {
	try {
		const bufA = Buffer.from(a);
		const bufB = Buffer.from(b);
		if (bufA.length !== bufB.length) return false;
		return crypto.timingSafeEqual(bufA, bufB);
	} catch {
		return false;
	}
}
