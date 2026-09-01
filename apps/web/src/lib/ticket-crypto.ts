import * as crypto from "crypto";

const TICKET_SECRET =
	process.env.TICKET_SIGNING_SECRET ||
	process.env.NEXTAUTH_SECRET ||
	"fextiva_ticket_secret_key_default_2026";

/**
 * Generates an HMAC-SHA256 signature for the given payload.
 */
export function generateTicketSignature(payload: string): string {
	return crypto.createHmac("sha256", TICKET_SECRET).update(payload).digest("hex");
}

/**
 * Verifies if the provided signature matches the payload.
 */
export function verifyTicketSignature(payload: string, signature: string): boolean {
	const expected = generateTicketSignature(payload);
	return expected === signature;
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
