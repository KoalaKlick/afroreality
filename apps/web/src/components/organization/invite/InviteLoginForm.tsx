"use client";
// src/components/organization/invite/InviteLoginForm.tsx

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, LogIn, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { acceptOrgInvitation } from "@/lib/server-functions/organization-join";

interface InviteLoginFormProps {
	readonly token: string;
	readonly email: string;
	readonly organizationName: string;
}

export function InviteLoginForm({
	token,
	email,
	organizationName,
}: InviteLoginFormProps) {
	const router = useRouter();
	const { signInWithPassword } = useAuth();
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [isPending, startTransition] = useTransition();

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setLoading(true);

		try {
			const res = await signInWithPassword({
				identifier: email,
				password,
			});

			if (res.error) {
				toast.error(res.error.message || "Incorrect password. Please try again.");
				setLoading(false);
				return;
			}

			startTransition(async () => {
				try {
					await acceptOrgInvitation({ data: { token } });
					toast.success(`Welcome to ${organizationName}!`);
					router.push("/dashboard");
					router.refresh();
				} catch (err: any) {
					toast.error(err.message || "Failed to accept invitation");
				}
			});
		} catch (err: any) {
			toast.error(err.message || "Login failed");
			setLoading(false);
		}
	}

	return (
		<div className="space-y-4">
			<p className="text-sm text-muted-foreground">
				Welcome back! Sign in to accept your invitation to{" "}
				<span className="font-medium text-foreground">
					{organizationName}
				</span>
				.
			</p>
			<form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
				<div className="relative">
					<Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
					<Input
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
						id="invite-password"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="Password"
						className="pl-10 text-sm"
						required
						autoFocus
					/>
				</div>
				<Button
					type="submit"
					className="w-full font-semibold gap-2"
					disabled={loading || isPending}
				>
					{loading || isPending ? (
						<Loader2 className="size-4 animate-spin" />
					) : (
						<LogIn className="size-4" />
					)}
					Sign In & Accept
				</Button>
				<p className="text-center text-xs text-muted-foreground">
					<Link href="/forgot-password" className="underline hover:text-primary">
						Forgot your password?
					</Link>
				</p>
			</form>
		</div>
	);
}
