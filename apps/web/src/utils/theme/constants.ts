import type { BrandColors } from "./color-generator";

export const DEFAULT_BRAND_COLORS: BrandColors = {
	primary: "#028a3d",
	secondary: "#d97706",
	tertiary: "#dc2626",
};

/**
 * Comprehensive, High-Contrast World-Class Brand Usable Colors
 * Curated for modern events, ticketing, African heritage, luxury galas, and corporate identities.
 */
export const PRESET_COLORS = [
	// ── Monochromes & Neutrals ──
	{ name: "Pitch Black", value: "#000000", description: "Bold timeless black (Contrast & Modernism)" },
	{ name: "Obsidian Slate", value: "#0f172a", description: "Deep space charcoal (Minimalism & Power)" },
	{ name: "Charcoal Steel", value: "#334155", description: "Sophisticated gunmetal slate (Executive & Clean)" },
	{ name: "Cool Silver", value: "#64748b", description: "Balanced neutral slate (Subtle & Modern)" },
	{ name: "Pure White", value: "#ffffff", description: "Crisp stark white (Clarity & Light)" },

	// ── Reds & Maroons ──
	{ name: "Crimson Scarlet", value: "#dc2626", description: "Bold iconic red (Energy & Passion)" },
	{ name: "Vivid Ruby", value: "#ef4444", description: "Bright energetic scarlet (Urgency & Impact)" },
	{ name: "Burgundy Wine", value: "#881337", description: "Deep maroon bordeaux (Prestige & Elegance)" },
	{ name: "Dark Mahogany", value: "#991b1b", description: "Rich deep mahogany red (Heritage & Depth)" },

	// ── Oranges & Corals ──
	{ name: "Vibrant Tangerine", value: "#f97316", description: "High-voltage citrus orange (Festivity & Vitality)" },
	{ name: "Burnt Terracotta", value: "#ea580c", description: "Warm earthen rust orange (Vibrancy & Craft)" },
	{ name: "Sunset Coral", value: "#f43f5e", description: "Dynamic warm coral (Celebration & Warmth)" },

	// ── Yellows & Golds ──
	{ name: "Sovereign Gold", value: "#f59e0b", description: "Rich royal metallic gold (Prestige & Royalty)" },
	{ name: "Sunlit Yellow", value: "#eab308", description: "Cheerful vivid sunshine yellow (Optimism & Radiance)" },
	{ name: "Warm Ochre Gold", value: "#d97706", description: "Sun-drenched amber gold (Heritage & Warmth)" },
	{ name: "Warm Champagne", value: "#d4a373", description: "Soft luxurious champagne sand (Subtle Elegance)" },

	// ── Greens & Earth ──
	{ name: "Pan-African Forest", value: "#028a3d", description: "Deep emerald forest (Heritage & Growth)" },
	{ name: "Emerald Jade", value: "#10b981", description: "Lush jewel-toned emerald (Prosperity & Vitality)" },
	{ name: "Midnight Pine", value: "#064e3b", description: "Deep forest pine (Majestic & Grounded)" },
	{ name: "Olive Moss", value: "#65a30d", description: "Earthy yellow-green (Organic & Natural)" },
	{ name: "Electric Lime", value: "#84cc16", description: "High-energy chartreuse lime (Youthful & Bold)" },

	// ── Teals & Cyans ──
	{ name: "Petrol Teal", value: "#0d9488", description: "Deep oceanic teal (Balance & Distinction)" },
	{ name: "Tropical Cyan", value: "#06b6d4", description: "Crisp turquoise cyan (Freshness & Tech)" },
	{ name: "Persian Cerulean", value: "#0284c7", description: "Deep azure sea blue (Clarity & Reach)" },

	// ── Blues ──
	{ name: "Cobalt Sapphire", value: "#2563eb", description: "Vivid electric cobalt blue (Innovation & Trust)" },
	{ name: "Royal Tech Navy", value: "#1e3a8a", description: "Deep midnight sapphire (Authority & Corporate)" },

	// ── Purples & Violets ──
	{ name: "Electric Indigo", value: "#4f46e5", description: "Vivid deep royal indigo (Modern & Digital)" },
	{ name: "Royal Amethyst", value: "#7c3aed", description: "Regal violet purple (Creativity & Luxury)" },
	{ name: "Bright Lavender", value: "#8b5cf6", description: "Soft creative purple (Aesthetic & Visionary)" },
	{ name: "Imperial Plum", value: "#581c87", description: "Deep royal dark plum (Opulence & Mystery)" },

	// ── Pinks & Magentas ──
	{ name: "Deep Fuchsia", value: "#a21caf", description: "Bold magenta violet (Boldness & Charisma)" },
	{ name: "Electric Magenta", value: "#c026d3", description: "High-impact neon magenta (Vibrant & Electric)" },
	{ name: "Rose Pink", value: "#db2777", description: "Rich vibrant rose (Modern & Dynamic)" },
	{ name: "Blush Carnation", value: "#f472b6", description: "Soft delicate pastel pink (Gentle & Warm)" },

	// ── Browns & Woods ──
	{ name: "Warm Espresso", value: "#78350f", description: "Deep cocoa bronze (Authenticity & Craft)" },
	{ name: "Caramel Bronze", value: "#92400e", description: "Warm roasted spice (Warmth & Earth)" },
	{ name: "Dark Chocolate", value: "#451a03", description: "Rich dark roasted bean (Earthy & Grounded)" },
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
		name: "Midnight Luxury (Black / Gold / Ruby)",
		primary: "#000000",
		secondary: "#f59e0b",
		tertiary: "#dc2626",
	},
	{
		name: "Royal Velvet (Indigo / Violet / Gold)",
		primary: "#4338ca",
		secondary: "#6b21a8",
		tertiary: "#f59e0b",
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
		name: "Sunset Ember (Terracotta / Crimson / Amber)",
		primary: "#ea580c",
		secondary: "#dc2626",
		tertiary: "#f59e0b",
	},
	{
		name: "Golden Gala (Gold / Emerald / Obsidian)",
		primary: "#f59e0b",
		secondary: "#10b981",
		tertiary: "#0f172a",
	},
	{
		name: "Luxury Maroon (Burgundy / Ochre / Espresso)",
		primary: "#881337",
		secondary: "#d97706",
		tertiary: "#78350f",
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
		tertiary: "#f43f5e",
	},
	{
		name: "Electric Cyber (Indigo / Cyan / Magenta)",
		primary: "#4f46e5",
		secondary: "#06b6d4",
		tertiary: "#c026d3",
	},
];
