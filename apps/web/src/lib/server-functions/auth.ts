"use server";

import { prisma } from "@repo/db";
import bcrypt from "bcryptjs";
import { signSession, setSessionCookie, clearSessionCookie } from "@/lib/session";
import { toSafeUserDto } from "@/lib/dal/auth";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email/auth";

// In-memory or temporary OTP storage for password recovery & verification
const otpStore = new Map<string, { code: string; expiresAt: number }>();

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

    const token = await signSession({
      userId: user.id,
      email: user.email,
      fullName: user.fullName || "",
      username: user.username || "",
    });

    await setSessionCookie(token);

    return {
      success: true,
      user: toSafeUserDto(user),
      onboardingCompleted: Boolean(user.onboardingCompleted),
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
        onboardingCompleted: false,
        onboardingStep: 0,
      },
    });

    // Generate and send verification email
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(`verify:${cleanEmail}`, { code: otp, expiresAt: Date.now() + 15 * 60 * 1000 });
    
    // Asynchronously send email without blocking registration
    sendVerificationEmail({
      email: cleanEmail,
      name: fullName,
      otp,
    }).catch((err) => console.error("Error sending registration verification email:", err));

    const token = await signSession({
      userId: user.id,
      email: user.email,
      fullName: user.fullName || "",
      username: user.username || "",
    });

    await setSessionCookie(token);

    return {
      success: true,
      user: toSafeUserDto(user),
      onboardingCompleted: false,
    };
  } catch (error: any) {
    console.error("registerAction error:", error);
    return { success: false, error: error.message || "Failed to create account" };
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

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(`recovery:${cleanEmail}`, { code: otp, expiresAt: Date.now() + 15 * 60 * 1000 });

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
  type = "recovery",
}: {
  email: string;
  otp: string;
  type?: "recovery" | "verify";
}): Promise<any> {
  const cleanEmail = email.toLowerCase().trim();
  const key = `${type}:${cleanEmail}`;
  const stored = otpStore.get(key);

  if (!stored) {
    return { success: false, error: "Verification code expired or not found. Please request a new one." };
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(key);
    return { success: false, error: "Verification code expired. Please request a new one." };
  }

  if (stored.code !== otp.trim()) {
    return { success: false, error: "Invalid verification code." };
  }

  otpStore.delete(key);
  return { success: true };
}

export async function resetPasswordAction({
  email,
  newPassword,
}: {
  email: string;
  newPassword: string;
}): Promise<any> {
  const cleanEmail = email.toLowerCase().trim();

  try {
    const user = await prisma.profile.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return { success: false, error: "User not found" };
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
          onboardingCompleted: false,
          onboardingStep: 0,
        },
      });
    }

    const token = await signSession({
      userId: user.id,
      email: user.email,
      fullName: user.fullName || "",
      username: user.username || "",
    });

    await setSessionCookie(token);

    return {
      success: true,
      user: toSafeUserDto(user),
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
