"use server";

import { prisma } from "@repo/db";
import { getSession } from "@/lib/dal/auth";
import { signSession, setSessionCookie } from "@/lib/session";

export async function getProfile(): Promise<any> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const userId = session.id;

  const emailStr = session?.email || "user@example.com";
  const fallbackUsername = emailStr.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_]/g, "") || "user";
  
  const profile = await prisma.profile.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      email: session.email,
      fullName: session.fullName || "",
      username: fallbackUsername,
      onboardingCompleted: false,
      onboardingStep: 0,
    },
  });

  return profile;
}

export async function checkUsernameAvailability({ data }: { data: { username: string } }): Promise<any> {
  try {
    const existing = await prisma.profile.findUnique({
      where: { username: data.username },
      select: { id: true },
    });
    return { available: !existing };
  } catch (error) {
    throw new Error("Failed to check username");
  }
}

export async function completeOnboardingFlow({ data }: { data: any }): Promise<any> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const userId = session.id;

  const updated = await prisma.profile.upsert({
    where: { id: userId },
    update: {
      fullName: data.fullName || undefined,
      username: data.username,
      avatarUrl: data.avatarUrl || null,
      onboardingCompleted: true,
      onboardingStep: 3,
    },
    create: {
      id: userId,
      email: session.email,
      fullName: data.fullName || session.fullName || "",
      username: data.username,
      avatarUrl: data.avatarUrl || null,
      onboardingCompleted: true,
      onboardingStep: 3,
    },
  });

  // Re-issue updated session cookie with onboardingCompleted = true
  const token = await signSession({
    userId: updated.id,
    email: updated.email,
    fullName: updated.fullName || "",
    username: updated.username || "",
    onboardingCompleted: true,
  });
  await setSessionCookie(token);

  return { success: true, profile: updated };
}

export async function updateProfileSettings({ data }: { data: any }): Promise<any> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const userId = session.id;

  const updated = await prisma.profile.update({
    where: { id: userId },
    data: {
      fullName: data.fullName,
      username: data.username,
      avatarUrl: data.avatarUrl,
    },
  });

  return { success: true, profile: updated };
}

export async function setOnboardingStep({ data }: { data: { step: number } }): Promise<any> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const userId = session.id;
  const updated = await prisma.profile.update({
    where: { id: userId },
    data: { onboardingStep: data.step },
  });
  return updated;
}
