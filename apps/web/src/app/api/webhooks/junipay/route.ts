import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { fulfillSuccessfulPayment } from "@/lib/server-functions/fulfillment";

/**
 * JuniPay collections callback.
 *
 * JuniPay POSTs the result to the `callbackUrl` supplied on initiation. The
 * initiation response returns both `foreignID` (our payment reference) and
 * `transID`/`reqToken` (JuniPay's own identifiers). The callback may echo either,
 * so we resolve the reference by `foreignID` first, then by `providerReference`
 * (which we store as `transID`/`reqToken` on the payment row).
 *
 * Optional verification: if JUNIPAY_WEBHOOK_SECRET is set, the request must
 * carry a matching value in the `x-junipay-signature` or `x-signature` header.
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

		const secret = process.env.JUNIPAY_WEBHOOK_SECRET || "";
		if (secret) {
			const provided =
				req.headers.get("x-junipay-signature") ||
				req.headers.get("x-signature") ||
				"";
			if (provided !== secret) {
				return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
			}
		}

		const nested = body?.data ?? {};
		const foreignId = pick(body, ["foreignID", "foreignId"]) ??
			pick(nested, ["foreignID", "foreignId"]);
		const transId =
			pick(body, ["transID", "transId", "reqToken", "req_token"]) ??
			pick(nested, ["transID", "transId", "reqToken", "req_token"]);

		const rawStatus = String(
			pick(body, ["status", "state"]) ??
				pick(nested, ["status", "state"]) ??
				"",
		).toLowerCase();
		const success =
			body?.success === true ||
			nested?.success === true ||
			["success", "completed", "paid", "approved", "successful"].includes(rawStatus);

		if (!success) {
			return NextResponse.json({ received: true, ignored: "not success" });
		}

		// 1. Prefer the foreignID (our own payment reference).
		let reference = foreignId ? String(foreignId) : "";

		// 2. Fall back to resolving JuniPay's transaction id against the stored
		//    providerReference on the pending payment row.
		if (!reference && transId) {
			const payment = await prisma.payment.findFirst({
				where: { providerReference: String(transId) },
				select: { reference: true },
			});
			reference = payment?.reference || "";
		}

		if (reference) {
			await fulfillSuccessfulPayment({
				reference,
				paystackData: {
					id: String(transId || reference),
					metadata: { gateway: "junipay" },
				},
			});
		}

		return NextResponse.json({ received: true });
	} catch (error: any) {
		console.error("JuniPay webhook error:", error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
