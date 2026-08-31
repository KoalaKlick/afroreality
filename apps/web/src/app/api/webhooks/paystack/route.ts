import { NextResponse } from "next/server";
import crypto from "crypto";
import { fulfillSuccessfulPayment } from "@/lib/server-functions/fulfillment";

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

		// Only process successful charges
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

		return NextResponse.json({ received: true });
	} catch (error: any) {
		console.error("Paystack webhook error:", error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
