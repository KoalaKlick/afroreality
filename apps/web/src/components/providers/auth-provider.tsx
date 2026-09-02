"use client";

import React, { createContext, useContext, useState } from "react";
import type { SafeUserDto } from "@/lib/types/auth";
import {
  loginAction,
  registerAction,
  logoutAction,
  sendRecoveryOtpAction,
  sendVerificationEmailAction,
  verifyOtpAction,
  resetPasswordAction,
} from "@/lib/server-functions/auth";
import { toast } from "sonner";

export interface AuthError {
  message: string;
  needsVerification?: boolean;
  email?: string;
}

export interface AuthContextType {
  user: SafeUserDto | null;
  isLoading: boolean;
  loading: boolean;
  setUser: (user: SafeUserDto | null) => void;
  /** Legacy alias kept for compatibility — positional form. */
  login: (identifier: string, pass: string) => Promise<any>;
  signInWithPassword: (credentials: {
    identifier?: string;
    email?: string;
    password: string;
    redirectTo?: string;
  }) => Promise<{ data?: SafeUserDto | null; error: AuthError | null }>;
  /** Legacy alias kept for compatibility — positional form. */
  register: (email: string, pass: string, fullName: string, username?: string) => Promise<any>;
  signUp: (data: {
    email: string;
    password: string;
    fullName?: string;
    full_name?: string;
    username?: string;
    phone?: string;
    redirectTo?: string;
  }) => Promise<{ data?: SafeUserDto | null; error: AuthError | null }>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: string) => Promise<{ data?: any; error: { message: string } | null }>;
  verifyOtp: (input: { email: string; otp: string; type?: "verify" | "recovery" }) => Promise<{
    error: AuthError | null;
    data?: any;
  }>;
  sendVerificationEmail: (email: string) => Promise<{ error: AuthError | null }>;
  sendRecoveryOtp: (email: string) => Promise<{ error: AuthError | null }>;
  resetPassword: (input: { email: string; newPassword: string; otp?: string }) => Promise<{
    error: AuthError | null;
  }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Builds the `/verify` URL used whenever an account exists but its email is
 * not yet verified.
 */
function buildVerifyUrl(email: string, next?: string | null): string {
  const params = new URLSearchParams();
  if (email) params.set("email", email);
  if (next) params.set("next", next);
  const qs = params.toString();
  return `/verify${qs ? `?${qs}` : ""}`;
}

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialUser?: SafeUserDto | null;
}) {
  const [user, setUser] = useState<SafeUserDto | null>(initialUser);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (identifier: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await loginAction({ identifier, password: pass });
      if (res.success && res.user) {
        setUser(res.user);
        window.location.href = res.onboardingCompleted ? "/dashboard" : "/onboarding";
      } else if (res.needsVerification && res.email) {
        window.location.href = buildVerifyUrl(res.email);
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInWithPassword = async (credentials: {
    identifier?: string;
    email?: string;
    password: string;
    redirectTo?: string;
  }) => {
    setIsLoading(true);
    const id = credentials.identifier || credentials.email || "";
    const password = credentials.password || "";
    const redirectTo = credentials.redirectTo;

    try {
      const res = await loginAction({ identifier: id, password });

      if (res.needsVerification) {
        // Account exists but its email is not verified — send them to verify.
        const email = res.email || id;
        window.location.href = buildVerifyUrl(email, redirectTo);
        return {
          data: null,
          error: {
            message: res.error || "Please verify your email address.",
            needsVerification: true,
            email,
          },
        };
      }

      if (res.success && res.user) {
        setUser(res.user);
        toast.success("Signed in successfully!");
        const nextUrl =
          redirectTo || (res.onboardingCompleted ? "/dashboard" : "/onboarding");
        window.location.href = nextUrl;
        return { data: res.user, error: null };
      } else {
        const errorMsg = res.error || "Invalid email/username or password";
        toast.error(errorMsg);
        return { data: null, error: { message: errorMsg } };
      }
    } catch (err: any) {
      const errorMsg = err.message || "Sign in failed";
      toast.error(errorMsg);
      return { data: null, error: { message: errorMsg } };
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (email: string, pass: string, fullName: string, username?: string) => {
    setIsLoading(true);
    try {
      const res = await registerAction({ email, password: pass, fullName, username });
      if (res.success && res.user) {
        setUser(res.user);
        // New registrations must verify their email before onboarding/app access.
        window.location.href = buildVerifyUrl(res.user.email);
      } else if (res.needsVerification && res.email) {
        window.location.href = buildVerifyUrl(res.email);
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (data: {
    email: string;
    password: string;
    fullName?: string;
    full_name?: string;
    username?: string;
    phone?: string;
    redirectTo?: string;
  }) => {
    setIsLoading(true);
    const email = data.email || "";
    const password = data.password || "";
    const fullName = data.fullName || data.full_name || "";
    const username = data.username || undefined;
    const redirectTo = data.redirectTo;

    try {
      const res = await registerAction({ email, password, fullName, username });

      if (res.success && res.user) {
        setUser(res.user);
        toast.success("Account created! Please verify your email to continue.");
        window.location.href = buildVerifyUrl(res.user.email, redirectTo);
        return { data: res.user, error: null };
      }

      if (res.needsVerification && res.email) {
        window.location.href = buildVerifyUrl(res.email, redirectTo);
        return {
          data: null,
          error: {
            message: res.error || "Please verify your email.",
            needsVerification: true,
            email: res.email,
          },
        };
      }

      const errorMsg = res.error || "Failed to create account";
      toast.error(errorMsg);
      return { data: null, error: { message: errorMsg } };
    } catch (err: any) {
      const errorMsg = err.message || "Registration failed";
      toast.error(errorMsg);
      return { data: null, error: { message: errorMsg } };
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutAction();
    setUser(null);
    toast.info("Signed out");
    window.location.href = "/login";
  };

  const handleSignInWithOAuth = async (provider: string) => {
    setIsLoading(true);
    if (provider === "google") {
      window.location.href = "/api/auth/oauth/google";
      return { data: null, error: null };
    }
    return { data: null, error: { message: "Provider not supported" } };
  };

  const handleVerifyOtp = async (input: {
    email: string;
    otp: string;
    type?: "verify" | "recovery";
  }) => {
    setIsLoading(true);
    try {
      const email = input.email || "";
      const otp = input.otp || "";
      const type = input.type || "verify";
      const res = await verifyOtpAction({ email, otp, type });

      if (res.success) {
        if (res.user) setUser(res.user);
        if (type === "verify") {
          toast.success("Email verified successfully!");
        }
        return { error: null, data: res };
      }
      const errorMsg = res.error || "Invalid verification code";
      toast.error(errorMsg);
      return { error: { message: errorMsg } };
    } catch (err: any) {
      const errorMsg = err.message || "Invalid verification code";
      toast.error(errorMsg);
      return { error: { message: errorMsg } };
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVerificationEmail = async (email: string) => {
    setIsLoading(true);
    try {
      const res = await sendVerificationEmailAction({ email });
      if (res.success) {
        if (!res.alreadyVerified) {
          toast.success("Verification code sent to your email!");
        }
        return { error: null };
      }
      const errorMsg = res.error || "Failed to send verification code";
      toast.error(errorMsg);
      return { error: { message: errorMsg } };
    } catch (err: any) {
      const errorMsg = err.message || "Failed to send verification code";
      toast.error(errorMsg);
      return { error: { message: errorMsg } };
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendRecoveryOtp = async (email: string) => {
    setIsLoading(true);
    try {
      const res = await sendRecoveryOtpAction({ email });
      if (res.success) {
        toast.success("Verification code sent to your email!");
        return { error: null };
      }
      toast.error(res.error || "Failed to send recovery code");
      return { error: { message: res.error || "Failed to send recovery code" } };
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (input: {
    email: string;
    newPassword: string;
    otp?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await resetPasswordAction({
        email: input.email,
        newPassword: input.newPassword,
        otp: input.otp,
      });
      if (res.success) {
        toast.success("Password reset successfully! Please sign in.");
        window.location.href = "/login";
        return { error: null };
      }
      toast.error(res.error || "Failed to reset password");
      return { error: { message: res.error || "Failed to reset password" } };
    } catch (err: any) {
      const errorMsg = err.message || "Failed to reset password";
      toast.error(errorMsg);
      return { error: { message: errorMsg } };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loading: isLoading,
        setUser,
        login: handleLogin,
        signInWithPassword: handleSignInWithPassword,
        register: handleRegister,
        signUp: handleSignUp,
        logout: handleLogout,
        signOut: handleLogout,
        signInWithOAuth: handleSignInWithOAuth,
        verifyOtp: handleVerifyOtp,
        sendVerificationEmail: handleSendVerificationEmail,
        sendRecoveryOtp: handleSendRecoveryOtp,
        resetPassword: handleResetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
