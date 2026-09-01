// src/lib/constants/storage.ts
//
// Storage bucket and folder naming constants for Cloudflare R2.

export const STORAGE_BUCKETS = {
	AVATARS: "avatars",
	EVENTS: "events",
	ORGANIZATIONS: "organizations",
	DOCUMENTS: "documents",
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

export const ALLOWED_STORAGE_FOLDERS = [
	"avatars",
	"events",
	"covers",
	"organizations",
	"documents",
	"nominees",
	"tickets",
	"uploads",
	"sponsors",
] as const;

export type StorageFolder = (typeof ALLOWED_STORAGE_FOLDERS)[number];

export const MAX_IMAGE_INPUT_SIZE = 8 * 1024 * 1024; // 8 MB max input before compression
export const MAX_WEBP_TARGET_SIZE = 2 * 1024 * 1024; // 2 MB target WebP
export const MAX_IMAGE_DIMENSION = 1920; // max width/height in px