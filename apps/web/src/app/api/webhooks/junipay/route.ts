import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { fulfillSuccessfulPayment } from "@/lib/server-functions/fulfillment";
import { safeEqualString } from "@/lib/ticket-crypto";

/**
 * JuniPay collections callback.
 * When JUNIPAY_WEBHOOK_SECRET is set, require x-junipay-signature / x-signature.
 * Always bind to a pending payment by foreignID before fulfilling.
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
		const secret = (process.env.JUNIPAY_WEBHOOK_SECRET || "").trim();
		if (secret) {
			const provided =
				req.headers.get("x-junipay-signature") ||
				req.headers.get("x-signature") ||
				"";
			if (!provided || !safeEqualString(provided, secret)) {
				return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
			}
		} else if (process.env.NODE_ENV === "production") {
			console.warn(
				"[JUNIPAY-WEBHOOK] JUNIPAY_WEBHOOK_SECRET unset — relying on pending-reference bind only",
			);
		}

		const body = (await req.json().catch(() => ({}))) as any;

		const nested = body?.data ?? {};
		const foreignId =
			pick(body, ["foreignID", "foreignId"]) ??
			pick(nested, ["foreignID", "foreignId"]);
		const transId =
			pick(body, ["transID", "transId", "reqToken", "req_token"]) ??
			pick(nested, ["transID", "transId", "reqToken", "req_token"]);

		const rawStatus = String(
			pick(body, ["status", "state"]) ?? pick(nested, ["status", "state"]) ?? "",
		).toLowerCase();
		const success =
			body?.success === true ||
			nested?.success === true ||
			["success", "completed", "paid", "approved", "successful"].includes(rawStatus);

		if (!success) {
			return NextResponse.json({ received: true, ignored: "not success" });
		}

		let reference = foreignId ? String(foreignId) : "";

		if (!reference && transId) {
			const payment = await prisma.payment.findFirst({
				where: {
					providerReference: String(transId),
					status: "pending",
				},
				select: { reference: true },
			});
			reference = payment?.reference || "";
		}

		if (!reference) {
			return NextResponse.json({ error: "Unknown reference" }, { status: 404 });
		}

		const pending = await prisma.payment.findFirst({
			where: { reference, status: "pending" },
			select: { reference: true, metadata: true },
		});
		if (!pending) {
			return NextResponse.json({ received: true, ignored: "not pending" });
		}

		const meta = (pending.metadata as Record<string, unknown>) || {};
		if (meta.gateway && meta.gateway !== "junipay") {
			return NextResponse.json({ error: "Gateway mismatch" }, { status: 400 });
		}

		await fulfillSuccessfulPayment({
			reference,
			paystackData: {
				id: String(transId || reference),
				metadata: { gateway: "junipay" },
			},
		});

		return NextResponse.json({ received: true });
	} catch (error: any) {
		console.error("JuniPay webhook error:", error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
