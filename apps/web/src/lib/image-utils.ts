// src/lib/image-utils.ts
//
// Client-side WebP optimization and image handling utilities.

import { MAX_IMAGE_DIMENSION } from "./constants/storage";

export interface ConvertToWebPOptions {
	quality?: number; // 0-1, default 0.85
	maxWidth?: number;
	maxHeight?: number;
	maxSizeMB?: number; // target max file size in MB
}

/**
 * Converts an image file to WebP format with resizing and quality compression.
 */
export async function convertToWebP(
	file: File,
	options: ConvertToWebPOptions = {},
): Promise<File> {
	const {
		quality = 0.85,
		maxWidth = MAX_IMAGE_DIMENSION,
		maxHeight = MAX_IMAGE_DIMENSION,
		maxSizeMB = 2,
	} = options;

	return new Promise((resolve, reject) => {
		const img = new Image();
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");

		if (!ctx) {
			reject(new Error("Could not get canvas context"));
			return;
		}

		img.onload = () => {
			try {
				let { width, height } = img;

				if (maxWidth && width > maxWidth) {
					height = (height * maxWidth) / width;
					width = maxWidth;
				}

				if (maxHeight && height > maxHeight) {
					width = (width * maxHeight) / height;
					height = maxHeight;
				}

				canvas.width = Math.round(width);
				canvas.height = Math.round(height);

				ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

				canvas.toBlob(
					async (blob) => {
						if (!blob) {
							reject(new Error("Failed to convert image to WebP"));
							return;
						}

						let finalBlob = blob;
						if (maxSizeMB && blob.size > maxSizeMB * 1024 * 1024) {
							finalBlob = await reduceToTargetSize(canvas, maxSizeMB, quality);
						}

						const cleanName = file.name.replace(/\.[^/.]+$/, "") || "image";
						const webpFile = new File([finalBlob], `${cleanName}.webp`, {
							type: "image/webp",
							lastModified: Date.now(),
						});

						resolve(webpFile);
					},
					"image/webp",
					quality,
				);
			} catch (err) {
				reject(err);
			}
		};

		img.onerror = () => {
			reject(new Error("Failed to read image file"));
		};

		img.src = URL.createObjectURL(file);
	});
}

async function reduceToTargetSize(
	canvas: HTMLCanvasElement,
	targetSizeMB: number,
	initialQuality: number,
): Promise<Blob> {
	const targetBytes = targetSizeMB * 1024 * 1024;
	let currentQuality = initialQuality;
	let blob: Blob | null = null;

	for (let i = 0; i < 4; i++) {
		blob = await new Promise<Blob | null>((resolve) => {
			canvas.toBlob(
				(b) => resolve(b),
				"image/webp",
				currentQuality,
			);
		});

		if (!blob) break;
		if (blob.size <= targetBytes) {
			return blob;
		}

		currentQuality *= 0.8;
	}

	return blob || new Blob();
}

export function isImageFile(file: File): boolean {
	return file.type.startsWith("image/");
}

export function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}