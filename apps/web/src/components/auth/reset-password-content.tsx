"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Lock, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";

export function ResetPasswordContent({
	email = "",
	token = "",
}: {
	email?: string;
	token?: string;
}) {
	const { resetPassword, loading } = useAuth();
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [success, setSuccess] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

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
			const res = await resetPassword(email, password);
			if (res?.error) {
				toast.error(res.error.message || "Failed to reset password.");
			} else {
				setSuccess(true);
				toast.success("Password reset successfully!");
			}
		} catch (err: any) {
			toast.error(err?.message || "Failed to reset password.");
		} finally {
			setSubmitting(false);
		}
	};

	if (success) {
		return (
			<div className="space-y-6 text-center">
				<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
					<CheckCircle2 className="h-8 w-8" />
				</div>
				<div className="space-y-2">
					<h2 className="text-xl font-semibold">Password Reset Complete</h2>
					<p className="text-sm text-muted-foreground">
						Your password has been successfully updated. You can now sign in with your new credentials.
					</p>
				</div>
				<Button
					asChild
					className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
				>
					<Link href="/login">Sign In</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
				<div>
					<Input
						icon={<Lock className="size-4" />}
						type="password"
						placeholder="New Password (min. 6 characters)"
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
						placeholder="Confirm New Password"
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
							Updating Password...
						</>
					) : (
						"Update Password"
					)}
				</Button>
			</form>
		</div>
	);
}
