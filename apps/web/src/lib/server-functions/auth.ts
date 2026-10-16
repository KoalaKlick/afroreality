"use server";

import { prisma } from "@repo/db";
import bcrypt from "bcryptjs";
import { signSession, setSessionCookie, clearSessionCookie } from "@/lib/session";
import { toSafeUserDto } from "@/lib/dal/auth";
import { sendVerificationEmail, sendPasswordResetEmail, sendPasswordChangedEmail } from "@/lib/email/auth";
import { isPlatformAdmin } from "@/lib/admin/admin-auth";
import {
  getSuperAdmin2FASecret,
  initiateSuperAdmin2FASetup,
} from "@/lib/server-functions/admin-2fa";
import { create2FAChallengeToken } from "@/lib/auth/totp";
import { normalizePhoneNumber } from "@/lib/utils/phone";
import { sendSmsMessage } from "@/lib/services/sms";
import { sendWhatsAppTextMessage } from "@/lib/services/whatsapp";

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
const PHONE_LOGIN_PREFIX = "phone-login";
const PHONE_VERIFY_PREFIX = "phone-verification";
const OTP_TTL_MINUTES = 15;
const PHONE_OTP_TTL_MINUTES = 5;

/**
 * Sends a 6-digit verification OTP to a phone number via SMS or WhatsApp.
 */
export async function sendPhoneVerificationOtp({
  phone,
  purpose = "phone_verification",
}: {
  phone: string;
  purpose?: string;
}): Promise<{
  success: boolean;
  maskedPhone?: string;
  channel?: "sms" | "whatsapp";
  error?: string;
}> {
  try {
    const normalizedPhone = normalizePhoneNumber(phone.trim());
    if (normalizedPhone.length < 9) {
      return { success: false, error: "Please enter a valid phone number." };
    }

    const otp = generateOtp();
    const identifier = `${PHONE_VERIFY_PREFIX}:${normalizedPhone}`;

    await prisma.verification.deleteMany({ where: { identifier } }).catch(() => {});
    await prisma.verification.create({
      data: {
        id: `ver_phone_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        identifier,
        value: otp,
        expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
      },
    });

    const channel = await getPhoneLoginOtpChannel();
    const otpMessage = `Your Fextiva verification code is: ${otp}\n\nThis code expires in ${OTP_TTL_MINUTES} minutes. Do not share it with anyone.`;

    let sendSuccess = false;
    if (channel === "whatsapp") {
      try {
        const waRes = await sendWhatsAppTextMessage({
          to: normalizedPhone,
          text: otpMessage,
        });
        sendSuccess = waRes.success;
      } catch (err) {
        console.error("[PhoneVerify] WhatsApp OTP send failed, falling back to SMS:", err);
      }
    }

    if (!sendSuccess) {
      const smsRes = await sendSmsMessage({
        to: normalizedPhone,
        message: `Your Fextiva verification code: ${otp}. Expires in ${OTP_TTL_MINUTES} mins.`,
        purpose,
      });
      sendSuccess = smsRes.success;
    }

    if (!sendSuccess) {
      return {
        success: false,
        error: "Failed to send verification code. Please check the phone number or try again.",
      };
    }

    const lastFour = normalizedPhone.slice(-4);
    const countryCode = normalizedPhone.slice(0, 3);
    const maskedPhone = `+${countryCode} •••••• ${lastFour}`;

    return {
      success: true,
      maskedPhone,
      channel: sendSuccess ? (channel === "whatsapp" ? "whatsapp" : "sms") : "sms",
    };
  } catch (err: any) {
    console.error("sendPhoneVerificationOtp error:", err);
    return { success: false, error: "Failed to send verification code." };
  }
}

/**
 * Detects whether the given identifier looks like a phone number.
 * Matches: 0XXXXXXXXX, +233XXXXXXXXX, 233XXXXXXXXX, or any string that is
 * primarily digits (7+ digits after stripping non-numeric chars).
 */
function isPhoneIdentifier(identifier: string): boolean {
  const digits = identifier.replace(/[^0-9]/g, "");
  if (digits.length >= 9 && digits.length <= 15) {
    // Starts with 0, +, or country code — it's a phone number
    if (
      identifier.startsWith("+") ||
      identifier.startsWith("0") ||
      /^\d{9,15}$/.test(digits)
    ) {
      return true;
    }
  }
  return false;
}

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
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim();
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

    if (
      superAdminEmail &&
      superAdminPassword &&
      cleanId === superAdminEmail &&
      password === superAdminPassword
    ) {
      let superUser = await prisma.profile.findFirst({
        where: {
          OR: [{ email: superAdminEmail }, { username: "superadmin" }],
        },
      });

      const hash = await bcrypt.hash(superAdminPassword, 10);

      if (!superUser) {
        superUser = await prisma.profile.create({
          data: {
            id: `usr_${Date.now()}_superadmin`,
            email: superAdminEmail,
            username: "superadmin",
            fullName: "Super Administrator",
            emailVerified: true,
            onboardingCompleted: true,
            passwordHash: hash,
          },
        });
      } else if (!superUser.passwordHash || !(await bcrypt.compare(password, superUser.passwordHash))) {
        superUser = await prisma.profile.update({
          where: { id: superUser.id },
          data: {
            passwordHash: hash,
            emailVerified: true,
            onboardingCompleted: true,
          },
        });
      }

      // Check 2FA for Super Admin
      const totpSecret = await getSuperAdmin2FASecret(superUser.email);
      const challengeToken = create2FAChallengeToken(superUser.email);

      if (!totpSecret) {
        const setup = await initiateSuperAdmin2FASetup(superUser.email);
        return {
          success: false,
          requires2FA: true,
          isSetup: true,
          method: "totp",
          email: superUser.email,
          challengeToken,
          secret: setup.secret,
          qrCodeUri: setup.otpauthUri,
        };
      }

      return {
        success: false,
        requires2FA: true,
        isSetup: false,
        method: "totp",
        email: superUser.email,
        challengeToken,
        hasEmailOtpOption: true,
      };
    }

    // Build lookup conditions: email, username, and phone (if identifier looks like a phone)
    const lookupConditions: any[] = [
      { email: cleanId },
      { username: cleanId },
    ];
    if (isPhoneIdentifier(identifier)) {
      const normalizedPhone = normalizePhoneNumber(identifier);
      lookupConditions.push({ phone: normalizedPhone });
      // Also try the raw cleaned identifier in case it's stored differently
      if (normalizedPhone !== cleanId) {
        lookupConditions.push({ phone: cleanId });
      }
    }

    const user = await prisma.profile.findFirst({
      where: { OR: lookupConditions },
    });

    if (!user || !user.passwordHash) {
      return { success: false, error: "Invalid credentials. Check your email, phone number, username, or password." };
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return { success: false, error: "Invalid credentials. Check your email, phone number, username, or password." };
    }

    // Check if user is Super Admin / Platform Admin
    const isSuper = await isPlatformAdmin(user.email);
    if (isSuper) {
      const totpSecret = await getSuperAdmin2FASecret(user.email);
      const challengeToken = create2FAChallengeToken(user.email);

      if (!totpSecret) {
        const setup = await initiateSuperAdmin2FASetup(user.email);
        return {
          success: false,
          requires2FA: true,
          isSetup: true,
          method: "totp",
          email: user.email,
          challengeToken,
          secret: setup.secret,
          qrCodeUri: setup.otpauthUri,
        };
      }

      return {
        success: false,
        requires2FA: true,
        isSetup: false,
        method: "totp",
        email: user.email,
        challengeToken,
        hasEmailOtpOption: true,
      };
    }


    // Accounts that predate email verification already completed onboarding and
    // keep full access (grandfathered). Only accounts that have NOT completed
    // onboarding must verify their email before continuing.
    const onboardingCompleted = Boolean(user.onboardingCompleted);
    if (!user.emailVerified && !onboardingCompleted) {
      // Check if user is a phone-registered account
      const isPhoneAccount = Boolean(user.phone) && (user.email.endsWith("@phone.fextiva.com") || isPhoneIdentifier(identifier));
      if (isPhoneAccount && user.phone) {
        sendPhoneVerificationOtp({ phone: user.phone }).catch((err) =>
          console.error("Failed to send phone verification OTP during login:", err)
        );
        return {
          success: false,
          needsVerification: true,
          phone: user.phone,
          error: "Please verify your phone number before continuing. A verification code has been sent to your phone.",
        };
      }

      // Email verification flow
      const otp = generateOtp();
      await createOtpRecord(`${EMAIL_VERIFY_PREFIX}:${user.id}`, otp);

      const emailRes = await sendVerificationEmail({
        email: user.email,
        name: user.fullName || undefined,
        otp,
      });

      if (!emailRes.success) {
        console.error("Failed to send verification email during login:", emailRes.error);
        return {
          success: false,
          needsVerification: true,
          email: user.email,
          error: `Could not send verification email: ${emailRes.error || "Mail error"}. Please click Resend Code to try again.`,
        };
      }

      return {
        success: false,
        needsVerification: true,
        email: user.email,
        error: "Please verify your email address before continuing. A verification code has been sent to your email.",
      };
    }

    const token = await signSession({
      userId: user.id,
      email: user.email,
      phone: user.phone || null,
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
  phone,
  password,
  fullName,
  username,
}: {
  email?: string;
  phone?: string;
  password: string;
  fullName: string;
  username?: string;
}): Promise<any> {
  const cleanEmail = email ? email.toLowerCase().trim() : undefined;
  const cleanPhone = phone ? normalizePhoneNumber(phone.trim()) : undefined;

  if (!cleanEmail && !cleanPhone) {
    return { success: false, error: "Please provide either an email address or a phone number." };
  }

  try {
    // 1. Phone Registration Flow
    if (cleanPhone) {
      if (cleanPhone.length < 9) {
        return { success: false, error: "Please enter a valid phone number." };
      }

      const existingPhoneUser = await prisma.profile.findFirst({
        where: {
          OR: [
            { phone: cleanPhone },
            { phone: phone?.trim() },
          ],
        },
      });

      if (existingPhoneUser) {
        if (!existingPhoneUser.emailVerified && !existingPhoneUser.onboardingCompleted) {
          sendPhoneVerificationOtp({ phone: cleanPhone }).catch(() => {});
          return {
            success: false,
            needsVerification: true,
            phone: cleanPhone,
            error: "An account with this phone number already exists. Please verify your phone number.",
          };
        }
        return { success: false, error: "An account with this phone number already exists. Please sign in." };
      }

      const syntheticEmail = cleanEmail || `phone_${cleanPhone.replace(/[^0-9]/g, "")}@phone.fextiva.com`;
      const passwordHash = await bcrypt.hash(password, 10);
      const fallbackUsername = `user_${cleanPhone.slice(-6)}`;

      const user = await prisma.profile.create({
        data: {
          id: crypto.randomUUID(),
          email: syntheticEmail,
          phone: cleanPhone,
          fullName: fullName.trim(),
          username: (username || fallbackUsername).toLowerCase().trim(),
          passwordHash,
          emailVerified: false,
          onboardingCompleted: false,
          onboardingStep: 0,
        },
      });

      // Send OTP to phone
      sendPhoneVerificationOtp({ phone: cleanPhone }).catch((err) =>
        console.error("Error sending registration phone verification OTP:", err)
      );

      const token = await signSession({
        userId: user.id,
        email: user.email,
        phone: user.phone,
        emailVerified: false,
        fullName: user.fullName || "",
        username: user.username || "",
        onboardingCompleted: false,
      });
      await setSessionCookie(token);

      return {
        success: true,
        requiresVerification: true,
        phone: cleanPhone,
        emailVerified: false,
        user: toSafeUserDto(user),
        onboardingCompleted: false,
      };
    }

    // 2. Email Registration Flow
    const existing = await prisma.profile.findUnique({
      where: { email: cleanEmail! },
    });

    if (existing) {
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
    const fallbackUsername = cleanEmail!.split("@")[0]?.replace(/[^a-z0-9_]/g, "") || "user";

    const user = await prisma.profile.create({
      data: {
        id: crypto.randomUUID(),
        email: cleanEmail!,
        fullName: fullName.trim(),
        username: (username || fallbackUsername).toLowerCase().trim(),
        passwordHash,
        emailVerified: false,
        onboardingCompleted: false,
        onboardingStep: 0,
      },
    });

    // Generate and persist verification code, then email it
    const otp = generateOtp();
    await createOtpRecord(`${EMAIL_VERIFY_PREFIX}:${user.id}`, otp);

    sendVerificationEmail({
      email: cleanEmail!,
      name: fullName,
      otp,
    }).catch((err) => console.error("Error sending registration verification email:", err));

    const token = await signSession({
      userId: user.id,
      email: user.email,
      phone: user.phone || null,
      emailVerified: false,
      fullName: user.fullName || "",
      username: user.username || "",
      onboardingCompleted: false,
    });
    await setSessionCookie(token);

    return {
      success: true,
      requiresVerification: true,
      email: cleanEmail,
      emailVerified: false,
      user: toSafeUserDto(user),
      onboardingCompleted: false,
    };
  } catch (error: any) {
    console.error("registerAction error:", error);
    return { success: false, error: error.message || "Failed to create account" };
  }
}

export async function sendVerificationOtpAction({
  email,
  phone,
}: {
  email?: string;
  phone?: string;
}): Promise<any> {
  if (phone) {
    return sendPhoneVerificationOtp({ phone });
  }
  if (email) {
    return sendVerificationEmailAction({ email });
  }
  return { success: false, error: "Either email or phone is required." };
}

export async function sendVerificationEmailAction({
  email,
}: {
  email: string;
}): Promise<any> {
  const cleanEmail = email.toLowerCase().trim();

  try {
    const user = await prisma.profile.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { username: cleanEmail }],
      },
    });

    if (!user) {
      return { success: false, error: "No account found for this email address or username." };
    }

    if (user.emailVerified) {
      return { success: true, alreadyVerified: true };
    }

    const otp = generateOtp();
    await createOtpRecord(`${EMAIL_VERIFY_PREFIX}:${user.id}`, otp);

    const res = await sendVerificationEmail({
      email: user.email,
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
    const user = await prisma.profile.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { username: cleanEmail }],
      },
    });

    if (!user) {
      // Return success for security enumeration prevention
      return { success: true };
    }

    const otp = generateOtp();
    await createOtpRecord(`${PASSWORD_RESET_PREFIX}:${user.id}`, otp);

    const res = await sendPasswordResetEmail({
      email: user.email,
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
  phone,
  otp,
  type = "verify",
}: {
  email?: string;
  phone?: string;
  otp: string;
  type?: "verify" | "recovery";
}): Promise<any> {
  const cleanEmail = email?.toLowerCase().trim();
  const cleanPhone = phone ? normalizePhoneNumber(phone.trim()) : undefined;

  try {
    // 1. Phone OTP Verification
    if (cleanPhone) {
      const identifier =
        type === "recovery"
          ? `${PASSWORD_RESET_PREFIX}:${cleanPhone}`
          : `${PHONE_VERIFY_PREFIX}:${cleanPhone}`;

      let valid = await consumeOtp(identifier, otp);
      if (!valid && type === "verify") {
        valid = await consumeOtp(`${PHONE_LOGIN_PREFIX}:${cleanPhone}`, otp);
      }

      if (!valid) {
        return { success: false, error: "Invalid or expired verification code." };
      }

      const user = await prisma.profile.findFirst({
        where: {
          OR: [
            { phone: cleanPhone },
            { phone: phone?.trim() },
            { email: `phone_${cleanPhone.replace(/[^0-9]/g, "")}@phone.fextiva.com` },
          ],
        },
      });

      if (!user) {
        return { success: false, error: "Account not found." };
      }

      if (type === "recovery") {
        return { success: true, purpose: "recovery" };
      }

      // Activate user account
      await prisma.profile.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });

      const token = await signSession({
        userId: user.id,
        email: user.email,
        phone: user.phone || cleanPhone,
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
    }

    // 2. Email OTP Verification
    if (!cleanEmail) {
      return { success: false, error: "Missing email or phone number for verification." };
    }

    const user = await prisma.profile.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { username: cleanEmail }],
      },
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
      phone: user.phone || null,
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
    const user = await prisma.profile.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { username: cleanEmail }],
      },
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

    // Send confirmation email that password was changed
    sendPasswordChangedEmail({
      email: user.email,
      name: user.fullName || undefined,
    }).catch((err) => console.error("Error sending password changed email:", err));

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

// ============================================================
// Phone OTP Login (passwordless)
// ============================================================

const PHONE_LOGIN_CHANNEL_KEY = "phone_login_otp_channel";

/**
 * Get global platform setting for phone login OTP channel.
 * Configurable by super admin in the Messaging & Reports Hub.
 * Returns "sms" | "whatsapp" — defaults to "sms".
 */
export async function getPhoneLoginOtpChannel(): Promise<"sms" | "whatsapp"> {
  try {
    const setting = await prisma.platformSetting.findUnique({
      where: { key: PHONE_LOGIN_CHANNEL_KEY },
    });
    if (setting?.value === "whatsapp") return "whatsapp";
  } catch {}
  return "sms";
}

/**
 * Step 1: Send a login OTP to the user's phone number.
 * The user provides their phone number, we look them up, generate an OTP,
 * and send it via SMS or WhatsApp based on platform config.
 */
export async function sendPhoneLoginOtp({
  phone,
}: {
  phone: string;
}): Promise<{
  success: boolean;
  maskedPhone?: string;
  channel?: "sms" | "whatsapp";
  error?: string;
}> {
  try {
    const normalizedPhone = normalizePhoneNumber(phone.trim());

    if (normalizedPhone.length < 9) {
      return { success: false, error: "Please enter a valid phone number." };
    }

    // Look up user by phone
    const user = await prisma.profile.findFirst({
      where: {
        OR: [
          { phone: normalizedPhone },
          { phone: phone.trim() },
        ],
      },
    });

    if (!user) {
      // Don't reveal whether the phone exists — generic message
      return {
        success: false,
        error: "No account found with this phone number. Please register first or log in with your email.",
      };
    }

    // Generate OTP
    const otp = generateOtp();
    const identifier = `${PHONE_LOGIN_PREFIX}:${normalizedPhone}`;

    // Clear any existing OTP
    await prisma.verification.deleteMany({ where: { identifier } }).catch(() => {});

    // Store the OTP (shorter TTL for phone login)
    await prisma.verification.create({
      data: {
        id: `ver_phone_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        identifier,
        value: otp,
        expiresAt: new Date(Date.now() + PHONE_OTP_TTL_MINUTES * 60 * 1000),
      },
    });

    // Send via configured channel
    const channel = await getPhoneLoginOtpChannel();
    const otpMessage = `Your Fextiva login code is: ${otp}\n\nThis code expires in ${PHONE_OTP_TTL_MINUTES} minutes. Do not share it with anyone.`;

    let sendSuccess = false;

    if (channel === "whatsapp") {
      try {
        const waRes = await sendWhatsAppTextMessage({
          to: normalizedPhone,
          text: otpMessage,
        });
        sendSuccess = waRes.success;
      } catch (err) {
        console.error("[PhoneLogin] WhatsApp OTP send failed, falling back to SMS:", err);
      }
    }

    // Fallback to SMS if WhatsApp fails or if channel is SMS
    if (!sendSuccess) {
      const smsRes = await sendSmsMessage({
        to: normalizedPhone,
        message: `Your Fextiva login code: ${otp}. Expires in ${PHONE_OTP_TTL_MINUTES} mins.`,
        purpose: "phone_login_otp",
      });
      sendSuccess = smsRes.success;
    }

    if (!sendSuccess) {
      return {
        success: false,
        error: "Failed to send verification code. Please try again or log in with your email and password.",
      };
    }

    // Mask phone for UI display
    const lastFour = normalizedPhone.slice(-4);
    const countryCode = normalizedPhone.slice(0, 3);
    const maskedPhone = `+${countryCode} •••••• ${lastFour}`;

    return {
      success: true,
      maskedPhone,
      channel: sendSuccess ? (channel === "whatsapp" ? "whatsapp" : "sms") : "sms",
    };
  } catch (error: any) {
    console.error("sendPhoneLoginOtp error:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Step 2: Verify the phone login OTP and create a session.
 */
export async function verifyPhoneLoginOtp({
  phone,
  otp,
  redirectTo,
}: {
  phone: string;
  otp: string;
  redirectTo?: string;
}): Promise<any> {
  try {
    const normalizedPhone = normalizePhoneNumber(phone.trim());
    const identifier = `${PHONE_LOGIN_PREFIX}:${normalizedPhone}`;

    // Validate OTP
    const isValid = await consumeOtp(identifier, otp.trim());
    if (!isValid) {
      return { success: false, error: "Invalid or expired code. Please request a new one." };
    }

    // Look up user by phone
    const user = await prisma.profile.findFirst({
      where: {
        OR: [
          { phone: normalizedPhone },
          { phone: phone.trim() },
        ],
      },
    });

    if (!user) {
      return { success: false, error: "Account not found." };
    }

    // Check if user is Super Admin — phone login is not allowed for super admins
    const isSuper = await isPlatformAdmin(user.email);
    if (isSuper) {
      return {
        success: false,
        error: "Super admin accounts must use email + password + 2FA to log in.",
      };
    }

    // Create session
    const onboardingCompleted = Boolean(user.onboardingCompleted);
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
    console.error("verifyPhoneLoginOtp error:", error);
    return { success: false, error: error.message || "Failed to verify code" };
  }
}

/**
 * Update the phone login OTP channel setting (super admin only).
 */
export async function updatePhoneLoginOtpChannel(channel: "sms" | "whatsapp"): Promise<{ success: boolean }> {
  try {
    await prisma.platformSetting.upsert({
      where: { key: PHONE_LOGIN_CHANNEL_KEY },
      update: { value: channel },
      create: { key: PHONE_LOGIN_CHANNEL_KEY, value: channel },
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}
