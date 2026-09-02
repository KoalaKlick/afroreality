"use server";

import { prisma } from "@repo/db";
import bcrypt from "bcryptjs";
import { signSession, setSessionCookie, clearSessionCookie } from "@/lib/session";
import { toSafeUserDto } from "@/lib/dal/auth";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email/auth";

// ============================================================
// Auth service (email + password)
//
// All OTP codes are persisted in the `verifications` table so they
// survive server restarts and multi-instance deployments (unlike an
// in-memory Map). Identifiers are namespaced per purpose:
//   - `email-verification:<userId>`  → email verification
//   - `password-reset:<userId>`      → password recovery
// ============================================================

const EMAIL_VERIFY_PREFIX = "email-verification";
const PASSWORD_RESET_PREFIX = "password-reset";
const OTP_TTL_MINUTES = 15;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function createOtpRecord(identifier: string, otp: string): Promise<void> {
  // Replace any previous live code for the same identifier
  await prisma.verification.deleteMany({ where: { identifier } }).catch(() => { });
  await prisma.verification.create({
    data: {
      id: `ver_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`,
      identifier,
      value: otp,
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    },
  });
}

async function consumeOtp(identifier: string, otp: string): Promise<boolean> {
  const valid = await peekOtp(identifier, otp);
  if (!valid) return false;
  // Codes are single-use: remove them so they cannot be replayed.
  await prisma.verification.deleteMany({ where: { identifier } }).catch(() => { });
  return true;
}

/**
 * Validates an OTP WITHOUT consuming it. Used by the password-recovery flow,
 * where the code is verified on one screen and then consumed when the new
 * password is actually saved (resetPasswordAction).
 */
async function peekOtp(identifier: string, otp: string): Promise<boolean> {
  const record = await prisma.verification.findFirst({
    where: { identifier },
    orderBy: { createdAt: "desc" },
  });
  if (!record || new Date() > record.expiresAt || record.value !== otp.trim()) {
    return false;
  }
  return true;
}

export async function loginAction({
  identifier,
  password,
}: {
  identifier: string;
  password: string;
}): Promise<any> {
  const cleanId = identifier.toLowerCase().trim();

  try {
    const user = await prisma.profile.findFirst({
      where: {
        OR: [{ email: cleanId }, { username: cleanId }],
      },
    });

    if (!user || !user.passwordHash) {
      return { success: false, error: "Invalid email/username or password" };
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return { success: false, error: "Invalid email/username or password" };
    }

    // Accounts that predate email verification already completed onboarding and
    // keep full access (grandfathered). Only accounts that have NOT completed
    // onboarding must verify their email before continuing.
    const onboardingCompleted = Boolean(user.onboardingCompleted);
    if (!user.emailVerified && !onboardingCompleted) {
      return {
        success: false,
        needsVerification: true,
        email: user.email,
        error: "Please verify your email address before continuing.",
      };
    }

    const token = await signSession({
      userId: user.id,
      email: user.email,
      emailVerified: Boolean(user.emailVerified),
      fullName: user.fullName || "",
      username: user.username || "",
      onboardingCompleted,
    });

    await setSessionCookie(token);

    return {
      success: true,
      user: toSafeUserDto(user),
      emailVerified: Boolean(user.emailVerified),
      onboardingCompleted,
    };
  } catch (error: any) {
    console.error("loginAction error:", error);
    return { success: false, error: error.message || "Failed to sign in" };
  }
}

export async function registerAction({
  email,
  password,
  fullName,
  username,
}: {
  email: string;
  password: string;
  fullName: string;
  username?: string;
}): Promise<any> {
  const cleanEmail = email.toLowerCase().trim();

  try {
    const existing = await prisma.profile.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      // Legacy accounts that completed onboarding simply exist — direct them to
      // sign in. New-but-unverified accounts are sent to the verify flow.
      if (!existing.emailVerified && !existing.onboardingCompleted) {
        return {
          success: false,
          needsVerification: true,
          email: existing.email,
          error: "An account with this email already exists. Please verify your email.",
        };
      }
      return { success: false, error: "An account with this email already exists" };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const fallbackUsername = cleanEmail.split("@")[0]?.replace(/[^a-z0-9_]/g, "") || "user";

    const user = await prisma.profile.create({
      data: {
        id: crypto.randomUUID(),
        email: cleanEmail,
        fullName: fullName.trim(),
        username: (username || fallbackUsername).toLowerCase().trim(),
        passwordHash,
        emailVerified: false,
        onboardingCompleted: false,
        onboardingStep: 0,
      },
    });

    // Generate and persist a verification code, then email it to the user.
    const otp = generateOtp();
    await createOtpRecord(`${EMAIL_VERIFY_PREFIX}:${user.id}`, otp);

    // Asynchronously send email without blocking registration
    sendVerificationEmail({
      email: cleanEmail,
      name: fullName,
      otp,
    }).catch((err) => console.error("Error sending registration verification email:", err));

    // Sign the user in so we know who they are, but with emailVerified=false.
    // The centralized proxy / route guards will send them to /verify before they
    // can reach onboarding or any protected screen.
    const token = await signSession({
      userId: user.id,
      email: user.email,
      emailVerified: false,
      fullName: user.fullName || "",
      username: user.username || "",
      onboardingCompleted: false,
    });
    await setSessionCookie(token);

    return {
      success: true,
      requiresVerification: true,
      emailVerified: false,
      user: toSafeUserDto(user),
      onboardingCompleted: false,
    };
  } catch (error: any) {
    console.error("registerAction error:", error);
    return { success: false, error: error.message || "Failed to create account" };
  }
}

export async function sendVerificationEmailAction({
  email,
}: {
  email: string;
}): Promise<any> {
  const cleanEmail = email.toLowerCase().trim();

  try {
    const user = await prisma.profile.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return { success: false, error: "No account found for this email address." };
    }

    if (user.emailVerified) {
      return { success: true, alreadyVerified: true };
    }

    const otp = generateOtp();
    await createOtpRecord(`${EMAIL_VERIFY_PREFIX}:${user.id}`, otp);

    const res = await sendVerificationEmail({
      email: cleanEmail,
      name: user.fullName || undefined,
      otp,
    });

    if (!res.success) {
      return { success: false, error: res.error || "Failed to send verification email." };
    }

    return { success: true };
  } catch (err: any) {
    console.error("sendVerificationEmailAction error:", err);
    return { success: false, error: err.message || "Failed to send verification email." };
  }
}

export async function sendRecoveryOtpAction({ email }: { email: string }): Promise<any> {
  const cleanEmail = email.toLowerCase().trim();

  try {
    const user = await prisma.profile.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      // Return success for security enumeration prevention
      return { success: true };
    }

    const otp = generateOtp();
    await createOtpRecord(`${PASSWORD_RESET_PREFIX}:${user.id}`, otp);

    const res = await sendPasswordResetEmail({
      email: cleanEmail,
      name: user.fullName || undefined,
      otp,
    });

    if (!res.success) {
      return { success: false, error: res.error || "Failed to send recovery email" };
    }

    return { success: true };
  } catch (err: any) {
    console.error("sendRecoveryOtpAction error:", err);
    return { success: false, error: err.message || "Failed to send reset code" };
  }
}

export async function verifyOtpAction({
  email,
  otp,
  type = "verify",
}: {
  email: string;
  otp: string;
  type?: "verify" | "recovery";
}): Promise<any> {
  const cleanEmail = email.toLowerCase().trim();

  try {
    const user = await prisma.profile.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return { success: false, error: "Account not found." };
    }

    const identifier =
      type === "recovery"
        ? `${PASSWORD_RESET_PREFIX}:${user.id}`
        : `${EMAIL_VERIFY_PREFIX}:${user.id}`;

    // Recovery: validate WITHOUT consuming — the code is needed again when the
    // new password is actually saved in resetPasswordAction.
    if (type === "recovery") {
      const valid = await peekOtp(identifier, otp);
      if (!valid) {
        return { success: false, error: "Invalid or expired verification code." };
      }
      return { success: true, purpose: "recovery" };
    }

    const valid = await consumeOtp(identifier, otp);
    if (!valid) {
      return { success: false, error: "Invalid or expired verification code." };
    }

    // Email verification: flip the flag and issue a real session so the user
    // can continue into onboarding/dashboard.
    await prisma.profile.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    const token = await signSession({
      userId: user.id,
      email: user.email,
      emailVerified: true,
      fullName: user.fullName || "",
      username: user.username || "",
      onboardingCompleted: Boolean(user.onboardingCompleted),
    });
    await setSessionCookie(token);

    return {
      success: true,
      purpose: "verify",
      emailVerified: true,
      user: toSafeUserDto({ ...user, emailVerified: true }),
      onboardingCompleted: Boolean(user.onboardingCompleted),
    };
  } catch (error: any) {
    console.error("verifyOtpAction error:", error);
    return { success: false, error: error.message || "Verification failed" };
  }
}

export async function resetPasswordAction({
  email,
  newPassword,
  otp,
}: {
  email: string;
  newPassword: string;
  otp?: string;
}): Promise<any> {
  const cleanEmail = email.toLowerCase().trim();

  try {
    const user = await prisma.profile.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // The recovery code must be validated before the password is changed.
    if (!otp) {
      return { success: false, error: "A verification code is required to reset your password." };
    }

    const valid = await consumeOtp(`${PASSWORD_RESET_PREFIX}:${user.id}`, otp);
    if (!valid) {
      return { success: false, error: "Invalid or expired verification code." };
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.profile.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return { success: true };
  } catch (err: any) {
    console.error("resetPasswordAction error:", err);
    return { success: false, error: err.message || "Failed to reset password" };
  }
}

export async function googleOAuthAction({
  email = "google_user@fextiva.com",
  fullName = "Google User",
}: {
  email?: string;
  fullName?: string;
} = {}): Promise<any> {
  const cleanEmail = email.toLowerCase().trim();

  try {
    let user = await prisma.profile.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      const fallbackUsername = cleanEmail.split("@")[0]?.replace(/[^a-z0-9_]/g, "") || "google_user";
      user = await prisma.profile.create({
        data: {
          id: crypto.randomUUID(),
          email: cleanEmail,
          fullName,
          username: fallbackUsername,
          emailVerified: true, // OAuth providers have already verified the email
          onboardingCompleted: false,
          onboardingStep: 0,
        },
      });
    } else if (!user.emailVerified) {
      // An OAuth sign-in with a Google-verified address is sufficient proof.
      user = await prisma.profile.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
    }

    const token = await signSession({
      userId: user.id,
      email: user.email,
      emailVerified: true,
      fullName: user.fullName || "",
      username: user.username || "",
      onboardingCompleted: Boolean(user.onboardingCompleted),
    });

    await setSessionCookie(token);

    return {
      success: true,
      user: toSafeUserDto(user),
      emailVerified: true,
      onboardingCompleted: Boolean(user.onboardingCompleted),
    };
  } catch (error: any) {
    console.error("googleOAuthAction error:", error);
    return { success: false, error: error.message || "OAuth login failed" };
  }
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
}
