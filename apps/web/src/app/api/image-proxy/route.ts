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
