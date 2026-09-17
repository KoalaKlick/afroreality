"use server";

import { prisma } from "@repo/db";
import { revalidatePath } from "next/cache";
import { requireSession } from "../session";
import { serializeJsonSafe } from "../utils";
import { requireOrgRole } from "./auth-helpers";
import { isTPlusOneSettled, getSettlementDate, getNextUpcomingSettlementDate } from "@/lib/utils/settlement";
import {
	checkPaystackBalance,
	createPaystackTransferRecipient,
	initiatePaystackTransfer,
	verifyPaystackTransfer,
	fetchPaystackSettlements,
	fetchPaystackTransfers,
} from "./paystack";
import { fulfillPayoutTransfer } from "./fulfillment";


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

	// Fetch organization to know payout details (bank code, account number, account name, subaccount)
	const org = await prisma.organization.findUnique({
		where: { id: data.organizationId },
		select: {
			name: true,
			paystackBankCode: true,
			paystackAccountNumber: true,
			paystackAccountName: true,
			subaccountCode: true,
		},
	});

	// Auto-reconciliation: Sync any completed payments that occurred for this organization
	try {
		const orgEvents = await prisma.event.findMany({
			where: { organizationId: data.organizationId },
			select: { id: true, title: true },
		});
		const eventIds = orgEvents.map((e) => e.id);
		const eventIdSet = new Set(eventIds);

		if (eventIds.length > 0) {
			const existingTxns = await prisma.transaction.findMany({
				where: { walletId: wallet.id },
				select: { paymentId: true, type: true, reference: true },
			});
			const existingPaymentCredits = new Set(
				existingTxns.filter((t) => t.type === "credit").map((t) => t.paymentId).filter(Boolean)
			);
			const existingPayoutRefs = new Set(
				(
					await prisma.payout.findMany({
						where: { walletId: wallet.id },
						select: { reference: true },
					})
				).map((p) => p.reference)
			);

			// Fetch all completed payments to find those belonging to this organization's events
			const allCompletedPayments = await prisma.payment.findMany({
				where: {
					status: "completed",
				},
				include: {
					ticketOrders: { select: { eventId: true } },
					votes: { select: { eventId: true } },
				},
				orderBy: { createdAt: "asc" },
			});

			const orgPayments = allCompletedPayments.filter((p) => {
				const meta = (p.metadata as any) || {};
				if (meta.organizationId === data.organizationId || meta.orgId === data.organizationId) return true;
				if (meta.eventId && eventIdSet.has(meta.eventId)) return true;
				if (meta.event_id && eventIdSet.has(meta.event_id)) return true;
				if (p.ticketOrders?.some((to) => eventIdSet.has(to.eventId))) return true;
				if (p.votes?.some((v) => eventIdSet.has(v.eventId))) return true;
				return false;
			});

			let balanceToAdd = 0;

			for (const p of orgPayments) {
				const meta = (p.metadata as any) || {};

				// Read exact split recorded at payment time from the database
				const baseAmount = Number(meta.baseAmount ?? p.amount ?? 0);
				const platformFee = Number(meta.platformFee ?? 0);
				const organizerReceives = Number(meta.organizerReceives ?? (baseAmount - platformFee));

				if (organizerReceives <= 0 && baseAmount <= 0) continue;

				const cleanLabel =
					p.purpose === "ticket_purchase"
						? "Ticket Purchase"
						: p.purpose === "nomination"
							? "Nomination Fee"
							: "Voting Payment";

				const completedDate = p.verifiedAt || p.createdAt || new Date();

				// Record credit transaction if not yet logged
				if (!existingPaymentCredits.has(p.id)) {
					const creditRef = `TXN-IN-${p.reference}`;
					await prisma.transaction.create({
						data: {
							reference: creditRef,
							walletId: wallet.id,
							paymentId: p.id,
							type: "credit",
							category: p.purpose === "ticket_purchase" ? "ticket_purchase" : "vote_purchase",
							status: "completed",
							amount: organizerReceives,
							currency: "GHS",
							feeAmount: platformFee,
							balanceBefore: wallet.balance,
							balanceAfter: Number(wallet.balance) + balanceToAdd + organizerReceives,
							description: `${cleanLabel} Revenue (${p.reference}) - Net: GHS ${organizerReceives.toFixed(2)}, Platform Fee: GHS ${platformFee.toFixed(2)}`,
							completedAt: completedDate,
						},
					});
					existingPaymentCredits.add(p.id);
					balanceToAdd += organizerReceives;
				}
			}

			// 1. Fetch real settlements / payouts from Paystack if configured
			let paystackSettledSum = 0;
			if (org?.subaccountCode) {
				try {
					const settlements = await fetchPaystackSettlements({
						subaccountCode: org.subaccountCode,
					});
					for (const s of settlements) {
						if (s.status === "success" || s.status === "completed") {
							paystackSettledSum += s.amount;
						}
					}
				} catch (psErr) {
					console.warn("[PAYSTACK-SYNC-ERR]", psErr);
				}
			}

			// Reconcile wallet balance directly from completed transactions
			const completedTxns = await prisma.transaction.findMany({
				where: { walletId: wallet.id, status: "completed" },
				select: { type: true, amount: true, feeAmount: true, completedAt: true, createdAt: true },
			});
			const totalCreditSum = completedTxns
				.filter((t) => t.type === "credit")
				.reduce((sum, t) => sum + Number(t.amount || 0), 0);
			const totalFeeSum = completedTxns
				.filter((t) => t.type === "credit")
				.reduce((sum, t) => sum + Number(t.feeAmount || 0), 0);
			const totalGrossInflows = Math.round((totalCreditSum + totalFeeSum) * 100) / 100;
			const totalDebitSum = completedTxns
				.filter((t) => t.type === "debit")
				.reduce((sum, t) => sum + Number(t.amount || 0), 0);
			const trueBalance = Math.max(0, totalCreditSum - totalDebitSum);

			// T+1 Settlement breakdown: Non-public holidays and weekdays
			let clearedEarnings = 0;
			let pendingClearanceEarnings = 0;
			const upcomingTxDates: Date[] = [];

			for (const t of completedTxns.filter((t) => t.type === "credit")) {
				const txDate = t.completedAt || t.createdAt || new Date();
				const amt = Number(t.amount || 0);
				if (isTPlusOneSettled(txDate)) {
					clearedEarnings += amt;
				} else {
					pendingClearanceEarnings += amt;
					upcomingTxDates.push(txDate);
				}
			}

			if (Number(wallet.balance) !== trueBalance || Number(wallet.pendingCredits) > 0) {
				wallet = await prisma.wallet.update({
					where: { id: wallet.id },
					data: {
						balance: trueBalance,
						pendingCredits: 0,
						lastTransactionAt: new Date(),
					},
				});
			}

			const balanceNum = Number(wallet.balance);
			const pendingDebitsNum = Number(wallet.pendingDebits);
			const availableToWithdraw = Math.max(0, clearedEarnings - totalDebitSum - pendingDebitsNum);
			const nextSettlement = getNextUpcomingSettlementDate(upcomingTxDates);

			return serializeJsonSafe({
				id: wallet.id,
				organizationId: wallet.organizationId,
				balance: balanceNum,
				availableBalance: availableToWithdraw,
				clearedBalance: Math.max(0, clearedEarnings - totalDebitSum - pendingDebitsNum),
				pendingBalance: pendingClearanceEarnings,
				pendingSettlement: pendingClearanceEarnings,
				nextSettlementDate: nextSettlement ? nextSettlement.toISOString() : null,
				currency: wallet.currency,
				totalInflows: totalGrossInflows,
				grossInflows: totalGrossInflows,
				organizerShare: totalCreditSum,
				platformFees: totalFeeSum,
				totalPayouts: totalDebitSum,
				pendingCredits: pendingClearanceEarnings,
				pendingDebits: pendingDebitsNum,
				isLocked: !!wallet.isLocked,
				lockReason: wallet.lockReason ?? null,
			});
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
		clearedBalance: Math.max(0, balanceNum - pendingDebitsNum),
		pendingBalance: pendingCreditsNum,
		pendingSettlement: pendingCreditsNum,
		nextSettlementDate: null,
		currency: wallet.currency,
		totalInflows: balanceNum,
		grossInflows: balanceNum,
		organizerShare: balanceNum,
		platformFees: 0,
		totalPayouts: pendingDebitsNum,
		pendingCredits: pendingCreditsNum,
		pendingDebits: pendingDebitsNum,
		isLocked: !!wallet.isLocked,
		lockReason: wallet.lockReason ?? null,
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
	await requireOrgRole(data.organizationId, ["owner"]);

	const wallet = await prisma.wallet.findFirst({
		where: { organizationId: data.organizationId },
	});

	if (!wallet) throw new Error("No active wallet found.");
	if (wallet.isLocked) {
		throw new Error(
			"Wallet is locked: " + (wallet.lockReason ?? "Contact support"),
		);
	}

	const withdrawalAmount = Number(data.amount);
	if (withdrawalAmount <= 0) throw new Error("Invalid withdrawal amount.");

	// 1. Calculate available cleared balance (T+1 enforced)
	const completedCredits = await prisma.transaction.findMany({
		where: { walletId: wallet.id, status: "completed", type: "credit" },
		select: { amount: true, completedAt: true, createdAt: true },
	});

	let clearedSum = 0;
	let unclearedSum = 0;
	for (const c of completedCredits) {
		const dt = c.completedAt || c.createdAt || new Date();
		const amt = Number(c.amount || 0);
		if (isTPlusOneSettled(dt)) {
			clearedSum += amt;
		} else {
			unclearedSum += amt;
		}
	}

	const existingDebits = await prisma.transaction.findMany({
		where: { walletId: wallet.id, type: "debit", status: "completed" },
		select: { amount: true },
	});
	const completedDebitsTotal = existingDebits.reduce((s, d) => s + Number(d.amount || 0), 0);
	const availableCleared = Math.max(
		0,
		clearedSum - completedDebitsTotal - Number(wallet.pendingDebits),
	);

	if (withdrawalAmount > availableCleared) {
		if (unclearedSum > 0) {
			throw new Error(
				`Amount exceeds cleared balance (${wallet.currency} ${availableCleared.toFixed(2)}). You have ${wallet.currency} ${unclearedSum.toFixed(2)} pending T+1 settlement clearance (available on the next business day).`
			);
		}
		throw new Error(
			`Insufficient cleared balance. Available: ${wallet.currency} ${availableCleared.toFixed(2)}`,
		);
	}

	// 2. Check Paystack Live Merchant Balance to prevent API errors
	const paystackBalanceCheck = await checkPaystackBalance(wallet.currency);
	if (paystackBalanceCheck.success && typeof paystackBalanceCheck.balance === "number") {
		if (withdrawalAmount > paystackBalanceCheck.balance) {
			throw new Error(
				`Cannot process withdrawal: Paystack merchant account balance (${wallet.currency} ${paystackBalanceCheck.balance.toFixed(2)}) is insufficient for this payout. Please contact support or try a smaller amount.`
			);
		}
	}

	// 3. Create Transfer Recipient on Paystack
	const ref = `WDR-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
	const recipientResult = await createPaystackTransferRecipient({
		name: data.accountName,
		accountNumber: data.accountNumber,
		bankCode: data.bankCode,
		currency: wallet.currency,
	});

	if (!recipientResult.success || !recipientResult.recipientCode) {
		throw new Error(recipientResult.message || "Failed to register payout recipient with Paystack.");
	}

	// 4. Initiate Real Transfer on Paystack
	const transferResult = await initiatePaystackTransfer({
		amount: withdrawalAmount,
		recipientCode: recipientResult.recipientCode,
		reference: ref,
		reason: data.description?.trim() || "Wallet withdrawal",
	});

	if (!transferResult.success) {
		throw new Error(`Paystack transfer error: ${transferResult.message || "Failed to initiate transfer."}`);
	}

	const result = await prisma.$transaction(async (tx) => {
		// 1. Create payout request with Paystack reference
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
				status: transferResult.status === "success" ? "completed" : "processing",
				provider: "paystack",
				providerReference: transferResult.transferCode,
				providerResponse: transferResult.raw ?? undefined,
				description: data.description ?? "Wallet withdrawal via Paystack",
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
				status: transferResult.status === "success" ? "completed" : "processing",
				amount: withdrawalAmount,
				currency: wallet.currency,
				providerReference: transferResult.transferCode,
				providerResponse: transferResult.raw ?? undefined,
				description: data.description?.trim() || `Withdrawal to ${data.accountNumber} via Paystack`,
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
					description: `Disbursed ${wallet.currency} ${withdrawalAmount.toFixed(2)} via Paystack to ${data.bankName ? data.bankName + " " : ""}${data.accountNumber} (${data.accountName})`,
					metadata: {
						reference: ref,
						amount: withdrawalAmount,
						currency: wallet.currency,
						transferCode: transferResult.transferCode,
						status: transferResult.status,
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

/**
 * Syncs a payout's status directly with Paystack, or allows setting a status for dev/test verification.
 */
export async function syncPayoutStatus({
	reference,
	forceStatus,
}: {
	reference: string;
	forceStatus?: "completed" | "failed" | "reversed";
}): Promise<{ success: boolean; message: string; status?: string }> {
	const session = await requireSession();

	const payout = await prisma.payout.findUnique({
		where: { reference },
		include: { wallet: true },
	});

	if (!payout) {
		return { success: false, message: `Payout with reference ${reference} not found.` };
	}

	if (forceStatus) {
		const res = await fulfillPayoutTransfer({
			reference,
			status: forceStatus,
		});
		if (res.success) {
			revalidatePath("/my-wallet");
			revalidatePath("/super/wallets");
			return {
				success: true,
				message: `Payout ${reference} marked as ${forceStatus}.`,
				status: forceStatus,
			};
		}
		return { success: false, message: res.error || "Failed to update payout status." };
	}

	// Verify directly with Paystack API
	const psRes = await verifyPaystackTransfer(reference);
	if (!psRes.success) {
		return { success: false, message: psRes.message || "Failed to verify with Paystack." };
	}

	const psStatus = psRes.status; // "success" | "failed" | "reversed" | "abandoned" | "pending"

	if (psStatus === "success") {
		await fulfillPayoutTransfer({
			reference,
			status: "completed",
			paystackData: psRes.raw,
		});
		revalidatePath("/my-wallet");
		revalidatePath("/super/wallets");
		return { success: true, message: "Payout successfully settled via Paystack!", status: "completed" };
	} else if (psStatus === "failed" || psStatus === "abandoned" || psStatus === "reversed") {
		const mappedStatus = psStatus === "reversed" ? "reversed" : "failed";
		await fulfillPayoutTransfer({
			reference,
			status: mappedStatus,
			paystackData: psRes.raw,
		});
		revalidatePath("/my-wallet");
		revalidatePath("/super/wallets");
		return {
			success: true,
			message: `Payout marked as ${mappedStatus} (Paystack status: ${psStatus}).`,
			status: mappedStatus,
		};
	}

	return { success: true, message: `Payout is currently ${psStatus} on Paystack.`, status: psStatus };
}


