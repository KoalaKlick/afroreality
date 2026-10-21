import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { fulfillSuccessfulPayment } from "@/lib/server-functions/fulfillment";
import { safeEqualString } from "@/lib/ticket-crypto";

/**
 * Hubtel Receive Money callback.
 *
 * When HUBTEL_WEBHOOK_SECRET is set, require it via x-hubtel-signature or
 * Authorization: Bearer. Always resolve a pending Hubtel payment by reference
 * before fulfilling (never invent success from an unknown ClientReference).
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

function extractProvidedSecret(req: Request): string {
	const header =
		req.headers.get("x-hubtel-signature") ||
		req.headers.get("x-hubtel-client-secret") ||
		"";
	if (header) return header;

	const auth = req.headers.get("authorization") || "";
	if (auth.toLowerCase().startsWith("bearer ")) {
		return auth.slice(7).trim();
	}
	return "";
}

export async function POST(req: Request) {
	try {
		const configuredSecret = (process.env.HUBTEL_WEBHOOK_SECRET || "").trim();
		if (configuredSecret) {
			const provided = extractProvidedSecret(req);
			if (!provided || !safeEqualString(provided, configuredSecret)) {
				return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
			}
		} else if (process.env.NODE_ENV === "production") {
			console.warn(
				"[HUBTEL-WEBHOOK] HUBTEL_WEBHOOK_SECRET unset — relying on pending-reference bind only",
			);
		}

		const body = (await req.json().catch(() => ({}))) as any;

		const nested = body?.Data ?? body?.data ?? {};
		const responseCode = String(
			pick(body, ["ResponseCode", "responseCode", "response_code"]) ??
				pick(nested, ["ResponseCode", "responseCode"]) ??
				"",
		);
		const clientReference =
			pick(nested, ["ClientReference"]) ??
			pick(body, ["ClientReference", "clientReference"]);
		const transactionId =
			pick(nested, ["TransactionId", "TransactionID"]) ??
			pick(body, ["TransactionId", "TransactionID"]);
		const amountRaw =
			pick(nested, ["Amount", "amount"]) ?? pick(body, ["Amount", "amount"]);

		if (responseCode !== "0000") {
			return NextResponse.json({ received: true, ignored: "not success" });
		}

		let reference = clientReference ? String(clientReference) : "";

		if (!reference && transactionId) {
			const payment = await prisma.payment.findFirst({
				where: {
					providerReference: String(transactionId),
					status: "pending",
				},
				select: { reference: true, metadata: true, amount: true },
			});
			reference = payment?.reference || "";
		}

		if (!reference) {
			return NextResponse.json({ error: "Unknown reference" }, { status: 404 });
		}

		const pending = await prisma.payment.findFirst({
			where: { reference, status: "pending" },
			select: { reference: true, metadata: true, amount: true },
		});
		if (!pending) {
			return NextResponse.json({ received: true, ignored: "not pending" });
		}

		const meta = (pending.metadata as Record<string, unknown>) || {};
		if (meta.gateway && meta.gateway !== "hubtel") {
			return NextResponse.json({ error: "Gateway mismatch" }, { status: 400 });
		}

		if (amountRaw !== undefined && amountRaw !== null && amountRaw !== "") {
			const expected =
				typeof meta.totalToCharge === "number"
					? meta.totalToCharge
					: Number(pending.amount);
			const reported = Number(amountRaw);
			if (Number.isFinite(expected) && Number.isFinite(reported)) {
				if (Math.abs(expected - reported) > 0.05) {
					console.error("[HUBTEL-WEBHOOK] Amount mismatch", {
						reference,
						expected,
						reported,
					});
					return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
				}
			}
		}

		await fulfillSuccessfulPayment({
			reference,
			paystackData: {
				id: String(transactionId || reference),
				metadata: { gateway: "hubtel" },
			},
		});

		return NextResponse.json({ received: true });
	} catch (error: any) {
		console.error("Hubtel webhook error:", error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
