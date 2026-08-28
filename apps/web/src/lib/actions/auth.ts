'use server';

import { prisma } from '@repo/db';
import { redirect } from 'next/navigation';
import { comparePassword, hashPassword, generateOtp } from '../crypto';
import {
  findUserByEmail,
  findUserByUsername,
  findUserById,
  toSafeUserDto,
  createVerificationOtp,
  verifyOtp,
} from '../dal/auth';
import {
  clearSessionCookie,
  getSession,
  setSessionCookie,
  signSession,
} from '../session';
import type { AuthResponseDto, SafeUserDto } from '../types/auth';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type LoginInput,
  type RegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from '../validations/auth';

export async function getCurrentUserAction(): Promise<SafeUserDto | null> {
  const session = await getSession();
  if (!session?.userId) return null;
  return findUserById(session.userId);
}

export async function loginAction(input: LoginInput): Promise<AuthResponseDto> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  const user = await findUserByEmail(parsed.data.email);
  if (!user || !user.passwordHash) {
    return { success: false, error: 'Invalid email or password' };
  }

  const isMatch = await comparePassword(parsed.data.password, user.passwordHash);
  if (!isMatch) {
    return { success: false, error: 'Invalid email or password' };
  }

  const token = await signSession({
    userId: user.id,
    email: user.email,
    username: user.username,
    currentOrganizationId: user.currentOrganizationId,
  });

  await setSessionCookie(token);

  return {
    success: true,
    user: toSafeUserDto(user),
  };
}

export async function registerAction(input: RegisterInput): Promise<AuthResponseDto> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  const existingEmail = await findUserByEmail(parsed.data.email);
  if (existingEmail) {
    return { success: false, error: 'An account with this email already exists' };
  }

  const existingUsername = await findUserByUsername(parsed.data.username);
  if (existingUsername) {
    return { success: false, error: 'This username is already taken' };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const userId = crypto.randomUUID();

  const user = await prisma.profile.create({
    data: {
      id: userId,
      email: parsed.data.email.toLowerCase().trim(),
      username: parsed.data.username.toLowerCase().trim(),
      fullName: parsed.data.fullName.trim(),
      phone: parsed.data.phone?.trim() || null,
      passwordHash,
    },
  });

  const token = await signSession({
    userId: user.id,
    email: user.email,
    username: user.username,
    currentOrganizationId: user.currentOrganizationId,
  });

  await setSessionCookie(token);

  return {
    success: true,
    user: toSafeUserDto(user),
  };
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect('/login');
}

export async function forgotPasswordAction(input: ForgotPasswordInput): Promise<AuthResponseDto> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  const user = await findUserByEmail(parsed.data.email);
  if (!user) {
    return { success: true, message: 'If an account exists, a reset code was sent' };
  }

  const otp = generateOtp();
  await createVerificationOtp(`reset-password:${user.id}`, otp);

  console.log(`[DEV OTP] Password reset code for ${user.email}: ${otp}`);

  return {
    success: true,
    message: 'Reset code sent to your email',
  };
}

export async function resetPasswordAction(input: ResetPasswordInput): Promise<AuthResponseDto> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  const user = await findUserByEmail(parsed.data.email);
  if (!user) {
    return { success: false, error: 'Invalid request' };
  }

  const isValid = await verifyOtp(`reset-password:${user.id}`, parsed.data.code);
  if (!isValid) {
    return { success: false, error: 'Invalid or expired reset code' };
  }

  const newHash = await hashPassword(parsed.data.newPassword);
  await prisma.profile.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  return {
    success: true,
    message: 'Password reset successful. You can now login.',
  };
}
