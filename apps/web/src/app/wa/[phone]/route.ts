import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ phone: string }> }
) {
	const { phone } = await params;
	const cleanPhone = (phone || "").replace(/[^0-9]/g, "");

	const url = new URL(request.url);
	const text = url.searchParams.get("text") || "Hi, here is my flyer photo for the nomination.";

	if (!cleanPhone) {
		return NextResponse.redirect(new URL("/", request.url));
	}

	const targetWaUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
	return NextResponse.redirect(targetWaUrl, 302);
}
