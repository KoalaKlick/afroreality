import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { fulfillSuccessfulPayment } from "@/lib/server-functions/fulfillment";

/**
 * Hubtel Receive Money callback.
 *
 * Hubtel POSTs the final status to the `PrimaryCallbackUrl` supplied on
 * initiation. Success is `ResponseCode === "0000"`; failure is `"2001"`.
 *
 * The callback carries `Data.ClientReference` (our payment reference) and
 * `Data.TransactionId` (Hubtel's id). We resolve by `ClientReference` first,
 * then fall back to `TransactionId` stored as `providerReference`.
 */

function pick(obj: any, keys: string[]): any {
	if (!obj || typeof obj !== "object") return undefined;
	for (const key of keys) {
		if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
			return obj[key];
		}
	}
	return undefined;
}

export async function POST(req: Request) {
	try {
		const body = (await req.json().catch(() => ({}))) as any;

		const nested = body?.Data ?? body?.data ?? {};
		const responseCode = String(
			pick(body, ["ResponseCode", "responseCode", "response_code"]) ??
				pick(nested, ["ResponseCode", "responseCode"]) ??
				"",
		);
		const clientReference = pick(nested, ["ClientReference", "ClientReference"]) ??
			pick(body, ["ClientReference", "clientReference"]);
		const transactionId = pick(nested, ["TransactionId", "TransactionID"]) ??
			pick(body, ["TransactionId", "TransactionID"]);

		// Only final success is fulfilled here.
		if (responseCode !== "0000") {
			return NextResponse.json({ received: true, ignored: "not success" });
		}

		let reference = clientReference ? String(clientReference) : "";

		if (!reference && transactionId) {
			const payment = await prisma.payment.findFirst({
				where: { providerReference: String(transactionId) },
				select: { reference: true },
			});
			reference = payment?.reference || "";
		}

		if (reference) {
			await fulfillSuccessfulPayment({
				reference,
				paystackData: {
					id: String(transactionId || reference),
					metadata: { gateway: "hubtel" },
				},
			});
		}

		return NextResponse.json({ received: true });
	} catch (error: any) {
		console.error("Hubtel webhook error:", error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
