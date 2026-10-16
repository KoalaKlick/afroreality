/**
 * USSD helper utilities for formatting dialing codes and QR tel: payloads.
 * Unified to a single source of truth: NEXT_PUBLIC_USSD_ROOT_CODE (default: "*928*920#").
 */

export const DEFAULT_USSD_ROOT_CODE = "*928*920#";

/**
 * Returns the raw configured USSD root value from env.
 */
function getRawRootConfig(): string {
	return (
		process.env.NEXT_PUBLIC_USSD_ROOT_CODE ||
		process.env.USSD_ROOT_CODE ||
		DEFAULT_USSD_ROOT_CODE
	).trim();
}

/**
 * Returns the cleaned base prefix without trailing '*' or '#'.
 * e.g. "*928*920#", "*928*920*", or "*928*920" all normalize to "*928*920".
 */
export function getUssdBaseCode(): string {
	const raw = getRawRootConfig();
	const withoutEdges = raw.replace(/^[#*]+/, "").replace(/[#*]+$/, "");
	return `*${withoutEdges}`;
}

/**
 * Returns the root prefix ending in "*", e.g. "*928*920*".
 * Used when appending subcodes (e.g. `${getUssdRootCode()}104#`).
 */
export function getUssdRootCode(): string {
	return `${getUssdBaseCode()}*`;
}

/**
 * Returns the root dialing code without subcode, e.g. "*928*920#".
 */
export function getUssdRootDialCode(): string {
	return `${getUssdBaseCode()}#`;
}

/**
 * Returns the human-readable USSD dialing code for an event or root.
 * e.g. "*928*920*104#" or root "*928*920#"
 */
export function getUssdDialCode(ussdCode?: string | null): string {
	if (!ussdCode || ussdCode.toLowerCase() === "root") {
		return getUssdRootDialCode();
	}
	const cleanCode = ussdCode.replace(/[^0-9]/g, "");
	if (!cleanCode) {
		return getUssdRootDialCode();
	}
	return `${getUssdRootCode()}${cleanCode}#`;
}

/**
 * Returns the tel: URI for mobile browsers and QR codes.
 * Note: '#' must be encoded as '%23' in tel URIs so dialers handle it properly.
 * e.g. "tel:*928*920*104%23" or "tel:*928*920%23"
 */
export function getUssdTelUri(ussdCode?: string | null): string {
	const dialCode = getUssdDialCode(ussdCode);
	return `tel:${dialCode.replace(/#/g, "%23")}`;
}
