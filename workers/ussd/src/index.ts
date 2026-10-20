import { neon } from "@neondatabase/serverless";
import { importPKCS8, SignJWT } from "jose";

export interface Env {
	DATABASE_URL: string;
	PAYSTACK_SECRET_KEY?: string;
	ARKESEL_API_KEY?: string;
	ARKESEL_SENDER_ID?: string;
	JUNIPAY_CLIENT_ID?: string;
	JUNIPAY_SECRET?: string;
	JUNIPAY_TOKEN_LINK?: string;
	JUNIPAY_PRIVATE_KEY?: string;
	JUNIPAY_CALLBACK_URL?: string;
	JUNIPAY_BASE_URL?: string;
	HUBTEL_CLIENT_ID?: string;
	HUBTEL_CLIENT_SECRET?: string;
	HUBTEL_POS_SALES_ID?: string;
	HUBTEL_CALLBACK_URL?: string;
	HUBTEL_BASE_URL?: string;
	MAX_LISTED_EVENTS?: string;
	NEXT_PUBLIC_USSD_ROOT_CODE?: string;
}

const JUNIPAY_BASE_URL = "https://api.junipayments.com";
const HUBTEL_BASE_URL = "https://rmp.hubtel.com";

type GatewayName = "paystack" | "junipay" | "hubtel";

function isGatewayName(value: unknown): value is GatewayName {
	return value === "paystack" || value === "junipay" || value === "hubtel";
}

function isGatewayConfigured(env: Env | undefined, gateway: GatewayName): boolean {
	if (gateway === "paystack") {
		return Boolean((env?.PAYSTACK_SECRET_KEY || "").trim());
	}
	if (gateway === "junipay") {
		return Boolean(
			(env?.JUNIPAY_CLIENT_ID || "").trim() && (env?.JUNIPAY_PRIVATE_KEY || "").trim(),
		);
	}
	if (gateway === "hubtel") {
		return Boolean(
			(env?.HUBTEL_CLIENT_ID || "").trim() &&
				(env?.HUBTEL_CLIENT_SECRET || "").trim() &&
				(env?.HUBTEL_POS_SALES_ID || "").trim(),
		);
	}
	return false;
}

export const MAX_LISTED_EVENTS = 7;
export const ENTER_CODE_OPTION = "0";

// Provider Detection & Helpers
export function normalizePhone(phone: string): string {
	let localPhone = phone.replace(/^\+?233/, "0");
	if (localPhone.startsWith("00")) localPhone = localPhone.substring(1);
	return localPhone;
}

function toArkeselPhone(phone: string): string {
	const digits = phone.replace(/\D/g, "");
	if (digits.startsWith("233")) return digits;
	if (digits.startsWith("0")) return `233${digits.slice(1)}`;
	return digits;
}

async function sendVoteReceiptSms(
	env: Env,
	{
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
		votesCount: number;
		reference: string;
		eventId: string;
	},
): Promise<boolean> {
	if (!env.ARKESEL_API_KEY) {
		console.warn("[USSD-WORKER-SMS] ARKESEL_API_KEY is not configured.");
		return false;
	}

	const firstName = voterName?.trim().split(/\s+/)[0]?.slice(0, 10);
	const nominee = nomineeName.slice(0, 25);
	const greeting = firstName ? `Hi ${firstName}, ` : "";
	const message = `${greeting}${votesCount} vote(s) cast for ${nominee}!\nRef: ${reference.slice(-10)}\nThank you! -Fextiva`.slice(0, 155);

	try {
		const response = await fetch("https://sms.arkesel.com/api/v2/sms/send", {
			method: "POST",
			headers: {
				"api-key": env.ARKESEL_API_KEY,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				sender: env.ARKESEL_SENDER_ID || "Fextiva",
				message,
				recipients: [toArkeselPhone(phone)],
			}),
		});
		const data = (await response.json()) as { status?: string; message?: string };
		if (!response.ok || data.status !== "success") {
			console.error("[USSD-WORKER-SMS] Vote receipt failed:", {
				eventId,
				status: response.status,
				message: data.message,
			});
			return false;
		}
		return true;
	} catch (error) {
		console.error("[USSD-WORKER-SMS] Vote receipt exception:", { eventId, error });
		return false;
	}
}

export function getProvider(phone: string): "mtn" | "vod" | "atl" {
	const localPhone = normalizePhone(phone);
	const prefix = localPhone.substring(0, 3);
	if (["024", "054", "055", "059", "025", "053"].includes(prefix))
		return "mtn";
	if (["020", "050"].includes(prefix)) return "vod";
	if (["027", "057", "026", "056"].includes(prefix)) return "atl";
	return "mtn";
}

// ─── JuniPay (Ghana mobile money) adapter ────────────────────────────────────

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

function bytesToBinary(bytes: Uint8Array): string {
	let s = "";
	for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
	return s;
}

function binaryToBytes(bin: string): Uint8Array {
	const bytes = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
	return bytes;
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
	if (!trimmed.includes("BEGIN RSA PRIVATE KEY")) return trimmed;
	const b64 = trimmed
		.replace(/-----(BEGIN|END)[^-]+-----/g, "")
		.replace(/[^A-Za-z0-9+/=]/g, "");
	const pkcs8Der = pkcs1ToPkcs8(binaryToBytes(atob(b64)));
	const outB64 = btoa(bytesToBinary(pkcs8Der));
	const lines = outB64.match(/.{1,64}/g)?.join("\n") ?? outB64;
	return `-----BEGIN PRIVATE KEY-----\n${lines}\n-----END PRIVATE KEY-----`;
}

async function signJunipayToken(clientId: string, privateKeyPem: string): Promise<string> {
	const privateKey = await importPKCS8(normalizePrivateKey(privateKeyPem), "RS256");
	return await new SignJWT({ payload: clientId })
		.setProtectedHeader({ alg: "RS256" })
		.setIssuedAt()
		.sign(privateKey);
}

async function initiateJunipayCollection(
	clientId: string,
	privateKeyPem: string,
	baseUrl: string,
	request: {
		amount: number;
		phoneNumber: string;
		provider: string;
		email: string;
		description: string;
		foreignId: string;
		callbackUrl?: string;
	},
): Promise<{ ok: boolean; statusCode: number; data: any; transId: string; transId2: string; reqToken: string; success: boolean; message: string }> {
	const token = await signJunipayToken(clientId, privateKeyPem);

	const response = await fetch(`${baseUrl}/payment`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			clientid: clientId,
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

// ─── Hubtel (Ghana mobile money) adapter ─────────────────────────────────────

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

function toInternationalMsisdn(phone: string): string {
	const digits = phone.replace(/\D/g, "");
	if (digits.startsWith("233")) return digits;
	if (digits.startsWith("0")) return `233${digits.slice(1)}`;
	return `233${digits}`;
}

function generateHubtelReference(): string {
	const ts = Date.now().toString(36).toUpperCase();
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	let rand = "";
	for (let i = 0; i < 6; i++) {
		rand += chars[Math.floor(Math.random() * chars.length)];
	}
	return `HT${ts}${rand}`.slice(0, 36);
}

async function initiateHubtelCollection(
	clientId: string,
	clientSecret: string,
	posSalesId: string,
	baseUrl: string,
	request: {
		amount: number;
		phoneNumber: string;
		channel: string;
		email: string;
		description: string;
		clientReference: string;
		callbackUrl?: string;
	},
): Promise<{ ok: boolean; statusCode: number; data: any; responseCode: string; transactionId: string; clientReference: string; success: boolean; pending: boolean; message: string }> {
	const basic = btoa(`${clientId}:${clientSecret}`);
	const url = `${baseUrl}/merchantaccount/merchants/${encodeURIComponent(posSalesId)}/receive/mobilemoney`;

	const response = await fetch(url, {
		method: "POST",
		headers: {
			Authorization: `Basic ${basic}`,
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		body: JSON.stringify({
			CustomerName: undefined,
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

export function textResponse(body: string): Response {
	return new Response(body, {
		status: 200,
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Access-Control-Allow-Origin": "*",
		},
	});
}

export function jsonResponse(body: object): Response {
	return new Response(JSON.stringify(body), {
		status: 200,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Access-Control-Allow-Origin": "*",
		},
	});
}

// Token Navigation & Menus
export function reduceTokens(tokens: string[]): string[] {
	const stack: string[] = [];
	for (const token of tokens) {
		if (token === "0") {
			if (stack.length === 0) {
				stack.push("0");
			} else if (stack.length === 1 && stack[0] === "0") {
				stack.pop();
			} else {
				stack.pop();
			}
		} else {
			stack.push(token);
		}
	}
	return stack;
}

export function getPaginatedSelection(tokens: string[]): {
	page: number;
	selectedIndex: number | null;
	remainingTokens: string[];
} {
	let page = 1;
	const PAGE_SIZE = 7;
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		if (token === "99") {
			page++;
		} else if (token === "98") {
			page = Math.max(1, page - 1);
		} else {
			const idx = Number.parseInt(token, 10);
			if (Number.isNaN(idx))
				return { page, selectedIndex: null, remainingTokens: tokens.slice(i) };
			const absoluteIndex = (page - 1) * PAGE_SIZE + (idx - 1);
			return {
				page,
				selectedIndex: absoluteIndex,
				remainingTokens: tokens.slice(i + 1),
			};
		}
	}
	return { page, selectedIndex: null, remainingTokens: [] };
}

export function buildPaginatedMenu(
	title: string,
	items: any[],
	page: number,
	renderItem: (item: any, localIdx: number) => string,
): string {
	const PAGE_SIZE = 7;
	const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
	const currentPage = Math.max(1, Math.min(page, totalPages));

	const startIndex = (currentPage - 1) * PAGE_SIZE;
	const pageItems = items.slice(startIndex, startIndex + PAGE_SIZE);

	let menu = `CON ${title}\n`;
	pageItems.forEach((item, i) => {
		menu += renderItem(item, i + 1);
	});

	if (currentPage < totalPages) menu += "99. More\n";
	if (currentPage > 1) menu += "98. Prev\n";
	menu += "0. Back\n";
	return menu;
}

// Database Helpers via direct PostgreSQL connection
export async function fetchEventByCode(sql: any, code: string) {
	const trimmed = (code || "").trim();
	const num = Number.parseInt(trimmed, 10);
	const padded = !Number.isNaN(num) && num < 100 ? num.toString().padStart(2, "0") : trimmed;
	const unpadded = !Number.isNaN(num) ? num.toString() : trimmed;

	const events = await sql`
		SELECT id, title, has_ussd, ussd_code, type, organization_id, status, start_date, end_date, payment_gateway, payment_channel
		FROM events 
		WHERE (ussd_code = ${trimmed} OR ussd_code = ${padded} OR ussd_code = ${unpadded}) AND has_ussd = true
		LIMIT 1
	`;
	return events[0] || null;
}

export async function getWorkerFeeCalculation(
	sql: any,
	baseAmount: number,
	feeType: "vote" | "ticket" = "vote",
	organizationId?: string,
	gateway: GatewayName = "paystack",
) {
	let feePct = 0.065;
	let fixedFee = 0;
	let minFee: number | undefined;
	let maxFee: number | undefined;

	try {
		let feeRows: any[] = [];
		if (organizationId) {
			feeRows = await sql`
				SELECT percentage, fixed_amount, min_fee, max_fee
				FROM fee_configurations
				WHERE organization_id = ${organizationId} AND fee_type = ${feeType} AND is_active = true
				ORDER BY created_at DESC
				LIMIT 1
			`;
		}

		if (feeRows.length === 0) {
			feeRows = await sql`
				SELECT percentage, fixed_amount, min_fee, max_fee
				FROM fee_configurations
				WHERE organization_id IS NULL AND fee_type = ${feeType} AND is_active = true
				ORDER BY created_at DESC
				LIMIT 1
			`;
		}

		if (feeRows.length > 0) {
			const row = feeRows[0];
			if (row.percentage !== null && row.percentage !== undefined) {
				const p = Number(row.percentage);
				feePct = p > 1 ? p / 100 : p;
			}
			if (row.fixed_amount !== null && row.fixed_amount !== undefined) {
				fixedFee = Number(row.fixed_amount);
			}
			if (row.min_fee !== null && row.min_fee !== undefined) {
				minFee = Number(row.min_fee);
			}
			if (row.max_fee !== null && row.max_fee !== undefined) {
				maxFee = Number(row.max_fee);
			}
		}
	} catch (err) {
		console.warn("[USSD-WORKER-FEE-ERROR] Fee query error:", err);
	}

	let paystackRate = 0.0195;
	let paystackCap = 100;
	if (gateway === "junipay" || gateway === "hubtel") {
		paystackRate = 0;
		paystackCap = 0;
	}

	try {
		const gatewayRows = await sql`
			SELECT value FROM platform_settings WHERE key = ${`payment_gateway_${gateway}`} LIMIT 1
		`;
		if (gatewayRows.length > 0 && gatewayRows[0].value) {
			const val = gatewayRows[0].value;
			if (typeof val.feeRate === "number") {
				paystackRate = val.feeRate > 1 ? val.feeRate / 100 : val.feeRate;
			}
			if (typeof val.feeCap === "number") {
				paystackCap = val.feeCap;
			}
		}
	} catch (err) {
		console.warn("[USSD-WORKER-GATEWAY-ERROR] Gateway setting error:", err);
	}

	// 1. Calculate platform fee
	const percentageFee = Math.round(baseAmount * feePct * 100) / 100;
	let platformFee = Math.round((percentageFee + fixedFee) * 100) / 100;
	if (minFee !== undefined && platformFee < minFee) platformFee = minFee;
	if (maxFee !== undefined && platformFee > maxFee) platformFee = maxFee;

	const organizerReceives = Math.max(0, Math.round((baseAmount - platformFee) * 100) / 100);

	// 2. Calculate Paystack surcharge absorbed by buyer
	const uncappedCharge = baseAmount / (1 - paystackRate);
	const uncappedFee = Math.round(uncappedCharge * paystackRate * 100) / 100;

	let totalToCharge = Math.round(uncappedCharge * 100) / 100;
	let paystackFee = uncappedFee;

	if (uncappedFee > paystackCap) {
		totalToCharge = Math.round((baseAmount + paystackCap) * 100) / 100;
		paystackFee = paystackCap;
	}

	return {
		totalToCharge,
		paystackFee,
		platformFee,
		organizerReceives,
		baseAmount,
	};
}

export async function fetchEventDetails(sql: any, eventId: string) {
	const [categories, options, ticketTypes] = await Promise.all([
		sql`SELECT id, name, order_idx, vote_price FROM voting_categories WHERE event_id = ${eventId} ORDER BY order_idx ASC`,
		sql`SELECT id, category_id, option_text, order_idx, status, created_at FROM voting_options WHERE event_id = ${eventId} AND status = 'approved' ORDER BY created_at ASC`,
		sql`SELECT id, name, price, status, order_idx, min_per_order, max_per_order FROM ticket_types WHERE event_id = ${eventId} AND status = 'available' ORDER BY order_idx ASC`,
	]);

	return {
		categories,
		options,
		ticketTypes,
	};
}

// Payment Processing via Paystack
/** Extract the payer's real name from a gateway charge response. */
function extractPayerName(paystackData: any): string | null {
	if (!paystackData || typeof paystackData !== "object") return null;
	const accountName =
		paystackData.authorization?.account_name ||
		paystackData.authorization?.accountName;
	if (typeof accountName === "string" && accountName.trim()) return accountName.trim();
	const first =
		paystackData.customer?.first_name || paystackData.customer?.firstName;
	const last =
		paystackData.customer?.last_name || paystackData.customer?.lastName;
	if (typeof first === "string" && first.trim()) {
		const full = `${first.trim()}${last && String(last).trim() ? ` ${String(last).trim()}` : ""}`;
		if (full.trim()) return full.trim();
	}
	if (typeof paystackData.customer?.name === "string" && paystackData.customer.name.trim()) {
		return paystackData.customer.name.trim();
	}
	return null;
}

/**
 * Resolve the MoMo account-holder name via Paystack `bank/resolve`, deriving the
 * network bank code (MTN/VOD/ATL) from the phone prefix. Fallback for gateways
 * (e.g. JuniPay, Hubtel) whose callback does not include the account name.
 */
async function resolvePayerNameFromPaystack(
	env: Env | undefined,
	phone: string | null | undefined,
): Promise<string | null> {
	const secret = (env?.PAYSTACK_SECRET_KEY || "").trim();
	if (!secret || !phone) return null;

	const provider = getProvider(phone);
	const bankCode = provider === "mtn" ? "MTN" : provider === "vod" ? "VOD" : "ATL";
	const accountNumber = normalizePhone(phone);
	if (!accountNumber) return null;

	try {
		const url = `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(
			accountNumber,
		)}&bank_code=${encodeURIComponent(bankCode)}`;
		const response = await fetch(url, {
			method: "GET",
			headers: { Authorization: `Bearer ${secret}` },
		});
		const result = (await response.json()) as any;
		if (result.status && typeof result.data?.account_name === "string") {
			const name = result.data.account_name.trim();
			if (name) return name;
		}
	} catch (err) {
		console.warn("[USSD-WORKER-PAYER-NAME] Paystack account resolve failed:", err);
	}

	return null;
}

export async function fulfillSuccessfulPaymentSql(
	sql: any,
	reference: string,
	paystackData?: any,
	env?: Env,
) {
	try {
		const payments = await sql`
			SELECT id, reference, status, purpose, amount, currency, metadata 
			FROM payments 
			WHERE reference = ${reference} 
			LIMIT 1
		`;
		const payment = payments[0] || null;
		if (payment && payment.status === "completed") {
			return;
		}

		const paymentId = payment?.id || null;
		const metadata = payment?.metadata || paystackData?.metadata || {};
		const purpose =
			payment?.purpose ||
			metadata.purpose ||
			(metadata.voteCount ? "vote_purchase" : "ticket_purchase");
		const paystackTransactionId = String(paystackData?.id || "");

		// 1. Update Payment record
		if (paymentId) {
			await sql`
				UPDATE payments 
				SET status = 'completed', 
					verified_at = NOW(), 
					paystack_transaction_id = ${paystackTransactionId},
					updated_at = NOW() 
				WHERE id = ${paymentId}
			`;
		}

		// 2. Mark USSD Session completed
		await sql`
			UPDATE ussd_sessions 
			SET status = 'completed', updated_at = NOW() 
			WHERE reference = ${reference}
		`;

		// 3. Voting Fulfillment
		if (purpose === "voting" || purpose === "vote_purchase") {
			const optionId =
				metadata.optionId || metadata.votingOptionId || metadata.option_id;
			const categoryId = metadata.categoryId || metadata.category_id || null;
			const eventId = metadata.eventId || metadata.event_id;
			const voteCount = Math.max(
				1,
				Number(metadata.voteCount) || Number(metadata.quantity) || 1,
			);
			const voterPhone =
				metadata.voterPhone ||
				metadata.phone ||
				metadata.phone_number ||
				null;
			const voterEmail =
				metadata.voterEmail || (voterPhone ? `${voterPhone}@fextiva.com` : null);

			if (optionId && eventId) {
				await sql`
					INSERT INTO votes (event_id, option_id, category_id, payment_id, vote_count, voter_phone, voter_email, created_at)
					VALUES (${eventId}, ${optionId}, ${categoryId}, ${paymentId}, ${voteCount}, ${voterPhone}, ${voterEmail}, NOW())
				`;

				await sql`
					UPDATE voting_options 
					SET votes_count = votes_count + ${voteCount}, updated_at = NOW() 
					WHERE id = ${optionId}
				`;

				if (voterPhone && env) {
					try {
						const configRows = await sql`
							SELECT vote_receipt_channel
							FROM event_messaging_configs
							WHERE event_id = ${eventId}
							LIMIT 1
						`;
						const voteReceiptChannel = configRows[0]?.vote_receipt_channel || "whatsapp";
						if (voteReceiptChannel === "sms" || voteReceiptChannel === "whatsapp_sms") {
							const nomineeRows = await sql`
								SELECT option_text
								FROM voting_options
								WHERE id = ${optionId}
								LIMIT 1
							`;
							await sendVoteReceiptSms(env, {
								phone: voterPhone,
								voterName: metadata.voterName,
								nomineeName: nomineeRows[0]?.option_text || "Nominee",
								votesCount: voteCount,
								reference,
								eventId,
							});
						}
					} catch (notificationError) {
						console.error("[USSD-WORKER-SMS] Vote receipt routing failed:", notificationError);
					}
				}
			}
		}

		// 4. Ticket Purchase Fulfillment
		if (purpose === "ticket_purchase") {
			const ticketTypeId =
				metadata.ticketTypeId || metadata.optionId || metadata.option_id;
			const eventId = metadata.eventId || metadata.event_id;
			const quantity = Math.max(1, Number(metadata.quantity) || 1);
			const buyerPhone =
				metadata.voterPhone ||
				metadata.phone ||
				metadata.phone_number ||
				"";
			const buyerEmail = metadata.buyerEmail || `${buyerPhone}@fextiva.com`;
			const buyerName =
				metadata.buyerName ||
				metadata.attendeeName ||
				extractPayerName(paystackData) ||
				(await resolvePayerNameFromPaystack(env, buyerPhone)) ||
				`USSD Attendee (${buyerPhone})`;

			if (ticketTypeId && eventId && paymentId) {
				const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
				const orderRows = await sql`
					INSERT INTO ticket_orders (event_id, payment_id, order_number, buyer_name, buyer_phone, subtotal, status, created_at, updated_at)
					VALUES (${eventId}, ${paymentId}, ${orderNumber}, ${buyerName}, ${buyerPhone}, ${payment?.amount || 0}, 'completed', NOW(), NOW())
					RETURNING id
				`;
				const orderId = orderRows[0]?.id;

				if (orderId) {
					for (let i = 0; i < quantity; i++) {
						const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
						const ticketCode = `TIX-${Date.now().toString().slice(-6)}-${randomSuffix}-${i + 1}`;
						await sql`
							INSERT INTO tickets (order_id, ticket_type_id, event_id, ticket_code, attendee_name, attendee_email, check_in_status, created_at, updated_at)
							VALUES (${orderId}, ${ticketTypeId}, ${eventId}, ${ticketCode}, ${buyerName}, ${buyerEmail}, 'not_checked_in', NOW(), NOW())
						`;
					}
					await sql`
						UPDATE ticket_types 
						SET quantity_sold = quantity_sold + ${quantity}, updated_at = NOW() 
						WHERE id = ${ticketTypeId}
					`;
				}
			}
		}

		// 5. Organization Wallet & Transaction Ledger Updates
		let organizationId =
			metadata.organizationId || metadata.orgId || metadata.organization_id;
		if (!organizationId) {
			const eventId = metadata.eventId || metadata.event_id;
			if (eventId) {
				const evRows =
					await sql`SELECT organization_id FROM events WHERE id = ${eventId} LIMIT 1`;
				organizationId = evRows[0]?.organization_id;
			}
		}

		if (organizationId) {
			const baseAmount = Number(
				metadata.baseAmount || payment?.amount || 0,
			);
			const platformFee = Number(metadata.platformFee || 0);
			const organizerReceives = Number(
				metadata.organizerReceives ?? (baseAmount - platformFee),
			);

			if (organizerReceives > 0) {
				await sql`
					INSERT INTO wallets (organization_id, balance, currency, created_at, updated_at)
					VALUES (${organizationId}, ${organizerReceives}, 'GHS', NOW(), NOW())
					ON CONFLICT (organization_id) 
					DO UPDATE SET balance = wallets.balance + ${organizerReceives}, last_transaction_at = NOW(), updated_at = NOW()
				`;

				const walletRows = await sql`
					SELECT id, balance FROM wallets WHERE organization_id = ${organizationId} LIMIT 1
				`;
				const wallet = walletRows[0];

				if (wallet) {
					const txnRef = `TXN-${reference}-${Date.now().toString().slice(-4)}`;
					const category =
						purpose === "ticket_purchase"
							? "ticket_purchase"
							: "vote_purchase";

					await sql`
						INSERT INTO transactions (reference, wallet_id, payment_id, type, category, status, amount, currency, fee_amount, balance_after, description, completed_at, created_at, updated_at)
						VALUES (${txnRef}, ${wallet.id}, ${paymentId}, 'credit', ${category}, 'completed', ${organizerReceives}, 'GHS', ${platformFee}, ${wallet.balance}, ${"USSD Payment: " + reference}, NOW(), NOW(), NOW())
						ON CONFLICT (reference) DO NOTHING
					`;
				}
			}
		}
	} catch (fulfillmentErr) {
		console.error("[USSD-WORKER-FULFILLMENT-ERROR]", fulfillmentErr);
	}
}

export async function submitOtp(
	sql: any,
	reference: string,
	otp: string,
	paystackSecret: string,
	env?: Env,
): Promise<Response> {
	try {
		const paystackRes = await fetch(
			"https://api.paystack.co/charge/submit_otp",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${paystackSecret}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ otp, reference }),
			},
		);
		const paystackData = (await paystackRes.json()) as any;

		if (!paystackRes.ok || !paystackData.status) {
			return textResponse(
				`END OTP verification failed: ${paystackData.message || "Invalid OTP"}`,
			);
		}

		if (paystackData.data?.status === "success") {
			await fulfillSuccessfulPaymentSql(sql, reference, paystackData.data, env);
			return textResponse(
				"END Payment authorized! Your request has been confirmed.",
			);
		}

		return textResponse(
			"END Payment authorized! You will receive an SMS confirmation shortly.",
		);
	} catch (err) {
		console.error("Paystack OTP Exception:", err);
		return textResponse("END OTP submission failed. Try again later.");
	}
}

export async function processPayment(
	sql: any,
	event: any,
	optionId: string,
	quantity: number,
	price: number,
	phoneNumber: string,
	paystackSecret: string,
	otpStr?: string,
	isSimulation: boolean = false,
	env?: Env,
): Promise<Response> {
	if (Number.isNaN(quantity) || quantity <= 0) {
		return textResponse("END Invalid number. Try again.");
	}

	// Resolve the gateway first so the fee surcharge uses the correct gateway's
	// rate/cap (Paystack, JuniPay, and Hubtel may all differ).
	const gateway = await resolveUssdGateway(sql, env, event);

	const baseAmount = Number(price) * quantity;
	const feeType = event.type === "voting" ? "vote" : "ticket";
	const orgId = event.organization_id || event.organizationId;
	const feeCalc = await getWorkerFeeCalculation(sql, baseAmount, feeType, orgId, gateway);
	const totalAmountGHS = feeCalc.totalToCharge;
	const amountPesewas = Math.round(totalAmountGHS * 100);

	if (isSimulation) {
		const itemLabel = event.type === "voting" ? `${quantity} vote(s)` : `${quantity} ticket(s)`;
		return textResponse(
			`END Request received. Please check your phone for the prompt to enter your MoMo PIN.\n\n[SIMULATOR]: GHS ${totalAmountGHS.toFixed(2)} for ${itemLabel}. Preview mode - no real payment charged.`,
		);
	}

	if (gateway === "junipay" && env) {
		return await processJunipayPayment(
			sql,
			event,
			optionId,
			quantity,
			price,
			phoneNumber,
			env,
		);
	}
	if (gateway === "hubtel" && env) {
		return await processHubtelPayment(
			sql,
			event,
			optionId,
			quantity,
			price,
			phoneNumber,
			env,
		);
	}

	if (otpStr) {
		const pendingSessions = await sql`
			SELECT reference 
			FROM ussd_sessions 
			WHERE phone_number = ${phoneNumber} AND status = 'pending' 
			ORDER BY created_at DESC 
			LIMIT 1
		`;
		if (pendingSessions.length > 0) {
			return await submitOtp(
				sql,
				pendingSessions[0].reference,
				otpStr,
				paystackSecret,
				env,
			);
		}
	}

	const provider = getProvider(phoneNumber);
	const reference = `USSD_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

	try {
		await sql`
			INSERT INTO ussd_sessions (reference, phone_number, event_id, option_id, quantity, amount, status)
			VALUES (${reference}, ${phoneNumber}, ${event.id}, ${optionId}, ${quantity}, ${baseAmount}, 'pending')
		`;

		// Also create record in payments table for webhook reconciliation
		await sql`
			INSERT INTO payments (reference, email, purpose, amount, currency, provider, status, metadata, created_at, updated_at)
			VALUES (${reference}, ${`${normalizePhone(phoneNumber)}@fextiva.com`}, ${event.type === "voting" ? "vote_purchase" : "ticket_purchase"}, ${baseAmount}, 'GHS', 'paystack', 'pending', ${JSON.stringify({
			source: "ussd",
			channel: "ussd",
			event_id: event.id,
			eventId: event.id,
			organization_id: orgId,
			organizationId: orgId,
			option_id: optionId,
			optionId: optionId,
			votingOptionId: optionId,
			ticketTypeId: optionId,
			quantity,
			voteCount: quantity,
			phone_number: phoneNumber,
			phone: phoneNumber,
			baseAmount,
			platformFee: feeCalc.platformFee,
			organizerReceives: feeCalc.organizerReceives,
			paystackFee: feeCalc.paystackFee,
			totalToCharge: totalAmountGHS,
		})}, NOW(), NOW())
			ON CONFLICT (reference) DO NOTHING
		`;

		if (!paystackSecret) {
			return textResponse(
				`END Payment of GHS ${totalAmountGHS.toFixed(2)} recorded. Reference: ${reference}`,
			);
		}

		// When testing in Paystack test mode (sk_test_...), Paystack requires using test mobile money number 0551234987.
		// Arbitrary numbers will be declined by Paystack with: "Please use the test mobile money number".
		const isTestMode = paystackSecret.startsWith("sk_test_");
		const chargePhone = isTestMode ? "0551234987" : normalizePhone(phoneNumber);
		const chargeProvider = isTestMode ? "mtn" : provider;

		const paystackRes = await fetch("https://api.paystack.co/charge", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${paystackSecret}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				amount: amountPesewas,
				email: `${normalizePhone(phoneNumber)}@fextiva.com`,
				currency: "GHS",
				reference,
				mobile_money: {
					phone: chargePhone,
					provider: chargeProvider,
				},
				metadata: {
					source: "ussd",
					channel: "ussd",
					event_id: event.id,
					eventId: event.id,
					organization_id: orgId,
					organizationId: orgId,
					option_id: optionId,
					optionId: optionId,
					votingOptionId: optionId,
					ticketTypeId: optionId,
					quantity,
					voteCount: quantity,
					phone_number: phoneNumber,
					phone: phoneNumber,
					baseAmount,
					platformFee: feeCalc.platformFee,
					organizerReceives: feeCalc.organizerReceives,
					paystackFee: feeCalc.paystackFee,
					totalToCharge: totalAmountGHS,
				},
			}),
		});

		const paystackData = (await paystackRes.json()) as any;
		console.info("[USSD-PAYSTACK-CHARGE]", {
			reference,
			provider: chargeProvider,
			phone: chargePhone,
			statusCode: paystackRes.status,
			response: paystackData,
		});

		if (!paystackRes.ok || !paystackData.status) {
			console.error("Paystack Charge Error:", paystackData);
			return textResponse(
				`END Payment failed: ${paystackData.message || "Please check your network and balance."}`,
			);
		}

		// Immediate fulfillment on success (e.g. test mode or pre-approved transactions)
		if (paystackData.data?.status === "success") {
			await fulfillSuccessfulPaymentSql(sql, reference, paystackData.data, env);
			const itemLabel = event.type === "voting" ? `${quantity} vote(s)` : `${quantity} ticket(s)`;
			return textResponse(
				`END Payment successful! Your ${itemLabel} for "${event.title}" has been confirmed.\nRef: ${reference}`,
			);
		}

		if (paystackData.data?.status === "send_otp") {
			await sql`
				UPDATE payments
				SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{awaitingOtp}', 'true')
				WHERE reference = ${reference}
			`;
			return textResponse(
				`CON ${paystackData.data.display_text || "Enter the OTP sent to your phone"}:\n0. Cancel`,
			);
		}

		if (["pay_offline", "pending", "ongoing", "processing"].includes(paystackData.data?.status)) {
			return textResponse(
				"END Payment request sent. Approve it on your phone. Your vote will be confirmed automatically.",
			);
		}
	} catch (err) {
		console.error("Paystack Charge Exception:", err);
		return textResponse("END Payment initiation failed. Try again later.");
	}

	return textResponse(
		"END Request received. Please check your phone for the prompt to enter your MoMo PIN.",
	);
}

/**
 * Isolated JuniPay payment path (mirrors apps/web/.../junipay-payments.ts).
 * Activated only when the event resolves to JuniPay AND the JuniPay credentials
 * are configured, so Paystack stays untouched otherwise.
 */
async function processJunipayPayment(
	sql: any,
	event: any,
	optionId: string,
	quantity: number,
	price: number,
	phoneNumber: string,
	env: Env,
): Promise<Response> {
	const clientId = env.JUNIPAY_CLIENT_ID || "";
	const privateKey = env.JUNIPAY_PRIVATE_KEY || "";
	if (!clientId || !privateKey) {
		return textResponse("END JuniPay is not configured. Please try again later.");
	}

	const baseAmount = Number(price) * quantity;
	const feeType = event.type === "voting" ? "vote" : "ticket";
	const orgId = event.organization_id || event.organizationId;
	const feeCalc = await getWorkerFeeCalculation(sql, baseAmount, feeType, orgId, "junipay");
	const totalAmountGHS = feeCalc.totalToCharge;

	const reference = `JUNIPAY_${Date.now()}_${Math.random()
		.toString(36)
		.substring(2, 8)
		.toUpperCase()}`;
	const provider = mapJunipayProvider(getProvider(phoneNumber));

	// Persist pending records BEFORE calling JuniPay so the callback can reconcile.
	await sql`
		INSERT INTO ussd_sessions (reference, phone_number, event_id, option_id, quantity, amount, status)
		VALUES (${reference}, ${phoneNumber}, ${event.id}, ${optionId}, ${quantity}, ${baseAmount}, 'pending')
	`;

	await sql`
		INSERT INTO payments (reference, email, purpose, amount, currency, provider, status, metadata, created_at, updated_at)
		VALUES (${reference}, ${`${normalizePhone(phoneNumber)}@fextiva.com`}, ${event.type === "voting" ? "vote_purchase" : "ticket_purchase"}, ${baseAmount}, 'GHS', 'paystack', 'pending', ${JSON.stringify({
			gateway: "junipay",
			source: "ussd",
			channel: "ussd",
			event_id: event.id,
			eventId: event.id,
			organization_id: orgId,
			organizationId: orgId,
			option_id: optionId,
			optionId: optionId,
			votingOptionId: optionId,
			ticketTypeId: optionId,
			quantity,
			voteCount: quantity,
			phone_number: phoneNumber,
			phone: phoneNumber,
			baseAmount,
			platformFee: feeCalc.platformFee,
			organizerReceives: feeCalc.organizerReceives,
			totalToCharge: totalAmountGHS,
		})}, NOW(), NOW())
		ON CONFLICT (reference) DO NOTHING
	`;

	const result = await initiateJunipayCollection(clientId, privateKey, env.JUNIPAY_BASE_URL || JUNIPAY_BASE_URL, {
		amount: totalAmountGHS,
		phoneNumber: normalizePhone(phoneNumber),
		provider,
		email: `${normalizePhone(phoneNumber)}@fextiva.com`,
		description: `USSD payment for ${event.title}`,
		foreignId: reference,
		callbackUrl: env.JUNIPAY_CALLBACK_URL || undefined,
	});

	if (result.transId || result.transId2 || result.reqToken) {
		await sql`
			UPDATE payments
			SET provider_reference = ${result.transId || result.reqToken || result.transId2},
				provider_response = ${JSON.stringify(result.data)},
				metadata = jsonb_set(
					jsonb_set(
						jsonb_set(
							COALESCE(metadata, '{}'::jsonb),
							'{junipayTransId}', to_jsonb(${result.transId}::text)
						),
						'{junipayTransId2}', to_jsonb(${result.transId2}::text)
					),
					'{junipayReqToken}', to_jsonb(${result.reqToken}::text)
				)
			WHERE reference = ${reference}
		`.catch(() => {});
	}

	if (result.success) {
		await fulfillSuccessfulPaymentSql(sql, reference, {
			id: result.transId || reference,
			metadata: { gateway: "junipay" },
		}, env);
		const itemLabel = event.type === "voting" ? `${quantity} vote(s)` : `${quantity} ticket(s)`;
		return textResponse(
			`END Payment successful! Your ${itemLabel} for "${event.title}" has been confirmed.\nRef: ${reference}`,
		);
	}

	if (!result.ok) {
		return textResponse(`END Payment initiation failed: ${result.message || "Please try again."}`);
	}

	return textResponse(
		"END Payment request sent. Approve it on your phone. Your vote will be confirmed automatically.",
	);
}

/**
 * Isolated Hubtel payment path. Mirrors the JuniPay path and keeps the live
 * Paystack flow untouched unless Hubtel is explicitly selected.
 */
async function processHubtelPayment(
	sql: any,
	event: any,
	optionId: string,
	quantity: number,
	price: number,
	phoneNumber: string,
	env: Env,
): Promise<Response> {
	const clientId = env.HUBTEL_CLIENT_ID || "";
	const clientSecret = env.HUBTEL_CLIENT_SECRET || "";
	const posSalesId = env.HUBTEL_POS_SALES_ID || "";
	if (!clientId || !clientSecret || !posSalesId) {
		return textResponse("END Hubtel is not configured. Please try again later.");
	}

	const baseAmount = Number(price) * quantity;
	const feeType = event.type === "voting" ? "vote" : "ticket";
	const orgId = event.organization_id || event.organizationId;
	const feeCalc = await getWorkerFeeCalculation(sql, baseAmount, feeType, orgId, "hubtel");
	const totalAmountGHS = feeCalc.totalToCharge;

	const reference = generateHubtelReference();
	const channel = mapHubtelChannel(getProvider(phoneNumber));

	await sql`
		INSERT INTO ussd_sessions (reference, phone_number, event_id, option_id, quantity, amount, status)
		VALUES (${reference}, ${phoneNumber}, ${event.id}, ${optionId}, ${quantity}, ${baseAmount}, 'pending')
	`;

	await sql`
		INSERT INTO payments (reference, email, purpose, amount, currency, provider, status, metadata, created_at, updated_at)
		VALUES (${reference}, ${`${normalizePhone(phoneNumber)}@fextiva.com`}, ${event.type === "voting" ? "vote_purchase" : "ticket_purchase"}, ${baseAmount}, 'GHS', 'paystack', 'pending', ${JSON.stringify({
			gateway: "hubtel",
			source: "ussd",
			channel: "ussd",
			event_id: event.id,
			eventId: event.id,
			organization_id: orgId,
			organizationId: orgId,
			option_id: optionId,
			optionId: optionId,
			votingOptionId: optionId,
			ticketTypeId: optionId,
			quantity,
			voteCount: quantity,
			phone_number: phoneNumber,
			phone: phoneNumber,
			baseAmount,
			platformFee: feeCalc.platformFee,
			organizerReceives: feeCalc.organizerReceives,
			totalToCharge: totalAmountGHS,
		})}, NOW(), NOW())
		ON CONFLICT (reference) DO NOTHING
	`;

	const result = await initiateHubtelCollection(
		clientId,
		clientSecret,
		posSalesId,
		env.HUBTEL_BASE_URL || HUBTEL_BASE_URL,
		{
			amount: totalAmountGHS,
			phoneNumber: normalizePhone(phoneNumber),
			channel,
			email: `${normalizePhone(phoneNumber)}@fextiva.com`,
			description: `USSD payment for ${event.title}`,
			clientReference: reference,
			callbackUrl: env.HUBTEL_CALLBACK_URL || undefined,
		},
	);

	if (result.transactionId) {
		await sql`
			UPDATE payments
			SET provider_reference = ${result.transactionId},
				provider_response = ${JSON.stringify(result.data)},
				metadata = jsonb_set(
					COALESCE(metadata, '{}'::jsonb),
					'{hubtelTransactionId}', to_jsonb(${result.transactionId}::text)
				)
			WHERE reference = ${reference}
		`.catch(() => {});
	}

	if (result.success) {
		await fulfillSuccessfulPaymentSql(sql, reference, {
			id: result.transactionId || reference,
			metadata: { gateway: "hubtel" },
		}, env);
		const itemLabel = event.type === "voting" ? `${quantity} vote(s)` : `${quantity} ticket(s)`;
		return textResponse(
			`END Payment successful! Your ${itemLabel} for "${event.title}" has been confirmed.\nRef: ${reference}`,
		);
	}

	if (result.pending) {
		return textResponse(
			"END Payment request sent. Approve it on your phone. Your vote will be confirmed automatically.",
		);
	}

	return textResponse(`END Payment initiation failed: ${result.message || "Please try again."}`);
}

/**
 * Resolve which payment gateway to use for a USSD payment. Routing is
 * super-admin configured: the event's `payment_gateway` override wins when its
 * `payment_channel` is NULL (both) or "ussd"; otherwise the USSD channel default
 * is used, with Paystack as the final fallback.
 */
async function resolveUssdGateway(
	sql: any,
	env: Env | undefined,
	event: any,
): Promise<GatewayName> {
	let defaultGateway: GatewayName = "paystack";

	try {
		const rows = await sql`
			SELECT value FROM platform_settings WHERE key = 'payment_routing_default' LIMIT 1
		`;
		if (rows.length > 0 && rows[0].value) {
			const val = rows[0].value;
			if (isGatewayName(val?.ussd)) defaultGateway = val.ussd;
		}
	} catch (err) {
		console.warn("[USSD-WORKER-ROUTING-ERROR] Could not read routing defaults:", err);
	}

	let gateway: GatewayName = defaultGateway;
	const eventGateway = event?.payment_gateway ?? event?.paymentGateway ?? null;
	const eventChannel = event?.payment_channel ?? event?.paymentChannel ?? null;

	if (isGatewayName(eventGateway)) {
		// NULL channel -> both; otherwise only apply when scoped to USSD.
		if (!eventChannel || eventChannel === "ussd") {
			gateway = eventGateway;
		}
	}

	if (!isGatewayConfigured(env, gateway)) {
		gateway = "paystack";
	}

	return gateway;
}

// Flow Handlers
export async function handleVotingFlow(
	sql: any,
	event: any,
	details: any,
	tokens: string[],
	phoneNumber: string,
	paystackSecret: string,
	isSimulation: boolean = false,
	env?: Env,
): Promise<Response> {
	const now = new Date();
	const startDate = event.start_date || event.startDate;
	const endDate = event.end_date || event.endDate;

	if (startDate && new Date(startDate) > now) {
		const startStr = new Date(startDate).toLocaleDateString("en-GH", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
		return textResponse(`END Voting has not started yet. Voting opens on ${startStr}.`);
	}

	if (
		event.status === "ended" ||
		event.status === "cancelled" ||
		(endDate && new Date(endDate) < now)
	) {
		return textResponse("END Voting for this event has ended.");
	}

	const categories = details.categories || [];
	if (categories.length === 0)
		return textResponse("END No voting categories available.");

	const isSingleCategory = categories.length === 1;
	const catSelection = getPaginatedSelection(tokens);
	const selectedCategoryIndex = isSingleCategory ? 0 : catSelection.selectedIndex;
	if (!isSingleCategory && selectedCategoryIndex === null) {
		return textResponse(
			buildPaginatedMenu(
				`${event.title}\nSelect Category:`,
				categories,
				catSelection.page,
				(cat, idx) => {
					const price = Number(cat.vote_price ?? cat.votePrice) || 0.5;
					return `${idx}. ${cat.name} (GHS ${price.toFixed(2)})\n`;
				},
			),
		);
	}

	if (selectedCategoryIndex === null) {
		return textResponse("END Invalid category.");
	}

	const selectedCategory = categories[selectedCategoryIndex];
	if (!selectedCategory) return textResponse("END Invalid category.");

	tokens = isSingleCategory ? tokens : catSelection.remainingTokens;
	const votePrice = Number(selectedCategory.vote_price ?? selectedCategory.votePrice) || 0.5;

	const nominees = (details.options || []).filter(
		(n: any) => n.category_id === selectedCategory.id,
	);

	if (nominees.length === 0)
		return textResponse(`END No nominees in ${selectedCategory.name}.`);

	const nomSelection = getPaginatedSelection(tokens);
	if (nomSelection.selectedIndex === null) {
		return textResponse(
			buildPaginatedMenu(
				`${selectedCategory.name}\n(GHS ${votePrice.toFixed(2)}/vote)\nSelect Nominee:`,
				nominees,
				nomSelection.page,
				(nom, idx) => `${idx}. ${nom.option_text}\n`,
			),
		);
	}

	const selectedNominee = nominees[nomSelection.selectedIndex];
	if (!selectedNominee) return textResponse("END Invalid nominee.");

	tokens = nomSelection.remainingTokens;

	const quantityStr = tokens.shift();
	if (!quantityStr) {
		return textResponse(
			`CON Enter number of votes for ${selectedNominee.option_text}:\nRate: GHS ${votePrice.toFixed(2)}/vote\n0. Back`,
		);
	}

	const quantity = Number.parseInt(quantityStr, 10);
	if (Number.isNaN(quantity) || quantity <= 0) {
		return textResponse("END Invalid vote quantity. Try again.");
	}

	// Order Summary & Confirmation Screen
	const confirmToken = tokens.shift();
	if (!confirmToken) {
		const baseAmount = votePrice * quantity;
		return textResponse(
			`CON Confirm Vote\nNominee: ${selectedNominee.option_text}\nVotes: ${quantity} @ GHS ${votePrice.toFixed(2)}\nTotal to Pay: GHS ${baseAmount.toFixed(2)}\n1. Confirm & Pay\n0. Back`,
		);
	}

	if (confirmToken !== "1") {
		return textResponse("CON Invalid choice.\n1. Confirm & Pay\n0. Back");
	}

	const otpStr = tokens.shift();

	return await processPayment(
		sql,
		event,
		selectedNominee.id,
		quantity,
		votePrice,
		phoneNumber,
		paystackSecret,
		otpStr,
		isSimulation,
		env,
	);
}

export async function handleTicketFlow(
	sql: any,
	event: any,
	details: any,
	tokens: string[],
	phoneNumber: string,
	paystackSecret: string,
	isSimulation: boolean = false,
	env?: Env,
): Promise<Response> {
	const now = new Date();
	const endDate = event.end_date || event.endDate;
	if (
		event.status === "ended" ||
		event.status === "cancelled" ||
		(endDate && new Date(endDate) < now)
	) {
		return textResponse("END Ticket sales for this event have ended.");
	}

	const tickets = details.ticketTypes || [];
	if (tickets.length === 0)
		return textResponse("END No tickets available.");

	const tktSelection = getPaginatedSelection(tokens);
	if (tktSelection.selectedIndex === null) {
		return textResponse(
			buildPaginatedMenu(
				`${event.title}\nSelect Ticket:`,
				tickets,
				tktSelection.page,
				(tkt, idx) => `${idx}. ${tkt.name} - GHS ${Number(tkt.price).toFixed(2)}\n`,
			),
		);
	}

	const selectedTicket = tickets[tktSelection.selectedIndex];
	if (!selectedTicket) return textResponse("END Invalid ticket.");

	tokens = tktSelection.remainingTokens;

	const ticketPrice = Number(selectedTicket.price) || 0;

	const quantityStr = tokens.shift();
	if (!quantityStr) {
		return textResponse(
			`CON Enter quantity for ${selectedTicket.name}:\nPrice: GHS ${ticketPrice.toFixed(2)} each\n0. Back`,
		);
	}

	const quantity = Number.parseInt(quantityStr, 10);
	if (Number.isNaN(quantity) || quantity <= 0) {
		return textResponse("END Invalid ticket quantity. Try again.");
	}

	if (selectedTicket.min_per_order && quantity < selectedTicket.min_per_order) {
		return textResponse(
			`END Minimum quantity for this ticket is ${selectedTicket.min_per_order}.`,
		);
	}

	if (selectedTicket.max_per_order && quantity > selectedTicket.max_per_order) {
		return textResponse(
			`END Maximum quantity for this ticket is ${selectedTicket.max_per_order}.`,
		);
	}

	// Order Summary & Confirmation Screen
	const confirmToken = tokens.shift();
	if (!confirmToken) {
		const baseAmount = ticketPrice * quantity;
		return textResponse(
			`CON Confirm Purchase\nTicket: ${selectedTicket.name}\nQty: ${quantity} @ GHS ${ticketPrice.toFixed(2)}\nTotal to Pay: GHS ${baseAmount.toFixed(2)}\n1. Confirm & Pay\n0. Back`,
		);
	}

	if (confirmToken !== "1") {
		return textResponse("CON Invalid choice.\n1. Confirm & Pay\n0. Back");
	}

	const otpStr = tokens.shift();

	return await processPayment(
		sql,
		event,
		selectedTicket.id,
		quantity,
		ticketPrice,
		phoneNumber,
		paystackSecret,
		otpStr,
		isSimulation,
		env,
	);
}

// Unified Core USSD Request Handler
export async function handleUssdCore(
	phoneNumber: string,
	text: string,
	env: Env,
	isSimulation: boolean = false,
	isNewSession: boolean = false,
): Promise<Response> {
	const dbUrl = env.DATABASE_URL;
	const paystackSecret = env.PAYSTACK_SECRET_KEY || "";

	if (!dbUrl) {
		console.error("[USSD] DATABASE_URL is missing. Available env keys:", Object.keys(env));
		return textResponse("END Server misconfiguration: missing DATABASE_URL.");
	}

	const sql = neon(dbUrl);

	// Vodafone charges may require Paystack's provider OTP; resume only sessions
	// explicitly marked as awaiting that OTP.
	if (!isSimulation) {
		const pendingSessions = await sql`
			SELECT s.reference, s.amount, s.event_id, s.quantity
			FROM ussd_sessions s
			JOIN payments p ON p.reference = s.reference
			WHERE s.phone_number = ${phoneNumber}
			  AND s.status = 'pending'
			  AND (p.metadata->>'awaitingOtp') = 'true'
			  AND s.created_at >= NOW() - INTERVAL '5 minutes'
			ORDER BY s.created_at DESC
			LIMIT 1
		`;

		if (pendingSessions.length > 0) {
			const pending = pendingSessions[0];
			const rawTokens = text.split("*").filter(Boolean);
			if (isNewSession || rawTokens.length === 0) {
				return textResponse(
					`CON You have a pending payment of GHS ${pending.amount}.\nEnter the OTP sent to your phone:\n0. Cancel`,
				);
			}
			const otpAnswer = rawTokens[rawTokens.length - 1];
			if (otpAnswer === "0") {
				await sql`UPDATE ussd_sessions SET status = 'cancelled' WHERE reference = ${pending.reference}`;
				text = "";
			} else {
				const events = await sql`
					SELECT title, type
					FROM events
					WHERE id = ${pending.event_id}
					LIMIT 1
				`;
				if (!events[0]) return textResponse("END Payment session expired. Please try again.");
				return await submitOtp(
					sql,
					pending.reference,
					otpAnswer,
					paystackSecret,
					env,
				);
			}
		}
	}

	const rawInputArray = text.split("*").filter(Boolean);
	const inputArray = reduceTokens(rawInputArray);
	const depth = inputArray.length;

	// Welcome menu
	if (depth === 0) {
		const maxEvents = Number.parseInt(
			env.MAX_LISTED_EVENTS || `${MAX_LISTED_EVENTS}`,
			10,
		);
		const events = await sql`
			SELECT id, title, ussd_code 
			FROM events 
			WHERE has_ussd = true 
			  AND status IN ('published', 'ongoing')
			  AND (end_date IS NULL OR end_date >= NOW())
			ORDER BY created_at DESC 
			LIMIT ${maxEvents}
		`;

		let menu = "CON fextiva\n";
		if (events && events.length > 0) {
			events.forEach((ev: any, idx: number) => {
				menu += `${idx + 1}. ${ev.title}\n`;
			});
			menu += `#. Enter nominee code\n`;
		} else {
			menu += "Enter nominee code:\n";
		}
		return textResponse(menu);
	}

	let tokens = [...inputArray];
	let event: any = null;

	if (tokens[0] === "#" || tokens[0] === ENTER_CODE_OPTION) {
		// User chose "#. Enter nominee code" from the welcome screen
		tokens.shift();
		if (tokens.length === 0) {
			return textResponse("CON Enter nominee code:\n0. Back");
		}
		const nomineeCodeInput = tokens.shift()!;

		// Try to find a nominee by code first
		const rawCode = nomineeCodeInput.replace(/^[#\uFF03]+/, "").trim();
		if (rawCode) {
			const nominees = await sql`
				SELECT vo.id, vo.option_text, vo.category_id, vo.nominee_code,
					vc.name as category_name, vc.vote_price,
					e.id as event_id, e.title as event_title, e.type as event_type,
					e.organization_id, e.status as event_status,
					e.start_date, e.end_date
				FROM voting_options vo
				JOIN events e ON vo.event_id = e.id
				LEFT JOIN voting_categories vc ON vo.category_id = vc.id
				WHERE UPPER(vo.nominee_code) = UPPER(${rawCode})
					AND vo.status = 'approved'
					AND e.has_ussd = true
					AND e.status IN ('published', 'ongoing')
					AND (e.end_date IS NULL OR e.end_date >= NOW())
				LIMIT 1
			`;

			if (nominees && nominees.length > 0) {
				const nom = nominees[0];
				console.log("[USSD Core] Nominee found by code:", {
					nomineeId: nom.id,
					nomineeName: nom.option_text,
					nomineeCode: nom.nominee_code,
					eventTitle: nom.event_title,
				});

				// Direct nominee voting flow
				const votePrice = Number(nom.vote_price) || 0.5;
				const categoryTitle = nom.category_name ? `(${nom.category_name})\n` : "";
				const nomEvent = {
					id: nom.event_id,
					title: nom.event_title,
					type: nom.event_type,
					organization_id: nom.organization_id,
					status: nom.event_status,
					start_date: nom.start_date,
					end_date: nom.end_date,
				};

				const now2 = new Date();
				if (nom.start_date && new Date(nom.start_date) > now2) {
					const startStr = new Date(nom.start_date).toLocaleDateString("en-GH", { month: "short", day: "numeric", year: "numeric" });
					return textResponse(`END Voting has not started yet. Voting opens on ${startStr}.`);
				}
				if (nom.event_status === "ended" || nom.event_status === "cancelled" || (nom.end_date && new Date(nom.end_date) < now2)) {
					return textResponse("END Voting for this event has ended.");
				}

				const quantityStr = tokens.shift();
				if (!quantityStr) {
					return textResponse(`CON ${nom.option_text}\n${categoryTitle}Rate: GHS ${votePrice.toFixed(2)}/vote\nEnter number of votes:\n0. Back`);
				}

				const quantity = Number.parseInt(quantityStr, 10);
				if (Number.isNaN(quantity) || quantity <= 0) {
					return textResponse("END Invalid vote quantity. Try again.");
				}

				const confirmToken = tokens.shift();
				if (!confirmToken) {
					const baseAmount = votePrice * quantity;
					return textResponse(`CON Confirm Vote\nNominee: ${nom.option_text}\nVotes: ${quantity} @ GHS ${votePrice.toFixed(2)}\nTotal to Pay: GHS ${baseAmount.toFixed(2)}\n1. Confirm & Pay\n0. Back`);
				}

				if (confirmToken !== "1") {
					return textResponse("CON Invalid choice.\n1. Confirm & Pay\n0. Back");
				}

				const otpStr = tokens.shift();
				return await processPayment(
					sql,
					nomEvent,
					nom.id,
					quantity,
					votePrice,
					phoneNumber,
					paystackSecret,
					otpStr,
					isSimulation,
					env,
				);
			}
		}

		// Fallback: try as event code
		event = await fetchEventByCode(sql, nomineeCodeInput);
		if (!event) {
			return textResponse("END Nominee not found. Check your code and try again.");
		}
	} else {
		const firstInput = tokens[0];
		// 1. Check if firstInput directly matches an active event's ussd_code (direct dial e.g. *928*920*104#)
		event = await fetchEventByCode(sql, firstInput);

		if (event) {
			tokens.shift();
		} else {
			// 2. Otherwise treat as menu index from root listed events
			const selectedIdx = Number.parseInt(firstInput, 10);
			const maxEvents = Number.parseInt(
				env.MAX_LISTED_EVENTS || `${MAX_LISTED_EVENTS}`,
				10,
			);

			const listedEvents = await sql`
				SELECT id, title, has_ussd, ussd_code, type, organization_id, status, start_date, end_date, payment_gateway, payment_channel
				FROM events 
				WHERE has_ussd = true 
				  AND status IN ('published', 'ongoing')
				  AND (end_date IS NULL OR end_date >= NOW())
				ORDER BY created_at DESC 
				LIMIT ${maxEvents}
			`;

			if (listedEvents && selectedIdx >= 1 && selectedIdx <= listedEvents.length) {
				event = listedEvents[selectedIdx - 1];
				tokens.shift();
			}
		}
	}

	if (!event) {
		return textResponse("END Event not found. Check your code.");
	}

	const now = new Date();
	if (event.status === "draft") {
		return textResponse("END Event not available. Check your code.");
	}

	const endDate = event.end_date || event.endDate;
	if (
		event.status === "ended" ||
		event.status === "cancelled" ||
		(endDate && new Date(endDate) < now)
	) {
		return textResponse("END This event has ended.");
	}

	const details = await fetchEventDetails(sql, event.id);
	const eventType = event.type;

	if (eventType === "voting") {
		return await handleVotingFlow(
			sql,
			event,
			details,
			tokens,
			phoneNumber,
			paystackSecret,
			isSimulation,
			env,
		);
	}
	if (eventType === "ticketed") {
		return await handleTicketFlow(
			sql,
			event,
			details,
			tokens,
			phoneNumber,
			paystackSecret,
			isSimulation,
			env,
		);
	}
	if (eventType === "standard" || eventType === "hybrid") {
		const modeStr = tokens.shift();
		if (!modeStr) {
			return textResponse(`CON ${event.title}\n1. Voting\n2. Tickets\n0. Back`);
		}
		if (modeStr === "1") {
			return await handleVotingFlow(
				sql,
				event,
				details,
				tokens,
				phoneNumber,
				paystackSecret,
				isSimulation,
				env,
			);
		}
		if (modeStr === "2") {
			return await handleTicketFlow(
				sql,
				event,
				details,
				tokens,
				phoneNumber,
				paystackSecret,
				isSimulation,
				env,
			);
		}
		return textResponse("END Invalid selection.");
	}

	return textResponse("END Unsupported event type.");
}

// Arkesel Response Converter
async function toArkeselResponse(
	atResponse: Response,
	sessionID: string,
	userID: string,
	msisdn: string,
) {
	const raw = await atResponse.text();
	const continueSession = raw.startsWith("CON");
	const message = raw.replace(/^(CON|END)\s*/, "");

	return jsonResponse({
		sessionID,
		userID,
		msisdn,
		message,
		continueSession,
	});
}

function normalizeArkeselInput(userData: string, newSession: boolean, envRootCode?: string): string {
	if (!userData) return "";
	const trimmed = String(userData).trim();

	if (newSession) {
		const cleaned = trimmed.replace(/[#\uFF03]+$/, "");
		const baseCode = (envRootCode || "*928*920*").replace(/[#*]+$/, ""); // e.g. "*928*920"

		if (cleaned.startsWith(baseCode)) {
			const extra = cleaned.substring(baseCode.length);
			return extra.startsWith("*") ? extra.substring(1) : extra;
		}
		// Generic regex for *XXX*YYY*code or *XXX*code
		const match = cleaned.match(/^\*\d+(?:\*\d+)*\*([^*#]+(?:\*.*)?)$/);
		if (match && match[1]) {
			return match[1];
		}
		if (cleaned.startsWith("*")) {
			const parts = cleaned.split("*").filter(Boolean);
			if (parts.length > 0) return parts[parts.length - 1] || "";
		}
		return cleaned;
	}

	// On subsequent menu navigation turns: preserve "#" selection
	if (trimmed === "#" || trimmed === "\uFF03") {
		return "#";
	}

	return trimmed;
}

// Cloudflare Worker Fetch Entrypoint (Africa's Talking & Arkesel)
export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		if (request.method === "OPTIONS") {
			return new Response(null, {
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type",
				},
			});
		}

		let isArkeselRoute = false;
		let bodyData: any = {};
		let rawText = "";
		let phoneNumber = "";
		let sessionId = "";
		let userId = "";
		let isNewSession = false;

		try {
			const url = new URL(request.url);
			const contentType = request.headers.get("content-type") || "";
			isArkeselRoute =
				url.pathname.includes("/arkesel") ||
				url.searchParams.get("provider") === "arkesel";

			if (contentType.includes("application/json")) {
				bodyData = (await request.json()) as any;
				phoneNumber =
					bodyData.phoneNumber || bodyData.msisdn || "";
				rawText =
					bodyData.text !== undefined
						? bodyData.text
						: bodyData.userData || bodyData.message || "";
				sessionId = bodyData.sessionId || bodyData.sessionID || "";
				userId = bodyData.userId || bodyData.userID || "";
				const typeStr = (bodyData.type || "").toLowerCase();
				isNewSession =
					bodyData.newSession === true || typeStr === "initiation";
			} else if (
				contentType.includes("application/x-www-form-urlencoded") ||
				contentType.includes("multipart/form-data")
			) {
				const formData = await request.formData();
				bodyData = Object.fromEntries(formData.entries());
				phoneNumber = (formData.get("phoneNumber") ||
					formData.get("msisdn") ||
					"") as string;
				rawText = (formData.get("text") ||
					formData.get("userData") ||
					formData.get("message") ||
					"") as string;
				sessionId = (formData.get("sessionId") ||
					formData.get("sessionID") ||
					"") as string;
				userId = (formData.get("userId") ||
					formData.get("userID") ||
					"") as string;
				const typeStr = (
					(formData.get("type") as string) || ""
				).toLowerCase();
				isNewSession =
					formData.get("newSession") === "true" || typeStr === "initiation";
			} else {
				phoneNumber =
					url.searchParams.get("phoneNumber") ||
					url.searchParams.get("msisdn") ||
					"";
				rawText =
					url.searchParams.get("text") ||
					url.searchParams.get("userData") ||
					"";
				sessionId = url.searchParams.get("sessionId") || "";
			}

			// Arkesel USSD flow
			if (isArkeselRoute || bodyData.sessionID || bodyData.msisdn) {
				const rootCode = env.NEXT_PUBLIC_USSD_ROOT_CODE;
				const currentInput = normalizeArkeselInput(rawText, isNewSession, rootCode);
				let accumulatedPath = currentInput;

				if (env.DATABASE_URL && sessionId) {
					const sql = neon(env.DATABASE_URL);
					if (!isNewSession) {
						const states = await sql`
							SELECT accumulated_path FROM ussd_states WHERE session_id = ${sessionId} LIMIT 1
						`;
						if (states.length > 0 && states[0].accumulated_path) {
							accumulatedPath = `${states[0].accumulated_path}*${currentInput}`;
						}
					}

					await sql`
						INSERT INTO ussd_states (session_id, accumulated_path, updated_at)
						VALUES (${sessionId}, ${accumulatedPath}, NOW())
						ON CONFLICT (session_id) 
						DO UPDATE SET accumulated_path = ${accumulatedPath}, updated_at = NOW()
					`;
				}

				const isSimulation =
					Boolean(bodyData.isSimulation) ||
					Boolean(bodyData.isSimulated) ||
					sessionId.startsWith("SIM_") ||
					userId === "sim_tester" ||
					url.searchParams.get("simulation") === "true";

				const atResponse = await handleUssdCore(
					phoneNumber,
					accumulatedPath,
					env,
					isSimulation,
					isNewSession,
				);
				return await toArkeselResponse(
					atResponse,
					sessionId,
					userId,
					phoneNumber,
				);
			}

			// Africa's Talking USSD flow (Default)
			const isAtSimulation =
				sessionId.startsWith("SIM_") ||
				url.searchParams.get("simulation") === "true";
			return await handleUssdCore(phoneNumber, rawText, env, isAtSimulation);
		} catch (error: any) {
			console.error("USSD Worker Error:", error);
			if (isArkeselRoute || bodyData.sessionID || bodyData.msisdn) {
				return jsonResponse({
					sessionID: sessionId || "",
					userID: userId || "",
					msisdn: phoneNumber || "",
					message: "Something went wrong. Try again later.",
					continueSession: false,
				});
			}
			return textResponse("END Something went wrong. Try again later.");
		}
	},
};
