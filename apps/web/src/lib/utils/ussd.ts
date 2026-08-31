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
 * Returns the human-readable USSD dialing code for an event.
 * e.g. "*384*77340*104#"
 */
export function getUssdDialCode(ussdCode: string): string {
	const cleanCode = ussdCode.replace(/[^0-9]/g, "");
	const root = getUssdRootCode();
	return `${root}${cleanCode}#`;
}

/**
 * Returns the tel: URI for mobile browsers and QR codes.
 * Note: '#' must be encoded as '%23' in tel URIs so dialers handle it properly.
 * e.g. "tel:*384*77340*104%23"
 */
export function getUssdTelUri(ussdCode: string): string {
	const dialCode = getUssdDialCode(ussdCode);
	return `tel:${dialCode.replace(/#/g, "%23")}`;
}
