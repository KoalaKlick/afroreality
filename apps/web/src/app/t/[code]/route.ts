// apps/web/src/app/t/[code]/route.ts
// Direct short-URL redirect handler.
// Handles requests to /t/:code (e.g. t.fextiva.com/E7K2M-9M4P10 or fextiva.com/t/E7K2M-9M4P10).

import { NextRequest, NextResponse } from "next/server";
import { parseTicketCode } from "@/lib/utils/ticket-code";

export const dynamic = "force-dynamic";

export async function GET(
	request: NextRequest,
	context: { params: Promise<{ code: string }> },
) {
	const { code } = await context.params;
	const cleanCode = (code || "").trim();

	if (!cleanCode) {
		return NextResponse.redirect(new URL("/", request.url), 302);
	}

	const parsed = parseTicketCode(cleanCode);
	const targetCode = parsed.normalizedCode || cleanCode;

	// Always redirect to the full ticket view page
	const destination = new URL(`/ticket/view?code=${encodeURIComponent(targetCode)}`, request.url);
	return NextResponse.redirect(destination, 302);
}

