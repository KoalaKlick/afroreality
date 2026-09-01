"use client";
// src/components/event/tabs/SponsorDialog.tsx

import { X, Upload, Loader2 } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useImageUpload } from "@/hooks/use-image-upload";
import { getSponsorImageUrl } from "@/lib/image-url-utils";
import type { EventSponsor } from "./types";

interface SponsorDialogProps {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly sponsor: EventSponsor | null;
	readonly onSave: (sponsor: EventSponsor) => void;
	readonly isPending: boolean;
}

export function SponsorDialog({
	open,
	onOpenChange,
	sponsor,
	onSave,
	isPending,
}: SponsorDialogProps) {
	const [name, setName] = useState(sponsor?.name ?? "");
	const [logo, setLogo] = useState(sponsor?.logo ?? "");
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Sync form state when sponsor prop changes (for editing existing sponsors)
	useEffect(() => {
		setName(sponsor?.name ?? "");
		setLogo(sponsor?.logo ?? "");
	}, [sponsor]);

	const { isUploading, upload } = useImageUpload({
		folder: "sponsors",
		convertOptions: { quality: 0.85, maxWidth: 400, maxHeight: 400 },
	});

	const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const res = await upload(file);
			if (res) setLogo(res.url);
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			toast.error("Sponsor name is required");
			return;
		}
		onSave({ name, logo: logo || null });
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{sponsor ? "Edit Sponsor" : "Add Sponsor"}</DialogTitle>
					<DialogDescription>
						Upload the sponsor's logo and enter their company name.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4 py-2">
					<div className="space-y-2">
						<Label>Sponsor Logo</Label>
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							onChange={handleUpload}
							className="hidden"
						/>
						{logo ? (
							<div className="relative size-20 rounded-xl overflow-hidden border">
							<img
								src={getSponsorImageUrl(logo) ?? ""}
								alt="Logo"
								className="size-full object-contain p-2"
							/>
								<button
									type="button"
									onClick={() => setLogo("")}
									className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white"
								>
									<X className="size-3" />
								</button>
							</div>
						) : (
							<button
								type="button"
								onClick={() => fileInputRef.current?.click()}
								disabled={isUploading}
								className="size-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/40 transition-colors"
							>
								{isUploading ? (
									<Loader2 className="size-5 animate-spin" />
								) : (
									<>
										<Upload className="size-4 mb-1" />
										<span className="text-[9px]">Logo</span>
									</>
								)}
							</button>
						)}
					</div>
					<div className="space-y-2">
						<Label>Sponsor Name</Label>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g., MTN Ghana"
							required
						/>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending || isUploading}>
							Save Sponsor
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
