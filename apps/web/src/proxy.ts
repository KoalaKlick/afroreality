import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { AUTH_COOKIE_NAME } from './lib/constants/config';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'super-secret-afroreality-jwt-key-minimum-32-chars-long'
);

// Routes that require a signed-in (verified) account.
const protectedPrefixes = ['/dashboard', '/my-events', '/organization', '/promoter'];
// Routes that only make sense for signed-OUT users (or verified users going through).
const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
const VERIFY_PATH = '/verify';
const ONBOARDING_PATH = '/onboarding';

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    let session: any = null;
    if (token) {
        try {
            const { payload } = await jwtVerify(token, JWT_SECRET);
            session = payload;
        } catch {
            session = null;
        }
    }

    const isAuthenticated = Boolean(session && session.userId);

    // A new account created via email registration is signed in with
    // emailVerified === false and onboardingCompleted === false. Such accounts
    // MUST verify before they can continue into onboarding / the app.
    //
    // Legacy accounts (created before email verification existed) completed
    // onboarding with emailVerified === false and keep full access
    // (grandfathered) — they are NOT funneled to /verify.
    const needsVerification =
        isAuthenticated &&
        session.emailVerified === false &&
        session.onboardingCompleted === false;

    const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
    const isOnboardingRoute = pathname.startsWith(ONBOARDING_PATH);
    const isVerifyRoute = pathname.startsWith(VERIFY_PATH);

    // 1. Signed-out users:
    //    - Protected + onboarding require sign-in.
    if (!isAuthenticated) {
        if (isProtected || isOnboardingRoute) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirectTo', pathname);
            return NextResponse.redirect(loginUrl);
        }
        // Everything else (landing, auth pages, verify) is freely reachable.
        return NextResponse.next();
    }

    // 2. Signed-in new accounts that still need email verification:
    //    - They may ONLY access the verification screen (plus public landing).
    //    - Attempts to reach onboarding or any protected screen go to /verify.
    if (needsVerification) {
        if (isVerifyRoute) return NextResponse.next();

        if (isProtected || isOnboardingRoute || isAuthRoute) {
            const verifyUrl = new URL(VERIFY_PATH, request.url);
            verifyUrl.searchParams.set('email', session.email || '');
            if (!isAuthRoute) verifyUrl.searchParams.set('next', pathname);
            return NextResponse.redirect(verifyUrl);
        }
        return NextResponse.next();
    }

    // 3. Verified/signed-in users:
    const onboardingCompleted = session.onboardingCompleted === true;

    //    - They don't belong on the verify screen anymore.
    if (isVerifyRoute) {
        return NextResponse.redirect(
            new URL(onboardingCompleted ? '/dashboard' : ONBOARDING_PATH, request.url)
        );
    }

    //    - Authenticated users visiting login/register go to their home.
    if (isAuthRoute) {
        return NextResponse.redirect(
            new URL(onboardingCompleted ? '/dashboard' : ONBOARDING_PATH, request.url)
        );
    }

    //    - Users with completed onboarding re-entering onboarding are redirected.
    if (isOnboardingRoute && onboardingCompleted) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|placeholder.png).*)'],
};
