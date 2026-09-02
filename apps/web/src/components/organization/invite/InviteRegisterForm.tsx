"use client";
// src/components/organization/invite/InviteRegisterForm.tsx

import React, { useState } from "react";
import { toast } from "sonner";
import { UserPlus, Loader2, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";

interface InviteRegisterFormProps {
	readonly token: string;
	readonly email: string;
	readonly organizationName: string;
}

export function InviteRegisterForm({
	token,
	email,
	organizationName,
}: InviteRegisterFormProps) {
	const { signUp } = useAuth();
	const [fullName, setFullName] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		if (password !== confirmPassword) {
			toast.error("Passwords do not match");
			return;
		}

		setLoading(true);

		try {
			const res = await signUp({
				email,
				password,
				fullName,
				redirectTo: `/invite/${token}`,
			});

			if (res.error) {
				toast.error(res.error.message || "Registration failed");
				setLoading(false);
				return;
			}

			// A brand-new account must verify its email first. The provider
			// redirects to /verify?next=/invite/<token>; after verification the
			// user returns here (as a signed-in user) to accept the invitation.
			// No redirect to /dashboard happens until verification + acceptance.
			toast.success(
				"Account created! Check your email to verify before joining.",
			);
			setLoading(false);
		} catch (err: any) {
			toast.error(err.message || "Registration failed");
			setLoading(false);
		}
	}

	return (
		<div className="space-y-4">
			<p className="text-sm text-muted-foreground">
				Create an fextiva account to join{" "}
				<span className="font-medium text-foreground">
					{organizationName}
				</span>
				.
			</p>
			<form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
				<div className="relative">
					<User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
					<Input
						id="reg-name"
						type="text"
						value={fullName}
						onChange={(e) => setFullName(e.target.value)}
						placeholder="Full Name"
						className="pl-10 text-sm"
						required
						autoFocus
					/>
				</div>
				<div className="relative">
					<Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
					<Input
						id="reg-email"
						type="email"
						value={email}
						readOnly
						placeholder="Email Address"
						className="pl-10 bg-muted/50 cursor-not-allowed text-sm"
					/>
				</div>
				<div className="relative">
					<Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
					<Input
						id="reg-password"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="Password (Min 6 characters)"
						className="pl-10 text-sm"
						minLength={6}
						required
					/>
				</div>
				<div className="relative">
					<Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
					<Input
						id="reg-confirm-password"
						type="password"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						placeholder="Confirm Password"
						className="pl-10 text-sm"
						minLength={6}
						required
					/>
				</div>
				<Button
					type="submit"
					className="w-full font-semibold gap-2"
					disabled={loading}
				>
					{loading ? (
						<Loader2 className="size-4 animate-spin" />
					) : (
						<UserPlus className="size-4" />
					)}
					Create Account & Continue
				</Button>
			</form>
		</div>
	);
}
