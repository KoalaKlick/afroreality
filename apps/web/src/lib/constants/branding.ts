// src/lib/constants/branding.ts
// Branding constants for the application
import { getFrontendBaseUrl } from "../utils";

export const PROJ_NAME =
	(typeof process !== "undefined" &&
		(process.env.NEXT_PUBLIC_APP_NAME ||
			process.env.NEXT_PUBLIC_PROJ_NAME ||
			process.env.PROJ_NAME ||
			process.env.FRONTEND_NAME)) ||
	"AfroReality";

export function getCleanDomain(): string {
	const raw = getFrontendBaseUrl();
	if (raw) {
		return raw.replace(/^https?:\/\//, "").replace(/\/$/, "");
	}
	return "afroreality.com";
}

export const DOMAIN_NAME = getCleanDomain();
