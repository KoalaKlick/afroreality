// src/lib/logger.ts
//
// Lightweight logger using console, mimicking the pino interface used in afrotix.

const isDev = process.env.NODE_ENV !== "production";

const SLOW_THRESHOLD = 300;

function formatMessage(
	level: string,
	msg: string,
	obj?: Record<string, unknown>,
): string {
	const timestamp = new Date().toISOString();
	const details =
		obj && Object.keys(obj).length > 0 ? ` ${JSON.stringify(obj)}` : "";
	return `[${timestamp}] [${level.toUpperCase()}] ${msg}${details}`;
}

export const logger = {
	error: (err: unknown, msg: string) => {
		const obj =
			err instanceof Error
				? { error: err.message, stack: err.stack }
				: { error: String(err) };
		console.error(formatMessage("error", msg, obj));
	},
	warn: (msg: string, obj?: Record<string, unknown>) => {
		console.warn(formatMessage("warn", msg, obj));
	},
	info: (msg: string, obj?: Record<string, unknown>) => {
		if (isDev) console.info(formatMessage("info", msg, obj));
	},
	debug: (obj: Record<string, unknown>, msg: string) => {
		if (isDev) console.debug(formatMessage("debug", msg, obj));
	},
};

export function logDB(operation: string, table: string, duration: number) {
	const isSlow = duration >= SLOW_THRESHOLD;
	const level = isSlow ? "warn" : "info";
	const prefix = isSlow ? "[SLOW DB]" : "[DB]";
	logger[level](`${prefix} [${operation}] ${table} | ${duration}ms`, {
		duration: `${duration}ms`,
	});
}

export function logFetch(method: string, url: string, duration: number) {
	const isSlow = duration >= SLOW_THRESHOLD;
	const level = isSlow ? "warn" : "info";
	const prefix = isSlow ? "[SLOW FETCH]" : "[FETCH]";
	const displayUrl = url.replace(/^https?:\/\//, "").split("?")[0];
	logger[level](`${prefix} [${method}] ${displayUrl} | ${duration}ms`, {
		url,
		duration: `${duration}ms`,
	});
}

export function logAction(
	name: string,
	duration: number,
	success: boolean = true,
) {
	const isSlow = duration >= SLOW_THRESHOLD;
	const level = success ? (isSlow ? "warn" : "info") : "error";
	const prefix = success
		? isSlow
			? "[SLOW ACTION]"
			: "[ACTION]"
		: "[FAILED ACTION]";
	console.log(
		formatMessage(level, `${prefix} ${name} | ${duration}ms`, {
			duration: `${duration}ms`,
			success,
		}),
	);
}
