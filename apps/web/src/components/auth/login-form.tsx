"use client";

import React, { useState } from "react";
import { Lock, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { EmailVerifiedIllustration } from "@/components/auth/EmailVerifiedIllustration";
import { GoogleIcon } from "@/components/shared/google-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";

export function LoginForm({
	verified,
	next,
}: {
	verified?: boolean;
	next?: string | null;
}) {
	const { signInWithPassword, signInWithOAuth, loading } = useAuth();
	const [identifier, setIdentifier] = useState("");
	const [password, setPassword] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const cleanId = identifier.trim();
		const cleanPass = password;

		if (!cleanId) {
			toast.error("Please enter your email or username.");
			return;
		}
		if (!cleanPass) {
			toast.error("Please enter your password.");
			return;
		}

		setSubmitting(true);

		try {
			await signInWithPassword({
				identifier: cleanId,
				password: cleanPass,
				redirectTo: next ?? undefined,
			});
		} catch (err: any) {
			// Toast is handled in auth-provider
		} finally {
			setSubmitting(false);
		}
	};

	const handleGoogleSignIn = () => {
		signInWithOAuth("google");
	};

	return (
		<div className="space-y-6">
			{verified && (
				<div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center gap-2">
					<EmailVerifiedIllustration className="size-24 text-green-500" />
					<p className="text-sm text-green-600 font-medium">
						Email verified! You can now log in.
					</p>
				</div>
			)}

			<form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
				<div>
					<Input
						icon={<User className="size-4" />}
						placeholder="Email Address or Username"
						name="identifier"
						type="text"
						autoComplete="username"
						value={identifier}
						onChange={(e) => setIdentifier(e.target.value)}
						required
					/>
				</div>

				<div className="space-y-1">
					<Input
						icon={<Lock className="size-4" />}
						type="password"
						placeholder="Password"
						name="password"
						autoComplete="current-password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>
					<div className="flex justify-end pt-1">
						<a
							href="/forgot-password"
							className="text-xs text-muted-foreground hover:text-primary underline"
						>
							Forgot password?
						</a>
					</div>
				</div>

				<Button
					type="submit"
					className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2"
					disabled={submitting || loading}
				>
					{submitting ? (
						<>
							<Loader2 className="size-4 animate-spin" />
							Signing in...
						</>
					) : (
						"Sign In"
					)}
				</Button>
			</form>

			<div className="relative">
				<div className="absolute inset-0 flex items-center">
					<span className="w-full border-t" />
				</div>
				<div className="relative flex justify-center text-xs">
					<span className="bg-background px-2 text-muted-foreground">
						Or continue with
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
				Don't have an account?{" "}
				<a
					href="/register"
					className="text-red-500 font-medium hover:underline"
				>
					Sign up
				</a>
			</p>
		</div>
	);
}
