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
		console.error("[WEBHOOK-SIGNATURE-VERIFY-ERROR]", err);
		return false;
	}
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		if (request.method === "OPTIONS") {
			return new Response(null, {
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "POST, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type, x-paystack-signature",
				},
			});
		}

		if (request.method !== "POST") {
			return new Response("Method not allowed", { status: 405 });
		}

		if (!env.DATABASE_URL) {
			console.error("[WEBHOOK] Missing DATABASE_URL secret");
			return new Response("Server misconfiguration: missing DATABASE_URL", { status: 500 });
		}

		try {
			const signature = request.headers.get("x-paystack-signature");
			const bodyText = await request.text();

			// 1. Signature Verification
			const isValid = await verifyPaystackSignature(
				signature,
				bodyText,
				env.PAYSTACK_SECRET_KEY,
			);

			if (!isValid) {
				console.warn("[WEBHOOK] Invalid HMAC SHA512 signature rejected.");
				return new Response("Invalid signature", { status: 401 });
			}

			const event = JSON.parse(bodyText);
			const eventType = event.event;
			const data = event.data;

			// 2. Only process successful charges
			if (eventType !== "charge.success" || data.status !== "success") {
				return new Response("Ignored non-charge.success event", { status: 200 });
			}

			const reference = data.reference;
			if (!reference) {
				return new Response("Missing reference", { status: 400 });
			}

			const sql = neon(env.DATABASE_URL);
			const metadata = data.metadata || {};
			const paystackTransactionId = String(data.id || "");

			// 3. Idempotency Check — Check Payment record in database
			const payments = await sql`
				SELECT id, reference, status, purpose, amount, currency, metadata 
				FROM payments 
				WHERE reference = ${reference} 
				LIMIT 1
			`;

			const payment = payments[0] || null;

			if (payment && payment.status === "completed") {
				return new Response("Already completed", { status: 200 });
			}

			const paymentId = payment?.id || null;
			const purpose = payment?.purpose || metadata.purpose || "general";

			// 4. Update Payment record
			if (paymentId) {
				await sql`
					UPDATE payments 
					SET status = 'completed', 
						verified_at = NOW(), 
						paystack_transaction_id = ${paystackTransactionId},
						updated_at = NOW() 
					WHERE id = ${paymentId}
				`;
			}

			// 5. A: Ticket Purchase Fulfillment
			if (purpose === "ticket_purchase") {
				const ticketOrderId = metadata.ticketOrderId || metadata.orderId;
				const ticketTypeId = metadata.ticketTypeId;
				const eventId = metadata.eventId;
				const quantity = Math.max(1, Number(metadata.quantity) || 1);
				const buyerName = metadata.buyerName || metadata.attendeeName || "Attendee";
				const buyerEmail = metadata.buyerEmail || metadata.attendeeEmail || data.customer?.email;

				if (ticketOrderId) {
					// Mark order completed
					await sql`
						UPDATE ticket_orders 
						SET status = 'completed', updated_at = NOW() 
						WHERE id = ${ticketOrderId}
					`;

					// Check existing tickets to prevent duplicate creation
					const existingTickets = await sql`
						SELECT id FROM tickets WHERE order_id = ${ticketOrderId} LIMIT 1
					`;

					if (existingTickets.length === 0 && ticketTypeId && eventId) {
						for (let i = 0; i < quantity; i++) {
							const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
							const ticketCode = `TIX-${Date.now().toString().slice(-6)}-${rand}-${i + 1}`;
							await sql`
								INSERT INTO tickets (order_id, event_id, ticket_type_id, ticket_code, attendee_name, attendee_email, check_in_status, created_at, updated_at)
								VALUES (${ticketOrderId}, ${eventId}, ${ticketTypeId}, ${ticketCode}, ${buyerName}, ${buyerEmail}, 'not_checked_in', NOW(), NOW())
							`;
						}

						// Increment ticket type sold count atomically
						await sql`
							UPDATE ticket_types 
							SET quantity_sold = quantity_sold + ${quantity}, updated_at = NOW() 
							WHERE id = ${ticketTypeId}
						`;
					}
				}
			}

			// 5. B: Voting Fulfillment (Web & USSD)
			if (purpose === "voting" || purpose === "vote_purchase") {
				const optionId = metadata.optionId || metadata.votingOptionId || metadata.option_id;
				const categoryId = metadata.categoryId || metadata.category_id || null;
				const eventId = metadata.eventId || metadata.event_id;
				const voteCount = Math.max(1, Number(metadata.voteCount) || Number(metadata.quantity) || 1);
				const voterPhone = metadata.voterPhone || metadata.phone || metadata.phone_number || data.customer?.phone;
				const voterEmail = metadata.voterEmail || data.customer?.email;

				if (optionId && eventId) {
					// Record Vote row
					await sql`
						INSERT INTO votes (event_id, option_id, category_id, payment_id, vote_count, voter_phone, voter_email, created_at)
						VALUES (${eventId}, ${optionId}, ${categoryId}, ${paymentId}, ${voteCount}, ${voterPhone}, ${voterEmail}, NOW())
					`;

					// Increment vote count on option atomically
					await sql`
						UPDATE voting_options 
						SET votes_count = votes_count + ${voteCount}, updated_at = NOW() 
						WHERE id = ${optionId}
					`;
				}
			}

			// 5. C: Nomination Fulfillment
			if (purpose === "nomination") {
				const optionId = metadata.optionId || metadata.nomineeId;
				if (optionId) {
					const categories = await sql`
						SELECT vc.require_approval 
						FROM voting_options vo 
						LEFT JOIN voting_categories vc ON vo.category_id = vc.id 
						WHERE vo.id = ${optionId} 
						LIMIT 1
					`;
					const reqApproval = categories[0]?.require_approval ?? true;
					const newStatus = reqApproval ? "pending" : "approved";
					const deletionCode = Math.floor(100000 + Math.random() * 900000).toString();

					await sql`
						UPDATE voting_options 
						SET status = ${newStatus}, deletion_code = ${deletionCode}, updated_at = NOW() 
						WHERE id = ${optionId}
					`;
				}
			}

			// 5. D: USSD Session Confirmation
			if (
				reference.startsWith("USSD_") ||
				reference.startsWith("USSD-") ||
				metadata.channel === "ussd" ||
				metadata.source === "ussd"
			) {
				await sql`
					UPDATE ussd_sessions 
					SET status = 'completed', updated_at = NOW() 
					WHERE reference = ${reference}
				`;
			}

			// 6. Organization Wallet & Transaction Ledger Updates
			const organizationId = metadata.organizationId || metadata.orgId;
			if (organizationId) {
				try {
					const baseAmount = Number(metadata.baseAmount || payment?.amount || data.amount / 100);
					const platformFee = Number(metadata.platformFee || 0);
					const organizerReceives = Number(metadata.organizerReceives || baseAmount - platformFee);
					const isSplit = metadata.isSplit === true;

					if (!isSplit && organizerReceives > 0) {
						// Update wallet
						await sql`
							INSERT INTO wallets (organization_id, balance, currency, created_at, updated_at)
							VALUES (${organizationId}, ${organizerReceives}, 'GHS', NOW(), NOW())
							ON CONFLICT (organization_id) 
							DO UPDATE SET balance = wallets.balance + ${organizerReceives}, last_transaction_at = NOW(), updated_at = NOW()
						`;

						const walletRows = await sql`
							SELECT id, balance FROM wallets WHERE organization_id = ${organizationId} LIMIT 1
						`;
						const wallet = walletRows[0];

						if (wallet) {
							const txnRef = `TXN-${reference}-${Date.now().toString().slice(-4)}`;
							const category =
								purpose === "ticket_purchase"
									? "ticket_sales"
									: purpose === "voting"
										? "voting"
										: "general";

							await sql`
								INSERT INTO transactions (reference, wallet_id, payment_id, type, category, status, amount, currency, fee_amount, balance_after, description, completed_at, created_at, updated_at)
								VALUES (${txnRef}, ${wallet.id}, ${paymentId}, 'credit', ${category}, 'completed', ${organizerReceives}, 'GHS', ${platformFee}, ${wallet.balance}, ${"Payment fulfilled: " + reference}, NOW(), NOW(), NOW())
								ON CONFLICT (reference) DO NOTHING
							`;
						}
					}
				} catch (walletErr) {
					console.error("[WEBHOOK-WALLET-ERROR]", walletErr);
				}
			}

			// 7. Dispatch to Background Delivery Queue (brevo email/sms) if configured
			if (env.DELIVERY_QUEUE) {
				await env.DELIVERY_QUEUE.send({
					type: "PAYMENT_SUCCESS",
					reference,
					data,
					metadata,
					timestamp: new Date().toISOString(),
				});
			}

			return new Response("OK", { status: 200 });
		} catch (error: any) {
			console.error("[WEBHOOK-ERROR]", error);
			return new Response(`Error: ${error.message}`, { status: 500 });
		}
	},
};
