"use server";

import { prisma } from "@repo/db";
import { revalidatePath } from "next/cache";
import { requireSession } from "../session";
import { serializeJsonSafe } from "../utils";
import { requireOrgRole } from "./auth-helpers";
import { isTPlusOneSettled, getSettlementDate, getNextUpcomingSettlementDate } from "@/lib/utils/settlement";
import { getEventLifecycleStatus } from "@/lib/event-status";
import {
	verifyPaystackTransfer,
	finalizePaystackTransfer,
	resendPaystackTransferOtp,
	fetchPaystackSettlements,
	fetchPaystackTransfers,
} from "./paystack";
import { fulfillPayoutTransfer } from "./fulfillment";
import { WITHDRAWAL_CONFIG } from "@repo/pricing";

/**
 * Loads dynamic withdrawal rules configured by Super Admin from DB (falls back to defaults)
 */
export async function getDynamicWithdrawalRules() {
	try {
		const setting = await prisma.platformSetting.findUnique({
			where: { key: "wallet_withdrawal_rules" },
		});
		if (setting?.value && typeof setting.value === "object") {
			const v = setting.value as any;
			return {
				minAmount: typeof v.minAmount === "number" && v.minAmount > 0 ? Number(v.minAmount) : WITHDRAWAL_CONFIG.minAmount,
				transferFee: typeof v.transferFee === "number" && v.transferFee >= 0 ? Number(v.transferFee) : WITHDRAWAL_CONFIG.transferFee,
				freePerWeek: typeof v.freePerWeek === "number" && v.freePerWeek >= 0 ? Number(v.freePerWeek) : WITHDRAWAL_CONFIG.freePerWeek,
				minEventAgeDays: typeof v.minEventAgeDays === "number" && v.minEventAgeDays >= 0 ? Number(v.minEventAgeDays) : WITHDRAWAL_CONFIG.minEventAgeDays,
				residualAutoPayoutDays: typeof v.residualAutoPayoutDays === "number" && v.residualAutoPayoutDays >= 0 ? Number(v.residualAutoPayoutDays) : WITHDRAWAL_CONFIG.residualAutoPayoutDays,
			};
		}
	} catch (e) {
		console.warn("[WITHDRAWAL-RULES-FETCH-WARN]", e);
	}
	return {
		minAmount: WITHDRAWAL_CONFIG.minAmount,
		transferFee: WITHDRAWAL_CONFIG.transferFee,
		freePerWeek: WITHDRAWAL_CONFIG.freePerWeek,
		minEventAgeDays: WITHDRAWAL_CONFIG.minEventAgeDays,
		residualAutoPayoutDays: WITHDRAWAL_CONFIG.residualAutoPayoutDays,
	};
}


export async function getOrgWallet({
	data,
}: {
	data: { organizationId: string };
}): Promise<any> {
	await requireOrgRole(data.organizationId, ["owner", "admin", "member"]);

	const withdrawalRules = await getDynamicWithdrawalRules();

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
			select: { id: true, title: true, slug: true, status: true, startDate: true, endDate: true },
		});
		const eventIds = orgEvents.map((e) => e.id);
		const eventIdSet = new Set(eventIds);
		const orgEventsMap = new Map(orgEvents.map((e) => [e.id, e]));

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
					const evId = meta.eventId || meta.event_id || p.ticketOrders?.[0]?.eventId || p.votes?.[0]?.eventId;
					const ev = evId && orgEventsMap.has(evId) ? orgEventsMap.get(evId) : null;
					const eventPrefix = ev ? `${ev.title} • ` : "";

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
							description: `${eventPrefix}${cleanLabel} Revenue (${p.reference}) - Net: GHS ${organizerReceives.toFixed(2)}, Platform Fee: GHS ${platformFee.toFixed(2)}`,
							notes: ev ? `Event: ${ev.title} (${ev.id})` : undefined,
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
				select: {
					type: true,
					amount: true,
					feeAmount: true,
					completedAt: true,
					createdAt: true,
					notes: true,
					description: true,
					payment: {
						select: {
							metadata: true,
							ticketOrders: { select: { eventId: true }, take: 1 },
							votes: { select: { eventId: true }, take: 1 },
						},
					},
				},
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

			// Per-Event Inflows Calculation
			const eventInflowMap = new Map<
				string,
				{ totalInflow: number; grossInflow: number; transactionCount: number; lastInflowAt: Date | null }
			>();

			for (const ev of orgEvents) {
				eventInflowMap.set(ev.id, {
					totalInflow: 0,
					grossInflow: 0,
					transactionCount: 0,
					lastInflowAt: null,
				});
			}

			for (const t of completedTxns.filter((t) => t.type === "credit")) {
				let evId = t.payment?.ticketOrders?.[0]?.eventId || t.payment?.votes?.[0]?.eventId;
				if (!evId && t.payment?.metadata) {
					const m = t.payment.metadata as any;
					evId = m?.eventId || m?.event_id;
				}
				if (!evId && t.notes) {
					for (const ev of orgEvents) {
						if (t.notes.includes(ev.id) || t.notes.includes(ev.title)) {
							evId = ev.id;
							break;
						}
					}
				}
				if (!evId && t.description) {
					for (const ev of orgEvents) {
						if (t.description.includes(ev.title)) {
							evId = ev.id;
							break;
						}
					}
				}
				if (evId && eventInflowMap.has(evId)) {
					const stat = eventInflowMap.get(evId)!;
					const amt = Number(t.amount || 0);
					const fee = Number(t.feeAmount || 0);
					const txDate = t.completedAt || t.createdAt || new Date();
					stat.totalInflow = Math.round((stat.totalInflow + amt) * 100) / 100;
					stat.grossInflow = Math.round((stat.grossInflow + amt + fee) * 100) / 100;
					stat.transactionCount += 1;
					if (!stat.lastInflowAt || txDate > stat.lastInflowAt) {
						stat.lastInflowAt = txDate;
					}
				}
			}

			const eventInflows = orgEvents.map((ev) => {
				const stat = eventInflowMap.get(ev.id) || { totalInflow: 0, grossInflow: 0, transactionCount: 0, lastInflowAt: null };
				const lifecycle = getEventLifecycleStatus(ev);
				return {
					id: ev.id,
					title: ev.title,
					slug: ev.slug,
					status: ev.status,
					lifecycleStatus: lifecycle,
					isOngoing: lifecycle === "ongoing",
					startDate: ev.startDate ? ev.startDate.toISOString() : null,
					endDate: ev.endDate ? ev.endDate.toISOString() : null,
					totalInflow: stat.totalInflow,
					grossInflow: stat.grossInflow,
					transactionCount: stat.transactionCount,
					lastInflowAt: stat.lastInflowAt ? stat.lastInflowAt.toISOString() : null,
				};
			});

			eventInflows.sort((a, b) => {
				if (a.isOngoing && !b.isOngoing) return -1;
				if (!a.isOngoing && b.isOngoing) return 1;
				return b.totalInflow - a.totalInflow;
			});

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

			// Count withdrawals initiated in the last 7 days to evaluate weekly free allowance
			const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
			const recentPayoutsCount = await prisma.payout.count({
				where: {
					walletId: wallet.id,
					status: { in: ["pending", "processing", "completed"] },
					createdAt: { gte: sevenDaysAgo },
				},
			});
			const isNextWithdrawalFree = recentPayoutsCount < withdrawalRules.freePerWeek;

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
				minWithdrawalAmount: withdrawalRules.minAmount,
				transferFee: withdrawalRules.transferFee,
				freeWithdrawalsPerWeek: withdrawalRules.freePerWeek,
				minEventAgeDays: withdrawalRules.minEventAgeDays,
				residualAutoPayoutDays: withdrawalRules.residualAutoPayoutDays,
				recentWeeklyPayoutsCount: recentPayoutsCount,
				isNextWithdrawalFree,
				eventInflows,
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
		minWithdrawalAmount: withdrawalRules.minAmount,
		transferFee: withdrawalRules.transferFee,
		freeWithdrawalsPerWeek: withdrawalRules.freePerWeek,
		minEventAgeDays: withdrawalRules.minEventAgeDays,
		residualAutoPayoutDays: withdrawalRules.residualAutoPayoutDays,
		recentWeeklyPayoutsCount: 0,
		isNextWithdrawalFree: true,
		eventInflows: [],
	});
}

export async function getOrgTransactions({
	data,
}: {
	data: { organizationId: string; page?: number; limit?: number; eventId?: string };
}): Promise<{ items: any[]; total: number }> {
	await requireOrgRole(data.organizationId, ["owner", "admin", "member"]);

	const wallet = await prisma.wallet.findFirst({
		where: { organizationId: data.organizationId },
		select: { id: true },
	});

	if (!wallet) return { items: [], total: 0 };

	const orgEvents = await prisma.event.findMany({
		where: { organizationId: data.organizationId },
		select: { id: true, title: true, slug: true, status: true, startDate: true, endDate: true },
	});
	const orgEventsMap = new Map(orgEvents.map((e) => [e.id, e]));

	const page = data.page || 1;
	const limit = data.limit || 50;
	const skip = (page - 1) * limit;

	const [items, total] = await Promise.all([
		prisma.transaction.findMany({
			where: { walletId: wallet.id },
			include: {
				payment: {
					select: {
						id: true,
						purpose: true,
						metadata: true,
						ticketOrders: {
							select: {
								eventId: true,
								event: {
									select: {
										id: true,
										title: true,
										slug: true,
										status: true,
										startDate: true,
										endDate: true,
									},
								},
							},
							take: 1,
						},
						votes: {
							select: {
								eventId: true,
								event: {
									select: {
										id: true,
										title: true,
										slug: true,
										status: true,
										startDate: true,
										endDate: true,
									},
								},
							},
							take: 1,
						},
					},
				},
			},
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
		}),
		prisma.transaction.count({
			where: { walletId: wallet.id },
		}),
	]);

	const enrichedItems = items.map((t) => {
		let event = t.payment?.ticketOrders?.[0]?.event || t.payment?.votes?.[0]?.event || null;
		if (!event && t.payment?.metadata) {
			const meta = t.payment.metadata as any;
			const metaEventId = meta?.eventId || meta?.event_id;
			if (metaEventId && orgEventsMap.has(metaEventId)) {
				event = orgEventsMap.get(metaEventId)!;
			}
		}
		if (!event && t.notes) {
			for (const ev of orgEvents) {
				if (t.notes.includes(ev.id) || t.notes.includes(ev.title)) {
					event = ev;
					break;
				}
			}
		}
		if (!event && t.description) {
			for (const ev of orgEvents) {
				if (t.description.includes(ev.title)) {
					event = ev;
					break;
				}
			}
		}

		let isOngoing = false;
		let lifecycleStatus = "upcoming";
		if (event) {
			lifecycleStatus = getEventLifecycleStatus(event);
			isOngoing = lifecycleStatus === "ongoing";
		}

		return {
			...t,
			eventId: event?.id ?? null,
			event: event
				? {
						id: event.id,
						title: event.title,
						slug: event.slug,
						status: event.status,
						lifecycleStatus,
						isOngoing,
				  }
				: null,
		};
	});

	const finalItems =
		data.eventId && data.eventId !== "all"
			? enrichedItems.filter((t) => t.eventId === data.eventId)
			: enrichedItems;

	return { items: serializeJsonSafe(finalItems), total };
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
		eventId?: string;
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

	const withdrawalRules = await getDynamicWithdrawalRules();

	const withdrawalAmount = Number(data.amount);
	if (withdrawalAmount <= 0) throw new Error("Invalid withdrawal amount.");
	if (withdrawalAmount < withdrawalRules.minAmount) {
		throw new Error(
			`Minimum withdrawal amount is ${wallet.currency} ${withdrawalRules.minAmount.toFixed(2)}.`,
		);
	}

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

	// 2. Evaluate weekly fee policy (Option B: 1 Free per 7 days, then GHS 1.00 fee)
	const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
	const recentPayoutsCount = await prisma.payout.count({
		where: {
			walletId: wallet.id,
			status: { in: ["pending", "processing", "completed"] },
			createdAt: { gte: sevenDaysAgo },
		},
	});

	const isFree = recentPayoutsCount < withdrawalRules.freePerWeek;
	const feeAmount = isFree ? 0 : withdrawalRules.transferFee;
	const netDisbursed = Math.max(0, Math.round((withdrawalAmount - feeAmount) * 100) / 100);

	// 3. Create payout in "pending_approval" state — Paystack transfer will be initiated
	//    by the super admin when they approve the payout from the admin dashboard.
	const ref = `WDR-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
	const result = await prisma.$transaction(async (tx) => {
		// 1. Concurrency control: Lock the wallet row to prevent race conditions & double-spending
		const lockedWallets = await tx.$queryRawUnsafe<any[]>(
			`SELECT id, balance, "pending_debits", "is_locked", "lock_reason" FROM wallets WHERE id = $1::uuid FOR UPDATE`,
			wallet.id,
		);
		const lockedWallet = lockedWallets?.[0];
		if (!lockedWallet) throw new Error("Wallet not found.");
		if (lockedWallet.is_locked) {
			throw new Error("Wallet is locked: " + (lockedWallet.lock_reason ?? "Contact support"));
		}

		// 2. Atomically calculate available cleared balance inside the isolated transaction
		const completedCredits = await tx.transaction.findMany({
			where: { walletId: wallet.id, status: "completed", type: "credit" },
			select: { amount: true, completedAt: true, createdAt: true },
		});

		let txClearedSum = 0;
		for (const c of completedCredits) {
			const dt = c.completedAt || c.createdAt || new Date();
			if (isTPlusOneSettled(dt)) {
				txClearedSum += Number(c.amount || 0);
			}
		}

		const existingDebits = await tx.transaction.findMany({
			where: { walletId: wallet.id, type: "debit", status: "completed" },
			select: { amount: true },
		});
		const txCompletedDebitsTotal = Math.round(
			existingDebits.reduce((s, d) => s + Number(d.amount || 0), 0) * 100
		) / 100;

		const pendingDebitsAgg = await tx.transaction.aggregate({
			where: {
				walletId: wallet.id,
				type: "debit",
				status: { in: ["pending", "processing"] },
			},
			_sum: { amount: true },
		});
		const txActivePendingDebits = Math.round(Number(pendingDebitsAgg._sum.amount || 0) * 100) / 100;

		const txAvailableCleared = Math.round(
			Math.max(0, txClearedSum - txCompletedDebitsTotal - txActivePendingDebits) * 100
		) / 100;

		if (withdrawalAmount > txAvailableCleared) {
			throw new Error(
				`Insufficient cleared balance for withdrawal. Available: ${wallet.currency} ${txAvailableCleared.toFixed(2)}, Requested: ${wallet.currency} ${withdrawalAmount.toFixed(2)}.`,
			);
		}

		const now = new Date();

		let event: { id: string; title: string; slug: string } | null = null;
		if (data.eventId && data.eventId !== "all") {
			event = await tx.event.findFirst({
				where: { id: data.eventId, organizationId: data.organizationId },
				select: { id: true, title: true, slug: true },
			});
		}

		// Enforce configurable holding period (cooling period) before the first withdrawal
		if (withdrawalRules.minEventAgeDays > 0) {
			if (event) {
				const priorPayoutForEvent = await tx.payout.findFirst({
					where: {
						walletId: wallet.id,
						status: { in: ["pending", "processing", "completed"] },
						notes: { contains: event.id },
					},
				});

				if (!priorPayoutForEvent) {
					const firstEventCredit = await tx.transaction.findFirst({
						where: {
							walletId: wallet.id,
							status: "completed",
							type: "credit",
							notes: { contains: event.id },
						},
						orderBy: { completedAt: "asc" },
					});

					if (firstEventCredit) {
						const firstTxDate = firstEventCredit.completedAt || firstEventCredit.createdAt || new Date();
						const diffDays = Math.floor((now.getTime() - firstTxDate.getTime()) / (24 * 60 * 60 * 1000));
						if (diffDays < withdrawalRules.minEventAgeDays) {
							const daysRemaining = withdrawalRules.minEventAgeDays - diffDays;
							const eligibleDate = new Date(firstTxDate.getTime() + withdrawalRules.minEventAgeDays * 24 * 60 * 60 * 1000);
							throw new Error(
								`Holding period active: Platform payout policy requires at least ${withdrawalRules.minEventAgeDays} days from the first event transaction before your initial withdrawal for "${event.title}". You will be eligible in ${daysRemaining} day${daysRemaining > 1 ? "s" : ""} (on ${eligibleDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}). Please review the Payout Policy.`
							);
						}
					}
				}
			} else {
				const priorAnyPayout = await tx.payout.findFirst({
					where: {
						walletId: wallet.id,
						status: { in: ["pending", "processing", "completed"] },
					},
				});

				if (!priorAnyPayout) {
					const firstCredit = await tx.transaction.findFirst({
						where: { walletId: wallet.id, status: "completed", type: "credit" },
						orderBy: { completedAt: "asc" },
					});

					if (firstCredit) {
						const firstTxDate = firstCredit.completedAt || firstCredit.createdAt || new Date();
						const diffDays = Math.floor((now.getTime() - firstTxDate.getTime()) / (24 * 60 * 60 * 1000));
						if (diffDays < withdrawalRules.minEventAgeDays) {
							const daysRemaining = withdrawalRules.minEventAgeDays - diffDays;
							const eligibleDate = new Date(firstTxDate.getTime() + withdrawalRules.minEventAgeDays * 24 * 60 * 60 * 1000);
							throw new Error(
								`Holding period active: Platform payout policy requires at least ${withdrawalRules.minEventAgeDays} days from your first revenue transaction before your initial withdrawal. You will be eligible in ${daysRemaining} day${daysRemaining > 1 ? "s" : ""} (on ${eligibleDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}). Please review the Payout Policy.`
							);
						}
					}
				}
			}
		}

		const eventPrefix = event ? `${event.title} • ` : "";
		const defaultPayoutDesc = event
			? `${event.title} - Wallet withdrawal${isFree ? " (Free weekly payout)" : ` (${wallet.currency} ${feeAmount.toFixed(2)} transfer fee)`}`
			: isFree
				? "Wallet withdrawal (Free weekly payout)"
				: `Wallet withdrawal (${wallet.currency} ${feeAmount.toFixed(2)} transfer fee)`;

		// 3. Create payout request awaiting admin approval
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
				feeAmount: feeAmount,
				currency: wallet.currency,
				status: "pending",
				requiresApproval: true,
				provider: "paystack",
				description: data.description?.trim()
					? (event ? `${eventPrefix}${data.description.trim()}` : data.description.trim())
					: defaultPayoutDesc,
				notes: event ? `Event: ${event.title} (${event.id})` : undefined,
				providerResponse: event ? { eventId: event.id, eventTitle: event.title, eventSlug: event.slug } : undefined,
			},
		});

		// 2. Freeze funds by incrementing pendingDebits with the total requested amount
		await tx.wallet.update({
			where: { id: wallet.id },
			data: {
				pendingDebits: { increment: withdrawalAmount },
				lastTransactionAt: now,
			},
		});

		// 3. Log audit transaction as pending
		const defaultTxnDesc = event
			? `${event.title} • Withdrawal to ${data.accountNumber} (${isFree ? "Free weekly payout" : `Net: ${wallet.currency} ${netDisbursed.toFixed(2)}, Fee: ${wallet.currency} ${feeAmount.toFixed(2)}`})`
			: isFree
				? `Withdrawal to ${data.accountNumber} (Free weekly payout, pending approval)`
				: `Withdrawal to ${data.accountNumber} (Net: ${wallet.currency} ${netDisbursed.toFixed(2)}, Fee: ${wallet.currency} ${feeAmount.toFixed(2)}, pending approval)`;

		await tx.transaction.create({
			data: {
				reference: ref,
				walletId: wallet.id,
				type: "debit",
				category: "wallet_withdrawal",
				status: "pending",
				amount: withdrawalAmount,
				feeAmount: feeAmount,
				currency: wallet.currency,
				description: data.description?.trim()
					? (event ? `${eventPrefix}${data.description.trim()}` : data.description.trim())
					: defaultTxnDesc,
				notes: event ? `Event: ${event.title} (${event.id})` : undefined,
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
					description: `Withdrawal of ${wallet.currency} ${withdrawalAmount.toFixed(2)} requested${event ? ` for event "${event.title}"` : ""} to ${data.bankName ? data.bankName + " " : ""}${data.accountNumber} (${data.accountName})${feeAmount > 0 ? ` [Fee: ${wallet.currency} ${feeAmount.toFixed(2)}, Net: ${wallet.currency} ${netDisbursed.toFixed(2)}]` : " [Free weekly payout]"} — awaiting admin approval`,
					metadata: {
						reference: ref,
						amount: withdrawalAmount,
						feeAmount,
						netDisbursed,
						currency: wallet.currency,
						isFree,
						eventId: event?.id,
						eventTitle: event?.title,
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

	const orgEvents = await prisma.event.findMany({
		where: { organizationId: data.organizationId },
		select: { id: true, title: true, slug: true },
	});

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

	const enrichedItems = items.map((p) => {
		let event: { id: string; title: string; slug?: string } | null = null;
		const resp = p.providerResponse as any;
		if (resp?.eventId) {
			const found = orgEvents.find((e) => e.id === resp.eventId);
			event = found
				? { id: found.id, title: found.title, slug: found.slug }
				: { id: resp.eventId, title: resp.eventTitle || "Event" };
		} else if (p.notes) {
			for (const ev of orgEvents) {
				if (p.notes.includes(ev.id) || p.notes.includes(ev.title)) {
					event = { id: ev.id, title: ev.title, slug: ev.slug };
					break;
				}
			}
		} else if (p.description) {
			for (const ev of orgEvents) {
				if (p.description.includes(ev.title)) {
					event = { id: ev.id, title: ev.title, slug: ev.slug };
					break;
				}
			}
		}

		return {
			...p,
			eventId: event?.id ?? null,
			event,
		};
	});

	return { items: serializeJsonSafe(enrichedItems), total };
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

/**
 * Automatically sweeps residual balances below the minimum withdrawal threshold
 * for organizations whose events have ended more than `residualAutoPayoutDays` ago.
 * Can be invoked via automated cron or manually by Super Admin.
 */
export async function processResidualAutoPayouts(): Promise<{
	success: boolean;
	processedCount: number;
	payouts: Array<{ organizationId: string; amount: number; reference: string; orgName?: string }>;
	message: string;
}> {
	try {
		const rules = await getDynamicWithdrawalRules();
		const now = new Date();
		const residualThresholdDate = new Date(now.getTime() - rules.residualAutoPayoutDays * 24 * 60 * 60 * 1000);

		// Find ended events that ended on or before the residual threshold date
		const endedEvents = await prisma.event.findMany({
			where: {
				OR: [
					{ status: "ended" },
					{ endDate: { lte: residualThresholdDate } },
				],
			},
			select: {
				id: true,
				title: true,
				organizationId: true,
				status: true,
				endDate: true,
			},
		});

		if (endedEvents.length === 0) {
			return {
				success: true,
				processedCount: 0,
				payouts: [],
				message: `No eligible ended events found older than ${rules.residualAutoPayoutDays} days.`,
			};
		}

		const orgIds = Array.from(new Set(endedEvents.map((e) => e.organizationId)));
		const processedPayouts: Array<{ organizationId: string; amount: number; reference: string; orgName?: string }> = [];

		for (const orgId of orgIds) {
			// Check if this org has any active/ongoing events that are still selling
			const activeEvent = await prisma.event.findFirst({
				where: {
					organizationId: orgId,
					status: { in: ["published", "draft"] },
					OR: [
						{ endDate: null },
						{ endDate: { gt: residualThresholdDate } },
					],
				},
			});

			if (activeEvent) continue;

			// Fetch organization details and payout account
			const org = await prisma.organization.findUnique({
				where: { id: orgId },
				select: {
					id: true,
					name: true,
					paystackBankCode: true,
					paystackAccountNumber: true,
					paystackAccountName: true,
				},
			});

			if (!org || !org.paystackBankCode || !org.paystackAccountNumber) {
				continue;
			}

			const wallet = await prisma.wallet.findFirst({
				where: { organizationId: orgId },
			});

			if (!wallet || wallet.isLocked) continue;

			// Check if there is already a pending or processing payout
			const activePayout = await prisma.payout.findFirst({
				where: {
					walletId: wallet.id,
					status: { in: ["pending", "processing"] },
				},
			});

			if (activePayout) continue;

			// Calculate available cleared balance
			const completedCredits = await prisma.transaction.findMany({
				where: { walletId: wallet.id, status: "completed", type: "credit" },
				select: { amount: true, completedAt: true, createdAt: true },
			});

			let clearedSum = 0;
			for (const c of completedCredits) {
				const dt = c.completedAt || c.createdAt || new Date();
				if (isTPlusOneSettled(dt)) {
					clearedSum += Number(c.amount || 0);
				}
			}

			const completedDebits = await prisma.transaction.findMany({
				where: { walletId: wallet.id, type: "debit", status: "completed" },
				select: { amount: true },
			});
			const completedDebitsSum = Math.round(
				completedDebits.reduce((s, d) => s + Number(d.amount || 0), 0) * 100
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
				Math.max(0, clearedSum - completedDebitsSum - activePendingDebits) * 100
			) / 100;

			// Residual condition: Balance must be > 0 AND strictly below minAmount
			if (availableCleared > 0 && availableCleared < rules.minAmount) {
				const ref = `RES-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

				await prisma.$transaction(async (tx) => {
					await tx.payout.create({
						data: {
							reference: ref,
							walletId: wallet.id,
							recipientName: org.paystackAccountName || org.name,
							bankCode: org.paystackBankCode!,
							bankName: "",
							accountNumber: org.paystackAccountNumber!,
							accountName: org.paystackAccountName || org.name,
							amount: availableCleared,
							feeAmount: 0,
							currency: wallet.currency,
							status: "pending",
							requiresApproval: true,
							provider: "paystack",
							description: `Residual balance settlement (Below threshold auto-clearance, ${rules.residualAutoPayoutDays} days post-event)`,
							notes: `Auto residual payout: GHS ${availableCleared.toFixed(2)} disbursed under post-event residual policy (minAmount: GHS ${rules.minAmount.toFixed(2)}).`,
							providerResponse: { isResidualAutoPayout: true, residualAutoPayoutDays: rules.residualAutoPayoutDays },
						},
					});

					await tx.wallet.update({
						where: { id: wallet.id },
						data: {
							pendingDebits: { increment: availableCleared },
							lastTransactionAt: now,
						},
					});

					await tx.transaction.create({
						data: {
							reference: ref,
							walletId: wallet.id,
							type: "debit",
							category: "wallet_withdrawal",
							status: "pending",
							amount: availableCleared,
							feeAmount: 0,
							currency: wallet.currency,
							description: `Residual balance auto-payout to ${org.paystackAccountNumber} (Transfer fee waived)`,
							notes: `Post-event residual clearance`,
							balanceBefore: Number(wallet.balance),
							balanceAfter: Number(wallet.balance),
						},
					});
				});

				processedPayouts.push({
					organizationId: orgId,
					orgName: org.name,
					amount: availableCleared,
					reference: ref,
				});
			}
		}

		return {
			success: true,
			processedCount: processedPayouts.length,
			payouts: processedPayouts,
			message: `Processed ${processedPayouts.length} residual auto-payout(s).`,
		};
	} catch (err: any) {
		console.error("[PROCESS_RESIDUAL_AUTO_PAYOUTS_ERROR]", err);
		return {
			success: false,
			processedCount: 0,
			payouts: [],
			message: err?.message || "Failed to process residual auto-payouts.",
		};
	}
}


