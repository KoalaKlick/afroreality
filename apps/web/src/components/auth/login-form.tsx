"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Lock, User, Loader2, Phone, ArrowLeft, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { EmailVerifiedIllustration } from "@/components/auth/EmailVerifiedIllustration";
import { GoogleIcon } from "@/components/shared/google-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { TwoFactorChallenge, type TwoFactorChallengeData } from "@/components/auth/TwoFactorChallenge";
import {
	sendPhoneLoginOtp,
	verifyPhoneLoginOtp,
} from "@/lib/server-functions/auth";

type LoginMode = "credentials" | "phone_input" | "phone_otp";

export function LoginForm({
	verified,
	next,
}: {
	verified?: boolean;
	next?: string | null;
}) {
	const { signInWithPassword, signInWithOAuth, loading } = useAuth();
	// Shared state
	const [mode, setMode] = useState<LoginMode>("credentials");
	const [submitting, setSubmitting] = useState(false);

	// Credentials mode
	const [identifier, setIdentifier] = useState("");
	const [password, setPassword] = useState("");
	const [twoFactorData, setTwoFactorData] = useState<TwoFactorChallengeData | null>(null);

	// Phone mode
	const [phoneNumber, setPhoneNumber] = useState("");
	const [otpCode, setOtpCode] = useState("");
	const [maskedPhone, setMaskedPhone] = useState("");
	const [otpChannel, setOtpChannel] = useState<"sms" | "whatsapp">("sms");
	const [resendTimer, setResendTimer] = useState(0);

	// ── Credential login ──────────────────────────────
	const handleCredentialSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const cleanId = identifier.trim();
		const cleanPass = password;

		if (!cleanId) {
			toast.error("Please enter your email, phone number, or username.");
			return;
		}
		if (!cleanPass) {
			toast.error("Please enter your password.");
			return;
		}

		setSubmitting(true);
		try {
			const res = await signInWithPassword({
				identifier: cleanId,
				password: cleanPass,
				redirectTo: next ?? undefined,
			});
			if ((res as any)?.requires2FA) {
				setTwoFactorData(res as any);
			}
		} catch {
			// Toast is handled in auth-provider
		} finally {
			setSubmitting(false);
		}
	};

	// ── Phone OTP: send code ──────────────────────────
	const handleSendPhoneOtp = async (e: React.FormEvent) => {
		e.preventDefault();
		const phone = phoneNumber.trim();
		if (!phone) {
			toast.error("Please enter your phone number.");
			return;
		}

		setSubmitting(true);
		try {
			const res = await sendPhoneLoginOtp({ phone });
			if (res.success) {
				setMaskedPhone(res.maskedPhone || phone);
				setOtpChannel(res.channel || "sms");
				setMode("phone_otp");
				startResendTimer();
				toast.success(
					`Verification code sent via ${res.channel === "whatsapp" ? "WhatsApp" : "SMS"} to ${res.maskedPhone}`
				);
			} else {
				toast.error(res.error || "Failed to send code");
			}
		} catch {
			toast.error("Something went wrong.");
		} finally {
			setSubmitting(false);
		}
	};

	// ── Phone OTP: verify code ────────────────────────
	const handleVerifyOtp = async (e: React.FormEvent) => {
		e.preventDefault();
		const code = otpCode.trim();
		if (!code || code.length < 6) {
			toast.error("Please enter the 6-digit code.");
			return;
		}

		setSubmitting(true);
		try {
			const res = await verifyPhoneLoginOtp({
				phone: phoneNumber,
				otp: code,
				redirectTo: next ?? undefined,
			});

			if (res.success && res.user) {
				toast.success("Signed in successfully!");
				const nextUrl =
					next || (res.onboardingCompleted ? "/dashboard" : "/onboarding");
				window.location.href = nextUrl;
			} else {
				toast.error(res.error || "Verification failed");
			}
		} catch {
			toast.error("Something went wrong.");
		} finally {
			setSubmitting(false);
		}
	};

	// ── Resend timer ──────────────────────────────────
	const startResendTimer = () => {
		setResendTimer(60);
		const interval = setInterval(() => {
			setResendTimer((prev) => {
				if (prev <= 1) {
					clearInterval(interval);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
	};

	const handleResendOtp = async () => {
		setSubmitting(true);
		try {
			const res = await sendPhoneLoginOtp({ phone: phoneNumber });
			if (res.success) {
				startResendTimer();
				toast.success("New verification code sent!");
			} else {
				toast.error(res.error || "Failed to resend code");
			}
		} catch {
			toast.error("Something went wrong.");
		} finally {
			setSubmitting(false);
		}
	};

	const handleGoogleSignIn = () => {
		signInWithOAuth("google");
	};

	// ── 2FA Challenge ─────────────────────────────────
	if (twoFactorData) {
		return (
			<TwoFactorChallenge
				data={twoFactorData}
				onCancel={() => setTwoFactorData(null)}
				redirectTo={next}
			/>
		);
	}

	// ── Phone OTP Verification Screen ─────────────────
	if (mode === "phone_otp") {
		return (
			<div className="space-y-6">
				<div className="text-center space-y-2">
					<div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
						<KeyRound className="h-6 w-6 text-emerald-500" />
					</div>
					<h2 className="text-lg font-bold text-foreground">Enter verification code</h2>
					<p className="text-sm text-muted-foreground">
						We sent a code via {otpChannel === "whatsapp" ? "WhatsApp" : "SMS"} to{" "}
						<span className="font-medium text-foreground">{maskedPhone}</span>
					</p>
				</div>

				<form onSubmit={handleVerifyOtp} className="space-y-4">
					<Input
						icon={<KeyRound className="size-4" />}
						type="text"
						placeholder="Enter 6-digit code"
						inputMode="numeric"
						pattern="[0-9]*"
						maxLength={6}
						autoFocus
						autoComplete="one-time-code"
						value={otpCode}
						onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
						className="text-center text-lg tracking-[0.5em] font-mono"
						required
					/>

					<Button
						type="submit"
						className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2"
						disabled={submitting || loading || otpCode.length < 6}
					>
						{submitting ? (
							<>
								<Loader2 className="size-4 animate-spin" />
								Verifying...
							</>
						) : (
							"Verify & Sign In"
						)}
					</Button>
				</form>

				<div className="flex items-center justify-between text-xs">
					<button
						type="button"
						onClick={() => {
							setMode("phone_input");
							setOtpCode("");
						}}
						className="text-muted-foreground hover:text-foreground flex items-center gap-1"
					>
						<ArrowLeft className="h-3 w-3" />
						Change number
					</button>

					<button
						type="button"
						onClick={handleResendOtp}
						disabled={resendTimer > 0 || submitting}
						className={`font-medium ${
							resendTimer > 0
								? "text-muted-foreground cursor-not-allowed"
								: "text-emerald-600 hover:text-emerald-700"
						}`}
					>
						{resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
					</button>
				</div>
			</div>
		);
	}

	// ── Phone Input Screen ────────────────────────────
	if (mode === "phone_input") {
		return (
			<div className="space-y-6">
				<form onSubmit={handleSendPhoneOtp} className="space-y-4 md:space-y-6">
					<div>
						<Input
							icon={<Phone className="size-4" />}
							placeholder="Phone number (e.g. 0501234567)"
							name="phone"
							type="tel"
							autoComplete="tel"
							autoFocus
							value={phoneNumber}
							onChange={(e) => setPhoneNumber(e.target.value)}
							required
						/>
						<p className="text-[11px] text-muted-foreground mt-1.5 pl-1">
							We'll send a verification code to this number
						</p>
					</div>

					<Button
						type="submit"
						className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2"
						disabled={submitting || loading}
					>
						{submitting ? (
							<>
								<Loader2 className="size-4 animate-spin" />
								Sending code...
							</>
						) : (
							"Send Verification Code"
						)}
					</Button>
				</form>

				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-t" />
					</div>
					<div className="relative flex justify-center text-xs">
						<span className="bg-background px-2 text-muted-foreground">Or</span>
					</div>
				</div>

				<Button
					variant="outline"
					type="button"
					className="w-full rounded-full shadow-none"
					onClick={() => setMode("credentials")}
				>
					<Lock className="mr-2 h-4 w-4" />
					Use email & password instead
				</Button>

				<p className="text-sm text-center text-muted-foreground">
					Don't have an account?{" "}
					<Link
						href="/register"
						className="text-red-500 font-medium hover:underline"
					>
						Sign up
					</Link>
				</p>
			</div>
		);
	}

	// ── Default: Credential Login Screen ──────────────
	return (
		<div className="space-y-6">
			{verified && (
				<div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center gap-2">
					<EmailVerifiedIllustration className="size-24 text-green-500" />
					<p className="text-sm text-green-600 font-medium">
						Email verified! You can now log in.
					</p>
				</div>
			)}

			<form onSubmit={handleCredentialSubmit} className="space-y-4 md:space-y-6">
				<div>
					<Input
						icon={<User className="size-4" />}
						placeholder="Email, phone number, or username"
						name="identifier"
						type="text"
						autoComplete="username"
						value={identifier}
						onChange={(e) => setIdentifier(e.target.value)}
						required
					/>
				</div>

				<div className="space-y-1">
					<Input
						icon={<Lock className="size-4" />}
						type="password"
						placeholder="Password"
						name="password"
						autoComplete="current-password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>
					<div className="flex justify-end pt-1">
						<Link
							href="/forgot-password"
							className="text-xs text-muted-foreground hover:text-primary underline"
						>
							Forgot password?
						</Link>
					</div>
				</div>

				<Button
					type="submit"
					className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2"
					disabled={submitting || loading}
				>
					{submitting ? (
						<>
							<Loader2 className="size-4 animate-spin" />
							Signing in...
						</>
					) : (
						"Sign In"
					)}
				</Button>
			</form>

			<div className="relative">
				<div className="absolute inset-0 flex items-center">
					<span className="w-full border-t" />
				</div>
				<div className="relative flex justify-center text-xs">
					<span className="bg-background px-2 text-muted-foreground">
						Or continue with
					</span>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-3">
				<Button
					variant="outline"
					type="button"
					className="rounded-full shadow-none bg-neutral-50 hover:bg-neutral-100"
					onClick={handleGoogleSignIn}
					disabled={loading}
				>
					<GoogleIcon className="mr-2 h-4 w-4" />
					Google
				</Button>

				<Button
					variant="outline"
					type="button"
					className="rounded-full shadow-none bg-neutral-50 hover:bg-neutral-100"
					onClick={() => setMode("phone_input")}
					disabled={loading}
				>
					<Phone className="mr-2 h-4 w-4" />
					Phone OTP
				</Button>
			</div>

			<p className="text-sm text-center text-muted-foreground">
				Don't have an account?{" "}
				<Link
					href="/register"
					className="text-red-500 font-medium hover:underline"
				>
					Sign up
				</Link>
			</p>
		</div>
	);
}
