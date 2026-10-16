"use client";
// src/components/organization/wallet/OrgPayoutSettings.tsx

import { Banknote, Check, Loader2, Pencil, Plus, ShieldAlert, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ConfirmPasswordDialog } from "@/components/shared/ConfirmPasswordDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	getCurrencyByCountryCode,
	supportedCountries,
} from "@/lib/dal/countries";
import type { FetchPaystackBanksResult } from "@/lib/server-functions/paystack";
import {
	createPaystackSubaccount,
	fetchPaystackBanks,
	removePayoutAccount,
	verifyPaystackAccount,
} from "@/lib/server-functions/paystack";
import { usePermissions } from "@/hooks/use-permissions";
import {
	detectMomoNetworkFromPhone,
	formatToLocalMomoNumber,
	isSamePhoneNumber,
} from "@/lib/utils/phone";
import { PayoutAccountCard } from "./PayoutAccountCard";

interface OrgPayoutSettingsProps {
	readonly organization: {
		id: string;
		name: string;
		phone?: string | null;
		paystackBankCode?: string | null;
		paystackAccountNumber?: string | null;
		paystackAccountName?: string | null;
		subaccountCode?: string | null;
	};
	onSuccess?: () => void;
}

interface NetworkOption {
	code: string;
	label: string;
}

export function OrgPayoutSettings({ organization, onSuccess }: OrgPayoutSettingsProps) {
	const [bankType, setBankType] = useState<"momo" | "bank">("momo");
	const [isVerifying, setIsVerifying] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);
	const [isRemoving, setIsRemoving] = useState(false);
	const [country, setCountry] = useState(supportedCountries[0]?.code ?? "GH");

	const [payoutBankCode, setPayoutBankCode] = useState(
		organization.paystackBankCode ?? "",
	);
	const [payoutAccountNumber, setPayoutAccountNumber] = useState(
		organization.paystackAccountNumber ?? "",
	);
	const [payoutAccountName, setPayoutAccountName] = useState(
		organization.paystackAccountName ?? "",
	);

	const { canManagePayouts } = usePermissions((organization as any).userRole);

	const hasExistingPayout = !!(
		payoutAccountName &&
		payoutAccountNumber &&
		payoutBankCode
	);

	const [isEditing, setIsEditing] = useState(false);

	const [bankCode, setBankCode] = useState(organization.paystackBankCode ?? "");
	const [accountNumber, setAccountNumber] = useState(
		organization.paystackAccountNumber ?? "",
	);

	const [verifiedName, setVerifiedName] = useState<string | null>(
		organization.paystackAccountName ?? null,
	);
	const [accountName, setAccountName] = useState(
		organization.paystackAccountName ?? "",
	);

	useEffect(() => {
		setPayoutBankCode(organization.paystackBankCode ?? "");
		setPayoutAccountNumber(organization.paystackAccountNumber ?? "");
		setPayoutAccountName(organization.paystackAccountName ?? "");
		setBankCode(organization.paystackBankCode ?? "");
		setAccountNumber(organization.paystackAccountNumber ?? "");
		setVerifiedName(organization.paystackAccountName ?? null);
		setAccountName(organization.paystackAccountName ?? "");
		setIsEditing(false);
	}, [
		organization.id,
		organization.paystackBankCode,
		organization.paystackAccountNumber,
		organization.paystackAccountName,
	]);

	const [banks, setBanks] = useState<NetworkOption[]>([]);
	const [momoNetworks, setMomoNetworks] = useState<NetworkOption[]>([]);
	const [isLoadingNetworks, setIsLoadingNetworks] = useState(false);

	const isOrgNumberMatch = isSamePhoneNumber(accountNumber, organization.phone);

	function handleUseOrgPhone() {
		if (!organization.phone) return;
		const localNumber = formatToLocalMomoNumber(organization.phone);
		setBankType("momo");
		setAccountNumber(localNumber);
		setVerifiedName(null);
		setAccountName("");

		const detected = detectMomoNetworkFromPhone(localNumber);
		if (detected && momoNetworks.length > 0) {
			const match = momoNetworks.find(
				(n) =>
					n.code.toUpperCase() === detected.code ||
					n.label.toLowerCase().includes(detected.name.toLowerCase()),
			);
			if (match) {
				setBankCode(match.code);
			}
		}
		toast.info(`Loaded organization contact (${localNumber})`);
	}

	const networks = bankType === "momo" ? momoNetworks : banks;
	const countryOptions = supportedCountries.map((c: any) => ({
		value: c.code,
		label: c.name,
	}));
	const networkOptions = networks.map((n) => ({
		value: n.code,
		label: n.label,
	}));

	useEffect(() => {
		if (!isEditing) return;
		async function loadNetworks() {
			setIsLoadingNetworks(true);
			setBankCode("");
			setVerifiedName(null);
			setAccountName("");
			const currency = getCurrencyByCountryCode(country) || "GHS";
			try {
				const result: FetchPaystackBanksResult = await fetchPaystackBanks({
					data: {
						currency: (currency as "NGN" | "USD" | "GHS" | "KES") || "GHS",
					},
				});
				setBanks(
					(result.banks || []).map((b: any) => ({
						code: b.code,
						label: b.name,
					})),
				);
				setMomoNetworks(
					(result.momo || []).map((b: any) => ({
						code: b.code,
						label: b.name,
					})),
				);
			} catch {
				setBanks([]);
				setMomoNetworks([]);
				toast.error("Failed to load banks. Please try again.");
			} finally {
				setIsLoadingNetworks(false);
			}
		}
		loadNetworks();
	}, [country, isEditing]);

	async function handleVerify() {
		if (!accountNumber || !bankCode) {
			toast.error(
				"Please enter both account number and select a bank/network.",
			);
			return;
		}
		setIsVerifying(true);
		setVerifiedName(null);
		try {
			const result = await verifyPaystackAccount({
				data: { accountNumber, bankCode },
			});
			if (result.success && result.accountName) {
				setVerifiedName(result.accountName);
				setAccountName(result.accountName);
				toast.success(`Account verified: ${result.accountName}`);
			} else {
				setVerifiedName(null);
				toast.error(result.message || "Failed to verify account.");
			}
		} catch {
			setVerifiedName(null);
			toast.error("Failed to verify account.");
		} finally {
			setIsVerifying(false);
		}
	}

	async function handleSave() {
		if (!accountNumber || !bankCode) return;
		setIsCreating(true);
		try {
			const result = await createPaystackSubaccount({
				data: {
					organizationId: organization.id,
					businessName: organization.name,
					accountNumber,
					bankCode,
					accountName: verifiedName ?? accountName,
				},
			});
			if (result.success) {
				setPayoutBankCode(bankCode);
				setPayoutAccountNumber(accountNumber);
				setPayoutAccountName(verifiedName ?? accountName);
				setIsEditing(false);
				toast.success("Payment account saved successfully!");
				if (onSuccess) onSuccess();
			} else {
				toast.error(result.error || "Failed to set up payment account.");
			}
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: "Failed to set up payment account.",
			);
		} finally {
			setIsCreating(false);
		}
	}

	async function handleRemove() {
		setIsRemoving(true);
		try {
			const result = await removePayoutAccount({
				data: { organizationId: organization.id },
			});
			if (result.success) {
				setPayoutBankCode("");
				setPayoutAccountNumber("");
				setPayoutAccountName("");
				setBankCode("");
				setAccountNumber("");
				setAccountName("");
				setVerifiedName(null);
				setIsEditing(false);
				toast.success(result.message || "Payout account removed successfully.");
			} else {
				toast.error(result.message || "Failed to remove payout account.");
			}
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: "Failed to remove payout account.",
			);
		} finally {
			setIsRemoving(false);
		}
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<div className="flex items-start justify-between gap-4">
						<div>
							<CardTitle className="flex items-center gap-2">
								<Banknote className="h-5 w-5" />
								Payout Details
							</CardTitle>
						</div>
						{hasExistingPayout && !isEditing && canManagePayouts && (
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setIsEditing(true)}
									className="shrink-0"
								>
									<Pencil className="h-4 w-4 mr-1" />
									Edit
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setIsRemoveConfirmOpen(true)}
									disabled={isRemoving}
									className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
								>
									<Trash2 className="h-4 w-4 mr-1" />
									Remove
								</Button>
							</div>
						)}
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					{hasExistingPayout && !isEditing && (
						<PayoutAccountCard
							key={payoutAccountNumber}
							paystackBankCode={payoutBankCode}
							paystackAccountNumber={payoutAccountNumber}
							paystackAccountName={payoutAccountName}
							countryCode={country}
						/>
					)}

					{!hasExistingPayout && !isEditing && (
						<EmptyState
							variant="payment"
							title="No payout account configured"
							description={
								canManagePayouts
									? "Add your mobile money or bank account details to receive payouts directly."
									: "Payout account details can only be configured by the organization owner."
							}
							action={
								canManagePayouts ? (
									<Button onClick={() => setIsEditing(true)} className="gap-2">
										<Plus className="h-4 w-4" />
										Add Payout Details
									</Button>
								) : undefined
							}
							className="py-6"
							svgClassName="w-36 h-36 mb-3"
						/>
					)}

					{isEditing && canManagePayouts && (
						<div className="space-y-4">
							<div className="flex flex-wrap gap-4 mb-4">
								<label className="flex items-center gap-2 text-sm cursor-pointer">
									<input
										type="radio"
										name="bankType"
										checked={bankType === "momo"}
										onChange={() => {
											setBankType("momo");
											setBankCode("");
											setVerifiedName(null);
											setAccountName("");
										}}
										className="accent-primary"
									/>
									Mobile Money
								</label>
								<label className="flex items-center gap-2 text-sm cursor-pointer">
									<input
										type="radio"
										name="bankType"
										checked={bankType === "bank"}
										onChange={() => {
											setBankType("bank");
											setBankCode("");
											setVerifiedName(null);
											setAccountName("");
										}}
										className="accent-primary"
									/>
									Bank Account
								</label>
								<div className="flex items-center gap-2 text-sm">
									<label htmlFor="country-combobox">Country:</label>
									<div className="min-w-45">
										<Combobox
											options={countryOptions}
											value={country}
											onChange={(val: any) => {
												setCountry(val);
												setBankCode("");
												setVerifiedName(null);
												setAccountName("");
											}}
											placeholder="Select country"
											disabled={isLoadingNetworks}
										/>
									</div>
								</div>
							</div>
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label>{bankType === "momo" ? "Network" : "Bank"}</Label>
									<Combobox
										options={networkOptions}
										value={bankCode}
										onChange={(val: string) => {
											setBankCode(val);
											setVerifiedName(null);
											setAccountName("");
										}}
										disabled={isLoadingNetworks}
										placeholder={
											isLoadingNetworks
												? "Loading..."
												: bankType === "momo"
													? "Select network"
													: "Select bank"
										}
									/>
								</div>
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<Label>Account Number</Label>
										{organization.phone && (
											<button
												type="button"
												onClick={handleUseOrgPhone}
												className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors cursor-pointer group"
												title={`Use organization contact: ${organization.phone}`}
											>
												<Sparkles className="size-3 text-emerald-500 group-hover:rotate-12 transition-transform" />
												<span>Use organization number ({organization.phone})</span>
											</button>
										)}
									</div>
									<Input
										value={accountNumber}
										onChange={(e) => {
											setAccountNumber(e.target.value.replace(/\D/g, ""));
											setVerifiedName(null);
											setAccountName("");
										}}
										placeholder={
											bankType === "momo"
												? "0240000000"
												: "Enter account number"
										}
									/>
									{verifiedName && (
										<div className="space-y-2.5 mt-2.5">
											<p className="text-sm text-primary font-medium flex items-center">
												<Check className="h-4 w-4 mr-1 text-emerald-500" />
												Verified Name: <span className="font-semibold ml-1">{verifiedName}</span>
											</p>
											{isOrgNumberMatch ? (
												<div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5 shadow-xs">
													<ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
													<div className="space-y-0.5">
														<p className="font-semibold text-emerald-900 dark:text-emerald-100 flex items-center gap-1.5">
															<span>Organization Contact Matched</span>
															
														</p>
														<p className="text-emerald-700 dark:text-emerald-300/90 leading-relaxed">
															No verification required
														</p>
													</div>
												</div>
											) : (
												<div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5 shadow-xs">
													<ShieldAlert className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
													<div className="space-y-0.5">
														<p className="font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-1.5">
															<span>Different Number Detected</span>
															<span className="bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold">
																Security Check
															</span>
														</p>
														<p className="text-amber-700 dark:text-amber-300/90 leading-relaxed">
															This account number differs from your organization's registered contact. For security, identity confirmation (password or OTP) is required to authorize this destination.
														</p>
													</div>
												</div>
											)}
										</div>
									)}
								</div>
							</div>
						</div>
					)}
				</CardContent>

				{isEditing && canManagePayouts && (
					<CardFooter className="flex justify-end gap-4 border-t px-6 py-4 bg-muted/20">
						<Button variant="ghost" onClick={() => setIsEditing(false)}>
							Cancel
						</Button>
						{verifiedName ? (
							isOrgNumberMatch ? (
								<Button
									type="button"
									onClick={handleSave}
									disabled={isCreating}
									className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-medium shadow-xs"
								>
									{isCreating ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Saving...
										</>
									) : (
										<>
											<ShieldCheck className="h-4 w-4" />
											Save Payout Details
										</>
									)}
								</Button>
							) : (
								<Button
									type="button"
									onClick={() => setIsConfirmOpen(true)}
									disabled={isCreating}
									className="gap-1.5 font-medium"
								>
									{isCreating && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									Confirm & Save Payout Details
								</Button>
							)
						) : (
							<Button
								type="button"
								onClick={handleVerify}
								disabled={isVerifying || !accountNumber || !bankCode}
							>
								{isVerifying && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Verify Account
							</Button>
						)}
					</CardFooter>
				)}
			</Card>

			<ConfirmPasswordDialog
				open={isConfirmOpen}
				onOpenChange={setIsConfirmOpen}
				title="Confirm Payout Destination"
				description="You are configuring a payout account that differs from your organization's registered contact. For security, please verify your identity to authorize this change."
				confirmLabel="Authorize Payout Details"
				onConfirm={handleSave}
			/>

			<ConfirmPasswordDialog
				open={isRemoveConfirmOpen}
				onOpenChange={setIsRemoveConfirmOpen}
				title="Confirm Payout Account Removal"
				description="Are you sure you want to remove this payout account? Automated payouts will be paused until a new account is configured."
				confirmLabel="Remove Payout Details"
				onConfirm={handleRemove}
			/>
		</div>
	);
}
