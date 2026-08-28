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

	return serializeJsonSafe({
		id: wallet.id,
		organizationId: wallet.organizationId,
		balance: Number(wallet.balance),
		currency: wallet.currency,
		pendingCredits: Number(wallet.pendingCredits),
		pendingDebits: Number(wallet.pendingDebits),
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
	data: any;
}): Promise<any> {
	// Restrict withdrawal to organization owner
	await requireOrgRole(data.organizationId, ["owner"]);

	const wallet = await prisma.wallet.findFirst({
		where: { organizationId: data.organizationId, isActive: true },
	});

	if (!wallet) throw new Error("No active wallet found.");
	if (wallet.isLocked)
		throw new Error(
			"Wallet is locked: " + (wallet.lockReason ?? "Contact support"),
		);

	const available = Number(wallet.balance) - Number(wallet.pendingDebits);
	const amount = Number(data.amount);

	if (amount <= 0) throw new Error("Withdrawal amount must be greater than 0.");
	if (amount > available) {
		throw new Error(
			`Insufficient balance. Available: ${wallet.currency} ${available.toFixed(2)}`,
		);
	}

	const org = await prisma.organization.findUnique({
		where: { id: data.organizationId },
		select: {
			paystackAccountName: true,
			paystackAccountNumber: true,
			paystackBankCode: true,
			subaccountCode: true,
		},
	});

	if (!org?.paystackAccountNumber || !org.paystackBankCode) {
		throw new Error(
			"No payout account configured. Please set up your payout details first.",
		);
	}

	const reference = `WD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

	await prisma.$transaction(async (tx) => {
		// 1. Create payout record
		await tx.payout.create({
			data: {
				reference,
				walletId: wallet.id,
				recipientName: org.paystackAccountName ?? "Account Holder",
				bankCode: org.paystackBankCode,
				accountNumber: org.paystackAccountNumber,
				accountName: org.paystackAccountName,
				amount,
				currency: wallet.currency,
				status: "pending",
				description: data.description ?? "Wallet withdrawal request",
			},
		});

		// 2. Increase pending debits on wallet
		await tx.wallet.update({
			where: { id: wallet.id },
			data: {
				pendingDebits: { increment: amount },
				lastTransactionAt: new Date(),
			},
		});

		// 3. Log pending debit transaction
		await tx.transaction.create({
			data: {
				reference: `TXN-${reference}`,
				walletId: wallet.id,
				type: "debit",
				category: "wallet_withdrawal",
				status: "pending",
				amount,
				currency: wallet.currency,
				description: data.description ?? "Wallet withdrawal request",
				balanceBefore: Number(wallet.balance),
				balanceAfter: Number(wallet.balance),
			},
		});
	});

	revalidatePath("/organization/wallet");
	return serializeJsonSafe({
		success: true,
		reference,
		message: "Withdrawal request submitted. It will be processed shortly.",
	});
}
