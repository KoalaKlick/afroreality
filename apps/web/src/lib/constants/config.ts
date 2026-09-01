// src/lib/constants/config.ts
//
// Centralized configuration constants.
// Adapted from fextiva-app/shared/constants/config.ts.

export const AUTH_COOKIE_NAME = "auth_token";

export const AUTH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24; // 1 day

export const ISR_REVALIDATE_SECONDS = 60 * 60; // 1 hour

export const MAX_UPLOAD_SIZE_BYTES = {
	avatar: 5 * 1024 * 1024, // 5 MB
	event: 10 * 1024 * 1024, // 10 MB
	document: 10 * 1024 * 1024, // 10 MB
	ticket: 25 * 1024 * 1024, // 25 MB
} as const;

export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 15;

export const COMMUNICATION_CREDITS_PER_MESSAGE = {
	sms: 1,
	whatsapp: 1.5,
	email: 0,
	inApp: 0,
} as const;
