/**
 * Pricing and Paystack Fee Calculation Utilities
 * Paystack Ghana standard fee: 1.95% capped at GHS 100
 */

export const PAYSTACK_FEE_RATE = 0.0195; // 1.95%
export const PAYSTACK_FEE_CAP = 100; // GHS 100 max fee cap

export function toPesewas(ghs: number): number {
	return Math.round(Number(ghs || 0) * 100);
}

export function round2(n: number): number {
	return Math.round(Number(n || 0) * 100) / 100;
}

/**
 * Calculate the exact amount to charge the customer so that after Paystack deducts
 * its 1.95% fee (capped at GHS 100), the platform/organizer receives *exactly* baseAmount.
 *
 * Paystack fee on charged amount X:
 *   paystackFee = min(X * 0.0195, 100)
 *
 * Equation: X - paystackFee = baseAmount
 *
 * Case 1 — Uncapped (X * 0.0195 <= 100 => X <= ~5128.21):
 *   X = baseAmount / (1 - 0.0195)
 *
 * Case 2 — Capped (baseAmount > ~5028.21):
 *   X = baseAmount + 100
 */
export function computeChargeAmount(baseAmount: number): {
	totalToCharge: number;
	paystackFee: number;
	baseAmount: number;
} {
	const amount = Number(baseAmount) || 0;
	if (amount <= 0) {
		return { totalToCharge: 0, paystackFee: 0, baseAmount: 0 };
	}

	const uncappedCharge = amount / (1 - PAYSTACK_FEE_RATE);
	const uncappedFee = round2(uncappedCharge * PAYSTACK_FEE_RATE);

	if (uncappedFee <= PAYSTACK_FEE_CAP) {
		return {
			totalToCharge: round2(uncappedCharge),
			paystackFee: uncappedFee,
			baseAmount: round2(amount),
		};
	}

	return {
		totalToCharge: round2(amount + PAYSTACK_FEE_CAP),
		paystackFee: PAYSTACK_FEE_CAP,
		baseAmount: round2(amount),
	};
}
