// src/lib/auth-guards.ts
//
// Server-only helpers that provide AUTHORITATIVE authentication state by
// combining the signed session (fast JWT) with fresh row data from the DB.
//
// Email-verification policy:
//   - NEW accounts (created after this feature shipped) have
//     emailVerified=false AND onboardingCompleted=false. They must verify
//     their email before they can enter onboarding or the app.
//   - LEGACY accounts (created before email verification) completed onboarding
//     with emailVerified=false and are grandfathered in — they keep full
//     access and are never forced through /verify.

import { redirect } from "next/navigation";
import { prisma } from "@repo/db";
import { getSession as getJwtSession } from "@/lib/session";
import type { SessionPayload } from "@/lib/types/auth";

export interface AuthState {
    session: SessionPayload;
    userId: string;
    email: string;
    fullName: string;
    username?: string | null;
    emailVerified: boolean;
    onboardingCompleted: boolean;
}

/**
 * Resolves the freshest, DB-backed auth state for the current request.
 * Returns null when there is no signed-in session or the user no longer exists.
 */
export async function getAuthState(): Promise<AuthState | null> {
    const session = await getJwtSession();
    if (!session?.userId) return null;

    const profile = await prisma.profile.findUnique({
        where: { id: session.userId },
        select: {
            id: true,
            email: true,
            emailVerified: true,
            fullName: true,
            username: true,
            onboardingCompleted: true,
        },
    });
    if (!profile) return null;

    return {
        session,
        userId: profile.id,
        email: profile.email,
        fullName: profile.fullName,
        username: profile.username,
        emailVerified: profile.emailVerified ?? false,
        onboardingCompleted: Boolean(profile.onboardingCompleted),
    };
}

/** True when this account must complete email verification before continuing. */
export function mustVerifyEmail(state: AuthState): boolean {
    return !state.emailVerified && !state.onboardingCompleted;
}

/**
 * Layout guard for protected app areas.
 * - signed out              → /login
 * - new account, unverified → /verify
 * - not yet onboarded       → /onboarding
 */
export async function requireAppAccess(): Promise<AuthState> {
    const state = await getAuthState();
    if (!state) redirect("/login");

    if (mustVerifyEmail(state)) {
        const params = new URLSearchParams({ email: state.email });
        redirect(`/verify?${params.toString()}`);
    }

    if (!state.onboardingCompleted) redirect("/onboarding");

    return state;
}

/**
 * Layout guard for the onboarding group.
 * - signed out              → /login
 * - new account, unverified → /verify
 * - already onboarded       → /dashboard
 */
export async function requireOnboardingAccess(): Promise<AuthState> {
    const state = await getAuthState();
    if (!state) redirect("/login");

    if (mustVerifyEmail(state)) {
        const params = new URLSearchParams({ email: state.email });
        redirect(`/verify?${params.toString()}`);
    }

    if (state.onboardingCompleted) redirect("/dashboard");

    return state;
}

/**
 * Layout guard for auth screens (login/register/verify/etc).
 * Signed-in users are routed to their natural home so they never see the
 * auth pages again:
 *   - new unverified account → /verify (so they can continue)
 *   - onboarded user         → /dashboard
 *   - otherwise              → /onboarding
 */
export async function requireGuestAccess(): Promise<AuthState | null> {
    const state = await getAuthState();
    if (!state) return null;

    if (mustVerifyEmail(state)) redirect("/verify");
    if (state.onboardingCompleted) redirect("/dashboard");
    redirect("/onboarding");
}
