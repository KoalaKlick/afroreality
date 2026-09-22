"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
	Building2,
	Users,
	Calendar,
	Wallet,
	Search,
	ShieldAlert,
	Lock,
	Unlock,
	Coins,
	Eye,
	SlidersHorizontal,
	TrendingUp,
	Percent,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
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
import type { AdminOrganizerItem } from "@/lib/dal/admin";
import { adminLockWallet, adminToggleAutoPayout } from "@/lib/server-functions/admin";

interface AdminOrganizersContentProps {
	organizers: AdminOrganizerItem[];
}

export function AdminOrganizersContent({ organizers }: AdminOrganizersContentProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedOrg, setSelectedOrg] = useState<AdminOrganizerItem | null>(null);
	const [isSheetOpen, setIsSheetOpen] = useState(false);

	// Wallet lock dialog state
	const [lockDialogOrg, setLockDialogOrg] = useState<AdminOrganizerItem | null>(null);
	const [lockReason, setLockReason] = useState("");
	const [isPending, startTransition] = useTransition();

	const filteredOrganizers = organizers.filter((org) => {
		const q = searchQuery.toLowerCase();
		return (
			org.name.toLowerCase().includes(q) ||
			org.slug.toLowerCase().includes(q) ||
			(org.contactEmail && org.contactEmail.toLowerCase().includes(q)) ||
			(org.creator && org.creator.fullName.toLowerCase().includes(q))
		);
	});

	const handleOpenOrg = (org: AdminOrganizerItem) => {
		setSelectedOrg(org);
		setIsSheetOpen(true);
	};

	const handleToggleAutoPayout = (org: AdminOrganizerItem) => {
		const nextState = !org.autoPayout;
		startTransition(async () => {
			const res = await adminToggleAutoPayout({
				organizationId: org.id,
				autoPayout: nextState,
			});
			if (res.success) {
				toast.success(res.message);
				if (selectedOrg && selectedOrg.id === org.id) {
					setSelectedOrg({ ...selectedOrg, autoPayout: nextState });
				}
			} else {
				toast.error(res.error || "Failed to update auto-payout");
			}
		});
	};

	const handleConfirmWalletLock = () => {
		if (!lockDialogOrg || !lockDialogOrg.wallet) return;
		const nextLocked = !lockDialogOrg.wallet.isLocked;

		startTransition(async () => {
			const res = await adminLockWallet({
				walletId: lockDialogOrg.wallet!.id,
				isLocked: nextLocked,
				lockReason: lockReason.trim() || undefined,
			});

			if (res.success) {
				toast.success(res.message);
				setLockDialogOrg(null);
				setLockReason("");
				if (selectedOrg && selectedOrg.id === lockDialogOrg.id) {
					setSelectedOrg({
						...selectedOrg,
						wallet: {
							...selectedOrg.wallet!,
							isLocked: nextLocked,
							lockReason: nextLocked ? lockReason || "Locked by Admin" : null,
						},
					});
				}
			} else {
				toast.error(res.error || "Failed to update wallet status");
			}
		});
	};

	return (
		<div className="flex flex-col gap-6 rounded-none shadow-none">
			{/* Top Bar: Search & Counts */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-none shadow-none">
				<div className="relative flex-1 max-w-md">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search by organization name, slug, email, or owner..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9 bg-background text-xs rounded-none shadow-none border-border"
					/>
				</div>

				<div className="flex items-center gap-3 text-xs text-muted-foreground">
					<span className="font-semibold text-foreground">
						{filteredOrganizers.length} of {organizers.length}
					</span>
					<span>organizers on platform</span>
				</div>
			</div>

			{/* Organizers Table / Cards */}
			{filteredOrganizers.length === 0 ? (
				<Card className="border border-border rounded-none shadow-none">
					<CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
						<Building2 className="h-10 w-10 mb-3 opacity-40" />
						<h3 className="text-base font-semibold text-foreground">No organizers found</h3>
						<p className="text-xs max-w-sm mt-1">
							Try adjusting your search query to find the organization.
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 rounded-none shadow-none">
					{filteredOrganizers.map((org) => {
						const isWalletLocked = org.wallet?.isLocked ?? false;
						const totalBalance = org.wallet?.balance ?? 0;
						const currency = org.wallet?.currency ?? "GHS";

						return (
							<Card
								key={org.id}
								className="border border-border bg-card rounded-none shadow-none flex flex-col justify-between"
							>
								<CardHeader className="pb-3 border-b border-border rounded-none shadow-none">
									<div className="flex items-start justify-between gap-3">
										<div className="flex items-center gap-2.5 min-w-0">
											<Avatar className="h-9 w-9 rounded-none shadow-none border border-border shrink-0">
												<AvatarImage src={org.logoUrl || ""} alt={org.name} />
												<AvatarFallback className="bg-primary/10 text-primary font-bold text-xs rounded-none">
													{org.name.slice(0, 2).toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<div className="min-w-0">
												<CardTitle className="text-sm font-bold text-foreground truncate">
													{org.name}
												</CardTitle>
												<CardDescription className="text-xs truncate font-mono">
													/{org.slug}
												</CardDescription>
											</div>
										</div>

										{isWalletLocked ? (
											<Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 text-[9px] shrink-0 font-bold uppercase rounded-none shadow-none">
												Locked Wallet
											</Badge>
										) : (
											<Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 text-[9px] shrink-0 font-bold uppercase rounded-none shadow-none">
												Active
											</Badge>
										)}
									</div>
								</CardHeader>

								<CardContent className="space-y-3 pt-3 rounded-none shadow-none">
									{/* Info Rows */}
									<div className="grid grid-cols-2 gap-2 text-xs bg-muted/30 p-2.5 border border-border rounded-none shadow-none">
										<div>
											<span className="text-[10px] uppercase font-bold text-muted-foreground block">
												Members
											</span>
											<span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
												<Users className="h-3 w-3 text-primary" />
												{org.members.length} team member(s)
											</span>
										</div>
										<div>
											<span className="text-[10px] uppercase font-bold text-muted-foreground block">
												Events
											</span>
											<span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
												<Calendar className="h-3 w-3 text-primary" />
												{org.eventsSummary.total} ({org.eventsSummary.ongoing} live)
											</span>
										</div>
									</div>

									{/* Financial Breakdown: Gross, Our Share & Net */}
									<div className="border border-border p-2.5 bg-muted/20 space-y-1.5 rounded-none shadow-none text-xs">
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground">Gross Inflow:</span>
											<span className="font-bold text-foreground font-mono">
												{formatAmount(org.financials.grossRevenue, currency)}
											</span>
										</div>

										<div className="flex items-center justify-between text-primary font-semibold">
											<span className="flex items-center gap-1">
												<Coins className="h-3 w-3" />
												Our Share (Fee):
											</span>
											<span className="font-mono">
												{formatAmount(org.financials.ourPlatformShare, currency)}
											</span>
										</div>

										<div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border">
											<span>Organizer Net Share:</span>
											<span className="font-mono text-foreground font-medium">
												{formatAmount(org.financials.organizerNetShare, currency)}
											</span>
										</div>

										<div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border">
											<span className="flex items-center gap-1">
												<Wallet className="h-3 w-3" />
												Wallet Balance:
											</span>
											<span className="font-bold text-foreground font-mono">
												{formatAmount(totalBalance, currency)}
											</span>
										</div>

										{typeof org.financials.pendingClearance === "number" && org.financials.pendingClearance > 0 && (
											<div className="pt-0.5 space-y-0.5 text-[10px] text-muted-foreground border-t border-dashed border-border/60">
												<div className="flex items-center justify-between">
													<span>Available for Payout:</span>
													<span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
														{formatAmount(org.financials.availableBalance ?? 0, currency)}
													</span>
												</div>
												<div className="flex items-center justify-between">
													<span>Pending Clearance (T+1):</span>
													<span className="font-mono text-amber-600 dark:text-amber-400 font-medium">
														{formatAmount(org.financials.pendingClearance, currency)}
													</span>
												</div>
											</div>
										)}
									</div>

									{/* Creator / Owner */}
									{org.creator && (
										<div className="flex items-center justify-between text-xs px-1 text-muted-foreground">
											<span>Owner:</span>
											<span className="font-medium text-foreground truncate max-w-[170px]">
												{org.creator.fullName}
											</span>
										</div>
									)}

									{/* Inspect Action */}
									<div className="pt-1">
										<Button
											variant="outline"
											size="sm"
											className="w-full text-xs font-semibold rounded-none shadow-none border-border hover:bg-primary hover:text-primary-foreground hover:border-primary"
											onClick={() => handleOpenOrg(org)}
										>
											<Eye className="h-3.5 w-3.5 mr-1.5" />
											Inspect Organizer & Members
										</Button>
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}

			{/* Detail Drawer - Flat & Square */}
			<Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
				<SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto p-0 flex flex-col bg-background rounded-none shadow-none border-l border-border">
					{selectedOrg && (
						<>
							<SheetHeader className="p-6 border-b border-border bg-muted/20 rounded-none shadow-none">
								<div className="flex items-center gap-3">
									<Avatar className="h-12 w-12 rounded-none shadow-none border border-border">
										<AvatarImage src={selectedOrg.logoUrl || ""} alt={selectedOrg.name} />
										<AvatarFallback className="bg-primary/10 text-primary font-bold rounded-none">
											{selectedOrg.name.slice(0, 2).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div>
										<SheetTitle className="text-base font-bold text-foreground">
											{selectedOrg.name}
										</SheetTitle>
										<SheetDescription className="text-xs font-mono">
											ID: {selectedOrg.id} • Created {new Date(selectedOrg.createdAt).toLocaleDateString()}
										</SheetDescription>
									</div>
								</div>
							</SheetHeader>

							<Tabs defaultValue="members" className="w-full flex-1 flex flex-col min-h-0 rounded-none shadow-none">
								<div className="px-6 py-3 border-b bg-background/50 shrink-0">
									<TabsList className="h-9 w-full sm:w-auto p-1 bg-muted/60">
										<TabsTrigger value="members" className="text-xs font-semibold px-3 flex-1 sm:flex-initial">
											Members ({selectedOrg.members.length})
										</TabsTrigger>
										<TabsTrigger value="events" className="text-xs font-semibold px-3 flex-1 sm:flex-initial">
											Events ({selectedOrg.eventsSummary.total})
										</TabsTrigger>
										<TabsTrigger value="wallet" className="text-xs font-semibold px-3 flex-1 sm:flex-initial">
											Share & Wallet
										</TabsTrigger>
									</TabsList>
								</div>

								<div className="p-6 flex-1 overflow-y-auto">

									{/* 1. Members Tab */}
									<TabsContent value="members" className="space-y-4">
										<div className="flex items-center justify-between">
											<h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
												Organization Team Members
											</h4>
											<span className="text-xs text-muted-foreground">
												{selectedOrg.members.length} registered member(s)
											</span>
										</div>

										<div className="divide-y divide-border border border-border bg-card rounded-none shadow-none">
											{selectedOrg.members.map((member) => (
												<div key={member.id} className="p-3.5 flex items-center justify-between gap-3">
													<div className="flex items-center gap-3 min-w-0">
														<Avatar className="h-8 w-8 rounded-none shadow-none border border-border">
															<AvatarImage src={member.user.avatarUrl || ""} />
															<AvatarFallback className="bg-primary/10 text-primary text-xs font-bold rounded-none">
																{member.user.fullName.slice(0, 2).toUpperCase()}
															</AvatarFallback>
														</Avatar>
														<div className="min-w-0">
															<p className="text-xs font-bold text-foreground truncate">
																{member.user.fullName}
															</p>
															<p className="text-[11px] text-muted-foreground truncate">
																{member.user.email}
															</p>
															{member.user.phone && (
																<p className="text-[10px] text-muted-foreground">
																	{member.user.phone}
																</p>
															)}
														</div>
													</div>

													<div className="text-right shrink-0">
														<Badge
															variant="outline"
															className={`text-[9px] font-bold uppercase rounded-none shadow-none ${
																member.role === "owner"
																	? "bg-amber-500/10 text-amber-600 border-amber-500/30"
																	: member.role === "admin"
																	? "bg-blue-500/10 text-blue-600 border-blue-500/30"
																	: "bg-muted text-muted-foreground"
															}`}
														>
															{member.role}
														</Badge>
														<p className="text-[10px] text-muted-foreground mt-1">
															Joined: {new Date(member.joinedAt).toLocaleDateString()}
														</p>
													</div>
												</div>
											))}
										</div>
									</TabsContent>

									{/* 2. Events Tab */}
									<TabsContent value="events" className="space-y-4">
										<div className="flex items-center justify-between">
											<h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
												Hosted Events & Revenue Shares
											</h4>
											<span className="text-xs text-muted-foreground">
												{selectedOrg.eventsSummary.ongoing} ongoing • {selectedOrg.eventsSummary.published} published
											</span>
										</div>

										{selectedOrg.eventsSummary.eventsList.length === 0 ? (
											<div className="text-center py-10 text-muted-foreground text-xs border border-border rounded-none shadow-none">
												No events created by this organizer yet
											</div>
										) : (
											<div className="divide-y divide-border border border-border bg-card rounded-none shadow-none">
												{selectedOrg.eventsSummary.eventsList.map((ev) => (
													<div key={ev.id} className="p-3.5 flex items-center justify-between gap-3">
														<div className="min-w-0">
															<div className="flex items-center gap-2">
																<Badge variant="outline" className="text-[9px] uppercase font-bold rounded-none shadow-none">
																	{ev.status}
																</Badge>
																<span className="text-[10px] uppercase font-semibold text-muted-foreground">
																	{ev.type}
																</span>
															</div>
															<p className="text-xs font-bold text-foreground truncate mt-1">
																{ev.title}
															</p>
															{ev.startDate && (
																<p className="text-[10px] text-muted-foreground">
																	Start: {new Date(ev.startDate).toLocaleDateString()}
																</p>
															)}
														</div>

														<div className="text-right shrink-0 text-xs">
															<p className="font-bold text-foreground font-mono">
																Gross: {formatAmount(ev.grossRevenue, "GHS")}
															</p>
															<p className="text-primary font-semibold font-mono">
																Our Share: {formatAmount(ev.ourShare, "GHS")}
															</p>
															<p className="text-[10px] text-muted-foreground">
																{ev.ticketsSold} tickets sold
															</p>
														</div>
													</div>
												))}
											</div>
										)}
									</TabsContent>

									{/* 3. Share & Wallet Tab */}
									<TabsContent value="wallet" className="space-y-4">
										{/* Revenue Split Card */}
										<div className="p-4 border border-border bg-card space-y-3 rounded-none shadow-none text-xs">
											<h4 className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-primary">
												<Coins className="h-4 w-4" />
												Financial Revenue Split
											</h4>
											<div className="grid grid-cols-3 gap-2">
												<div className="p-2.5 bg-muted/40 border border-border rounded-none shadow-none">
													<span className="text-[10px] uppercase font-bold text-muted-foreground block">
														Gross Volume
													</span>
													<span className="text-sm font-bold text-foreground font-mono mt-0.5 block">
														{formatAmount(selectedOrg.financials.grossRevenue, selectedOrg.wallet?.currency || "GHS")}
													</span>
												</div>
												<div className="p-2.5 bg-primary/10 border border-primary/30 rounded-none shadow-none">
													<span className="text-[10px] uppercase font-bold text-primary block">
														Our Platform Share
													</span>
													<span className="text-sm font-bold text-primary font-mono mt-0.5 block">
														{formatAmount(selectedOrg.financials.ourPlatformShare, selectedOrg.wallet?.currency || "GHS")}
													</span>
												</div>
												<div className="p-2.5 bg-muted/40 border border-border rounded-none shadow-none">
													<span className="text-[10px] uppercase font-bold text-muted-foreground block">
														Organizer Share
													</span>
													<span className="text-sm font-bold text-foreground font-mono mt-0.5 block">
														{formatAmount(selectedOrg.financials.organizerNetShare, selectedOrg.wallet?.currency || "GHS")}
													</span>
												</div>
											</div>
										</div>

										{/* Platform Fee Configuration Banner */}
										<div className="p-3 bg-muted/40 border border-border flex items-center justify-between text-xs rounded-none shadow-none">
											<div>
												<span className="font-bold text-foreground block">Platform Fee Rates</span>
												<span className="text-[11px] text-muted-foreground">Manage custom rate overrides or view global baseline fees</span>
											</div>
											<Button
												variant="outline"
												size="sm"
												asChild
												className="text-xs font-semibold h-7 rounded-none hover:bg-primary hover:text-primary-foreground border-border"
											>
												<Link href="/super/fees">
													<Percent className="h-3 w-3 mr-1 text-primary" />
													Configure Fees
												</Link>
											</Button>
										</div>

										{selectedOrg.wallet ? (
											<div className="space-y-4">
												{/* Balance Card */}
												<div className="p-4 border border-border bg-card space-y-2 rounded-none shadow-none">
													<span className="text-[10px] font-bold uppercase text-muted-foreground block">
														Current Escrow / Wallet Balance
													</span>
													<div className="flex items-center justify-between">
														<span className="text-2xl font-bold text-foreground font-mono">
															{formatAmount(selectedOrg.wallet.balance, selectedOrg.wallet.currency)}
														</span>
														{selectedOrg.wallet.isLocked ? (
															<Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 text-xs font-semibold rounded-none shadow-none">
																<ShieldAlert className="h-3 w-3 mr-1" />
																Wallet Locked
															</Badge>
														) : (
															<Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 text-xs font-semibold rounded-none shadow-none">
																Wallet Active
															</Badge>
														)}
													</div>

													{selectedOrg.wallet.lockReason && (
														<div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 rounded-none shadow-none">
															<strong>Lock Reason:</strong> {selectedOrg.wallet.lockReason}
														</div>
													)}
												</div>

												{/* Payout & Subaccount Info */}
												<div className="p-4 border border-border bg-card space-y-3 text-xs rounded-none shadow-none">
													<h4 className="font-bold text-foreground flex items-center gap-2 uppercase tracking-wider text-[11px]">
														<Wallet className="h-4 w-4 text-primary" />
														Payout Configuration & Subaccount
													</h4>
													<div className="grid grid-cols-2 gap-2 text-muted-foreground">
														<div>
															<span className="block text-[10px] uppercase font-bold text-muted-foreground">
																Auto-Payout
															</span>
															<span className="font-medium text-foreground">
																{selectedOrg.autoPayout ? "Enabled (Automatic)" : "Disabled (Manual)"}
															</span>
														</div>
														<div>
															<span className="block text-[10px] uppercase font-bold text-muted-foreground">
																Subaccount Code
															</span>
															<span className="font-medium text-foreground font-mono">
																{selectedOrg.subaccountCode || "None configured"}
															</span>
														</div>
														<div>
															<span className="block text-[10px] uppercase font-bold text-muted-foreground">
																Account Name
															</span>
															<span className="font-medium text-foreground">
																{selectedOrg.paystackAccountName || "N/A"}
															</span>
														</div>
														<div>
															<span className="block text-[10px] uppercase font-bold text-muted-foreground">
																Account Number
															</span>
															<span className="font-medium text-foreground font-mono">
																{selectedOrg.paystackAccountNumber || "N/A"}
															</span>
														</div>
													</div>

													{/* Admin Controls */}
													<div className="pt-3 border-t border-border flex flex-wrap gap-2 justify-end">
														<Button
															variant="outline"
															size="sm"
															disabled={isPending}
															onClick={() => handleToggleAutoPayout(selectedOrg)}
															className="text-xs rounded-none shadow-none border-border"
														>
															<SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
															{selectedOrg.autoPayout ? "Disable Auto-Payout" : "Enable Auto-Payout"}
														</Button>

														<Button
															variant={selectedOrg.wallet.isLocked ? "default" : "destructive"}
															size="sm"
															disabled={isPending}
															onClick={() => {
																setLockDialogOrg(selectedOrg);
																setLockReason(selectedOrg.wallet?.lockReason || "");
															}}
															className="text-xs font-semibold rounded-none shadow-none"
														>
															{selectedOrg.wallet.isLocked ? (
																<>
																	<Unlock className="h-3.5 w-3.5 mr-1.5" />
																	Unlock Wallet
																</>
															) : (
																<>
																	<Lock className="h-3.5 w-3.5 mr-1.5" />
																	Lock Wallet
																</>
															)}
														</Button>
													</div>
												</div>
											</div>
										) : (
											<div className="text-center py-8 text-xs text-muted-foreground border border-border rounded-none shadow-none">
												No wallet created for this organization.
											</div>
										)}
									</TabsContent>
								</div>
							</Tabs>
						</>
					)}
				</SheetContent>
			</Sheet>

			{/* Lock / Unlock Wallet Confirmation Dialog */}
			<Dialog open={!!lockDialogOrg} onOpenChange={(open) => !open && setLockDialogOrg(null)}>
				<DialogContent className="sm:max-w-md rounded-none shadow-none border border-border">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							{lockDialogOrg?.wallet?.isLocked ? (
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
							{lockDialogOrg?.wallet?.isLocked
								? `Are you sure you want to unlock the wallet for "${lockDialogOrg?.name}"? The organizer will be able to receive disbursements again.`
								: `Locking the wallet for "${lockDialogOrg?.name}" will freeze withdrawals and payouts until unlocked.`}
						</DialogDescription>
					</DialogHeader>

					{!lockDialogOrg?.wallet?.isLocked && (
						<div className="space-y-2 py-2">
							<label className="text-xs font-medium text-foreground">
								Reason for Lock (Compliance / Audit):
							</label>
							<Input
								placeholder="e.g. Identity verification pending, chargeback review..."
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
							onClick={() => setLockDialogOrg(null)}
							disabled={isPending}
							className="text-xs rounded-none shadow-none"
						>
							Cancel
						</Button>
						<Button
							variant={lockDialogOrg?.wallet?.isLocked ? "default" : "destructive"}
							size="sm"
							onClick={handleConfirmWalletLock}
							disabled={isPending}
							className="text-xs font-semibold rounded-none shadow-none"
						>
							{isPending
								? "Updating..."
								: lockDialogOrg?.wallet?.isLocked
								? "Confirm Unlock"
								: "Confirm Lock"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
