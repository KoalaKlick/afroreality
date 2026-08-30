"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { OTPVerificationIllustration } from "@/components/auth/OTPVerificationIllustration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/use-auth";

export function ForgotPasswordContent({ expired }: { expired?: boolean }) {
	const { sendRecoveryOtp, verifyOtp, loading } = useAuth();
	const [step, setStep] = useState<"email" | "otp-verify">("email");
	const [email, setEmail] = useState("");
	const [otp, setOtp] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const handleEmailSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const cleanEmail = email.trim();
		if (!cleanEmail) {
			toast.error("Please enter your email address.");
			return;
		}

		setSubmitting(true);
		try {
			const res = await sendRecoveryOtp(cleanEmail);
			if (res?.error) {
				toast.error(res.error.message || "Failed to send reset code.");
			} else {
				setStep("otp-verify");
			}
		} catch (err: any) {
			toast.error(err?.message || "Failed to send reset code.");
		} finally {
			setSubmitting(false);
		}
	};

	const handleOtpSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (otp.length !== 6) {
			toast.error("Please enter the complete 6-digit code.");
			return;
		}

		setSubmitting(true);
		try {
			const res = await verifyOtp({ email: email.trim(), otp: otp.trim(), type: "recovery" });
			if (!res?.error) {
				window.location.href = `/reset-password?email=${encodeURIComponent(email.trim())}&otp=${encodeURIComponent(otp.trim())}`;
			}
		} catch (err: any) {
			toast.error(err?.message || "Invalid verification code.");
		} finally {
			setSubmitting(false);
		}
	};

	const handleResend = async () => {
		setSubmitting(true);
		try {
			await sendRecoveryOtp(email.trim());
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="space-y-6">
			{step === "email" ? (
				<form onSubmit={handleEmailSubmit} className="space-y-4">
					<div>
						<Input
							icon={<Mail className="size-4" />}
							type="email"
							placeholder="Enter your registered email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
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
			) : (
				<div className="space-y-6">
					<div className="flex flex-col items-center justify-center text-center space-y-2">
						<OTPVerificationIllustration className="size-24 text-emerald-500" />
						<p className="text-sm text-muted-foreground">
							We sent a 6-digit code to <strong className="text-foreground">{email}</strong>
						</p>
					</div>

					<form onSubmit={handleOtpSubmit} className="space-y-6">
						<div className="flex justify-center">
							<InputOTP maxLength={6} value={otp} onChange={setOtp}>
								<InputOTPGroup>
									<InputOTPSlot index={0} />
									<InputOTPSlot index={1} />
									<InputOTPSlot index={2} />
									<InputOTPSlot index={3} />
									<InputOTPSlot index={4} />
									<InputOTPSlot index={5} />
								</InputOTPGroup>
							</InputOTP>
						</div>

						<Button
							type="submit"
							className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2"
							disabled={submitting || otp.length !== 6 || loading}
						>
							{submitting ? (
								<>
									<Loader2 className="size-4 animate-spin" />
									Verifying...
								</>
							) : (
								"Verify & Continue"
							)}
						</Button>
					</form>

					<div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
						<button
							type="button"
							onClick={() => setStep("email")}
							className="hover:text-primary flex items-center gap-1 font-medium"
						>
							<ArrowLeft className="size-3.5" /> Back
						</button>
						<button
							type="button"
							onClick={handleResend}
							className="text-emerald-600 font-semibold hover:underline"
							disabled={submitting || loading}
						>
							Resend Code
						</button>
					</div>
				</div>
			)}

			<p className="text-sm text-center text-muted-foreground">
				Remember your password?{" "}
				<Link href="/login" className="text-red-500 font-medium hover:underline">
					Sign in
				</Link>
			</p>
		</div>
	);
}
