import { neon } from "@neondatabase/serverless";

export interface Env {
	DATABASE_URL: string;
	WHATSAPP_WEBHOOK_VERIFY_TOKEN?: string;
	FORWARD_WEBHOOK_URL?: string; // Optional URL to mirror payloads to main app if needed
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		// 1. Handle CORS Preflight
		if (request.method === "OPTIONS") {
			return new Response(null, {
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type",
				},
			});
		}

		// 2. GET Request: Meta Webhook Challenge / Verification Handshake
		if (request.method === "GET") {
			const url = new URL(request.url);
			const mode = url.searchParams.get("hub.mode");
			const token = url.searchParams.get("hub.verify_token");
			const challenge = url.searchParams.get("hub.challenge");

			const verifyToken =
				env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ||
				"fextiva_whatsapp_secure_webhook_token_2026";

			if (mode === "subscribe" && token === verifyToken) {
				console.log("[CF-WHATSAPP-WEBHOOK] Verification successful for challenge:", challenge);
				return new Response(challenge || "", {
					status: 200,
					headers: { "Content-Type": "text/plain" },
				});
			}

			console.warn("[CF-WHATSAPP-WEBHOOK] Verification failed. Token mismatch or bad mode.");
			return new Response("Forbidden", { status: 403 });
		}

		// 3. Reject any method other than POST
		if (request.method !== "POST") {
			return new Response("Method not allowed", { status: 405 });
		}

		// 4. POST Request: Process Inbound Meta Notification Callbacks
		try {
			const bodyText = await request.text();
			const body = JSON.parse(bodyText);

			if (body.object !== "whatsapp_business_account") {
				return new Response(JSON.stringify({ status: "IGNORED" }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}

			if (!env.DATABASE_URL) {
				console.error("[CF-WHATSAPP-WEBHOOK] Missing DATABASE_URL secret");
				return new Response("Missing DATABASE_URL secret", { status: 500 });
			}

			const sql = neon(env.DATABASE_URL);
			let processedCount = 0;
			let statusesUpdated = 0;

			for (const entry of body.entry || []) {
				for (const change of entry.changes || []) {
					const value = change.value;
					if (!value) continue;

					const statuses = value.statuses || [];
					for (const item of statuses) {
						processedCount++;
						const messageId = item.id;
						const statusStr = item.status || "sent"; // "sent" | "delivered" | "read" | "failed"
						const recipientPhone = item.recipient_id || "unknown";
						const pricingCategory =
							item.pricing?.category || item.conversation?.origin?.type || "utility";
						const isBillable = item.pricing?.billable ?? true;
						const errorMsg =
							item.errors?.[0]?.message || item.errors?.[0]?.title || null;
						const estimatedCost = pricingCategory === "marketing" ? 0.025 : 0.007;
						const rawPayloadJson = JSON.stringify(item);

						try {
							await sql`
								INSERT INTO whatsapp_message_logs (
									id,
									message_id,
									recipient_phone,
									status,
									pricing_category,
									is_billable,
									estimated_cost,
									error_message,
									raw_payload,
									created_at,
									updated_at
								) VALUES (
									gen_random_uuid(),
									${messageId},
									${recipientPhone},
									${statusStr},
									${pricingCategory},
									${isBillable},
									${estimatedCost},
									${errorMsg},
									${rawPayloadJson}::jsonb,
									NOW(),
									NOW()
								)
								ON CONFLICT (message_id) DO UPDATE SET
									status = EXCLUDED.status,
									pricing_category = EXCLUDED.pricing_category,
									is_billable = EXCLUDED.is_billable,
									error_message = EXCLUDED.error_message,
									raw_payload = EXCLUDED.raw_payload,
									updated_at = NOW();
							`;
							statusesUpdated++;
						} catch (dbErr) {
							console.error("[CF-WHATSAPP-WEBHOOK] Failed to write log to PostgreSQL:", messageId, dbErr);
						}
					}
				}
			}

			// Optional forward mirroring to main web server
			if (env.FORWARD_WEBHOOK_URL) {
				fetch(env.FORWARD_WEBHOOK_URL, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: bodyText,
				}).catch((err) => console.warn("[CF-WHATSAPP-WEBHOOK] Forwarding failed:", err));
			}

			return new Response(
				JSON.stringify({
					status: "EVENT_RECEIVED",
					processedCount,
					statusesUpdated,
				}),
				{
					status: 200,
					headers: { "Content-Type": "application/json" },
				}
			);
		} catch (error: any) {
			console.error("[CF-WHATSAPP-WEBHOOK] Error handling POST notification:", error);
			// Always return 200 OK so Meta doesn't redundantly flood retries
			return new Response(
				JSON.stringify({ error: error.message || "Internal worker error" }),
				{
					status: 200,
					headers: { "Content-Type": "application/json" },
				}
			);
		}
	},
};
