"use client";
// src/components/shared/ConfirmPasswordDialog.tsx
// Reusable dialog that requires the user to confirm their identity (password or email OTP)
// before proceeding with a sensitive action (e.g. payout details change, withdrawal).


import { Eye, EyeOff, Loader2, ShieldCheck, Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import { Label } from "@/components/ui/label";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
	InputOTPSeparator,
} from "@/components/ui/input-otp";
import {
	checkUserHasPassword,
	verifyUserPassword,
	sendSensitiveActionOtp,
	verifySensitiveActionOtp,
} from "@/lib/server-functions/_auth";

interface ConfirmPasswordDialogProps {
	/** Controls whether the dialog is visible */
	readonly open: boolean;
	/** Called when the dialog requests to close (cancel or after success) */
	readonly onOpenChange: (open: boolean) => void;
	/** Title shown at the top of the dialog */
	readonly title?: string;
	/** Description shown below the title */
	readonly description?: string;
	/**
	 * Async callback invoked only after authentication has been verified.
	 * Any error thrown here will be caught and toasted automatically.
	 */
	readonly onConfirm: () => Promise<void>;
	/** Label for the confirm button */
	readonly confirmLabel?: string;
}

export function ConfirmPasswordDialog({
	open,
	onOpenChange,
	title = "Confirm Security Verification",
	description = "For your security, please verify your identity to continue.",
	onConfirm,
	confirmLabel = "Confirm",
}: ConfirmPasswordDialogProps) {
	const [verificationMode, setVerificationMode] = useState<"loading" | "password" | "otp">("loading");
	const [hasPassword, setHasPassword] = useState<boolean | null>(null);

	// Password mode states
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isVerifying, setIsVerifying] = useState(false);
	const passwordInputRef = useRef<HTMLInputElement>(null);

	// OTP mode states
	const [otp, setOtp] = useState("");
	const [otpSent, setOtpSent] = useState(false);
	const [maskedEmail, setMaskedEmail] = useState("");
	const [resendTimer, setResendTimer] = useState(0);
	const otpInputRef = useRef<HTMLInputElement>(null);

	// Fetch account authentication status on open
	useEffect(() => {
		if (open) {
			setVerificationMode("loading");
			checkUserHasPassword()
				.then((res) => {
					setHasPassword(res.hasPassword);
					if (res.hasPassword) {
						setVerificationMode("password");
					} else {
						// User has no password (e.g. Google OAuth only), force OTP flow
						setVerificationMode("otp");
					}
				})
				.catch((err) => {
					console.error("Failed to check user password availability:", err);
					// Fallback to OTP flow if we cannot fetch password status safely
					setVerificationMode("otp");
				});
		} else {
			// Reset all states on close
			setPassword("");
			setShowPassword(false);
			setOtp("");
			setOtpSent(false);
			setMaskedEmail("");
			setIsVerifying(false);
			setResendTimer(0);
		}
	}, [open]);

	// Countdown timer for OTP resend button
	useEffect(() => {
		if (resendTimer > 0) {
			const interval = setInterval(() => {
				setResendTimer((prev) => prev - 1);
			}, 1000);
			return () => clearInterval(interval);
		}
	}, [resendTimer]);

	function handleOpenChange(next: boolean) {
		if (!isVerifying) {
			onOpenChange(next);
		}
	}

	// Trigger sending of OTP email
	async function handleSendOtp() {
		setIsVerifying(true);
		try {
			const res = await sendSensitiveActionOtp();
			if (res.success) {
				setOtpSent(true);
				setMaskedEmail(res.email || '');
				setResendTimer(60); // 60s cooldown
				toast.success("Verification code sent to your email.");
				setTimeout(() => otpInputRef.current?.focus(), 100);
			}
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to send verification code.";
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
				await verifyUserPassword({ data: { password } });
				// Password verified successfully — run the actual action
				await onConfirm();
				onOpenChange(false);
			} catch (err) {
				const msg = err instanceof Error ? err.message : "Incorrect password. Please try again.";
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
				await verifySensitiveActionOtp({ data: { otp } });
				// OTP verified successfully — run the actual action
				await onConfirm();
				onOpenChange(false);
			} catch (err) {
				const msg = err instanceof Error ? err.message : "Invalid code. Please try again.";
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
