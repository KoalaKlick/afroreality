"use client";

import React, { useState } from "react";
import { Lock, Mail, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GoogleIcon } from "@/components/shared/google-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";

export function RegisterForm() {
	const { signUp, signInWithOAuth, loading } = useAuth();
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const cleanName = fullName.trim();
		const cleanEmail = email.trim();

		if (!cleanName) {
			toast.error("Full name is required.");
			return;
		}
		if (!cleanEmail) {
			toast.error("Valid email is required.");
			return;
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
			const res = await signUp({
				email: cleanEmail,
				password,
				fullName: cleanName,
			});

			if (res?.error) {
				toast.error(res.error.message || "Registration failed");
			}
		} catch (err: any) {
			toast.error(err?.message || "An unexpected error occurred.");
		} finally {
			setSubmitting(false);
		}
	};

	const handleGoogleSignIn = () => {
		signInWithOAuth("google");
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

			<Button
				variant="outline"
				type="button"
				className="w-full rounded-full shadow-none bg-neutral-50 hover:bg-neutral-100"
				onClick={handleGoogleSignIn}
				disabled={loading}
			>
				<GoogleIcon className="mr-2 h-4 w-4" />
				Continue with Google
			</Button>

			<p className="text-sm text-center text-muted-foreground">
				Already have an account?{" "}
				<a href="/login" className="text-red-500 font-medium hover:underline">
					Sign in
				</a>
			</p>
		</div>
	);
}
