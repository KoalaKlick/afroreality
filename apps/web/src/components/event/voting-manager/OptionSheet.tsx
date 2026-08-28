"use client";
// src/components/event/voting-manager/OptionSheet.tsx
import { useState, useTransition, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import {
	createVotingOption,
	updateVotingOption,
	getSuggestedNomineeCode,
} from "@/lib/server-functions/voting-options";
import { useImageUpload } from "@/hooks/use-image-upload";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { getErrorMessage } from "@/lib/utils";

export interface OptionItem {
	id: string;
	categoryId: string;
	optionText: string;
	nomineeCode?: string | null;
	description?: string | null;
	imageUrl?: string | null;
	votesCount?: number | bigint;
	status?: string | null;
}

interface OptionSheetProps {
	readonly eventId: string;
	readonly categoryId: string;
	readonly categoryName: string;
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly editingOption: OptionItem | null;
	readonly onSaved?: () => void;
}

export function OptionSheet({
	eventId,
	categoryId,
	categoryName,
	open,
	onOpenChange,
	editingOption,
	onSaved,
}: OptionSheetProps) {
	const [isPending, startTransition] = useTransition();
	const [optionText, setOptionText] = useState("");
	const [nomineeCode, setNomineeCode] = useState("");
	const [description, setDescription] = useState("");
	const [imageUrl, setImageUrl] = useState("");
	const fileInputRef = useRef<HTMLInputElement>(null);

	const { isUploading, upload } = useImageUpload({
		folder: "nominees",
		convertOptions: {
			quality: 0.85,
			maxWidth: 800,
			maxHeight: 800,
			maxSizeMB: 2,
		},
	});

	useEffect(() => {
		if (editingOption) {
			setOptionText(editingOption.optionText);
			setNomineeCode(editingOption.nomineeCode ?? "");
			setDescription(editingOption.description ?? "");
			setImageUrl(editingOption.imageUrl ?? "");
		} else {
			setOptionText("");
			setNomineeCode("");
			setDescription("");
			setImageUrl("");

			// Auto-generate nominee code from category initials
			if (open && eventId && categoryId) {
				getSuggestedNomineeCode({ data: { eventId, categoryId } })
					.then((res) => {
						const result = res as { code?: string };
						if (result?.code) setNomineeCode(result.code);
					})
					.catch(() => {});
			}
		}
	}, [editingOption, open, eventId, categoryId]);

	const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const res = await upload(file);
			if (res) {
				setImageUrl(res.url);
			}
		}
	};

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!optionText.trim()) {
			toast.error("Nominee name is required");
			return;
		}

		startTransition(async () => {
			try {
				if (editingOption) {
					await updateVotingOption({
						data: {
							id: editingOption.id,
							optionText,
							nomineeCode: nomineeCode || undefined,
							description: description || undefined,
							imageUrl: imageUrl || undefined,
						},
					});
					toast.success("Nominee updated successfully");
				} else {
					await createVotingOption({
						data: {
							eventId,
							categoryId,
							optionText,
							nomineeCode: nomineeCode || undefined,
							description: description || undefined,
							imageUrl: imageUrl || undefined,
						},
					});
					toast.success("Nominee added successfully");
				}

				onOpenChange(false);
				if (onSaved) onSaved();
			} catch (err) {
				toast.error(getErrorMessage(err));
			}
		});
	}

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-full sm:max-w-lg flex flex-col h-full overflow-y-auto">
				<SheetHeader>
					<SheetTitle>
						{editingOption ? "Edit Nominee / Option" : "Add Nominee / Option"}
					</SheetTitle>
					<SheetDescription>
						Category: <span className="font-semibold">{categoryName}</span>
					</SheetDescription>
				</SheetHeader>

				<form onSubmit={handleSubmit} className="space-y-4 py-4 flex-1">
					{/* Photo Upload */}
					<div className="space-y-2">
						<Label>Nominee Photo (Optional)</Label>
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							onChange={handleImageChange}
							className="hidden"
						/>
						{imageUrl ? (
							<div className="relative size-28 rounded-xl overflow-hidden border">
								<img
									src={getEventImageUrl(imageUrl) ?? ""}
									alt="Nominee"
									className="size-full object-cover"
								/>
								<button
									type="button"
									onClick={() => setImageUrl("")}
									className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
								>
									<X className="size-3.5" />
								</button>
							</div>
						) : (
							<button
								type="button"
								onClick={() => fileInputRef.current?.click()}
								disabled={isUploading}
								className="size-28 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/60 flex flex-col items-center justify-center gap-1.5 text-muted-foreground transition-colors"
							>
								{isUploading ? (
									<Loader2 className="size-6 animate-spin" />
								) : (
									<>
										<Upload className="size-5" />
										<span className="text-[10px]">Upload Photo</span>
									</>
								)}
							</button>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="option-name">Nominee Name / Option</Label>
						<Input
							id="option-name"
							value={optionText}
							onChange={(e) => setOptionText(e.target.value)}
							placeholder="e.g., John Doe or Team Alpha"
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="nominee-code">Nominee Code (Optional)</Label>
						<Input
							id="nominee-code"
							value={nomineeCode}
							onChange={(e) => setNomineeCode(e.target.value.toUpperCase())}
							placeholder="e.g., JD01"
						/>
						<p className="text-xs text-muted-foreground">
							Used for USSD and quick vote identification.
						</p>
					</div>

					<div className="space-y-2">
						<Label>Bio / Description (Optional)</Label>
						<RichTextEditor
							value={description}
							onChange={(val) => setDescription(val)}
							placeholder="Brief profile or details about this nominee..."
							minimal
						/>
					</div>

					<SheetFooter className="pt-6">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isPending}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending || isUploading}>
							{isPending ? (
								<>
									<Loader2 className="mr-2 size-4 animate-spin" />
									Saving...
								</>
							) : editingOption ? (
								"Save Nominee"
							) : (
								"Add Nominee"
							)}
						</Button>
					</SheetFooter>
				</form>
			</SheetContent>
		</Sheet>
	);
}
