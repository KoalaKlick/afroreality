"use client";

import React, { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import {
	ShieldCheck,
	Smartphone,
	Mail,
	Copy,
	Check,
	Loader2,
	ArrowLeft,
	KeyRound,
	RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import {
	confirmSuperAdmin2FASetupAction,
	verify2FALoginAction,
	sendAdmin2StepOtpAction,
} from "@/lib/server-functions/admin-2fa";

export interface TwoFactorChallengeData {
	isSetup: boolean;
	email: string;
	challengeToken: string;
	secret?: string;
	qrCodeUri?: string;
	hasEmailOtpOption?: boolean;
}

interface TwoFactorChallengeProps {
	readonly data: TwoFactorChallengeData;
	readonly onCancel: () => void;
	readonly redirectTo?: string | null;
}

export function TwoFactorChallenge({
	data,
	onCancel,
	redirectTo,
}: TwoFactorChallengeProps) {
	const [method, setMethod] = useState<"totp" | "email">("totp");
	const [code, setCode] = useState("");
	const [loading, setLoading] = useState(false);
	const [resending, setResending] = useState(false);
	const [cooldown, setCooldown] = useState(0);
	const [copied, setCopied] = useState(false);
	const [error, setError] = useState("");

	// Cooldown timer for resending email OTP
	useEffect(() => {
		if (cooldown <= 0) return;
		const timer = setInterval(() => {
			setCooldown((c) => Math.max(0, c - 1));
		}, 1000);
		return () => clearInterval(timer);
	}, [cooldown]);

	const maskedEmail = (() => {
		const parts = data.email.split("@");
		if (parts.length !== 2) return data.email;
		const name = parts[0]!;
		const domain = parts[1]!;
		const visible = name.slice(0, 2);
		return `${visible}***@${domain}`;
	})();

	const handleCopySecret = async () => {
		if (!data.secret) return;
		try {
			await navigator.clipboard.writeText(data.secret);
			setCopied(true);
			toast.success("Secret key copied to clipboard");
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error("Could not copy secret key");
		}
	};

	const handleSwitchToEmail = async () => {
		setError("");
		setMethod("email");
		setCode("");

		if (cooldown <= 0) {
			setResending(true);
			try {
				const res = await sendAdmin2StepOtpAction({
					email: data.email,
					challengeToken: data.challengeToken,
				});
				if (res.success) {
					toast.success(res.message || "Verification code sent to your email.");
					setCooldown(60);
				} else {
					setError(res.error || "Failed to send verification email.");
					toast.error(res.error || "Failed to send verification email.");
				}
			} finally {
				setResending(false);
			}
		}
	};

	const handleResendEmailOtp = async () => {
		if (cooldown > 0 || resending) return;
		setResending(true);
		setError("");

		try {
			const res = await sendAdmin2StepOtpAction({
				email: data.email,
				challengeToken: data.challengeToken,
			});
			if (res.success) {
				toast.success(res.message || "New code sent to your email.");
				setCooldown(60);
			} else {
				setError(res.error || "Failed to resend verification email.");
				toast.error(res.error || "Failed to resend verification email.");
			}
		} finally {
			setResending(false);
		}
	};

	const handleSubmit = async (codeToSubmit?: string) => {
		const finalCode = (codeToSubmit || code).trim();
		if (finalCode.length !== 6) {
			setError("Please enter the 6-digit code.");
			return;
		}

		setLoading(true);
		setError("");

		try {
			if (data.isSetup) {
				// Initial TOTP Authenticator Setup
				const res = await confirmSuperAdmin2FASetupAction({
					email: data.email,
					challengeToken: data.challengeToken,
					code: finalCode,
				});

				if (res.success) {
					toast.success("Authenticator 2FA configured! Signed in successfully.");
					window.location.href = redirectTo || res.nextUrl || "/super";
				} else {
					setError(res.error || "Invalid verification code.");
					toast.error(res.error || "Invalid verification code.");
				}
			} else {
				// 2FA Login Challenge (TOTP or Email)
				const res = await verify2FALoginAction({
					email: data.email,
					challengeToken: data.challengeToken,
					code: finalCode,
					method,
				});

				if (res.success) {
					toast.success("Security verification passed! Signed in.");
					window.location.href = redirectTo || res.nextUrl || "/super";
				} else {
					setError(res.error || "Invalid verification code.");
					toast.error(res.error || "Invalid verification code.");
				}
			}
		} catch (err: any) {
			const msg = err?.message || "Verification failed. Please try again.";
			setError(msg);
			toast.error(msg);
		} finally {
			setLoading(false);
		}
	};

	// Auto-submit when user finishes entering all 6 digits
	const handleOtpChange = (val: string) => {
		setCode(val);
		setError("");
		if (val.length === 6) {
			handleSubmit(val);
		}
	};

	return (
		<div className="space-y-6">
			{/* Top Header Badge */}
			<div className="flex flex-col items-center text-center space-y-2">
				
				<div>
					<h3 className="text-xl font-bold text-foreground font-millik">
						{data.isSetup
							? "Set Up Authenticator App"
							: method === "totp"
								? "Two-Factor Authentication"
								: "2-Step Email Verification"}
					</h3>
					<p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto leading-relaxed">
						{data.isSetup
							? "Super administrator access requires two-factor authentication via Microsoft Authenticator or Google Authenticator."
							: method === "totp"
								? "Enter the 6-digit code from Microsoft Authenticator or Google Authenticator."
								: `Enter the 6-digit verification code sent to ${maskedEmail}.`}
					</p>
				</div>
			</div>

			{/* ── Top Method Switcher Tabs (When logging in) ── */}
			{!data.isSetup && (
				<div className="grid grid-cols-2 p-1 bg-muted/70 rounded-md text-xs font-medium border border-border">
					<button
						type="button"
						onClick={() => {
							setMethod("totp");
							setError("");
							setCode("");
						}}
						className={cn(
							"flex items-center justify-center gap-1.5 py-2 px-3 rounded-sm transition-all",
							method === "totp"
								? "bg-background text-foreground shadow-sm font-semibold"
								: "text-muted-foreground hover:text-foreground"
						)}
					>
						<Smartphone className="size-3.5 text-primary" />
						<span>Authenticator App</span>
					</button>
					<button
						type="button"
						onClick={handleSwitchToEmail}
						className={cn(
							"flex items-center justify-center gap-1.5 py-2 px-3 rounded-sm transition-all",
							method === "email"
								? "bg-background text-foreground shadow-sm font-semibold"
								: "text-muted-foreground hover:text-foreground"
						)}
					>
						<Mail className="size-3.5 text-primary" />
						<span>Email OTP</span>
					</button>
				</div>
			)}

			{/* ── Case 1: First-Time Authenticator Setup ── */}
			{data.isSetup && (
				<div className="space-y-4">
					{/* QR Code Container */}
					{data.qrCodeUri && (
						<div className="bg-background p-2 rounded-sm border border-border flex flex-col items-center justify-center mx-auto max-w-[210px]">
							<QRCode
								value={data.qrCodeUri}
								size={170}
								style={{ height: "auto", maxWidth: "100%", width: "100%" }}
								viewBox="0 0 256 256"
							/>
						</div>
					)}

					{/* Manual Secret Key */}
					{data.secret && (
						<div className="rounded-sm bg-muted/50 p-3 space-y-1 text-center">
							<p className="text-[11px] font-medium text-muted-foreground">
								Can't scan the QR code? Enter this key manually:
							</p>
							<div className="flex items-center justify-center gap-2">
								<code className="font-mono text-xs font-bold text-foreground select-all tracking-wider px-2 py-1 rounded bg-background border">
									{data.secret}
								</code>
								<Button
									type="button"
									variant="outline"
									size="icon"
									className="size-7 shrink-0"
									onClick={handleCopySecret}
									title="Copy secret key"
								>
									{copied ? (
										<Check className="size-3.5 text-emerald-600" />
									) : (
										<Copy className="size-3.5 text-muted-foreground" />
									)}
								</Button>
							</div>
						</div>
					)}
				</div>
			)}

			{/* ── OTP Input Form ── */}
			<div className="space-y-4 flex flex-col items-center">
				<div className="flex justify-center w-full">
					<InputOTP
						maxLength={6}
						value={code}
						onChange={handleOtpChange}
						disabled={loading}
					>
						<InputOTPGroup className="gap-2 sm:gap-2.5">
							<InputOTPSlot index={0} className="rounded-lg border size-11 sm:size-12 text-lg font-bold" />
							<InputOTPSlot index={1} className="rounded-lg border size-11 sm:size-12 text-lg font-bold" />
							<InputOTPSlot index={2} className="rounded-lg border size-11 sm:size-12 text-lg font-bold" />
							<InputOTPSlot index={3} className="rounded-lg border size-11 sm:size-12 text-lg font-bold" />
							<InputOTPSlot index={4} className="rounded-lg border size-11 sm:size-12 text-lg font-bold" />
							<InputOTPSlot index={5} className="rounded-lg border size-11 sm:size-12 text-lg font-bold" />
						</InputOTPGroup>
					</InputOTP>
				</div>

				{error && (
					<p className="text-xs text-destructive text-center font-medium max-w-xs">
						{error}
					</p>
				)}

				<Button
					type="button"
					className="w-full rounded-full font-bold h-11 text-xs gap-2"
					style={{ backgroundColor: "var(--color-brand-primary, #009A44)" }}
					onClick={() => handleSubmit()}
					disabled={loading || code.length !== 6}
				>
					{loading ? (
						<>
							<Loader2 className="size-4 animate-spin" />
							Verifying...
						</>
					) : data.isSetup ? (
						<>
							<KeyRound className="size-4" />
							Confirm & Activate 2FA
						</>
					) : (
						<>
							<ShieldCheck className="size-4" />
							Authorize & Sign In
						</>
					)}
				</Button>
			</div>

			{/* ── Alternative Method / Options ── */}
			{!data.isSetup && (
				<div className="space-y-3 pt-3 border-t border-border/60 text-center">
					{method === "totp" ? (
						<div className="space-y-2">
							<p className="text-xs text-muted-foreground">
								Don't have your authenticator app handy?
							</p>
							<Button
								type="button"
								variant="outline"
								onClick={handleSwitchToEmail}
								disabled={resending}
								className="w-full h-10 rounded-sm text-xs font-semibold border-border hover:bg-muted inline-flex items-center justify-center gap-2"
							>
								<Mail className="size-4 text-primary" />
								<span>Send code to email instead</span>
							</Button>
						</div>
					) : (
						<div className="space-y-2.5">
							<div>
								<button
									type="button"
									onClick={handleResendEmailOtp}
									disabled={resending || cooldown > 0}
									className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold disabled:opacity-50"
								>
									<RefreshCw className={cn("size-3.5", resending && "animate-spin")} />
									<span>
										{cooldown > 0
											? `Resend email code in ${cooldown}s`
											: "Resend verification code"}
									</span>
								</button>
							</div>

							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setMethod("totp");
									setError("");
									setCode("");
								}}
								className="w-full h-10 rounded-sm text-xs font-semibold border-border hover:bg-muted inline-flex items-center justify-center gap-2"
							>
								<Smartphone className="size-4" />
								<span>Use Authenticator App instead</span>
							</Button>
						</div>
					)}
				</div>
			)}

			{/* Back Button */}
			<div className="flex justify-center pt-1">
				<button
					type="button"
					onClick={onCancel}
					className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
				>
					<ArrowLeft className="size-3.5" />
					<span>Back to Sign In</span>
				</button>
			</div>
		</div>
	);
}
