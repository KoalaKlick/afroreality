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
		const existing = await prisma.payment.findUnique({
			where: { reference },
			include: { ticketOrders: { include: { tickets: true } } },
		});

		if (!existing) {
			console.error(`[FULFILLMENT] Payment not found: ${reference}`);
			return { success: false, error: `Payment not found: ${reference}` };
		}

		const metadata = (existing.metadata as any) || meta;

		if (existing.status === "completed") {
			await dispatchPendingNotificationsIfAny({
				payment: existing,
				metadata,
				paystackData,
			});
			return {
				success: true,
				alreadyCompleted: true,
				message: "Payment already fulfilled.",
				payment: existing,
				tickets: existing.ticketOrders?.[0]?.tickets || [],
			};
		}

		if (existing.status !== "pending" && existing.status !== "processing") {
			return {
				success: false,
				error: `Payment is ${existing.status} and cannot be fulfilled.`,
			};
		}

		const now = new Date();

		// Atomic claim — only one concurrent webhook/callback wins (DATA-10).
		const claimed = await prisma.payment.updateMany({
			where: {
				id: existing.id,
				status: { in: ["pending", "processing"] },
			},
			data: {
				status: "completed",
				verifiedAt: now,
				paystackTransactionId:
					String(paystackData?.id || existing.paystackTransactionId || "") ||
					undefined,
				providerResponse: paystackData ?? undefined,
			},
		});

		if (claimed.count === 0) {
			const again = await prisma.payment.findUnique({
				where: { reference },
				include: { ticketOrders: { include: { tickets: true } } },
			});
			if (again?.status === "completed") {
				return {
					success: true,
					alreadyCompleted: true,
					message: "Payment already fulfilled.",
					payment: again,
					tickets: again.ticketOrders?.[0]?.tickets || [],
				};
			}
			return { success: false, error: "Could not claim payment for fulfillment." };
		}

		const payment = await prisma.payment.findUniqueOrThrow({
			where: { id: existing.id },
			include: { ticketOrders: { include: { tickets: true } } },
		});

		let generatedTickets: any[] = [];

		if (payment.purpose === "ticket_purchase" || metadata.purpose === "ticket_purchase") {
			const result = await fulfillTicketPurchase({ payment, metadata, paystackData });
			generatedTickets = result.generatedTickets;
		}

		if (
			payment.purpose === "vote_purchase" ||
			metadata.purpose === "vote_purchase" ||
			metadata.purpose === "voting"
		) {
			await fulfillVotePurchase({ payment, metadata, reference, paystackData });
		}

		if (payment.purpose === "nomination" || metadata.purpose === "nomination") {
			await fulfillNomination({ payment, metadata });
		}

		if (
			reference.startsWith("USSD_") ||
			reference.startsWith("USSD-") ||
			reference.startsWith("JUNIPAY_") ||
			reference.startsWith("HT") ||
			metadata.channel === "ussd"
		) {
			await prisma.ussdSession
				.updateMany({ where: { reference }, data: { status: "completed" } })
				.catch(() => {});
		}

		if (metadata.isEventDeposit) {
			if (metadata.eventId) {
				await prisma.event.updateMany({
					where: { id: metadata.eventId, status: "draft" },
					data: { status: "published", publishedAt: new Date() },
				});
			}
			return { success: true, payment };
		}

		await creditOrgWallet({ payment, metadata, now, reference });

		return { success: true, payment, tickets: generatedTickets };
	} catch (error: any) {
		console.error("[FULFILLMENT-ERROR]", error);
		return { success: false, error: error.message || "Failed to fulfill payment." };
	}
}
