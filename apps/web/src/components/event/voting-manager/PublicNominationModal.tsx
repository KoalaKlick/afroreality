"use client";
// src/components/event/voting-manager/PublicNominationModal.tsx


import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, X, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { submitPublicNomination } from "@/lib/server-functions/voting-votes";
import { useImageUpload } from "@/hooks/use-image-upload";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { getErrorMessage } from "@/lib/utils";

interface PublicNominationModalProps {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly eventId: string;
	readonly categoryId: string;
	readonly categoryName: string;
	readonly nominationPrice?: number;
}

export function PublicNominationModal({
	open,
	onOpenChange,
	eventId,
	categoryId,
	categoryName,
	nominationPrice = 0,
}: PublicNominationModalProps) {
	const [isPending, startTransition] = useTransition();
	const [nomineeName, setNomineeName] = useState("");
	const [nomineeEmail, setNomineeEmail] = useState("");
	const [description, setDescription] = useState("");
	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const [isSuccess, setIsSuccess] = useState(false);

	const { isUploading, upload } = useImageUpload({
		folder: "nominees",
		convertOptions: {
			quality: 0.85,
			maxWidth: 800,
			maxHeight: 800,
			maxSizeMB: 2,
		},
	});

	const resetForm = () => {
		setNomineeName("");
		setNomineeEmail("");
		setDescription("");
		setImageUrl(null);
		setIsSuccess(false);
	};

	const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const res = await upload(file);
			if (res?.url) {
				setImageUrl(res.url);
			}
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!nomineeName.trim()) return;

		startTransition(async () => {
			try {
				await submitPublicNomination({
					data: {
						eventId,
						categoryId,
						optionText: nomineeName.trim(),
						email: nomineeEmail.trim() || undefined,
						description: description.trim() || undefined,
						imageUrl: imageUrl || undefined,
					},
				});

				setIsSuccess(true);
				toast.success("Nomination submitted successfully!");
			} catch (error) {
				toast.error(getErrorMessage(error));
			}
		});
	};

	const handleClose = () => {
		resetForm();
		onOpenChange(false);
	};

	if (isSuccess) {
		return (
			<Dialog open={open} onOpenChange={handleClose}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="text-center">Nomination Submitted!</DialogTitle>
						<DialogDescription className="text-center">
							Your nomination for <strong>{categoryName}</strong> has been submitted
							for review. You&apos;ll be notified once it&apos;s approved.
						</DialogDescription>
					</DialogHeader>
					<div className="flex justify-center pt-4">
						<Button onClick={handleClose}>Done</Button>
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<UserPlus className="size-5" />
						Nominate for {categoryName}
					</DialogTitle>
					<DialogDescription>
						{nominationPrice > 0
							? `There is a nomination fee of GHS ${nominationPrice.toFixed(2)}.`
							: "Submit a nominee for this category."}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="nominee-name">Nominee Name *</Label>
						<Input
							id="nominee-name"
							value={nomineeName}
							onChange={(e) => setNomineeName(e.target.value)}
							placeholder="Who are you nominating?"
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="nominee-email">Contact Email</Label>
						<Input
							id="nominee-email"
							type="email"
							value={nomineeEmail}
							onChange={(e) => setNomineeEmail(e.target.value)}
							placeholder="For updates about this nomination"
						/>
					</div>

					<div className="space-y-2">
						<Label>Photo (Optional)</Label>
						{imageUrl ? (
							<div className="relative size-24 rounded-lg overflow-hidden border">
								<img
									src={getEventImageUrl(imageUrl) ?? ""}
									alt="Nominee"
									className="size-full object-cover"
								/>
								<button
									type="button"
									onClick={() => setImageUrl(null)}
									className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
								>
									<X className="size-3" />
								</button>
							</div>
						) : (
							<label className="size-24 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/60 flex flex-col items-center justify-center gap-1 text-muted-foreground cursor-pointer transition-colors">
								{isUploading ? (
									<Loader2 className="size-5 animate-spin" />
								) : (
									<>
										<Upload className="size-4" />
										<span className="text-[10px]">Photo</span>
									</>
								)}
								<input
									type="file"
									accept="image/*"
									onChange={handleImageChange}
									className="hidden"
								/>
							</label>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="nominee-description">Why should they win?</Label>
						<Textarea
							id="nominee-description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Brief description or pitch..."
							rows={3}
						/>
					</div>

					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={handleClose}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isPending || isUploading || !nomineeName.trim()}
						>
							{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							{nominationPrice > 0 ? `Pay & Submit` : "Submit Nomination"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
