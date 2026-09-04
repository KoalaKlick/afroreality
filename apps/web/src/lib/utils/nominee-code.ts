/**
 * Extract a 3-character uppercase prefix from category initials/name.
 * - If 3 or more words: Take first letter of each of the first 3 words.
 *   E.g., "Best Male Artist" -> "BMA", "Hip Hop Song" -> "HHS"
 * - If 2 words: Take first letter of 1st word + first 2 letters of 2nd word.
 *   E.g., "Best Actor" -> "BAC", "Gospel Song" -> "GSO", "Male Artist" -> "MAR"
 * - If 1 word: Take first 3 letters.
 *   E.g., "Artiste" -> "ART", "Music" -> "MUS"
 * - If < 3 characters: Pad with "X" (e.g., "DJ" -> "DJX")
 * - If empty: Default to "CAT"
 */
export function extractCategoryPrefix(categoryName?: string | null): string {
	if (!categoryName) return "CAT";
	const clean = categoryName.trim().replace(/[^a-zA-Z0-9\s]/g, "");
	const words = clean.split(/\s+/).filter(Boolean);

	if (words.length >= 3) {
		return (words[0]![0]! + words[1]![0]! + words[2]![0]!).toUpperCase();
	}
	if (words.length === 2) {
		const first = words[0]![0]!;
		const secondPart = words[1]!.slice(0, 2);
		const combined = (first + secondPart).toUpperCase();
		return combined.length >= 3 ? combined : combined.padEnd(3, "X");
	}
	if (words.length === 1) {
		const word = words[0]!.toUpperCase();
		return word.length >= 3 ? word.slice(0, 3) : word.padEnd(3, "X");
	}
	return "CAT";
}

export function generateNomineeCode(categoryName = "CAT", index = 1): string {
	const prefix = extractCategoryPrefix(categoryName);
	const padded = String(index || 1).padStart(2, "0");
	return `${prefix}${padded}`;
}

