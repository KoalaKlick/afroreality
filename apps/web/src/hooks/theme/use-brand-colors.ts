"use client";

import { useEffect, useRef, useState } from "react";
import {
	generateBrandColorShades,
	hexToRgb,
	type BrandColors,
	type BrandColorShades,
} from "@/utils/theme/color-generator";

export function useBrandColors(initialColors?: BrandColors) {
	const [brandColors, setBrandColors] = useState<BrandColors | null>(
		initialColors || null,
	);
	const [colorShades, setColorShades] = useState<BrandColorShades | null>(
		initialColors ? generateBrandColorShades(initialColors) : null,
	);

	const appliedPropsRef = useRef<Set<string>>(new Set());

	useEffect(() => {
		if (!brandColors || typeof document === "undefined") return;

		const root = document.documentElement;
		const applied = appliedPropsRef.current;

		function set(prop: string, value: string) {
			root.style.setProperty(prop, value);
			applied.add(prop);
		}

		const shades = generateBrandColorShades(brandColors);
		setColorShades(shades);

		if (brandColors.primary) {
			set("--primary", brandColors.primary);
			set("--color-primary", brandColors.primary);
			set("--color-brand-primary", brandColors.primary);
		}
		if (brandColors.secondary) {
			set("--secondary", brandColors.secondary);
			set("--color-secondary", brandColors.secondary);
			set("--color-brand-secondary", brandColors.secondary);
		}
		if (brandColors.tertiary) {
			set("--tertiary", brandColors.tertiary);
			set("--color-tertiary", brandColors.tertiary);
			set("--color-brand-tertiary", brandColors.tertiary);
		}

		Object.entries(shades).forEach(([colorName, shadeMap]) => {
			Object.entries(shadeMap).forEach(([shade, value]) => {
				const colorValue = value as string;
				const rgbValue = hexToRgb(colorValue);

				set(`--brand-${colorName}-${shade}`, colorValue);
				set(`--color-${colorName}-${shade}`, colorValue);
				set(`--${colorName}-${shade}`, colorValue);

				if (shade === "500") {
					set(`--${colorName}`, colorValue);
					set(`--color-${colorName}`, colorValue);
				}

				if (rgbValue) {
					set(`--${colorName}-${shade}-rgb`, `${rgbValue.r}, ${rgbValue.g}, ${rgbValue.b}`);
					set(`--color-${colorName}-${shade}-rgb`, `${rgbValue.r}, ${rgbValue.g}, ${rgbValue.b}`);
				}
			});
		});

		return () => {
			if (typeof document === "undefined") return;
			const r = document.documentElement;
			for (const prop of applied) {
				r.style.removeProperty(prop);
			}
			applied.clear();
		};
	}, [brandColors]);

	useEffect(() => {
		if (!initialColors) {
			setBrandColors(null);
			return;
		}
		setBrandColors((prev) => {
			if (
				prev &&
				prev.primary === initialColors.primary &&
				prev.secondary === initialColors.secondary &&
				prev.tertiary === initialColors.tertiary
			) {
				return prev;
			}
			return initialColors;
		});
	}, [initialColors]);

	return { brandColors, colorShades };
}
