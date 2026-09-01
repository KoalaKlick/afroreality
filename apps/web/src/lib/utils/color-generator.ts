/**
 * OKLCH-based color shade generator
 * Ported from fextiva/utils/theme/color-generator.ts
 */

interface RGB {
	r: number;
	g: number;
	b: number;
}

export function hexToRgb(hex: string): RGB | null {
	hex = hex.replace(/^[#@]/, "").trim();
	if (hex.length === 3) {
		hex = hex
			.split("")
			.map((char) => char + char)
			.join("");
	}
	if (hex.length === 8) {
		hex = hex.slice(0, 6);
	}
	const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result && result[1] && result[2] && result[3] ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16),
	} : null;
}

export function rgbToHex(rgb: RGB): string {
	const toHex = (n: number) => {
		const hex = Math.round(n).toString(16);
		return hex.length === 1 ? "0" + hex : hex;
	};
	return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

export function hexToRgba(hex: string, alpha: number): string {
	const rgb = hexToRgb(hex);
	if (!rgb) return "rgba(0, 0, 0, 0)";
	return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function srgbToLinear(c: number) {
	const v = c / 255;
	return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearToSrgb(v: number) {
	return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}

function rgbToOklab(rgb: RGB) {
	const r = srgbToLinear(rgb.r);
	const g = srgbToLinear(rgb.g);
	const b = srgbToLinear(rgb.b);
	const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
	const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
	const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
	const l_ = Math.cbrt(l);
	const m_ = Math.cbrt(m);
	const s_ = Math.cbrt(s);
	const L = 0.210454255 * l_ + 0.793617785 * m_ - 0.004072047 * s_;
	const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
	const b_ = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
	return { L, a, b: b_ };
}

function oklabToRgb(ok: { L: number; a: number; b: number }): RGB {
	const l_ = ok.L + 0.3963377774 * ok.a + 0.2158037573 * ok.b;
	const m_ = ok.L - 0.1055613458 * ok.a - 0.0638541728 * ok.b;
	const s_ = ok.L - 0.0894841775 * ok.a - 1.291485548 * ok.b;
	const l = l_ * l_ * l_;
	const m = m_ * m_ * m_;
	const s = s_ * s_ * s_;
	const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
	const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
	const b = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
	return {
		r: Math.max(0, Math.min(255, Math.round(linearToSrgb(r) * 255))),
		g: Math.max(0, Math.min(255, Math.round(linearToSrgb(g) * 255))),
		b: Math.max(0, Math.min(255, Math.round(linearToSrgb(b) * 255))),
	};
}

function oklabToOklch(ok: { L: number; a: number; b: number }) {
	const c = Math.sqrt(ok.a * ok.a + ok.b * ok.b);
	const h = Math.atan2(ok.b, ok.a) * (180 / Math.PI);
	return { L: ok.L, C: c, h: h < 0 ? h + 360 : h };
}

function oklchToOklab(lch: { L: number; C: number; h: number }) {
	const hRad = (lch.h * Math.PI) / 180;
	return { L: lch.L, a: lch.C * Math.cos(hRad), b: lch.C * Math.sin(hRad) };
}

export function hexToOklch(hex: string) {
	const rgb = hexToRgb(hex);
	if (!rgb) return null;
	const lab = rgbToOklab(rgb);
	return oklabToOklch(lab);
}

export function oklchToHex(lch: { L: number; C: number; h: number }) {
	const lab = oklchToOklab(lch);
	const rgb = oklabToRgb(lab);
	return rgbToHex(rgb);
}

/**
 * Generate color shades from a base color.
 * Generates 11 shades from 50 (lightest) to 950 (darkest).
 */
export function generateColorShades(
	baseColor: string,
): Record<number, string> {
	const lch = hexToOklch(baseColor);
	if (!lch) return {};

	const baseL = lch.L;
	const baseC = lch.C;
	const baseH = lch.h;

	const offsets: Record<number, number> = {
		50: 0.48,
		100: 0.43,
		200: 0.33,
		300: 0.22,
		400: 0.11,
		500: 0,
		600: -0.11,
		700: -0.21,
		800: -0.31,
		900: -0.41,
		950: -0.47,
	};

	const shades: Record<number, string> = {};
	const clamp = (v: number, a = 0.01, b = 0.99) =>
		Math.max(a, Math.min(b, v));

	Object.entries(offsets).forEach(([shadeStr, offset]) => {
		const shade = parseInt(shadeStr, 10);
		if (shade === 500) {
			shades[shade] = baseColor;
			return;
		}
		const L = clamp(baseL + offset);
		let C = baseC;
		if (offset > 0) {
			const ratio = offset / 0.48;
			C = baseC * Math.pow(1 - ratio, 1.2);
			C = Math.max(0.004, C);
		} else if (offset < 0) {
			const ratio = Math.abs(offset) / 0.47;
			C = Math.min(baseC * 1.15, baseC + ratio * 0.02);
		}
		shades[shade] = oklchToHex({ L, C, h: baseH });
	});

	return shades;
}
