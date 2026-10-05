import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/image-proxy?url=<encoded-image-url>
 *
 * Proxies external images through Next.js so that html-to-image can draw
 * them onto a canvas without triggering CORS taint errors.
 */
export async function GET(req: NextRequest) {
	const rawUrl = req.nextUrl.searchParams.get("url");

	if (!rawUrl) {
		return new NextResponse("Missing url param", { status: 400 });
	}

	let targetUrl: URL;
	try {
		targetUrl = new URL(rawUrl);
	} catch {
		return new NextResponse("Invalid url", { status: 400 });
	}

	// Only allow https to prevent SSRF against local/internal addresses
	if (targetUrl.protocol !== "https:") {
		return new NextResponse("Only https URLs are allowed", { status: 400 });
	}

	try {
		const upstream = await fetch(targetUrl.toString(), {
			headers: {
				Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
			},
		});

		if (!upstream.ok) {
			return new NextResponse("Upstream fetch failed", {
				status: upstream.status,
			});
		}

		const contentType =
			upstream.headers.get("content-type") ?? "application/octet-stream";
		const buffer = await upstream.arrayBuffer();

		return new NextResponse(buffer, {
			status: 200,
			headers: {
				"Content-Type": contentType,
				"Cache-Control": "public, max-age=3600, immutable",
				"Access-Control-Allow-Origin": "*",
			},
		});
	} catch (err) {
		console.error("[image-proxy] fetch error:", err);
		return new NextResponse("Failed to fetch image", { status: 502 });
	}
}
