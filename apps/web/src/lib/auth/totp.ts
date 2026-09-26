import crypto from "crypto";

// RFC 4648 Base32 alphabet
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Encodes a buffer into a Base32 string (without padding).
 */
export function base32Encode(buffer: Buffer): string {
	let bits = 0;
	let value = 0;
	let output = "";

	for (let i = 0; i < buffer.length; i++) {
		value = (value << 8) | buffer[i]!;
		bits += 8;

		while (bits >= 5) {
			output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
			bits -= 5;
		}
	}

	if (bits > 0) {
		output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
	}

	return output;
}

/**
 * Decodes a Base32 string into a Buffer.
 */
export function base32Decode(base32: string): Buffer {
	const cleaned = base32.toUpperCase().replace(/[\s=-]/g, "");
	let bits = 0;
	let value = 0;
	const bytes: number[] = [];

	for (let i = 0; i < cleaned.length; i++) {
		const char = cleaned[i]!;
		const index = BASE32_ALPHABET.indexOf(char);
		if (index === -1) {
			continue; // skip invalid characters
		}

		value = (value << 5) | index;
		bits += 5;

		if (bits >= 8) {
			bytes.push((value >>> (bits - 8)) & 255);
			bits -= 8;
		}
	}

	return Buffer.from(bytes);
}

/**
 * Computes an RFC 6238 TOTP 6-digit code for a given secret and counter.
 */
export function generateHotpCode(secretBuffer: Buffer, counter: number): string {
	const counterBuffer = Buffer.alloc(8);
	counterBuffer.writeBigInt64BE(BigInt(counter), 0);

	const hmac = crypto.createHmac("sha1", secretBuffer).update(counterBuffer).digest();
	const offset = hmac[hmac.length - 1]! & 0x0f;

	const binary =
		((hmac[offset]! & 0x7f) << 24) |
		((hmac[offset + 1]! & 0xff) << 16) |
		((hmac[offset + 2]! & 0xff) << 8) |
		(hmac[offset + 3]! & 0xff);

	const otp = binary % 1000000;
	return otp.toString().padStart(6, "0");
}

/**
 * Generates a cryptographically random 20-byte base32 secret and otpauth URI
 * fully compatible with Google Authenticator and Microsoft Authenticator.
 */
export function generateTotpSecret(email: string, issuer = "Fextiva"): {
	secret: string;
	otpauthUri: string;
} {
	const randomBytes = crypto.randomBytes(20);
	const secret = base32Encode(randomBytes);

	const label = encodeURIComponent(`${issuer}:${email}`);
	const encodedIssuer = encodeURIComponent(issuer);
	const otpauthUri = `otpauth://totp/${label}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;

	return { secret, otpauthUri };
}

/**
 * Verifies a 6-digit TOTP code against a base32 secret with a time-step window of ±1 (±30 seconds).
 */
export function verifyTotpCode(secret: string, token: string): boolean {
	if (!secret || !token) return false;
	const cleanToken = token.trim();
	if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) {
		return false;
	}

	try {
		const secretBuffer = base32Decode(secret);
		if (secretBuffer.length === 0) return false;

		const currentStep = Math.floor(Date.now() / 1000 / 30);

		// Check steps: current, previous (clock drift -30s), next (clock drift +30s)
		for (let offset = -1; offset <= 1; offset++) {
			const expectedCode = generateHotpCode(secretBuffer, currentStep + offset);
			if (crypto.timingSafeEqual(Buffer.from(cleanToken), Buffer.from(expectedCode))) {
				return true;
			}
		}

		return false;
	} catch (err) {
		console.error("TOTP verification error:", err);
		return false;
	}
}

const CHALLENGE_SECRET = process.env.JWT_SECRET || "fextiva-2fa-challenge-secret-key-32chars";

interface ChallengeData {
	email: string;
	timestamp: number;
}

/**
 * Creates an encrypted/signed challenge token for 2FA verification after password success.
 * Valid for 10 minutes.
 */
export function create2FAChallengeToken(email: string): string {
	const data: ChallengeData = {
		email: email.toLowerCase().trim(),
		timestamp: Date.now(),
	};
	const payload = JSON.stringify(data);
	const hmac = crypto.createHmac("sha256", CHALLENGE_SECRET).update(payload).digest("hex");
	return Buffer.from(`${payload}:::${hmac}`).toString("base64url");
}

/**
 * Validates the 2FA challenge token.
 */
export function verify2FAChallengeToken(token: string): string | null {
	try {
		const decoded = Buffer.from(token, "base64url").toString("utf-8");
		const [payload, hmac] = decoded.split(":::");
		if (!payload || !hmac) return null;

		const expectedHmac = crypto.createHmac("sha256", CHALLENGE_SECRET).update(payload).digest("hex");
		if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac))) {
			return null;
		}

		const data: ChallengeData = JSON.parse(payload);
		// 10 minutes expiry
		if (Date.now() - data.timestamp > 10 * 60 * 1000) {
			return null;
		}

		return data.email;
	} catch {
		return null;
	}
}
