// src/lib/admin/admin-auth.ts
//
// Platform Super Admin authorization guards and checks.
// Supports root super admin from env (kgyan19lf@gmail.com)
// and dynamic addition of other admin users by the root user.

import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/auth-guards";
import { prisma } from "@repo/db";

/**
 * Authoritative async check for platform super admin access.
 * Checks root super admin email, env list, and database-persisted admin emails.
 */
export async function isPlatformAdmin(email?: string | null): Promise<boolean> {
	if (!email) return false;

	const normalized = email.trim().toLowerCase();
	const rootEmail = (process.env.SUPER_ADMIN_EMAIL || "kgyan19lf@gmail.com").toLowerCase().trim();
	if (normalized === rootEmail) return true;

	const envAdmins = process.env.PLATFORM_ADMIN_EMAILS
		? process.env.PLATFORM_ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase())
		: [];
	if (envAdmins.includes(normalized)) return true;

	const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim().toLowerCase();
	if (senderEmail && normalized === senderEmail) return true;

	if (["admin@afroreality.com", "admin@fextiva.com"].includes(normalized)) {
		return true;
	}

	// Check dynamically added platform admin users in database
	try {
		const record = await prisma.verification.findFirst({
			where: { identifier: "platform_admin_emails" },
		});
		if (record?.value) {
			const dbAdmins: string[] = JSON.parse(record.value);
			if (dbAdmins.map((e) => e.toLowerCase()).includes(normalized)) {
				return true;
			}
		}
	} catch {}

	if (process.env.NODE_ENV === "development" && (!process.env.PLATFORM_ADMIN_EMAILS || process.env.PLATFORM_ADMIN_EMAILS.trim() === "")) {
		return true;
	}

	return false;
}

/**
 * Fast synchronous check for client/layout helpers.
 */
export function isPlatformAdminEmail(email?: string | null): boolean {
	if (!email) return false;

	const normalized = email.trim().toLowerCase();
	const rootEmail = (process.env.SUPER_ADMIN_EMAIL || "kgyan19lf@gmail.com").toLowerCase().trim();
	if (normalized === rootEmail) return true;

	const envAdmins = process.env.PLATFORM_ADMIN_EMAILS
		? process.env.PLATFORM_ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase())
		: [];
	if (envAdmins.includes(normalized)) return true;

	const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim().toLowerCase();
	if (senderEmail && normalized === senderEmail) return true;

	if (["admin@afroreality.com", "admin@fextiva.com"].includes(normalized)) {
		return true;
	}

	if (process.env.NODE_ENV === "development" && (!process.env.PLATFORM_ADMIN_EMAILS || process.env.PLATFORM_ADMIN_EMAILS.trim() === "")) {
		return true;
	}

	return false;
}

/**
 * Authoritative guard for platform super admin routes.
 * Redirects unauthorized users to the standard organizer dashboard.
 */
export async function requirePlatformAdmin() {
	const state = await getAuthState();
	if (!state) {
		redirect("/login");
	}

	const authorized = await isPlatformAdmin(state.email);
	if (!authorized) {
		redirect("/dashboard");
	}

	return state;
}
