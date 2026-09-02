export const BUCKETS = {
	AVATARS: "avatars",
	EVENTS: "events",
	ORGANIZATIONS: "organizations",
	SPONSORS: "sponsors",
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

export const DEFAULT_STORAGE_BASE_URL =
	process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
	process.env.R2_PUBLIC_URL_PREFIX ||
	process.env.NEXT_PUBLIC_STORAGE_URL ||
	"https://pub-7eea00abc69849599238b5352b41898f.r2.dev";

export function isFullUrl(pathOrUrl: string | null | undefined): boolean {
	if (!pathOrUrl) return false;
	return (
		pathOrUrl.startsWith("http://") ||
		pathOrUrl.startsWith("https://") ||
		pathOrUrl.startsWith("blob:") ||
		pathOrUrl.startsWith("data:")
	);
}

export function isLocalPath(pathOrUrl: string | null | undefined): boolean {
	if (!pathOrUrl) return false;
	return pathOrUrl.startsWith("/");
}

/**
 * Strips the public domain prefix from a storage URL before saving to DB,
 * storing only the relative key/file identifier (e.g. "avatars/123.webp").
 */
export function cleanStorageKey(pathOrUrl?: string | null): string {
	if (!pathOrUrl) return "";
	const clean = pathOrUrl.trim();
	if (!clean) return "";

	// If it's a blob or data url, keep as is
	if (clean.startsWith("blob:") || clean.startsWith("data:")) return clean;

	try {
		const base = DEFAULT_STORAGE_BASE_URL.replace(/\/+$/, "");
		if (clean.startsWith(base)) {
			return clean.slice(base.length).replace(/^\/+/, "");
		}

		if (clean.startsWith("http://") || clean.startsWith("https://")) {
			const parsed = new URL(clean);
			const pathname = parsed.pathname.replace(/^\/+/, "");
			// If contains bucket prefix like "fextivaapi/avatars/...", strip bucket
			const bucket = process.env.R2_BUCKET_NAME || "afrorealityapi";
			if (pathname.startsWith(`${bucket}/`)) {
				return pathname.slice(bucket.length + 1);
			}
			return pathname;
		}

		return clean.replace(/^\/+/, "");
	} catch {
		return clean;
	}
}

/**
 * Resolves any relative key or full URL to a valid image src for display.
 * Paths starting with "/" are treated as storage keys (not local paths)
 * unless they match known local asset patterns (/landing/, /stat-icon/, etc.).
 */
export function getImageUrl(pathOrUrl?: string | null): string {
	if (!pathOrUrl) return "";
	const clean = pathOrUrl.trim();
	if (!clean) return "";

	if (isFullUrl(clean)) {
		return clean;
	}

	// Known local asset prefixes that should NOT go through R2
	const localPrefixes = ["/landing/", "/stat-icon/", "/icons/", "/assets/"];
	const isKnownLocal = localPrefixes.some((prefix) => clean.startsWith(prefix));
	if (isKnownLocal) {
		return clean;
	}

	const prefix = DEFAULT_STORAGE_BASE_URL.replace(/\/+$/, "");
	const relativeKey = clean.replace(/^\/+/, "");
	return `${prefix}/${relativeKey}`;
}

const LOCAL_PREFIXES = ["/landing/", "/stat-icon/", "/icons/", "/assets/"];

function isLocalAsset(path: string): boolean {
	return LOCAL_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function getAvatarUrl(pathOrUrl?: string | null): string {
	if (!pathOrUrl) return "";
	const clean = pathOrUrl.trim();
	if (!clean) return "";

	if (isFullUrl(clean) || isLocalAsset(clean)) {
		return clean;
	}

	const prefix = DEFAULT_STORAGE_BASE_URL.replace(/\/+$/, "");
	const relativeKey = clean.replace(/^\/+/, "");
	if (relativeKey.startsWith("avatars/")) {
		return `${prefix}/${relativeKey}`;
	}
	return `${prefix}/avatars/${relativeKey}`;
}

export function getEventImageUrl(pathOrUrl?: string | null): string {
	if (!pathOrUrl) return "";
	const clean = pathOrUrl.trim();
	if (!clean) return "";

	if (isFullUrl(clean) || isLocalAsset(clean)) {
		return clean;
	}

	const prefix = DEFAULT_STORAGE_BASE_URL.replace(/\/+$/, "");
	const relativeKey = clean.replace(/^\/+/, "");
	if (relativeKey.startsWith("events/")) {
		return `${prefix}/${relativeKey}`;
	}
	return `${prefix}/events/${relativeKey}`;
}

export function getOrgImageUrl(pathOrUrl?: string | null): string {
	if (!pathOrUrl) return "";
	const clean = pathOrUrl.trim();
	if (!clean) return "";

	if (isFullUrl(clean) || isLocalAsset(clean)) {
		return clean;
	}

	const prefix = DEFAULT_STORAGE_BASE_URL.replace(/\/+$/, "");
	const relativeKey = clean.replace(/^\/+/, "");
	if (
		relativeKey.startsWith("organizations/") ||
		relativeKey.startsWith("orgs/")
	) {
		return `${prefix}/${relativeKey}`;
	}
	return `${prefix}/organizations/${relativeKey}`;
}

export function getSponsorImageUrl(pathOrUrl?: string | null): string {
	if (!pathOrUrl) return "";
	const clean = pathOrUrl.trim();
	if (!clean) return "";

	if (isFullUrl(clean) || isLocalAsset(clean)) {
		return clean;
	}

	const prefix = DEFAULT_STORAGE_BASE_URL.replace(/\/+$/, "");
	const relativeKey = clean.replace(/^\/+/, "");
	if (relativeKey.startsWith("sponsors/")) {
		return `${prefix}/${relativeKey}`;
	}
	return `${prefix}/sponsors/${relativeKey}`;
}
