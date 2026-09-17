import { NextResponse } from "next/server";
import { fulfillPayoutTransfer } from "@/lib/server-functions/fulfillment";
import { verifyPaystackTransfer } from "@/lib/server-functions/paystack";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { reference, forceStatus } = body;

		if (!reference) {
			return NextResponse.json({ error: "Missing reference" }, { status: 400 });
		}

		if (forceStatus) {
			const res = await fulfillPayoutTransfer({
				reference,
				status: forceStatus,
			});
			return NextResponse.json(res);
		}

		// Otherwise verify with Paystack
		const psRes = await verifyPaystackTransfer(reference);
		if (!psRes.success) {
			return NextResponse.json({ error: psRes.message || "Paystack verify failed" }, { status: 400 });
		}

		const psStatus = psRes.status;
		if (psStatus === "success") {
			const res = await fulfillPayoutTransfer({
				reference,
				status: "completed",
				paystackData: psRes.raw,
			});
			return NextResponse.json({ ...res, status: "completed" });
		} else if (psStatus === "failed" || psStatus === "abandoned" || psStatus === "reversed") {
			const mapped = psStatus === "reversed" ? "reversed" : "failed";
			const res = await fulfillPayoutTransfer({
				reference,
				status: mapped,
				paystackData: psRes.raw,
			});
			return NextResponse.json({ ...res, status: mapped });
		}

		return NextResponse.json({ status: psStatus, message: `Paystack status: ${psStatus}` });
	} catch (error: any) {
		console.error("Payout sync API error:", error);
		return NextResponse.json({ error: error.message || "Failed to sync payout" }, { status: 500 });
	}
}

