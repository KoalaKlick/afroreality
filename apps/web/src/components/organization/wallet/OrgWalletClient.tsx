"use client";
// src/components/organization/wallet/OrgWalletClient.tsx

import {
	ArrowDownToLine,
	ArrowLeftRight,
	Calendar,
	ChevronDown,
	Clock,
	DollarSign,
	CheckCircle2,
	Landmark,
	Search,
	Wallet as WalletIcon,
	Lock,
	ShieldAlert,
	KeyRound,
	FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmPasswordDialog } from "@/components/shared/ConfirmPasswordDialog";
import { PayoutPolicyModal } from "@/components/shared/PayoutPolicyModal";
import Image from "next/image";
import refundableHeaderImg from "@/assets/refundable-bg.jpg";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
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
		phone?: string | null;
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
	organization: initialOrganization,
	wallet,
	transactions,
	totalTransactions,
	payouts = [],
	totalPayouts = 0,
	activityLogs = [],
}: OrgWalletClientProps) {
	const router = useRouter();
	const [organization, setOrganization] = useState(initialOrganization);

	useEffect(() => {
		setOrganization(initialOrganization);
	}, [initialOrganization]);

	const { canWithdraw, canManagePayouts } = usePermissions((organization as any).userRole);

	// Search filter state
	const [searchQuery, setSearchQuery] = useState("");

	// Event inflows list from wallet
	const eventInflows = useMemo(
		() => (wallet as any)?.eventInflows || [],
		[wallet],
	);

	// Event filter state for ledger
	const [selectedEventId, setSelectedEventId] = useState<string>("all");

	// Event reference for withdrawal
	const [withdrawalEventId, setWithdrawalEventId] = useState<string>("all");

	const selectedEvent = useMemo(
		() => eventInflows.find((e: any) => e.id === selectedEventId),
		[eventInflows, selectedEventId],
	);

	const selectedWithdrawalEvent = useMemo(
		() => eventInflows.find((e: any) => e.id === withdrawalEventId),
		[eventInflows, withdrawalEventId],
	);

	// Payout drawer state
	const [isPayoutDrawerOpen, setIsPayoutDrawerOpen] = useState(false);

	// Withdrawal dialog states
	const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [hasAgreedToPayoutPolicy, setHasAgreedToPayoutPolicy] = useState(false);
	const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
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

	// Filter by event and search query
	const filterTransactions = (list: Transaction[]) => {
		let result = list;
		if (selectedEventId !== "all") {
			result = result.filter(
				(t) => t.eventId === selectedEventId || (t.event && t.event.id === selectedEventId),
			);
		}
		if (!searchQuery.trim()) return result;
		const query = searchQuery.toLowerCase().trim();
		return result.filter((t) => {
			const refMatch = t.reference?.toLowerCase().includes(query);
			const descMatch = t.description?.toLowerCase().includes(query);
			const typeMatch = t.type?.toLowerCase().includes(query);
			const categoryMatch = t.category?.toLowerCase().includes(query);
			const amountMatch = t.amount?.toString().includes(query);
			const statusMatch = t.status?.toLowerCase().includes(query);
			const eventMatch = t.event?.title?.toLowerCase().includes(query);
			return refMatch || descMatch || typeMatch || categoryMatch || amountMatch || statusMatch || eventMatch;
		});
	};

	const filteredAll = useMemo(
		() => filterTransactions(transactions),
		[transactions, searchQuery, selectedEventId],
	);
	const filteredInflows = useMemo(
		() => filterTransactions(inflows),
		[inflows, searchQuery, selectedEventId],
	);
	const filteredOutflows = useMemo(
		() => filterTransactions(outflows),
		[outflows, searchQuery, selectedEventId],
	);

	const filteredPayouts = useMemo(() => {
		let result = payouts;
		if (selectedEventId !== "all") {
			result = result.filter(
				(p) =>
					p.eventId === selectedEventId ||
					(p.event && p.event.id === selectedEventId) ||
					(selectedEvent && p.notes && p.notes.includes(selectedEvent.title)),
			);
		}
		if (!searchQuery.trim()) return result;
		const query = searchQuery.toLowerCase().trim();
		return result.filter((p) => {
			const refMatch = p.reference?.toLowerCase().includes(query);
			const accMatch = p.accountNumber?.toLowerCase().includes(query);
			const nameMatch = p.accountName?.toLowerCase().includes(query);
			const bankMatch = p.bankName?.toLowerCase().includes(query);
			const statusMatch = p.status?.toLowerCase().includes(query);
			const notesMatch = p.notes?.toLowerCase().includes(query);
			const eventMatch = p.event?.title?.toLowerCase().includes(query);
			return refMatch || accMatch || nameMatch || bankMatch || statusMatch || notesMatch || eventMatch;
		});
	}, [payouts, searchQuery, selectedEventId, selectedEvent]);

	const eventOutflowAmount = useMemo(() => {
		if (selectedEventId === "all") return null;
		return filteredOutflows
			.filter((t) => t.status === "completed")
			.reduce((sum, t) => sum + Number(t.amount || 0), 0);
	}, [selectedEventId, filteredOutflows]);

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

	function handleWithdrawalEventChange(eventId: string) {
		setWithdrawalEventId(eventId);
		if (eventId === "all") {
			setWithdrawalMemo("");
		} else {
			const ev = eventInflows.find((e: any) => e.id === eventId);
			if (ev?.title) {
				setWithdrawalMemo(`${ev.title} Payout`);
			}
		}
	}

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
		// Preset optional event reference tag if currently filtered on the ledger
		const initialEventId = selectedEventId !== "all" ? selectedEventId : "all";
		setWithdrawalEventId(initialEventId);
		setWithdrawalAmount(availableBalance > 0 ? availableBalance.toFixed(2) : "");
		if (initialEventId !== "all") {
			const ev = eventInflows.find((e: any) => e.id === initialEventId);
			setWithdrawalMemo(ev?.title ? `${ev.title} Payout` : "");
		} else {
			setWithdrawalMemo("");
		}
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
		if (!hasAgreedToPayoutPolicy) {
			toast.error("Please review and agree to the Payout Policy before continuing.");
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
					eventId: withdrawalEventId !== "all" ? withdrawalEventId : undefined,
				},
			});

			setIsConfirmOpen(false);
			setWithdrawalAmount("");
			setWithdrawalMemo("");
			setWithdrawalEventId("all");

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

			<div className="flex flex-1 flex-col gap-4 sm:gap-6">
				{/* 1. Status Cards at the Very Top */}
				<WalletBalanceSummary
					organizationId={organization.id}
					availableBalance={availableBalance}
					ledgerBalance={ledgerBalance}
					pendingBalance={pendingBalance}
					pendingDebits={pendingDebits}
					isLocked={!!wallet?.isLocked}
					eventFilterTitle={selectedEvent ? selectedEvent.title : null}
					eventFilterInflow={selectedEvent ? Number(selectedEvent.totalInflow || 0) : null}
					totalRevenue={
						typeof (wallet as any)?.totalInflows === "number"
							? Number((wallet as any).totalInflows)
							: totalInflowAmount > 0
								? totalInflowAmount
								: availableBalance + (wallet?.pendingCredits ?? 0)
					}
					totalWithdrawn={
						eventOutflowAmount !== null
							? eventOutflowAmount
							: typeof (wallet as any)?.totalPayouts === "number"
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
							<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
								<TabsList
									variant="brand"
									className="flex overflow-x-auto p-1.5 gap-1.5 rounded-sm"
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
										<span>
											Payout History ({selectedEventId !== "all" ? filteredPayouts.length : totalPayouts})
										</span>
									</TabsTrigger>
								</TabsList>

								{/* Event Filter Select button at the right side of the tabs */}
								{eventInflows.length > 0 && (
									<div className="flex items-center gap-2 shrink-0 self-start md:self-center">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="outline"
													size="sm"
													className="h-9 w-full sm:w-[240px] justify-between text-xs bg-background font-normal gap-2 shadow-xs"
												>
													<div className="flex items-center gap-2 truncate">
														<Calendar className="size-3.5 text-muted-foreground shrink-0" />
														<span className="truncate font-medium">
															{selectedEventId === "all"
																? "All Events"
																: eventInflows.find((e: any) => e.id === selectedEventId)?.title || "Filter by Event"}
														</span>
													</div>
													<ChevronDown className="size-3.5 opacity-50 shrink-0" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end" className="w-72 max-h-80 overflow-y-auto">
												<DropdownMenuRadioGroup value={selectedEventId} onValueChange={setSelectedEventId}>
													<DropdownMenuRadioItem value="all" className="flex items-center justify-between cursor-pointer py-2">
														<span className="font-medium">All Events</span>
														<span className="text-[10px] text-muted-foreground font-mono">
															{currency} {totalInflowAmount.toFixed(2)}
														</span>
													</DropdownMenuRadioItem>
													<DropdownMenuSeparator />
													{eventInflows.map((ev: any) => (
														<DropdownMenuRadioItem
															key={ev.id}
															value={ev.id}
															className="flex items-center justify-between cursor-pointer py-2"
														>
															<span className="truncate font-medium">{ev.title}</span>
															<div className="flex items-center gap-1.5 shrink-0 ml-2">
																{ev.isOngoing && (
																	<span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 rounded border border-emerald-500/20">
																		<span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
																		Ongoing
																	</span>
																)}
																<span className="text-[10px] text-muted-foreground font-mono">
																	{currency} {Number(ev.totalInflow || 0).toFixed(2)}
																</span>
															</div>
														</DropdownMenuRadioItem>
													))}
												</DropdownMenuRadioGroup>
											</DropdownMenuContent>
										</DropdownMenu>

										{selectedEventId !== "all" && (
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setSelectedEventId("all")}
												className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0"
												title="Clear filter"
											>
												Reset
											</Button>
										)}
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					{/* 3. Table Card separated from Header Card */}
					<Card>
						<CardContent className="pt-6 space-y-4">
							{/* Search Bar */}
							<div className="flex items-center justify-between gap-3">
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
								{searchQuery && (
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setSearchQuery("")}
										className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0"
									>
										Clear Search
									</Button>
								)}
							</div>

							{/* Tab 1: All Activity */}
							<TabsContent value="all" className="m-0 space-y-4">
								<TransactionsTable
									transactions={filteredAll}
									total={filteredAll.length}
									onSelectEvent={(id) => setSelectedEventId(id)}
									emptyTitle="No transactions found"
									emptyDescription={
										searchQuery || selectedEventId !== "all"
											? "No transactions match your current search or event filter."
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
									onSelectEvent={(id) => setSelectedEventId(id)}
									emptyTitle="No revenue records found"
									emptyDescription={
										searchQuery || selectedEventId !== "all"
											? "No revenue records match your current search or event filter."
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
									onSelectEvent={(id) => setSelectedEventId(id)}
									emptyTitle="No payout records found"
									emptyDescription={
										searchQuery || selectedEventId !== "all"
											? "No payout records match your search or event filter."
											: "Disbursements and withdrawals to your payout account will appear here."
									}
									emptyVariant="payment"
								/>
							</TabsContent>

							{/* Tab 4: Detailed Payout History */}
							<TabsContent value="payouts" className="m-0 space-y-4">
								<PayoutsHistoryTable
									payouts={filteredPayouts}
									total={filteredPayouts.length}
									onCancelPayout={(payout) => handleCancelPayout(payout.id)}
									onSyncPayout={handleSyncPayout}
									emptyTitle="No withdrawal history"
									emptyDescription={
										searchQuery || selectedEventId !== "all"
											? "No payout records match your current search or event filter."
											: "When you submit a withdrawal request, its destination account number, recipient, and processing status will appear here."
									}
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
					className="w-full sm:max-w-2xl flex flex-col h-full p-0 overflow-hidden"
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
							key={`${organization.id}-${organization.paystackAccountNumber || "none"}`}
							organization={organization}
							onSuccess={(updated) => {
								if (updated) {
									setOrganization((prev) => ({
										...prev,
										paystackBankCode: updated.bankCode,
										paystackAccountNumber: updated.accountNumber,
										paystackAccountName: updated.accountName,
										subaccountCode: updated.subaccountCode ?? prev.subaccountCode,
									}));
								}
								router.refresh();
							}}
						/>
					</div>
				</SheetContent>
			</Sheet>

			{/* Withdrawal Modal Dialog */}
			<Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
				<DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xl rounded-xl gap-0">
					{/* Accessible Title & Description */}
					<DialogTitle className="sr-only">Request Withdrawal</DialogTitle>
					<DialogDescription className="sr-only">Transfer available funds directly to your verified payout account.</DialogDescription>

					{/* Clean Header Banner Image */}
					<div className="relative w-full h-32 sm:h-28 overflow-hidden bg-zinc-100 dark:bg-zinc-800/60 border-b border-zinc-200/80 dark:border-zinc-800">
						<Image
							src={refundableHeaderImg}
							alt="Request Withdrawal"
							fill
							priority
							className="object-cover object-center"
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
						<div className="absolute bottom-3 left-5 right-5 flex items-end justify-between text-white">
							<div>
								<div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
									<ArrowDownToLine className="size-3.5" />
									<span>Instant Settlement Request</span>
								</div>
								<div className="text-base font-bold text-white tracking-tight mt-0.5">
									Request Withdrawal
								</div>
							</div>
							<Badge className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border-white/20 text-[10px] px-2 py-0.5 font-mono">
								Paystack
							</Badge>
						</div>
					</div>

					<div className="p-5 sm:p-6 space-y-4 dark:bg-zinc-900/60">
						{/* Clean Unified Summary Card */}
						<div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-2.5">
							<div className="flex items-center justify-between">
								<span className="text-xs text-muted-foreground font-medium">Available to Withdraw:</span>
								<span className="font-mono font-bold text-base text-foreground">
									{currency} {availableBalance.toFixed(2)}
								</span>
							</div>
							{hasPayoutAccount && (
								<div className="flex items-center justify-between border-t border-border/50 pt-2 text-xs">
									<div className="text-muted-foreground flex items-center gap-2 space-x-2">
										<ProviderLogo
											bankCode={organization.paystackBankCode}
											className="size-5 shrink-0"
											imageClassName="h-3.5 w-auto"
										/>
										<p>Payout Account:</p>
									</div>
									<div className="flex items-center gap-1.5 text-right">
										<span className="font-medium text-foreground truncate max-w-[180px]">
											{organization.paystackAccountName}
										</span>
										<span className="font-mono text-muted-foreground text-[11px]">
											({organization.paystackAccountNumber})
										</span>
									</div>
								</div>
							)}
							{(wallet as any)?.pendingSettlement > 0 && (
								<div className="flex items-center justify-between border-t border-border/50 pt-2 text-[11px] text-amber-600 dark:text-amber-400">
									<span className="flex items-center gap-1">
										<Clock className="size-3 shrink-0" />
										Pending T+1 Settlement:
									</span>
									<span className="font-mono font-semibold">
										{currency} {Number((wallet as any).pendingSettlement).toFixed(2)}
									</span>
								</div>
							)}
						</div>

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
									onClick={() =>
										setWithdrawalAmount(
											availableBalance > 0 ? availableBalance.toFixed(2) : "0",
										)
									}
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
								className="font-mono text-base h-10"
								autoFocus
							/>
							<div className="flex items-center justify-between text-[11px] text-muted-foreground">
								<span>
									Minimum: <strong className="text-foreground font-medium">{currency} {minWithdrawalAmount.toFixed(2)}</strong>
								</span>
								{parsedAmount > 0 && parsedAmount < minWithdrawalAmount && (
									<span className="text-destructive font-medium">Below minimum</span>
								)}
								{parsedAmount > availableBalance && (
									<span className="text-destructive font-medium">Exceeds available balance</span>
								)}
							</div>
						</div>

						{/* Live Fee Breakdown Pill */}
						{parsedAmount >= minWithdrawalAmount && parsedAmount <= availableBalance && (
							<div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 flex items-center justify-between text-xs">
								<div className="flex items-center gap-1.5 text-muted-foreground">
									<span>Fee:</span>
									{isNextWithdrawalFree ? (
										<Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold">
											FREE (Weekly)
										</Badge>
									) : (
										<span className="font-mono font-medium text-foreground">{currency} {transferFee.toFixed(2)}</span>
									)}
								</div>
								<div className="flex items-center gap-1.5">
									<span className="text-muted-foreground">Net Payout:</span>
									<span className="font-mono text-primary font-bold text-sm">
										{currency} {netPayoutAmount.toFixed(2)}
									</span>
								</div>
							</div>
						)}

						{/* Reference Section (Side-by-side) */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
							{/* Event Tag */}
							{eventInflows.length > 0 && (
								<div className="space-y-1.5">
									<div className="flex items-center justify-between">
										<Label htmlFor="withdraw-event" className="text-xs font-semibold">
											Event Tag (Optional)
										</Label>
										{withdrawalEventId !== "all" && (
											<button
												type="button"
												className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
												onClick={() => handleWithdrawalEventChange("all")}
											>
												Clear
											</button>
										)}
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												id="withdraw-event"
												variant="outline"
												size="sm"
												className="h-9 w-full justify-between text-xs bg-background font-normal"
											>
												<span className="truncate">
													{withdrawalEventId === "all"
														? "General (All Events)"
														: eventInflows.find((e: any) => e.id === withdrawalEventId)?.title || "Select Event"}
												</span>
												<ChevronDown className="size-3.5 opacity-50 shrink-0 ml-1.5" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-60 overflow-y-auto">
											<DropdownMenuRadioGroup value={withdrawalEventId} onValueChange={handleWithdrawalEventChange}>
												<DropdownMenuRadioItem value="all" className="py-2 text-xs cursor-pointer">
													<span className="font-medium">General (All Events)</span>
												</DropdownMenuRadioItem>
												<DropdownMenuSeparator />
												{eventInflows.map((ev: any) => (
													<DropdownMenuRadioItem
														key={ev.id}
														value={ev.id}
														className="py-2 text-xs cursor-pointer flex items-center justify-between"
													>
														<span className="truncate font-medium">{ev.title}</span>
														{ev.isOngoing && (
															<span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 rounded border border-emerald-500/20 ml-2 shrink-0">
																Ongoing
															</span>
														)}
													</DropdownMenuRadioItem>
												))}
											</DropdownMenuRadioGroup>
										</DropdownMenuContent>
									</DropdownMenu>
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
									placeholder="e.g. Ticket sales payout"
									className="h-9 text-xs"
								/>
							</div>
						</div>

						{/* Policy Consent Box */}
						<div className="rounded-xl border border-border/80 bg-muted/30 p-3 space-y-2">
							<div className="flex items-start space-x-2.5">
								<Checkbox
									id="wallet-payout-consent"
									checked={hasAgreedToPayoutPolicy}
									onCheckedChange={(checked) => setHasAgreedToPayoutPolicy(checked === true)}
									className="mt-0.5 shrink-0"
								/>
								<Label
									htmlFor="wallet-payout-consent"
									className="text-xs text-foreground/90 font-normal leading-relaxed cursor-pointer"
								>
									I confirm that I have read and agree to the{" "}
									<button
										type="button"
										onClick={(e) => {
											e.preventDefault();
											setIsPolicyModalOpen(true);
										}}
										className="text-primary font-semibold underline underline-offset-2 hover:opacity-80"
									>
										Platform Settlement & Payout Policy
									</button>
									. I acknowledge the T+1 settlement cycle, transfer fee schedule, and event cooling periods.
								</Label>
							</div>
							<div className="flex justify-end pt-0.5 border-t border-border/50">
								<Button
									type="button"
									variant="link"
									size="sm"
									onClick={() => setIsPolicyModalOpen(true)}
									className="h-auto p-0 text-xs font-semibold text-primary inline-flex items-center gap-1"
								>
									<FileText className="size-3.5" />
									View Official Payout Policy (PDF)
								</Button>
							</div>
						</div>
					</div>

					<DialogFooter className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0 gap-2 sm:gap-0">
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
							disabled={!isValidWithdrawalAmount || !hasAgreedToPayoutPolicy}
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
				description={`You are about to submit a withdrawal of ${currency} ${parsedAmount > 0 ? parsedAmount.toFixed(2) : "0.00"}${selectedWithdrawalEvent ? ` for "${selectedWithdrawalEvent.title}"` : ""} (${isNextWithdrawalFree ? "Free weekly payout" : `Fee: ${currency} ${calculatedFee.toFixed(2)}`} • Net to receive: ${currency} ${netPayoutAmount.toFixed(2)}) to your verified payout account (${organization.paystackAccountNumber || "MoMo/Bank"}). Please enter your password to authorize this transaction.`}
				confirmLabel="Authorize & Submit"
				onConfirm={handleConfirmedWithdraw}
			/>

			{/* Official PDF Document Viewer Modal */}
			<PayoutPolicyModal
				open={isPolicyModalOpen}
				onOpenChange={setIsPolicyModalOpen}
				rules={{
					minAmount: minWithdrawalAmount,
					transferFee: transferFee,
					freePerWeek: (wallet as any)?.freeWithdrawalsPerWeek ?? 1,
					minEventAgeDays: (wallet as any)?.minEventAgeDays ?? 7,
					residualAutoPayoutDays: (wallet as any)?.residualAutoPayoutDays ?? 14,
					currency: currency,
				}}
			/>

		</>
	);
}
