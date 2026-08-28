"use server";
import { prisma } from '@repo/db';
import { requireSession } from '../session';
import { comparePassword, generateOtp } from '../crypto';

export async function checkUserHasPassword(): Promise<{ hasPassword: boolean }> {
  const session = await requireSession();
  const user = await prisma.profile.findUnique({ where: { id: session.userId }, select: { passwordHash: true } });
  return { hasPassword: !!user?.passwordHash };
}

export async function verifyUserPassword({ data }: { data: { password: string } }): Promise<{ success: boolean }> {
  const session = await requireSession();
  const user = await prisma.profile.findUnique({ where: { id: session.userId }, select: { passwordHash: true } });
  if (!user?.passwordHash) throw new Error('No password set');
  const isMatch = await comparePassword(data.password, user.passwordHash);
  if (!isMatch) throw new Error('Incorrect password');
  return { success: true };
}

export async function sendSensitiveActionOtp(): Promise<{ success: boolean; email?: string }> {
  const session = await requireSession();
  const user = await prisma.profile.findUnique({ where: { id: session.userId } });
  const otp = generateOtp();
  await prisma.verification.create({
    data: {
      id: `ver_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      identifier: session.userId,
      value: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });
  return { success: true, email: user?.email || undefined };
}

export async function verifySensitiveActionOtp({ data }: { data: { otp: string } }): Promise<{ success: boolean }> {
  const session = await requireSession();
  const record = await prisma.verification.findFirst({
    where: { identifier: session.userId, value: data.otp, expiresAt: { gt: new Date() } },
  });
  if (!record) throw new Error('Invalid or expired OTP');
  await prisma.verification.delete({ where: { id: record.id } });
  return { success: true };
}
