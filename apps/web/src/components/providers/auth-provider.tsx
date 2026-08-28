"use client";

import React, { createContext, useContext, useState } from "react";
import type { SafeUserDto } from "@/lib/types/auth";
import {
  loginAction,
  registerAction,
  googleOAuthAction,
  logoutAction,
  sendRecoveryOtpAction,
  verifyOtpAction,
  resetPasswordAction,
} from "@/lib/server-functions/auth";
import { toast } from "sonner";

export interface AuthContextType {
  user: SafeUserDto | null;
  isLoading: boolean;
  loading: boolean;
  setUser: (user: SafeUserDto | null) => void;
  login: (identifier: string, pass: string) => Promise<any>;
  signInWithPassword: (credentials: any, options?: any) => Promise<{ data?: any; error: { message: string } | null }>;
  register: (email: string, pass: string, fullName: string, username?: string) => Promise<any>;
  signUp: (data: any, options?: any, extra?: any) => Promise<{ data?: any; error: { message: string } | null }>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: string) => Promise<{ data?: any; error: { message: string } | null }>;
  updatePassword: (data: any, options?: any) => Promise<any>;
  verifyOtp: (data: any, options?: any, extra?: any) => Promise<any>;
  sendVerificationEmail: (email: string) => Promise<any>;
  sendRecoveryOtp: (email: string) => Promise<any>;
  resetPassword: (email: string, newPass?: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInWithPassword = async (credentials: any, options?: any) => {
    setIsLoading(true);
    const id = credentials.identifier || credentials.email || "";
    const password = credentials.password || "";
    const redirectTo = options?.redirectTo || credentials.redirectTo;

    try {
      const res = await loginAction({ identifier: id, password });
      if (res.success && res.user) {
        setUser(res.user);
        toast.success("Signed in successfully!");
        const nextUrl = redirectTo || (res.onboardingCompleted ? "/dashboard" : "/onboarding");
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
        window.location.href = "/onboarding";
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (data: any, options?: any) => {
    setIsLoading(true);
    const email = data.email || "";
    const password = data.password || "";
    const fullName = data.fullName || data.full_name || "";
    const username = data.username || undefined;
    const redirectTo = options?.redirectTo || data.redirectTo;

    try {
      const res = await registerAction({ email, password, fullName, username });
      if (res.success && res.user) {
        setUser(res.user);
        toast.success("Account created successfully!");
        const nextUrl = redirectTo || "/onboarding";
        window.location.href = nextUrl;
        return { data: res.user, error: null };
      } else {
        const errorMsg = res.error || "Failed to create account";
        toast.error(errorMsg);
        return { data: null, error: { message: errorMsg } };
      }
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

  const handleUpdatePassword = async (data: any) => {
    return { success: true };
  };

  const handleVerifyOtp = async (data: any) => {
    setIsLoading(true);
    try {
      const email = data.email || "";
      const otp = data.otp || data.token || "";
      const type = data.type || "recovery";
      const res = await verifyOtpAction({ email, otp, type });
      if (res.success) {
        toast.success("Verification successful!");
        return { error: null };
      }
      toast.error(res.error || "Invalid verification code");
      return { error: { message: res.error || "Invalid verification code" } };
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVerificationEmail = async (email: string) => {
    return { success: true };
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

  const handleResetPassword = async (email: string, newPass?: string) => {
    if (!newPass) return { success: false };
    setIsLoading(true);
    try {
      const res = await resetPasswordAction({ email, newPassword: newPass });
      if (res.success) {
        toast.success("Password reset successfully! Please sign in.");
        window.location.href = "/login";
        return { error: null };
      }
      toast.error(res.error || "Failed to reset password");
      return { error: { message: res.error || "Failed to reset password" } };
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
        updatePassword: handleUpdatePassword,
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
