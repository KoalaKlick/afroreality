import { neon } from "@neondatabase/serverless";

export interface Env {
	DATABASE_URL: string;
	ARKESEL_API_KEY?: string;
	HUBTEL_CLIENT_ID?: string;
	HUBTEL_CLIENT_SECRET?: string;
}

export default {
	async queue(batch: any, env: Env): Promise<void> {
		const sql = neon(env.DATABASE_URL);

		for (const message of batch.messages) {
			try {
				const { type, reference, data } = message.body;

				if (type === "PAYMENT_SUCCESS") {
					const customer = data.customer || {};
					const phone = customer.phone || data.metadata?.phone_number;

					// If ticket purchase, generate ticket records
					if (data.metadata?.ticket_type_id && data.metadata?.quantity) {
						const quantity = Number.parseInt(data.metadata.quantity, 10);
						for (let i = 0; i < quantity; i++) {
							const ticketCode = `TKT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
							await sql`
								INSERT INTO tickets (order_id, event_id, ticket_type_id, ticket_code, attendee_name, attendee_email, created_at)
								VALUES (${data.metadata.order_id}, ${data.metadata.event_id}, ${data.metadata.ticket_type_id}, ${ticketCode}, ${customer.name || ""}, ${customer.email || ""}, NOW())
							`;
						}
					}

					// Send notification if SMS provider is configured
					if (phone && env.ARKESEL_API_KEY) {
						await fetch("https://sms.arkesel.com/api/v2/sms/send", {
							method: "POST",
							headers: {
								"api-key": env.ARKESEL_API_KEY,
								"Content-Type": "application/json",
							},
							body: JSON.stringify({
								sender: "AfroTix",
								message: `Payment received for ref: ${reference}. Thank you for using AfroTix!`,
								recipients: [phone],
							}),
						});
					}
				}

				message.ack();
			} catch (err) {
				console.error("Queue Processing Error:", err);
				message.retry();
			}
		}
	},

	async scheduled(event: any, env: Env, ctx: any): Promise<void> {
		const sql = neon(env.DATABASE_URL);
		try {
			// Periodic cron: Cleanup stale pending USSD sessions older than 30 minutes
			await sql`
				UPDATE ussd_sessions 
				SET status = 'cancelled', updated_at = NOW() 
				WHERE status = 'pending' AND created_at < NOW() - INTERVAL '30 minutes'
			`;
		} catch (err) {
			console.error("Cron Execution Error:", err);
		}
	},
};
