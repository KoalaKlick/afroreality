"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Lock, Mail, User, Loader2, Phone, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { GoogleIcon } from "@/components/shared/google-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";

type RegisterMode = "email" | "phone";

export function RegisterForm({ next }: { next?: string | null }) {
	const { signUp, signInWithOAuth, loading } = useAuth();
	const [mode, setMode] = useState<RegisterMode>("email");
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const cleanName = fullName.trim();
		const cleanEmail = email.trim();
		const cleanPhone = phoneNumber.trim();

		if (!cleanName) {
			toast.error("Full name is required.");
			return;
		}

		if (mode === "email") {
			if (!cleanEmail) {
				toast.error("Valid email is required.");
				return;
			}
		} else {
			if (!cleanPhone || cleanPhone.length < 9) {
				toast.error("Please enter a valid phone number.");
				return;
			}
		}

		if (password.length < 6) {
			toast.error("Password must be at least 6 characters.");
			return;
		}
		if (password !== confirmPassword) {
			toast.error("Passwords do not match.");
			return;
		}

		setSubmitting(true);

		try {
			await signUp({
				email: mode === "email" ? cleanEmail : undefined,
				phone: mode === "phone" ? cleanPhone : undefined,
				password,
				fullName: cleanName,
				redirectTo: next ?? undefined,
			});
		} catch (err: any) {
			// Toast/redirect is handled in auth-provider
		} finally {
			setSubmitting(false);
		}
	};

	const handleGoogleSignIn = () => {
		signInWithOAuth("google");
	};

	const switchMode = (newMode: RegisterMode) => {
		setMode(newMode);
	};

	return (
		<div className="space-y-6">
			<form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
				<div>
					<Input
						icon={<User className="size-4" />}
						placeholder="Full Name"
						name="fullName"
						type="text"
						value={fullName}
						onChange={(e) => setFullName(e.target.value)}
						required
					/>
				</div>

				{mode === "email" ? (
					<div>
						<Input
							icon={<Mail className="size-4" />}
							type="email"
							placeholder="Email Address"
							name="email"
							autoComplete="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</div>
				) : (
					<div>
						<Input
							icon={<Phone className="size-4" />}
							type="tel"
							placeholder="Phone number (e.g. 0501234567)"
							name="phone"
							autoComplete="tel"
							value={phoneNumber}
							onChange={(e) => setPhoneNumber(e.target.value)}
							required
						/>
						<p className="text-[11px] text-muted-foreground mt-1.5 pl-1">
							We'll send a verification code to this number
						</p>
					</div>
				)}

				<div>
					<Input
						icon={<Lock className="size-4" />}
						type="password"
						placeholder="Password (min. 6 characters)"
						name="password"
						autoComplete="new-password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>
				</div>

				<div>
					<Input
						icon={<Lock className="size-4" />}
						type="password"
						placeholder="Confirm Password"
						name="confirmPassword"
						autoComplete="new-password"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						required
					/>
				</div>

				<Button
					type="submit"
					className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2 mt-2"
					disabled={submitting || loading}
				>
					{submitting ? (
						<>
							<Loader2 className="size-4 animate-spin" />
							Creating account...
						</>
					) : (
						"Create Account"
					)}
				</Button>
			</form>

			<div className="relative">
				<div className="absolute inset-0 flex items-center">
					<span className="w-full border-t" />
				</div>
				<div className="relative flex justify-center text-xs">
					<span className="bg-background px-2 text-muted-foreground">
						Or sign up with
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
					onClick={() => switchMode(mode === "email" ? "phone" : "email")}
					disabled={loading}
				>
					{mode === "email" ? (
						<>
							<Phone className="mr-2 h-4 w-4" />
							Phone
						</>
					) : (
						<>
							<Mail className="mr-2 h-4 w-4" />
							Email
						</>
					)}
				</Button>
			</div>

			<p className="text-sm text-center text-muted-foreground">
				Already have an account?{" "}
				<Link href="/login" className="text-red-500 font-medium hover:underline">
					Sign in
				</Link>
			</p>
		</div>
	);
}
