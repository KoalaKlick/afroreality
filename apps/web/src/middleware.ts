import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { AUTH_COOKIE_NAME } from './lib/constants/config';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-fextiva-jwt-key-minimum-32-chars-long'
);

const protectedPrefixes = ['/dashboard', '/my-events', '/organization', '/promoter'];
const authRoutes = ['/login', '/register', '/verify', '/forgot-password', '/reset-password'];

export async function middleware(request: NextRequest) {
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
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isOnboardingRoute = pathname.startsWith('/onboarding');

  // 1. Unauthenticated user trying to access protected app or onboarding
  if ((isProtected || isOnboardingRoute) && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated user accessing auth screens (login, register, etc.)
  if (isAuthRoute && isAuthenticated) {
    if (session.onboardingCompleted === false) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 3. Authenticated user with completed onboarding trying to re-enter /onboarding
  if (isOnboardingRoute && isAuthenticated && session.onboardingCompleted === true) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|placeholder.png).*)'],
};
