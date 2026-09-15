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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmPasswordDialog } from "@/components/shared/ConfirmPasswordDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { requestWalletWithdrawal } from "@/lib/server-functions/wallet";
import type { ActivityLogRecord, PayoutRecord, Transaction, Wallet } from "@/lib/types/payment";
import { OrgPayoutSettings } from "./OrgPayoutSettings";
import { PayoutsHistoryTable } from "./PayoutsHistoryTable";
import { TransactionsTable } from "./TransactionsTable";
import { WalletBalanceSummary } from "./WalletBalanceSummary";

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
	const { canWithdraw } = usePermissions();

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

	const availableBalance =
		typeof (wallet as any)?.availableBalance === "number"
			? Number((wallet as any).availableBalance)
			: Math.max(0, (wallet?.balance ?? 0) - (wallet?.pendingDebits ?? 0));

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

	const parsedAmount = Number.parseFloat(withdrawalAmount);
	const isValidWithdrawalAmount =
		!Number.isNaN(parsedAmount) &&
		parsedAmount > 0 &&
		parsedAmount <= availableBalance;

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
		if (!isValidWithdrawalAmount) {
			toast.error(
				parsedAmount > availableBalance
					? `Amount exceeds available balance (${currency} ${availableBalance.toFixed(2)})`
					: "Please enter a valid withdrawal amount.",
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
			toast.success(result.message ?? "Withdrawal request submitted successfully!");
			setWithdrawalAmount("");
			setWithdrawalMemo("");
			setIsConfirmOpen(false);
			router.refresh();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to request withdrawal",
			);
		} finally {
			setIsSubmittingWithdrawal(false);
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
				{/* Top Header Card with Actions */}
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div>
						<h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
							<WalletIcon className="h-6 w-6" />
							Wallet & Payouts
						</h1>
						<p className="text-sm text-muted-foreground mt-0.5">
							Track revenue, settlements, and manage disbursement accounts.
						</p>
					</div>

					{/* Action Buttons in Head */}
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

				{/* Destination Account Notification / Info */}
				{hasPayoutAccount ? (
					<div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-lg border border-border/80 bg-card/60 text-xs">
						<div className="flex items-center gap-3">
							<div className="size-8 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
								<Landmark className="size-4" />
							</div>
							<div>
								<div className="font-semibold text-foreground flex items-center gap-1.5">
									<span>Payout Account:</span>
									<span className="font-medium text-emerald-700 dark:text-emerald-400">{organization.paystackAccountName}</span>
								</div>
								<div className="text-muted-foreground font-mono text-[11px]">
									{organization.paystackAccountNumber} {organization.paystackBankCode ? `• Bank/MoMo: ${organization.paystackBankCode}` : ""}
								</div>
							</div>
						</div>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setIsPayoutDrawerOpen(true)}
							className="text-xs h-7 text-primary hover:text-primary"
						>
							Change Account
						</Button>
					</div>
				) : (
					<div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-lg border border-amber-300 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 text-xs">
						<div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-300">
							<Landmark className="size-4 shrink-0" />
							<span>No payout account configured yet. Add your Mobile Money or Bank Account to disburse withdrawals.</span>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsPayoutDrawerOpen(true)}
							className="text-xs h-7 border-amber-300 dark:border-amber-800"
						>
							Configure Payout Account
						</Button>
					</div>
				)}

				{/* 1. Stats at the Top (Outside Tabs) */}
				<WalletBalanceSummary
					organizationId={organization.id}
					availableBalance={availableBalance}
					pendingBalance={pendingBalance}
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

				{/* 2. Unified Card with Standard Tabs & Search Bar */}
				<Card>
					<Tabs defaultValue="all" className="w-full">
						<CardHeader className="pb-4">
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
								{/* Standard Tabs */}
								<TabsList
									variant="brand"
									className="flex overflow-x-auto w-full sm:w-auto"
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
										<span>Payouts (Outflows)</span>
									</TabsTrigger>

									<TabsTrigger
										variant="brand"
										value="payouts"
										className="gap-1.5"
									>
										<Landmark className="h-4 w-4" />
										<span>Withdrawal Details ({totalPayouts})</span>
									</TabsTrigger>
								</TabsList>

								{/* Search Bar */}
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
						</CardHeader>

						<CardContent className="space-y-4">
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
									emptyTitle="No withdrawal history"
									emptyDescription="When you submit a withdrawal request, its destination account number, recipient, and processing status will appear here."
									emptyVariant="payment"
								/>
							</TabsContent>
						</CardContent>
					</Tabs>
				</Card>
			</div>

			{/* Payout Settings Drawer (Slide-out Sheet) */}
			<Sheet open={isPayoutDrawerOpen} onOpenChange={setIsPayoutDrawerOpen}>
				<SheetContent
					side="right"
					variant="brand"
					className="w-full sm:max-w-xl overflow-y-auto p-6"
				>
					<SheetHeader className="pb-4 border-b border-border/60">
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

					<div className="pt-6">
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
						<div className="bg-primary-50/70 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900/50 rounded-lg p-3 space-y-1.5">
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
							<div className="rounded-lg border border-border bg-card p-3 space-y-1 text-xs">
								<div className="font-semibold text-muted-foreground flex items-center gap-1.5">
									<CheckCircle2 className="size-3.5 text-emerald-500" />
									Disbursing To:
								</div>
								<div className="font-medium text-foreground">
									{organization.paystackAccountName}
								</div>
								<div className="font-mono text-muted-foreground">
									{organization.paystackAccountNumber} ({organization.paystackBankCode})
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
								min="1"
								max={availableBalance}
								step="0.01"
								value={withdrawalAmount}
								onChange={(e) => setWithdrawalAmount(e.target.value)}
								placeholder={`0.00`}
								className="font-mono"
								autoFocus
							/>
							{parsedAmount > availableBalance && (
								<p className="text-[11px] text-destructive font-medium">
									Amount exceeds available balance ({currency} {availableBalance.toFixed(2)})
								</p>
							)}
						</div>

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
						<div className="text-[11px] text-muted-foreground bg-muted/40 rounded-lg p-2.5 space-y-1 border border-border/50">
							<div className="font-medium text-foreground flex items-center gap-1.5">
								<Clock className="size-3 text-primary" />
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
				description={`You are about to transfer ${currency} ${parsedAmount > 0 ? parsedAmount.toFixed(2) : "0.00"} to your verified payout account (${organization.paystackAccountNumber || "MoMo/Bank"}). Please enter your password to authorize this transaction.`}
				confirmLabel="Authorize & Submit"
				onConfirm={handleConfirmedWithdraw}
			/>
		</>
	);
}
