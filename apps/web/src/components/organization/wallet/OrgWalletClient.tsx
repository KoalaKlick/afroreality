"use client";
// src/components/organization/wallet/OrgWalletClient.tsx

import {
	ArrowDownToLine,
	ArrowLeftRight,
	Clock,
	DollarSign,
	CheckCircle2,
	Landmark,
	Search,
	Wallet as WalletIcon,
	Lock,
	ShieldAlert,
	KeyRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmPasswordDialog } from "@/components/shared/ConfirmPasswordDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissions } from "@/hooks/use-permissions";
import {
	requestWalletWithdrawal,
	cancelWalletWithdrawal,
	syncPayoutStatus,
} from "@/lib/server-functions/wallet";
import type { ActivityLogRecord, PayoutRecord, Transaction, Wallet } from "@/lib/types/payment";
import { OrgPayoutSettings } from "./OrgPayoutSettings";
import { PayoutsHistoryTable } from "./PayoutsHistoryTable";
import { TransactionsTable } from "./TransactionsTable";
import { WalletBalanceSummary } from "./WalletBalanceSummary";
import { ProviderLogo } from "@/components/shared/ProviderLogo";

interface OrgWalletClientProps {
	readonly organization: {
		id: string;
		name: string;
		paystackBankCode?: string | null;
		paystackAccountNumber?: string | null;
		paystackAccountName?: string | null;
		subaccountCode?: string | null;
	};
	readonly wallet: Wallet | null;
	readonly transactions: Transaction[];
	readonly totalTransactions: number;
	readonly payouts?: PayoutRecord[];
	readonly totalPayouts?: number;
	readonly activityLogs?: ActivityLogRecord[];
}

export function OrgWalletClient({
	organization,
	wallet,
	transactions,
	totalTransactions,
	payouts = [],
	totalPayouts = 0,
	activityLogs = [],
}: OrgWalletClientProps) {
	const router = useRouter();
	const { canWithdraw, canManagePayouts } = usePermissions((organization as any).userRole);

	// Search filter state
	const [searchQuery, setSearchQuery] = useState("");

	// Payout drawer state
	const [isPayoutDrawerOpen, setIsPayoutDrawerOpen] = useState(false);

	// Withdrawal dialog states
	const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [withdrawalAmount, setWithdrawalAmount] = useState("");
	const [withdrawalMemo, setWithdrawalMemo] = useState("");
	const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);

	const [isCancellingPayout, setIsCancellingPayout] = useState(false);

	const pendingDebits =
		typeof (wallet as any)?.pendingDebits === "number"
			? Number((wallet as any).pendingDebits)
			: 0;

	const availableBalance =
		typeof (wallet as any)?.availableBalance === "number"
			? Number((wallet as any).availableBalance)
			: Math.max(0, (wallet?.balance ?? 0) - (wallet?.pendingDebits ?? 0));

	const ledgerBalance =
		typeof (wallet as any)?.ledgerBalance === "number"
			? Number((wallet as any).ledgerBalance)
			: Number(wallet?.balance ?? 0);

	const pendingBalance =
		typeof (wallet as any)?.pendingBalance === "number"
			? Number((wallet as any).pendingBalance)
			: (wallet?.pendingCredits ?? 0);

	const currency = wallet?.currency ?? "GHS";

	const hasPayoutAccount = !!(
		organization.paystackAccountNumber &&
		organization.paystackBankCode &&
		organization.paystackAccountName
	);

	// Split transactions into accounting categories
	const inflows = useMemo(
		() => transactions.filter((t) => t.type === "credit"),
		[transactions],
	);

	const outflows = useMemo(
		() => transactions.filter((t) => t.type === "debit"),
		[transactions],
	);

	const totalInflowAmount = useMemo(
		() =>
			inflows
				.filter((t) => t.status === "completed")
				.reduce((sum, t) => sum + Number(t.amount || 0), 0),
		[inflows],
	);

	const totalOutflowAmount = useMemo(
		() =>
			outflows
				.filter((t) => t.status === "completed")
				.reduce((sum, t) => sum + Number(t.amount || 0), 0),
		[outflows],
	);

	// Filter by search query
	const filterTransactions = (list: Transaction[]) => {
		if (!searchQuery.trim()) return list;
		const query = searchQuery.toLowerCase().trim();
		return list.filter((t) => {
			const refMatch = t.reference?.toLowerCase().includes(query);
			const descMatch = t.description?.toLowerCase().includes(query);
			const typeMatch = t.type?.toLowerCase().includes(query);
			const categoryMatch = t.category?.toLowerCase().includes(query);
			const amountMatch = t.amount?.toString().includes(query);
			const statusMatch = t.status?.toLowerCase().includes(query);
			return refMatch || descMatch || typeMatch || categoryMatch || amountMatch || statusMatch;
		});
	};

	const filteredAll = useMemo(
		() => filterTransactions(transactions),
		[transactions, searchQuery],
	);
	const filteredInflows = useMemo(
		() => filterTransactions(inflows),
		[inflows, searchQuery],
	);
	const filteredOutflows = useMemo(
		() => filterTransactions(outflows),
		[outflows, searchQuery],
	);

	const minWithdrawalAmount = Number((wallet as any)?.minWithdrawalAmount ?? 20);
	const transferFee = Number((wallet as any)?.transferFee ?? 1.0);
	const isNextWithdrawalFree = Boolean((wallet as any)?.isNextWithdrawalFree ?? true);

	const parsedAmount = Number.parseFloat(withdrawalAmount);
	const isValidWithdrawalAmount =
		!Number.isNaN(parsedAmount) &&
		parsedAmount >= minWithdrawalAmount &&
		parsedAmount <= availableBalance;

	const calculatedFee = isNextWithdrawalFree ? 0 : transferFee;
	const netPayoutAmount = Math.max(0, Math.round((parsedAmount - calculatedFee) * 100) / 100);

	function handleOpenWithdrawal() {
		if (wallet?.isLocked) {
			toast.error("Withdrawals are disabled because this wallet has been frozen by platform administration.");
			return;
		}
		if (!hasPayoutAccount) {
			toast.error("Please configure your payout account before requesting a withdrawal.");
			setIsPayoutDrawerOpen(true);
			return;
		}
		setWithdrawalAmount("");
		setWithdrawalMemo("");
		setIsWithdrawOpen(true);
	}

	function handleProceedToConfirm() {
		if (Number.isNaN(parsedAmount) || parsedAmount < minWithdrawalAmount) {
			toast.error(
				`Minimum withdrawal amount is ${currency} ${minWithdrawalAmount.toFixed(2)}.`,
			);
			return;
		}
		if (parsedAmount > availableBalance) {
			toast.error(
				`Amount exceeds available balance (${currency} ${availableBalance.toFixed(2)})`,
			);
			return;
		}
		setIsWithdrawOpen(false);
		setIsConfirmOpen(true);
	}

	async function handleConfirmedWithdraw() {
		setIsSubmittingWithdrawal(true);
		try {
			const result = await requestWalletWithdrawal({
				data: {
					organizationId: organization.id,
					amount: parsedAmount,
					bankCode: organization.paystackBankCode ?? "",
					accountNumber: organization.paystackAccountNumber ?? "",
					accountName: organization.paystackAccountName ?? "",
					description: withdrawalMemo || undefined,
				},
			});

			setIsConfirmOpen(false);
			setWithdrawalAmount("");
			setWithdrawalMemo("");

			if (result.requiresOtp) {
				toast.success("Withdrawal request submitted! It is currently being processed.");
			} else {
				toast.success(result.message ?? "Withdrawal request submitted successfully!");
			}
			router.refresh();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to request withdrawal",
			);
		} finally {
			setIsSubmittingWithdrawal(false);
		}
	}

	async function handleCancelPayout(payoutId: string) {
		setIsCancellingPayout(true);
		try {
			const res = await cancelWalletWithdrawal({
				data: {
					organizationId: organization.id,
					payoutId,
				},
			});
			if (res.success) {
				toast.success(res.message);
				router.refresh();
			} else {
				toast.error(res.message);
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to cancel payout");
		} finally {
			setIsCancellingPayout(false);
		}
	}

	async function handleSyncPayout(payout: PayoutRecord) {
		if (!payout.reference) return;
		try {
			toast.loading("Verifying transfer status with Paystack...", { id: `sync-${payout.reference}` });
			const res = await syncPayoutStatus({ reference: payout.reference });
			if (res.success) {
				toast.success(res.message, { id: `sync-${payout.reference}` });
				router.refresh();
			} else {
				toast.error(res.message || "Could not sync status with Paystack.", { id: `sync-${payout.reference}` });
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to sync status with Paystack", {
				id: `sync-${payout.reference}`,
			});
		}
	}

	return (
		<>
			<PageHeader
				breadcrumbs={[
					{ label: "Organization", href: "/organization/manage" },
					{ label: "Wallet & Payouts" },
				]}
			/>

			<div className="flex flex-1 flex-col gap-6 p-6">
				{/* 1. Status Cards at the Very Top */}
				<WalletBalanceSummary
					organizationId={organization.id}
					availableBalance={availableBalance}
					ledgerBalance={ledgerBalance}
					pendingBalance={pendingBalance}
					pendingDebits={pendingDebits}
					isLocked={!!wallet?.isLocked}
					totalRevenue={
						typeof (wallet as any)?.totalInflows === "number"
							? Number((wallet as any).totalInflows)
							: totalInflowAmount > 0
								? totalInflowAmount
								: availableBalance + (wallet?.pendingCredits ?? 0)
					}
					totalWithdrawn={
						typeof (wallet as any)?.totalPayouts === "number"
							? Number((wallet as any).totalPayouts)
							: totalOutflowAmount
					}
					currency={currency}
				/>

				{/* Wallet Locked / Frozen Notice Banner */}
				{wallet?.isLocked && (
					<div className="flex items-start gap-3 p-4 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive text-xs animate-in fade-in duration-200">
						<ShieldAlert className="size-5 shrink-0 mt-0.5" />
						<div className="space-y-1 flex-1">
							<div className="font-bold text-sm text-destructive flex items-center gap-2">
								<span>Wallet Payouts Restricted</span>
								<Badge variant="destructive" className="text-[10px] uppercase tracking-wider font-extrabold">
									Platform Freeze
								</Badge>
							</div>
							<p className="text-foreground/90 font-medium leading-relaxed">
								This wallet has been administratively frozen by Fextiva Platform Administration.
								Outbound withdrawals and automated payouts are temporarily suspended.
							</p>
							{wallet.lockReason && (
								<div className="mt-1.5 p-2.5 rounded bg-background/90 border border-destructive/30 text-[11px] font-semibold text-foreground">
									<span className="text-destructive font-bold uppercase text-[9px] tracking-wider block">Official Reason:</span>
									{wallet.lockReason}
								</div>
							)}
							<p className="text-[11px] text-muted-foreground pt-1">
								For questions or compliance assistance, please contact support@fextiva.com.
							</p>
						</div>
					</div>
				)}

				{/* 2. Tabs wrapping Header Card and separate Table Card */}
				<Tabs defaultValue="all" className="space-y-6">
					{/* Header & Tabs Card */}
					<Card>
						<CardHeader>
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
								<div>
									<CardTitle className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
										<WalletIcon className="h-6 w-6" />
										Wallet & Payouts
									</CardTitle>
									<CardDescription className="mt-1">
										Track revenue, settlements, and manage disbursement accounts.
									</CardDescription>
								</div>

								{/* Action Buttons in Header */}
								<div className="flex flex-wrap items-center gap-2.5 shrink-0">
									{/* Payout Settings Drawer Trigger */}
									<Button
										variant="outline"
										size="sm"
										onClick={() => setIsPayoutDrawerOpen(true)}
										className="gap-2 bg-background hover:bg-accent"
									>
										<Landmark className="size-4 text-muted-foreground" />
										<span>Payout Account</span>
										{hasPayoutAccount ? (
											<span className="size-2 rounded-full bg-emerald-500" />
										) : (
											<span className="size-2 rounded-full bg-amber-500" />
										)}
									</Button>

									{/* Request Withdrawal Button */}
									{canWithdraw && (
										<Button
											size="sm"
											onClick={handleOpenWithdrawal}
											disabled={availableBalance <= 0 || !!wallet?.isLocked}
											className={`gap-1.5 shadow-xs ${wallet?.isLocked ? "opacity-60 cursor-not-allowed" : ""}`}
											title={wallet?.isLocked ? "Withdrawals suspended while wallet is frozen" : undefined}
										>
											{wallet?.isLocked ? (
												<Lock className="size-4 text-destructive" />
											) : (
												<ArrowDownToLine className="size-4" />
											)}
											{wallet?.isLocked ? "Withdrawals Frozen" : "Request Withdrawal"}
										</Button>
									)}
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<TabsList
								variant="brand"
								className="flex overflow-x-auto w-full p-1.5 gap-1.5 rounded-sm"
							>
								<TabsTrigger
									variant="brand"
									value="all"
									className="gap-1.5"
								>
									<ArrowLeftRight className="h-4 w-4" />
									<span>All Activity</span>
								</TabsTrigger>

								<TabsTrigger
									variant="brand"
									value="received"
									className="gap-1.5"
								>
									<DollarSign className="h-4 w-4" />
									<span>Revenue (Inflows)</span>
								</TabsTrigger>

								<TabsTrigger
									variant="brand"
									value="withdrawals"
									className="gap-1.5"
								>
									<ArrowDownToLine className="h-4 w-4" />
									<span>Outflows (Debits)</span>
								</TabsTrigger>

								<TabsTrigger
									variant="brand"
									value="payouts"
									className="gap-1.5"
								>
									<Landmark className="h-4 w-4" />
									<span>Payout History ({totalPayouts})</span>
								</TabsTrigger>
							</TabsList>
						</CardContent>
					</Card>

					{/* 3. Table Card separated from Header Card */}
					<Card>
						<CardContent className="pt-6 space-y-4">
							{/* Search Bar */}
							<div className="flex flex-col sm:flex-row items-center justify-between gap-3">
								<div className="relative w-full sm:w-72">
									<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
									<Input
										type="search"
										placeholder="Search records..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="pl-8 text-sm h-9 bg-background"
									/>
								</div>
							</div>

							{/* Tab 1: All Activity */}
							<TabsContent value="all" className="m-0 space-y-4">
								<TransactionsTable
									transactions={filteredAll}
									total={filteredAll.length}
									emptyTitle="No transactions found"
									emptyDescription={
										searchQuery
											? "No transactions match your search query."
											: "There are no transactions recorded in this wallet yet."
									}
									emptyVariant="money"
								/>
							</TabsContent>

							{/* Tab 2: Revenue Received */}
							<TabsContent value="received" className="m-0 space-y-4">
								<TransactionsTable
									transactions={filteredInflows}
									total={filteredInflows.length}
									emptyTitle="No revenue records found"
									emptyDescription={
										searchQuery
											? "No revenue records match your search."
											: "Ticket sales and vote payments will appear here as revenue."
									}
									emptyVariant="money"
								/>
							</TabsContent>

							{/* Tab 3: Withdrawals / Payouts */}
							<TabsContent value="withdrawals" className="m-0 space-y-4">
								<TransactionsTable
									transactions={filteredOutflows}
									total={filteredOutflows.length}
									emptyTitle="No payout records found"
									emptyDescription={
										searchQuery
											? "No payout records match your search."
											: "Disbursements and withdrawals to your payout account will appear here."
									}
									emptyVariant="payment"
								/>
							</TabsContent>

							{/* Tab 4: Detailed Payout History */}
							<TabsContent value="payouts" className="m-0 space-y-4">
								<PayoutsHistoryTable
									payouts={payouts}
									total={totalPayouts}
									onCancelPayout={(payout) => handleCancelPayout(payout.id)}
									onSyncPayout={handleSyncPayout}
									emptyTitle="No withdrawal history"
									emptyDescription="When you submit a withdrawal request, its destination account number, recipient, and processing status will appear here."
									emptyVariant="payment"
								/>
							</TabsContent>
						</CardContent>
					</Card>
				</Tabs>
			</div>

			{/* Payout Settings Drawer (Slide-out Sheet) */}
			<Sheet open={isPayoutDrawerOpen} onOpenChange={setIsPayoutDrawerOpen}>
				<SheetContent
					side="right"
					variant="brand"
					className="w-full sm:max-w-xl flex flex-col h-full p-0 overflow-hidden"
				>
					<SheetHeader className="shrink-0">
						<div className="flex items-center gap-2.5">
							<div className="size-9 rounded-lg bg-primary-100 dark:bg-primary-950/50 text-primary flex items-center justify-center shrink-0">
								<Landmark className="size-5" />
							</div>
							<div>
								<SheetTitle className="text-lg font-bold">
									Payout Account Settings
								</SheetTitle>
								<SheetDescription className="text-xs">
									Configure your Mobile Money or Bank Account to receive automatic revenue settlements.
								</SheetDescription>
							</div>
						</div>
					</SheetHeader>

					<div className="flex-1 overflow-y-auto p-6">
						<OrgPayoutSettings
							key={organization.id}
							organization={organization}
						/>
					</div>
				</SheetContent>
			</Sheet>

			{/* Withdrawal Modal Dialog */}
			<Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<ArrowDownToLine className="size-5 text-primary" />
							Request Withdrawal
						</DialogTitle>
						<DialogDescription>
							Transfer available funds directly to your verified payout account.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						{/* Available Balance & Settlement Status Banner */}
						<div className="bg-primary-50/70 dark:bg-primary-950/30 dark:border-primary-900/50 rounded-lg p-3 space-y-1.5">
							<div className="flex items-center justify-between">
								<div className="text-xs text-muted-foreground">Available to Withdraw (Cleared):</div>
								<div className="font-mono font-bold text-sm text-foreground">
									{currency} {availableBalance.toFixed(2)}
								</div>
							</div>
							{(wallet as any)?.pendingSettlement > 0 && (
								<div className="flex items-center justify-between text-[11px] text-amber-600 dark:text-amber-400 border-t border-primary-100/50 dark:border-primary-900/30 pt-1.5">
									<span className="flex items-center gap-1">
										<Clock className="size-3" />
										Pending T+1 Clearance:
									</span>
									<span className="font-mono font-semibold">
										{currency} {Number((wallet as any).pendingSettlement).toFixed(2)}
									</span>
								</div>
							)}
						</div>

						{/* Destination Account Summary */}
						{hasPayoutAccount && (
							<div className="rounded-lg border border-border bg-card p-3 flex items-center gap-3 text-xs">
								<ProviderLogo
									bankCode={organization.paystackBankCode}
									className="size-8 shrink-0"
								/>
								<div className="space-y-0.5 min-w-0 flex-1">
									<div className="font-semibold text-muted-foreground">
										Disbursing To:
									</div>
									<div className="font-medium text-foreground truncate">
										{organization.paystackAccountName}
									</div>
									<div className="font-mono text-muted-foreground text-[11px]">
										{organization.paystackAccountNumber} ({organization.paystackBankCode})
									</div>
								</div>
							</div>
						)}

						{/* Amount Input */}
						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<Label htmlFor="withdraw-amount" className="text-xs font-semibold">
									Withdrawal Amount ({currency}) <span className="text-destructive">*</span>
								</Label>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="h-6 px-2 text-[11px] text-primary hover:text-primary font-medium"
									onClick={() => setWithdrawalAmount(availableBalance.toString())}
								>
									Withdraw Max
								</Button>
							</div>
							<Input
								id="withdraw-amount"
								type="number"
								min={minWithdrawalAmount}
								max={availableBalance}
								step="0.01"
								value={withdrawalAmount}
								onChange={(e) => setWithdrawalAmount(e.target.value)}
								placeholder={`Min: ${minWithdrawalAmount.toFixed(2)}`}
								className="font-mono"
								autoFocus
							/>
							<div className="flex items-center justify-between text-[11px]">
								<span className="text-muted-foreground">
									Minimum withdrawal: <span className="font-semibold text-foreground">{currency} {minWithdrawalAmount.toFixed(2)}</span>
								</span>
								{parsedAmount > 0 && parsedAmount < minWithdrawalAmount && (
									<span className="text-destructive font-medium">
										Below minimum ({currency} {minWithdrawalAmount.toFixed(2)})
									</span>
								)}
							</div>
							{parsedAmount > availableBalance && (
								<p className="text-[11px] text-destructive font-medium">
									Amount exceeds available balance ({currency} {availableBalance.toFixed(2)})
								</p>
							)}
						</div>

						{/* Live Fee Breakdown (Option B: 1 Free/week, then GHS 1.00) */}
						{parsedAmount >= minWithdrawalAmount && parsedAmount <= availableBalance && (
							<div className="rounded-lg border border-border/70 bg-muted/30 p-2.5 space-y-1.5 text-xs">
								<div className="flex items-center justify-between text-muted-foreground">
									<span>Gross Requested Amount:</span>
									<span className="font-mono font-medium text-foreground">
										{currency} {parsedAmount.toFixed(2)}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="flex items-center gap-1.5 text-muted-foreground">
										Transfer Fee:
										{isNextWithdrawalFree ? (
											<Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold">
												FREE (Weekly)
											</Badge>
										) : (
											<Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-medium">
												Paid by Organizer
											</Badge>
										)}
									</span>
									<span className={`font-mono font-medium ${isNextWithdrawalFree ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
										{isNextWithdrawalFree ? `${currency} 0.00` : `- ${currency} ${transferFee.toFixed(2)}`}
									</span>
								</div>
								<div className="border-t border-border/50 pt-1.5 flex items-center justify-between font-semibold">
									<span>Net Disbursed to Account:</span>
									<span className="font-mono text-primary font-bold text-sm">
										{currency} {netPayoutAmount.toFixed(2)}
									</span>
								</div>
							</div>
						)}

						{/* Memo Input */}
						<div className="space-y-1.5">
							<Label htmlFor="withdraw-memo" className="text-xs font-semibold">
								Memo / Reference (Optional)
							</Label>
							<Input
								id="withdraw-memo"
								value={withdrawalMemo}
								onChange={(e) => setWithdrawalMemo(e.target.value)}
								placeholder="e.g. Event ticket sales payout"
							/>
						</div>

						{/* T+1 Settlement Policy Note */}
						<div className="text-[11px] text-muted-foreground bg-muted/40 rounded-lg p-2.5 space-y-1 ">
							<div className="font-medium text-foreground flex items-center gap-1.5">
								Paystack Settlement & Clearance (T+1)
							</div>
							<p className="leading-normal">
								Withdrawals are disbursed directly via Paystack to your payout account. Payments clear into your withdrawable balance on T+1 business days (excluding weekends & Ghana public holidays).
							</p>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setIsWithdrawOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleProceedToConfirm}
							disabled={!isValidWithdrawalAmount}
						>
							Continue to Confirm
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Confirm Password Before Withdrawal */}
			<ConfirmPasswordDialog
				open={isConfirmOpen}
				onOpenChange={setIsConfirmOpen}
				title="Confirm Withdrawal Request"
				description={`You are about to submit a withdrawal of ${currency} ${parsedAmount > 0 ? parsedAmount.toFixed(2) : "0.00"} (${isNextWithdrawalFree ? "Free weekly payout" : `Fee: ${currency} ${calculatedFee.toFixed(2)}`} • Net to receive: ${currency} ${netPayoutAmount.toFixed(2)}) to your verified payout account (${organization.paystackAccountNumber || "MoMo/Bank"}). Please enter your password to authorize this transaction.`}
				confirmLabel="Authorize & Submit"
				onConfirm={handleConfirmedWithdraw}
			/>

		</>
	);
}
