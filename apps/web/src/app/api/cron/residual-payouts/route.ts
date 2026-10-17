import { NextResponse } from "next/server";
import { processResidualAutoPayouts } from "@/lib/server-functions/wallet";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
	return handleCron(req);
}

export async function POST(req: Request) {
	return handleCron(req);
}

async function handleCron(req: Request) {
	try {
		const { searchParams } = new URL(req.url);

		// Optional secret check if CRON_SECRET is configured
		const cronSecret = process.env.CRON_SECRET;
		if (cronSecret) {
			const authHeader = req.headers.get("authorization");
			const querySecret = searchParams.get("secret");
			const headerSecret = req.headers.get("x-cron-secret");

			const isAuthorized =
				authHeader === `Bearer ${cronSecret}` ||
				querySecret === cronSecret ||
				headerSecret === cronSecret;

			if (!isAuthorized) {
				return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
			}
		}

		const result = await processResidualAutoPayouts();
		return NextResponse.json(result);
	} catch (err: any) {
		console.error("[CRON_RESIDUAL_PAYOUTS_ERROR]", err);
		return NextResponse.json(
			{ success: false, error: err?.message || "Internal cron error" },
			{ status: 500 }
		);
	}
}
