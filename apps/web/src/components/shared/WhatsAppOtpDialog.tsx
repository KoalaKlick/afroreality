"use client";
// src/components/shared/WhatsAppOtpDialog.tsx
// Reusable WhatsApp OTP verification dialog used as an ADDITIONAL security
// layer after password/email verification for payout and withdrawal operations.

import { Loader2, MessageCircle, ShieldCheck } from "lucide-react";
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
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import {
	sendPayoutWhatsAppOtp,
	verifyPayoutWhatsAppOtp,
	getPayoutOtpPhoneInfo,
} from "@/lib/server-functions/whatsapp-otp";

interface WhatsAppOtpDialogProps {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly title?: string;
	readonly description?: string;
	readonly confirmLabel?: string;
	/** Label describing the purpose of the OTP (shown in the WhatsApp message) */
	readonly purpose?: string;
	/** Called when OTP is successfully verified. The dialog will close itself. */
	readonly onConfirm: () => Promise<void> | void;
	/** Called when user skips (only available if allowSkip is true) */
	readonly onSkip?: () => void;
}

export function WhatsAppOtpDialog({
	open,
	onOpenChange,
	title = "WhatsApp Verification",
	description = "Enter the 6-digit code sent to your WhatsApp number to verify this action.",
	confirmLabel = "Verify & Confirm",
	purpose = "a payout account change",
	onConfirm,
	onSkip,
}: WhatsAppOtpDialogProps) {
	const [otp, setOtp] = useState("");
	const [isVerifying, setIsVerifying] = useState(false);
	const [isSending, setIsSending] = useState(false);
	const [otpSent, setOtpSent] = useState(false);
	const [maskedPhone, setMaskedPhone] = useState("");
	const [hasPhone, setHasPhone] = useState<boolean | null>(null);
	const [resendTimer, setResendTimer] = useState(0);
	const otpInputRef = useRef<HTMLInputElement>(null);

	// Check phone availability and auto-send OTP on open
	useEffect(() => {
		if (!open) return;

		setOtp("");
		setOtpSent(false);
		setIsVerifying(false);
		setIsSending(false);
		setResendTimer(0);

		(async () => {
			const phoneInfo = await getPayoutOtpPhoneInfo();
			setHasPhone(phoneInfo.hasPhone);

			if (phoneInfo.hasPhone) {
				setMaskedPhone(phoneInfo.maskedPhone || "");
				// Auto-send OTP
				setIsSending(true);
				const res = await sendPayoutWhatsAppOtp({ data: { purpose } });
				setIsSending(false);
				if (res.success) {
					setOtpSent(true);
					setMaskedPhone(res.maskedPhone || phoneInfo.maskedPhone || "");
					setResendTimer(60);
					toast.success("Verification code sent to your WhatsApp.");
					setTimeout(() => otpInputRef.current?.focus(), 200);
				} else {
					toast.error(res.error || "Failed to send WhatsApp verification code.");
				}
			} else {
				// No phone — skip this step entirely
				toast.info("No phone number on file. Proceeding without WhatsApp verification.");
				try {
					await onConfirm();
				} finally {
					onOpenChange(false);
				}
			}
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
		if (isVerifying || isSending) return;
		if (!newOpen) {
			setOtp("");
			setOtpSent(false);
		}
		onOpenChange(newOpen);
	}

	async function handleResendOtp() {
		setIsSending(true);
		try {
			const res = await sendPayoutWhatsAppOtp({ data: { purpose } });
			if (res.success) {
				setOtpSent(true);
				setResendTimer(60);
				setOtp("");
				toast.success("New verification code sent to your WhatsApp.");
				setTimeout(() => otpInputRef.current?.focus(), 100);
			} else {
				toast.error(res.error || "Failed to resend verification code.");
			}
		} catch (err: any) {
			toast.error(err?.message || "Failed to resend code.");
		} finally {
			setIsSending(false);
		}
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		if (otp.length !== 6) {
			toast.error("Please enter the 6-digit verification code.");
			otpInputRef.current?.focus();
			return;
		}

		setIsVerifying(true);
		try {
			const res = await verifyPayoutWhatsAppOtp({ data: { otp } });
			if (!res.success) {
				toast.error(res.error || "Invalid code. Please try again.");
				setOtp("");
				otpInputRef.current?.focus();
				return;
			}
			// OTP verified — run the actual action
			await onConfirm();
			onOpenChange(false);
		} catch (err: any) {
			toast.error(err?.message || "Verification failed. Please try again.");
			setOtp("");
			otpInputRef.current?.focus();
		} finally {
			setIsVerifying(false);
		}
	}

	// If we haven't determined phone status yet or user has no phone, don't render dialog content
	if (hasPhone === false || hasPhone === null) {
		return null;
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<div className="size-8 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
							<MessageCircle className="size-4" />
						</div>
						{title}
					</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				{isSending && !otpSent ? (
					<div className="flex flex-col items-center justify-center py-8 space-y-2">
						<Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
						<p className="text-sm text-muted-foreground">
							Sending verification code to your WhatsApp...
						</p>
					</div>
				) : otpSent ? (
					<form onSubmit={handleSubmit} className="space-y-4 py-2">
						<div className="space-y-3">
							<div className="space-y-2 flex flex-col items-center">
								<Label htmlFor="wa-otp-input" className="self-start">
									Verification Code
								</Label>
								<div className="flex justify-center w-full py-2">
									<InputOTP
										id="wa-otp-input"
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

							<div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
								<MessageCircle className="size-3.5 text-emerald-500" />
								<span>
									Sent via WhatsApp to{" "}
									<span className="font-medium text-foreground">{maskedPhone}</span>
								</span>
							</div>

							<div className="flex justify-center">
								<Button
									type="button"
									variant="link"
									size="sm"
									className="text-xs"
									onClick={handleResendOtp}
									disabled={isVerifying || isSending || resendTimer > 0}
								>
									{resendTimer > 0
										? `Resend code in ${resendTimer}s`
										: "Resend code"}
								</Button>
							</div>
						</div>

						<DialogFooter className="pt-2 gap-2 sm:gap-0">
							<Button
								type="button"
								variant="ghost"
								onClick={() => handleOpenChange(false)}
								disabled={isVerifying}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={isVerifying || otp.length !== 6}
								className="gap-1.5"
							>
								{isVerifying && <Loader2 className="h-4 w-4 animate-spin" />}
								{isVerifying ? "Verifying..." : confirmLabel}
							</Button>
						</DialogFooter>
					</form>
				) : (
					<div className="flex flex-col items-center justify-center py-6 space-y-3">
						<p className="text-sm text-muted-foreground text-center">
							Failed to send the verification code. Please try again.
						</p>
						<Button onClick={handleResendOtp} disabled={isSending} size="sm">
							{isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Retry Sending Code
						</Button>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
