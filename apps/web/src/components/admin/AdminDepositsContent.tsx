"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
	ShieldCheck,
	RotateCcw,
	Search,
	Sliders,
	Clock,
	CheckCircle2,
	AlertCircle,
	ExternalLink,
	Copy,
	Check,
	Loader2,
	ArrowUpRight,
	Building2,
	Coins,
	FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	adminUpdateEventDepositRules,
	adminProcessSecurityDepositRefund,
	type AdminSecurityDepositItem,
	type AdminSecurityDepositsData,
} from "@/lib/server-functions/admin";
import { formatDate } from "@/lib/utils";

export function AdminDepositsContent({
	deposits: initialDeposits,
	totalHeldAmount,
	totalHeldCount,
	dueRefundsCount,
	totalRefundedAmount,
	totalRefundedCount,
	depositRules: initialRules,
}: AdminSecurityDepositsData) {
	const [deposits, setDeposits] = useState<AdminSecurityDepositItem[]>(initialDeposits);
	const [depositRules, setDepositRules] = useState(initialRules);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<"all" | "due" | "held" | "refunded">("all");
	const [isPending, startTransition] = useTransition();

	// Policy Settings Dialog State
	const [isRulesDialogOpen, setIsRulesDialogOpen] = useState(false);
	const [rulesForm, setRulesForm] = useState({
		enabled: depositRules.enabled,
		amount: depositRules.amount,
		scope: depositRules.scope,
		refundWindowDays: depositRules.refundWindowDays,
	});

	// Refund Action Dialog State
	const [refundTarget, setRefundTarget] = useState<AdminSecurityDepositItem | null>(null);
	const [isRefunding, setIsRefunding] = useState(false);

	// Copy Helper
	const [copiedRef, setCopiedRef] = useState<string | null>(null);
	const handleCopy = (text: string) => {
		navigator.clipboard.writeText(text);
		setCopiedRef(text);
		toast.success("Reference copied to clipboard");
		setTimeout(() => setCopiedRef(null), 2000);
	};

	// Save Rules Handler
	const handleSaveRules = () => {
		startTransition(async () => {
			const res = await adminUpdateEventDepositRules({
				enabled: rulesForm.enabled,
				amount: Number(rulesForm.amount),
				scope: rulesForm.scope,
				refundWindowDays: Number(rulesForm.refundWindowDays),
			});

			if (res.success) {
				toast.success(res.message);
				setDepositRules({
					enabled: rulesForm.enabled,
					amount: Number(rulesForm.amount),
					scope: rulesForm.scope,
					refundWindowDays: Number(rulesForm.refundWindowDays),
				});
				setIsRulesDialogOpen(false);
			} else {
				toast.error(res.error || "Failed to update deposit rules");
			}
		});
	};

	// 1-Click Refund Handler
	const handleProcessRefund = async () => {
		if (!refundTarget) return;
		setIsRefunding(true);

		try {
			const res = await adminProcessSecurityDepositRefund({
				paymentId: refundTarget.id,
			});

			if (res.success) {
				toast.success(res.message);
				// Update local item
				setDeposits((prev) =>
					prev.map((d) =>
						d.id === refundTarget.id
							? {
									...d,
									status: "refunded",
									isDue: false,
									refundedAt: new Date().toISOString(),
							  }
							: d,
					),
				);
				setRefundTarget(null);
			} else {
				toast.error(res.error || "Failed to process refund on Paystack");
			}
		} catch (err: any) {
			console.error("[ADMIN_REFUND_CLICK_ERR]", err);
			toast.error(err?.message || "An unexpected error occurred");
		} finally {
			setIsRefunding(false);
		}
	};

	// Filter deposits
	const filteredDeposits = deposits.filter((dep) => {
		const matchesSearch =
			searchQuery.trim() === "" ||
			dep.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(dep.event?.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
			(dep.organization?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
			dep.organizerEmail.toLowerCase().includes(searchQuery.toLowerCase());

		if (!matchesSearch) return false;

		if (statusFilter === "due") return dep.isDue;
		if (statusFilter === "held") return dep.status === "held";
		if (statusFilter === "refunded") return dep.status === "refunded";
		return true;
	});

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<div className="flex items-center gap-2.5 mb-1">
						<div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
							<ShieldCheck className="h-4 w-4" />
						</div>
						<h1 className="text-xl font-bold tracking-tight text-foreground">
							Event Security Deposits & Escrow
						</h1>
					</div>
					<p className="text-xs text-muted-foreground">
						Review refundable publishing deposits, track escrow hold duration, and process 1-click Paystack refunds back to organizers.
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							setRulesForm({
								enabled: depositRules.enabled,
								amount: depositRules.amount,
								scope: depositRules.scope,
								refundWindowDays: depositRules.refundWindowDays,
							});
							setIsRulesDialogOpen(true);
						}}
						className="text-xs font-semibold h-9 rounded-lg"
					>
						<Sliders className="h-3.5 w-3.5 mr-1.5 text-primary" />
						Deposit Policy (GHS {depositRules.amount})
					</Button>
				</div>
			</div>

			{/* Top Metric Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card className="rounded-xl border border-border/80 shadow-sm bg-card/60 backdrop-blur-sm">
					<CardHeader className="p-4 pb-1">
						<CardDescription className="text-xs font-medium">
							Total Held in Escrow
						</CardDescription>
					</CardHeader>
					<CardContent className="p-4 pt-1">
						<div className="flex items-baseline justify-between">
							<span className="text-2xl font-black text-foreground">
								GHS {totalHeldAmount.toFixed(2)}
							</span>
							<Badge variant="outline" className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/20">
								{totalHeldCount} Held
							</Badge>
						</div>
						<p className="text-[11px] text-muted-foreground mt-1">
							Awaiting administrative refund review
						</p>
					</CardContent>
				</Card>

				<Card className="rounded-xl border border-border/80 shadow-sm bg-card/60 backdrop-blur-sm">
					<CardHeader className="p-4 pb-1">
						<CardDescription className="text-xs font-medium">
							Due for Refund ({depositRules.refundWindowDays}+ days)
						</CardDescription>
					</CardHeader>
					<CardContent className="p-4 pt-1">
						<div className="flex items-baseline justify-between">
							<span className={`text-2xl font-black ${dueRefundsCount > 0 ? "text-amber-500" : "text-foreground"}`}>
								{dueRefundsCount}
							</span>
							{dueRefundsCount > 0 ? (
								<Badge className="text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">
									Action Needed
								</Badge>
							) : (
								<Badge variant="outline" className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
									All Clear
								</Badge>
							)}
						</div>
						<p className="text-[11px] text-muted-foreground mt-1">
							Held past {depositRules.refundWindowDays}-day target window
						</p>
					</CardContent>
				</Card>

				<Card className="rounded-xl border border-border/80 shadow-sm bg-card/60 backdrop-blur-sm">
					<CardHeader className="p-4 pb-1">
						<CardDescription className="text-xs font-medium">
							Total Refunded
						</CardDescription>
					</CardHeader>
					<CardContent className="p-4 pt-1">
						<div className="flex items-baseline justify-between">
							<span className="text-2xl font-black text-foreground">
								GHS {totalRefundedAmount.toFixed(2)}
							</span>
							<Badge variant="outline" className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
								{totalRefundedCount} Returned
							</Badge>
						</div>
						<p className="text-[11px] text-muted-foreground mt-1">
							Refunded directly via Paystack API
						</p>
					</CardContent>
				</Card>

				<Card className="rounded-xl border border-border/80 shadow-sm bg-card/60 backdrop-blur-sm">
					<CardHeader className="p-4 pb-1">
						<CardDescription className="text-xs font-medium">
							Current Policy Status
						</CardDescription>
					</CardHeader>
					<CardContent className="p-4 pt-1">
						<div className="flex items-baseline justify-between">
							<span className="text-lg font-bold text-foreground">
								GHS {depositRules.amount.toFixed(2)}
							</span>
							<Badge variant={depositRules.enabled ? "default" : "secondary"} className="text-[10px] py-0 h-4">
								{depositRules.enabled ? "Active" : "Disabled"}
							</Badge>
						</div>
						<p className="text-[11px] text-muted-foreground mt-1">
							{depositRules.scope === "first_event_only" ? "First event per org" : "Every created event"} • {depositRules.refundWindowDays}d window
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Search & Filter Toolbar */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search by event, organizer, or reference..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9 h-9 text-xs"
					/>
				</div>

				<div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
					<Button
						variant={statusFilter === "all" ? "default" : "outline"}
						size="sm"
						onClick={() => setStatusFilter("all")}
						className="text-xs h-8 rounded-lg"
					>
						All ({deposits.length})
					</Button>
					<Button
						variant={statusFilter === "due" ? "default" : "outline"}
						size="sm"
						onClick={() => setStatusFilter("due")}
						className={`text-xs h-8 rounded-lg ${
							dueRefundsCount > 0 && statusFilter !== "due"
								? "border-amber-500/50 text-amber-600 dark:text-amber-400"
								: ""
						}`}
					>
						Refund Due ({deposits.filter((d) => d.isDue).length})
					</Button>
					<Button
						variant={statusFilter === "held" ? "default" : "outline"}
						size="sm"
						onClick={() => setStatusFilter("held")}
						className="text-xs h-8 rounded-lg"
					>
						Held ({deposits.filter((d) => d.status === "held").length})
					</Button>
					<Button
						variant={statusFilter === "refunded" ? "default" : "outline"}
						size="sm"
						onClick={() => setStatusFilter("refunded")}
						className="text-xs h-8 rounded-lg"
					>
						Refunded ({deposits.filter((d) => d.status === "refunded").length})
					</Button>
				</div>
			</div>

			{/* Deposits Table */}
			<Card className="rounded-xl border border-border/80 shadow-sm overflow-hidden bg-card/60 backdrop-blur-sm">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<TableHead className="text-xs">Event & Organizer</TableHead>
								<TableHead className="text-xs">Amount</TableHead>
								<TableHead className="text-xs">Paid Date</TableHead>
								<TableHead className="text-xs">Days Held</TableHead>
								<TableHead className="text-xs">Reference</TableHead>
								<TableHead className="text-xs">Status</TableHead>
								<TableHead className="text-xs text-right">Action</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredDeposits.length === 0 ? (
								<TableRow>
									<TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
										<div className="flex flex-col items-center justify-center gap-2">
											<ShieldCheck className="h-8 w-8 text-muted-foreground/40" />
											<p>No security deposits found matching your filters.</p>
										</div>
									</TableCell>
								</TableRow>
							) : (
								filteredDeposits.map((dep) => (
									<TableRow key={dep.id} className="text-xs">
										<TableCell>
											<div className="space-y-0.5">
												<div className="font-semibold text-foreground flex items-center gap-1.5">
													<span>{dep.event?.title || "Untitled Event"}</span>
													{dep.event?.slug && (
														<Link
															href={`/events/${dep.event.slug}`}
															target="_blank"
															className="text-muted-foreground hover:text-foreground inline-flex items-center"
														>
															<ExternalLink className="h-3 w-3" />
														</Link>
													)}
												</div>
												<div className="text-[11px] text-muted-foreground flex items-center gap-1">
													<Building2 className="h-3 w-3" />
													<span>{dep.organization?.name || "Independent"}</span>
													<span>•</span>
													<span>{dep.organizerEmail}</span>
												</div>
											</div>
										</TableCell>

										<TableCell>
											<span className="font-bold text-foreground">
												GHS {dep.amount.toFixed(2)}
											</span>
										</TableCell>

										<TableCell className="text-muted-foreground">
											{formatDate(dep.createdAt)}
										</TableCell>

										<TableCell>
											{dep.status === "held" ? (
												<Badge
													variant={dep.isDue ? "destructive" : "secondary"}
													className={`text-[10px] font-semibold gap-1 ${
														dep.isDue
															? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25"
															: ""
													}`}
												>
													<Clock className="h-2.5 w-2.5" />
													{dep.daysHeld} {dep.daysHeld === 1 ? "day" : "days"} held
													{dep.isDue && " • Due"}
												</Badge>
											) : (
												<span className="text-[11px] text-muted-foreground">
													Refunded
												</span>
											)}
										</TableCell>

										<TableCell>
											<div className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
												<span>{dep.reference.slice(0, 16)}...</span>
												<Button
													variant="ghost"
													size="icon"
													className="h-5 w-5 text-muted-foreground hover:text-foreground"
													onClick={() => handleCopy(dep.reference)}
												>
													{copiedRef === dep.reference ? (
														<Check className="h-2.5 w-2.5 text-emerald-500" />
													) : (
														<Copy className="h-2.5 w-2.5" />
													)}
												</Button>
											</div>
										</TableCell>

										<TableCell>
											{dep.status === "held" ? (
												<Badge
													variant="outline"
													className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/20"
												>
													Held in Escrow
												</Badge>
											) : (
												<Badge
													variant="outline"
													className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
												>
													Refunded
												</Badge>
											)}
										</TableCell>

										<TableCell className="text-right">
											{dep.status === "held" ? (
												<Button
													size="sm"
													variant="default"
													onClick={() => setRefundTarget(dep)}
													className="text-xs h-8 font-semibold shadow-xs gap-1.5"
												>
													<RotateCcw className="h-3 w-3" />
													Refund via Paystack
												</Button>
											) : (
												<div className="text-[11px] text-muted-foreground">
													{dep.refundedAt ? formatDate(dep.refundedAt) : "Refunded"}
												</div>
											)}
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</Card>

			{/* 1-Click Paystack Refund Confirmation Dialog */}
			<Dialog open={!!refundTarget} onOpenChange={(open) => !open && setRefundTarget(null)}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<div className="flex items-center gap-2 mb-1">
							<div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
								<RotateCcw className="h-5 w-5" />
							</div>
							<div>
								<DialogTitle className="text-base font-bold">
									Confirm Paystack Refund
								</DialogTitle>
								<DialogDescription className="text-xs">
									Refund commitment deposit directly back to organizer.
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					{refundTarget && (
						<div className="space-y-4 py-2 text-xs">
							<div className="rounded-lg border border-border p-3 space-y-2 bg-muted/40">
								<div className="flex justify-between items-center">
									<span className="text-muted-foreground">Event:</span>
									<span className="font-semibold text-foreground">
										{refundTarget.event?.title || "Event"}
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-muted-foreground">Organizer:</span>
									<span className="font-semibold text-foreground">
										{refundTarget.organization?.name || refundTarget.organizerEmail}
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-muted-foreground">Deposit Amount:</span>
									<span className="font-bold text-foreground text-sm">
										GHS {refundTarget.amount.toFixed(2)}
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-muted-foreground">Days Held in Escrow:</span>
									<span className="font-semibold text-foreground">
										{refundTarget.daysHeld} days
									</span>
								</div>
								<div className="flex justify-between items-center border-t border-border/50 pt-2">
									<span className="text-muted-foreground">Paystack Ref:</span>
									<span className="font-mono text-[11px] text-foreground">
										{refundTarget.reference}
									</span>
								</div>
							</div>

							<div className="flex items-start gap-2 text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/20">
								<AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
								<div>
									Paystack will immediately credit the organizer’s original payment method (Mobile Money wallet or bank card) and reverse Paystack transaction fees.
								</div>
							</div>
						</div>
					)}

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setRefundTarget(null)}
							disabled={isRefunding}
							className="text-xs h-9"
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleProcessRefund}
							disabled={isRefunding}
							className="text-xs h-9 font-semibold gap-1.5 shadow-sm"
						>
							{isRefunding ? (
								<>
									<Loader2 className="h-3.5 w-3.5 animate-spin" />
									Processing on Paystack...
								</>
							) : (
								<>
									<RotateCcw className="h-3.5 w-3.5" />
									Confirm & Refund GHS {refundTarget?.amount.toFixed(2)}
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Deposit Policy Rules Dialog */}
			<Dialog open={isRulesDialogOpen} onOpenChange={setIsRulesDialogOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<div className="flex items-center gap-2 mb-1">
							<div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
								<Sliders className="h-5 w-5" />
							</div>
							<div>
								<DialogTitle className="text-base font-bold">
									Configure Security Deposit Policy
								</DialogTitle>
								<DialogDescription className="text-xs">
									Adjust commitment deposit amounts, application scope, and refund windows.
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					<div className="space-y-4 py-2 text-xs">
						<div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/40">
							<div className="space-y-0.5">
								<Label className="text-xs font-semibold">Enable Security Deposits</Label>
								<p className="text-[11px] text-muted-foreground">
									When enabled, organizers must pay a refundable deposit before publishing.
								</p>
							</div>
							<Switch
								checked={rulesForm.enabled}
								onCheckedChange={(checked) =>
									setRulesForm((prev) => ({ ...prev, enabled: checked }))
								}
							/>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs font-semibold">Deposit Amount (GHS)</Label>
							<Input
								type="number"
								min="1"
								step="1"
								value={rulesForm.amount}
								onChange={(e) =>
									setRulesForm((prev) => ({ ...prev, amount: Number(e.target.value) }))
								}
								className="h-9 text-xs"
								placeholder="100"
							/>
							<p className="text-[11px] text-muted-foreground">
								The refundable fee charged to the organizer via Paystack.
							</p>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs font-semibold">Policy Scope</Label>
							<Select
								value={rulesForm.scope}
								onValueChange={(val: "first_event_only" | "every_event") =>
									setRulesForm((prev) => ({ ...prev, scope: val }))
								}
							>
								<SelectTrigger className="h-9 text-xs">
									<SelectValue placeholder="Select Scope" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="first_event_only" className="text-xs">
										First Event Only (Exempt after 1st published event)
									</SelectItem>
									<SelectItem value="every_event" className="text-xs">
										Every Event (Charged for each newly published event)
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs font-semibold">Refund Target Window (Days)</Label>
							<Input
								type="number"
								min="1"
								step="1"
								value={rulesForm.refundWindowDays}
								onChange={(e) =>
									setRulesForm((prev) => ({
										...prev,
										refundWindowDays: Number(e.target.value),
									}))
								}
								className="h-9 text-xs"
								placeholder="2"
							/>
							<p className="text-[11px] text-muted-foreground">
								Target days to refund the deposit. Deposits held past this duration are flagged as &quot;Refund Due&quot;.
							</p>
						</div>
					</div>

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsRulesDialogOpen(false)}
							disabled={isPending}
							className="text-xs h-9"
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleSaveRules}
							disabled={isPending}
							className="text-xs h-9 font-semibold gap-1.5 shadow-sm"
						>
							{isPending ? (
								<>
									<Loader2 className="h-3.5 w-3.5 animate-spin" />
									Saving...
								</>
							) : (
								"Save Policy"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
