import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { DEFAULT_STORAGE_BASE_URL } from "@/lib/image-url-utils";

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

		// Security: only proxy images from our own R2 bucket(s) or allowed hosts
		const defaultHost = (() => {
			try {
				return new URL(DEFAULT_STORAGE_BASE_URL).hostname.toLowerCase();
			} catch {
				return "cdn.fextiva.com";
			}
		})();

		const allowedHosts = (
			process.env.IMAGE_PROXY_ALLOWED_HOSTS ||
			`${defaultHost},cdn.fextiva.com,pub-7eea00abc69849599238b5352b41898f.r2.dev`
		)
			.split(",")
			.map((h) => h.trim().toLowerCase());

		let parsedHost: string;
		try {
			parsedHost = new URL(imageUrl).hostname.toLowerCase();
		} catch {
			return new NextResponse("Invalid url", { status: 400 });
		}

		if (
			!allowedHosts.some(
				(h) => parsedHost === h || parsedHost.endsWith(`.${h}`) || parsedHost.endsWith(".r2.dev"),
			)
		) {
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

		// Convert WebP images to JPEG because WhatsApp template headers only support JPEG/PNG
		const formatParam = searchParams.get("format");
		const isWebp =
			contentType.includes("webp") ||
			imageUrl.toLowerCase().includes(".webp") ||
			formatParam === "jpeg" ||
			formatParam === "jpg";

		if (isWebp) {
			try {
				const jpegBuffer = await sharp(Buffer.from(arrayBuffer))
					.jpeg({ quality: 85, mozjpeg: true })
					.toBuffer();

				return new NextResponse(jpegBuffer, {
					headers: {
						"Content-Type": "image/jpeg",
						"Cache-Control": "public, max-age=86400, s-maxage=86400",
						"Access-Control-Allow-Origin": "*",
					},
				});
			} catch (convErr) {
				console.error("[image-proxy] Sharp conversion error:", convErr);
				// Fallback to returning original buffer if conversion fails
			}
		}

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
