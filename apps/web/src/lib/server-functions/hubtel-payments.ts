/**
 * Hubtel Receive Money API adapter (Ghana mobile money).
 *
 * Isolated payment path activated when an event's resolved gateway is Hubtel and
 * the required credentials are configured. It is DISABLED until credentials exist.
 *
 * Required environment variables:
 *   HUBTEL_CLIENT_ID     - Hubtel API Client ID
 *   HUBTEL_CLIENT_SECRET - Hubtel API Client Secret
 *   HUBTEL_POS_SALES_ID  - Hubtel "POS Sales ID" (merchant/collection account)
 *   HUBTEL_CALLBACK_URL  - https endpoint Hubtel POSTs the final status to
 *   HUBTEL_BASE_URL      - (optional) base URL override; default rmp.hubtel.com
 *
 * Reference:
 *   https://developers.hubtel.com/documentations/merchant-account-api/receive-mobile-money
 *   POST {base}/merchantaccount/merchants/{POS_Sales_ID}/receive/mobilemoney
 *
 * Auth: HTTP Basic base64(ClientId:ClientSecret).
 * ResponseCode "0001" = pending (async, await callback); "0000" = success.
 */

export const HUBTEL_BASE_URL = "https://rmp.hubtel.com";

export interface HubtelConfig {
	clientId: string;
	clientSecret: string;
	posSalesId: string;
	callbackUrl?: string;
	baseUrl: string;
}

export function getHubtelConfig(): HubtelConfig | null {
	const clientId = (process.env.HUBTEL_CLIENT_ID || "").trim();
	const clientSecret = (process.env.HUBTEL_CLIENT_SECRET || "").trim();
	const posSalesId = (process.env.HUBTEL_POS_SALES_ID || "").trim();
	if (!clientId || !clientSecret || !posSalesId) return null;
	const callbackUrl = (process.env.HUBTEL_CALLBACK_URL || "").trim();
	const baseUrl = (process.env.HUBTEL_BASE_URL || HUBTEL_BASE_URL)
		.trim()
		.replace(/\/+$/, "");
	return {
		clientId,
		clientSecret,
		posSalesId,
		callbackUrl: callbackUrl || undefined,
		baseUrl,
	};
}

export function isHubtelConfigured(): boolean {
	return getHubtelConfig() !== null;
}

/**
 * Map the internal provider token to Hubtel's Ghana mobile-money channel.
 */
export function mapHubtelChannel(provider: "mtn" | "vod" | "atl"): string {
	switch (provider) {
		case "mtn":
			return "mtn-gh";
		case "vod":
			return "vodafone-gh";
		case "atl":
			return "tigo-gh";
		default:
			return "mtn-gh";
	}
}

/** Convert a local "0..." phone number to international "233..." MSISDN. */
export function toInternationalMsisdn(phone: string): string {
	const digits = phone.replace(/\D/g, "");
	if (digits.startsWith("233")) return digits;
	if (digits.startsWith("0")) return `233${digits.slice(1)}`;
	return `233${digits}`;
}

/**
 * Hubtel ClientReference must be alphanumeric and at most 36 characters.
 * Generate a unique value that never contains separators like "_".
 */
export function generateHubtelReference(): string {
	const ts = Date.now().toString(36).toUpperCase();
	const rand = Array.from(
		{ length: 6 },
		() => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)],
	).join("");
	return `HT${ts}${rand}`.slice(0, 36);
}

export interface HubtelCollectionRequest {
	amount: number;
	phoneNumber: string;
	channel: string;
	email: string;
	description: string;
	clientReference: string;
	customerName?: string;
	callbackUrl?: string;
}

export interface HubtelCollectionResult {
	ok: boolean;
	statusCode: number;
	data: any;
	responseCode: string;
	transactionId: string;
	clientReference: string;
	success: boolean;
	pending: boolean;
	message: string;
}

export async function initiateHubtelCollection(
	config: HubtelConfig,
	request: HubtelCollectionRequest,
): Promise<HubtelCollectionResult> {
	const basic = Buffer.from(
		`${config.clientId}:${config.clientSecret}`,
		"utf-8",
	).toString("base64");

	const url = `${config.baseUrl}/merchantaccount/merchants/${encodeURIComponent(
		config.posSalesId,
	)}/receive/mobilemoney`;

	const response = await fetch(url, {
		method: "POST",
		headers: {
			Authorization: `Basic ${basic}`,
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		body: JSON.stringify({
			CustomerName: request.customerName,
			CustomerMsisdn: toInternationalMsisdn(request.phoneNumber),
			CustomerEmail: request.email,
			Channel: request.channel,
			Amount: Number(request.amount.toFixed(2)),
			PrimaryCallbackUrl: request.callbackUrl,
			Description: request.description,
			ClientReference: request.clientReference,
		}),
	});

	const data = (await response.json().catch(() => ({}))) as any;

	// Never log credentials; only transaction identifiers and the response body.
	console.info("[USSD-HUBTEL-CHARGE]", {
		clientReference: request.clientReference,
		channel: request.channel,
		statusCode: response.status,
		response: data,
	});

	const responseCode = String(
		data?.ResponseCode ?? data?.responseCode ?? data?.response_code ?? "",
	);
	const nested = data?.Data ?? {};
	const transactionId = String(
		nested?.TransactionId ?? nested?.TransactionID ?? data?.TransactionId ?? "",
	);
	const clientReference = String(
		nested?.ClientReference ?? data?.ClientReference ?? request.clientReference,
	);
	const message = String(data?.Message ?? data?.message ?? "");

	return {
		ok: response.ok,
		statusCode: response.status,
		data,
		responseCode,
		transactionId,
		clientReference,
		success: responseCode === "0000",
		pending: responseCode === "0001",
		message,
	};
}
