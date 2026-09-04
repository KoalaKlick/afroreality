import type { SVGProps } from "react";

interface OrgGeometricBannerProps extends SVGProps<SVGSVGElement> {
	readonly primaryColor?: string | null;
	readonly secondaryColor?: string | null;
	readonly tertiaryColor?: string | null;
}

export function OrgGeometricBanner({
	primaryColor,
	secondaryColor,
	tertiaryColor,
	className = "w-full h-full",
	...props
}: OrgGeometricBannerProps) {
	const primary = primaryColor || "#009A44";
	const secondary = secondaryColor || "#FFD100";
	const tertiary = tertiaryColor || "#EF3340";

	return (
		<svg
			viewBox="0 0 1440 260"
			preserveAspectRatio="none"
			className={className}
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			aria-hidden="true"
			{...props}
		>
			{/* Soft light tinted backdrop with primary tint */}
			<rect
				width="1440"
				height="260"
				fill={primary}
				fillOpacity="0.08"
			/>

			{/* Diagonal Polygon 1: Secondary Color */}
			<polygon
				points="0,0 520,0 200,260 0,260"
				fill={secondary}
				fillOpacity="0.85"
			/>

			{/* Diagonal Polygon 2: Primary Color */}
			<polygon
				points="100,0 380,0 260,260 0,180"
				fill={primary}
				fillOpacity="0.95"
			/>

			{/* Diagonal Polygon 3: Tertiary Color corner */}
			<polygon
				points="0,0 180,0 0,180"
				fill={tertiary}
				fillOpacity="0.90"
			/>

			{/* Accent Diagonal Band */}
			<polygon
				points="320,0 640,0 380,260 260,260"
				fill={secondary}
				fillOpacity="0.35"
			/>
		</svg>
	);
}
