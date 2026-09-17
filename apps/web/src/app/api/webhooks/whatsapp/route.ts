import { NextResponse } from "next/server";
import { processWhatsAppWebhook } from "@/lib/services/whatsapp";

export const dynamic = "force-dynamic";

/**
 * GET Handler: Meta Webhook Handshake / Verification
 * Used when adding the Callback URL in Meta App Dashboard > WhatsApp > Configuration
 */
export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const mode = searchParams.get("hub.mode");
		const token = searchParams.get("hub.verify_token");
		const challenge = searchParams.get("hub.challenge");

		const verifyToken =
			process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ||
			"fextiva_whatsapp_secure_webhook_token_2026";

		if (mode === "subscribe" && token === verifyToken) {
			console.log("[WhatsApp Webhook] Verification successful for challenge:", challenge);
			return new Response(challenge || "", { status: 200 });
		}

		console.warn("[WhatsApp Webhook] Verification failed. Token mismatch or bad mode.");
		return new Response("Forbidden", { status: 403 });
	} catch (error: any) {
		console.error("[WhatsApp Webhook] Verification error:", error);
		return new Response("Internal Server Error", { status: 500 });
	}
}

/**
 * POST Handler: Meta Webhook Event Notifications
 * Receives delivery statuses, read receipts, pricing/conversation category, and error updates
 */
export async function POST(req: Request) {
	try {
		const body = await req.json();

		if (body.object === "whatsapp_business_account") {
			const result = await processWhatsAppWebhook(body);
			console.log(
				`[WhatsApp Webhook] Processed ${result.processedCount} status events, updated ${result.statusesUpdated} records.`
			);
			return NextResponse.json({ status: "EVENT_RECEIVED", ...result }, { status: 200 });
		}

		return NextResponse.json({ status: "IGNORED" }, { status: 200 });
	} catch (error: any) {
		console.error("[WhatsApp Webhook] Error processing incoming notification:", error);
		// Meta expects a 200 OK so it doesn't repeatedly retry failing webhooks indefinitely
		return NextResponse.json({ error: error.message || "Webhook processing error" }, { status: 200 });
	}
}
