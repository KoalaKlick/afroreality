// packages/pricing/src/index.ts
// ─── Single Source of Truth for Platform Pricing, Fees & Commissions ───────────

export const DEFAULT_CURRENCY = "GHS" as const;
export const SUBUNIT_MULTIPLIER = 100;

export function toPesewas(amount: number): number {
	return Math.round(Number(amount || 0) * SUBUNIT_MULTIPLIER);
}

export function fromPesewas(pesewas: number): number {
	return Number(pesewas || 0) / SUBUNIT_MULTIPLIER;
}

export function round2(n: number): number {
	return Math.round(Number(n || 0) * 100) / 100;
}

/**
 * Platform service fees charged on organizer transactions
 */
export const PLATFORM_FEES = {
	vote: {
		percentage: 0.065, // 6.5%
		fixed: 0,
		label: "6.5%",
		description: "Platform service fee on voting transactions",
	},
	nomination: {
		percentage: 0.035, // 3.5%
		fixed: 0.5,
		label: "3.5% + GHS 0.50",
		description: "Platform service fee on nomination transactions",
	},
	ticket: {
		percentage: 0.05, // 5%
		fixed: 0.5,
		label: "5% + GHS 0.50",
		description: "Platform service fee on ticket sales",
	},
} as const;

export type TransactionType = keyof typeof PLATFORM_FEES;
export type PricingTransactionType = TransactionType;

/** Paystack standard gateway rates (Ghana) */
export const PAYSTACK_FEE_RATE = 0.0195; // 1.95%
export const PAYSTACK_FEE_CAP = 100; // GHS 100 max fee cap

export const COMMUNICATION_CREDITS = {
	perMessage: {
		sms: 1.0,
		whatsapp: 1.5,
		email: 0,
		inApp: 0,
	},
	bundles: [
		{
			id: "starter" as const,
			name: "Starter",
			credits: 100,
			price: 10,
			pricePerCredit: 0.1,
			popular: false,
		},
		{
			id: "standard" as const,
			name: "Standard",
			credits: 500,
			price: 45,
			pricePerCredit: 0.09,
			popular: true,
		},
		{
			id: "premium" as const,
			name: "Premium",
			credits: 1000,
			price: 80,
			pricePerCredit: 0.08,
			popular: false,
		},
		{
			id: "enterprise" as const,
			name: "Enterprise",
			credits: 5000,
			price: 350,
			pricePerCredit: 0.07,
			popular: false,
		},
	],
} as const;

export type CommunicationChannel =
	keyof typeof COMMUNICATION_CREDITS.perMessage;

export interface FeeBreakdown {
	amount: number;
	type: TransactionType;
	feePercentage: number;
	percentageFee: number;
	fixedFee: number;
	totalPlatformFee: number;
	organizerReceives: number;
	currency: string;
	paystackPercentageCharge: number;
	paystackFlatChargePesewas: number;
}

/**
 * Calculate the platform fee breakdown for a transaction.
 */
export function calculateFee(
	amount: number,
	type: TransactionType,
): FeeBreakdown {
	const config = PLATFORM_FEES[type] || PLATFORM_FEES.vote;
	const percentageFee = amount * config.percentage;
	const totalPlatformFee = percentageFee + config.fixed;

	return {
		amount,
		type,
		feePercentage: config.percentage,
		percentageFee: round2(percentageFee),
		fixedFee: config.fixed,
		totalPlatformFee: round2(totalPlatformFee),
		organizerReceives: round2(amount - totalPlatformFee),
		currency: DEFAULT_CURRENCY,
		paystackPercentageCharge: config.percentage * 100,
		paystackFlatChargePesewas: toPesewas(config.fixed),
	};
}

/**
 * Calculate the full transaction charge including both platform commission and Paystack fee surcharge.
 *
 * Surcharge Formula:
 * - Customer pays: `totalToCharge` = `baseAmount + paystackFee`
 * - Platform gross take on Paystack: `splitChargePesewas` = `toPesewas(platformFee + paystackFee)`
 * - Subaccount receives: `totalToCharge - splitCharge` = `baseAmount - platformFee` = `organizerReceives`
 * - Paystack fee is deducted from platform's gross take (with bearer = "account"),
 *   leaving platform's net take = `platformFee`!
 */
export function computeChargeAmount(
	baseAmount: number,
	type: TransactionType = "vote",
): {
	totalToCharge: number;
	paystackFee: number;
	baseAmount: number;
	platformFee: number;
	organizerReceives: number;
	splitChargePesewas: number;
} {
	const amount = Number(baseAmount) || 0;
	if (amount <= 0) {
		return {
			totalToCharge: 0,
			paystackFee: 0,
			baseAmount: 0,
			platformFee: 0,
			organizerReceives: 0,
			splitChargePesewas: 0,
		};
	}

	const feeData = calculateFee(amount, type);
	const platformFee = feeData.totalPlatformFee;
	const organizerReceives = feeData.organizerReceives;

	// Paystack 1.95% fee surcharge calculation
	const uncappedCharge = amount / (1 - PAYSTACK_FEE_RATE);
	const uncappedFee = round2(uncappedCharge * PAYSTACK_FEE_RATE);

	let totalToCharge = round2(uncappedCharge);
	let paystackFee = uncappedFee;

	if (uncappedFee > PAYSTACK_FEE_CAP) {
		totalToCharge = round2(amount + PAYSTACK_FEE_CAP);
		paystackFee = PAYSTACK_FEE_CAP;
	}

	const splitChargePesewas = toPesewas(platformFee + paystackFee);

	return {
		totalToCharge,
		paystackFee,
		baseAmount: round2(amount),
		platformFee,
		organizerReceives,
		splitChargePesewas,
	};
}

export const CASHOUT_CONFIG = {
	settlementDays: 1,
	settlementLabel: "Next business day",
	minWithdrawalAmount: 10,
	autoSettlement: true,
};

export interface PricingDefaults {
	vote: number;
	nomination: number;
	ticket: number;
	paidTicket?: number;
}

export const MIN_PRICING: PricingDefaults = {
	vote: 0.5,
	nomination: 0.0,
	ticket: 1,
	paidTicket: 1.0,
};

export const DEFAULT_PRICING: PricingDefaults = {
	vote: 0.5,
	nomination: 2.0,
	ticket: 1,
};

export const MIN_VOTE_PRICE: number = MIN_PRICING.vote;
export const DEFAULT_VOTE_PRICE: number = DEFAULT_PRICING.vote;

export const MIN_NOMINATION_PRICE: number = MIN_PRICING.nomination;
export const DEFAULT_NOMINATION_PRICE: number = DEFAULT_PRICING.nomination;

export const MIN_TICKET_PRICE: number = MIN_PRICING.ticket;
export const MIN_PAID_TICKET_PRICE: number = MIN_PRICING.paidTicket ?? 1.0;
export const DEFAULT_TICKET_PRICE: number = DEFAULT_PRICING.ticket;
