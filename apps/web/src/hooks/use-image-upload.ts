"use client";
// src/hooks/use-image-upload.ts
//
// Client-side image upload hook that automatically compresses to WebP
// and uploads to Cloudflare R2 via /api/upload.

import { useState } from "react";
import { toast } from "sonner";
import { convertToWebP, type ConvertToWebPOptions } from "@/lib/image-utils";
import type { StorageFolder } from "@/lib/constants/storage";

export interface UseImageUploadOptions {
	folder?: StorageFolder | string;
	resourceId?: string;
	convertOptions?: ConvertToWebPOptions;
	showErrorToast?: boolean;
}

export interface UploadResult {
	url: string;
	key: string;
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
	const {
		folder = "avatars",
		resourceId,
		convertOptions,
		showErrorToast = true,
	} = options;

	const [isUploading, setIsUploading] = useState(false);

	async function upload(file: File, oldUrl?: string | null): Promise<UploadResult | null> {
		setIsUploading(true);
		try {
			// Convert image to WebP with target compression
			const webpFile = await convertToWebP(file, convertOptions);

			const formData = new FormData();
			formData.append("file", webpFile);
			formData.append("folder", folder);
			if (resourceId) {
				formData.append("resourceId", resourceId);
			}
			if (oldUrl) {
				formData.append("oldUrl", oldUrl);
			}

			const res = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});

			const data = await res.json();
			if (!res.ok || !data.success) {
				const errMsg = data.error || "Failed to upload image";
				if (showErrorToast) toast.error(errMsg);
				return null;
			}

			return {
				url: data.url,
				key: data.key,
			};
		} catch (err: any) {
			const msg = err?.message || "An unexpected error occurred during upload";
			if (showErrorToast) toast.error(msg);
			return null;
		} finally {
			setIsUploading(false);
		}
	}

	return {
		isUploading,
		upload,
	};
}