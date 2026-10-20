import { prisma } from "@repo/db";

/**
 * Payment gateway routing configuration (super-admin managed).
 *
 * The actual API credentials (PAYSTACK_SECRET_KEY, JUNIPAY_PRIVATE_KEY, etc.)
 * remain environment secrets. This module only resolves WHICH gateway an event
 * uses and reads the per-gateway defaults/fees stored in `platform_settings`.
 *
 * Resolution order for an event + request channel:
 *   1. Event `paymentGateway` override (when the event's `paymentChannel` is
 *      unset or matches the request channel).
 *   2. Default gateway from `payment_routing_default`.
 *   3. Fall back to Paystack if the resolved gateway has no credentials.
 */

export type GatewayName = "paystack" | "junipay" | "hubtel";
export type ChannelName = "ussd" | "web";

export const DEFAULT_GATEWAY: GatewayName = "paystack";
export const DEFAULT_CHANNEL: ChannelName = "web";

export const GATEWAY_SETTING_KEYS: Record<GatewayName, string> = {
	paystack: "payment_gateway_paystack",
	junipay: "payment_gateway_junipay",
	hubtel: "payment_gateway_hubtel",
};

export const GATEWAY_FEE_DEFAULTS: Record<GatewayName, { feeRate: number; feeCap: number }> = {
	paystack: { feeRate: 0.0195, feeCap: 100 },
	junipay: { feeRate: 0, feeCap: 0 },
	hubtel: { feeRate: 0, feeCap: 0 },
};

export function isGatewayName(value: unknown): value is GatewayName {
	return value === "paystack" || value === "junipay" || value === "hubtel";
}

export function isChannelName(value: unknown): value is ChannelName {
	return value === "ussd" || value === "web";
}

export interface PaymentRoutingDefaults {
	gateway: GatewayName;
	channel: ChannelName;
}

export interface GatewayFeeConfig {
	feeRate: number;
	feeCap: number;
}

/** Whether the selected gateway has the credentials required to charge. */
export function isGatewayConfigured(gateway: GatewayName): boolean {
	if (gateway === "paystack") {
		return Boolean((process.env.PAYSTACK_SECRET_KEY || "").trim());
	}
	if (gateway === "junipay") {
		return Boolean(
			(process.env.JUNIPAY_CLIENT_ID || "").trim() &&
				(process.env.JUNIPAY_PRIVATE_KEY || "").trim(),
		);
	}
	if (gateway === "hubtel") {
		return Boolean(
			(process.env.HUBTEL_CLIENT_ID || "").trim() &&
				(process.env.HUBTEL_CLIENT_SECRET || "").trim() &&
				(process.env.HUBTEL_POS_SALES_ID || "").trim(),
		);
	}
	return false;
}

/** Read the default gateway + channel from platform settings. */
export async function getPaymentRoutingDefaults(): Promise<PaymentRoutingDefaults> {
	try {
		const row = await prisma.platformSetting.findUnique({
			where: { key: "payment_routing_default" },
		});
		const value = (row?.value ?? {}) as any;
		return {
			gateway: isGatewayName(value?.gateway) ? value.gateway : DEFAULT_GATEWAY,
			channel: isChannelName(value?.channel) ? value.channel : DEFAULT_CHANNEL,
		};
	} catch (err) {
		console.warn("[PAYMENT-GATEWAY] Could not read routing defaults:", err);
		return { gateway: DEFAULT_GATEWAY, channel: DEFAULT_CHANNEL };
	}
}

/** Read a gateway's fee rate + cap from platform settings. */
export async function getGatewayFeeConfig(gateway: GatewayName): Promise<GatewayFeeConfig> {
	const fallback = GATEWAY_FEE_DEFAULTS[gateway] ?? GATEWAY_FEE_DEFAULTS.paystack;
	try {
		const row = await prisma.platformSetting.findUnique({
			where: { key: GATEWAY_SETTING_KEYS[gateway] },
		});
		const value = (row?.value ?? {}) as any;
		const feeRate =
			typeof value.feeRate === "number" ? value.feeRate : fallback.feeRate;
		const feeCap = typeof value.feeCap === "number" ? value.feeCap : fallback.feeCap;
		return {
			feeRate: feeRate > 1 ? feeRate / 100 : feeRate,
			feeCap,
		};
	} catch (err) {
		console.warn(`[PAYMENT-GATEWAY] Could not read ${gateway} fee config:`, err);
		return fallback;
	}
}

/**
 * Resolve the gateway to charge for an event on the given request channel.
 *
 * `event.paymentChannel` scopes an event's `paymentGateway` override to a single
 * surface: when set and different from `contextChannel`, the override is ignored
 * and the default gateway is used.
 */
export async function resolveEventGateway(
	event:
		| { paymentGateway?: string | null; paymentChannel?: string | null }
		| null
		| undefined,
	contextChannel: ChannelName,
): Promise<GatewayName> {
	const defaults = await getPaymentRoutingDefaults();
	let gateway: GatewayName = defaults.gateway;

	const eventGateway = event?.paymentGateway ?? null;
	const eventChannel = event?.paymentChannel ?? null;

	if (isGatewayName(eventGateway)) {
		if (!isChannelName(eventChannel) || eventChannel === contextChannel) {
			gateway = eventGateway;
		}
	}

	// Never route to a gateway whose credentials are missing.
	if (!isGatewayConfigured(gateway)) {
		gateway = "paystack";
	}

	return gateway;
}
