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
	{ name: "Olive Moss", value: "#65a30d", description: "Earthy yellow-green (Organic & Grounded)" },
	{ name: "Petrol Teal", value: "#0d9488", description: "Deep oceanic teal (Balance & Distinction)" },
	{ name: "Persian Cerulean", value: "#0284c7", description: "Deep azure sea blue (Clarity & Reach)" },
	{ name: "Royal Tech Navy", value: "#1e3a8a", description: "Deep midnight sapphire (Trust & Tech)" },
	{ name: "Electric Indigo", value: "#4f46e5", description: "Vivid deep royal indigo (Innovation & Modern)" },
	{ name: "Deep Amethyst", value: "#7c3aed", description: "Regal violet purple (Creativity & Luxury)" },
	{ name: "Deep Fuchsia", value: "#a21caf", description: "Bold magenta violet (Boldness & Charisma)" },
	{ name: "Rose Pink", value: "#db2777", description: "Rich vibrant rose (Modern & Dynamic)" },
	{ name: "Burgundy Wine", value: "#881337", description: "Deep maroon bordeaux (Prestige & Elegance)" },
	{ name: "Crimson Scarlet", value: "#dc2626", description: "Bold iconic red (Energy & Passion)" },
	{ name: "Burnt Terracotta", value: "#ea580c", description: "Warm earthen rust orange (Vibrancy & Craft)" },
	{ name: "Warm Ochre Gold", value: "#d97706", description: "Sun-drenched amber gold (Heritage & Warmth)" },
	{ name: "Warm Espresso", value: "#78350f", description: "Deep cocoa bronze (Authenticity & Craft)" },
	{ name: "Obsidian Slate", value: "#0f172a", description: "Deep space charcoal (Minimalism & Power)" },
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
