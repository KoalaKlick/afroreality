"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/db";
import { requirePlatformAdmin } from "@/lib/admin/admin-auth";

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
			const count = await prisma.event.count({
				where: { ussdCode: { not: null } },
			});
			assignedCode = String(100 + count);
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

export interface AdminPlatformFeesData {
	globalFees: AdminFeeConfigItem[];
	orgOverrides: AdminFeeConfigItem[];
	paystackConfig: {
		feeRate: number;
		feeCap: number;
	};
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

	const [globalFees, orgOverrides, gatewaySetting, organizations] = await Promise.all([
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
		prisma.organization.findMany({
			select: { id: true, name: true, slug: true },
			orderBy: { name: "asc" },
		}),
	]);

	const paystackConfig = (gatewaySetting?.value as any) || {
		feeRate: 0.0195,
		feeCap: 100,
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


