"use client";

import { useMemo } from "react";
import { useBrandColors } from "@/hooks/theme/use-brand-colors";

interface BrandingSyncProps {
	readonly primaryColor?: string;
	readonly secondaryColor?: string;
	readonly tertiaryColor?: string;
}

export function BrandingSync({
	primaryColor,
	secondaryColor,
	tertiaryColor,
}: BrandingSyncProps) {
	const brandColors = useMemo(
		() =>
			primaryColor || secondaryColor || tertiaryColor
				? {
						primary: primaryColor || "#009A44",
						secondary: secondaryColor || "#FFCD00",
						tertiary: tertiaryColor || "#C8102E",
					}
				: undefined,
		[primaryColor, secondaryColor, tertiaryColor],
	);

	useBrandColors(brandColors);

	return null;
}
