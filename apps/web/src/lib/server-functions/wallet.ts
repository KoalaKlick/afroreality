"use server";

import { prisma } from "@repo/db";
import { revalidatePath } from "next/cache";
import { requireSession } from "../session";
import { serializeJsonSafe } from "../utils";
import { requireOrgRole } from "./auth-helpers";
import { isTPlusOneSettled, getSettlementDate, getNextUpcomingSettlementDate } from "@/lib/utils/settlement";
import {
	verifyPaystackTransfer,
	finalizePaystackTransfer,
	resendPaystackTransferOtp,
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

			// Instead of a hardcoded timer, verify live status directly with Paystack
			// for any unfinalized payouts to keep local state 100% synchronized with Paystack.
			const unfinalizedPayouts = await prisma.payout.findMany({
				where: {
					walletId: wallet.id,
					status: { in: ["pending", "processing"] },
				},
				take: 10,
				orderBy: { createdAt: "desc" },
			});

			for (const p of unfinalizedPayouts) {
				if (!p.reference) continue;
				try {
					const psRes = await verifyPaystackTransfer(p.reference);
					if (psRes.success && psRes.status) {
						if (psRes.status === "success") {
							await fulfillPayoutTransfer({
								reference: p.reference,
								status: "completed",
								paystackData: psRes.raw,
							});
						} else if (
							psRes.status === "abandoned" ||
							psRes.status === "failed" ||
							psRes.status === "reversed"
						) {
							await fulfillPayoutTransfer({
								reference: p.reference,
								status: psRes.status === "reversed" ? "reversed" : "failed",
								paystackData: {
									...(typeof p.providerResponse === "object" ? p.providerResponse : {}),
									paystackVerify: psRes.raw,
									failureReason:
										psRes.status === "abandoned"
											? "Paystack transfer authorization expired or was abandoned on Paystack."
											: "Paystack transfer failed.",
								},
							});
						}
					}
				} catch (psSyncErr) {
					console.warn(`[WALLET-PAYSTACK-SYNC-ERR] Failed to verify payout ${p.reference}:`, psSyncErr);
				}
			}

			// Reconcile pending debits dynamically from database transactions
			const pendingDebitsAgg = await prisma.transaction.aggregate({
				where: {
					walletId: wallet.id,
					type: "debit",
					status: { in: ["pending", "processing"] },
				},
				_sum: { amount: true },
			});
			const realPendingDebits = Math.round(Number(pendingDebitsAgg._sum.amount || 0) * 100) / 100;

			// Reconcile wallet balance directly from completed transactions
			const completedTxns = await prisma.transaction.findMany({
				where: { walletId: wallet.id, status: "completed" },
				select: { type: true, amount: true, feeAmount: true, completedAt: true, createdAt: true },
			});
			const totalCreditSum = Math.round(
				completedTxns
					.filter((t) => t.type === "credit")
					.reduce((sum, t) => sum + Number(t.amount || 0), 0) * 100
			) / 100;
			const totalFeeSum = Math.round(
				completedTxns
					.filter((t) => t.type === "credit")
					.reduce((sum, t) => sum + Number(t.feeAmount || 0), 0) * 100
			) / 100;
			const totalGrossInflows = Math.round((totalCreditSum + totalFeeSum) * 100) / 100;
			const totalDebitSum = Math.round(
				completedTxns
					.filter((t) => t.type === "debit")
					.reduce((sum, t) => sum + Number(t.amount || 0), 0) * 100
			) / 100;
			const trueBalance = Math.round(Math.max(0, totalCreditSum - totalDebitSum) * 100) / 100;

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

			if (
				Number(wallet.balance) !== trueBalance ||
				Number(wallet.pendingDebits) !== realPendingDebits ||
				Number(wallet.pendingCredits) > 0
			) {
				wallet = await prisma.wallet.update({
					where: { id: wallet.id },
					data: {
						balance: trueBalance,
						pendingDebits: realPendingDebits,
						pendingCredits: 0,
						lastTransactionAt: new Date(),
					},
				});
			}

			const balanceNum = Math.round(Number(wallet.balance) * 100) / 100;
			const pendingDebitsNum = realPendingDebits;
			// Cleared earnings eligible to withdraw (minus completed debits and active pending debits)
			const availableToWithdraw = Math.round(
				Math.max(0, clearedEarnings - totalDebitSum - realPendingDebits) * 100
			) / 100;
			const nextSettlement = getNextUpcomingSettlementDate(upcomingTxDates);

			return serializeJsonSafe({
				id: wallet.id,
				organizationId: wallet.organizationId,
				balance: balanceNum,
				ledgerBalance: balanceNum,
				availableBalance: availableToWithdraw,
				clearedBalance: availableToWithdraw,
				pendingBalance: Math.round(pendingClearanceEarnings * 100) / 100,
				pendingSettlement: Math.round(pendingClearanceEarnings * 100) / 100,
				nextSettlementDate: nextSettlement ? nextSettlement.toISOString() : null,
				currency: wallet.currency,
				totalInflows: totalGrossInflows,
				grossInflows: totalGrossInflows,
				organizerShare: totalCreditSum,
				platformFees: totalFeeSum,
				totalPayouts: totalDebitSum,
				pendingCredits: Math.round(pendingClearanceEarnings * 100) / 100,
				pendingDebits: realPendingDebits,
				isLocked: !!wallet.isLocked,
				lockReason: wallet.lockReason ?? null,
			});
		}
	} catch (reconcileErr) {
		console.warn("[WALLET-SYNC-WARN]", reconcileErr);
	}

	const balanceNum = Math.round(Number(wallet.balance) * 100) / 100;
	const pendingDebitsNum = Math.round(Number(wallet.pendingDebits) * 100) / 100;
	const pendingCreditsNum = Math.round(Number(wallet.pendingCredits) * 100) / 100;

	return serializeJsonSafe({
		id: wallet.id,
		organizationId: wallet.organizationId,
		balance: balanceNum,
		ledgerBalance: balanceNum,
		availableBalance: Math.round(Math.max(0, balanceNum - pendingDebitsNum) * 100) / 100,
		clearedBalance: Math.round(Math.max(0, balanceNum - pendingDebitsNum) * 100) / 100,
		pendingBalance: pendingCreditsNum,
		pendingSettlement: pendingCreditsNum,
		nextSettlementDate: null,
		currency: wallet.currency,
		totalInflows: balanceNum,
		grossInflows: balanceNum,
		organizerShare: balanceNum,
		platformFees: 0,
		totalPayouts: 0,
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
	const completedDebitsTotal = Math.round(
		existingDebits.reduce((s, d) => s + Number(d.amount || 0), 0) * 100
	) / 100;

	const pendingDebitsAgg = await prisma.transaction.aggregate({
		where: {
			walletId: wallet.id,
			type: "debit",
			status: { in: ["pending", "processing"] },
		},
		_sum: { amount: true },
	});
	const activePendingDebits = Math.round(Number(pendingDebitsAgg._sum.amount || 0) * 100) / 100;

	const availableCleared = Math.round(
		Math.max(0, clearedSum - completedDebitsTotal - activePendingDebits) * 100
	) / 100;

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

	// 2. Create payout in "pending_approval" state — Paystack transfer will be initiated
	//    by the super admin when they approve the payout from the admin dashboard.
	const ref = `WDR-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
	const now = new Date();

	const result = await prisma.$transaction(async (tx) => {
		// 1. Create payout request awaiting admin approval
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
				feeAmount: 0,
				currency: wallet.currency,
				status: "pending",
				requiresApproval: true,
				provider: "paystack",
				description: data.description ?? "Wallet withdrawal via Paystack",
			},
		});

		// 2. Freeze funds by incrementing pendingDebits
		await tx.wallet.update({
			where: { id: wallet.id },
			data: {
				pendingDebits: { increment: withdrawalAmount },
				lastTransactionAt: now,
			},
		});

		// 3. Log audit transaction as pending
		await tx.transaction.create({
			data: {
				reference: ref,
				walletId: wallet.id,
				type: "debit",
				category: "wallet_withdrawal",
				status: "pending",
				amount: withdrawalAmount,
				feeAmount: 0,
				currency: wallet.currency,
				description: data.description?.trim() || `Withdrawal to ${data.accountNumber} (pending approval)`,
				balanceBefore: Number(wallet.balance),
				balanceAfter: Number(wallet.balance),
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
					description: `Withdrawal of ${wallet.currency} ${withdrawalAmount.toFixed(2)} requested to ${data.bankName ? data.bankName + " " : ""}${data.accountNumber} (${data.accountName}) — awaiting admin approval`,
					metadata: {
						reference: ref,
						amount: withdrawalAmount,
						currency: wallet.currency,
					},
				},
			});
		} catch (auditErr) {
			console.warn("[ACTIVITY-LOG-WARN]", auditErr);
		}

		return payout;
	});

	revalidatePath("/organization/wallet");
	return serializeJsonSafe({
		...result,
		requiresOtp: false,
		message: "Withdrawal request submitted successfully! Your payout is pending admin approval.",
	});
}

/**
 * Finalizes a pending Paystack payout using the OTP provided by the user
 */
export async function finalizeWalletWithdrawal({
	data,
}: {
	data: {
		organizationId: string;
		payoutId: string;
		transferCode: string;
		otp: string;
	};
}): Promise<{ success: boolean; message: string; payout?: any }> {
	const session = await requireSession();
	await requireOrgRole(data.organizationId, ["owner", "admin"]);

	const payout = await prisma.payout.findUnique({
		where: { id: data.payoutId },
		include: { wallet: true },
	});

	if (!payout) {
		throw new Error("Payout record not found.");
	}

	if (payout.status === "completed") {
		return { success: true, message: "This payout has already been finalized and completed." };
	}

	const transferCode = data.transferCode || payout.providerReference;
	if (!transferCode) {
		throw new Error("No Paystack transfer code associated with this payout.");
	}

	const finalizeRes = await finalizePaystackTransfer({
		transferCode,
		otp: data.otp,
	});

	if (!finalizeRes.success) {
		return {
			success: false,
			message: finalizeRes.message || "Failed to authorize transfer with provided OTP.",
		};
	}

	// Transfer authorized on Paystack. Fulfill in our database.
	await fulfillPayoutTransfer({
		reference: payout.reference,
		status: "completed",
		paystackData: finalizeRes.raw,
	});

	try {
		await prisma.activityLog.create({
			data: {
				organizationId: data.organizationId,
				userId: session.userId,
				action: "wallet_withdrawal_finalized",
				entityType: "payout",
				entityId: payout.id,
				description: `Authorized payout of ${payout.currency} ${Number(payout.amount).toFixed(2)} with Paystack OTP`,
				metadata: {
					reference: payout.reference,
					transferCode,
					status: finalizeRes.status,
				},
			},
		});
	} catch (logErr) {
		console.warn("[ACTIVITY-LOG-WARN]", logErr);
	}

	revalidatePath("/organization/wallet");
	return {
		success: true,
		message: finalizeRes.message || "Payout authorized and processed successfully!",
	};
}

/**
 * Resends the Paystack Transfer OTP
 */
export async function resendWithdrawalOtp({
	data,
}: {
	data: {
		organizationId: string;
		transferCode: string;
	};
}): Promise<{ success: boolean; message: string }> {
	await requireOrgRole(data.organizationId, ["owner", "admin"]);
	const res = await resendPaystackTransferOtp({ transferCode: data.transferCode });
	return {
		success: res.success,
		message: res.message || (res.success ? "OTP resent successfully." : "Failed to resend OTP."),
	};
}

/**
 * Cancels an unfinalized payout (e.g. expired OTP), immediately unlocking and restoring funds to the wallet
 */
export async function cancelWalletWithdrawal({
	data,
}: {
	data: {
		organizationId: string;
		payoutId: string;
	};
}): Promise<{ success: boolean; message: string }> {
	const session = await requireSession();
	await requireOrgRole(data.organizationId, ["owner", "admin"]);

	const payout = await prisma.payout.findUnique({
		where: { id: data.payoutId },
		include: { wallet: true },
	});

	if (!payout) {
		throw new Error("Payout record not found.");
	}

	if (payout.status === "completed") {
		throw new Error("Cannot cancel a payout that has already been completed.");
	}

	await fulfillPayoutTransfer({
		reference: payout.reference,
		status: "failed",
		paystackData: {
			cancelledByUser: true,
			cancelledByUserId: session.userId,
			cancelledAt: new Date().toISOString(),
			reason: "Payout cancelled by organizer before OTP finalization.",
		},
	});

	try {
		await prisma.activityLog.create({
			data: {
				organizationId: data.organizationId,
				userId: session.userId,
				action: "wallet_withdrawal_cancelled",
				entityType: "payout",
				entityId: payout.id,
				description: `Cancelled pending withdrawal of ${payout.currency} ${Number(payout.amount).toFixed(2)}. Funds restored to balance.`,
				metadata: {
					reference: payout.reference,
					amount: Number(payout.amount),
				},
			},
		});
	} catch (logErr) {
		console.warn("[ACTIVITY-LOG-WARN]", logErr);
	}

	revalidatePath("/organization/wallet");
	return {
		success: true,
		message: "Payout request cancelled. Funds have been returned to your available balance.",
	};
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
			revalidatePath("/organization/wallet");
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
		revalidatePath("/organization/wallet");
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
		revalidatePath("/organization/wallet");
		return {
			success: true,
			message: `Payout marked as ${mappedStatus} (Paystack status: ${psStatus}).`,
			status: mappedStatus,
		};
	}

	return { success: true, message: `Payout is currently ${psStatus} on Paystack.`, status: psStatus };
}


