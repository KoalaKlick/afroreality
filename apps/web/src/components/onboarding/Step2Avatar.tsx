"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	OnboardingActions,
	OnboardingCard,
	OnboardingHeader,
	setupPrimaryButtonClassName,
	setupTextButtonClassName,
} from "./OnboardingCard";
import { updateProfileSettings } from "@/lib/server-functions/profile";
import { cn, getErrorMessage } from "@/lib/utils";
import { useImageUpload } from "@/hooks/use-image-upload";
import { MAX_IMAGE_INPUT_SIZE } from "@/lib/constants/storage";

interface Step2AvatarProps {
	readonly defaultAvatarUrl?: string;
	readonly onSuccess?: (avatarUrl?: string) => void;
	readonly onSkip?: () => void;
}

export function Step2Avatar({
	defaultAvatarUrl,
	onSuccess,
	onSkip,
}: Step2AvatarProps) {
	const [isPending, startTransition] = useTransition();
	const [previewUrl, setPreviewUrl] = useState(defaultAvatarUrl ?? "");
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [error, setError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const { isUploading, upload } = useImageUpload({
		folder: "avatars",
	});

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			setError("Please select an image file (PNG, JPG, or WebP)");
			return;
		}

		if (file.size > MAX_IMAGE_INPUT_SIZE) {
			setError("Image must be smaller than 8MB");
			return;
		}

		setError(null);
		setSelectedFile(file);
		// Local object URL for instant UI preview
		setPreviewUrl(URL.createObjectURL(file));
	};

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		startTransition(async () => {
			try {
				let finalAvatarUrl = previewUrl;

				// If user picked a new file, compress to WebP and upload to Cloudflare R2
				if (selectedFile) {
					const uploadRes = await upload(selectedFile, defaultAvatarUrl);
					if (!uploadRes) {
						setError("Failed to upload image to Cloudflare R2");
						return;
					}
					finalAvatarUrl = uploadRes.url;
				}

				if (finalAvatarUrl && finalAvatarUrl !== defaultAvatarUrl) {
					await updateProfileSettings({
						data: { avatarUrl: finalAvatarUrl },
					});
				}

				onSuccess?.(finalAvatarUrl || undefined);
			} catch (err: unknown) {
				setError(getErrorMessage(err));
			}
		});
	}

	const isLoading = isPending || isUploading;

	return (
		<OnboardingCard>
			<OnboardingHeader
				icon={<Camera className="h-6 w-6 text-emerald-600" />}
				title="Add a profile picture"
				description="Help attendees and organizers recognize you."
			/>

			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="flex flex-col items-center justify-center">
					<button
						type="button"
						className={cn(
							"relative h-32 w-32 overflow-hidden rounded-full",
							"bg-muted border-2 border-dashed border-muted-foreground/30",
							"flex items-center justify-center",
							"transition-all duration-200 hover:border-emerald-500 cursor-pointer group",
						)}
						onClick={() => fileInputRef.current?.click()}
					>
						{previewUrl ? (
							<img
								src={previewUrl}
								alt="Avatar preview"
								className="h-full w-full object-cover"
							/>
						) : (
							<User className="h-16 w-16 text-muted-foreground/40 group-hover:text-emerald-500/60 transition-colors" />
						)}

						<div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
							<Camera className="h-7 w-7 text-white" />
						</div>
					</button>

					<input
						ref={fileInputRef}
						type="file"
						accept="image/png,image/jpeg,image/webp,image/gif"
						className="hidden"
						onChange={handleFileSelect}
					/>
					<p className="text-xs text-muted-foreground mt-3">
						Click to upload PNG or JPG (optimized to WebP, max 8MB)
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
						disabled={isLoading}
					>
						{isLoading ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
								{isUploading ? "Uploading to Cloudflare..." : "Saving..."}
							</>
						) : (
							"Continue"
						)}
					</Button>
					<Button
						type="button"
						variant="ghost"
						className={setupTextButtonClassName}
						onClick={() => onSkip?.()}
						disabled={isLoading}
					>
						Skip for now
					</Button>
				</OnboardingActions>
			</form>
		</OnboardingCard>
	);
}