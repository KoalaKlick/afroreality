import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { signSession, setSessionCookie } from '@/lib/session';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${url.origin}/api/auth/oauth/google/callback`;

  try {
    // 1. Exchange code for token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId || '',
        client_secret: clientSecret || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('Failed to get Google access token:', tokenData);
      return NextResponse.redirect(new URL('/login?error=token_exchange_failed', request.url));
    }

    // 2. Get user profile from Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userRes.json();

    if (!googleUser.email) {
      return NextResponse.redirect(new URL('/login?error=no_email_returned', request.url));
    }

    const cleanEmail = googleUser.email.toLowerCase().trim();
    const fullName = googleUser.name || cleanEmail.split('@')[0];
    const avatarUrl = googleUser.picture || null;

    // 3. Find or create profile in database.
    // OAuth providers return an address that they have already verified, so
    // emailVerified is set to true on both create and (if needed) update.
    let profile = await prisma.profile.findUnique({
      where: { email: cleanEmail },
    });

    if (!profile) {
      const fallbackUsername = cleanEmail.split('@')[0]?.replace(/[^a-z0-9_]/g, '') || 'user';
      profile = await prisma.profile.create({
        data: {
          id: crypto.randomUUID(),
          email: cleanEmail,
          fullName,
          avatarUrl,
          username: fallbackUsername,
          emailVerified: true,
          onboardingCompleted: false,
          onboardingStep: 0,
        },
      });
    } else {
      const updateData: any = {};
      if (avatarUrl && !profile.avatarUrl) updateData.avatarUrl = avatarUrl;
      if (!profile.emailVerified) updateData.emailVerified = true;
      if (Object.keys(updateData).length > 0) {
        profile = await prisma.profile.update({
          where: { id: profile.id },
          data: updateData,
        });
      }
    }

    // 4. Set session JWT
    const token = await signSession({
      userId: profile.id,
      email: profile.email,
      emailVerified: true,
      fullName: profile.fullName || '',
      username: profile.username || '',
      onboardingCompleted: Boolean(profile.onboardingCompleted),
    });

    await setSessionCookie(token);

    // 5. Redirect to destination
    const destination = profile.onboardingCompleted ? '/dashboard' : '/onboarding';
    return NextResponse.redirect(new URL(destination, request.url));
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(new URL('/login?error=oauth_exception', request.url));
  }
}
