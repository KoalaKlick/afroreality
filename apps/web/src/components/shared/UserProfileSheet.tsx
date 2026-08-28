"use client";

import { Loader2, Pencil, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/image/Image";
import { PanAfricanDivider } from "@/components/shared/PanAficDivider";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Sheet,
	SheetBody,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useImageUpload } from "@/hooks/use-image-upload";
import { cleanStorageKey, getAvatarUrl } from "@/lib/image-url-utils";
import { updateProfileSettings } from "@/lib/server-functions/profile";

interface UserProfileSheetProps {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly user: {
		name: string;
		email: string;
		avatar?: string;
		username?: string;
		momoNumber?: string;
		momoNetwork?: string;
	};
}

export function UserProfileSheet({
	open,
	onOpenChange,
	user,
}: UserProfileSheetProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { upload: uploadAvatar, isUploading: isUploadingAvatar } =
		useImageUpload({
			folder: "avatars",
		});

	const [fullName, setFullName] = useState(user.name);
	const [username, setUsername] = useState(user.username ?? "");
	const [avatarPath, setAvatarPath] = useState(
		cleanStorageKey(user.avatar ?? ""),
	);
	const [avatarPreview, setAvatarPreview] = useState(
		user.avatar ? getAvatarUrl(user.avatar) : "",
	);

	const [showConfirmDialog, setShowConfirmDialog] = useState(false);

	const initialCleanAvatar = cleanStorageKey(user.avatar ?? "");
	const isDirty = useMemo(
		() =>
			fullName !== user.name ||
			username !== (user.username ?? "") ||
			avatarPath !== initialCleanAvatar,
		[fullName, username, avatarPath, user, initialCleanAvatar],
	);

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen && isDirty && !isPending && !isUploadingAvatar) {
			setShowConfirmDialog(true);
			return;
		}
		onOpenChange(nextOpen);
	};

	async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			toast.error("Please select an image file");
			return;
		}
		if (file.size > 10 * 1024 * 1024) {
			toast.error("Image must be less than 10MB");
			return;
		}

		const res = await uploadAvatar(file, avatarPath || undefined);
		if (res) {
			const relativeKey = cleanStorageKey(res.key || res.url);
			setAvatarPath(relativeKey);
			setAvatarPreview(res.url || getAvatarUrl(relativeKey));
		}
	}

	function handleSubmit(e: React.SyntheticEvent) {
		e.preventDefault();

		startTransition(async () => {
			try {
				await updateProfileSettings({
					data: {
						fullName: fullName.trim() || undefined,
						username: username.trim() || undefined,
						avatarUrl: cleanStorageKey(avatarPath) || undefined,
					},
				});
				toast.success("Profile updated!");
				onOpenChange(false);
				void router.refresh();
			} catch (err) {
				const message =
					err instanceof Error ? err.message : "Failed to update profile";
				toast.error(message);
			}
		});
	}

	return (
		<>
			<Sheet open={open} onOpenChange={handleOpenChange}>
				<SheetContent
					side="right"
					className="w-full sm:max-w-md flex flex-col h-full"
				>
					<SheetHeader className="shrink-0">
						<SheetTitle className="flex items-center gap-2">
							<User className="h-5 w-5" />
							Account Settings
						</SheetTitle>
						<SheetDescription>
							Update your personal profile details.
						</SheetDescription>
					</SheetHeader>

					<PanAfricanDivider className="h-1 shrink-0" />

					<SheetBody className="flex-1 overflow-y-auto py-4 pr-2">
						<form
							id="profile-form"
							onSubmit={handleSubmit}
							className="space-y-6"
						>
							{/* Avatar */}
							<div className="flex flex-col items-center gap-3">
								<input
									ref={fileInputRef}
									type="file"
									accept="image/*"
									onChange={handleAvatarChange}
									className="hidden"
								/>
								<button
									type="button"
									className="relative group cursor-pointer"
									onClick={() => fileInputRef.current?.click()}
									aria-label="Change profile photo"
								>
									<div className="relative h-20 w-20 rounded-full overflow-hidden ring-2 ring-border">
										{avatarPreview ? (
											<Avatar
												src={avatarPreview}
												alt={fullName}
												width={80}
												height={80}
												className="h-20 w-20 rounded-full object-cover"
											/>
										) : (
											<div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
												{fullName?.[0] || <User className="h-8 w-8" />}
											</div>
										)}
										<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
											{isUploadingAvatar ? (
												<Loader2 className="h-5 w-5 text-white animate-spin" />
											) : (
												<Pencil className="h-5 w-5 text-white" />
											)}
										</div>
									</div>
								</button>
								<p className="text-xs text-muted-foreground">
									Click to change photo
								</p>
							</div>

							{/* Read-only email */}
							<div className="space-y-1.5">
								<Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
									Email
								</Label>
								<Input value={user.email} disabled className="bg-muted/40" />
							</div>

							{/* Full name */}
							<div className="space-y-1.5">
								<Label
									htmlFor="profile-fullname"
									className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
								>
									Full Name
								</Label>
								<Input
									id="profile-fullname"
									value={fullName}
									onChange={(e) => setFullName(e.target.value)}
									placeholder="Your full name"
								/>
							</div>

							{/* Username */}
							<div className="space-y-1.5">
								<Label
									htmlFor="profile-username"
									className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
								>
									Username
								</Label>
								<Input
									id="profile-username"
									value={username}
									onChange={(e) => setUsername(e.target.value.toLowerCase())}
									placeholder="your_username"
								/>
								<p className="text-xs text-muted-foreground">
									3 to 30 lowercase letters, numbers or underscores.
								</p>
							</div>
						</form>
					</SheetBody>

					<SheetFooter className="shrink-0 pt-2">
						<Button variant="outline" onClick={() => onOpenChange(false)}>
							Cancel
						</Button>
						<Button
							variant="default"
							type="submit"
							form="profile-form"
							disabled={isPending || isUploadingAvatar}
						>
							{isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Saving...
								</>
							) : (
								"Save Changes"
							)}
						</Button>
					</SheetFooter>
				</SheetContent>
			</Sheet>

			<AlertDialog
				open={showConfirmDialog}
				onOpenChange={setShowConfirmDialog}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
						<AlertDialogDescription>
							You have unsaved changes that haven't been saved yet. Are you
							sure you want to close? Your changes will be lost.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Continue Editing</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								setShowConfirmDialog(false);
								onOpenChange(false);
							}}
							className="bg-destructive text-white hover:bg-destructive/90"
						>
							Discard Changes
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
