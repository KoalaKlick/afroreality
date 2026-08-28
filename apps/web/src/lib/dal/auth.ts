import { prisma } from '@repo/db';
import type { SafeUserDto } from '../types/auth';
import { getSession as getSessionPayload } from '../session';

export function toSafeUserDto(user: any): SafeUserDto {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName || '',
    avatarUrl: user.avatarUrl || null,
    username: user.username || null,
    role: user.role || 'USER',
    phone: user.phone || null,
    createdAt: user.createdAt?.toISOString ? user.createdAt.toISOString() : String(user.createdAt),
  };
}

export async function findUserByEmail(email: string) {
  return prisma.profile.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
}

export async function findUserByUsername(username: string) {
  return prisma.profile.findFirst({
    where: { username: username.toLowerCase().trim() },
  });
}

export async function findUserById(id: string) {
  return prisma.profile.findUnique({
    where: { id },
  });
}

export async function getSafeUser(userId: string): Promise<SafeUserDto | null> {
  const user = await findUserById(userId);
  if (!user) return null;
  return toSafeUserDto(user);
}

export async function getCurrentUser(userId?: string): Promise<SafeUserDto | null> {
  if (userId) return getSafeUser(userId);
  return getSession();
}

export async function getSession(): Promise<SafeUserDto | null> {
  const payload = await getSessionPayload();
  if (!payload || !payload.userId) return null;
  return getSafeUser(payload.userId);
}

export async function createVerificationOtp(identifier: string, code: string, type: string = 'EMAIL_VERIFY') {
  return prisma.verification.create({
    data: {
      id: `ver_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      identifier,
      value: code,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
    },
  });
}

export async function verifyOtp(identifier: string, code: string) {
  const record = await prisma.verification.findFirst({
    where: {
      identifier,
      value: code,
      expiresAt: { gt: new Date() },
    },
  });

  if (!record) return false;
  await prisma.verification.delete({ where: { id: record.id } });
  return true;
}
