import { getEventImageUrl } from "@/lib/image-url-utils";
import { toast } from "sonner";

/**
 * Strip HTML tags for clean plain-text share messages
 */
export function stripHtml(html?: string | null): string {
	if (!html) return "";
	if (typeof window === "undefined") {
		return html.replace(/<[^>]*>/g, "").trim();
	}
	const doc = new DOMParser().parseFromString(html, "text/html");
	return doc.body.textContent?.trim() || "";
}

/**
 * Convert any image URL / blob to a standard JPEG File for WhatsApp and Native Share compatibility
 */
export async function convertImageUrlToJpegFile(
	imageUrl: string,
	filename: string,
): Promise<File | null> {
	try {
		const response = await fetch(imageUrl, { mode: "cors" });
		if (!response.ok) return null;
		const blob = await response.blob();

		return new Promise((resolve) => {
			const url = URL.createObjectURL(blob);
			const img = new window.Image();
			img.crossOrigin = "anonymous";

			img.onload = () => {
				const canvas = document.createElement("canvas");
				canvas.width = img.naturalWidth;
				canvas.height = img.naturalHeight;
				const ctx = canvas.getContext("2d");
				if (!ctx) {
					URL.revokeObjectURL(url);
					resolve(null);
					return;
				}
				ctx.drawImage(img, 0, 0);
				canvas.toBlob(
					(jpegBlob) => {
						URL.revokeObjectURL(url);
						if (jpegBlob) {
							const cleanName = filename.replace(/[^a-zA-Z0-9_-]/g, "_");
							resolve(new File([jpegBlob], `${cleanName}.jpg`, { type: "image/jpeg" }));
						} else {
							resolve(null);
						}
					},
					"image/jpeg",
					0.92,
				);
			};

			img.onerror = () => {
				URL.revokeObjectURL(url);
				resolve(null);
			};

			img.src = url;
		});
	} catch {
		return null;
	}
}

export interface ShareNomineeParams {
	readonly optionText: string;
	readonly nomineeCode?: string | null;
	readonly bio?: string | null;
	readonly description?: string | null;
	readonly imageUrl?: string | null;
	readonly categoryName?: string;
	readonly eventTitle?: string;
	readonly url?: string;
}

/**
 * Rich share for Nominees / Candidates with picture attached
 */
export async function shareNominee(nominee: ShareNomineeParams) {
	const shareUrl = nominee.url || (typeof window !== "undefined" ? window.location.href : "");
	const imageUrl = getEventImageUrl(nominee.imageUrl);
	const bioText = stripHtml(nominee.bio || nominee.description);

	let caption = `Vote for ${nominee.optionText}!`;
	if (nominee.nomineeCode) {
		caption += ` (Code: #${nominee.nomineeCode})`;
	}
	if (nominee.categoryName) {
		caption += ` - ${nominee.categoryName}`;
	}
	if (bioText) {
		caption += `\n\n${bioText}`;
	}
	caption += `\n\nVote now at: ${shareUrl}`;

	// Try sharing with picture attached
	if (imageUrl && typeof navigator !== "undefined" && typeof navigator.canShare === "function") {
		try {
			const file = await convertImageUrlToJpegFile(imageUrl, nominee.optionText);
			if (file) {
				const shareData: ShareData = {
					title: `Vote for ${nominee.optionText}`,
					text: caption,
					files: [file],
				};

				if (navigator.canShare(shareData)) {
					await navigator.share(shareData);
					return;
				}
			}
		} catch {
			// Fall through to text-only share
		}
	}

	// Text-only Web Share API
	if (typeof navigator !== "undefined" && navigator.share) {
		try {
			await navigator.share({
				title: `Vote for ${nominee.optionText}`,
				text: caption,
			});
			return;
		} catch {
			// Fall through to clipboard
		}
	}

	// Clipboard fallback
	if (typeof window !== "undefined" && navigator.clipboard) {
		await navigator.clipboard.writeText(caption);
		toast.success("Nominee voting link and details copied to clipboard!");
	}
}

export interface ShareEventParams {
	readonly title: string;
	readonly organizationName?: string;
	readonly description?: string | null;
	readonly dateStr?: string | null;
	readonly locationStr?: string | null;
	readonly imageUrl?: string | null;
	readonly url?: string;
}

/**
 * Rich share for Events with poster / flier picture attached
 */
export async function shareEvent(event: ShareEventParams) {
	const shareUrl = event.url || (typeof window !== "undefined" ? window.location.href : "");
	const imageUrl = getEventImageUrl(event.imageUrl);
	const descText = stripHtml(event.description);

	let caption = `${event.title}`;
	if (event.organizationName) {
		caption += ` by ${event.organizationName}`;
	}
	if (event.dateStr) {
		caption += `\n📅 ${event.dateStr}`;
	}
	if (event.locationStr) {
		caption += `\n📍 ${event.locationStr}`;
	}
	if (descText) {
		caption += `\n\n${descText.slice(0, 200)}${descText.length > 200 ? "..." : ""}`;
	}
	caption += `\n\nDetails & Tickets: ${shareUrl}`;

	if (imageUrl && typeof navigator !== "undefined" && typeof navigator.canShare === "function") {
		try {
			const file = await convertImageUrlToJpegFile(imageUrl, event.title);
			if (file) {
				const shareData: ShareData = {
					title: event.title,
					text: caption,
					files: [file],
				};

				if (navigator.canShare(shareData)) {
					await navigator.share(shareData);
					return;
				}
			}
		} catch {
			// Fall through
		}
	}

	if (typeof navigator !== "undefined" && navigator.share) {
		try {
			await navigator.share({
				title: event.title,
				text: caption,
			});
			return;
		} catch {
			// Fall through
		}
	}

	if (typeof window !== "undefined" && navigator.clipboard) {
		await navigator.clipboard.writeText(caption);
		toast.success("Event details and link copied to clipboard!");
	}
}
