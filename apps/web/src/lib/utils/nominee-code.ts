/**
 * Extracts 2-letter uppercase candidate prefixes from an event title/slug.
 * Limit to 4 characters total when combined with 2-digit number (e.g. GM01).
 */
export function extractEventPrefixCandidates(
	eventTitle?: string | null,
	eventSlug?: string | null,
): string[] {
	const candidates = new Set<string>();
	const stopWords = new Set(["THE", "AND", "OF", "FOR", "IN", "ON", "AT", "TO", "A", "AN", "BY", "WITH"]);

	if (eventTitle) {
		const clean = eventTitle.trim().replace(/[^a-zA-Z0-9\s]/g, "");
		const words = clean
			.split(/\s+/)
			.filter(Boolean)
			.map((w) => w.toUpperCase())
			.filter((w) => !stopWords.has(w));

		if (words.length >= 2) {
			// First letter of first 2 words: e.g. "Ghana Music" -> "GM"
			candidates.add(words[0]![0]! + words[1]![0]!);
			// If 3+ words: first letter of word 1 & 3: e.g. "Ghana Music Awards" -> "GA"
			if (words.length >= 3) {
				candidates.add(words[0]![0]! + words[2]![0]!);
				candidates.add(words[1]![0]! + words[2]![0]!);
			}
			// First 2 letters of word 1
			if (words[0]!.length >= 2) {
				candidates.add(words[0]!.slice(0, 2));
			}
			// First 2 letters of word 2
			if (words[1]!.length >= 2) {
				candidates.add(words[1]!.slice(0, 2));
			}
		} else if (words.length === 1 && words[0]!.length >= 2) {
			candidates.add(words[0]!.slice(0, 2));
			if (words[0]!.length >= 3) {
				candidates.add(words[0]![0]! + words[0]![2]!);
			}
			if (words[0]!.length >= 4) {
				candidates.add(words[0]![0]! + words[0]![words[0]!.length - 1]!);
			}
		}
	}

	if (eventSlug) {
		const cleanSlug = eventSlug.replace(/[^a-zA-Z0-9-]/g, "");
		const slugParts = cleanSlug
			.split("-")
			.filter(Boolean)
			.map((p) => p.toUpperCase())
			.filter((p) => !stopWords.has(p) && !/^\d+$/.test(p));
		if (slugParts.length >= 2) {
			candidates.add(slugParts[0]![0]! + slugParts[1]![0]!);
		} else if (slugParts.length === 1 && slugParts[0]!.length >= 2) {
			candidates.add(slugParts[0]!.slice(0, 2));
		}
	}

	return Array.from(candidates).filter((c) => /^[A-Z]{2}$/.test(c));
}

/**
 * Extract a 2-character uppercase prefix from category initials/name as fallback.
 */
export function extractCategoryPrefix(categoryName?: string | null): string {
	if (!categoryName) return "CA";
	const clean = categoryName.trim().replace(/[^a-zA-Z0-9\s]/g, "");
	const words = clean.split(/\s+/).filter(Boolean);

	if (words.length >= 2) {
		return (words[0]![0]! + words[1]![0]!).toUpperCase();
	}
	if (words.length === 1) {
		const word = words[0]!.toUpperCase();
		return word.length >= 2 ? word.slice(0, 2) : word.padEnd(2, "X");
	}
	return "CA";
}

/**
 * Generates a 4-character nominee code: 2 alphabets + 2 numbers (e.g. GM01).
 */
export function generateNomineeCode(eventTitleOrPrefix = "EV", index = 1): string {
	const candidates = extractEventPrefixCandidates(eventTitleOrPrefix);
	const prefix = candidates[0] || (eventTitleOrPrefix.length >= 2 ? eventTitleOrPrefix.slice(0, 2).toUpperCase() : "EV");
	const safeIndex = Math.max(1, Math.min(99, index || 1));
	const padded = String(safeIndex).padStart(2, "0");
	return `${prefix}${padded}`;
}

