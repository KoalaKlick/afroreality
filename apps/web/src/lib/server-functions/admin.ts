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

