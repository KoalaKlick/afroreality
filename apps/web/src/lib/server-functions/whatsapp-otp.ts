"use server";

// src/lib/server-functions/whatsapp-otp.ts
// WhatsApp OTP verification for payout account changes and withdrawal authorization.
// This is an ADDITIONAL security layer on top of password/email verification.

import { prisma } from "@repo/db";
import { requireSession } from "../session";
import { sendWhatsAppTextMessage, normalizePhoneNumber } from "../services/whatsapp";

const PAYOUT_OTP_PREFIX = "payout-whatsapp-otp";
const PAYOUT_OTP_TTL_MINUTES = 10;

function generateOtp(): string {
	return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Masks a phone number for safe display.
 * e.g. "233509897757" → "+233 ••••••7757"
 */
function maskPhone(phone: string): string {
	const normalized = normalizePhoneNumber(phone);
	if (normalized.length < 6) return "••••••" + normalized.slice(-2);
	const countryCode = normalized.slice(0, 3);
	const lastFour = normalized.slice(-4);
	return `+${countryCode} ••••••${lastFour}`;
}

/**
 * Returns the user's phone number and whether they can receive WhatsApp OTPs.
 * Returns null phone if the user has no phone registered.
 */
export async function getPayoutOtpPhoneInfo(): Promise<{
	hasPhone: boolean;
	maskedPhone: string | null;
}> {
	try {
		const session = await requireSession();
		const user = await prisma.profile.findUnique({
			where: { id: session.userId },
			select: { phone: true },
		});

		if (!user?.phone) {
			return { hasPhone: false, maskedPhone: null };
		}

		return {
			hasPhone: true,
			maskedPhone: maskPhone(user.phone),
		};
	} catch {
		return { hasPhone: false, maskedPhone: null };
	}
}

/**
 * Sends a WhatsApp OTP to the current user's registered phone number.
 * Used as an additional verification layer for payout-related actions.
 *
 * @param purpose - A label for the OTP purpose (shown in the WhatsApp message)
 * @returns Success status and masked phone number for UI display
 */
export async function sendPayoutWhatsAppOtp({
	data,
}: {
	data: { purpose?: string };
}): Promise<{
	success: boolean;
	maskedPhone?: string;
	error?: string;
}> {
	try {
		const session = await requireSession();
		const user = await prisma.profile.findUnique({
			where: { id: session.userId },
			select: { phone: true, fullName: true },
		});

		if (!user?.phone) {
			return {
				success: false,
				error: "No phone number registered on your account. Please add a phone number in your profile settings.",
			};
		}

		const normalizedPhone = normalizePhoneNumber(user.phone);
		const otp = generateOtp();
		const identifier = `${PAYOUT_OTP_PREFIX}:${session.userId}`;

		// Clear any existing OTP for this user/purpose
		await prisma.verification.deleteMany({ where: { identifier } }).catch(() => {});

		// Store the OTP
		await prisma.verification.create({
			data: {
				id: `ver_wa_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
				identifier,
				value: otp,
				expiresAt: new Date(Date.now() + PAYOUT_OTP_TTL_MINUTES * 60 * 1000),
			},
		});

		const purposeLabel = data.purpose || "a sensitive account action";
		const messageText =
			`🔐 *Fextiva Security Verification*\n\n` +
			`Hi ${user.fullName || "there"},\n\n` +
			`Your verification code for ${purposeLabel} is:\n\n` +
			`*${otp}*\n\n` +
			`This code expires in ${PAYOUT_OTP_TTL_MINUTES} minutes.\n\n` +
			`⚠️ If you did not initiate this action, please change your password immediately and contact support@fextiva.com.\n\n` +
			`— Fextiva Security`;

		const result = await sendWhatsAppTextMessage({
			to: normalizedPhone,
			text: messageText,
		});

		if (!result.success) {
			// Clean up the OTP record if sending failed
			await prisma.verification.deleteMany({ where: { identifier } }).catch(() => {});
			return {
				success: false,
				error: "Failed to send WhatsApp verification code. Please ensure your phone number is correct and try again.",
			};
		}

		return {
			success: true,
			maskedPhone: maskPhone(user.phone),
		};
	} catch (err: any) {
		return {
			success: false,
			error: err?.message || "Failed to send WhatsApp verification code.",
		};
	}
}

/**
 * Verifies a WhatsApp OTP for payout-related actions.
 * Consumes the OTP on success (single-use).
 */
export async function verifyPayoutWhatsAppOtp({
	data,
}: {
	data: { otp: string };
}): Promise<{ success: boolean; error?: string }> {
	try {
		const session = await requireSession();
		const identifier = `${PAYOUT_OTP_PREFIX}:${session.userId}`;

		const record = await prisma.verification.findFirst({
			where: {
				identifier,
				value: data.otp.trim(),
				expiresAt: { gt: new Date() },
			},
		});

		if (!record) {
			return {
				success: false,
				error: "Invalid or expired verification code. Please request a new one.",
			};
		}

		// Consume the OTP (single-use)
		await prisma.verification.delete({ where: { id: record.id } });

		return { success: true };
	} catch (err: any) {
		return {
			success: false,
			error: err?.message || "Verification failed.",
		};
	}
}

/**
 * Sends a notification WhatsApp message to the CURRENT payout account holder's phone
 * when a payout account change is initiated (informational alert, not OTP).
 * This notifies the existing MoMo number that someone is trying to change the payout destination.
 */
export async function notifyPayoutAccountChange({
	data,
}: {
	data: {
		organizationId: string;
		organizationName: string;
		currentAccountNumber: string;
		action: "change" | "remove";
	};
}): Promise<void> {
	try {
		const session = await requireSession();
		const user = await prisma.profile.findUnique({
			where: { id: session.userId },
			select: { fullName: true },
		});

		// Try to send notification to the current payout account number
		// (which is typically a MoMo number)
		const normalizedPhone = normalizePhoneNumber(data.currentAccountNumber);
		if (!normalizedPhone || normalizedPhone.length < 9) return;

		const actionLabel = data.action === "remove" ? "removed" : "changed";
		const messageText =
			`🔔 *Fextiva Payout Alert*\n\n` +
			`The payout account for organization *${data.organizationName}* ` +
			`ending in ****${data.currentAccountNumber.slice(-4)} is being ${actionLabel}.\n\n` +
			`Initiated by: ${user?.fullName || "An authorized user"}\n` +
			`Time: ${new Date().toLocaleString("en-GB", { timeZone: "Africa/Accra" })}\n\n` +
			`If this was not authorized by you, contact support@fextiva.com immediately.\n\n` +
			`— Fextiva Security`;

		await sendWhatsAppTextMessage({
			to: normalizedPhone,
			text: messageText,
		});
	} catch (err) {
		// Non-critical — log and continue
		console.warn("[PAYOUT-NOTIFY-WARN] Failed to send payout change notification:", err);
	}
}
