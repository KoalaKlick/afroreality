// src/lib/storage.ts
//
// Cloudflare R2 Storage integration using AWS S3 SDK v3.

import {
	DeleteObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";

function getS3Client(): S3Client | null {
	const endpoint = process.env.R2_ENDPOINT;
	const accessKeyId = process.env.R2_ACCESS_KEY;
	const secretAccessKey = process.env.R2_SECRET_KEY;

	if (!endpoint || !accessKeyId || !secretAccessKey) {
		console.warn("[R2] Cloudflare R2 credentials not fully configured in environment.");
		return null;
	}

	return new S3Client({
		region: "auto",
		endpoint,
		credentials: {
			accessKeyId,
			secretAccessKey,
		},
	});
}

export function getBucketName(): string {
	return process.env.R2_BUCKET_NAME || "afrorealityapi";
}

export function buildPublicUrl(key: string): string {
	const prefix =
		process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
		process.env.R2_PUBLIC_URL_PREFIX ||
		"https://pub-7eea00abc69849599238b5352b41898f.r2.dev";
	const cleanPrefix = prefix.replace(/\/+$/, "");
	const cleanKey = key.replace(/^\/+/, "");
	return `${cleanPrefix}/${cleanKey}`;
}

export function extractKeyFromUrl(fileUrl: string): string | null {
	if (!fileUrl) return null;
	try {
		const prefix =
			process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
			process.env.R2_PUBLIC_URL_PREFIX ||
			"https://pub-7eea00abc69849599238b5352b41898f.r2.dev";
		if (prefix && fileUrl.startsWith(prefix)) {
			return fileUrl.slice(prefix.length).replace(/^\/+/, "");
		}

		const parsed = new URL(fileUrl, "http://localhost");
		const pathname = parsed.pathname.replace(/^\/+/, "");
		const bucket = getBucketName();
		if (pathname.startsWith(`${bucket}/`)) {
			return pathname.slice(bucket.length + 1);
		}
		return pathname;
	} catch {
		return fileUrl;
	}
}

export interface UploadToR2Params {
	fileBuffer: Uint8Array | Buffer;
	fileName: string;
	contentType?: string;
	folder: string;
	resourceId?: string;
}

export interface UploadResponse {
	fileName: string;
	fileUrl: string;
	contentType: string;
	size: number;
	storageKey: string;
}

export async function uploadToR2({
	fileBuffer,
	fileName,
	contentType = "image/webp",
	folder = "avatars",
	resourceId,
}: UploadToR2Params): Promise<UploadResponse> {
	const s3 = getS3Client();
	if (!s3) {
		throw new Error("Cloudflare R2 is not configured. Check environment variables.");
	}

	const bucket = getBucketName();
	const cleanFolder = folder.replace(/^\/+|\/+$/g, "");
	const extension = fileName.includes(".") ? fileName.slice(fileName.lastIndexOf(".")) : ".webp";
	const fileKeyName = resourceId
		? `${resourceId.trim()}${extension}`
		: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${extension}`;
	const storageKey = `${cleanFolder}/${fileKeyName}`;

	const command = new PutObjectCommand({
		Bucket: bucket,
		Key: storageKey,
		Body: fileBuffer,
		ContentType: contentType,
		CacheControl: "public, max-age=31536000, immutable",
	});

	await s3.send(command);

	const fileUrl = buildPublicUrl(storageKey);

	return {
		fileName,
		fileUrl,
		contentType,
		size: fileBuffer.length,
		storageKey,
	};
}

export async function deleteFromR2ByUrl(fileUrl: string): Promise<boolean> {
	const key = extractKeyFromUrl(fileUrl);
	if (!key) return false;

	const s3 = getS3Client();
	if (!s3) return false;

	try {
		const command = new DeleteObjectCommand({
			Bucket: getBucketName(),
			Key: key,
		});
		await s3.send(command);
		return true;
	} catch {
		return false;
	}
}

export async function deleteFromR2ByPrefix(prefix: string): Promise<void> {
	const s3 = getS3Client();
	if (!s3) return;

	try {
		const listCommand = new ListObjectsV2Command({
			Bucket: getBucketName(),
			Prefix: prefix,
		});
		const listResult = await s3.send(listCommand);

		if (listResult.Contents && listResult.Contents.length > 0) {
			for (const obj of listResult.Contents) {
				if (obj.Key) {
					await s3.send(
						new DeleteObjectCommand({
							Bucket: getBucketName(),
							Key: obj.Key,
						}),
					);
				}
			}
		}
	} catch (err) {
		console.error("[R2] Error deleting objects by prefix:", err);
	}
}
