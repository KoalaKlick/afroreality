// src/lib/constants/branding.ts
// Branding constants for the application

export const PROJ_NAME =
	(typeof process !== "undefined" && (process.env.NEXT_PUBLIC_PROJ_NAME || process.env.PROJ_NAME || process.env.VITE_PROJ_NAME)) ||
	"Afrotix";

export const DOMAIN_NAME = "afrotix.com";