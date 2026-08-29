// workers/paystack-webhook/src/index.ts
// Cloudflare Worker for High-Throughput Edge Paystack Webhook Verification & Processing

export interface Env {
  PAYSTACK_SECRET_KEY?: string;
  DATABASE_URL?: string;
  DELIVERY_QUEUE?: {
    send(message: any): Promise<void>;
  };
}

async function verifyPaystackSignature(body: string, signature: string, secret: string): Promise<boolean> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  const hex = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex.toLowerCase() === signature.toLowerCase();
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const signature = request.headers.get("x-paystack-signature");
      if (!signature) {
        return new Response("Missing Paystack signature", { status: 400 });
      }

      const bodyText = await request.text();
      const secret = env.PAYSTACK_SECRET_KEY || "";

      if (secret) {
        const isValid = await verifyPaystackSignature(bodyText, signature, secret);
        if (!isValid) {
          return new Response("Invalid signature", { status: 401 });
        }
      }

      const payload = JSON.parse(bodyText);
      const event = payload.event;
      const data = payload.data;

      console.log(`[Paystack Webhook Worker] Event: ${event}, Ref: ${data?.reference}`);

      if (event === "charge.success") {
        const metadata = data.metadata || {};
        if (env.DELIVERY_QUEUE) {
          await env.DELIVERY_QUEUE.send({
            event,
            reference: data.reference,
            amount: data.amount / 100,
            currency: data.currency,
            paidAt: data.paid_at,
            customer: data.customer,
            metadata,
          });
        }
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      console.error("[Paystack Webhook Worker Error]:", err);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
