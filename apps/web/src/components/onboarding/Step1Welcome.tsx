"use client";

import { useEffect, useState, useTransition } from "react";
import { AtSign, Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	OnboardingActions,
	OnboardingCard,
	OnboardingHeader,
	setupPrimaryButtonClassName,
} from "./OnboardingCard";
import { checkUsernameAvailability, updateProfileSettings } from "@/lib/server-functions/profile";
import { useDebounce } from "@/hooks/use-debounce";
import { usernameSchema } from "@/lib/validations/profile";
import { getErrorMessage } from "@/lib/utils";

interface Step1WelcomeProps {
	readonly defaultValues?: {
		username?: string;
	};
	readonly onSuccess?: (data: { username: string }) => void;
}

export function Step1Welcome({ defaultValues, onSuccess }: Step1WelcomeProps) {
	const [isPending, startTransition] = useTransition();
	const [username, setUsername] = useState(defaultValues?.username ?? "");
	const [error, setError] = useState<string | null>(null);
	const [usernameStatus, setUsernameStatus] = useState<
		"idle" | "checking" | "available" | "taken" | "invalid"
	>("idle");

	const debouncedUsername = useDebounce(username.trim().toLowerCase(), 500);

	useEffect(() => {
		if (!debouncedUsername || debouncedUsername.length < 3) {
			setUsernameStatus("idle");
			return;
		}

		const parsed = usernameSchema.safeParse(debouncedUsername);
		if (!parsed.success) {
			setUsernameStatus("invalid");
			setError(parsed.error.issues[0]?.message ?? "Invalid username");
			return;
		}

		setUsernameStatus("checking");
		setError(null);

		checkUsernameAvailability({ data: { username: debouncedUsername } })
			.then((result) => {
				if (result.available || debouncedUsername === defaultValues?.username?.toLowerCase()) {
					setUsernameStatus("available");
					setError(null);
				} else {
					setUsernameStatus("taken");
					setError("This username is already taken");
				}
			})
			.catch(() => {
				setUsernameStatus("idle");
			});
	}, [debouncedUsername, defaultValues?.username]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const cleanUsername = username.trim().toLowerCase();
		if (!cleanUsername) {
			setError("Please choose a username");
			return;
		}
		if (usernameStatus === "taken" || usernameStatus === "invalid") {
			return;
		}

		startTransition(async () => {
			try {
				await updateProfileSettings({
					data: {
						username: cleanUsername,
					},
				});
				onSuccess?.({
					username: cleanUsername,
				});
			} catch (err: unknown) {
				setError(getErrorMessage(err));
			}
		});
	}

	const getStatusIcon = () => {
		switch (usernameStatus) {
			case "checking":
				return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
			case "available":
				return <Check className="h-4 w-4 text-emerald-500" />;
			case "taken":
			case "invalid":
				return <X className="h-4 w-4 text-destructive" />;
			default:
				return null;
		}
	};

	return (
		<OnboardingCard>
			<OnboardingHeader
				icon={<AtSign className="h-6 w-6 text-emerald-600" />}
				title="Choose your username"
				description="This will be your unique identifier across AfroReality."
			/>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-1.5">
					<div className="flex items-center justify-between">
						<label className="text-sm font-medium leading-none">Username</label>
						<div className="flex items-center gap-1.5 text-xs">
							{getStatusIcon()}
							{usernameStatus === "available" && (
								<span className="text-emerald-600 font-medium">Available</span>
							)}
						</div>
					</div>
					<Input
						icon={<AtSign className="size-4" />}
						placeholder="e.g. koala"
						value={username}
						onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
						required
						autoFocus
					/>
					<p className="text-xs text-muted-foreground">
						Only letters, numbers, and underscores (min. 3 characters).
					</p>
				</div>

				{error && (
					<p className="text-sm font-medium text-destructive text-center">{error}</p>
				)}

				<OnboardingActions>
					<Button
						type="submit"
						size="lg"
						className={setupPrimaryButtonClassName}
						disabled={
							isPending ||
							!username ||
							usernameStatus === "taken" ||
							usernameStatus === "checking"
						}
					>
						{isPending ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
								Saving...
							</>
						) : (
							"Continue"
						)}
					</Button>
				</OnboardingActions>
			</form>
		</OnboardingCard>
	);
}