// apps/web/src/lib/server-functions/fee-service.ts
import { prisma } from "@repo/db";
import {
	toPesewas,
	round2,
	DEFAULT_CURRENCY,
	PLATFORM_FEES,
	PAYSTACK_FEE_RATE,
	PAYSTACK_FEE_CAP,
	type TransactionType,
} from "@repo/pricing";

export interface DynamicFeeConfig {
	feeType: TransactionType;
	percentage: number; // e.g. 0.065 for 6.5%
	fixedAmount: number; // e.g. 0.50
	minFee?: number;
	maxFee?: number;
	currency: string;
	paystackFeeRate: number; // e.g. 0.0195
	paystackFeeCap: number; // e.g. 100
	organizationId?: string | null;
	isCustomOverride?: boolean;
}

export interface DynamicChargeBreakdown {
	totalToCharge: number;
	paystackFee: number;
	baseAmount: number;
	platformFee: number;
	organizerReceives: number;
	splitChargePesewas: number;
	percentageFee: number;
	fixedFee: number;
	feePercentage: number;
	currency: string;
	isCustomOverride?: boolean;
}

/**
 * Retrieves the fee configuration dynamically from the database.
 * 1. Checks for active organization-specific override if organizationId is provided.
 * 2. Falls back to active platform-wide default (organizationId IS NULL).
 * 3. If no platform default exists in DB, registers the system baseline into DB.
 */
export async function getDynamicFeeConfig(
	type: TransactionType = "vote",
	organizationId?: string,
): Promise<DynamicFeeConfig> {
	let feePercentage: number = PLATFORM_FEES[type]?.percentage ?? 0.065;
	let feeFixed: number = PLATFORM_FEES[type]?.fixed ?? 0;
	let minFee: number | undefined;
	let maxFee: number | undefined;
	let currency: string = DEFAULT_CURRENCY;
	let isCustomOverride = false;
	let matchedOrgId: string | null = null;

	try {
		let feeRow = null;

		// 1. Try organization-specific override first
		if (organizationId) {
			feeRow = await prisma.feeConfiguration.findFirst({
				where: {
					organizationId,
					feeType: type,
					isActive: true,
				},
				orderBy: { createdAt: "desc" },
			});
			if (feeRow) {
				isCustomOverride = true;
				matchedOrgId = organizationId;
			}
		}

		// 2. Fall back to global platform configuration
		if (!feeRow) {
			feeRow = await prisma.feeConfiguration.findFirst({
				where: {
					organizationId: null,
					feeType: type,
					isActive: true,
				},
				orderBy: { createdAt: "desc" },
			});
		}

		if (feeRow) {
			if (feeRow.percentage !== null && feeRow.percentage !== undefined) {
				const rawPct = Number(feeRow.percentage);
				// If stored as whole percentage (e.g. 6.5) convert to decimal (0.065)
				feePercentage = rawPct > 1 ? rawPct / 100 : rawPct;
			}
			if (feeRow.fixedAmount !== null && feeRow.fixedAmount !== undefined) {
				feeFixed = Number(feeRow.fixedAmount);
			}
			if (feeRow.minFee !== null && feeRow.minFee !== undefined) {
				minFee = Number(feeRow.minFee);
			}
			if (feeRow.maxFee !== null && feeRow.maxFee !== undefined) {
				maxFee = Number(feeRow.maxFee);
			}
			if (feeRow.currency) {
				currency = feeRow.currency as any;
			}
		} else if (!organizationId) {
			// Persist default to database so DB remains single source of truth
			await prisma.feeConfiguration
				.create({
					data: {
						name: `Default ${type.toUpperCase()} Fee`,
						feeType: type,
						percentage: feePercentage * 100, // store as 6.5, 5.0, 3.5
						fixedAmount: feeFixed,
						currency: "GHS",
						isActive: true,
						description: `Automatically initialized default fee for ${type}`,
					},
				})
				.catch(() => {
					// Ignore if already created concurrently
				});
		}
	} catch (err) {
		console.warn(`[FEE-SERVICE] Could not query FeeConfiguration for ${type} (org: ${organizationId}):`, err);
	}

	let paystackRate = PAYSTACK_FEE_RATE;
	let paystackCap = PAYSTACK_FEE_CAP;

	try {
		const gatewaySetting = await prisma.platformSetting.findUnique({
			where: { key: "payment_gateway_paystack" },
		});

		if (gatewaySetting && typeof gatewaySetting.value === "object" && gatewaySetting.value !== null) {
			const val = gatewaySetting.value as any;
			if (typeof val.feeRate === "number") {
				paystackRate = val.feeRate > 1 ? val.feeRate / 100 : val.feeRate;
			}
			if (typeof val.feeCap === "number") {
				paystackCap = val.feeCap;
			}
		} else {
			// Persist default setting to DB
			await prisma.platformSetting
				.upsert({
					where: { key: "payment_gateway_paystack" },
					create: {
						key: "payment_gateway_paystack",
						value: { feeRate: PAYSTACK_FEE_RATE, feeCap: PAYSTACK_FEE_CAP },
						description: "Paystack Ghana gateway fee rate and fee cap",
					},
					update: {},
				})
				.catch(() => {});
		}
	} catch (err) {
		console.warn("[FEE-SERVICE] Could not query PlatformSetting for Paystack gateway:", err);
	}

	return {
		feeType: type,
		percentage: feePercentage,
		fixedAmount: feeFixed,
		minFee,
		maxFee,
		currency,
		paystackFeeRate: paystackRate,
		paystackFeeCap: paystackCap,
		organizationId: matchedOrgId,
		isCustomOverride,
	};
}

/**
 * Calculates the exact dynamic fee breakdown and Paystack surcharge based on database settings.
 *
 * Surcharge Formula (Buyer absorbs fee):
 * - Buyer pays: `totalToCharge = round2(baseAmount + paystackFee)`
 * - Platform gross take: `splitChargePesewas = toPesewas(platformFee + paystackFee)`
 * - Organizer receives: `organizerReceives = round2(baseAmount - platformFee)`
 */
export async function computeDynamicChargeAmount(
	baseAmount: number,
	type: TransactionType = "vote",
	currency: string = DEFAULT_CURRENCY,
	organizationId?: string,
): Promise<DynamicChargeBreakdown> {
	const amount = Number(baseAmount) || 0;
	if (amount <= 0) {
		return {
			totalToCharge: 0,
			paystackFee: 0,
			baseAmount: 0,
			platformFee: 0,
			organizerReceives: 0,
			splitChargePesewas: 0,
			percentageFee: 0,
			fixedFee: 0,
			feePercentage: 0,
			currency,
			isCustomOverride: false,
		};
	}

	const config = await getDynamicFeeConfig(type, organizationId);

	// 1. Calculate platform fee
	const percentageFee = round2(amount * config.percentage);
	let platformFee = round2(percentageFee + config.fixedAmount);
	if (config.minFee !== undefined && platformFee < config.minFee) {
		platformFee = config.minFee;
	}
	if (config.maxFee !== undefined && platformFee > config.maxFee) {
		platformFee = config.maxFee;
	}

	const organizerReceives = round2(Math.max(0, amount - platformFee));

	// 2. Calculate Paystack fee surcharge (absorbed by buyer)
	const uncappedCharge = amount / (1 - config.paystackFeeRate);
	const uncappedFee = round2(uncappedCharge * config.paystackFeeRate);

	let totalToCharge = round2(uncappedCharge);
	let paystackFee = uncappedFee;

	if (uncappedFee > config.paystackFeeCap) {
		totalToCharge = round2(amount + config.paystackFeeCap);
		paystackFee = config.paystackFeeCap;
	}

	const splitChargePesewas = toPesewas(platformFee + paystackFee);

	return {
		totalToCharge,
		paystackFee,
		baseAmount: round2(amount),
		platformFee,
		organizerReceives,
		splitChargePesewas,
		percentageFee,
		fixedFee: config.fixedAmount,
		feePercentage: config.percentage,
		currency: config.currency,
	};
}
