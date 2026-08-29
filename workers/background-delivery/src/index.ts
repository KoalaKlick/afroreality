// workers/background-delivery/src/index.ts
// Cloudflare Worker for Async Ticket Delivery, QR Code Generation, SMS & Email Notifications

export interface Env {
  DATABASE_URL?: string;
  RESEND_API_KEY?: string;
  ARKESEL_API_KEY?: string;
}

export default {
  async queue(batch: { messages: Array<{ body: any; ack(): void }> }, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        const job = message.body;
        console.log(`[Delivery Worker] Processing job: ${job.event} for Ref: ${job.reference}`);
        message.ack();
      } catch (err) {
        console.error("[Delivery Worker Error]:", err);
      }
    }
  },

  async scheduled(event: { cron: string }, env: Env): Promise<void> {
    console.log(`[Delivery Worker Cron] Running scheduled job at ${new Date().toISOString()}`);
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    return new Response("AfroTix Background Delivery Worker Active", { status: 200 });
  },
};
