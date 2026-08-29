import { neon } from "@neondatabase/serverless";

export interface Env {
	DATABASE_URL: string;
	PAYSTACK_SECRET_KEY: string;
	DELIVERY_QUEUE?: {
		send(msg: any): Promise<void>;
	};
}

async function verifyPaystackSignature(
	signature: string | null,
	bodyText: string,
	secret: string,
): Promise<boolean> {
	if (!signature || !secret) return false;
	try {
		const encoder = new TextEncoder();
		const keyData = encoder.encode(secret);
		const cryptoKey = await crypto.subtle.importKey(
			"raw",
			keyData,
			{ name: "HMAC", hash: "SHA-512" },
			false,
			["sign"],
		);
		const signatureBuffer = await crypto.subtle.sign(
			"HMAC",
			cryptoKey,
			encoder.encode(bodyText),
		);
		const hashArray = Array.from(new Uint8Array(signatureBuffer));
		const calculatedHex = hashArray
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		return calculatedHex === signature;
	} catch (err) {
		console.error("Signature verification error:", err);
		return false;
	}
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		if (request.method !== "POST") {
			return new Response("Method not allowed", { status: 405 });
		}

		try {
			const signature = request.headers.get("x-paystack-signature");
			const bodyText = await request.text();

			const isValid = await verifyPaystackSignature(
				signature,
				bodyText,
				env.PAYSTACK_SECRET_KEY,
			);
			if (!isValid) {
				return new Response("Invalid signature", { status: 401 });
			}

			const event = JSON.parse(bodyText);
			const eventType = event.event;
			const data = event.data;

			if (eventType === "charge.success" && data.status === "success") {
				const reference = data.reference;
				const metadata = data.metadata || {};
				const sql = neon(env.DATABASE_URL);

				// Update USSD session if exists
				if (reference.startsWith("USSD_") || metadata.source === "ussd") {
					await sql`
						UPDATE ussd_sessions 
						SET status = 'completed', updated_at = NOW() 
						WHERE reference = ${reference}
					`;

					if (metadata.option_id && metadata.quantity) {
						// Record Vote
						await sql`
							INSERT INTO votes (event_id, option_id, vote_count, voter_phone, created_at)
							VALUES (${metadata.event_id}, ${metadata.option_id}, ${metadata.quantity}, ${metadata.phone_number}, NOW())
						`;
						await sql`
							UPDATE voting_options 
							SET votes_count = votes_count + ${metadata.quantity}, updated_at = NOW()
							WHERE id = ${metadata.option_id}
						`;
					}
				}

				// Update Payments table
				await sql`
					UPDATE payments 
					SET status = 'completed', updated_at = NOW() 
					WHERE reference = ${reference}
				`;

				// Dispatch to queue if available
				if (env.DELIVERY_QUEUE) {
					await env.DELIVERY_QUEUE.send({
						type: "PAYMENT_SUCCESS",
						reference,
						data,
						timestamp: new Date().toISOString(),
					});
				}
			}

			return new Response("OK", { status: 200 });
		} catch (error: any) {
			console.error("Paystack Webhook Worker Error:", error);
			return new Response(`Error: ${error.message}`, { status: 500 });
		}
	},
};
