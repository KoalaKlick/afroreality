"use client";

import React, { useState, useTransition } from "react";
import {
	Wallet,
	Search,
	Lock,
	Unlock,
	SlidersHorizontal,
	Coins,
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
import { formatAmount } from "@/lib/utils";
import type { AdminWalletItem, AdminPayoutItem } from "@/lib/dal/admin";
import { adminLockWallet, adminToggleAutoPayout } from "@/lib/server-functions/admin";

interface AdminWalletsContentProps {
	wallets: AdminWalletItem[];
	recentPayouts: AdminPayoutItem[];
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
	floatSummary,
}: AdminWalletsContentProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [lockDialogWallet, setLockDialogWallet] = useState<AdminWalletItem | null>(null);
	const [lockReason, setLockReason] = useState("");
	const [isPending, startTransition] = useTransition();

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

			{/* Tabs: Wallets vs Payouts */}
			<Tabs defaultValue="wallets" className="w-full rounded-none shadow-none">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 rounded-none shadow-none">
					<TabsList className="bg-muted/50 border border-border rounded-none shadow-none p-0">
						<TabsTrigger value="wallets" className="text-xs font-semibold rounded-none shadow-none">
							Organizer Wallets ({wallets.length})
						</TabsTrigger>
						<TabsTrigger value="payouts" className="text-xs font-semibold rounded-none shadow-none">
							Platform Payouts Audit ({recentPayouts.length})
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

				{/* 2. Payouts Audit Tab */}
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
												</div>

												<p className="font-bold text-foreground mt-1">
													{p.recipientName} {p.wallet?.organization ? `(${p.wallet.organization.name})` : ""}
												</p>

												<p className="text-muted-foreground text-[11px] mt-0.5">
													{p.bankName || "Bank"} • {p.accountNumber || "N/A"} • Processed: {new Date(p.createdAt).toLocaleDateString()}
												</p>
											</div>

											<div className="text-right shrink-0">
												<p className="text-sm font-bold text-foreground font-mono">
													{formatAmount(p.amount, p.currency)}
												</p>
												{p.approver && (
													<p className="text-[10px] text-muted-foreground">
														Approved by: {p.approver.fullName}
													</p>
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

			{/* Lock / Unlock Dialog - Flat & Square */}
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
		</div>
	);
}
