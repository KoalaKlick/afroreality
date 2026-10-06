import { prisma } from "@repo/db";
import type { FulfillmentResult } from "./types";
import { fulfillTicketPurchase } from "./ticket-fulfillment";
import { fulfillVotePurchase } from "./vote-fulfillment";
import { fulfillNomination } from "./nomination-fulfillment";
import { creditOrgWallet } from "./wallet-fulfillment";
import { dispatchPendingNotificationsIfAny } from "./notifications";

export type { FulfillmentResult };
export { fulfillPayoutTransfer } from "./payout-fulfillment";

/**
 * Atomic and Idempotent Payment Fulfillment Service.
 * Delegates each payment type to its own focused module.
 */
export async function fulfillSuccessfulPayment({
	reference,
	paystackData,
}: {
	reference: string;
	paystackData?: any;
}): Promise<FulfillmentResult> {
	try {
		if (!reference) return { success: false, error: "Missing reference." };

		const meta = (paystackData?.metadata as any) || {};
		let payment = await prisma.payment.findUnique({
			where: { reference },
			include: { ticketOrders: { include: { tickets: true } } },
		});

		// Fallback for USSD event-deposit payments
		if (!payment && meta.isEventDeposit && meta.eventId) {
			payment = await prisma.payment.findFirst({
				where: { status: "pending", metadata: { path: ["eventId"], equals: meta.eventId } },
				include: { ticketOrders: { include: { tickets: true } } },
				orderBy: { createdAt: "desc" },
			});
		}

		if (!payment) {
			console.error(`[FULFILLMENT] Payment not found: ${reference}`);
			return { success: false, error: `Payment not found: ${reference}` };
		}

		const metadata = (payment.metadata as any) || meta;

		// Idempotency — already completed
		if (payment.status === "completed") {
			await dispatchPendingNotificationsIfAny({ payment, metadata, paystackData });
			return {
				success: true,
				alreadyCompleted: true,
				message: "Payment already fulfilled.",
				payment,
				tickets: payment.ticketOrders?.[0]?.tickets || [],
			};
		}

		const now = new Date();

		// Mark payment completed
		const updatedPayment = await prisma.payment.update({
			where: { id: payment.id },
			data: {
				status: "completed",
				verifiedAt: now,
				paystackTransactionId: String(paystackData?.id || payment.paystackTransactionId || "") || undefined,
				providerResponse: paystackData ?? undefined,
			},
		});

		let generatedTickets: any[] = [];

		if (payment.purpose === "ticket_purchase" || metadata.purpose === "ticket_purchase") {
			const result = await fulfillTicketPurchase({ payment, metadata });
			generatedTickets = result.generatedTickets;
		}

		if (payment.purpose === "vote_purchase" || metadata.purpose === "vote_purchase" || metadata.purpose === "voting") {
			await fulfillVotePurchase({ payment, metadata, reference });
		}

		if (payment.purpose === "nomination" || metadata.purpose === "nomination") {
			await fulfillNomination({ payment, metadata });
		}

		// USSD session confirmation
		if (reference.startsWith("USSD_") || reference.startsWith("USSD-") || metadata.channel === "ussd") {
			await prisma.ussdSession.updateMany({ where: { reference }, data: { status: "completed" } }).catch(() => {});
		}

		// Event deposit — publish event, skip wallet credit
		if (metadata.isEventDeposit) {
			if (metadata.eventId) {
				await prisma.event.updateMany({
					where: { id: metadata.eventId, status: "draft" },
					data: { status: "published", publishedAt: new Date() },
				});
			}
			return { success: true, payment: updatedPayment };
		}

		await creditOrgWallet({ payment, metadata, now, reference });

		return { success: true, payment: updatedPayment, tickets: generatedTickets };
	} catch (error: any) {
		console.error("[FULFILLMENT-ERROR]", error);
		return { success: false, error: error.message || "Failed to fulfill payment." };
	}
}
