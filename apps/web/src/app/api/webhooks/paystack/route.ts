import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get("x-paystack-signature");
    const secret = process.env.PAYSTACK_SECRET_KEY || "";

    if (secret && signature) {
      const hash = crypto
        .createHmac("sha512", secret)
        .update(bodyText)
        .digest("hex");
      if (hash !== signature) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const event = JSON.parse(bodyText);

    if (event.event === "charge.success") {
      const data = event.data;
      const reference = data.reference;

      const payment = await prisma.payment.findUnique({
        where: { reference },
      });

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "completed" },
        });

        const meta = (payment.metadata as any) || {};
        const ticketOrderId = meta.ticketOrderId;

        if (ticketOrderId) {
          await prisma.ticketOrder.update({
            where: { id: ticketOrderId },
            data: { status: "completed" },
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Paystack webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
