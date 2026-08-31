"use server";

import { prisma } from "@repo/db";
import { revalidatePath } from "next/cache";
import { requireSession } from "../session";
import { serializeJsonSafe } from "../utils";
import { requireOrgRole } from "./auth-helpers";

export async function getOrgWallet({
	data,
}: {
	data: { organizationId: string };
}): Promise<any> {
	await requireOrgRole(data.organizationId, ["owner", "admin", "member"]);

	let wallet = await prisma.wallet.findFirst({
		where: { organizationId: data.organizationId },
	});

	if (!wallet) {
		wallet = await prisma.wallet.create({
			data: {
				organizationId: data.organizationId,
				currency: "GHS",
				balance: 0,
				pendingCredits: 0,
				pendingDebits: 0,
			},
		});
	}

	// Auto-reconciliation: Sync any completed payments that occurred for this organization
	try {
		const orgEvents = await prisma.event.findMany({
			where: { organizationId: data.organizationId },
			select: { id: true },
		});
		const eventIds = orgEvents.map((e) => e.id);

		if (eventIds.length > 0) {
			const existingTxns = await prisma.transaction.findMany({
				where: { walletId: wallet.id },
				select: { paymentId: true },
			});
			const existingPaymentIds = new Set(existingTxns.map((t) => t.paymentId).filter(Boolean));

			const uncreditedPayments = await prisma.payment.findMany({
				where: {
					status: "completed",
					id: { notIn: Array.from(existingPaymentIds) as string[] },
					OR: [
						{ metadata: { path: ["organizationId"], equals: data.organizationId } },
						...eventIds.map((eventId) => ({
							metadata: { path: ["eventId"], equals: eventId },
						})),
						{ ticketOrders: { some: { eventId: { in: eventIds } } } },
						{ votes: { some: { eventId: { in: eventIds } } } },
					],
				},
			});

			if (uncreditedPayments.length > 0) {
				let totalToAdd = 0;
				for (const p of uncreditedPayments) {
					const meta = (p.metadata as any) || {};
					const isSplit = meta.isSplit === true;
					if (isSplit) continue;

					const baseAmount = Number(meta.baseAmount || p.amount || 0);
					const platformFee = Number(meta.platformFee || 0);
					const organizerReceives = Number(meta.organizerReceives || (baseAmount - platformFee));

					if (organizerReceives > 0) {
						totalToAdd += organizerReceives;
						const category =
							p.purpose === "ticket_purchase"
								? "ticket_purchase"
								: p.purpose === "vote_purchase"
									? "vote_purchase"
									: "wallet_topup";

						const cleanLabel =
							p.purpose === "ticket_purchase"
								? "Ticket Purchase"
								: p.purpose === "vote_purchase"
									? "Voting Payment"
									: "Wallet Top-up";

						await prisma.transaction.create({
							data: {
								reference: `TXN-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`,
								walletId: wallet.id,
								paymentId: p.id,
								type: "credit",
								category,
								status: "completed",
								amount: organizerReceives,
								currency: "GHS",
								feeAmount: platformFee,
								balanceBefore: wallet.balance,
								balanceAfter: Number(wallet.balance) + totalToAdd,
								description: `${cleanLabel} Revenue`,
								completedAt: p.verifiedAt || new Date(),
							},
						});
					}
				}

				if (totalToAdd > 0) {
					wallet = await prisma.wallet.update({
						where: { id: wallet.id },
						data: {
							balance: { increment: totalToAdd },
							lastTransactionAt: new Date(),
						},
					});
				}
			}
		}
	} catch (reconcileErr) {
		console.warn("[WALLET-SYNC-WARN]", reconcileErr);
	}

	const balanceNum = Number(wallet.balance);
	const pendingDebitsNum = Number(wallet.pendingDebits);
	const pendingCreditsNum = Number(wallet.pendingCredits);

	return serializeJsonSafe({
		id: wallet.id,
		organizationId: wallet.organizationId,
		balance: balanceNum,
		availableBalance: Math.max(0, balanceNum - pendingDebitsNum),
		currency: wallet.currency,
		pendingCredits: pendingCreditsNum,
		pendingDebits: pendingDebitsNum,
	});
}

export async function getOrgTransactions({
	data,
}: {
	data: { organizationId: string; page?: number; limit?: number };
}): Promise<{ items: any[]; total: number }> {
	await requireOrgRole(data.organizationId, ["owner", "admin", "member"]);

	const wallet = await prisma.wallet.findFirst({
		where: { organizationId: data.organizationId },
		select: { id: true },
	});

	if (!wallet) return { items: [], total: 0 };

	const page = data.page || 1;
	const limit = data.limit || 20;
	const skip = (page - 1) * limit;

	const [items, total] = await Promise.all([
		prisma.transaction.findMany({
			where: { walletId: wallet.id },
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
		}),
		prisma.transaction.count({
			where: { walletId: wallet.id },
		}),
	]);

	return { items: serializeJsonSafe(items), total };
}

export async function requestWalletWithdrawal({
	data,
}: {
	data: {
		organizationId: string;
		amount: number;
		bankCode: string;
		bankName?: string;
		accountNumber: string;
		accountName: string;
		description?: string;
	};
}): Promise<any> {
	const session = await requireSession();
	await requireOrgRole(data.organizationId, ["owner", "admin"]);

	const wallet = await prisma.wallet.findFirst({
		where: { organizationId: data.organizationId },
	});

	if (!wallet) throw new Error("No active wallet found.");
	if (wallet.isLocked)
		throw new Error(
			"Wallet is locked: " + (wallet.lockReason ?? "Contact support"),
		);

	const available = Number(wallet.balance) - Number(wallet.pendingDebits);
	const withdrawalAmount = Number(data.amount);

	if (withdrawalAmount <= 0) throw new Error("Invalid withdrawal amount.");
	if (withdrawalAmount > available) {
		throw new Error(
			`Insufficient balance. Available: ${wallet.currency} ${available.toFixed(2)}`,
		);
	}

	const ref = `WDR-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

	const result = await prisma.$transaction(async (tx) => {
		// 1. Create payout request
		const payout = await tx.payout.create({
			data: {
				reference: ref,
				walletId: wallet.id,
				recipientName: data.accountName,
				bankCode: data.bankCode,
				bankName: data.bankName ?? "",
				accountNumber: data.accountNumber,
				accountName: data.accountName,
				amount: withdrawalAmount,
				currency: wallet.currency,
				status: "pending",
				description: data.description ?? "Wallet withdrawal request",
			},
		});

		// 2. Increase pending debits on wallet
		await tx.wallet.update({
			where: { id: wallet.id },
			data: {
				pendingDebits: { increment: withdrawalAmount },
				lastTransactionAt: new Date(),
			},
		});

		// 3. Log audit transaction
		await tx.transaction.create({
			data: {
				reference: ref,
				walletId: wallet.id,
				type: "debit",
				category: "wallet_withdrawal",
				status: "pending",
				amount: withdrawalAmount,
				currency: wallet.currency,
				description: data.description?.trim() || `Withdrawal to ${data.accountNumber}`,
				balanceBefore: Number(wallet.balance),
				balanceAfter: Math.max(0, Number(wallet.balance) - withdrawalAmount),
			},
		});

		// 4. Record Activity Log for audit trail
		try {
			await tx.activityLog.create({
				data: {
					organizationId: data.organizationId,
					userId: session.userId,
					action: "wallet_withdrawal_requested",
					entityType: "payout",
					entityId: payout.id,
					description: `Requested withdrawal of ${wallet.currency} ${withdrawalAmount.toFixed(2)} to ${data.bankName ? data.bankName + " " : ""}${data.accountNumber} (${data.accountName})`,
					metadata: {
						reference: ref,
						amount: withdrawalAmount,
						currency: wallet.currency,
						recipientName: data.accountName,
						bankCode: data.bankCode,
						bankName: data.bankName,
						accountNumber: data.accountNumber,
					},
				},
			});
		} catch (auditErr) {
			console.warn("[ACTIVITY-LOG-WARN]", auditErr);
		}

		return payout;
	});

	revalidatePath("/organization/wallet");
	return serializeJsonSafe(result);
}

export async function getOrgPayouts({
	data,
}: {
	data: { organizationId: string; page?: number; limit?: number };
}): Promise<{ items: any[]; total: number }> {
	await requireOrgRole(data.organizationId, ["owner", "admin", "member"]);

	const wallet = await prisma.wallet.findFirst({
		where: { organizationId: data.organizationId },
		select: { id: true },
	});

	if (!wallet) return { items: [], total: 0 };

	const page = data.page || 1;
	const limit = data.limit || 20;
	const skip = (page - 1) * limit;

	const [items, total] = await Promise.all([
		prisma.payout.findMany({
			where: { walletId: wallet.id },
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
		}),
		prisma.payout.count({
			where: { walletId: wallet.id },
		}),
	]);

	return { items: serializeJsonSafe(items), total };
}

export async function getOrgActivityLogs({
	data,
}: {
	data: { organizationId: string; page?: number; limit?: number };
}): Promise<{ items: any[]; total: number }> {
	await requireOrgRole(data.organizationId, ["owner", "admin", "member"]);

	const page = data.page || 1;
	const limit = data.limit || 20;
	const skip = (page - 1) * limit;

	const [items, total] = await Promise.all([
		prisma.activityLog.findMany({
			where: { organizationId: data.organizationId },
			include: {
				user: {
					select: {
						id: true,
						fullName: true,
						email: true,
						avatarUrl: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
		}),
		prisma.activityLog.count({
			where: { organizationId: data.organizationId },
		}),
	]);

	return { items: serializeJsonSafe(items), total };
}

