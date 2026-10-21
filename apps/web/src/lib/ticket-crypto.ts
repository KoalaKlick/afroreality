import * as crypto from "crypto";

function getTicketSecret(): string {
	const secret =
		process.env.TICKET_SIGNING_SECRET || process.env.NEXTAUTH_SECRET || "";
	if (!secret) {
		throw new Error(
			"TICKET_SIGNING_SECRET (or NEXTAUTH_SECRET) must be configured — refusing insecure ticket tokens.",
		);
	}
	return secret;
}

/**
 * Generates an HMAC-SHA256 signature for the given payload.
 */
export function generateTicketSignature(payload: string): string {
	return crypto.createHmac("sha256", getTicketSecret()).update(payload).digest("hex");
}

/**
 * Verifies if the provided signature matches the payload (constant-time).
 */
export function verifyTicketSignature(payload: string, signature: string): boolean {
	if (!signature || typeof signature !== "string") return false;
	const expected = generateTicketSignature(payload);
	try {
		const a = Buffer.from(expected, "utf8");
		const b = Buffer.from(signature, "utf8");
		if (a.length !== b.length) return false;
		return crypto.timingSafeEqual(a, b);
	} catch {
		return false;
	}
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
		const decoded = Buffer.from(token, "base64url").toString("utf-8");
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
