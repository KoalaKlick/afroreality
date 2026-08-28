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
	createdAt?: string;
	updatedAt?: string;
}

export interface FetchPaystackBanksResult {
	name: string;
	code: string;
	banks: Array<{ name: string; code: string }>;
	momo: Array<{ name: string; code: string }>;
}

const FALLBACK_BANKS: Array<{ name: string; code: string }> = [
	{ name: "Access Bank Ghana", code: "ABG" },
	{ name: "Absa Bank Ghana", code: "ABS" },
	{ name: "CalBank", code: "CAL" },
	{ name: "Ecobank Ghana", code: "ECO" },
	{ name: "Fidelity Bank Ghana", code: "FID" },
	{ name: "First National Bank", code: "FNB" },
	{ name: "GCB Bank", code: "GCB" },
	{ name: "Stanbic Bank Ghana", code: "STA" },
	{ name: "Standard Chartered Bank", code: "SCB" },
	{ name: "Zenith Bank Ghana", code: "ZEN" },
];

const FALLBACK_MOMO: Array<{ name: string; code: string }> = [
	{ name: "MTN Mobile Money", code: "MTN" },
	{ name: "Telecel Cash / Vodafone", code: "VOD" },
	{ name: "AT / AirtelTigo Money", code: "ATL" },
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
	const session = await requireSession();

	const org = await prisma.organization.findUnique({
		where: { id: data.organizationId },
		select: { id: true, name: true, createdBy: true, subaccountCode: true },
	});

	if (!org) {
		throw new Error("Organization not found.");
	}

	const membership = await prisma.teamMember.findFirst({
		where: {
			organizationId: data.organizationId,
			userId: session.userId,
		},
	});

	const isOwner = org.createdBy === session.userId;
	const isPrivileged =
		isOwner ||
		(membership && ["owner", "admin"].includes(membership.role.toLowerCase()));

	if (!isPrivileged) {
		throw new Error("Only the organization owner or admin can configure payout details.");
	}

	if (!PAYSTACK_SECRET) {
		await prisma.organization.update({
			where: { id: data.organizationId },
			data: {
				subaccountCode: `ACCT_LOCAL_${Date.now()}`,
				paystackBankCode: data.bankCode,
				paystackAccountNumber: data.accountNumber,
				paystackAccountName: data.accountName || "Configured Account",
			},
		});
		return {
			success: true,
			subaccountCode: `ACCT_LOCAL_${Date.now()}`,
			message: "Payment account configured successfully.",
		};
	}

	try {
		if (org.subaccountCode) {
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
			throw new Error(paystackData.message || "Failed to create payment account with Paystack.");
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
}): Promise<{ success: boolean; message: string }> {
	const session = await requireSession();

	const org = await prisma.organization.findUnique({
		where: { id: data.organizationId },
		select: { id: true, createdBy: true },
	});

	if (!org) {
		throw new Error("Organization not found.");
	}

	const membership = await prisma.teamMember.findFirst({
		where: {
			organizationId: data.organizationId,
			userId: session.userId,
		},
	});

	const isOwner = org.createdBy === session.userId;
	const isPrivileged =
		isOwner ||
		(membership && ["owner", "admin"].includes(membership.role.toLowerCase()));

	if (!isPrivileged) {
		throw new Error("Only the organization owner or admin can remove payout details.");
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
}
