"use client";

import React, { createContext, useContext, useState } from "react";
import type { SafeUserDto } from "@/lib/types/auth";
import {
  loginAction,
  registerAction,
  logoutAction,
  sendRecoveryOtpAction,
  sendVerificationEmailAction,
  sendVerificationOtpAction,
  verifyOtpAction,
  resetPasswordAction,
} from "@/lib/server-functions/auth";
import { toast } from "sonner";

export interface AuthError {
  message: string;
  needsVerification?: boolean;
  email?: string;
  phone?: string;
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
    password?: string;
    redirectTo?: string;
  }) => Promise<{
    data?: SafeUserDto | null;
    error: AuthError | null;
    requires2FA?: boolean;
    isSetup?: boolean;
    email?: string;
    challengeToken?: string;
    secret?: string;
    qrCodeUri?: string;
    hasEmailOtpOption?: boolean;
  }>;
  /** Legacy alias kept for compatibility — positional form. */
  register: (email: string, pass: string, fullName: string, username?: string) => Promise<any>;
  signUp: (data: {
    email?: string;
    phone?: string;
    password: string;
    fullName?: string;
    full_name?: string;
    username?: string;
    redirectTo?: string;
  }) => Promise<{ data?: SafeUserDto | null; error: AuthError | null }>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: string) => Promise<{ data?: any; error: { message: string } | null }>;
  verifyOtp: (input: {
    email?: string;
    phone?: string;
    otp: string;
    type?: "verify" | "recovery";
  }) => Promise<{
    error: AuthError | null;
    data?: any;
  }>;
  sendVerificationEmail: (email: string) => Promise<{ error: AuthError | null }>;
  sendVerificationOtp: (target: { email?: string; phone?: string } | string) => Promise<{ error: AuthError | null }>;
  sendRecoveryOtp: (email: string) => Promise<{ error: AuthError | null }>;
  resetPassword: (input: { email: string; newPassword: string; otp?: string }) => Promise<{
    error: AuthError | null;
  }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Builds the `/verify` URL used whenever an account exists but is not yet verified.
 */
function buildVerifyUrl(target: { email?: string; phone?: string } | string, next?: string | null): string {
  const params = new URLSearchParams();
  if (typeof target === "string") {
    if (target.includes("@")) {
      if (!target.endsWith("@phone.fextiva.com")) params.set("email", target);
      else {
        const phoneDigits = (target.split("@")[0] ?? "").replace(/^phone_/, "");
        params.set("phone", phoneDigits);
      }
    } else {
      params.set("phone", target);
    }
  } else {
    if (target.phone) {
      params.set("phone", target.phone);
    } else if (target.email && !target.email.endsWith("@phone.fextiva.com")) {
      params.set("email", target.email);
    } else if (target.email && target.email.endsWith("@phone.fextiva.com")) {
      const phoneDigits = (target.email.split("@")[0] ?? "").replace(/^phone_/, "");
      params.set("phone", phoneDigits);
    }
  }
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
      } else if (res.needsVerification) {
        window.location.href = buildVerifyUrl({ email: res.email, phone: res.phone || identifier });
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInWithPassword = async (credentials: {
    identifier?: string;
    email?: string;
    password?: string;
    redirectTo?: string;
  }) => {
    setIsLoading(true);
    const id = credentials.identifier || credentials.email || "";
    const password = credentials.password || "";
    const redirectTo = credentials.redirectTo;

    try {
      const res = await loginAction({ identifier: id, password });

      if (res.needsVerification) {
        window.location.href = buildVerifyUrl(
          { email: res.email, phone: res.phone || (id.includes("@") ? undefined : id) },
          redirectTo
        );
        return {
          data: null,
          error: {
            message: res.error || "Please verify your account.",
            needsVerification: true,
            email: res.email,
            phone: res.phone,
          },
        };
      }

      if (res.requires2FA) {
        return {
          data: null,
          error: null,
          requires2FA: true,
          isSetup: res.isSetup,
          email: res.email,
          challengeToken: res.challengeToken,
          secret: res.secret,
          qrCodeUri: res.qrCodeUri,
          hasEmailOtpOption: res.hasEmailOtpOption,
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
        const errorMsg = res.error || "Invalid email/phone/username or password";
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
        window.location.href = buildVerifyUrl({ email: res.user.email, phone: res.phone });
      } else if (res.needsVerification) {
        window.location.href = buildVerifyUrl({ email: res.email, phone: res.phone });
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (data: {
    email?: string;
    phone?: string;
    password: string;
    fullName?: string;
    full_name?: string;
    username?: string;
    redirectTo?: string;
  }) => {
    setIsLoading(true);
    const email = data.email || undefined;
    const phone = data.phone || undefined;
    const password = data.password || "";
    const fullName = data.fullName || data.full_name || "";
    const username = data.username || undefined;
    const redirectTo = data.redirectTo;

    try {
      const res = await registerAction({ email, phone, password, fullName, username });

      if (res.success && res.user) {
        setUser(res.user);
        const isPhone = Boolean(res.phone || phone);
        toast.success(isPhone ? "Account created! Please verify your phone number." : "Account created! Please verify your email.");
        window.location.href = buildVerifyUrl({ email: res.user.email, phone: res.phone || phone }, redirectTo);
        return { data: res.user, error: null };
      }

      if (res.needsVerification) {
        window.location.href = buildVerifyUrl({ email: res.email, phone: res.phone || phone }, redirectTo);
        return {
          data: null,
          error: {
            message: res.error || "Please verify your account.",
            needsVerification: true,
            email: res.email,
            phone: res.phone || phone,
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
    email?: string;
    phone?: string;
    otp: string;
    type?: "verify" | "recovery";
  }) => {
    setIsLoading(true);
    try {
      const email = input.email || undefined;
      const phone = input.phone || undefined;
      const otp = input.otp || "";
      const type = input.type || "verify";
      const res = await verifyOtpAction({ email, phone, otp, type });

      if (res.success) {
        if (res.user) setUser(res.user);
        if (type === "verify") {
          toast.success(phone ? "Phone verified successfully!" : "Email verified successfully!");
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

  const handleSendVerificationOtp = async (target: { email?: string; phone?: string } | string) => {
    setIsLoading(true);
    try {
      const payload = typeof target === "string"
        ? (target.includes("@") ? { email: target } : { phone: target })
        : target;
      const res = await sendVerificationOtpAction(payload);
      if (res.success) {
        if (!res.alreadyVerified) {
          toast.success(payload.phone ? "Verification code sent to your phone!" : "Verification code sent to your email!");
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
        sendVerificationOtp: handleSendVerificationOtp,
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
