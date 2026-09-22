"use client";

import React, { useState, useTransition } from "react";
import {
	Wallet,
	Search,
	Lock,
	Unlock,
	SlidersHorizontal,
	CheckCircle2,
	XCircle,
	Clock,
	Shield,
	KeyRound,
	RotateCw,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatAmount } from "@/lib/utils";
import type { AdminWalletItem, AdminPayoutItem } from "@/lib/dal/admin";
import {
	adminLockWallet,
	adminToggleAutoPayout,
	adminApprovePayout,
	adminRejectPayout,
	adminFinalizePayoutOtp,
	adminSyncPayoutStatus,
} from "@/lib/server-functions/admin";

interface AdminWalletsContentProps {
	wallets: AdminWalletItem[];
	recentPayouts: AdminPayoutItem[];
	pendingApprovals: AdminPayoutItem[];
	floatSummary: {
		totalActiveGHS: number;
		totalLockedGHS: number;
		pendingDebitsGHS: number;
		pendingCreditsGHS: number;
	};
}

export function AdminWalletsContent({
	wallets,
	recentPayouts,
	pendingApprovals,
	floatSummary,
}: AdminWalletsContentProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [lockDialogWallet, setLockDialogWallet] = useState<AdminWalletItem | null>(null);
	const [lockReason, setLockReason] = useState("");
	const [isPending, startTransition] = useTransition();

	// Approve flow state
	const [approveTarget, setApproveTarget] = useState<AdminPayoutItem | null>(null);
	const [isApproving, setIsApproving] = useState(false);

	// OTP flow state
	const [otpTarget, setOtpTarget] = useState<{ payout: AdminPayoutItem; transferCode: string } | null>(null);
	const [otpValue, setOtpValue] = useState("");

	// Reject flow state
	const [rejectTarget, setRejectTarget] = useState<AdminPayoutItem | null>(null);
	const [rejectReason, setRejectReason] = useState("");

	const filteredWallets = wallets.filter((w) => {
		const q = searchQuery.toLowerCase();
		return (
			w.organizationName.toLowerCase().includes(q) ||
			w.organizationSlug.toLowerCase().includes(q) ||
			(w.accountName && w.accountName.toLowerCase().includes(q)) ||
			(w.accountNumber && w.accountNumber.includes(q))
		);
	});

	const handleConfirmLock = () => {
		if (!lockDialogWallet) return;
		const nextLocked = !lockDialogWallet.isLocked;

		startTransition(async () => {
			const res = await adminLockWallet({
				walletId: lockDialogWallet.id,
				isLocked: nextLocked,
				lockReason: lockReason.trim() || undefined,
			});

			if (res.success) {
				toast.success(res.message);
				setLockDialogWallet(null);
				setLockReason("");
			} else {
				toast.error(res.error || "Failed to update wallet lock status");
			}
		});
	};

	const handleToggleAutoPayout = (wallet: AdminWalletItem) => {
		if (!wallet.organizationId) return;
		const nextState = !wallet.autoPayout;

		startTransition(async () => {
			const res = await adminToggleAutoPayout({
				organizationId: wallet.organizationId,
				autoPayout: nextState,
			});

			if (res.success) {
				toast.success(res.message);
			} else {
				toast.error(res.error || "Failed to update auto-payout");
			}
		});
	};

	const handleApprovePayout = () => {
		if (!approveTarget) return;
		setIsApproving(true);

		startTransition(async () => {
			try {
				const res = await adminApprovePayout({ payoutId: approveTarget.id });

				if (res.success) {
					if (res.requiresOtp && res.transferCode) {
						// Transfer needs OTP — show OTP dialog
						setOtpTarget({ payout: approveTarget, transferCode: res.transferCode });
						setApproveTarget(null);
						toast.info(res.message || "OTP required. Check your email/phone.");
					} else {
						toast.success(res.message || "Payout approved!");
						setApproveTarget(null);
					}
				} else {
					toast.error(res.error || "Failed to approve payout.");
				}
			} catch (err: any) {
				toast.error(err?.message || "An error occurred.");
			} finally {
				setIsApproving(false);
			}
		});
	};

	const handleFinalizeOtp = () => {
		if (!otpTarget || !otpValue.trim()) return;

		startTransition(async () => {
			try {
				const res = await adminFinalizePayoutOtp({
					payoutId: otpTarget.payout.id,
					transferCode: otpTarget.transferCode,
					otp: otpValue.trim(),
				});

				if (res.success) {
					toast.success(res.message || "Payout completed!");
					setOtpTarget(null);
					setOtpValue("");
				} else {
					toast.error(res.error || "OTP verification failed.");
				}
			} catch (err: any) {
				toast.error(err?.message || "An error occurred.");
			}
		});
	};

	const handleRejectPayout = () => {
		if (!rejectTarget) return;

		startTransition(async () => {
			try {
				const res = await adminRejectPayout({
					payoutId: rejectTarget.id,
					reason: rejectReason.trim() || undefined,
				});

				if (res.success) {
					toast.success(res.message || "Payout rejected.");
					setRejectTarget(null);
					setRejectReason("");
				} else {
					toast.error(res.error || "Failed to reject payout.");
				}
			} catch (err: any) {
				toast.error(err?.message || "An error occurred.");
			}
		});
	};

	const [syncingId, setSyncingId] = useState<string | null>(null);

	const handleSyncPayout = (p: AdminPayoutItem) => {
		setSyncingId(p.id);
		startTransition(async () => {
			try {
				const res = await adminSyncPayoutStatus({
					payoutId: p.id,
					reference: p.reference,
				});
				if (res.success) {
					toast.success(res.message);
				} else {
					toast.error(res.message || "Failed to sync status with Paystack.");
				}
			} catch (err: any) {
				toast.error(err?.message || "An error occurred while syncing.");
			} finally {
				setSyncingId(null);
			}
		});
	};

	return (
		<div className="flex flex-col gap-6 rounded-none shadow-none">
			{/* Float Summary Cards - Flat & Sharp */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 rounded-none shadow-none">
				<Card className="border border-border bg-card rounded-none shadow-none">
					<CardHeader className="pb-2">
						<CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
							Active Escrow Float
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
							{formatAmount(floatSummary.totalActiveGHS, "GHS")}
						</div>
						<p className="text-[11px] text-muted-foreground mt-1">
							Live funds held for active organizers
						</p>
					</CardContent>
				</Card>

				<Card className="border border-border bg-card rounded-none shadow-none">
					<CardHeader className="pb-2">
						<CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
							Frozen Float (Compliance)
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 font-mono">
							{formatAmount(floatSummary.totalLockedGHS, "GHS")}
						</div>
						<p className="text-[11px] text-muted-foreground mt-1">
							Held on administrative lock
						</p>
					</CardContent>
				</Card>

				<Card className="border border-border bg-card rounded-none shadow-none">
					<CardHeader className="pb-2">
						<CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
							Pending Clearing Credits
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold tracking-tight text-foreground font-mono">
							{formatAmount(floatSummary.pendingCreditsGHS, "GHS")}
						</div>
						<p className="text-[11px] text-muted-foreground mt-1">
							Inbound card & mobile money settling
						</p>
					</CardContent>
				</Card>

				<Card className="border border-border bg-card rounded-none shadow-none">
					<CardHeader className="pb-2">
						<CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
							Pending Outbound Debits
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold tracking-tight text-foreground font-mono">
							{formatAmount(floatSummary.pendingDebitsGHS, "GHS")}
						</div>
						<p className="text-[11px] text-muted-foreground mt-1">
							Payout disbursements processing
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Tabs: Wallets vs Approval Queue vs Payouts */}
			<Tabs defaultValue={pendingApprovals.length > 0 ? "approvals" : "wallets"} className="w-full rounded-none shadow-none">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 rounded-none shadow-none">
					<TabsList className="bg-muted/50 border border-border rounded-none shadow-none p-0">
						<TabsTrigger value="wallets" className="text-xs font-semibold rounded-none shadow-none">
							Organizer Wallets ({wallets.length})
						</TabsTrigger>
						<TabsTrigger value="approvals" className="text-xs font-semibold rounded-none shadow-none relative">
							Approval Queue
							{pendingApprovals.length > 0 && (
								<span className="ml-1.5 inline-flex items-center justify-center h-5 min-w-5 px-1 text-[10px] font-bold bg-rose-500 text-white rounded-full">
									{pendingApprovals.length}
								</span>
							)}
						</TabsTrigger>
						<TabsTrigger value="payouts" className="text-xs font-semibold rounded-none shadow-none">
							Payouts Audit ({recentPayouts.length})
						</TabsTrigger>
					</TabsList>

					<div className="relative min-w-[240px] max-w-sm">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search by organizer or account..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9 bg-background text-xs rounded-none shadow-none border-border"
						/>
					</div>
				</div>

				{/* 1. Wallets Tab */}
				<TabsContent value="wallets" className="space-y-4">
					{filteredWallets.length === 0 ? (
						<Card className="border border-border rounded-none shadow-none">
							<CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
								<Wallet className="h-10 w-10 mb-3 opacity-40" />
								<h3 className="text-base font-semibold text-foreground">No wallets found</h3>
							</CardContent>
						</Card>
					) : (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 rounded-none shadow-none">
							{filteredWallets.map((w) => (
								<Card key={w.id} className="border border-border bg-card rounded-none shadow-none">
									<CardHeader className="pb-3 border-b border-border rounded-none shadow-none">
										<div className="flex items-start justify-between gap-3">
											<div className="flex items-center gap-2.5 min-w-0">
												<Avatar className="h-8 w-8 rounded-none shadow-none border border-border shrink-0">
													<AvatarImage src={w.organizationLogo || ""} />
													<AvatarFallback className="bg-primary/10 text-primary font-bold text-xs rounded-none">
														{w.organizationName.slice(0, 2).toUpperCase()}
													</AvatarFallback>
												</Avatar>
												<div className="min-w-0">
													<CardTitle className="text-sm font-bold text-foreground truncate">
														{w.organizationName}
													</CardTitle>
													<CardDescription className="text-xs truncate font-mono">
														/{w.organizationSlug}
													</CardDescription>
												</div>
											</div>

											{w.isLocked ? (
												<Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 text-[9px] font-bold uppercase rounded-none shadow-none">
													Locked
												</Badge>
											) : (
												<Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 text-[9px] font-bold uppercase rounded-none shadow-none">
													Active
												</Badge>
											)}
										</div>
									</CardHeader>

									<CardContent className="space-y-3 pt-3 text-xs rounded-none shadow-none">
										<div className="p-3 bg-muted/30 border border-border space-y-2 rounded-none shadow-none">
											<div className="flex items-center justify-between">
												<span className="text-muted-foreground">Available Balance:</span>
												<span className="text-base font-bold text-foreground font-mono">
													{formatAmount(w.balance, w.currency)}
												</span>
											</div>
											<div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border">
												<span>Auto-Payout:</span>
												<span className="font-semibold text-foreground">
													{w.autoPayout ? "Enabled (Automatic)" : "Disabled (Manual)"}
												</span>
											</div>
											{w.accountNumber && (
												<div className="flex items-center justify-between text-muted-foreground">
													<span>Bank Account:</span>
													<span className="font-mono text-foreground">
														{w.accountNumber} ({w.accountName || "Bank"})
													</span>
												</div>
											)}
										</div>

										{w.lockReason && (
											<div className="p-2 bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 rounded-none shadow-none">
												<strong>Lock Reason:</strong> {w.lockReason}
											</div>
										)}

										<div className="flex items-center gap-2 pt-1">
											<Button
												variant="outline"
												size="sm"
												disabled={isPending}
												onClick={() => handleToggleAutoPayout(w)}
												className="flex-1 text-xs rounded-none shadow-none border-border"
											>
												<SlidersHorizontal className="h-3 w-3 mr-1" />
												{w.autoPayout ? "Disable Auto" : "Enable Auto"}
											</Button>

											<Button
												variant={w.isLocked ? "default" : "destructive"}
												size="sm"
												disabled={isPending}
												onClick={() => {
													setLockDialogWallet(w);
													setLockReason(w.lockReason || "");
												}}
												className="flex-1 text-xs font-semibold rounded-none shadow-none"
											>
												{w.isLocked ? (
													<>
														<Unlock className="h-3 w-3 mr-1" />
														Unlock
													</>
												) : (
													<>
														<Lock className="h-3 w-3 mr-1" />
														Lock
													</>
												)}
											</Button>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</TabsContent>

				{/* 2. Approval Queue Tab */}
				<TabsContent value="approvals">
					<Card className="border border-border rounded-none shadow-none">
						<CardHeader className="pb-3 border-b border-border">
							<div className="flex items-center gap-2">
								<Shield className="h-4 w-4 text-primary" />
								<CardTitle className="text-sm font-bold">Payout Approval Queue</CardTitle>
							</div>
							<CardDescription className="text-xs">
								Organizer withdrawal requests awaiting your approval. Approving triggers the Paystack transfer.
							</CardDescription>
						</CardHeader>
						<CardContent className="p-0">
							{pendingApprovals.length === 0 ? (
								<div className="py-16 text-center text-muted-foreground text-xs">
									<Clock className="h-8 w-8 mx-auto mb-3 opacity-30" />
									<p className="font-semibold text-foreground text-sm">No pending approvals</p>
									<p className="mt-1">All payout requests have been processed.</p>
								</div>
							) : (
								<div className="divide-y divide-border">
									{pendingApprovals.map((p) => {
										const isProcessing = p.status === "processing";
										return (
											<div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
												<div className="min-w-0 flex-1">
													<div className="flex items-center gap-2 flex-wrap">
														{isProcessing ? (
															<Badge
																variant="outline"
																className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[9px] uppercase font-bold rounded-none shadow-none"
															>
																Awaiting OTP / Processing
															</Badge>
														) : (
															<Badge
																variant="outline"
																className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-[9px] uppercase font-bold rounded-none shadow-none"
															>
																Pending Approval
															</Badge>
														)}
														<span className="font-mono text-xs text-muted-foreground truncate">
															{p.reference}
														</span>
														{p.providerReference && (
															<span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5">
																{p.providerReference}
															</span>
														)}
													</div>

													<p className="font-bold text-sm text-foreground mt-1.5">
														{p.recipientName}
														{p.wallet?.organization && (
															<span className="font-normal text-muted-foreground ml-1">
																({p.wallet.organization.name})
															</span>
														)}
													</p>

													<div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
														<span>{p.bankName || p.bankCode || "Bank"}</span>
														<span>•</span>
														<span className="font-mono">{p.accountNumber || "N/A"}</span>
														<span>•</span>
														<span>Requested: {new Date(p.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
													</div>

													{p.description && (
														<p className="text-[11px] text-muted-foreground mt-1 italic">
															&quot;{p.description}&quot;
														</p>
													)}
												</div>

												<div className="flex items-center gap-3 shrink-0">
													<div className="text-right mr-2">
														<p className="text-lg font-bold text-foreground font-mono">
															{formatAmount(p.amount, p.currency)}
														</p>
													</div>

													{isProcessing ? (
														<>
															<Button
																variant="default"
																size="sm"
																disabled={isPending}
																onClick={() => {
																	setOtpTarget({ payout: p, transferCode: p.providerReference || "" });
																	setOtpValue("");
																}}
																className="text-xs font-semibold rounded-none shadow-none bg-amber-600 hover:bg-amber-700 text-white"
															>
																<KeyRound className="h-3.5 w-3.5 mr-1" />
																Enter OTP
															</Button>

															<Button
																variant="outline"
																size="sm"
																disabled={isPending || syncingId === p.id}
																onClick={() => handleSyncPayout(p)}
																className="text-xs font-semibold rounded-none shadow-none"
																title="Check Paystack status"
															>
																<RotateCw className={`h-3.5 w-3.5 mr-1 ${syncingId === p.id ? "animate-spin" : ""}`} />
																Sync
															</Button>

															<Button
																variant="destructive"
																size="sm"
																disabled={isPending}
																onClick={() => {
																	setRejectTarget(p);
																	setRejectReason("");
																}}
																className="text-xs font-semibold rounded-none shadow-none"
															>
																<XCircle className="h-3.5 w-3.5 mr-1" />
																Reject
															</Button>
														</>
													) : (
														<>
															<Button
																variant="default"
																size="sm"
																disabled={isPending || isApproving}
																onClick={() => setApproveTarget(p)}
																className="text-xs font-semibold rounded-none shadow-none bg-emerald-600 hover:bg-emerald-700 text-white"
															>
																<CheckCircle2 className="h-3.5 w-3.5 mr-1" />
																Approve
															</Button>

															<Button
																variant="destructive"
																size="sm"
																disabled={isPending}
																onClick={() => {
																	setRejectTarget(p);
																	setRejectReason("");
																}}
																className="text-xs font-semibold rounded-none shadow-none"
															>
																<XCircle className="h-3.5 w-3.5 mr-1" />
																Reject
															</Button>
														</>
													)}
												</div>
											</div>
										);
									})}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* 3. Payouts Audit Tab */}
				<TabsContent value="payouts">
					<Card className="border border-border rounded-none shadow-none">
						<CardContent className="p-0">
							{recentPayouts.length === 0 ? (
								<div className="py-16 text-center text-muted-foreground text-xs">
									No payouts processed yet on the platform.
								</div>
							) : (
								<div className="divide-y divide-border overflow-x-auto">
									{recentPayouts.map((p) => (
										<div key={p.id} className="p-4 flex items-center justify-between gap-4 text-xs">
											<div className="min-w-0 flex-1">
												<div className="flex items-center gap-2">
													<Badge
														variant="outline"
														className={`text-[9px] uppercase font-bold rounded-none shadow-none ${
															p.status === "completed"
																? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
																: p.status === "failed"
																? "bg-rose-500/10 text-rose-600 border-rose-500/30"
																: "bg-amber-500/10 text-amber-600 border-amber-500/30"
														}`}
													>
														{p.status}
													</Badge>
													<span className="font-mono text-muted-foreground truncate">
														{p.reference}
													</span>
													{p.providerReference && (
														<span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5">
															{p.providerReference}
														</span>
													)}
												</div>

												<p className="font-bold text-foreground mt-1">
													{p.recipientName} {p.wallet?.organization ? `(${p.wallet.organization.name})` : ""}
												</p>

												<p className="text-muted-foreground text-[11px] mt-0.5">
													{p.bankName || "Bank"} • {p.accountNumber || "N/A"} • Processed: {new Date(p.createdAt).toLocaleDateString()}
												</p>
											</div>

											<div className="flex items-center gap-3 shrink-0">
												<div className="text-right">
													<p className="text-sm font-bold text-foreground font-mono">
														{formatAmount(p.amount, p.currency)}
													</p>
													{p.approver && (
														<p className="text-[10px] text-muted-foreground">
															Approved by: {p.approver.fullName}
														</p>
													)}
												</div>

												{p.status === "processing" && (
													<div className="flex items-center gap-1.5">
														<Button
															variant="outline"
															size="sm"
															disabled={isPending}
															onClick={() => {
																setOtpTarget({ payout: p, transferCode: p.providerReference || "" });
																setOtpValue("");
															}}
															className="text-[11px] h-7 px-2 font-semibold rounded-none shadow-none text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
														>
															<KeyRound className="h-3 w-3 mr-1" />
															OTP
														</Button>
														<Button
															variant="ghost"
															size="sm"
															disabled={isPending || syncingId === p.id}
															onClick={() => handleSyncPayout(p)}
															className="text-[11px] h-7 px-2 font-semibold rounded-none shadow-none text-muted-foreground hover:text-foreground"
															title="Sync status"
														>
															<RotateCw className={`h-3 w-3 ${syncingId === p.id ? "animate-spin" : ""}`} />
														</Button>
													</div>
												)}
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Lock / Unlock Dialog */}
			<Dialog open={!!lockDialogWallet} onOpenChange={(open) => !open && setLockDialogWallet(null)}>
				<DialogContent className="sm:max-w-md border border-border rounded-none shadow-none">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							{lockDialogWallet?.isLocked ? (
								<>
									<Unlock className="h-5 w-5 text-emerald-500" />
									Unlock Organization Wallet
								</>
							) : (
								<>
									<Lock className="h-5 w-5 text-destructive" />
									Lock Organization Wallet
								</>
							)}
						</DialogTitle>
						<DialogDescription className="text-xs">
							{lockDialogWallet?.isLocked
								? `Unlock wallet for "${lockDialogWallet?.organizationName}". Organizer will be able to process payouts and withdrawals again.`
								: `Locking this wallet will freeze all payouts and withdrawals for "${lockDialogWallet?.organizationName}".`}
						</DialogDescription>
					</DialogHeader>

					{!lockDialogWallet?.isLocked && (
						<div className="space-y-2 py-2">
							<label className="text-xs font-medium text-foreground">
								Reason for Lock (Compliance / Audit):
							</label>
							<Input
								placeholder="e.g. KYC document verification, chargeback check..."
								value={lockReason}
								onChange={(e) => setLockReason(e.target.value)}
								className="text-xs rounded-none shadow-none border-border"
							/>
						</div>
					)}

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setLockDialogWallet(null)}
							disabled={isPending}
							className="text-xs rounded-none shadow-none"
						>
							Cancel
						</Button>
						<Button
							variant={lockDialogWallet?.isLocked ? "default" : "destructive"}
							size="sm"
							onClick={handleConfirmLock}
							disabled={isPending}
							className="text-xs font-semibold rounded-none shadow-none"
						>
							{isPending
								? "Updating..."
								: lockDialogWallet?.isLocked
								? "Confirm Unlock"
								: "Confirm Lock"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Approve Confirmation Dialog */}
			<Dialog open={!!approveTarget} onOpenChange={(open) => !open && setApproveTarget(null)}>
				<DialogContent className="sm:max-w-md border border-border rounded-none shadow-none">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<CheckCircle2 className="h-5 w-5 text-emerald-500" />
							Approve Payout
						</DialogTitle>
						<DialogDescription className="text-xs">
							This will initiate the Paystack transfer. If OTP is enabled on your account, you'll be prompted to enter the OTP sent to your email/phone.
						</DialogDescription>
					</DialogHeader>

					{approveTarget && (
						<div className="space-y-3 py-2">
							<div className="p-3 bg-muted/30 border border-border space-y-2 text-xs rounded-none">
								<div className="flex justify-between">
									<span className="text-muted-foreground">Organizer:</span>
									<span className="font-semibold text-foreground">
										{approveTarget.wallet?.organization?.name || approveTarget.recipientName}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Recipient:</span>
									<span className="font-mono text-foreground">{approveTarget.recipientName}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Account:</span>
									<span className="font-mono text-foreground">
										{approveTarget.bankName || approveTarget.bankCode} • {approveTarget.accountNumber}
									</span>
								</div>
								<div className="flex justify-between border-t border-border pt-2">
									<span className="text-muted-foreground font-semibold">Amount:</span>
									<span className="text-base font-bold text-foreground font-mono">
										{formatAmount(approveTarget.amount, approveTarget.currency)}
									</span>
								</div>
							</div>
						</div>
					)}

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setApproveTarget(null)}
							disabled={isPending || isApproving}
							className="text-xs rounded-none shadow-none"
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleApprovePayout}
							disabled={isPending || isApproving}
							className="text-xs font-semibold rounded-none shadow-none bg-emerald-600 hover:bg-emerald-700 text-white"
						>
							{isPending || isApproving ? "Processing..." : "Confirm & Transfer"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* OTP Finalization Dialog */}
			<Dialog open={!!otpTarget} onOpenChange={(open) => !open && setOtpTarget(null)}>
				<DialogContent className="sm:max-w-md border border-border rounded-none shadow-none">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<KeyRound className="h-5 w-5 text-primary" />
							Enter Paystack OTP
						</DialogTitle>
						<DialogDescription className="text-xs">
							Paystack sent an OTP to your registered email/phone. Enter it below to authorize the transfer of{" "}
							<strong className="text-foreground">
								{otpTarget ? formatAmount(otpTarget.payout.amount, otpTarget.payout.currency) : ""}
							</strong>{" "}
							to <strong className="text-foreground">{otpTarget?.payout.recipientName}</strong>.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3 py-2">
						<Input
							placeholder="Enter OTP code"
							value={otpValue}
							onChange={(e) => setOtpValue(e.target.value)}
							className="text-center text-lg font-mono tracking-[0.3em] rounded-none shadow-none border-border"
							maxLength={10}
							autoFocus
						/>
					</div>

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								setOtpTarget(null);
								setOtpValue("");
							}}
							disabled={isPending}
							className="text-xs rounded-none shadow-none"
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleFinalizeOtp}
							disabled={isPending || !otpValue.trim()}
							className="text-xs font-semibold rounded-none shadow-none"
						>
							{isPending ? "Verifying..." : "Authorize Transfer"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Reject Dialog */}
			<Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
				<DialogContent className="sm:max-w-md border border-border rounded-none shadow-none">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<XCircle className="h-5 w-5 text-destructive" />
							Reject Payout
						</DialogTitle>
						<DialogDescription className="text-xs">
							Rejecting will return {rejectTarget ? formatAmount(rejectTarget.amount, rejectTarget.currency) : ""} to{" "}
							<strong className="text-foreground">{rejectTarget?.wallet?.organization?.name || "the organizer"}</strong>'s wallet balance.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-2 py-2">
						<label className="text-xs font-medium text-foreground">
							Reason for rejection (visible to organizer):
						</label>
						<Textarea
							placeholder="e.g. Incorrect bank details, suspicious activity, KYC incomplete..."
							value={rejectReason}
							onChange={(e) => setRejectReason(e.target.value)}
							className="text-xs rounded-none shadow-none border-border min-h-[80px]"
						/>
					</div>

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setRejectTarget(null)}
							disabled={isPending}
							className="text-xs rounded-none shadow-none"
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							size="sm"
							onClick={handleRejectPayout}
							disabled={isPending}
							className="text-xs font-semibold rounded-none shadow-none"
						>
							{isPending ? "Processing..." : "Confirm Reject"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
