/**
 * Extract the payer's real name from a payment gateway response.
 *
 * For Ghana mobile-money charges the customer does not type their name during
 * the USSD flow, so we recover it from the provider's response (the account
 * name registered on the MoMo wallet) instead of falling back to a placeholder.
 */

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
