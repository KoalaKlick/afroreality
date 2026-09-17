"use server";

import { prisma } from "@repo/db";
import { requireSession } from "../session";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

export interface PaystackBank {
	id?: number;
	name: string;
	slug?: string;
	code: string;
	longcode?: string;
	gateway?: string | null;
	pay_with_bank?: boolean;
	active?: boolean;
	is_deleted?: boolean;
	country?: string;
	currency?: string;
	type?: string;
}

export interface FetchPaystackBanksResult {
	name: string;
	code: string;
	banks: Array<{ name: string; code: string }>;
	momo: Array<{ name: string; code: string }>;
}

const FALLBACK_BANKS = [
	{ name: "Access Bank", code: "gh01" },
	{ name: "Absa Bank Ghana", code: "gh02" },
	{ name: "CalBank", code: "gh03" },
	{ name: "Ecobank Ghana", code: "gh04" },
	{ name: "FBNBank Ghana", code: "gh05" },
	{ name: "GCB Bank", code: "gh06" },
	{ name: "Stanbic Bank Ghana", code: "gh07" },
	{ name: "Standard Chartered Bank", code: "gh08" },
	{ name: "Zenith Bank Ghana", code: "gh09" },
	{ name: "Fidelity Bank Ghana", code: "gh10" },
];

const FALLBACK_MOMO = [
	{ name: "MTN Mobile Money", code: "MTN" },
	{ name: "Vodafone / Telecel Cash", code: "VOD" },
	{ name: "AirtelTigo Money", code: "ATL" },
];

export async function fetchPaystackBanks({
	data,
}: {
	data?: { country?: string; currency?: string };
} = {}): Promise<FetchPaystackBanksResult> {
	const currency = data?.currency || "GHS";
	const country = data?.country || "GH";

	if (!PAYSTACK_SECRET) {
		return {
			name: "Banks & Mobile Money",
			code: "ALL",
			banks: FALLBACK_BANKS,
			momo: FALLBACK_MOMO,
		};
	}

	try {
		const banksUrl = `https://api.paystack.co/bank?currency=${encodeURIComponent(currency)}&country=${encodeURIComponent(country)}`;
		const response = await fetch(banksUrl, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${PAYSTACK_SECRET}`,
			},
			next: { revalidate: 3600 },
		});

		const result = await response.json();

		if (result.status && Array.isArray(result.data)) {
			const allBanks: PaystackBank[] = result.data;
			const banks = allBanks
				.filter((b) => b.type !== "mobile_money")
				.map((b) => ({ name: b.name, code: b.code }));
			const momo = allBanks
				.filter((b) => b.type === "mobile_money")
				.map((b) => ({ name: b.name, code: b.code }));

			return {
				name: "Banks & Mobile Money",
				code: "ALL",
				banks: banks.length > 0 ? banks : FALLBACK_BANKS,
				momo: momo.length > 0 ? momo : FALLBACK_MOMO,
			};
		}
	} catch (error) {
		console.error("fetchPaystackBanks error:", error);
	}

	return {
		name: "Banks & Mobile Money",
		code: "ALL",
		banks: FALLBACK_BANKS,
		momo: FALLBACK_MOMO,
	};
}

export async function verifyPaystackAccount({
	data,
}: {
	data: { accountNumber: string; bankCode: string };
}): Promise<{ success: boolean; accountName?: string; message?: string }> {
	const { accountNumber, bankCode } = data;

	if (!accountNumber || !bankCode) {
		return { success: false, message: "Account number and bank/network code are required." };
	}

	if (!PAYSTACK_SECRET) {
		return {
			success: false,
			message: "Paystack secret key is not configured on the server.",
		};
	}

	try {
		const paystackUrl = `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(
			accountNumber.trim(),
		)}&bank_code=${encodeURIComponent(bankCode.trim())}`;

		const response = await fetch(paystackUrl, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${PAYSTACK_SECRET}`,
			},
			cache: "no-store",
		});

		const result = await response.json();

		if (result.status && result.data?.account_name) {
			return {
				success: true,
				accountName: result.data.account_name,
			};
		}

		return {
			success: false,
			message: result.message || "Could not resolve account name with the selected provider.",
		};
	} catch (error) {
		console.error("verifyPaystackAccount error:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : "Failed to communicate with Paystack.",
		};
	}
}

export async function createPaystackSubaccount({
	data,
}: {
	data: {
		organizationId: string;
		businessName: string;
		accountNumber: string;
		bankCode: string;
		accountName?: string;
	};
}): Promise<{
	success: boolean;
	subaccountCode?: string;
	message?: string;
	error?: string;
}> {
	try {
		const session = await requireSession();

		const org = await prisma.organization.findUnique({
			where: { id: data.organizationId },
			select: { id: true, name: true, createdBy: true, subaccountCode: true },
		});

		if (!org) {
			return { success: false, error: "Organization not found." };
		}

		const membership = await prisma.teamMember.findFirst({
			where: {
				organizationId: data.organizationId,
				userId: session.userId,
			},
		});

		const isOwner =
			org.createdBy === session.userId ||
			(membership && membership.role.toLowerCase() === "owner");

		if (!isOwner) {
			return {
				success: false,
				error: "Only the organization owner can configure payout details.",
			};
		}

		if (!PAYSTACK_SECRET) {
			const fallbackCode = `ACCT_LOCAL_${Date.now()}`;
			await prisma.organization.update({
				where: { id: data.organizationId },
				data: {
					subaccountCode: fallbackCode,
					paystackBankCode: data.bankCode,
					paystackAccountNumber: data.accountNumber,
					paystackAccountName: data.accountName || "Configured Account",
				},
			});
			return {
				success: true,
				subaccountCode: fallbackCode,
				message: "Payment account configured successfully.",
			};
		}

		if (org.subaccountCode && !org.subaccountCode.startsWith("ACCT_LOCAL_")) {
			// Update existing subaccount
			const updateRes = await fetch(
				`https://api.paystack.co/subaccount/${encodeURIComponent(org.subaccountCode)}`,
				{
					method: "PUT",
					headers: {
						Authorization: `Bearer ${PAYSTACK_SECRET}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						settlement_bank: data.bankCode,
						account_number: data.accountNumber,
						business_name: data.businessName || org.name,
						percentage_charge: 0,
					}),
				},
			);

			const updateData = await updateRes.json();

			if (updateData.status) {
				await prisma.organization.update({
					where: { id: data.organizationId },
					data: {
						paystackBankCode: data.bankCode,
						paystackAccountNumber: data.accountNumber,
						paystackAccountName: data.accountName || null,
					},
				});

				return {
					success: true,
					subaccountCode: org.subaccountCode,
					message: "Payment account updated successfully.",
				};
			}
		}

		// Create new subaccount
		const paystackRes = await fetch("https://api.paystack.co/subaccount", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${PAYSTACK_SECRET}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				business_name: data.businessName || org.name || "Event Organization",
				account_number: data.accountNumber,
				percentage_charge: 0,
				settlement_bank: data.bankCode,
				primary_contact_email: session.email ?? undefined,
			}),
		});

		const paystackData = await paystackRes.json();

		if (!paystackRes.ok || !paystackData.status) {
			return {
				success: false,
				error: paystackData.message || "Failed to create payment account with Paystack.",
			};
		}

		const subaccountCode = paystackData.data?.subaccount_code;
		const finalAccountName =
			data.accountName ||
			paystackData.data?.settlement_bank ||
			"Verified Payout Account";

		await prisma.organization.update({
			where: { id: data.organizationId },
			data: {
				subaccountCode,
				paystackBankCode: data.bankCode,
				paystackAccountNumber: data.accountNumber,
				paystackAccountName: finalAccountName,
			},
		});

		return {
			success: true,
			subaccountCode,
			message: "Payment account created successfully. Automated payouts are enabled.",
		};
	} catch (error) {
		console.error("createPaystackSubaccount error:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to set up payment account.",
		};
	}
}

export async function removePayoutAccount({
	data,
}: {
	data: { organizationId: string };
}): Promise<{ success: boolean; message: string; error?: string }> {
	try {
		const session = await requireSession();

		const org = await prisma.organization.findUnique({
			where: { id: data.organizationId },
			select: { id: true, createdBy: true },
		});

		if (!org) {
			return { success: false, message: "Organization not found.", error: "Organization not found." };
		}

		const membership = await prisma.teamMember.findFirst({
			where: {
				organizationId: data.organizationId,
				userId: session.userId,
			},
		});

		const isOwner =
			org.createdBy === session.userId ||
			(membership && membership.role.toLowerCase() === "owner");

		if (!isOwner) {
			return {
				success: false,
				message: "Only the organization owner can remove payout details.",
				error: "Only the organization owner can remove payout details.",
			};
		}

		await prisma.organization.update({
			where: { id: data.organizationId },
			data: {
				subaccountCode: null,
				paystackBankCode: null,
				paystackAccountNumber: null,
				paystackAccountName: null,
			},
		});

		return {
			success: true,
			message: "Payout account removed successfully.",
		};
	} catch (err: any) {
		console.error("removePayoutAccount error:", err);
		return {
			success: false,
			message: err?.message || "Failed to remove payout account.",
			error: err?.message || "Failed to remove payout account.",
		};
	}
}

/**
 * Creates or retrieves a Paystack Transfer Recipient
 */
export async function createPaystackTransferRecipient({
	name,
	accountNumber,
	bankCode,
	currency = "GHS",
}: {
	name: string;
	accountNumber: string;
	bankCode: string;
	currency?: string;
}): Promise<{ success: boolean; recipientCode?: string; message?: string }> {
	if (!PAYSTACK_SECRET) {
		return {
			success: true,
			recipientCode: `RCP_LOCAL_${Date.now()}`,
			message: "Local mode recipient created.",
		};
	}

	try {
		const isMomo = ["MTN", "VOD", "ATL"].includes(bankCode.toUpperCase());
		const response = await fetch("https://api.paystack.co/transferrecipient", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${PAYSTACK_SECRET}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				type: isMomo ? "mobile_money" : "nuban",
				name: name.trim(),
				account_number: accountNumber.trim(),
				bank_code: bankCode.trim(),
				currency: currency.toUpperCase(),
			}),
		});

		const result = await response.json();

		if (result.status && result.data?.recipient_code) {
			return {
				success: true,
				recipientCode: result.data.recipient_code,
			};
		}

		return {
			success: false,
			message: result.message || "Failed to create transfer recipient on Paystack.",
		};
	} catch (error) {
		console.error("createPaystackTransferRecipient error:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : "Error contacting Paystack.",
		};
	}
}

/**
 * Initiates a real transfer via Paystack Transfers API
 */
export async function initiatePaystackTransfer({
	amount,
	recipientCode,
	reference,
	reason = "Wallet withdrawal",
}: {
	amount: number;
	recipientCode: string;
	reference: string;
	reason?: string;
}): Promise<{
	success: boolean;
	transferCode?: string;
	status?: string;
	message?: string;
	raw?: any;
}> {
	if (!PAYSTACK_SECRET || recipientCode.startsWith("RCP_LOCAL_")) {
		return {
			success: true,
			transferCode: `TRF_LOCAL_${Date.now()}`,
			status: "success",
			message: "Simulated transfer successful in local/dev mode.",
		};
	}

	try {
		const amountInSubunit = Math.round(amount * 100); // Pesewas or Cents

		const response = await fetch("https://api.paystack.co/transfer", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${PAYSTACK_SECRET}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				source: "balance",
				amount: amountInSubunit,
				recipient: recipientCode,
				reference,
				reason,
			}),
		});

		const result = await response.json();

		if (result.status && result.data) {
			return {
				success: true,
				transferCode: result.data.transfer_code,
				status: result.data.status,
				message: result.message,
				raw: result.data,
			};
		}

		return {
			success: false,
			message: result.message || "Paystack transfer initiation failed.",
			raw: result,
		};
	} catch (error) {
		console.error("initiatePaystackTransfer error:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : "Error executing transfer on Paystack.",
		};
	}
}

/**
 * Verifies the status of a transfer directly with Paystack API
 */
export async function verifyPaystackTransfer(reference: string): Promise<{
	success: boolean;
	status?: string;
	message?: string;
	raw?: any;
}> {
	if (!PAYSTACK_SECRET) {
		return { success: false, message: "Paystack secret key missing." };
	}

	try {
		const response = await fetch(
			`https://api.paystack.co/transfer/verify/${encodeURIComponent(reference)}`,
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${PAYSTACK_SECRET}`,
					"Content-Type": "application/json",
				},
				cache: "no-store",
			},
		);

		const result = await response.json();
		if (result.status && result.data) {
			return {
				success: true,
				status: result.data.status,
				message: result.message,
				raw: result.data,
			};
		}

		return {
			success: false,
			message: result.message || "Failed to verify transfer.",
			raw: result,
		};
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error
					? error.message
					: "Error verifying transfer with Paystack.",
		};
	}
}


/**
 * Checks Paystack merchant balance to prevent transfer failures
 */
export async function checkPaystackBalance(
	currency = "GHS",
): Promise<{ success: boolean; balance?: number; message?: string }> {
	if (!PAYSTACK_SECRET) {
		return { success: true, balance: 1000000 };
	}

	try {
		const response = await fetch("https://api.paystack.co/balance", {
			method: "GET",
			headers: {
				Authorization: `Bearer ${PAYSTACK_SECRET}`,
			},
			cache: "no-store",
		});

		const result = await response.json();

		if (result.status && Array.isArray(result.data)) {
			const item = result.data.find((b: any) => b.currency === currency.toUpperCase());
			const balanceInMajor = item ? item.balance / 100 : 0;
			return {
				success: true,
				balance: balanceInMajor,
			};
		}

		return { success: false, message: result.message };
	} catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : "Could not fetch Paystack balance.",
		};
	}
}

/**
 * Fetch real settlements directly from Paystack API
 */
export async function fetchPaystackSettlements({
	subaccountCode,
}: {
	subaccountCode?: string | null;
} = {}): Promise<
	Array<{
		id: number;
		amount: number;
		status: string;
		settlementDate: string;
		currency: string;
	}>
> {
	if (!PAYSTACK_SECRET) return [];
	try {
		let url = "https://api.paystack.co/settlement";
		if (subaccountCode && !subaccountCode.startsWith("ACCT_LOCAL_")) {
			url += `?subaccount=${encodeURIComponent(subaccountCode)}`;
		}
		const res = await fetch(url, {
			headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
			cache: "no-store",
		});
		const json = await res.json();
		if (json.status && Array.isArray(json.data)) {
			return json.data.map((s: any) => ({
				id: s.id,
				amount: (s.total_amount || 0) / 100,
				status: s.status,
				settlementDate: s.settlement_date,
				currency: s.currency || "GHS",
			}));
		}
	} catch (e) {
		console.warn("[PAYSTACK-SETTLEMENT-FETCH-ERR]", e);
	}
	return [];
}

/**
 * Fetch real transfers directly from Paystack API
 */
export async function fetchPaystackTransfers(): Promise<
	Array<{
		id: number;
		reference: string;
		amount: number;
		status: string;
		transferredAt: string;
		recipientName: string;
		currency: string;
	}>
> {
	if (!PAYSTACK_SECRET) return [];
	try {
		const res = await fetch("https://api.paystack.co/transfer", {
			headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
			cache: "no-store",
		});
		const json = await res.json();
		if (json.status && Array.isArray(json.data)) {
			return json.data.map((t: any) => ({
				id: t.id,
				reference: t.reference,
				amount: (t.amount || 0) / 100,
				status: t.status,
				transferredAt: t.transferred_at || t.createdAt,
				recipientName: t.recipient?.name || "Recipient",
				currency: t.currency || "GHS",
			}));
		}
	} catch (e) {
		console.warn("[PAYSTACK-TRANSFERS-FETCH-ERR]", e);
	}
	return [];
}

