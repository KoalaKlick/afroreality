// workers/ticket-redirect/src/index.ts
// Edge redirect handler for t.fextiva.com ticket links.
// Fully compatible with Cloudflare Workers & Vercel Edge Runtime.

export interface Env {
	APP_URL?: string;
}

export function handleTicketRedirect(request: Request, env?: Env): Response {
	const url = new URL(request.url);
	const appUrl = (env?.APP_URL || process?.env?.APP_URL || "https://fextiva.com").replace(/\/+$/, "");

	// Extract code from path, e.g. "/E7K2M-9M4P10" -> "E7K2M-9M4P10"
	const rawPath = url.pathname.replace(/^\/+|\/+$/g, "").trim();

	// If root path, redirect to main application homepage
	if (!rawPath) {
		return Response.redirect(appUrl, 302);
	}

	// Normalize code (handle uppercase and optional hyphen)
	let targetCode = rawPath.toUpperCase();
	const unhyphenatedMatch = targetCode.match(/^([2-9A-Z]{5})([2-9A-Z]{6})$/);
	if (unhyphenatedMatch) {
		targetCode = `${unhyphenatedMatch[1]}-${unhyphenatedMatch[2]}`;
	}

	const destination = `${appUrl}/ticket/view?code=${encodeURIComponent(targetCode)}`;

	return new Response(null, {
		status: 302,
		headers: {
			Location: destination,
			"Cache-Control": "public, max-age=60, s-maxage=300",
		},
	});
}

// Cloudflare Workers Entrypoint
export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		return handleTicketRedirect(request, env);
	},
};

