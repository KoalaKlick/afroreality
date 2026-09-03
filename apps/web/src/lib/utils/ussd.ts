/**
 * USSD helper utilities for formatting dialing codes and QR tel: payloads.
 */

export const DEFAULT_USSD_ROOT_CODE = "*384*77340*";

/**
 * Returns the configured USSD root extension code (e.g. "*384*77340*").
 */
export function getUssdRootCode(): string {
	const raw =
		process.env.NEXT_PUBLIC_USSD_ROOT_CODE ||
		process.env.USSD_ROOT_CODE ||
		DEFAULT_USSD_ROOT_CODE;
	return raw.endsWith("*") ? raw : `${raw}*`;
}

/**
 * Returns the root dialing code without subcode, e.g. "*384*77340#" or "*928#".
 */
export function getUssdRootDialCode(): string {
	const raw =
		process.env.NEXT_PUBLIC_USSD_ROOT_DIAL_CODE ||
		process.env.NEXT_PUBLIC_USSD_ROOT_CODE ||
		process.env.USSD_ROOT_CODE ||
		DEFAULT_USSD_ROOT_CODE;
	const trimmed = raw.endsWith("*") ? raw.slice(0, -1) : raw;
	return trimmed.endsWith("#") ? trimmed : `${trimmed}#`;
}

/**
 * Returns the human-readable USSD dialing code for an event or root.
 * e.g. "*384*77340*104#" or root "*384*77340#"
 */
export function getUssdDialCode(ussdCode?: string | null): string {
	if (!ussdCode || ussdCode.toLowerCase() === "root") {
		return getUssdRootDialCode();
	}
	const cleanCode = ussdCode.replace(/[^0-9]/g, "");
	if (!cleanCode) {
		return getUssdRootDialCode();
	}
	const root = getUssdRootCode();
	return `${root}${cleanCode}#`;
}

/**
 * Returns the tel: URI for mobile browsers and QR codes.
 * Note: '#' must be encoded as '%23' in tel URIs so dialers handle it properly.
 * e.g. "tel:*384*77340*104%23" or "tel:*384*77340%23"
 */
export function getUssdTelUri(ussdCode?: string | null): string {
	const dialCode = getUssdDialCode(ussdCode);
	return `tel:${dialCode.replace(/#/g, "%23")}`;
}
