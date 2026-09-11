"use server";
import { prisma } from '@repo/db';
import { requireSession } from '../session';
import { comparePassword, generateOtp } from '../crypto';
import { sendVerificationEmail } from '../email/auth';

export async function checkUserHasPassword(): Promise<{ hasPassword: boolean }> {
  try {
    const session = await requireSession();
    const user = await prisma.profile.findUnique({ where: { id: session.userId }, select: { passwordHash: true } });
    return { hasPassword: !!user?.passwordHash };
  } catch {
    return { hasPassword: false };
  }
}

export async function verifyUserPassword({ data }: { data: { password: string } }): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireSession();
    const user = await prisma.profile.findUnique({ where: { id: session.userId }, select: { passwordHash: true } });
    if (!user?.passwordHash) return { success: false, error: 'No password configured for this user.' };
    const isMatch = await comparePassword(data.password, user.passwordHash);
    if (!isMatch) return { success: false, error: 'Incorrect password. Please try again.' };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Password verification failed.' };
  }
}

export async function sendSensitiveActionOtp(): Promise<{ success: boolean; email?: string; error?: string }> {
  try {
    const session = await requireSession();
    const user = await prisma.profile.findUnique({ where: { id: session.userId } });
    if (!user || !user.email) return { success: false, error: 'User email not found.' };

    const otp = generateOtp();
    await prisma.verification.deleteMany({ where: { identifier: session.userId } }).catch(() => {});
    await prisma.verification.create({
      data: {
        id: `ver_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        identifier: session.userId,
        value: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const res = await sendVerificationEmail({
      email: user.email,
      name: user.fullName || undefined,
      otp,
    });

    if (!res.success) {
      return { success: false, error: res.error || 'Failed to send verification code to email.' };
    }

    return { success: true, email: user.email };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to generate verification code.' };
  }
}

export async function verifySensitiveActionOtp({ data }: { data: { otp: string } }): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireSession();
    const record = await prisma.verification.findFirst({
      where: { identifier: session.userId, value: data.otp, expiresAt: { gt: new Date() } },
    });
    if (!record) return { success: false, error: 'Invalid or expired verification code.' };
    await prisma.verification.delete({ where: { id: record.id } });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Verification failed.' };
  }
}
