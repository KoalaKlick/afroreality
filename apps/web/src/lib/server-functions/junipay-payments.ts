/**
 * JuniPay Collections API adapter (Ghana mobile money).
 *
 * This is an isolated payment path that can be switched on per event code so it
 * can be tested without affecting the live Paystack flow. It is DISABLED until
 * the required credentials are configured.
 *
 * Required environment variables:
 *   JUNIPAY_CLIENT_ID      - your JuniPay dashboard Client ID
 *   JUNIPAY_SECRET         - dashboard Secret (reserved for the dashboard
 *                            authentication flow; not used by Direct Access)
 *   JUNIPAY_TOKEN_LINK     - dashboard Token Link (reserved for the dashboard
 *                            authentication flow; not used by Direct Access)
 *   JUNIPAY_PRIVATE_KEY    - the RSA private key (PKCS#1 "BEGIN RSA PRIVATE KEY"
 *                            or PKCS#8 "BEGIN PRIVATE KEY") used to sign tokens
 *   JUNIPAY_CALLBACK_URL   - (optional) https endpoint JuniPay POSTs results to
 *   JUNIPAY_WEBHOOK_SECRET - (optional) shared secret checked by the callback route
 *   JUNIPAY_BASE_URL       - (optional) base URL override; default is the live
 *                            endpoint. Point this at the JuniPay sandbox URL to
 *                            test without moving real money.
 *
 * Reference: https://www.junipayments.com/docs/api.html
 *   - POST {base}/payment           (collections)
 *   - POST {base}/checktranstatus   (status lookup)
 *
 * IMPORTANT: JuniPay uses "Direct Access APIs" which must be approved on your
 * account, and tokens are RS256 JWTs signed with your private key.
 */

import { importPKCS8, SignJWT } from "jose";

export const JUNIPAY_BASE_URL = "https://api.junipayments.com";
const JUNIPAY_EXPERIMENT_EVENT_CODES_DEFAULT: string[] = [];

/**
 * Comma-separated USSD event codes that may use JuniPay, e.g. "134,135".
 * Defaults to an empty list (no event uses JuniPay) unless JUNIPAY_EVENT_CODES
 * is explicitly set.
 */
export function getJunipayEventCodes(): string[] {
	const raw = (process.env.JUNIPAY_EVENT_CODES || "").trim();
	if (!raw) return [...JUNIPAY_EXPERIMENT_EVENT_CODES_DEFAULT];
	return raw
		.split(",")
		.map((c) => c.trim())
		.filter(Boolean);
}

export interface JunipayConfig {
	clientId: string;
	privateKey: string;
	callbackUrl?: string;
	baseUrl: string;
}

export function getJunipayConfig(): JunipayConfig | null {
	const clientId = (process.env.JUNIPAY_CLIENT_ID || "").trim();
	const privateKey = (process.env.JUNIPAY_PRIVATE_KEY || "").trim();
	if (!clientId || !privateKey) return null;
	const callbackUrl = (process.env.JUNIPAY_CALLBACK_URL || "").trim();
	const baseUrl = (process.env.JUNIPAY_BASE_URL || JUNIPAY_BASE_URL)
		.trim()
		.replace(/\/+$/, "");
	return {
		clientId,
		privateKey,
		callbackUrl: callbackUrl || undefined,
		baseUrl,
	};
}

export function isJunipayConfigured(): boolean {
	return getJunipayConfig() !== null;
}

export function isJunipayExperimentEvent(event: {
	ussdCode?: string | null;
}): boolean {
	const code = (event.ussdCode || "").trim();
	return getJunipayEventCodes().includes(code);
}

/**
 * Map the internal Paystack-style provider token to JuniPay's provider string.
 * Only "mtn" is confirmed in JuniPay's docs; confirm the exact values for
 * Vodafone/Telecel ("vodafone") and AirtelTigo ("airteltigo" vs "tigo") with
 * JuniPay before relying on them.
 */
export function mapJunipayProvider(provider: "mtn" | "vod" | "atl"): string {
	switch (provider) {
		case "mtn":
			return "mtn";
		case "vod":
			return "vodafone";
		case "atl":
			return "airteltigo";
		default:
			return "mtn";
	}
}

// ─── Token signing (RS256 JWT) ──────────────────────────────────────────────

function pemToDer(pem: string): Uint8Array {
	const b64 = pem
		.replace(/-----(BEGIN|END)[^-]+-----/g, "")
		.replace(/[^A-Za-z0-9+/=]/g, "");
	return new Uint8Array(Buffer.from(b64, "base64"));
}

function derToPem(der: Uint8Array): string {
	const b64 = Buffer.from(der).toString("base64");
	const lines = b64.match(/.{1,64}/g)?.join("\n") ?? b64;
	return `-----BEGIN PRIVATE KEY-----\n${lines}\n-----END PRIVATE KEY-----`;
}

function derEncodeLength(len: number): number[] {
	if (len < 0x80) return [len];
	const bytes: number[] = [];
	let remaining = len;
	while (remaining > 0) {
		bytes.unshift(remaining & 0xff);
		remaining >>>= 8;
	}
	return [0x80 | bytes.length, ...bytes];
}

function derEncode(tag: number, content: number[]): number[] {
	return [tag, ...derEncodeLength(content.length), ...content];
}

function derSequence(children: number[][]): number[] {
	return derEncode(0x30, children.flat());
}

function derInteger(value: number): number[] {
	const bytes: number[] = [];
	if (value === 0) {
		bytes.push(0);
	} else {
		let remaining = value;
		while (remaining > 0) {
			bytes.unshift(remaining & 0xff);
			remaining >>>= 8;
		}
	}
	if ((bytes[0] ?? 0) & 0x80) bytes.unshift(0);
	return derEncode(0x02, bytes);
}

const RSA_ENCRYPTION_OID = [0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01];

function derOid(oid: number[]): number[] {
	return derEncode(0x06, oid);
}

/**
 * Wrap a PKCS#1 RSAPrivateKey into a PKCS#8 PrivateKeyInfo so it can be imported
 * by jose's importPKCS8.
 */
function pkcs1ToPkcs8(pkcs1Der: Uint8Array): Uint8Array {
	const algorithmIdentifier = derSequence([derOid(RSA_ENCRYPTION_OID), [0x05, 0x00]]);
	const privateKeyOctets = derEncode(0x04, Array.from(pkcs1Der));
	const privateKeyInfo = derSequence([
		derInteger(0),
		algorithmIdentifier,
		privateKeyOctets,
	]);
	return new Uint8Array(privateKeyInfo);
}

function normalizePrivateKey(pem: string): string {
	const trimmed = pem.trim();
	if (!trimmed.includes("BEGIN RSA PRIVATE KEY")) {
		return trimmed;
	}
	return derToPem(pkcs1ToPkcs8(pemToDer(trimmed)));
}

/**
 * Sign a JuniPay token. The payload mirrors JuniPay's documented
 * `jwt.sign({ payload: '...' }, privateKey, { algorithm: 'RS256' })` shape; the
 * placeholder value is replaced with the client ID. Adjust if JuniPay requires
 * additional claims.
 */
export async function signJunipayToken(config: JunipayConfig): Promise<string> {
	const privateKey = await importPKCS8(normalizePrivateKey(config.privateKey), "RS256");
	return await new SignJWT({ payload: config.clientId })
		.setProtectedHeader({ alg: "RS256" })
		.setIssuedAt()
		.sign(privateKey);
}

// ─── Collections initiation ─────────────────────────────────────────────────

export interface JunipayCollectionRequest {
	/** Total amount in Ghana Cedis (e.g. 0.5). */
	amount: number;
	phoneNumber: string;
	provider: string;
	email: string;
	description: string;
	foreignId: string;
	callbackUrl?: string;
}

export interface JunipayCollectionResult {
	ok: boolean;
	statusCode: number;
	data: any;
	transId: string;
	transId2: string;
	reqToken: string;
	success: boolean;
	message: string;
}

export async function initiateJunipayCollection(
	config: JunipayConfig,
	request: JunipayCollectionRequest,
): Promise<JunipayCollectionResult> {
	const token = await signJunipayToken(config);

	const response = await fetch(`${config.baseUrl}/payment`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			clientid: config.clientId,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			channel: "mobile_money",
			phoneNumber: request.phoneNumber,
			provider: request.provider,
			amount: request.amount,
			tot_amnt: request.amount,
			senderEmail: request.email,
			description: request.description,
			foreignID: request.foreignId,
			callbackUrl: request.callbackUrl,
		}),
	});

	const data = (await response.json().catch(() => ({}))) as any;

	// Do not log credentials; log only the transaction identifiers and response.
	console.info("[USSD-JUNIPAY-CHARGE]", {
		foreignId: request.foreignId,
		provider: request.provider,
		statusCode: response.status,
		response: data,
	});

	// JuniPay returns a flat response body, e.g.
	// { status: "pending", message: "TRANSACTION PENDING", transID: "COL...",
	//   transID2: "1762...", foreignID: "...", reqToken: "COL..." }
	const nested = data?.data ?? {};
	const transId = String(
		nested?.transID ?? nested?.trans_id ?? data?.transID ?? data?.trans_id ?? "",
	);
	const transId2 = String(
		nested?.transID2 ?? nested?.trans_id2 ?? data?.transID2 ?? data?.trans_id2 ?? "",
	);
	const reqToken = String(
		nested?.reqToken ?? nested?.req_token ?? data?.reqToken ?? data?.req_token ?? "",
	);
	const rawStatus = String(
		nested?.status ?? nested?.state ?? data?.status ?? data?.state ?? "",
	).toLowerCase();
	const success =
		data?.success === true ||
		nested?.success === true ||
		["success", "completed", "paid", "approved", "successful"].includes(rawStatus);
	const message = String(
		nested?.message ?? nested?.description ?? data?.message ?? data?.description ?? "",
	);

	return {
		ok: response.ok,
		statusCode: response.status,
		data,
		transId,
		transId2,
		reqToken,
		success,
		message,
	};
}
