"use client";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EmailVerifiedIllustration } from "@/components/auth/EmailVerifiedIllustration";
import { OTPVerificationIllustration } from "@/components/auth/OTPVerificationIllustration";
import { Button } from "@/components/ui/button";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/use-auth";

// Where an unverified user lands next after they verify.
// Their profile is brand-new so onboarding is the natural continuation unless
// a safe `next` was provided (e.g. a protected page or invite they requested).
const DEFAULT_NEXT = "/onboarding";
const SAFE_NEXT_PREFIXES = ["/dashboard", "/my-events", "/organization", "/promoter", "/invite"];

function resolveNextUrl(next?: string | null): string {
	if (!next) return DEFAULT_NEXT;
	if (next.startsWith("/") && !next.startsWith("//") && !next.includes(":")) {
		const isSafe = SAFE_NEXT_PREFIXES.some((p) => next.startsWith(p));
		if (isSafe) return next;
	}
	return DEFAULT_NEXT;
}

export function VerificationContent({
	email: searchEmail,
	phone: searchPhone,
	next: searchNext,
}: {
	email?: string;
	phone?: string;
	next?: string | null;
}) {
	const { verifyOtp, sendVerificationOtp } = useAuth();
	const [nextUrl] = useState(() => resolveNextUrl(searchNext));
	const isPhone = Boolean(searchPhone) || (Boolean(searchEmail) && searchEmail!.endsWith("@phone.fextiva.com"));
	const rawPhone = searchPhone || (searchEmail && searchEmail.endsWith("@phone.fextiva.com") ? (searchEmail.split("@")[0] || "").replace(/^phone_/, "") : "");
	const email = isPhone ? "" : (searchEmail || "");
	const [phone] = useState(rawPhone);

	const [otp, setOtp] = useState("");
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [resending, setResending] = useState(false);
	const [cooldown, setCooldown] = useState<number | null>(null);
	const [verified, setVerified] = useState(false);

	const displayPhone = phone
		? phone.length > 4
			? `+${phone.slice(0, 3)} •••••• ${phone.slice(-4)}`
			: phone
		: "";

	const handleVerify = async () => {
		if (otp.length !== 6) {
			setError("Please enter the 6-digit code");
			return;
		}
		if (!email && !phone) {
			setError("Missing verification target. Please resend the code.");
			return;
		}

		setSubmitting(true);
		setError("");

		const { error: err } = await verifyOtp({
			email: isPhone ? undefined : email,
			phone: isPhone ? phone : undefined,
			otp,
			type: "verify",
		});

		if (err) {
			const msg = (err as any)?.message || String(err);
			toast.error(msg);
			setError(msg);
			setSubmitting(false);
			return;
		}

		toast.success(isPhone ? "Phone verified successfully!" : "Email verified successfully!");
		setVerified(true);
		setTimeout(() => {
			window.location.href = nextUrl;
		}, 1500);
	};

	const handleResend = async () => {
		if ((!email && !phone) || cooldown !== null) return;
		setResending(true);
		setError("");

		try {
			const res = await sendVerificationOtp({
				email: isPhone ? undefined : email,
				phone: isPhone ? phone : undefined,
			});
			const err = (res as any)?.error;
			if (err) {
				const msg = (err as any)?.message || String(err);
				const match = /(\d+)\s*second/.exec(msg);
				if (match && match[1]) {
					setCooldown(Number.parseInt(match[1], 10));
				} else {
					toast.error(msg);
					setError(msg);
				}
			} else {
				toast.success(isPhone ? "Verification code sent to your phone!" : "Verification code sent to your email!");
				setCooldown(30);
			}
		} catch (e: any) {
			toast.error(e.message || "Failed to resend code");
		} finally {
			setResending(false);
		}
	};

	useEffect(() => {
		if (cooldown === null) return;
		const interval = setInterval(() => {
			setCooldown((prev) => {
				if (prev === null || prev <= 1) {
					clearInterval(interval);
					return null;
				}
				return prev - 1;
			});
		}, 1000);
		return () => clearInterval(interval);
	}, [cooldown]);

	if (verified) {
		return (
			<div className="w-full text-center space-y-4 flex-1 flex flex-col justify-center">
				<div className="flex justify-center">
					<EmailVerifiedIllustration className="size-24 text-green-500" />
				</div>
				<h1 className="text-2xl font-semibold tracking-tight">
					{isPhone ? "Phone Verified!" : "Email Verified!"}
				</h1>
				<p className="text-sm text-muted-foreground">Redirecting to setup...</p>
				<Loader2 className="h-6 w-6 animate-spin mx-auto" />
			</div>
		);
	}

	return (
		<div className="w-full space-y-6 flex-1 flex flex-col justify-center">
			<div className="text-center">
				<div className="flex justify-center mb-4">
					<OTPVerificationIllustration className="h-24 w-24" />
				</div>
				<h1 className="text-2xl font-semibold tracking-tight">
					{isPhone ? "Verify Your Phone" : "Verify Your Email"}
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					{isPhone ? "Enter the 6-digit code sent via SMS to" : "Enter the 6-digit code sent to"}
					{isPhone && phone && <strong className="block mt-1 font-mono"> {displayPhone}</strong>}
					{!isPhone && email && <strong className="block mt-1"> {email}</strong>}
					{!isPhone && !email && <span className="block mt-1">your email address</span>}
				</p>
			</div>

			<div className="space-y-4">
				<div className="flex justify-center">
					<InputOTP maxLength={6} value={otp} onChange={setOtp}>
						<InputOTPGroup>
							<InputOTPSlot index={0} />
							<InputOTPSlot index={1} />
							<InputOTPSlot index={2} className="rounded-r-none!" />
						</InputOTPGroup>
						<span className="text-muted-foreground/50">-</span>
						<InputOTPGroup>
							<InputOTPSlot index={3} className="rounded-l-none!" />
							<InputOTPSlot index={4} />
							<InputOTPSlot index={5} />
						</InputOTPGroup>
					</InputOTP>
				</div>

				{error && (
					<div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
						<p className="text-sm text-destructive text-center">{error}</p>
					</div>
				)}

				<Button
					className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
					onClick={handleVerify}
					disabled={submitting || otp.length !== 6}
				>
					{submitting ? (
						<Loader2 className="h-4 w-4 animate-spin mr-2" />
					) : null}
					{isPhone ? "Verify Phone Number" : "Verify Email"}
				</Button>

				<div className="flex gap-2">
					<Button
						variant="outline"
						className="flex-1 rounded-full"
						onClick={handleResend}
						disabled={resending || cooldown !== null || (!email && !phone)}
					>
						{resending ? (
							<Loader2 className="h-4 w-4 animate-spin mr-2" />
						) : null}
						{cooldown === null ? "Resend Code" : `Resend in ${cooldown}s`}
					</Button>
					<Button
						variant="ghost"
						className="flex-1 rounded-full"
						onClick={() => {
							window.location.href = "/login";
						}}
					>
						Back to Login
					</Button>
				</div>
			</div>
		</div>
	);
}
