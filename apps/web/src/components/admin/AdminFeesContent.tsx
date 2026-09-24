"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
	Percent,
	Coins,
	Plus,
	Search,
	Edit2,
	Trash2,
	Sliders,
	ShieldCheck,
	Building2,
	CheckCircle2,
	XCircle,
	AlertCircle,
	ArrowRight,
	CreditCard,
	Layers,
	ArrowDownToLine,
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	adminSaveGlobalFee,
	adminSetOrganizationFeeOverride,
	adminDeleteOrganizationFeeOverride,
	adminUpdatePaystackGatewaySettings,
	adminUpdateWithdrawalRules,
	type EventDepositRules,
} from "@/lib/server-functions/admin";

export interface FeeConfigItem {
	id: string;
	name: string;
	feeType: string;
	percentage: number | null;
	fixedAmount: number | null;
	minFee: number | null;
	maxFee: number | null;
	currency: string;
	isActive: boolean;
	description?: string | null;
	organizationId?: string | null;
	organization?: {
		id: string;
		name: string;
		slug: string;
		logoUrl?: string | null;
	} | null;
}

export interface AdminFeesContentProps {
	globalFees: FeeConfigItem[];
	orgOverrides: FeeConfigItem[];
	paystackConfig: {
		feeRate: number;
		feeCap: number;
	};
	withdrawalRules?: {
		minAmount: number;
		transferFee: number;
		freePerWeek: number;
	};
	depositRules?: EventDepositRules;
	organizations: Array<{
		id: string;
		name: string;
		slug: string;
	}>;
}

export function AdminFeesContent({
	globalFees,
	orgOverrides,
	paystackConfig,
	withdrawalRules,
	depositRules,
	organizations,
}: AdminFeesContentProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [isPending, startTransition] = useTransition();

	// Global Fee Modal State
	const [editingGlobalFee, setEditingGlobalFee] = useState<FeeConfigItem | null>(null);
	const [globalForm, setGlobalForm] = useState({
		feeType: "vote",
		percentage: 6.5,
		fixedAmount: 0,
		minFee: "",
		maxFee: "",
		isActive: true,
	});

	// Gateway Modal State
	const [isGatewayDialogOpen, setIsGatewayDialogOpen] = useState(false);
	const [gatewayForm, setGatewayForm] = useState({
		feeRate: paystackConfig.feeRate * 100, // display as 1.95
		feeCap: paystackConfig.feeCap,
	});

	// Withdrawal Rules Modal State (Option B configurable)
	const [isWithdrawalDialogOpen, setIsWithdrawalDialogOpen] = useState(false);
	const [withdrawalForm, setWithdrawalForm] = useState({
		minAmount: withdrawalRules?.minAmount ?? 20,
		transferFee: withdrawalRules?.transferFee ?? 1.0,
		freePerWeek: withdrawalRules?.freePerWeek ?? 1,
	});

	// Org Override Modal State
	const [isOrgDialogOpen, setIsOrgDialogOpen] = useState(false);
	const [editingOverride, setEditingOverride] = useState<FeeConfigItem | null>(null);
	const [orgForm, setOrgForm] = useState({
		organizationId: organizations[0]?.id || "",
		feeType: "vote",
		percentage: 5.0,
		fixedAmount: 0,
		minFee: "",
		maxFee: "",
		isActive: true,
	});

	// Delete Confirmation State
	const [deleteTarget, setDeleteTarget] = useState<FeeConfigItem | null>(null);

	// Find default configs
	const voteFee = globalFees.find((f) => f.feeType === "vote") || {
		id: "default-vote",
		name: "Voting Default Fee",
		feeType: "vote",
		percentage: 6.5,
		fixedAmount: 0,
		minFee: null,
		maxFee: null,
		currency: "GHS",
		isActive: true,
	};

	const ticketFee = globalFees.find((f) => f.feeType === "ticket") || {
		id: "default-ticket",
		name: "Tickets Default Fee",
		feeType: "ticket",
		percentage: 5.0,
		fixedAmount: 0,
		minFee: null,
		maxFee: null,
		currency: "GHS",
		isActive: true,
	};

	const nominationFee = globalFees.find((f) => f.feeType === "nomination") || {
		id: "default-nomination",
		name: "Nominations Default Fee",
		feeType: "nomination",
		percentage: 3.5,
		fixedAmount: 0,
		minFee: null,
		maxFee: null,
		currency: "GHS",
		isActive: true,
	};

	const filteredOverrides = orgOverrides.filter((item) => {
		const q = searchQuery.toLowerCase();
		const orgName = item.organization?.name?.toLowerCase() || "";
		const orgSlug = item.organization?.slug?.toLowerCase() || "";
		const feeType = item.feeType?.toLowerCase() || "";
		return orgName.includes(q) || orgSlug.includes(q) || feeType.includes(q);
	});

	const handleOpenEditGlobal = (fee: FeeConfigItem) => {
		setEditingGlobalFee(fee);
		setGlobalForm({
			feeType: fee.feeType,
			percentage: Number(fee.percentage ?? 0),
			fixedAmount: Number(fee.fixedAmount ?? 0),
			minFee: fee.minFee !== null ? String(fee.minFee) : "",
			maxFee: fee.maxFee !== null ? String(fee.maxFee) : "",
			isActive: fee.isActive,
		});
	};

	const handleSaveGlobal = () => {
		startTransition(async () => {
			const res = await adminSaveGlobalFee({
				feeType: globalForm.feeType,
				percentage: Number(globalForm.percentage),
				fixedAmount: Number(globalForm.fixedAmount),
				minFee: globalForm.minFee ? Number(globalForm.minFee) : null,
				maxFee: globalForm.maxFee ? Number(globalForm.maxFee) : null,
				isActive: globalForm.isActive,
			});

			if (res.success) {
				toast.success(res.message);
				setEditingGlobalFee(null);
			} else {
				toast.error(res.error || "Failed to save fee settings");
			}
		});
	};

	const handleSaveGateway = () => {
		startTransition(async () => {
			const res = await adminUpdatePaystackGatewaySettings({
				feeRate: Number(gatewayForm.feeRate),
				feeCap: Number(gatewayForm.feeCap),
			});

			if (res.success) {
				toast.success(res.message);
				setIsGatewayDialogOpen(false);
			} else {
				toast.error(res.error || "Failed to update gateway settings");
			}
		});
	};

	const handleSaveWithdrawalRules = () => {
		startTransition(async () => {
			const res = await adminUpdateWithdrawalRules({
				minAmount: Number(withdrawalForm.minAmount),
				transferFee: Number(withdrawalForm.transferFee),
				freePerWeek: Number(withdrawalForm.freePerWeek),
			});

			if (res.success) {
				toast.success(res.message);
				setIsWithdrawalDialogOpen(false);
			} else {
				toast.error(res.error || "Failed to update withdrawal rules");
			}
		});
	};

	const handleOpenNewOverride = (preselectedOrgId?: string) => {
		setEditingOverride(null);
		setOrgForm({
			organizationId: preselectedOrgId || organizations[0]?.id || "",
			feeType: "vote",
			percentage: 5.0,
			fixedAmount: 0,
			minFee: "",
			maxFee: "",
			isActive: true,
		});
		setIsOrgDialogOpen(true);
	};

	const handleOpenEditOverride = (item: FeeConfigItem) => {
		setEditingOverride(item);
		setOrgForm({
			organizationId: item.organizationId || "",
			feeType: item.feeType,
			percentage: Number(item.percentage ?? 0),
			fixedAmount: Number(item.fixedAmount ?? 0),
			minFee: item.minFee !== null ? String(item.minFee) : "",
			maxFee: item.maxFee !== null ? String(item.maxFee) : "",
			isActive: item.isActive,
		});
		setIsOrgDialogOpen(true);
	};

	const handleSaveOrgOverride = () => {
		if (!orgForm.organizationId) {
			toast.error("Please select an organization.");
			return;
		}

		startTransition(async () => {
			const res = await adminSetOrganizationFeeOverride({
				organizationId: orgForm.organizationId,
				feeType: orgForm.feeType,
				percentage: Number(orgForm.percentage),
				fixedAmount: Number(orgForm.fixedAmount),
				minFee: orgForm.minFee ? Number(orgForm.minFee) : null,
				maxFee: orgForm.maxFee ? Number(orgForm.maxFee) : null,
				isActive: orgForm.isActive,
			});

			if (res.success) {
				toast.success(res.message);
				setIsOrgDialogOpen(false);
			} else {
				toast.error(res.error || "Failed to set fee override");
			}
		});
	};

	const handleDeleteOverride = () => {
		if (!deleteTarget) return;

		startTransition(async () => {
			const res = await adminDeleteOrganizationFeeOverride({
				id: deleteTarget.id,
			});

			if (res.success) {
				toast.success(res.message);
				setDeleteTarget(null);
			} else {
				toast.error(res.error || "Failed to remove fee override");
			}
		});
	};

	return (
		<div className="space-y-6">
			{/* Top Bar Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-xl md:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
						<Percent className="h-5 w-5 text-primary" />
						Platform Fees & Rates
					</h1>
					<p className="text-xs md:text-sm text-muted-foreground mt-0.5">
						Configure baseline platform take rates, Paystack payment gateway surcharge rules, and per-organization fee overrides.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setIsGatewayDialogOpen(true)}
						className="text-xs font-semibold h-9 rounded-lg"
					>
						<CreditCard className="h-3.5 w-3.5 mr-1.5 text-primary" />
						Gateway Surcharge ({gatewayForm.feeRate}%)
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setIsWithdrawalDialogOpen(true)}
						className="text-xs font-semibold h-9 rounded-lg"
					>
						<ArrowDownToLine className="h-3.5 w-3.5 mr-1.5 text-primary" />
						Withdrawal Rules (Min: GHS {withdrawalForm.minAmount})
					</Button>
					<Button
						variant="outline"
						size="sm"
						asChild
						className="text-xs font-semibold h-9 rounded-lg"
					>
						<Link href="/super/deposits">
							<ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-primary" />
							Security Deposits (GHS {depositRules?.amount ?? 100})
						</Link>
					</Button>
					<Button
						size="sm"
						onClick={() => handleOpenNewOverride()}
						className="text-xs font-semibold h-9 rounded-lg shadow-sm"
					>
						<Plus className="h-3.5 w-3.5 mr-1.5" />
						Add Org Override
					</Button>
				</div>
			</div>

			{/* Global Baseline Fees Grid */}
			<div>
				<div className="flex items-center justify-between mb-3">
					<div className="flex items-center gap-2">
						<ShieldCheck className="h-4 w-4 text-primary" />
						<h2 className="text-sm font-bold tracking-tight text-foreground uppercase">
							Global Platform Defaults
						</h2>
					</div>
					<span className="text-[11px] text-muted-foreground">
						Applied automatically to all organizations without custom contracts
					</span>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{/* Voting Baseline Card */}
					<Card className="rounded-xl border border-border/80 shadow-sm relative overflow-hidden bg-card/60 backdrop-blur-sm">
						<CardHeader className="p-4 pb-2">
							<div className="flex items-center justify-between">
								<Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider bg-primary/10 text-primary border-primary/20">
									Voting Revenue
								</Badge>
								<Button
									variant="ghost"
									size="icon"
									className="h-7 w-7 text-muted-foreground hover:text-foreground"
									onClick={() => handleOpenEditGlobal(voteFee as any)}
								>
									<Edit2 className="h-3.5 w-3.5" />
								</Button>
							</div>
							<CardTitle className="text-base font-bold mt-2">Public & USSD Voting</CardTitle>
							<CardDescription className="text-xs">
								Default fee deducted on all ballot purchases.
							</CardDescription>
						</CardHeader>
						<CardContent className="p-4 pt-1 space-y-3">
							<div className="flex items-baseline gap-2">
								<span className="text-3xl font-black text-foreground">
									{Number(voteFee.percentage ?? 0).toFixed(1)}%
								</span>
								{Number(voteFee.fixedAmount ?? 0) > 0 && (
									<span className="text-xs font-semibold text-muted-foreground">
										+ GHS {Number(voteFee.fixedAmount).toFixed(2)}
									</span>
								)}
							</div>
							<div className="text-[11px] text-muted-foreground border-t border-border/40 pt-2 flex items-center justify-between">
								<span>Status:</span>
								<Badge variant={voteFee.isActive ? "default" : "secondary"} className="text-[10px] py-0 h-4">
									{voteFee.isActive ? "Active" : "Disabled"}
								</Badge>
							</div>
						</CardContent>
					</Card>

					{/* Ticket Baseline Card */}
					<Card className="rounded-xl border border-border/80 shadow-sm relative overflow-hidden bg-card/60 backdrop-blur-sm">
						<CardHeader className="p-4 pb-2">
							<div className="flex items-center justify-between">
								<Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider bg-blue-500/10 text-blue-500 border-blue-500/20">
									Ticket Sales
								</Badge>
								<Button
									variant="ghost"
									size="icon"
									className="h-7 w-7 text-muted-foreground hover:text-foreground"
									onClick={() => handleOpenEditGlobal(ticketFee as any)}
								>
									<Edit2 className="h-3.5 w-3.5" />
								</Button>
							</div>
							<CardTitle className="text-base font-bold mt-2">Ticket Bookings</CardTitle>
							<CardDescription className="text-xs">
								Default fee applied to paid event ticket tiers.
							</CardDescription>
						</CardHeader>
						<CardContent className="p-4 pt-1 space-y-3">
							<div className="flex items-baseline gap-2">
								<span className="text-3xl font-black text-foreground">
									{Number(ticketFee.percentage ?? 0).toFixed(1)}%
								</span>
								{Number(ticketFee.fixedAmount ?? 0) > 0 && (
									<span className="text-xs font-semibold text-muted-foreground">
										+ GHS {Number(ticketFee.fixedAmount).toFixed(2)}
									</span>
								)}
							</div>
							<div className="text-[11px] text-muted-foreground border-t border-border/40 pt-2 flex items-center justify-between">
								<span>Status:</span>
								<Badge variant={ticketFee.isActive ? "default" : "secondary"} className="text-[10px] py-0 h-4">
									{ticketFee.isActive ? "Active" : "Disabled"}
								</Badge>
							</div>
						</CardContent>
					</Card>

					{/* Nomination Baseline Card */}
					<Card className="rounded-xl border border-border/80 shadow-sm relative overflow-hidden bg-card/60 backdrop-blur-sm">
						<CardHeader className="p-4 pb-2">
							<div className="flex items-center justify-between">
								<Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider bg-purple-500/10 text-purple-500 border-purple-500/20">
									Nomination Forms
								</Badge>
								<Button
									variant="ghost"
									size="icon"
									className="h-7 w-7 text-muted-foreground hover:text-foreground"
									onClick={() => handleOpenEditGlobal(nominationFee as any)}
								>
									<Edit2 className="h-3.5 w-3.5" />
								</Button>
							</div>
							<CardTitle className="text-base font-bold mt-2">Nominee Entries</CardTitle>
							<CardDescription className="text-xs">
								Default fee for paid nominee submissions.
							</CardDescription>
						</CardHeader>
						<CardContent className="p-4 pt-1 space-y-3">
							<div className="flex items-baseline gap-2">
								<span className="text-3xl font-black text-foreground">
									{Number(nominationFee.percentage ?? 0).toFixed(1)}%
								</span>
								{Number(nominationFee.fixedAmount ?? 0) > 0 && (
									<span className="text-xs font-semibold text-muted-foreground">
										+ GHS {Number(nominationFee.fixedAmount).toFixed(2)}
									</span>
								)}
							</div>
							<div className="text-[11px] text-muted-foreground border-t border-border/40 pt-2 flex items-center justify-between">
								<span>Status:</span>
								<Badge variant={nominationFee.isActive ? "default" : "secondary"} className="text-[10px] py-0 h-4">
									{nominationFee.isActive ? "Active" : "Disabled"}
								</Badge>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Organization Overrides Section */}
			<div className="space-y-3">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border pt-6">
					<div>
						<h2 className="text-sm font-bold tracking-tight text-foreground uppercase flex items-center gap-2">
							<Building2 className="h-4 w-4 text-primary" />
							Organization-Specific Custom Overrides ({orgOverrides.length})
						</h2>
						<p className="text-xs text-muted-foreground">
							Organizations listed here have custom negotiated contract rates that override the global platform defaults.
						</p>
					</div>

					<div className="relative w-full sm:w-64">
						<Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
						<Input
							placeholder="Search organizations..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-8 text-xs h-9 rounded-lg"
						/>
					</div>
				</div>

				{filteredOverrides.length === 0 ? (
					<Card className="rounded-xl border border-dashed border-border/80 p-8 text-center bg-muted/20">
						<Building2 className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
						<h3 className="text-sm font-bold text-foreground">No Custom Overrides Found</h3>
						<p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
							{searchQuery
								? "No organization overrides matched your search term."
								: "All organizations are currently operating on the global platform baseline fee rates."}
						</p>
						<Button
							size="sm"
							variant="outline"
							onClick={() => handleOpenNewOverride()}
							className="text-xs font-semibold"
						>
							<Plus className="h-3.5 w-3.5 mr-1.5" />
							Add Custom Organization Rate
						</Button>
					</Card>
				) : (
					<div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs">
								<thead className="bg-muted/50 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
									<tr>
										<th className="py-3 px-4">Organization</th>
										<th className="py-3 px-4">Fee Channel</th>
										<th className="py-3 px-4">Custom Rate</th>
										<th className="py-3 px-4">Caps / Limits</th>
										<th className="py-3 px-4">Status</th>
										<th className="py-3 px-4 text-right">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border/60">
									{filteredOverrides.map((item) => {
										const pct = Number(item.percentage ?? 0);
										const fixed = Number(item.fixedAmount ?? 0);

										return (
											<tr key={item.id} className="hover:bg-muted/30 transition-colors">
												<td className="py-3 px-4">
													<div className="flex items-center gap-2.5">
														<Avatar className="h-7 w-7 rounded-lg border border-border">
															<AvatarImage src={item.organization?.logoUrl || ""} />
															<AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
																{item.organization?.name?.slice(0, 2).toUpperCase() || "OR"}
															</AvatarFallback>
														</Avatar>
														<div>
															<div className="font-semibold text-foreground">
																{item.organization?.name || "Unknown Org"}
															</div>
															<div className="text-[10px] text-muted-foreground font-mono">
																@{item.organization?.slug}
															</div>
														</div>
													</div>
												</td>
												<td className="py-3 px-4">
													<Badge
														variant="outline"
														className="text-[10px] font-bold uppercase tracking-wider bg-muted text-foreground"
													>
														{item.feeType}
													</Badge>
												</td>
												<td className="py-3 px-4 font-mono font-bold text-foreground">
													{pct.toFixed(1)}%
													{fixed > 0 && (
														<span className="text-muted-foreground font-normal ml-1">
															+ GHS {fixed.toFixed(2)}
														</span>
													)}
												</td>
												<td className="py-3 px-4 text-muted-foreground">
													{item.minFee !== null || item.maxFee !== null ? (
														<span>
															{item.minFee !== null && `Min: GHS ${Number(item.minFee).toFixed(2)} `}
															{item.maxFee !== null && `Max: GHS ${Number(item.maxFee).toFixed(2)}`}
														</span>
													) : (
														<span className="text-muted-foreground/60">—</span>
													)}
												</td>
												<td className="py-3 px-4">
													<Badge
														variant={item.isActive ? "default" : "secondary"}
														className="text-[10px] py-0 h-4"
													>
														{item.isActive ? "Active" : "Disabled"}
													</Badge>
												</td>
												<td className="py-3 px-4 text-right">
													<div className="flex items-center justify-end gap-1">
														<Button
															variant="ghost"
															size="icon"
															className="h-7 w-7 text-muted-foreground hover:text-foreground"
															onClick={() => handleOpenEditOverride(item)}
														>
															<Edit2 className="h-3.5 w-3.5" />
														</Button>
														<Button
															variant="ghost"
															size="icon"
															className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
															onClick={() => setDeleteTarget(item)}
														>
															<Trash2 className="h-3.5 w-3.5" />
														</Button>
													</div>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</div>
				)}
			</div>

			{/* Edit Global Baseline Modal */}
			<Dialog open={!!editingGlobalFee} onOpenChange={(open) => !open && setEditingGlobalFee(null)}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="text-base font-bold">
							Edit Global Default Fee ({globalForm.feeType.toUpperCase()})
						</DialogTitle>
						<DialogDescription className="text-xs">
							This baseline percentage will apply to all transactions for this channel across all organizations without custom rates.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label className="text-xs font-semibold">Percentage Rate (%)</Label>
								<Input
									type="number"
									step="0.1"
									min="0"
									max="100"
									value={globalForm.percentage}
									onChange={(e) =>
										setGlobalForm({ ...globalForm, percentage: parseFloat(e.target.value) || 0 })
									}
									className="text-xs h-9"
								/>
							</div>

							<div className="space-y-1.5">
								<Label className="text-xs font-semibold">Fixed Fee (GHS)</Label>
								<Input
									type="number"
									step="0.01"
									min="0"
									value={globalForm.fixedAmount}
									onChange={(e) =>
										setGlobalForm({ ...globalForm, fixedAmount: parseFloat(e.target.value) || 0 })
									}
									className="text-xs h-9"
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label className="text-xs font-semibold">Minimum Fee Floor (GHS)</Label>
								<Input
									type="number"
									step="0.1"
									placeholder="Optional"
									value={globalForm.minFee}
									onChange={(e) => setGlobalForm({ ...globalForm, minFee: e.target.value })}
									className="text-xs h-9"
								/>
							</div>

							<div className="space-y-1.5">
								<Label className="text-xs font-semibold">Maximum Fee Cap (GHS)</Label>
								<Input
									type="number"
									step="0.1"
									placeholder="Optional"
									value={globalForm.maxFee}
									onChange={(e) => setGlobalForm({ ...globalForm, maxFee: e.target.value })}
									className="text-xs h-9"
								/>
							</div>
						</div>

						<div className="flex items-center justify-between border border-border rounded-lg p-3 bg-muted/20">
							<div className="space-y-0.5">
								<span className="text-xs font-bold text-foreground">Rule Enabled</span>
								<p className="text-[11px] text-muted-foreground">
									Deduct fee automatically upon customer payment confirmation.
								</p>
							</div>
							<Switch
								checked={globalForm.isActive}
								onCheckedChange={(checked) => setGlobalForm({ ...globalForm, isActive: checked })}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setEditingGlobalFee(null)}
							className="text-xs"
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleSaveGlobal}
							disabled={isPending}
							className="text-xs font-semibold"
						>
							{isPending ? "Saving..." : "Save Baseline"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Edit Paystack Gateway Surcharge Modal */}
			<Dialog open={isGatewayDialogOpen} onOpenChange={setIsGatewayDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="text-base font-bold flex items-center gap-2">
							<CreditCard className="h-4 w-4 text-primary" />
							Paystack Gateway Surcharge Settings
						</DialogTitle>
						<DialogDescription className="text-xs">
							Buyer checkout surcharge formulas use these parameters so the payment gateway fee is absorbed by the customer.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold">Gateway Processing Rate (%)</Label>
							<Input
								type="number"
								step="0.01"
								min="0"
								max="10"
								value={gatewayForm.feeRate}
								onChange={(e) =>
									setGatewayForm({ ...gatewayForm, feeRate: parseFloat(e.target.value) || 0 })
								}
								className="text-xs h-9"
							/>
							<p className="text-[11px] text-muted-foreground">
								Ghana Paystack local rate is typically 1.95%.
							</p>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs font-semibold">Maximum Surcharge Cap (GHS)</Label>
							<Input
								type="number"
								step="1"
								min="0"
								value={gatewayForm.feeCap}
								onChange={(e) =>
									setGatewayForm({ ...gatewayForm, feeCap: parseFloat(e.target.value) || 0 })
								}
								className="text-xs h-9"
							/>
							<p className="text-[11px] text-muted-foreground">
								Maximum gateway fee charged to the buyer per transaction (Paystack default cap is GHS 100).
							</p>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsGatewayDialogOpen(false)}
							className="text-xs"
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleSaveGateway}
							disabled={isPending}
							className="text-xs font-semibold"
						>
							{isPending ? "Saving..." : "Update Gateway Settings"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Withdrawal Rules & Payout Policy Dialog (Option B) */}
			<Dialog open={isWithdrawalDialogOpen} onOpenChange={setIsWithdrawalDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="text-base font-bold flex items-center gap-2">
							<ArrowDownToLine className="h-4 w-4 text-primary" />
							Wallet Payout & Withdrawal Rules
						</DialogTitle>
						<DialogDescription className="text-xs">
							Configure the minimum withdrawal threshold and Paystack transfer fee absorption policy for organizers.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold">Minimum Withdrawal Amount (GHS)</Label>
							<Input
								type="number"
								step="1"
								min="1"
								value={withdrawalForm.minAmount}
								onChange={(e) =>
									setWithdrawalForm({
										...withdrawalForm,
										minAmount: parseFloat(e.target.value) || 0,
									})
								}
								className="text-xs h-9"
							/>
							<p className="text-[11px] text-muted-foreground">
								Organizers cannot submit withdrawal requests below this amount (prevents transfer fees exceeding payout value).
							</p>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs font-semibold">Paystack Transfer Fee (GHS)</Label>
							<Input
								type="number"
								step="0.1"
								min="0"
								value={withdrawalForm.transferFee}
								onChange={(e) =>
									setWithdrawalForm({
										...withdrawalForm,
										transferFee: parseFloat(e.target.value) || 0,
									})
								}
								className="text-xs h-9"
							/>
							<p className="text-[11px] text-muted-foreground">
								Fee deducted by Paystack per transfer (default: GHS 1.00 for Ghana Mobile Money & Banks).
							</p>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs font-semibold">Free Withdrawals Per Week (Rolling 7 Days)</Label>
							<Input
								type="number"
								step="1"
								min="0"
								value={withdrawalForm.freePerWeek}
								onChange={(e) =>
									setWithdrawalForm({
										...withdrawalForm,
										freePerWeek: parseInt(e.target.value, 10) || 0,
									})
								}
								className="text-xs h-9"
							/>
							<p className="text-[11px] text-muted-foreground">
								Number of withdrawals per 7 days where Afroreality absorbs the transfer fee. Subsequent withdrawals will have the transfer fee deducted from the organizer&apos;s payout.
							</p>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsWithdrawalDialogOpen(false)}
							className="text-xs"
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleSaveWithdrawalRules}
							disabled={isPending}
							className="text-xs font-semibold"
						>
							{isPending ? "Saving..." : "Save Withdrawal Rules"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Add/Edit Organization Override Modal */}
			<Dialog open={isOrgDialogOpen} onOpenChange={setIsOrgDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="text-base font-bold">
							{editingOverride ? "Edit Organization Rate Override" : "Add Custom Organization Rate"}
						</DialogTitle>
						<DialogDescription className="text-xs">
							Specify the custom negotiated fee rate for this organization.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold">Select Organization</Label>
							<Select
								value={orgForm.organizationId}
								onValueChange={(val) => setOrgForm({ ...orgForm, organizationId: val })}
								disabled={!!editingOverride}
							>
								<SelectTrigger className="text-xs h-9">
									<SelectValue placeholder="Select an organization" />
								</SelectTrigger>
								<SelectContent>
									{organizations.map((org) => (
										<SelectItem key={org.id} value={org.id} className="text-xs">
											{org.name} (@{org.slug})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs font-semibold">Transaction Channel</Label>
							<Select
								value={orgForm.feeType}
								onValueChange={(val) => setOrgForm({ ...orgForm, feeType: val })}
							>
								<SelectTrigger className="text-xs h-9">
									<SelectValue placeholder="Select fee type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="vote" className="text-xs">
										Voting (USSD & Web)
									</SelectItem>
									<SelectItem value="ticket" className="text-xs">
										Ticket Sales
									</SelectItem>
									<SelectItem value="nomination" className="text-xs">
										Nomination Entries
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label className="text-xs font-semibold">Fee Percentage (%)</Label>
								<Input
									type="number"
									step="0.1"
									min="0"
									max="100"
									value={orgForm.percentage}
									onChange={(e) =>
										setOrgForm({ ...orgForm, percentage: parseFloat(e.target.value) || 0 })
									}
									className="text-xs h-9"
								/>
							</div>

							<div className="space-y-1.5">
								<Label className="text-xs font-semibold">Fixed Fee (GHS)</Label>
								<Input
									type="number"
									step="0.01"
									min="0"
									value={orgForm.fixedAmount}
									onChange={(e) =>
										setOrgForm({ ...orgForm, fixedAmount: parseFloat(e.target.value) || 0 })
									}
									className="text-xs h-9"
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label className="text-xs font-semibold">Min Fee (Optional)</Label>
								<Input
									type="number"
									placeholder="None"
									value={orgForm.minFee}
									onChange={(e) => setOrgForm({ ...orgForm, minFee: e.target.value })}
									className="text-xs h-9"
								/>
							</div>

							<div className="space-y-1.5">
								<Label className="text-xs font-semibold">Max Fee Cap (Optional)</Label>
								<Input
									type="number"
									placeholder="None"
									value={orgForm.maxFee}
									onChange={(e) => setOrgForm({ ...orgForm, maxFee: e.target.value })}
									className="text-xs h-9"
								/>
							</div>
						</div>

						<div className="flex items-center justify-between border border-border rounded-lg p-3 bg-muted/20">
							<div className="space-y-0.5">
								<span className="text-xs font-bold text-foreground">Active Override</span>
								<p className="text-[11px] text-muted-foreground">
									Enable this rate immediately.
								</p>
							</div>
							<Switch
								checked={orgForm.isActive}
								onCheckedChange={(checked) => setOrgForm({ ...orgForm, isActive: checked })}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsOrgDialogOpen(false)}
							className="text-xs"
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleSaveOrgOverride}
							disabled={isPending}
							className="text-xs font-semibold"
						>
							{isPending ? "Saving..." : "Save Custom Rate"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Modal */}
			<Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
							<AlertCircle className="h-4 w-4" />
							Revert to Global Rate?
						</DialogTitle>
						<DialogDescription className="text-xs">
							Removing this custom override will immediately cause{" "}
							<strong>{deleteTarget?.organization?.name}</strong> to use the global platform baseline
							rate for {deleteTarget?.feeType}.
						</DialogDescription>
					</DialogHeader>

					<DialogFooter className="mt-4">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setDeleteTarget(null)}
							className="text-xs"
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							size="sm"
							onClick={handleDeleteOverride}
							disabled={isPending}
							className="text-xs font-semibold"
						>
							{isPending ? "Removing..." : "Revert to Default"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
