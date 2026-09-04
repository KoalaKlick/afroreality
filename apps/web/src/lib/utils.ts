// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function serializeJsonSafe<T>(data: T): T {
	if (data === null || data === undefined) return data;
	return JSON.parse(
		JSON.stringify(data, (_key, value) => {
			if (
				typeof value === "object" &&
				value !== null &&
				"_isDecimal" in value
			) {
				return Number(value);
			}
			return value;
		}),
	);
}

export function getErrorMessage(err: unknown): string {
	if (!err) return "An unexpected error occurred";

	let raw = "";
	if (typeof err === "string") {
		raw = err;
	} else if (err instanceof Error) {
		raw = err.message;
	} else if (typeof err === "object" && err !== null && "message" in err) {
		raw = String((err as { message: unknown }).message);
	} else {
		raw = String(err);
	}

	const trimmed = raw.trim();

	// Intercept raw Prisma Unique Constraint Violation errors (e.g., P2002)
	if (
		trimmed.includes("P2002") ||
		trimmed.includes("UniqueConstraintViolation") ||
		trimmed.includes("Unique constraint failed") ||
		trimmed.includes("driverAdapterError")
	) {
		if (
			trimmed.includes("nominee_code") ||
			trimmed.includes("nomineeCode") ||
			trimmed.includes("VotingOption")
		) {
			return "Nominee code is already taken for this event. Please enter a different code or leave it blank to auto-generate.";
		}
		return "A record with this unique code or identifier already exists.";
	}

	if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
		try {
			const parsed = JSON.parse(trimmed);
			if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.message) {
				return parsed[0].message;
			}
		} catch {
			// Not valid JSON, ignore
		}
	}

	if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
		try {
			const parsed = JSON.parse(trimmed);
			if (parsed?.message) return String(parsed.message);
			if (parsed?.error) return String(parsed.error);
		} catch {
			// Not valid JSON, ignore
		}
	}

	return raw;
}

const colorClasses = [
	"bg-red-700 text-white",
	"bg-red-600 text-white",
	"bg-red-800 text-white",
	"bg-yellow-500 text-black",
	"bg-amber-500 text-black",
	"bg-yellow-600 text-white",
	"bg-green-700 text-white",
	"bg-green-600 text-white",
	"bg-emerald-700 text-white",
];

export function getColorClass(name: string): string {
	if (!name) return "bg-gray-500 text-white";

	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = (hash << 5) - hash + (name.codePointAt(i) ?? 0);
		hash = hash & hash;
	}

	const index = Math.abs(hash) % colorClasses.length;
	return colorClasses[index] || "bg-emerald-600 text-white";
}

export function formatDate(date: Date | string, addTime?: boolean): string {
	const d = typeof date === "string" ? new Date(date) : date;
	const dateStr = d.toLocaleDateString("en-US", {
		weekday: "short",
		month: "short",
		day: "numeric",
		year: "numeric",
	});
	if (addTime) {
		const timeStr = d.toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});
		return `${dateStr}, ${timeStr}`;
	}
	return dateStr;
}

export function capitalizeFirstLetter(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

export function trimText(text: string, length: number): string {
	return text.length > length ? `${text.slice(0, length)}...` : text;
}

type NumberFormatOptions = {
	locale?: string;
	style?: Intl.NumberFormatOptions["style"];
	currency?: string;
	unit?: Intl.NumberFormatOptions["unit"];
	unitDisplay?: Intl.NumberFormatOptions["unitDisplay"];
	minimumFractionDigits?: number;
	maximumFractionDigits?: number;
	useGrouping?: Intl.NumberFormatOptions["useGrouping"];
};

export function formatNumber(
	value: number,
	{
		locale = "en-US",
		style = "decimal",
		currency,
		unit,
		unitDisplay = "short",
		minimumFractionDigits,
		maximumFractionDigits,
		useGrouping,
	}: NumberFormatOptions = {},
): string {
	const opts: Intl.NumberFormatOptions = {
		style,
		minimumFractionDigits,
		maximumFractionDigits,
		useGrouping,
	};
	if (style === "currency" && currency) opts.currency = currency;
	if (style === "unit" && unit) {
		opts.unit = unit;
		opts.unitDisplay = unitDisplay;
	}
	return new Intl.NumberFormat(locale, opts).format(value);
}

export function formatAmount(value: number, currency = "GHS") {
	return formatNumber(value, { style: "currency", currency });
}

export function getFrontendBaseUrl(): string {
	const url =
		process.env.NEXT_PUBLIC_APP_URL ||
		process.env.APP_BASE_URL ||
		process.env.NEXT_PUBLIC_APP_BASE_URL ||
		process.env.NEXT_PUBLIC_DOMAIN_URL ||
		process.env.FRONTEND_URL ||
		process.env.BASE_URL ||
		(typeof window !== "undefined" && window.location.origin
			? window.location.origin
			: "") ||
		"http://localhost:3000";
	return url.replace(/\/$/, "");
}

export const getBaseUrl = getFrontendBaseUrl;

/**
 * Strips HTML tags and decodes common HTML entities to return clean plain text.
 * Safe for both server and client rendering with zero hydration mismatches.
 */
export function stripHtmlToText(html?: string | null): string {
	if (!html) return "";
	return html
		.replace(/<br\s*\/?>/gi, " ")
		.replace(/<\/p>/gi, " ")
		.replace(/<[^>]*>/g, "")
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&apos;/g, "'")
		.replace(/\s+/g, " ")
		.trim();
}

