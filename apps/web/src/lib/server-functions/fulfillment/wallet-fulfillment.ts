import { prisma } from "@repo/db";

export async function creditOrgWallet({
	payment,
	metadata,
	now,
	reference,
}: {
	payment: any;
	metadata: any;
	now: Date;
	reference: string;
}): Promise<void> {
	let organizationId = metadata.organizationId || metadata.orgId;
	if (!organizationId) {
		const eventId = metadata.eventId || metadata.event_id || payment.ticketOrders?.[0]?.eventId;
		if (eventId) {
			const ev = await prisma.event.findUnique({ where: { id: eventId }, select: { organizationId: true } });
			organizationId = ev?.organizationId;
		}
	}
	if (!organizationId) return;

	try {
		const baseAmount = Number(metadata.baseAmount || payment.amount || 0);
		const platformFee = Number(metadata.platformFee ?? 0);
		const organizerReceives = Number(metadata.organizerReceives ?? (baseAmount - platformFee));
		if (organizerReceives <= 0) return;

		let wallet = await prisma.wallet.findFirst({ where: { organizationId } });
		if (!wallet) {
			wallet = await prisma.wallet.create({ data: { organizationId, balance: 0, currency: "GHS" } });
		}

		const existingCredit = await prisma.transaction.findFirst({
			where: { walletId: wallet.id, paymentId: payment.id, type: "credit" },
		});
		if (existingCredit) return;

		const cleanLabel =
			payment.purpose === "ticket_purchase" ? "Ticket Purchase" :
			payment.purpose === "nomination" ? "Nomination Fee" : "Voting Payment";

		const currentBalance = Number(wallet.balance);
		await prisma.wallet.update({
			where: { id: wallet.id },
			data: { balance: { increment: organizerReceives }, lastTransactionAt: now },
		});
		await prisma.transaction.create({
			data: {
				reference: `TXN-IN-${reference}`,
				walletId: wallet.id,
				paymentId: payment.id,
				type: "credit",
				category: payment.purpose === "ticket_purchase" ? "ticket_purchase" : "vote_purchase",
				status: "completed",
				amount: organizerReceives,
				currency: "GHS",
				feeAmount: platformFee,
				balanceBefore: currentBalance,
				balanceAfter: currentBalance + organizerReceives,
				description: `${cleanLabel} Revenue (${reference}) - Net: GHS ${organizerReceives.toFixed(2)}, Fee: GHS ${platformFee.toFixed(2)}`,
				completedAt: now,
			},
		});
	} catch (err) {
		console.error("[WALLET] Credit failed:", err);
	}
}
