import { NextResponse } from "next/server";
import crypto from "crypto";
import {
	fulfillSuccessfulPayment,
	fulfillPayoutTransfer,
} from "@/lib/server-functions/fulfillment";

export async function POST(req: Request) {
	try {
		const bodyText = await req.text();
		const signature = req.headers.get("x-paystack-signature");
		const secret = process.env.PAYSTACK_SECRET_KEY || "";

		// Verify HMAC SHA512 Signature
		if (secret) {
			if (!signature) {
				return NextResponse.json({ error: "Missing signature" }, { status: 401 });
			}
			const hash = crypto
				.createHmac("sha512", secret)
				.update(bodyText)
				.digest("hex");
			if (hash !== signature) {
				return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
			}
		}

		const event = JSON.parse(bodyText);

		// 1. Process successful incoming charges (Tickets, Votes, Nominations)
		if (event.event === "charge.success" && event.data?.status === "success") {
			const data = event.data;
			const reference = data.reference;

			if (reference) {
				await fulfillSuccessfulPayment({
					reference,
					paystackData: data,
				});
			}
		}

		// 2. Process outgoing transfer / payout events
		if (event.event === "transfer.success") {
			const reference = event.data?.reference;
			if (reference) {
				await fulfillPayoutTransfer({
					reference,
					status: "completed",
					paystackData: event.data,
				});
			}
		} else if (event.event === "transfer.failed" || event.event === "transfer.reversed") {
			const reference = event.data?.reference;
			if (reference) {
				await fulfillPayoutTransfer({
					reference,
					status: event.event === "transfer.reversed" ? "reversed" : "failed",
					paystackData: event.data,
				});
			}
		}

		return NextResponse.json({ received: true });
	} catch (error: any) {
		console.error("Paystack webhook error:", error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}

