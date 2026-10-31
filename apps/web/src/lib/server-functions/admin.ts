"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/db";
import { requirePlatformAdmin } from "@/lib/admin/admin-auth";
import { WITHDRAWAL_CONFIG } from "@repo/pricing";
import { generateAvailableUssdCode } from "@/lib/server-functions/ussd";
import { processResidualAutoPayouts } from "@/lib/server-functions/wallet";
import { normalizePhoneNumber } from "@/lib/services/whatsapp";
import { sendRefundSmsNotification } from "@/lib/services/sms";

/**
 * Super Admin action to lock or unlock an organization wallet.
 */
export async function adminLockWallet(data: {
	walletId: string;
	isLocked: boolean;
	lockReason?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
	try {
		const adminState = await requirePlatformAdmin();

		const wallet = await prisma.wallet.findUnique({
			where: { id: data.walletId },
			include: { organization: true },
		});

		if (!wallet) {
			return { success: false, error: "Wallet not found" };
		}

		await prisma.wallet.update({
			where: { id: data.walletId },
			data: {
				isLocked: data.isLocked,
				lockReason: data.isLocked
					? data.lockReason?.trim() || "Locked by Super Administrator"
					: null,
			},
		});

		// Record audit activity log if organization exists
		if (wallet.organizationId) {
			await prisma.activityLog
				.create({
					data: {
						organizationId: wallet.organizationId,
						userId: adminState.userId,
						action: data.isLocked
							? "wallet.locked_by_super_admin"
							: "wallet.unlocked_by_super_admin",
						entityType: "wallet",
						entityId: wallet.id,
						description: data.isLocked
							? `Wallet locked by super admin: ${data.lockReason || "Compliance/Risk hold"}`
							: "Wallet unlocked by super admin",
						metadata: {
							adminEmail: adminState.email,
							reason: data.lockReason || null,
						},
					},
				})
				.catch(() => {});
		}

		revalidatePath("/super");
		revalidatePath("/super/wallets");
		revalidatePath("/super/organizers");
		revalidatePath("/organization/wallet");
		revalidatePath("/dashboard");
		revalidatePath("/", "layout");

		return {
			success: true,
			message: data.isLocked
				? "Wallet has been locked successfully."
				: "Wallet has been unlocked.",
		};
	} catch (err: any) {
		console.error("[ADMIN_LOCK_WALLET_ERROR]", err);
		return {
			success: false,
			error: err?.message || "Failed to update wallet lock status",
		};
	}
}

/**
 * Super Admin action to toggle automatic payouts for an organization.
 */
export async function adminToggleAutoPayout(data: {
	organizationId: string;
	autoPayout: boolean;
}): Promise<{ success: boolean; message?: string; error?: string }> {
	try {
		const adminState = await requirePlatformAdmin();

		await prisma.organization.update({
			where: { id: data.organizationId },
			data: {
				autoPayout: data.autoPayout,
			},
		});

		await prisma.activityLog
			.create({
				data: {
					organizationId: data.organizationId,
					userId: adminState.userId,
					action: data.autoPayout
						? "autopayout.enabled_by_super_admin"
						: "autopayout.disabled_by_super_admin",
					entityType: "organization",
					entityId: data.organizationId,
					description: `Auto-payout ${data.autoPayout ? "enabled" : "disabled"} by super admin`,
					metadata: { adminEmail: adminState.email },
				},
			})
			.catch(() => {});

		revalidatePath("/super");
		revalidatePath("/super/organizers");
		revalidatePath("/super/wallets");

		return {
			success: true,
			message: `Auto-payout ${data.autoPayout ? "enabled" : "disabled"} for organizer.`,
		};
	} catch (err: any) {
		console.error("[ADMIN_TOGGLE_AUTOPAYOUT_ERROR]", err);
		return {
			success: false,
			error: err?.message || "Failed to update auto payout setting",
		};
	}
}

/**
 * Super Admin action to update an event's platform status (e.g. Delist/Cancel abusive event).
 * Strictly view-only over core content, but provides platform governance.
 */
export async function adminUpdateEventStatus(data: {
	eventId: string;
	status: string;
	reason?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
	try {
		const adminState = await requirePlatformAdmin();

		const event = await prisma.event.findUnique({
			where: { id: data.eventId },
			select: { id: true, organizationId: true, title: true, status: true },
		});

		if (!event) {
			return { success: false, error: "Event not found" };
		}

		await prisma.event.update({
			where: { id: data.eventId },
			data: {
				status: data.status as any,
			},
		});

		await prisma.activityLog
			.create({
				data: {
					organizationId: event.organizationId,
					userId: adminState.userId,
					action: `event.status_changed_by_super_admin`,
					entityType: "event",
					entityId: event.id,
					description: `Event status changed from ${event.status} to ${data.status} by super admin: ${data.reason || "Administrative governance"}`,
					metadata: {
						previousStatus: event.status,
						newStatus: data.status,
						reason: data.reason || null,
						adminEmail: adminState.email,
					},
				},
			})
			.catch(() => {});

		revalidatePath("/super");
		revalidatePath("/super/events");

		return {
			success: true,
			message: `Event "${event.title}" status updated to ${data.status}.`,
		};
	} catch (err: any) {
		console.error("[ADMIN_UPDATE_EVENT_STATUS_ERROR]", err);
		return {
			success: false,
			error: err?.message || "Failed to update event status",
		};
	}
}

const ADMIN_STORE_KEY = "platform_admin_emails";

/**
 * Retrieves the complete list of authorized Super Admin emails (root + env + database).
 */
export async function getPlatformAdminUsers(): Promise<{
	rootAdmin: string;
	admins: Array<{ email: string; isRoot: boolean; addedAt?: string }>;
}> {
	await requirePlatformAdmin();

	const rootAdmin = (process.env.SUPER_ADMIN_EMAIL || "kgyan19lf@gmail.com").toLowerCase().trim();
	const envAdmins = process.env.PLATFORM_ADMIN_EMAILS
		? process.env.PLATFORM_ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase())
		: [];

	let dbAdmins: string[] = [];
	try {
		const record = await prisma.verification.findFirst({
			where: { identifier: ADMIN_STORE_KEY },
		});
		if (record?.value) {
			dbAdmins = JSON.parse(record.value);
		}
	} catch {}

	const allEmails = Array.from(new Set([rootAdmin, ...envAdmins, ...dbAdmins].filter(Boolean)));

	return {
		rootAdmin,
		admins: allEmails.map((email) => ({
			email,
			isRoot: email === rootAdmin,
		})),
	};
}

/**
 * Root / Super Admin adds a new authorized platform admin user.
 */
export async function addPlatformAdminUser(data: { email: string }): Promise<{
	success: boolean;
	message?: string;
	error?: string;
}> {
	try {
		const adminState = await requirePlatformAdmin();
		const clean = data.email.trim().toLowerCase();

		if (!clean || !clean.includes("@")) {
			return { success: false, error: "Please provide a valid email address." };
		}

		let list: string[] = [];
		const record = await prisma.verification.findFirst({
			where: { identifier: ADMIN_STORE_KEY },
		});

		if (record?.value) {
			try {
				list = JSON.parse(record.value);
			} catch {}
		}

		if (list.includes(clean)) {
			return { success: false, error: `${clean} is already a platform admin.` };
		}

		list.push(clean);

		if (record) {
			await prisma.verification.update({
				where: { id: record.id },
				data: { value: JSON.stringify(list) },
			});
		} else {
			await prisma.verification.create({
				data: {
					id: `ver_${Date.now()}_admins`,
					identifier: ADMIN_STORE_KEY,
					value: JSON.stringify(list),
					expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 10),
				},
			});
		}

		revalidatePath("/super");
		revalidatePath("/super/admins");

		return {
			success: true,
			message: `Admin user ${clean} has been granted platform admin access.`,
		};
	} catch (err: any) {
		console.error("[ADD_ADMIN_USER_ERROR]", err);
		return { success: false, error: err?.message || "Failed to add admin user" };
	}
}

/**
 * Root / Super Admin removes an authorized platform admin user.
 */
export async function removePlatformAdminUser(data: { email: string }): Promise<{
	success: boolean;
	message?: string;
	error?: string;
}> {
	try {
		await requirePlatformAdmin();
		const clean = data.email.trim().toLowerCase();
		const rootAdmin = (process.env.SUPER_ADMIN_EMAIL || "kgyan19lf@gmail.com").toLowerCase().trim();

		if (clean === rootAdmin) {
			return { success: false, error: "Cannot remove the root super admin user." };
		}

		const record = await prisma.verification.findFirst({
			where: { identifier: ADMIN_STORE_KEY },
		});

		if (record?.value) {
			try {
				let list: string[] = JSON.parse(record.value);
				list = list.filter((e) => e.toLowerCase() !== clean);
				await prisma.verification.update({
					where: { id: record.id },
					data: { value: JSON.stringify(list) },
				});
			} catch {}
		}

		revalidatePath("/super");
		revalidatePath("/super/admins");

		return {
			success: true,
			message: `Platform admin access removed for ${clean}.`,
		};
	} catch (err: any) {
		console.error("[REMOVE_ADMIN_USER_ERROR]", err);
		return { success: false, error: err?.message || "Failed to remove admin user" };
	}
}

/**
 * Super Admin action to toggle USSD dialer access for an event on or off.
 */
export async function adminToggleEventUssd(data: {
	eventId: string;
	hasUssd: boolean;
	ussdCode?: string | null;
}): Promise<{ success: boolean; message?: string; error?: string }> {
	try {
		const adminState = await requirePlatformAdmin();
		const event = await prisma.event.findUnique({
			where: { id: data.eventId },
			select: { id: true, title: true, hasUssd: true, ussdCode: true, organizationId: true },
		});

		if (!event) {
			return { success: false, error: "Event not found" };
		}

		let assignedCode = event.ussdCode;
		if (data.hasUssd && !assignedCode) {
			assignedCode = await generateAvailableUssdCode();
		}

		await prisma.event.update({
			where: { id: data.eventId },
			data: {
				hasUssd: data.hasUssd,
				ussdCode: data.hasUssd ? assignedCode : event.ussdCode,
			},
		});

		await prisma.activityLog
			.create({
				data: {
					organizationId: event.organizationId,
					userId: adminState.userId,
					action: data.hasUssd
						? "event.ussd_enabled_by_super_admin"
						: "event.ussd_disabled_by_super_admin",
					entityType: "event",
					entityId: event.id,
					description: `USSD access ${data.hasUssd ? "enabled" : "disabled"} for "${event.title}" by super admin`,
					metadata: { adminEmail: adminState.email, ussdCode: assignedCode },
				},
			})
			.catch(() => {});

		revalidatePath("/super");
		revalidatePath("/super/events");

		return {
			success: true,
			message: `USSD service ${data.hasUssd ? "activated" : "deactivated"} for "${event.title}".`,
		};
	} catch (err: any) {
		console.error("[ADMIN_TOGGLE_EVENT_USSD_ERROR]", err);
		return { success: false, error: err?.message || "Failed to update USSD configuration" };
	}
}

export interface AdminFeeConfigItem {
	id: string;
	name: string;
	feeType: string;
	percentage: number | null;
	fixedAmount: number | null;
	minFee: number | null;
	maxFee: number | null;
	currency: string;
	isActive: boolean;
	description?: string | null;
	organizationId?: string | null;
	organization?: {
		id: string;
		name: string;
		slug: string;
		logoUrl?: string | null;
	} | null;
}

export interface EventDepositRules {
	enabled: boolean;
	amount: number;
	scope: "first_event_only" | "every_event";
	refundWindowDays: number;
}

const DEFAULT_DEPOSIT_RULES: EventDepositRules = {
	enabled: true,
	amount: 100,
	scope: "first_event_only",
	refundWindowDays: 2,
};

export interface AdminGatewayFeeConfig {
	feeRate: number;
	feeCap: number;
}

export interface AdminEventPaymentRouting {
	id: string;
	title: string;
	type: string;
	status: string;
	ussdCode: string | null;
	hasUssd: boolean;
	paymentGateway: string | null;
	paymentChannel: string | null;
	organization: {
		id: string;
		name: string;
		slug: string;
	} | null;
}

export interface AdminPlatformFeesData {
	globalFees: AdminFeeConfigItem[];
	orgOverrides: AdminFeeConfigItem[];
	paystackConfig: {
		feeRate: number;
		feeCap: number;
	};
	gatewayConfigs: {
		paystack: AdminGatewayFeeConfig;
		junipay: AdminGatewayFeeConfig;
		hubtel: AdminGatewayFeeConfig;
	};
	routingDefaults: {
		ussd: string;
		web: string;
	};
	eventRoutings: AdminEventPaymentRouting[];
	withdrawalRules: {
		minAmount: number;
		transferFee: number;
		freePerWeek: number;
	};
	depositRules: EventDepositRules;
	organizations: Array<{
		id: string;
		name: string;
		slug: string;
	}>;
}

/**
 * Super Admin: Get all platform fee configurations (global defaults + per-organization overrides + gateway settings).
 */
export async function getAdminPlatformFees(): Promise<AdminPlatformFeesData> {
	await requirePlatformAdmin();

	const [globalFees, orgOverrides, gatewaySetting, junipaySetting, hubtelSetting, routingSetting, withdrawalSetting, depositSetting, organizations, eventRoutings] = await Promise.all([
		prisma.feeConfiguration.findMany({
			where: { organizationId: null },
			orderBy: [{ feeType: "asc" }, { createdAt: "desc" }],
		}),
		prisma.feeConfiguration.findMany({
			where: { organizationId: { not: null } },
			include: {
				organization: {
					select: { id: true, name: true, slug: true, logoUrl: true },
				},
			},
			orderBy: [{ createdAt: "desc" }],
		}),
		prisma.platformSetting.findUnique({
			where: { key: "payment_gateway_paystack" },
		}),
		prisma.platformSetting.findUnique({
			where: { key: "payment_gateway_junipay" },
		}),
		prisma.platformSetting.findUnique({
			where: { key: "payment_gateway_hubtel" },
		}),
		prisma.platformSetting.findUnique({
			where: { key: "payment_routing_default" },
		}),
		prisma.platformSetting.findUnique({
			where: { key: "wallet_withdrawal_rules" },
		}),
		prisma.platformSetting.findUnique({
			where: { key: "event_deposit_rules" },
		}),
		prisma.organization.findMany({
			select: { id: true, name: true, slug: true },
			orderBy: { name: "asc" },
		}),
		prisma.event.findMany({
			select: {
				id: true,
				title: true,
				type: true,
				status: true,
				ussdCode: true,
				hasUssd: true,
				paymentGateway: true,
				paymentChannel: true,
				organization: {
					select: { id: true, name: true, slug: true },
				},
			},
			orderBy: [{ createdAt: "desc" }],
			take: 200,
		}),
	]);

	const paystackConfig = (gatewaySetting?.value as any) || {
		feeRate: 0.0195,
		feeCap: 100,
	};

	const normalizeGatewayFee = (raw: any, fallback: AdminGatewayFeeConfig): AdminGatewayFeeConfig => ({
		feeRate: typeof raw?.feeRate === "number" ? raw.feeRate : fallback.feeRate,
		feeCap: typeof raw?.feeCap === "number" ? raw.feeCap : fallback.feeCap,
	});

	const gatewayConfigs = {
		paystack: normalizeGatewayFee(gatewaySetting?.value, { feeRate: 0.0195, feeCap: 100 }),
		junipay: normalizeGatewayFee(junipaySetting?.value, { feeRate: 0, feeCap: 0 }),
		hubtel: normalizeGatewayFee(hubtelSetting?.value, { feeRate: 0, feeCap: 0 }),
	};

	const gatewayNames = ["paystack", "junipay", "hubtel"];
	const routingRaw = (routingSetting?.value as any) || {};
	const routingDefaults = {
		ussd: gatewayNames.includes(routingRaw.ussd) ? routingRaw.ussd : "paystack",
		web: gatewayNames.includes(routingRaw.web) ? routingRaw.web : "paystack",
	};

	const withdrawalRulesRaw = (withdrawalSetting?.value as any) || {};
	const withdrawalRules = {
		minAmount: typeof withdrawalRulesRaw.minAmount === "number" ? withdrawalRulesRaw.minAmount : WITHDRAWAL_CONFIG.minAmount,
		transferFee: typeof withdrawalRulesRaw.transferFee === "number" ? withdrawalRulesRaw.transferFee : WITHDRAWAL_CONFIG.transferFee,
		freePerWeek: typeof withdrawalRulesRaw.freePerWeek === "number" ? withdrawalRulesRaw.freePerWeek : WITHDRAWAL_CONFIG.freePerWeek,
		minEventAgeDays: typeof withdrawalRulesRaw.minEventAgeDays === "number" ? withdrawalRulesRaw.minEventAgeDays : WITHDRAWAL_CONFIG.minEventAgeDays,
		residualAutoPayoutDays: typeof withdrawalRulesRaw.residualAutoPayoutDays === "number" ? withdrawalRulesRaw.residualAutoPayoutDays : WITHDRAWAL_CONFIG.residualAutoPayoutDays,
	};

	const depositRulesRaw = (depositSetting?.value as any) || {};
	const depositRules: EventDepositRules = {
		enabled: typeof depositRulesRaw.enabled === "boolean" ? depositRulesRaw.enabled : DEFAULT_DEPOSIT_RULES.enabled,
		amount: typeof depositRulesRaw.amount === "number" && depositRulesRaw.amount > 0 ? depositRulesRaw.amount : DEFAULT_DEPOSIT_RULES.amount,
		scope: depositRulesRaw.scope === "every_event" ? "every_event" : DEFAULT_DEPOSIT_RULES.scope,
		refundWindowDays: typeof depositRulesRaw.refundWindowDays === "number" && depositRulesRaw.refundWindowDays > 0 ? depositRulesRaw.refundWindowDays : DEFAULT_DEPOSIT_RULES.refundWindowDays,
	};

	const serializeFeeItem = (item: any): AdminFeeConfigItem => ({
		id: item.id,
		name: item.name,
		feeType: item.feeType,
		percentage: item.percentage !== null ? Number(item.percentage) : null,
		fixedAmount: item.fixedAmount !== null ? Number(item.fixedAmount) : null,
		minFee: item.minFee !== null ? Number(item.minFee) : null,
		maxFee: item.maxFee !== null ? Number(item.maxFee) : null,
		currency: item.currency,
		isActive: item.isActive,
		description: item.description,
		organizationId: item.organizationId,
		organization: item.organization,
	});

	return {
		globalFees: globalFees.map(serializeFeeItem),
		orgOverrides: orgOverrides.map(serializeFeeItem),
		paystackConfig: {
			feeRate: typeof paystackConfig.feeRate === "number" ? paystackConfig.feeRate : 0.0195,
			feeCap: typeof paystackConfig.feeCap === "number" ? paystackConfig.feeCap : 100,
		},
		gatewayConfigs,
		routingDefaults,
		eventRoutings: eventRoutings.map((ev) => ({
			id: ev.id,
			title: ev.title,
			type: ev.type,
			status: ev.status,
			ussdCode: ev.ussdCode,
			hasUssd: ev.hasUssd,
			paymentGateway: ev.paymentGateway,
			paymentChannel: ev.paymentChannel,
			organization: ev.organization,
		})),
		withdrawalRules,
		depositRules,
		organizations,
	};
}

/**
 * Super Admin: Save or update a global platform fee configuration.
 */
export async function adminSaveGlobalFee(data: {
	feeType: string;
	name?: string;
	percentage: number;
	fixedAmount: number;
	minFee?: number | null;
	maxFee?: number | null;
	isActive?: boolean;
	description?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
	try {
		const adminState = await requirePlatformAdmin();

		const existing = await prisma.feeConfiguration.findFirst({
			where: {
				organizationId: null,
				feeType: data.feeType,
			},
		});

		if (existing) {
			await prisma.feeConfiguration.update({
				where: { id: existing.id },
				data: {
					name: data.name || existing.name,
					percentage: data.percentage,
					fixedAmount: data.fixedAmount,
					minFee: data.minFee ?? null,
					maxFee: data.maxFee ?? null,
					isActive: data.isActive ?? true,
					description: data.description ?? existing.description,
					updatedAt: new Date(),
				},
			});
		} else {
			await prisma.feeConfiguration.create({
				data: {
					name: data.name || `Global ${data.feeType.toUpperCase()} Fee`,
					feeType: data.feeType,
					percentage: data.percentage,
					fixedAmount: data.fixedAmount,
					minFee: data.minFee ?? null,
					maxFee: data.maxFee ?? null,
					isActive: data.isActive ?? true,
					currency: "GHS",
					description: data.description || `Global platform fee rule for ${data.feeType}`,
				},
			});
		}

		revalidatePath("/super");
		revalidatePath("/super/fees");

		return {
			success: true,
			message: `Global ${data.feeType} fee configuration saved successfully.`,
		};
	} catch (err: any) {
		console.error("[ADMIN_SAVE_GLOBAL_FEE_ERROR]", err);
		return { success: false, error: err?.message || "Failed to save global fee configuration" };
	}
}

/**
 * Super Admin: Set a custom fee override for a specific organization.
 */
export async function adminSetOrganizationFeeOverride(data: {
	organizationId: string;
	feeType: string;
	name?: string;
	percentage: number;
	fixedAmount: number;
	minFee?: number | null;
	maxFee?: number | null;
	isActive?: boolean;
	description?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
	try {
		const adminState = await requirePlatformAdmin();

		const org = await prisma.organization.findUnique({
			where: { id: data.organizationId },
			select: { id: true, name: true },
		});

		if (!org) {
			return { success: false, error: "Organization not found" };
		}

		const existing = await prisma.feeConfiguration.findFirst({
			where: {
				organizationId: data.organizationId,
				feeType: data.feeType,
			},
		});

		if (existing) {
			await prisma.feeConfiguration.update({
				where: { id: existing.id },
				data: {
					name: data.name || `${org.name} - ${data.feeType.toUpperCase()} Fee`,
					percentage: data.percentage,
					fixedAmount: data.fixedAmount,
					minFee: data.minFee ?? null,
					maxFee: data.maxFee ?? null,
					isActive: data.isActive ?? true,
					description: data.description ?? existing.description,
					updatedAt: new Date(),
				},
			});
		} else {
			await prisma.feeConfiguration.create({
				data: {
					organizationId: data.organizationId,
					name: data.name || `${org.name} - ${data.feeType.toUpperCase()} Fee`,
					feeType: data.feeType,
					percentage: data.percentage,
					fixedAmount: data.fixedAmount,
					minFee: data.minFee ?? null,
					maxFee: data.maxFee ?? null,
					isActive: data.isActive ?? true,
					currency: "GHS",
					description: data.description || `Custom fee override for ${org.name}`,
				},
			});
		}

		await prisma.activityLog
			.create({
				data: {
					organizationId: data.organizationId,
					userId: adminState.userId,
					action: "organization.fee_override_set",
					entityType: "fee_configuration",
					description: `Custom fee override set for ${data.feeType}: ${data.percentage}% + GHS ${data.fixedAmount}`,
					metadata: {
						adminEmail: adminState.email,
						feeType: data.feeType,
						percentage: data.percentage,
						fixedAmount: data.fixedAmount,
					},
				},
			})
			.catch(() => {});

		revalidatePath("/super");
		revalidatePath("/super/fees");
		revalidatePath("/super/organizers");

		return {
			success: true,
			message: `Custom fee override for ${org.name} (${data.feeType}) saved.`,
		};
	} catch (err: any) {
		console.error("[ADMIN_SET_ORG_FEE_ERROR]", err);
		return { success: false, error: err?.message || "Failed to set organization fee override" };
	}
}

/**
 * Super Admin: Delete an organization fee override (reverting them back to platform global default).
 */
export async function adminDeleteOrganizationFeeOverride(data: {
	id: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
	try {
		const adminState = await requirePlatformAdmin();

		const record = await prisma.feeConfiguration.findUnique({
			where: { id: data.id },
		});

		if (!record) {
			return { success: false, error: "Fee override record not found" };
		}

		await prisma.feeConfiguration.delete({
			where: { id: data.id },
		});

		if (record.organizationId) {
			await prisma.activityLog
				.create({
					data: {
						organizationId: record.organizationId,
						userId: adminState.userId,
						action: "organization.fee_override_removed",
						entityType: "fee_configuration",
						description: `Custom fee override for ${record.feeType} deleted; organization reverted to platform default`,
						metadata: { adminEmail: adminState.email, feeType: record.feeType },
					},
				})
				.catch(() => {});
		}

		revalidatePath("/super");
		revalidatePath("/super/fees");
		revalidatePath("/super/organizers");

		return {
			success: true,
			message: "Fee override removed. Organization reverted to global platform default.",
		};
	} catch (err: any) {
		console.error("[ADMIN_DELETE_ORG_FEE_ERROR]", err);
		return { success: false, error: err?.message || "Failed to delete organization fee override" };
	}
}

/**
 * Super Admin: Update payment gateway (Paystack) rate and cap settings.
 */
export async function adminUpdatePaystackGatewaySettings(data: {
	feeRate: number; // e.g. 0.0195 or 1.95
	feeCap: number; // e.g. 100
}): Promise<{ success: boolean; message?: string; error?: string }> {
	try {
		await requirePlatformAdmin();

		const normalizedRate = data.feeRate > 1 ? data.feeRate / 100 : data.feeRate;

		await prisma.platformSetting.upsert({
			where: { key: "payment_gateway_paystack" },
			create: {
				key: "payment_gateway_paystack",
				value: {
					feeRate: normalizedRate,
					feeCap: data.feeCap,
				},
				description: "Paystack Ghana gateway fee rate and surcharge cap",
			},
			update: {
				value: {
					feeRate: normalizedRate,
					feeCap: data.feeCap,
				},
				updatedAt: new Date(),
			},
		});

		revalidatePath("/super");
		revalidatePath("/super/fees");

		return {
			success: true,
			message: "Paystack gateway settings updated successfully.",
		};
	} catch (err: any) {
		console.error("[ADMIN_UPDATE_GATEWAY_SETTINGS_ERROR]", err);
		return { success: false, error: err?.message || "Failed to update gateway settings" };
	}
}

/**
 * Super Admin: Update any gateway's fee rate and cap settings.
 */
export async function adminUpdateGatewayFeeSettings(data: {
	gateway: "paystack" | "junipay" | "hubtel";
	feeRate: number; // e.g. 0.0195 or 1.95
	feeCap: number; // e.g. 100
}): Promise<{ success: boolean; message?: string; error?: string }> {
	try {
		await requirePlatformAdmin();

		const normalizedRate = data.feeRate > 1 ? data.feeRate / 100 : data.feeRate;
		const key = `payment_gateway_${data.gateway}`;
		const label = data.gateway.charAt(0).toUpperCase() + data.gateway.slice(1);

		await prisma.platformSetting.upsert({
			where: { key },
			create: {
				key,
				value: {
					feeRate: normalizedRate,
					feeCap: data.feeCap,
				},
				description: `${label} gateway fee rate and surcharge cap`,
			},
			update: {
				value: {
					feeRate: normalizedRate,
					feeCap: data.feeCap,
				},
				updatedAt: new Date(),
			},
		});

		revalidatePath("/super");
		revalidatePath("/super/fees");

		return {
			success: true,
			message: `${label} gateway settings updated successfully.`,
		};
	} catch (err: any) {
		console.error("[ADMIN_UPDATE_GATEWAY_FEE_ERROR]", err);
		return { success: false, error: err?.message || "Failed to update gateway settings" };
	}
}

/**
 * Super Admin: Update the default payment gateway per channel (USSD and Web).
 */
export async function adminUpdatePaymentRoutingDefaults(data: {
	ussd: "paystack" | "junipay" | "hubtel";
	web: "paystack" | "junipay" | "hubtel";
}): Promise<{ success: boolean; message?: string; error?: string }> {
	try {
		await requirePlatformAdmin();

		await prisma.platformSetting.upsert({
			where: { key: "payment_routing_default" },
			create: {
				key: "payment_routing_default",
				value: { ussd: data.ussd, web: data.web },
				description: "Default payment gateway for USSD and Web payments",
			},
			update: {
				value: { ussd: data.ussd, web: data.web },
				updatedAt: new Date(),
			},
		});

		revalidatePath("/super");
		revalidatePath("/super/fees");

		return { success: true, message: "Payment routing defaults updated successfully." };
	} catch (err: any) {
		console.error("[ADMIN_UPDATE_ROUTING_DEFAULTS_ERROR]", err);
		return { success: false, error: err?.message || "Failed to update routing defaults" };
	}
}

/**
 * Super Admin: Set a per-event payment gateway override, optionally scoped to a
 * single channel (USSD or Web). A NULL channel applies the override to both.
 */
export async function adminUpdateEventPaymentRouting(data: {
	eventId: string;
	gateway: "paystack" | "junipay" | "hubtel" | null;
	channel: "ussd" | "web" | null;
}): Promise<{ success: boolean; message?: string; error?: string }> {
	try {
		await requirePlatformAdmin();

		await prisma.event.update({
			where: { id: data.eventId },
			data: {
				paymentGateway: data.gateway,
				paymentChannel: data.channel,
			},
		});

		revalidatePath("/super");
		revalidatePath("/super/fees");

		return { success: true, message: "Event payment routing updated successfully." };
	} catch (err: any) {
		console.error("[ADMIN_UPDATE_EVENT_ROUTING_ERROR]", err);
		return { success: false, error: err?.message || "Failed to update event payment routing" };
	}
}

/**
 * Super Admin: Update wallet withdrawal rules (minimum amount, Paystack transfer fee, and free weekly allowance).
 */
export async function adminUpdateWithdrawalRules(data: {
	minAmount: number;
	transferFee: number;
	freePerWeek: number;
	minEventAgeDays?: number;
	residualAutoPayoutDays?: number;
}): Promise<{ success: boolean; message?: string; error?: string }> {
	try {
		await requirePlatformAdmin();

		const minAmount = Math.max(1, Number(data.minAmount || WITHDRAWAL_CONFIG.minAmount));
		const transferFee = Math.max(0, Number(data.transferFee ?? WITHDRAWAL_CONFIG.transferFee));
		const freePerWeek = Math.max(0, Math.floor(Number(data.freePerWeek ?? WITHDRAWAL_CONFIG.freePerWeek)));
		const minEventAgeDays = Math.max(0, Math.floor(Number(data.minEventAgeDays ?? WITHDRAWAL_CONFIG.minEventAgeDays)));
		const residualAutoPayoutDays = Math.max(1, Math.floor(Number(data.residualAutoPayoutDays ?? WITHDRAWAL_CONFIG.residualAutoPayoutDays)));

		await prisma.platformSetting.upsert({
			where: { key: "wallet_withdrawal_rules" },
			create: {
				key: "wallet_withdrawal_rules",
				value: { minAmount, transferFee, freePerWeek, minEventAgeDays, residualAutoPayoutDays },
				description: "Wallet payout minimum amount, transfer fee, cooling period, and residual post-event auto-payout policy",
			},
			update: {
				value: { minAmount, transferFee, freePerWeek, minEventAgeDays, residualAutoPayoutDays },
				updatedAt: new Date(),
			},
		});

		revalidatePath("/super");
		revalidatePath("/super/fees");
		revalidatePath("/organization/wallet");

		return {
			success: true,
			message: "Wallet withdrawal rules updated successfully.",
		};
	} catch (err: any) {
		console.error("[ADMIN_UPDATE_WITHDRAWAL_RULES_ERROR]", err);
		return { success: false, error: err?.message || "Failed to update withdrawal rules" };
	}
}

/**
 * Super Admin: Trigger manual residual auto-payout sweep for ended events.
 */
export async function adminTriggerResidualAutoPayouts(): Promise<{
	success: boolean;
	processedCount: number;
	payouts: Array<{ organizationId: string; amount: number; reference: string; orgName?: string }>;
	message: string;
}> {
	await requirePlatformAdmin();
	const res = await processResidualAutoPayouts();
	revalidatePath("/super");
	revalidatePath("/super/fees");
	revalidatePath("/super/wallets");
	return res;
}

/**
 * Super Admin: Approve a pending payout. Triggers the Paystack transfer.
 */
export async function adminApprovePayout(data: {
	payoutId: string;
}): Promise<{
	success: boolean;
	message?: string;
	error?: string;
	requiresOtp?: boolean;
	transferCode?: string;
}> {
	try {
		const adminState = await requirePlatformAdmin();

		const payout = await prisma.payout.findUnique({
			where: { id: data.payoutId },
			include: { wallet: true },
		});

		if (!payout) {
			return { success: false, error: "Payout not found." };
		}

		if (payout.status !== "pending" || !payout.requiresApproval) {
			return { success: false, error: `Payout is not pending approval (current status: ${payout.status}).` };
		}

		if (payout.wallet?.isLocked) {
			return { success: false, error: "Cannot approve payout: The organization wallet is currently locked." };
		}

		const grossAmount = Number(payout.amount);
		const feeAmount = Number(payout.feeAmount || 0);
		const netDisbursedAmount = Math.max(0, Math.round((grossAmount - feeAmount) * 100) / 100);

		// 1. Check Paystack merchant balance
		const { checkPaystackBalance, createPaystackTransferRecipient, initiatePaystackTransfer } = await import("./paystack");

		const balCheck = await checkPaystackBalance(payout.currency);
		if (balCheck.success && typeof balCheck.balance === "number") {
			if (netDisbursedAmount > balCheck.balance) {
				return {
					success: false,
					error: `Paystack merchant balance (${payout.currency} ${balCheck.balance.toFixed(2)}) is insufficient for this net payout of ${payout.currency} ${netDisbursedAmount.toFixed(2)}.`,
				};
			}
		}

		// 2. Create Transfer Recipient
		const recipientResult = await createPaystackTransferRecipient({
			name: payout.accountName || payout.recipientName,
			accountNumber: payout.accountNumber || "",
			bankCode: payout.bankCode || "",
			currency: payout.currency,
		});

		if (!recipientResult.success || !recipientResult.recipientCode) {
			return { success: false, error: recipientResult.message || "Failed to create transfer recipient on Paystack." };
		}

		// 3. Initiate Transfer (Net amount sent to recipient)
		const transferResult = await initiatePaystackTransfer({
			amount: netDisbursedAmount,
			recipientCode: recipientResult.recipientCode,
			reference: payout.reference,
			reason: payout.description || `Approved wallet withdrawal (Net: ${payout.currency} ${netDisbursedAmount.toFixed(2)})`,
		});

		if (!transferResult.success) {
			return { success: false, error: `Paystack transfer error: ${transferResult.message || "Failed to initiate transfer."}` };
		}

		let isImmediateSuccess = transferResult.status === "success";
		const requiresOtp = transferResult.status === "otp" || transferResult.raw?.status === "otp";
		let currentRaw = transferResult.raw;

		// If OTP is not requested by Paystack (OTP disabled on dashboard),
		// perform a quick verification check after a short wait (1.2s)
		// because Paystack often processes direct MoMo/bank payouts almost instantly.
		if (!requiresOtp && !isImmediateSuccess) {
			try {
				await new Promise((resolve) => setTimeout(resolve, 1200));
				const { verifyPaystackTransfer } = await import("./paystack");
				const verifyRes = await verifyPaystackTransfer(payout.reference);
				if (verifyRes.success && verifyRes.status === "success") {
					isImmediateSuccess = true;
					currentRaw = verifyRes.raw;
				}
			} catch (verifyErr) {
				console.warn("[ADMIN_APPROVE_PAYOUT_VERIFY_WARN]", verifyErr);
			}
		}

		const now = new Date();
		const providerData = {
			...(currentRaw ?? {}),
			requiresOtp,
		};

		// 4. Update payout record with Paystack data
		await prisma.payout.update({
			where: { id: payout.id },
			data: {
				status: isImmediateSuccess ? "completed" : "processing",
				approvedBy: adminState.userId,
				approvedAt: now,
				processedAt: now,
				completedAt: isImmediateSuccess ? now : undefined,
				providerReference: transferResult.transferCode,
				providerResponse: providerData,
			},
		});

		// 5. Update transaction record
		await prisma.transaction.updateMany({
			where: { reference: payout.reference, type: "debit" },
			data: {
				status: isImmediateSuccess ? "completed" : "processing",
				providerReference: transferResult.transferCode,
				providerResponse: providerData,
				completedAt: isImmediateSuccess ? now : undefined,
			},
		});

		// 6. If immediate success, fulfill the payout (decrement balance, release pending debits)
		if (isImmediateSuccess) {
			const { fulfillPayoutTransfer } = await import("./fulfillment");
			await fulfillPayoutTransfer({
				reference: payout.reference,
				status: "completed",
				paystackData: currentRaw,
			});
		}

		// 7. Audit log
		await prisma.activityLog.create({
			data: {
				organizationId: payout.wallet?.organizationId || "",
				userId: adminState.userId,
				action: "payout.approved_by_super_admin",
				entityType: "payout",
				entityId: payout.id,
				description: `Payout of ${payout.currency} ${grossAmount.toFixed(2)}${feeAmount > 0 ? ` (Net: ${payout.currency} ${netDisbursedAmount.toFixed(2)}, Fee: ${payout.currency} ${feeAmount.toFixed(2)})` : " (Free weekly payout)"} to ${payout.recipientName} approved by admin`,
				metadata: {
					adminEmail: adminState.email,
					reference: payout.reference,
					grossAmount,
					feeAmount,
					netDisbursedAmount,
					transferCode: transferResult.transferCode,
					status: isImmediateSuccess ? "success" : transferResult.status,
					requiresOtp,
				},
			},
		}).catch(() => {});

		revalidatePath("/super");
		revalidatePath("/super/wallets");
		revalidatePath("/organization/wallet");

		if (requiresOtp) {
			return {
				success: true,
				message: "Transfer initiated! Enter the OTP sent to your registered email/phone to complete.",
				requiresOtp: true,
				transferCode: transferResult.transferCode,
			};
		}

		return {
			success: true,
			message: isImmediateSuccess
				? "Payout approved and transfer completed successfully on Paystack! (No OTP required)"
				: "Payout approved! Transfer is currently being processed by Paystack (No OTP required).",
		};
	} catch (err: any) {
		console.error("[ADMIN_APPROVE_PAYOUT_ERROR]", err);
		return { success: false, error: err?.message || "Failed to approve payout" };
	}
}

/**
 * Super Admin: Finalize an approved payout by submitting the Paystack OTP.
 */
export async function adminFinalizePayoutOtp(data: {
	payoutId: string;
	transferCode: string;
	otp: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
	try {
		const adminState = await requirePlatformAdmin();

		const payout = await prisma.payout.findUnique({
			where: { id: data.payoutId },
			include: { wallet: true },
		});

		if (!payout) {
			return { success: false, error: "Payout not found." };
		}

		if (payout.status === "completed") {
			return { success: true, message: "Payout has already been completed." };
		}

		const { finalizePaystackTransfer } = await import("./paystack");

		const transferCode = data.transferCode || payout.providerReference;
		if (!transferCode) {
			return { success: false, error: "No Paystack transfer code associated with this payout." };
		}

		const finalizeRes = await finalizePaystackTransfer({
			transferCode,
			otp: data.otp,
		});

		if (!finalizeRes.success) {
			return { success: false, error: finalizeRes.message || "Failed to authorize transfer with OTP." };
		}

		// Fulfill the payout
		const { fulfillPayoutTransfer } = await import("./fulfillment");
		await fulfillPayoutTransfer({
			reference: payout.reference,
			status: "completed",
			paystackData: finalizeRes.raw,
		});

		// Audit log
		await prisma.activityLog.create({
			data: {
				organizationId: payout.wallet?.organizationId || "",
				userId: adminState.userId,
				action: "payout.otp_finalized_by_super_admin",
				entityType: "payout",
				entityId: payout.id,
				description: `Payout OTP finalized for ${payout.currency} ${Number(payout.amount).toFixed(2)} to ${payout.recipientName}`,
				metadata: {
					adminEmail: adminState.email,
					reference: payout.reference,
					transferCode,
				},
			},
		}).catch(() => {});

		revalidatePath("/super");
		revalidatePath("/super/wallets");
		revalidatePath("/organization/wallet");

		return { success: true, message: "Payout authorized and completed successfully!" };
	} catch (err: any) {
		console.error("[ADMIN_FINALIZE_OTP_ERROR]", err);
		return { success: false, error: err?.message || "Failed to finalize OTP" };
	}
}

/**
 * Super Admin: Reject a pending payout. Returns frozen funds to organizer's wallet.
 */
export async function adminRejectPayout(data: {
	payoutId: string;
	reason?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
	try {
		const adminState = await requirePlatformAdmin();

		const payout = await prisma.payout.findUnique({
			where: { id: data.payoutId },
			include: { wallet: true },
		});

		if (!payout) {
			return { success: false, error: "Payout not found." };
		}

		if (payout.status === "completed") {
			return { success: false, error: "Cannot reject a payout that has already been completed." };
		}

		// Use fulfillPayoutTransfer to handle the fund release atomically
		const { fulfillPayoutTransfer } = await import("./fulfillment");
		await fulfillPayoutTransfer({
			reference: payout.reference,
			status: "failed",
			paystackData: {
				rejectedByAdmin: true,
				rejectedByUserId: adminState.userId,
				rejectedByEmail: adminState.email,
				rejectedAt: new Date().toISOString(),
				reason: data.reason?.trim() || "Rejected by platform administrator.",
			},
		});

		// Audit log
		await prisma.activityLog.create({
			data: {
				organizationId: payout.wallet?.organizationId || "",
				userId: adminState.userId,
				action: "payout.rejected_by_super_admin",
				entityType: "payout",
				entityId: payout.id,
				description: `Payout of ${payout.currency} ${Number(payout.amount).toFixed(2)} to ${payout.recipientName} rejected: ${data.reason?.trim() || "No reason provided"}`,
				metadata: {
					adminEmail: adminState.email,
					reference: payout.reference,
					reason: data.reason?.trim() || null,
				},
			},
		}).catch(() => {});

		revalidatePath("/super");
		revalidatePath("/super/wallets");
		revalidatePath("/organization/wallet");

		return { success: true, message: "Payout rejected. Funds have been returned to the organizer's wallet." };
	} catch (err: any) {
		console.error("[ADMIN_REJECT_PAYOUT_ERROR]", err);
		return { success: false, error: err?.message || "Failed to reject payout" };
	}
}

/**
 * Super Admin: Sync a payout's status directly with Paystack API.
 */
export async function adminSyncPayoutStatus(data: {
	payoutId: string;
	reference: string;
}): Promise<{ success: boolean; message: string; status?: string }> {
	try {
		await requirePlatformAdmin();
		const { verifyPaystackTransfer } = await import("./paystack");
		const { fulfillPayoutTransfer } = await import("./fulfillment");

		const psRes = await verifyPaystackTransfer(data.reference);
		if (!psRes.success) {
			return { success: false, message: psRes.message || "Failed to verify with Paystack." };
		}

		const psStatus = psRes.status; // "success" | "failed" | "reversed" | "abandoned" | "pending" | "otp"
		if (psStatus === "success") {
			await fulfillPayoutTransfer({
				reference: data.reference,
				status: "completed",
				paystackData: psRes.raw,
			});
			revalidatePath("/super");
			revalidatePath("/super/wallets");
			revalidatePath("/organization/wallet");
			return { success: true, message: "Payout transfer confirmed successful on Paystack!", status: "completed" };
		} else if (psStatus === "failed" || psStatus === "abandoned" || psStatus === "reversed") {
			const mappedStatus = psStatus === "reversed" ? "reversed" : "failed";
			await fulfillPayoutTransfer({
				reference: data.reference,
				status: mappedStatus,
				paystackData: psRes.raw,
			});
			revalidatePath("/super");
			revalidatePath("/super/wallets");
			revalidatePath("/organization/wallet");
			return { success: true, message: `Payout transfer marked as ${mappedStatus} on Paystack. Funds refunded.`, status: mappedStatus };
		}

		return {
			success: true,
			message: psStatus === "otp"
				? "Transfer is awaiting OTP authorization on Paystack."
				: `Transfer is currently ${psStatus} on Paystack.`,
			status: psStatus,
		};
	} catch (err: any) {
		console.error("[ADMIN_SYNC_PAYOUT_ERROR]", err);
		return { success: false, message: err?.message || "Failed to sync payout status." };
	}
}

/**
 * Super Admin: Update event security deposit rules (enabled, amount, scope, refundWindowDays).
 */
export async function adminUpdateEventDepositRules(data: {
	enabled: boolean;
	amount: number;
	scope: "first_event_only" | "every_event";
	refundWindowDays: number;
}): Promise<{ success: boolean; message?: string; error?: string }> {
	try {
		await requirePlatformAdmin();

		const amount = Math.max(1, Number(data.amount || DEFAULT_DEPOSIT_RULES.amount));
		const refundWindowDays = Math.max(1, Math.floor(Number(data.refundWindowDays || DEFAULT_DEPOSIT_RULES.refundWindowDays)));
		const scope = data.scope === "every_event" ? "every_event" : "first_event_only";
		const enabled = Boolean(data.enabled);

		await prisma.platformSetting.upsert({
			where: { key: "event_deposit_rules" },
			create: {
				key: "event_deposit_rules",
				value: { enabled, amount, scope, refundWindowDays },
				description: "Refundable security deposit policy when organizers publish events",
			},
			update: {
				value: { enabled, amount, scope, refundWindowDays },
				updatedAt: new Date(),
			},
		});

		revalidatePath("/super");
		revalidatePath("/super/fees");
		revalidatePath("/super/deposits");

		return {
			success: true,
			message: "Event security deposit rules updated successfully.",
		};
	} catch (err: any) {
		console.error("[ADMIN_UPDATE_DEPOSIT_RULES_ERROR]", err);
		return { success: false, error: err?.message || "Failed to update deposit rules" };
	}
}

export interface AdminSecurityDepositItem {
	id: string;
	reference: string;
	providerReference?: string | null;
	amount: number;
	currency: string;
	status: "held" | "refunded";
	createdAt: string;
	verifiedAt?: string | null;
	refundedAt?: string | null;
	paystackRefundId?: string | null;
	refundedBy?: string | null;
	daysHeld: number;
	isDue: boolean;
	organizerEmail: string;
	event: {
		id: string;
		title: string;
		slug: string;
		status: string;
	} | null;
	organization: {
		id: string;
		name: string;
		slug: string;
		paystackAccountName?: string | null;
		paystackAccountNumber?: string | null;
		paystackBankCode?: string | null;
	} | null;
}

export interface AdminSecurityDepositsData {
	deposits: AdminSecurityDepositItem[];
	totalHeldAmount: number;
	totalHeldCount: number;
	dueRefundsCount: number;
	totalRefundedAmount: number;
	totalRefundedCount: number;
	depositRules: EventDepositRules;
}

/**
 * Super Admin: Retrieve all event security deposits (escrow records), calculate days held, and refund statuses.
 */
export async function getAdminSecurityDeposits(): Promise<AdminSecurityDepositsData> {
	await requirePlatformAdmin();

	const [depositSetting, allCompletedPayments] = await Promise.all([
		prisma.platformSetting.findUnique({
			where: { key: "event_deposit_rules" },
		}),
		prisma.payment.findMany({
			where: {
				status: "completed",
			},
			orderBy: { createdAt: "desc" },
		}),
	]);

	const depositRulesRaw = (depositSetting?.value as any) || {};
	const depositRules: EventDepositRules = {
		enabled: typeof depositRulesRaw.enabled === "boolean" ? depositRulesRaw.enabled : DEFAULT_DEPOSIT_RULES.enabled,
		amount: typeof depositRulesRaw.amount === "number" && depositRulesRaw.amount > 0 ? depositRulesRaw.amount : DEFAULT_DEPOSIT_RULES.amount,
		scope: depositRulesRaw.scope === "every_event" ? "every_event" : DEFAULT_DEPOSIT_RULES.scope,
		refundWindowDays: typeof depositRulesRaw.refundWindowDays === "number" && depositRulesRaw.refundWindowDays > 0 ? depositRulesRaw.refundWindowDays : DEFAULT_DEPOSIT_RULES.refundWindowDays,
	};

	// Filter down specifically to event deposits (matching metadata.isEventDeposit === true)
	const depositPayments = allCompletedPayments.filter((p) => {
		const meta = (p.metadata as any) || {};
		return meta.isEventDeposit === true;
	});

	// Collect unique event IDs and organization IDs to fetch in bulk
	const eventIds = [...new Set(depositPayments.map((p) => (p.metadata as any)?.eventId).filter(Boolean))];
	const orgIds = [...new Set(depositPayments.map((p) => (p.metadata as any)?.organizationId).filter(Boolean))];

	const [events, orgs] = await Promise.all([
		eventIds.length > 0
			? prisma.event.findMany({
					where: { id: { in: eventIds } },
					select: { id: true, title: true, slug: true, status: true },
			  })
			: [],
		orgIds.length > 0
			? prisma.organization.findMany({
					where: { id: { in: orgIds } },
					select: {
						id: true,
						name: true,
						slug: true,
						paystackAccountName: true,
						paystackAccountNumber: true,
						paystackBankCode: true,
					},
			  })
			: [],
	]);

	const eventMap = new Map(events.map((e) => [e.id, e]));
	const orgMap = new Map(orgs.map((o) => [o.id, o]));

	const now = new Date();
	let totalHeldAmount = 0;
	let totalHeldCount = 0;
	let dueRefundsCount = 0;
	let totalRefundedAmount = 0;
	let totalRefundedCount = 0;

	const deposits: AdminSecurityDepositItem[] = depositPayments.map((p) => {
		const meta = (p.metadata as any) || {};
		const amount = Number(p.amount);
		const isRefunded = meta.depositStatus === "refunded" || !!meta.refundedAt;
		const status: "held" | "refunded" = isRefunded ? "refunded" : "held";

		// Calculate days held
		const paymentDate = p.verifiedAt || p.createdAt;
		const diffMs = now.getTime() - new Date(paymentDate).getTime();
		const daysHeld = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
		const isDue = status === "held" && daysHeld >= depositRules.refundWindowDays;

		if (status === "held") {
			totalHeldAmount += amount;
			totalHeldCount++;
			if (isDue) dueRefundsCount++;
		} else {
			totalRefundedAmount += amount;
			totalRefundedCount++;
		}

		return {
			id: p.id,
			reference: p.reference,
			providerReference: p.providerReference,
			amount,
			currency: p.currency,
			status,
			createdAt: p.createdAt.toISOString(),
			verifiedAt: p.verifiedAt ? p.verifiedAt.toISOString() : null,
			refundedAt: meta.refundedAt || null,
			paystackRefundId: meta.paystackRefundId || null,
			refundedBy: meta.refundedBy || null,
			daysHeld,
			isDue,
			organizerEmail: p.email,
			event: meta.eventId ? eventMap.get(meta.eventId) || null : null,
			organization: meta.organizationId ? orgMap.get(meta.organizationId) || null : null,
		};
	});

	return {
		deposits,
		totalHeldAmount,
		totalHeldCount,
		dueRefundsCount,
		totalRefundedAmount,
		totalRefundedCount,
		depositRules,
	};
}

/**
 * Super Admin: Process a 1-click Paystack refund for a held event security deposit.
 */
export async function adminProcessSecurityDepositRefund(data: {
	paymentId: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
	try {
		const adminState = await requirePlatformAdmin();

		const payment = await prisma.payment.findUnique({
			where: { id: data.paymentId },
		});

		if (!payment) {
			return { success: false, error: "Payment record not found." };
		}

		if (payment.status !== "completed") {
			return { success: false, error: "Only completed payments can be refunded." };
		}

		const meta = (payment.metadata as any) || {};
		if (!meta.isEventDeposit) {
			return { success: false, error: "Payment is not marked as an event security deposit." };
		}

		if (meta.depositStatus === "refunded") {
			return { success: false, error: "This deposit has already been refunded." };
		}

		const { createPaystackRefund } = await import("./paystack");

		// Paystack accepts transaction reference or transaction ID
		const txRef = payment.providerReference || payment.reference;
		const refundRes = await createPaystackRefund({
			transactionReference: txRef,
			amount: Number(payment.amount),
			currency: payment.currency,
			merchantNote: `Fextiva security deposit refund for event: ${meta.eventTitle || meta.eventId || "Event"}`,
		});

		if (!refundRes.success) {
			return {
				success: false,
				error: refundRes.error || refundRes.message || "Failed to process refund on Paystack.",
			};
		}

		// Update payment metadata to record refund details
		const now = new Date();
		const updatedMeta = {
			...meta,
			depositStatus: "refunded",
			refundedAt: now.toISOString(),
			paystackRefundId: refundRes.data?.id ? String(refundRes.data.id) : undefined,
			refundedBy: adminState.email,
			refundResponse: refundRes.data,
		};

		await prisma.payment.update({
			where: { id: payment.id },
			data: {
				metadata: updatedMeta,
			},
		});

		// Create an ActivityLog entry for auditing
		await prisma.activityLog.create({
			data: {
				organizationId: meta.organizationId || null,
				userId: adminState.userId,
				action: "security_deposit.refunded_by_super_admin",
				entityType: "payment",
				entityId: payment.id,
				description: `Security deposit of ${payment.currency} ${Number(payment.amount).toFixed(2)} refunded via Paystack.`,
				metadata: {
					adminEmail: adminState.email,
					reference: payment.reference,
					providerReference: payment.providerReference,
					paystackRefundId: refundRes.data?.id,
				},
			},
		}).catch(() => {});

		revalidatePath("/super");
		revalidatePath("/super/deposits");

		return {
			success: true,
			message: `Security deposit of ${payment.currency} ${Number(payment.amount).toFixed(2)} refunded successfully via Paystack!`,
		};
	} catch (err: any) {
		console.error("[ADMIN_PROCESS_DEPOSIT_REFUND_ERROR]", err);
		return { success: false, error: err?.message || "Failed to process security deposit refund." };
	}
}

export interface AdminRefundContextData {
	organizations: Array<{
		id: string;
		name: string;
		slug: string;
		logoUrl: string | null;
		contactEmail: string | null;
		phone: string | null;
		wallet: {
			id: string;
			balance: number;
			currency: string;
			isLocked: boolean;
		} | null;
		events: Array<{
			id: string;
			title: string;
			slug: string;
			status: string;
		}>;
	}>;
}

/**
 * Loads organizations, their active wallet balances, and hosted events for the admin refund selector.
 */
export async function getAdminRefundContext(): Promise<AdminRefundContextData> {
	await requirePlatformAdmin();

	const orgs = await prisma.organization.findMany({
		include: {
			wallets: {
				select: {
					id: true,
					balance: true,
					currency: true,
					isLocked: true,
				},
				take: 1,
			},
			events: {
				select: {
					id: true,
					title: true,
					slug: true,
					status: true,
				},
				orderBy: { createdAt: "desc" },
			},
		},
		orderBy: { name: "asc" },
	});

	return {
		organizations: orgs.map((org) => {
			const w = org.wallets[0];
			return {
				id: org.id,
				name: org.name,
				slug: org.slug,
				logoUrl: org.logoUrl,
				contactEmail: org.contactEmail,
				phone: org.phone,
				wallet: w
					? {
							id: w.id,
							balance: Number(w.balance || 0),
							currency: w.currency,
							isLocked: w.isLocked,
						}
					: null,
				events: org.events.map((e) => ({
					id: e.id,
					title: e.title,
					slug: e.slug,
					status: e.status,
				})),
			};
		}),
	};
}

export interface AdminRefundOrderSearchResult {
	id: string;
	orderNumber: string;
	buyerName: string | null;
	buyerPhone: string | null;
	buyerEmail: string | null;
	totalAmount: number;
	status: string;
	createdAt: string;
	event: {
		id: string;
		title: string;
		slug: string;
		organization: {
			id: string;
			name: string;
			slug: string;
			walletBalance: number;
		};
	};
	ticketCount: number;
	payment?: {
		id: string;
		reference: string;
		providerReference: string | null;
		provider: string;
		status: string;
		amount: number;
		currency: string;
	} | null;
	canRefundViaPaystack: boolean;
}

/**
 * Searches orders by order number, buyer name, or buyer phone for quick 1-click refund filling.
 */
export async function searchOrdersForRefund(
	query: string,
): Promise<AdminRefundOrderSearchResult[]> {
	await requirePlatformAdmin();
	const trimmed = query.trim();
	if (!trimmed || trimmed.length < 2) return [];

	const orders = await prisma.ticketOrder.findMany({
		where: {
			OR: [
				{ orderNumber: { contains: trimmed, mode: "insensitive" } },
				{ buyerPhone: { contains: trimmed, mode: "insensitive" } },
				{ buyerName: { contains: trimmed, mode: "insensitive" } },
				{
					tickets: {
						some: {
							OR: [
								{ ticketCode: { contains: trimmed, mode: "insensitive" } },
								{ attendeePhone: { contains: trimmed, mode: "insensitive" } },
								{ attendeeName: { contains: trimmed, mode: "insensitive" } },
							],
						},
					},
				},
			],
		},
		include: {
			event: {
				include: {
					organization: {
						include: {
							wallets: { take: 1, select: { balance: true } },
						},
					},
				},
			},
			tickets: { select: { id: true } },
			buyer: { select: { email: true } },
			payment: {
				select: {
					id: true,
					reference: true,
					providerReference: true,
					provider: true,
					status: true,
					amount: true,
					currency: true,
				},
			},
		},
		take: 8,
		orderBy: { createdAt: "desc" },
	});

	return orders.map((o) => {
		const org = o.event.organization;
		const total = Number(o.subtotal || 0) + Number(o.fees || 0);
		const walletBal = Number(org.wallets[0]?.balance || 0);
		const isPaystackPayment = Boolean(
			o.payment &&
			o.payment.provider?.toLowerCase() === "paystack" &&
			o.payment.status === "completed"
		);

		return {
			id: o.id,
			orderNumber: o.orderNumber,
			buyerName: o.buyerName,
			buyerPhone: o.buyerPhone,
			buyerEmail: o.buyer?.email || null,
			totalAmount: total,
			status: o.status,
			createdAt: o.createdAt.toISOString(),
			event: {
				id: o.event.id,
				title: o.event.title,
				slug: o.event.slug,
				organization: {
					id: org.id,
					name: org.name,
					slug: org.slug,
					walletBalance: walletBal,
				},
			},
			ticketCount: o.tickets.length,
			payment: o.payment
				? {
						id: o.payment.id,
						reference: o.payment.reference,
						providerReference: o.payment.providerReference,
						provider: o.payment.provider,
						status: o.payment.status,
						amount: Number(o.payment.amount || 0),
						currency: o.payment.currency,
					}
				: null,
			canRefundViaPaystack: isPaystackPayment,
		};
	});
}

export interface AdminProcessUserRefundInput {
	recipientName: string;
	recipientPhone: string;
	recipientEmail?: string;
	amount: number;
	reason: string;
	adminNotes?: string;
	deductFromOrganizer: boolean;
	organizationId?: string;
	eventId?: string;
	ticketOrderId?: string;
	sendSms: boolean;
	customSmsMessage?: string;
	/** Whether to trigger an automated Paystack refund back to the customer's MoMo/Card */
	processPaystackRefund?: boolean;
	/** Optional Paystack transaction reference override if not linked to a TicketOrder */
	paystackTransactionRef?: string;
}

export interface AdminProcessUserRefundResult {
	success: boolean;
	message?: string;
	error?: string;
	reference?: string;
	smsSent?: boolean;
	newOrganizerBalance?: number;
	paystackRefundId?: string;
	paystackRefundSuccess?: boolean;
}

/**
 * Processes a comprehensive refund from Super Admin:
 * - Optionally triggers an automated Paystack Gateway refund directly to customer's MoMo / Bank Card
 * - Optionally debits the organizer's wallet balance tied to the selected event
 * - Records a ledger transaction with reason and event tag
 * - If not refunded via Paystack gateway, credits recipient user's balance if registered on Fextiva
 * - Updates ticket order status if fully refunded
 * - Dispatches intuitive SMS notification with dynamic merge tags
 * - Records audit trail in ActivityLog
 */
export async function adminProcessUserRefund(
	data: AdminProcessUserRefundInput,
): Promise<AdminProcessUserRefundResult> {
	try {
		const adminState = await requirePlatformAdmin();

		if (!data.recipientPhone || data.recipientPhone.trim().length < 8) {
			return { success: false, error: "A valid recipient phone number is required." };
		}

		if (typeof data.amount !== "number" || isNaN(data.amount) || data.amount <= 0) {
			return { success: false, error: "Refund amount must be greater than zero." };
		}

		const cleanPhone = data.recipientPhone.trim();
		const cleanName = data.recipientName.trim() || "Customer";
		const cleanReason = data.reason.trim() || "Administrative Refund";
		const refundAmount = Math.round(data.amount * 100) / 100;
		const refundRef = `TXN-REF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

		let resolvedOrgId = data.organizationId;
		let eventTitle: string | null = null;

		if (data.eventId) {
			const event = await prisma.event.findUnique({
				where: { id: data.eventId },
				select: { id: true, title: true, organizationId: true },
			});
			if (event) {
				eventTitle = event.title;
				if (!resolvedOrgId) {
					resolvedOrgId = event.organizationId;
				}
			}
		}

		// ── 0. EXECUTE PAYSTACK REFUND (IF ENABLED) ───────────────────────────
		let paystackRefundId: string | undefined;
		let paystackRefundData: any = null;

		if (data.processPaystackRefund) {
			let txRef = data.paystackTransactionRef?.trim();

			// If not provided, fetch from linked ticket order's payment
			if (!txRef && data.ticketOrderId) {
				const order = await prisma.ticketOrder.findUnique({
					where: { id: data.ticketOrderId },
					include: { payment: true },
				});
				if (order?.payment) {
					txRef = order.payment.providerReference || order.payment.reference;
				}
			}

			if (!txRef) {
				return {
					success: false,
					error:
						"Cannot initiate Paystack refund: No Paystack payment transaction reference was found for this order. Please provide a transaction reference or disable the Paystack Gateway Refund option.",
				};
			}

			const { createPaystackRefund } = await import("./paystack");
			const refundRes = await createPaystackRefund({
				transactionReference: txRef,
				amount: refundAmount,
				currency: "GHS",
				merchantNote: `Fextiva ticket refund: ${eventTitle || "Event"} - ${cleanReason} (${cleanName})`,
			});

			if (!refundRes.success) {
				return {
					success: false,
					error:
						refundRes.error ||
						refundRes.message ||
						"Failed to process refund on Paystack. Check your Paystack account balance.",
				};
			}

			paystackRefundData = refundRes.data;
			if (refundRes.data?.id) {
				paystackRefundId = String(refundRes.data.id);
			}

			// Record refund on payment record if matched
			try {
				const matchedPayment = await prisma.payment.findFirst({
					where: {
						OR: [
							{ providerReference: txRef },
							{ reference: txRef },
							{ paystackTransactionId: txRef },
						],
					},
				});

				if (matchedPayment) {
					const meta = (matchedPayment.metadata as any) || {};
					const refundsList = Array.isArray(meta.refunds) ? meta.refunds : [];
					refundsList.push({
						refundId: paystackRefundId,
						amount: refundAmount,
						currency: "GHS",
						date: new Date().toISOString(),
						reason: cleanReason,
						adminEmail: adminState.email,
						recipientName: cleanName,
						recipientPhone: cleanPhone,
						paystackData: paystackRefundData,
					});

					await prisma.payment.update({
						where: { id: matchedPayment.id },
						data: {
							metadata: {
								...meta,
								hasRefund: true,
								refunds: refundsList,
								lastRefundAt: new Date().toISOString(),
								lastPaystackRefundId: paystackRefundId,
							},
						},
					});
				}
			} catch (payMetaErr) {
				console.warn("[ADMIN-REFUND-PAYMENT-UPDATE-WARN]", payMetaErr);
			}
		}

		let newOrgBalance: number | undefined;

		// ── 1. DEDUCT FROM ORGANIZER BALANCE (IF ENABLED) ──────────────────────
		if (data.deductFromOrganizer) {
			if (!resolvedOrgId) {
				return {
					success: false,
					error: "Please select an event or organization to deduct this refund from.",
				};
			}

			let orgWallet = await prisma.wallet.findFirst({
				where: { organizationId: resolvedOrgId },
			});

			if (!orgWallet) {
				orgWallet = await prisma.wallet.create({
					data: {
						organizationId: resolvedOrgId,
						currency: "GHS",
						balance: 0,
					},
				});
			}

			const currentOrgBal = Number(orgWallet.balance || 0);

			if (currentOrgBal < refundAmount) {
				return {
					success: false,
					error: `Insufficient organizer balance. Current balance is GHS ${currentOrgBal.toFixed(2)}, cannot deduct GHS ${refundAmount.toFixed(2)}.`,
				};
			}

			newOrgBalance = Math.round((currentOrgBal - refundAmount) * 100) / 100;

			await prisma.wallet.update({
				where: { id: orgWallet.id },
				data: {
					balance: newOrgBalance,
					lastTransactionAt: new Date(),
				},
			});

			await prisma.transaction.create({
				data: {
					reference: refundRef,
					walletId: orgWallet.id,
					type: "debit",
					category: "refund",
					status: "completed",
					amount: refundAmount,
					currency: orgWallet.currency || "GHS",
					feeAmount: 0,
					balanceBefore: currentOrgBal,
					balanceAfter: newOrgBalance,
					description: `Refund: ${cleanName} • ${eventTitle ? `${eventTitle} • ` : ""}${cleanReason}${data.processPaystackRefund ? " (Paystack Gateway)" : ""}`,
					notes: data.adminNotes
						? `${data.adminNotes} (Refunded to ${cleanName} • ${cleanPhone}${paystackRefundId ? ` • Paystack ID: ${paystackRefundId}` : ""})`
						: `Admin refund for ${cleanName} (${cleanPhone})${paystackRefundId ? ` • Paystack ID: ${paystackRefundId}` : ""}`,
					providerReference: paystackRefundId || undefined,
					providerResponse: paystackRefundData || undefined,
					completedAt: new Date(),
				},
			});
		}

		// ── 2. RECORD IN RECIPIENT'S ACCOUNT / BALANCE IF REGISTERED ─────────
		// Note: If Paystack was used, real funds were sent directly to customer's MoMo/Card,
		// so we do NOT credit their internal platform wallet balance to prevent double-disbursement.
		const normalizedPhone = normalizePhoneNumber(cleanPhone);
		const userProfile = await prisma.profile.findFirst({
			where: {
				OR: [
					...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
					...(data.recipientEmail
						? [{ email: data.recipientEmail.trim().toLowerCase() }]
						: []),
				],
			},
		});

		if (userProfile && !data.processPaystackRefund) {
			let userWallet = await prisma.wallet.findFirst({
				where: { userId: userProfile.id, organizationId: null },
			});

			if (!userWallet) {
				userWallet = await prisma.wallet.create({
					data: {
						userId: userProfile.id,
						currency: "GHS",
						balance: 0,
					},
				});
			}

			const currentUserBal = Number(userWallet.balance || 0);
			const updatedUserBal = Math.round((currentUserBal + refundAmount) * 100) / 100;

			await prisma.wallet.update({
				where: { id: userWallet.id },
				data: {
					balance: updatedUserBal,
					lastTransactionAt: new Date(),
				},
			});

			await prisma.transaction.create({
				data: {
					reference: `TXN-CR-${refundRef}`,
					walletId: userWallet.id,
					type: "credit",
					category: "refund",
					status: "completed",
					amount: refundAmount,
					currency: userWallet.currency || "GHS",
					feeAmount: 0,
					balanceBefore: currentUserBal,
					balanceAfter: updatedUserBal,
					description: `Refund credited • ${eventTitle ? `${eventTitle} • ` : ""}${cleanReason}`,
					notes: `Refund processed by Fextiva Admin (Ref: ${refundRef})`,
					completedAt: new Date(),
				},
			});
		}

		// ── 3. UPDATE TICKET ORDER STATUS (IF LINKED) ──────────────────────────
		if (data.ticketOrderId) {
			try {
				const order = await prisma.ticketOrder.findUnique({
					where: { id: data.ticketOrderId },
				});
				if (order) {
					const orderTotal = Number(order.subtotal || 0) + Number(order.fees || 0);
					if (refundAmount >= orderTotal) {
						await prisma.ticketOrder.update({
							where: { id: order.id },
							data: { status: "refunded" },
						});
					}
				}
			} catch (orderErr) {
				console.warn("[ADMIN-REFUND-ORDER-UPDATE-WARN]", orderErr);
			}
		}

		// ── 4. AUDIT ACTIVITY LOG ──────────────────────────────────────────────
		await prisma.activityLog
			.create({
				data: {
					organizationId: resolvedOrgId || null,
					userId: adminState.userId,
					action: "wallet.refund_issued_by_super_admin",
					entityType: "wallet",
					description: `Super Admin issued refund of GHS ${refundAmount.toFixed(2)} to ${cleanName} (${cleanPhone}) via ${data.processPaystackRefund ? "Paystack Gateway" : "In-App Wallet"}. Deducted from organizer: ${data.deductFromOrganizer ? "Yes" : "No"}. Reason: ${cleanReason}`,
					metadata: {
						amount: refundAmount,
						currency: "GHS",
						recipientName: cleanName,
						recipientPhone: cleanPhone,
						recipientEmail: data.recipientEmail || null,
						reason: cleanReason,
						adminNotes: data.adminNotes || null,
						deductFromOrganizer: data.deductFromOrganizer,
						organizationId: resolvedOrgId || null,
						eventId: data.eventId || null,
						eventTitle,
						ticketOrderId: data.ticketOrderId || null,
						reference: refundRef,
						adminEmail: adminState.email,
						processPaystackRefund: Boolean(data.processPaystackRefund),
						paystackRefundId: paystackRefundId || null,
					},
				},
			})
			.catch(() => {});

		// ── 5. INTUITIVE SMS NOTIFICATION (IF ENABLED) ─────────────────────────
		let smsSent = false;
		if (data.sendSms && cleanPhone) {
			try {
				const smsRes = await sendRefundSmsNotification({
					phone: cleanPhone,
					recipientName: cleanName,
					amount: refundAmount,
					currency: "GHS",
					reference: paystackRefundId ? `PAYSTACK-${paystackRefundId}` : refundRef,
					eventTitle,
					reason: cleanReason,
					customMessage: data.customSmsMessage,
					eventId: data.eventId,
				});
				smsSent = Boolean(smsRes.success);
			} catch (smsErr) {
				console.warn("[ADMIN-REFUND-SMS-ERROR]", smsErr);
			}
		}

		// ── 6. REVALIDATE PATHS ────────────────────────────────────────────────
		revalidatePath("/super");
		revalidatePath("/super/wallets");
		revalidatePath("/super/organizers");
		revalidatePath("/organization/wallet");

		const methodNote = data.processPaystackRefund
			? " via Paystack (disbursed directly to customer's MoMo / Card)"
			: " to customer account";

		return {
			success: true,
			reference: refundRef,
			smsSent,
			newOrganizerBalance: newOrgBalance,
			paystackRefundId,
			paystackRefundSuccess: Boolean(data.processPaystackRefund),
			message: `Refund of GHS ${refundAmount.toFixed(2)} processed successfully${methodNote}!${data.deductFromOrganizer ? " Organizer balance was deducted." : " (Platform-funded)"}${smsSent ? " SMS notification delivered to recipient." : ""}`,
		};
	} catch (err: any) {
		console.error("[ADMIN_PROCESS_USER_REFUND_ERROR]", err);
		return { success: false, error: err?.message || "Failed to process refund." };
	}
}


