import { prisma } from "@repo/db";

/**
 * Fulfills payout transfer state changes (success, failure, reversed).
 * Updates Payout, Transaction, and Wallet atomically.
 */
export async function fulfillPayoutTransfer({
	reference,
	status,
	paystackData,
}: {
	reference: string;
	status: "completed" | "failed" | "reversed";
	paystackData?: any;
}): Promise<{ success: boolean; message?: string; error?: string }> {
	try {
		const payout = await prisma.payout.findUnique({
			where: { reference },
			include: { wallet: true },
		});
		if (!payout) {
			console.warn(`[PAYOUT] Not found: ${reference}`);
			return { success: false, error: `Payout not found: ${reference}` };
		}

		await prisma.$transaction(async (tx) => {
			const amt = Number(payout.amount);
			const now = new Date();
			const wasAlreadyCompleted = payout.status === "completed";

			await tx.payout.update({
				where: { id: payout.id },
				data: {
					status,
					completedAt: status === "completed" ? payout.completedAt || now : undefined,
					failedAt: status !== "completed" ? now : undefined,
					providerResponse: paystackData ?? undefined,
				},
			});

			await tx.transaction.updateMany({
				where: { reference, type: "debit" },
				data: { status, completedAt: status === "completed" ? now : undefined },
			});

			if (payout.walletId) {
				const wallet = await tx.wallet.findUnique({ where: { id: payout.walletId } });
				if (wallet) {
					const { _sum } = await tx.transaction.aggregate({
						where: { walletId: wallet.id, type: "debit", status: { in: ["pending", "processing"] } },
						_sum: { amount: true },
					});
					let updatedBalance = Number(wallet.balance);
					if (status === "completed" && !wasAlreadyCompleted) {
						updatedBalance = Math.max(0, Math.round((updatedBalance - amt) * 100) / 100);
					}
					await tx.wallet.update({
						where: { id: wallet.id },
						data: { balance: updatedBalance, pendingDebits: Number(_sum.amount || 0), lastTransactionAt: now },
					});
				}
			}
		});

		return { success: true };
	} catch (err: any) {
		console.error("[PAYOUT] Error:", err);
		return { success: false, error: err.message };
	}
}
