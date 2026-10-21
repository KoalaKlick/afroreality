/**
 * Extract the payer's real name from a payment gateway response.
 *
 * For Ghana mobile-money charges the customer does not type their name during
 * the USSD flow, so we recover it from the provider's response (the account
 * name registered on the MoMo wallet) instead of falling back to a placeholder.
 */

import {
	detectMomoNetworkFromPhone,
	formatToLocalMomoNumber,
} from "@/lib/utils/phone";

const PAYSTACK_SECRET = () => (process.env.PAYSTACK_SECRET_KEY || "").trim();

export function isPlaceholderName(name?: string | null): boolean {
	if (!name || typeof name !== "string") return true;
	const trimmed = name.trim();
	if (!trimmed) return true;
	return /^(\(?(USSD\s+)?Attendee\b|\(?Guest\b|\(?Buyer\b)/i.test(trimmed);
}

export function extractPayerName(paystackData: any): string | null {
	if (!paystackData || typeof paystackData !== "object") return null;

	// Mobile money: the account holder name registered on the MoMo wallet.
	const accountName =
		paystackData.authorization?.account_name ||
		paystackData.authorization?.accountName;
	if (typeof accountName === "string" && accountName.trim()) {
		return accountName.trim();
	}

	// Customer object (first + last name), when the provider created a named customer.
	const first =
		paystackData.customer?.first_name || paystackData.customer?.firstName;
	const last =
		paystackData.customer?.last_name || paystackData.customer?.lastName;
	if (typeof first === "string" && first.trim()) {
		const full = `${first.trim()}${last && String(last).trim() ? ` ${String(last).trim()}` : ""}`;
		if (full.trim()) return full.trim();
	}

	// Some providers expose a flat customer name.
	if (typeof paystackData.customer?.name === "string" && paystackData.customer.name.trim()) {
		return paystackData.customer.name.trim();
	}

	return null;
}

/**
 * Resolve the MoMo account-holder name using Paystack's `bank/resolve` API,
 * the same mechanism used when verifying a payout account. The network code is
 * derived from the phone prefix (MTN / VOD / ATL).
 *
 * Used as a fallback when a non-Paystack gateway (e.g. JuniPay, Hubtel) does
 * not return the account name in its own callback.
 */
export async function resolvePayerNameFromPaystack(phone: string): Promise<string | null> {
	const secret = PAYSTACK_SECRET();
	if (!secret || !phone) return null;

	const network = detectMomoNetworkFromPhone(phone);
	if (!network) return null;

	const accountNumber = formatToLocalMomoNumber(phone);
	if (!accountNumber) return null;

	try {
		const url = `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(
			accountNumber,
		)}&bank_code=${encodeURIComponent(network.code)}`;
		const response = await fetch(url, {
			method: "GET",
			headers: { Authorization: `Bearer ${secret}` },
			cache: "no-store",
		});
		const result = await response.json();
		if (result.status && typeof result.data?.account_name === "string") {
			const name = result.data.account_name.trim();
			if (name) return name;
		}
	} catch (err) {
		console.warn("[PAYER-NAME] Paystack account resolve failed:", err);
	}

	return null;
}

/**
 * Resolve the payer name: gateway response first, then a Paystack account
 * resolve (network derived from the phone prefix), then null.
 */
export async function resolvePayerName({
	paystackData,
	phone,
}: {
	paystackData?: any;
	phone?: string | null;
}): Promise<string | null> {
	const fromResponse = extractPayerName(paystackData);
	if (fromResponse) return fromResponse;

	if (phone) {
		const fromPaystack = await resolvePayerNameFromPaystack(phone);
		if (fromPaystack) return fromPaystack;
	}

	return null;
}
