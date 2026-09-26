"use client";

import React, { useState } from "react";
import QRCode from "react-qr-code";
import {
	ShieldCheck,
	Smartphone,
	Copy,
	Check,
	Loader2,
	KeyRound,
	RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import {
	regenerateSuperAdminTotpAction,
	confirmSuperAdmin2FASetupAction,
} from "@/lib/server-functions/admin-2fa";

export function SuperAdmin2FADialog({ adminEmail }: { readonly adminEmail?: string }) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [confirming, setConfirming] = useState(false);
	const [setupData, setSetupData] = useState<{
		secret: string;
		otpauthUri: string;
		challengeToken: string;
	} | null>(null);
	const [code, setCode] = useState("");
	const [copied, setCopied] = useState(false);
	const [error, setError] = useState("");

	const handleOpen = async (isOpen: boolean) => {
		setOpen(isOpen);
		if (isOpen) {
			setCode("");
			setError("");
			setLoading(true);
			try {
				const res = await regenerateSuperAdminTotpAction();
				if (res.success && res.secret && res.otpauthUri && res.challengeToken) {
					setSetupData({
						secret: res.secret,
						otpauthUri: res.otpauthUri,
						challengeToken: res.challengeToken,
					});
				} else {
					toast.error(res.error || "Failed to generate 2FA credentials.");
					setOpen(false);
				}
			} finally {
				setLoading(false);
			}
		}
	};

	const handleCopySecret = async () => {
		if (!setupData?.secret) return;
		try {
			await navigator.clipboard.writeText(setupData.secret);
			setCopied(true);
			toast.success("Secret key copied to clipboard");
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error("Could not copy secret key");
		}
	};

	const handleConfirm = async () => {
		if (code.length !== 6 || !setupData) {
			setError("Please enter the 6-digit code from your app.");
			return;
		}

		setConfirming(true);
		setError("");

		try {
			const res = await confirmSuperAdmin2FASetupAction({
				email: adminEmail || "",
				challengeToken: setupData.challengeToken,
				code,
			});

			if (res.success) {
				toast.success("Authenticator App 2FA successfully configured!");
				setOpen(false);
			} else {
				setError(res.error || "Invalid verification code.");
				toast.error(res.error || "Invalid verification code.");
			}
		} finally {
			setConfirming(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpen}>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="text-xs font-semibold gap-1.5 h-8 border-border"
				>
					<Smartphone className="size-3.5 text-primary" />
					<span>Re-configure Authenticator App</span>
				</Button>
			</DialogTrigger>

			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-2">
						<ShieldCheck className="size-5" />
					</div>
					<DialogTitle className="text-base font-bold">
						Configure Authenticator App (TOTP)
					</DialogTitle>
					<DialogDescription className="text-xs">
						Scan the QR code below with Microsoft Authenticator or Google Authenticator to rotate your 2FA credentials.
					</DialogDescription>
				</DialogHeader>

				{loading ? (
					<div className="py-12 flex flex-col items-center justify-center gap-3">
						<Loader2 className="size-6 animate-spin text-primary" />
						<p className="text-xs text-muted-foreground">Generating 2FA key pair...</p>
					</div>
				) : setupData ? (
					<div className="space-y-4 py-2">
						{/* QR Code */}
						<div className="bg-white p-3 rounded-xl border border-border shadow-xs flex flex-col items-center justify-center mx-auto max-w-[180px]">
							<QRCode
								value={setupData.otpauthUri}
								size={150}
								style={{ height: "auto", maxWidth: "100%", width: "100%" }}
								viewBox="0 0 256 256"
							/>
						</div>

						{/* Secret Key */}
						<div className="rounded-lg bg-muted/50 border border-border p-2.5 text-center space-y-1">
							<p className="text-[11px] text-muted-foreground">
								Or enter this secret key manually:
							</p>
							<div className="flex items-center justify-center gap-2">
								<code className="font-mono text-xs font-bold text-foreground select-all tracking-wider px-2 py-0.5 rounded bg-background border">
									{setupData.secret}
								</code>
								<Button
									type="button"
									variant="outline"
									size="icon"
									className="size-6 shrink-0"
									onClick={handleCopySecret}
									title="Copy secret key"
								>
									{copied ? (
										<Check className="size-3 text-emerald-600" />
									) : (
										<Copy className="size-3 text-muted-foreground" />
									)}
								</Button>
							</div>
						</div>

						{/* 6-Digit Verification */}
						<div className="space-y-2 flex flex-col items-center">
							<label className="text-xs font-semibold text-foreground">
								Enter 6-digit verification code to confirm:
							</label>
							<InputOTP
								maxLength={6}
								value={code}
								onChange={(val) => {
									setCode(val);
									setError("");
								}}
								disabled={confirming}
							>
								<InputOTPGroup className="gap-2">
									<InputOTPSlot index={0} className="rounded-md border size-10 text-base font-bold" />
									<InputOTPSlot index={1} className="rounded-md border size-10 text-base font-bold" />
									<InputOTPSlot index={2} className="rounded-md border size-10 text-base font-bold" />
									<InputOTPSlot index={3} className="rounded-md border size-10 text-base font-bold" />
									<InputOTPSlot index={4} className="rounded-md border size-10 text-base font-bold" />
									<InputOTPSlot index={5} className="rounded-md border size-10 text-base font-bold" />
								</InputOTPGroup>
							</InputOTP>

							{error && (
								<p className="text-xs text-destructive text-center font-medium">
									{error}
								</p>
							)}
						</div>
					</div>
				) : null}

				<DialogFooter className="gap-2 sm:gap-0 pt-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setOpen(false)}
						disabled={confirming}
						className="text-xs"
					>
						Cancel
					</Button>
					<Button
						size="sm"
						onClick={handleConfirm}
						disabled={confirming || code.length !== 6 || loading}
						className="text-xs font-semibold gap-1.5"
						style={{ backgroundColor: "var(--color-brand-primary, #009A44)" }}
					>
						{confirming ? (
							<>
								<Loader2 className="size-3.5 animate-spin" />
								Verifying...
							</>
						) : (
							<>
								<KeyRound className="size-3.5" />
								Verify & Save 2FA
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
