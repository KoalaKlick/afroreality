import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const imageUrl = searchParams.get("url");

		if (!imageUrl) {
			return new NextResponse("Missing url parameter", { status: 400 });
		}

		// Security: only allow http/https protocols
		if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
			return new NextResponse("Invalid url protocol", { status: 400 });
		}

		// Security: only proxy images from our own R2 bucket(s)
		const allowedHosts = (
			process.env.IMAGE_PROXY_ALLOWED_HOSTS ||
			"pub-7eea00abc69849599238b5352b41898f.r2.dev"
		)
			.split(",")
			.map((h) => h.trim().toLowerCase());

		let parsedHost: string;
		try {
			parsedHost = new URL(imageUrl).hostname.toLowerCase();
		} catch {
			return new NextResponse("Invalid url", { status: 400 });
		}

		if (!allowedHosts.some((h) => parsedHost === h || parsedHost.endsWith(`.${h}`))) {
			return new NextResponse("Host not allowed", { status: 403 });
		}

		const response = await fetch(imageUrl, {
			headers: {
				"User-Agent": "fextiva-ShareProxy/1.0",
			},
		});

		if (!response.ok) {
			return new NextResponse("Failed to fetch upstream image", {
				status: response.status,
			});
		}

		const contentType = response.headers.get("content-type") || "image/jpeg";
		const arrayBuffer = await response.arrayBuffer();

		return new NextResponse(arrayBuffer, {
			headers: {
				"Content-Type": contentType,
				"Cache-Control": "public, max-age=86400, s-maxage=86400",
				"Access-Control-Allow-Origin": "*",
			},
		});
	} catch (error) {
		console.error("Error in image-proxy route:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
