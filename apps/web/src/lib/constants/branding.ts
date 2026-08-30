// src/lib/constants/branding.ts
// Branding constants for the application

export const PROJ_NAME =
	(typeof process !== "undefined" &&
		(process.env.NEXT_PUBLIC_APP_NAME ||
			process.env.NEXT_PUBLIC_PROJ_NAME ||
			process.env.PROJ_NAME ||
			process.env.FRONTEND_NAME)) ||
	"AfroReality";

export function getCleanDomain(): string {
	const raw =
		(typeof process !== "undefined" &&
			(process.env.NEXT_PUBLIC_FRONTEND_URL ||
				process.env.FRONTEND_URL ||
				process.env.NEXT_PUBLIC_APP_URL ||
				process.env.NEXT_PUBLIC_DOMAIN_URL ||
				process.env.BASE_URL)) ||
		"";

	if (raw) {
		return raw.replace(/^https?:\/\//, "").replace(/\/$/, "");
	}

	if (typeof window !== "undefined" && window.location.host) {
		return window.location.host;
	}

	return "afroreality.com";
}

export const DOMAIN_NAME = getCleanDomain();
