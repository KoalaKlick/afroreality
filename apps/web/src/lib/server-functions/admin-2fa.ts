"use server";

import crypto from "crypto";
import { prisma } from "@repo/db";
import { isPlatformAdmin, requirePlatformAdmin } from "@/lib/admin/admin-auth";
import {
	generateTotpSecret,
	verifyTotpCode,
	create2FAChallengeToken,
	verify2FAChallengeToken,
} from "@/lib/auth/totp";
import { sendAdmin2StepVerificationEmail } from "@/lib/email/auth";
import { signSession, setSessionCookie, getSession } from "@/lib/session";
import { toSafeUserDto } from "@/lib/dal/auth";

const TOTP_STORE_PREFIX = "super_2fa_totp:";
const TOTP_SETUP_PREFIX = "super_2fa_setup:";
const EMAIL_OTP_PREFIX = "admin_2fa_otp:";

/**
 * Checks if a Super Admin user already has 2FA (Authenticator App) configured.
 */
export async function getSuperAdmin2FASecret(email: string): Promise<string | null> {
	const clean = email.toLowerCase().trim();
	const record = await prisma.verification.findFirst({
		where: {
			identifier: `${TOTP_STORE_PREFIX}${clean}`,
			expiresAt: { gt: new Date() },
		},
	});
	return record?.value || null;
}

/**
 * Generates fresh TOTP setup credentials (secret + QR code URI) and stores a pending setup.
 */
export async function initiateSuperAdmin2FASetup(email: string): Promise<{
	secret: string;
	otpauthUri: string;
}> {
	const clean = email.toLowerCase().trim();
	const { secret, otpauthUri } = generateTotpSecret(clean, "Fextiva Super Admin");

	// Save pending setup for 15 minutes
	const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
	const identifier = `${TOTP_SETUP_PREFIX}${clean}`;

	await prisma.verification.deleteMany({
		where: { identifier },
	});

	await prisma.verification.create({
		data: {
			id: `v_2fa_setup_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
			identifier,
			value: secret,
			expiresAt,
		},
	});

	return { secret, otpauthUri };
}

/**
 * Verifies a 6-digit TOTP code during initial setup and marks 2FA as active.
 */
export async function confirmSuperAdmin2FASetupAction({
	email,
	challengeToken,
	code,
}: {
	email: string;
	challengeToken: string;
	code: string;
}): Promise<{ success: boolean; error?: string; user?: any; nextUrl?: string }> {
	const validatedEmail = verify2FAChallengeToken(challengeToken);
	if (!validatedEmail || validatedEmail !== email.toLowerCase().trim()) {
		return { success: false, error: "Verification session expired. Please sign in again." };
	}

	// Fetch pending secret
	const identifier = `${TOTP_SETUP_PREFIX}${validatedEmail}`;
	const pendingRecord = await prisma.verification.findFirst({
		where: {
			identifier,
			expiresAt: { gt: new Date() },
		},
	});

	if (!pendingRecord) {
		return { success: false, error: "Setup session expired. Please sign in again." };
	}

	const isValid = verifyTotpCode(pendingRecord.value, code);
	if (!isValid) {
		return { success: false, error: "Invalid 6-digit code. Please check your Authenticator app and try again." };
	}

	// Persist the confirmed secret with 10-year expiry
	const permanentExpiry = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000);
	const permanentIdentifier = `${TOTP_STORE_PREFIX}${validatedEmail}`;

	await prisma.verification.deleteMany({
		where: { identifier: permanentIdentifier },
	});

	await prisma.verification.create({
		data: {
			id: `v_2fa_active_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
			identifier: permanentIdentifier,
			value: pendingRecord.value,
			expiresAt: permanentExpiry,
		},
	});

	// Remove temporary setup
	await prisma.verification.deleteMany({ where: { identifier } });

	// Find or build user session
	const user = await prisma.profile.findFirst({
		where: { email: validatedEmail },
	});

	if (!user) {
		return { success: false, error: "Admin profile not found." };
	}

	const token = await signSession({
		userId: user.id,
		email: user.email,
		emailVerified: true,
		fullName: user.fullName || "Super Administrator",
		username: user.username || "superadmin",
		onboardingCompleted: true,
		role: "super_admin",
	});

	await setSessionCookie(token);

	return {
		success: true,
		user: toSafeUserDto(user),
		nextUrl: "/super",
	};
}

/**
 * Sends a 6-digit OTP code to the Super Admin's email address as a 2-Step Verification option.
 */
export async function sendAdmin2StepOtpAction({
	email,
	challengeToken,
}: {
	email: string;
	challengeToken: string;
}): Promise<{ success: boolean; error?: string; message?: string }> {
	const validatedEmail = verify2FAChallengeToken(challengeToken);
	if (!validatedEmail || validatedEmail !== email.toLowerCase().trim()) {
		return { success: false, error: "Session expired. Please sign in again." };
	}

	const user = await prisma.profile.findFirst({
		where: { email: validatedEmail },
	});

	if (!user) {
		return { success: false, error: "Admin account not found." };
	}

	// Generate 6-digit numeric OTP
	const otp = Math.floor(100000 + Math.random() * 900000).toString();
	const identifier = `${EMAIL_OTP_PREFIX}${validatedEmail}`;
	const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

	await prisma.verification.deleteMany({
		where: { identifier },
	});

	await prisma.verification.create({
		data: {
			id: `v_otp_2fa_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
			identifier,
			value: otp,
			expiresAt,
		},
	});

	const emailResult = await sendAdmin2StepVerificationEmail({
		email: validatedEmail,
		name: user.fullName || undefined,
		otp,
	});

	if (!emailResult.success) {
		return {
			success: false,
			error: emailResult.error || "Could not deliver email code. Please use your Authenticator app.",
		};
	}

	return {
		success: true,
		message: `A 6-digit verification code has been sent to ${validatedEmail}.`,
	};
}

/**
 * Verifies 2FA on login via Authenticator App (TOTP) or Email OTP.
 */
export async function verify2FALoginAction({
	email,
	challengeToken,
	code,
	method = "totp",
}: {
	email: string;
	challengeToken: string;
	code: string;
	method: "totp" | "email";
}): Promise<{ success: boolean; error?: string; user?: any; nextUrl?: string }> {
	const validatedEmail = verify2FAChallengeToken(challengeToken);
	if (!validatedEmail || validatedEmail !== email.toLowerCase().trim()) {
		return { success: false, error: "Verification session expired. Please sign in again." };
	}

	const cleanCode = code.trim();
	if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
		return { success: false, error: "Please enter a valid 6-digit verification code." };
	}

	let isValid = false;

	if (method === "totp") {
		const secret = await getSuperAdmin2FASecret(validatedEmail);
		if (!secret) {
			return { success: false, error: "Authenticator app not configured. Please complete setup." };
		}
		isValid = verifyTotpCode(secret, cleanCode);
	} else if (method === "email") {
		const identifier = `${EMAIL_OTP_PREFIX}${validatedEmail}`;
		const record = await prisma.verification.findFirst({
			where: {
				identifier,
				expiresAt: { gt: new Date() },
			},
		});

		if (record && record.value === cleanCode) {
			isValid = true;
			// Invalidate used OTP
			await prisma.verification.deleteMany({ where: { identifier } });
		}
	}

	if (!isValid) {
		return {
			success: false,
			error:
				method === "totp"
					? "Invalid code from Authenticator app. Please ensure your device clock is synced and try again."
					: "Invalid or expired email verification code. Please request a new code.",
		};
	}

	const user = await prisma.profile.findFirst({
		where: { email: validatedEmail },
	});

	if (!user) {
		return { success: false, error: "Admin profile not found." };
	}

	const token = await signSession({
		userId: user.id,
		email: user.email,
		emailVerified: true,
		fullName: user.fullName || "Super Administrator",
		username: user.username || "superadmin",
		onboardingCompleted: true,
		role: "super_admin",
	});

	await setSessionCookie(token);

	return {
		success: true,
		user: toSafeUserDto(user),
		nextUrl: "/super",
	};
}

/**
 * Super Admin Security details for the management dashboard.
 */
export async function getSuperAdminSecurityStatusAction(): Promise<{
	success: boolean;
	hasTotp: boolean;
	email: string;
	error?: string;
}> {
	try {
		const adminState = await requirePlatformAdmin();
		const secret = await getSuperAdmin2FASecret(adminState.email);

		return {
			success: true,
			hasTotp: !!secret,
			email: adminState.email,
		};
	} catch (err: any) {
		return {
			success: false,
			hasTotp: false,
			email: "",
			error: err?.message || "Failed to fetch security status",
		};
	}
}

/**
 * Re-configures Authenticator 2FA for the currently authenticated Super Admin.
 */
export async function regenerateSuperAdminTotpAction(): Promise<{
	success: boolean;
	secret?: string;
	otpauthUri?: string;
	challengeToken?: string;
	error?: string;
}> {
	try {
		const adminState = await requirePlatformAdmin();
		const setup = await initiateSuperAdmin2FASetup(adminState.email);
		const challengeToken = create2FAChallengeToken(adminState.email);

		return {
			success: true,
			secret: setup.secret,
			otpauthUri: setup.otpauthUri,
			challengeToken,
		};
	} catch (err: any) {
		return {
			success: false,
			error: err?.message || "Failed to generate new 2FA credentials",
		};
	}
}
