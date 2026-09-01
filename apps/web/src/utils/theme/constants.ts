import type { BrandColors } from "./color-generator";

export const DEFAULT_BRAND_COLORS: BrandColors = {
	primary: "#028a3d",
	secondary: "#d97706",
	tertiary: "#dc2626",
};

/**
 * 15 Distinct, Deep, World-Class Brand Usable Colors
 * Curated from worldly brand identities, luxury houses, African heritage, and leading global tech brands.
 * Each color is deep, saturated, highly contrasting, and distinct across the chromatic spectrum.
 */
export const PRESET_COLORS = [
	{ name: "Pan-African Forest", value: "#028a3d", description: "Deep emerald forest (Heritage & Growth)" },
	{ name: "Royal Tech Navy", value: "#1e3a8a", description: "Deep midnight sapphire (Trust & Tech)" },
	{ name: "Electric Indigo", value: "#4338ca", description: "Vivid deep royal indigo (Innovation & Modern)" },
	{ name: "Deep Amethyst", value: "#6b21a8", description: "Regal violet purple (Creativity & Luxury)" },
	{ name: "Crimson Scarlet", value: "#dc2626", description: "Bold iconic red (Energy & Passion)" },
	{ name: "Burgundy Wine", value: "#881337", description: "Deep maroon bordeaux (Prestige & Elegance)" },
	{ name: "Warm Ochre Gold", value: "#d97706", description: "Sun-drenched amber gold (Heritage & Warmth)" },
	{ name: "Burnt Terracotta", value: "#c2410c", description: "Warm earthen rust orange (Vibrancy & Craft)" },
	{ name: "Persian Cerulean", value: "#0284c7", description: "Deep azure sea blue (Clarity & Reach)" },
	{ name: "Petrol Teal", value: "#0f766e", description: "Deep oceanic teal (Balance & Distinction)" },
	{ name: "Obsidian Slate", value: "#0f172a", description: "Deep space charcoal (Minimalism & Power)" },
	{ name: "Berry Magenta", value: "#be185d", description: "Deep plum raspberry (Charisma & Drive)" },
	{ name: "Olive Moss", value: "#4d7c0f", description: "Deep earthy botanical green (Organic & Grounded)" },
	{ name: "Warm Espresso", value: "#78350f", description: "Deep cocoa bronze (Authenticity & Craft)" },
	{ name: "Coral Crimson", value: "#e11d48", description: "Deep vibrant watermelon (Modern & Dynamic)" },
];

/**
 * Harmonious 3-Color Brand Palette Presets
 */
export const PRESET_THEMES = [
	{
			name: "Fextiva Heritage (Green / Gold / Red)",
		primary: "#028a3d",
		secondary: "#d97706",
		tertiary: "#dc2626",
	},
	{
		name: "Royal Velvet (Indigo / Violet / Gold)",
		primary: "#4338ca",
		secondary: "#6b21a8",
		tertiary: "#d97706",
	},
	{
		name: "Corporate Executive (Navy / Cerulean / Slate)",
		primary: "#1e3a8a",
		secondary: "#0284c7",
		tertiary: "#0f172a",
	},
	{
		name: "Oceanic Forest (Teal / Forest / Sky)",
		primary: "#0f766e",
		secondary: "#028a3d",
		tertiary: "#0284c7",
	},
	{
		name: "Luxury Maroon (Burgundy / Ochre / Espresso)",
		primary: "#881337",
		secondary: "#d97706",
		tertiary: "#78350f",
	},
	{
		name: "Sunset Ember (Terracotta / Crimson / Amber)",
		primary: "#c2410c",
		secondary: "#dc2626",
		tertiary: "#d97706",
	},
	{
		name: "Botanical Earth (Olive / Forest / Bronze)",
		primary: "#4d7c0f",
		secondary: "#028a3d",
		tertiary: "#78350f",
	},
	{
		name: "High Fashion (Magenta / Indigo / Coral)",
		primary: "#be185d",
		secondary: "#4338ca",
		tertiary: "#e11d48",
	},
];
