"use client";
// src/components/shared/ConfirmPasswordDialog.tsx
// Universal modal that challenges the user for their password (or fallback email OTP)
// before proceeding with a sensitive action (e.g. payout details change, withdrawal).

import { Eye, EyeOff, Loader2, Mail, ShieldCheck } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import {
	checkUserHasPassword,
	verifyUserPassword,
	sendSensitiveActionOtp,
	verifySensitiveActionOtp,
} from "@/lib/server-functions/_auth";

interface ConfirmPasswordDialogProps {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly title?: string;
	readonly description?: string;
	readonly confirmLabel?: string;
	readonly onConfirm: () => Promise<void> | void;
}

export function ConfirmPasswordDialog({
	open,
	onOpenChange,
	title = "Confirm Security Check",
	description = "Please confirm your password to proceed with this sensitive action.",
	confirmLabel = "Confirm",
	onConfirm,
}: ConfirmPasswordDialogProps) {
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isVerifying, setIsVerifying] = useState(false);
	const [hasPassword, setHasPassword] = useState<boolean | null>(null);

	// OTP fallback states
	const [verificationMode, setVerificationMode] = useState<"password" | "otp" | "loading">("loading");
	const [otp, setOtp] = useState("");
	const [otpSent, setOtpSent] = useState(false);
	const [maskedEmail, setMaskedEmail] = useState("");
	const [resendTimer, setResendTimer] = useState(0);

	const passwordInputRef = useRef<HTMLInputElement>(null);
	const otpInputRef = useRef<HTMLInputElement>(null);

	// Check if user has a password set on mount/open
	useEffect(() => {
		if (open) {
			setPassword("");
			setOtp("");
			setOtpSent(false);
			setIsVerifying(false);
			setVerificationMode("loading");

			checkUserHasPassword()
				.then(({ hasPassword: exists }) => {
					setHasPassword(exists);
					if (exists) {
						setVerificationMode("password");
						setTimeout(() => passwordInputRef.current?.focus(), 150);
					} else {
						// User created account via OAuth and has no password ?" use email OTP directly
						setVerificationMode("otp");
					}
				})
				.catch(() => {
					setVerificationMode("password");
				});
		}
	}, [open]);

	// Countdown timer for OTP resend
	useEffect(() => {
		if (resendTimer <= 0) return;
		const interval = setInterval(() => {
			setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
		}, 1000);
		return () => clearInterval(interval);
	}, [resendTimer]);

	function handleOpenChange(newOpen: boolean) {
		if (isVerifying) return; // Prevent closing while processing
		if (!newOpen) {
			setPassword("");
			setOtp("");
			setOtpSent(false);
			setShowPassword(false);
		}
		onOpenChange(newOpen);
	}

	// Trigger sending of OTP email
	async function handleSendOtp() {
		setIsVerifying(true);
		try {
			const res = await sendSensitiveActionOtp();
			if (res.success) {
				setOtpSent(true);
				setMaskedEmail(res.email || "");
				setResendTimer(60); // 60s cooldown
				toast.success("Verification code sent to your email.");
				setTimeout(() => otpInputRef.current?.focus(), 100);
			} else {
				toast.error(res.error || "Failed to send verification code.");
			}
		} catch (err: any) {
			const msg = err?.message || "Failed to send verification code.";
			toast.error(msg);
		} finally {
			setIsVerifying(false);
		}
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		if (verificationMode === "password") {
			if (!password.trim()) {
				toast.error("Please enter your password.");
				passwordInputRef.current?.focus();
				return;
			}

			setIsVerifying(true);
			try {
				const res = await verifyUserPassword({ data: { password } });
				if (!res.success) {
					toast.error(res.error || "Incorrect password. Please try again.");
					setPassword("");
					passwordInputRef.current?.focus();
					return;
				}
				// Password verified successfully - run the actual action
				await onConfirm();
				onOpenChange(false);
			} catch (err: any) {
				const msg = err?.message || "Incorrect password. Please try again.";
				toast.error(msg);
				setPassword("");
				passwordInputRef.current?.focus();
			} finally {
				setIsVerifying(false);
			}
		} else if (verificationMode === "otp") {
			if (!otpSent) {
				await handleSendOtp();
				return;
			}

			if (otp.length !== 6) {
				toast.error("Please enter the 6-digit verification code.");
				otpInputRef.current?.focus();
				return;
			}

			setIsVerifying(true);
			try {
				const res = await verifySensitiveActionOtp({ data: { otp } });
				if (!res.success) {
					toast.error(res.error || "Invalid code. Please try again.");
					setOtp("");
					otpInputRef.current?.focus();
					return;
				}
				// OTP verified successfully - run the actual action
				await onConfirm();
				onOpenChange(false);
			} catch (err: any) {
				const msg = err?.message || "Invalid code. Please try again.";
				toast.error(msg);
				setOtp("");
				otpInputRef.current?.focus();
			} finally {
				setIsVerifying(false);
			}
		}
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<ShieldCheck className="h-5 w-5 text-primary" />
						{title}
					</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				{verificationMode === "loading" ? (
					<div className="flex flex-col items-center justify-center py-8 space-y-2">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
						<p className="text-sm text-muted-foreground">Preparing secure verification...</p>
					</div>
				) : (
					<form onSubmit={handleSubmit} className="space-y-4 py-2">
						{verificationMode === "password" && (
							<div className="space-y-3">
								<div className="space-y-2">
									<Label htmlFor="confirm-password-input">Password</Label>
									<div className="relative">
										<Input
											id="confirm-password-input"
											ref={passwordInputRef}
											type={showPassword ? "text" : "password"}
											value={password}
											onChange={(e) => setPassword(e.target.value)}
											placeholder="Enter your account password"
											disabled={isVerifying}
											autoComplete="current-password"
											className="pr-10"
										/>
										<button
											type="button"
											tabIndex={-1}
											onClick={() => setShowPassword((v) => !v)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
											aria-label={showPassword ? "Hide password" : "Show password"}
										>
											{showPassword ? (
												<EyeOff className="h-4 w-4" />
											) : (
												<Eye className="h-4 w-4" />
											)}
										</button>
									</div>
								</div>

								<div className="flex justify-end">
									<Button
										type="button"
										variant="link"
										size="sm"
										className="text-xs p-0 h-auto"
										onClick={() => {
											setVerificationMode("otp");
											handleSendOtp();
										}}
										disabled={isVerifying}
									>
										Verify with email code instead
									</Button>
								</div>
							</div>
						)}

						{verificationMode === "otp" && (
							<div className="space-y-4">
								{!otpSent ? (
									<div className="text-center py-2 space-y-3">
										<div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
											<Mail className="h-6 w-6 text-primary" />
										</div>
										<p className="text-sm text-muted-foreground">
											We will send a 6-digit verification code to your registered email address to verify your identity.
										</p>
										<Button
											type="button"
											onClick={handleSendOtp}
											disabled={isVerifying}
											className="w-full"
										>
											{isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
											Send Verification Code
										</Button>
									</div>
								) : (
									<div className="space-y-3">
										<div className="space-y-2 flex flex-col items-center">
											<Label htmlFor="confirm-otp-input" className="self-start">Verification Code</Label>
											<div className="flex justify-center w-full py-2">
												<InputOTP
													id="confirm-otp-input"
													ref={otpInputRef}
													maxLength={6}
													value={otp}
													onChange={setOtp}
													disabled={isVerifying}
												>
													<InputOTPGroup>
														<InputOTPSlot index={0} />
														<InputOTPSlot index={1} />
														<InputOTPSlot index={2} className="rounded-r-none!" />
													</InputOTPGroup>
													<InputOTPSeparator />
													<InputOTPGroup>
														<InputOTPSlot index={3} className="rounded-l-none!" />
														<InputOTPSlot index={4} />
														<InputOTPSlot index={5} />
													</InputOTPGroup>
												</InputOTP>
											</div>
										</div>

										<p className="text-xs text-muted-foreground text-center">
											Sent to <span className="font-medium text-foreground">{maskedEmail}</span>
										</p>

										<div className="flex justify-center">
											<Button
												type="button"
												variant="link"
												size="sm"
												className="text-xs"
												onClick={handleSendOtp}
												disabled={isVerifying || resendTimer > 0}
											>
												{resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend code"}
											</Button>
										</div>

										{hasPassword && (
											<div className="flex justify-end">
												<Button
													type="button"
													variant="link"
													size="sm"
													className="text-xs p-0 h-auto"
													onClick={() => setVerificationMode("password")}
													disabled={isVerifying}
												>
													Verify with password instead
												</Button>
											</div>
										)}
									</div>
								)}
							</div>
						)}

						<DialogFooter className="pt-2 gap-2 sm:gap-0">
							<Button
								type="button"
								variant="ghost"
								onClick={() => handleOpenChange(false)}
								disabled={isVerifying}
							>
								Cancel
							</Button>
							{/* Only show confirm button when password mode is active or OTP code is ready to submit */}
							{(verificationMode === "password" || otpSent) && (
								<Button
									type="submit"
									disabled={
										isVerifying ||
										(verificationMode === "password" && !password.trim()) ||
										(verificationMode === "otp" && otp.length !== 6)
									}
								>
									{isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
									{isVerifying ? "Verifying..." : confirmLabel}
								</Button>
							)}
						</DialogFooter>
					</form>
				)}
			</DialogContent>
		</Dialog>
	);
}
