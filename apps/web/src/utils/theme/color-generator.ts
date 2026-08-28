/**
 * OKLCH-based color shade generator
 */

interface RGB {
	r: number;
	g: number;
	b: number;
}

export type ShadeLevel =
	| 50
	| 100
	| 200
	| 300
	| 400
	| 500
	| 600
	| 700
	| 800
	| 900
	| 950;

export type ColorShades = Record<ShadeLevel, string>;

/**
 * Convert HEX color to RGB
 */
export function hexToRgb(hex?: string | null): RGB | null {
	if (!hex) return null;
	const clean = hex.replace("#", "");
	if (clean.length === 3) {
		const r = parseInt(clean[0]! + clean[0]!, 16);
		const g = parseInt(clean[1]! + clean[1]!, 16);
		const b = parseInt(clean[2]! + clean[2]!, 16);
		return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
	}
	if (clean.length === 6) {
		const r = parseInt(clean.substring(0, 2), 16);
		const g = parseInt(clean.substring(2, 4), 16);
		const b = parseInt(clean.substring(4, 6), 16);
		return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
	}
	return null;
}

/**
 * Convert RGB to HEX
 */
export function rgbToHex(r: number, g: number, b: number): string {
	const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
	return (
		"#" +
		[clamp(r), clamp(g), clamp(b)]
			.map((x) => x.toString(16).padStart(2, "0"))
			.join("")
	);
}

/**
 * Generate tint or shade using OKLCH-like lightness interpolation
 */
export function generateColorShades(
	baseHex?: string | null,
	fallbackHex = "#009A44",
): ColorShades {
	const rgb = hexToRgb(baseHex) || hexToRgb(fallbackHex) || { r: 0, g: 154, b: 68 };
	const { r, g, b } = rgb;

	// Scale factors for standard 50-950 palette
	const mix = (targetR: number, targetG: number, targetB: number, weight: number) => {
		return rgbToHex(
			r * (1 - weight) + targetR * weight,
			g * (1 - weight) + targetG * weight,
			b * (1 - weight) + targetB * weight,
		);
	};

	return {
		50: mix(255, 255, 255, 0.92),
		100: mix(255, 255, 255, 0.8),
		200: mix(255, 255, 255, 0.6),
		300: mix(255, 255, 255, 0.4),
		400: mix(255, 255, 255, 0.2),
		500: rgbToHex(r, g, b),
		600: mix(0, 0, 0, 0.15),
		700: mix(0, 0, 0, 0.35),
		800: mix(0, 0, 0, 0.55),
		900: mix(0, 0, 0, 0.75),
		950: mix(0, 0, 0, 0.88),
	};
}
