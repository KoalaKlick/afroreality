"use client";

import { useState, useRef } from "react";
import { Plus, X, Loader2, Image as ImageIcon, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/lib/image-url-utils";
import { useImageUpload } from "@/hooks/use-image-upload";
import { toast } from "sonner";

interface GalleryImageManagerProps {
	readonly images: string[];
	readonly maxImages?: number;
	readonly onImagesChange: (images: string[]) => void;
	readonly disabled?: boolean;
}

export function GalleryImageManager({
	images,
	maxImages = 5,
	onImagesChange,
	disabled = false,
}: GalleryImageManagerProps) {
	const [uploadedCount, setUploadedCount] = useState(0);
	const [totalToUpload, setTotalToUpload] = useState(0);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { upload } = useImageUpload({
		folder: "events",
		convertOptions: { quality: 0.85, maxWidth: 1200, maxHeight: 1200 },
	});

	const isUploading = uploadedCount < totalToUpload && totalToUpload > 0;

	const handleAddImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		const remainingSlots = maxImages - images.length;
		if (remainingSlots <= 0) {
			toast.error(`Maximum ${maxImages} images allowed`);
			return;
		}

		const filesToUpload = Array.from(files).slice(0, remainingSlots);
		if (files.length > remainingSlots) {
			toast.warning(`Only ${remainingSlots} more image(s) can be added`);
		}

		setTotalToUpload(filesToUpload.length);
		setUploadedCount(0);

		const newImages = [...images];
		let successCount = 0;

		for (const file of filesToUpload) {
			try {
				const res = await upload(file);
				if (res) {
					newImages.push(res.key);
					successCount++;
				}
			} catch {
				// Continue with next file
			} finally {
				setUploadedCount((prev) => prev + 1);
			}
		}

		onImagesChange(newImages);

		if (successCount > 0) {
			toast.success(
				successCount === 1
					? "1 image added to gallery"
					: `${successCount} images added to gallery`,
			);
		}

		setTotalToUpload(0);
		setUploadedCount(0);

		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleRemoveImage = (index: number) => {
		const newImages = images.filter((_, i) => i !== index);
		onImagesChange(newImages);
		toast.success("Image removed");
	};

	const canAddMore = images.length < maxImages;
	const uploadProgress = totalToUpload > 0 ? Math.round((uploadedCount / totalToUpload) * 100) : 0;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<p className="text-xs text-muted-foreground">
						{images.length}/{maxImages} images
					</p>
					{isUploading && (
						<span className="text-xs text-primary font-medium">
							Uploading... {uploadProgress}%
						</span>
					)}
				</div>
				{canAddMore && !disabled && (
					<>
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							multiple
							onChange={handleAddImages}
							className="hidden"
							disabled={isUploading}
						/>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => fileInputRef.current?.click()}
							disabled={isUploading || disabled}
							className="gap-2"
						>
							{isUploading ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								<Plus className="size-4" />
							)}
							{isUploading ? "Uploading..." : "Add Images"}
						</Button>
					</>
				)}
			</div>

			{images.length > 0 ? (
				<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
					{images.map((img, index) => (
						<div
							key={index}
							className="relative aspect-square group overflow-hidden border border-border/60"
						>
							<img
								src={getImageUrl(img)}
								alt={`Gallery ${index + 1}`}
								className="w-full h-full object-cover"
								loading="lazy"
							/>
							{!disabled && (
								<button
									type="button"
									onClick={() => handleRemoveImage(index)}
									className="absolute top-1 right-1 p-1 bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
									title="Remove image"
								>
									<X className="size-3" />
								</button>
							)}
						</div>
					))}
					{canAddMore && !disabled && (
						<button
							type="button"
							onClick={() => fileInputRef.current?.click()}
							disabled={isUploading}
							className="aspect-square border-2 border-dashed border-border/60 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
						>
							{isUploading ? (
								<Loader2 className="size-5 animate-spin" />
							) : (
								<Plus className="size-5" />
							)}
						</button>
					)}
				</div>
			) : (
				<div
					onClick={() => canAddMore && !isUploading && fileInputRef.current?.click()}
					className="border-2 border-dashed border-border/60 p-8 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-pointer"
				>
					{isUploading ? (
						<>
							<Loader2 className="size-10 mb-2 animate-spin text-primary" />
							<p className="text-sm font-medium text-primary">Uploading...</p>
						</>
					) : (
						<>
							<Upload className="size-10 mb-2 opacity-50" />
							<p className="text-sm font-medium">Click to add images</p>
							<p className="text-xs">Up to {maxImages} images at once</p>
						</>
					)}
				</div>
			)}
		</div>
	);
}
