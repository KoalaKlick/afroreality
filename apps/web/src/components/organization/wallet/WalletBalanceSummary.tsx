"use client";
// src/components/organization/wallet/WalletBalanceSummary.tsx

import { ArrowDownToLine, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ConfirmPasswordDialog } from "@/components/shared/ConfirmPasswordDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePermissions } from "@/hooks/use-permissions";
import { requestWalletWithdrawal } from "@/lib/server-functions/wallet";
import { StatCard, statIcons } from "@/components/event/core/EventStats";

interface WalletBalanceSummaryProps {
	readonly organizationId: string;
	readonly availableBalance?: number;
	readonly pendingBalance?: number;
	readonly totalPayouts?: number;
	readonly currency?: string;
}

export function WalletBalanceSummary({
	organizationId,
	availableBalance = 0,
	pendingBalance = 0,
	totalPayouts = 0,
	currency = "GHS",
}: WalletBalanceSummaryProps) {
	const router = useRouter();
	const { canWithdraw } = usePermissions();
	const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [amount, setAmount] = useState("");
	const [description, setDescription] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const parsedAmount = Number.parseFloat(amount);
	const isValidAmount =
		!Number.isNaN(parsedAmount) &&
		parsedAmount > 0 &&
		parsedAmount <= availableBalance;

	function handleWithdrawClick() {
		setAmount("");
		setDescription("");
		setIsWithdrawOpen((prev) => !prev);
	}

	function handleProceed() {
		if (!isValidAmount) {
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
		setIsSubmitting(true);
		try {
			const result = await requestWalletWithdrawal({
				data: {
					organizationId,
					amount: parsedAmount,
					description: description || undefined,
				},
			});
			toast.success(result.message ?? "Withdrawal request submitted.");
			setAmount("");
			setDescription("");
			router.refresh();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to request withdrawal",
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	const balanceIcon = currency === "EUR" ? statIcons.euro : statIcons.cedi;

	return (
		<div className="space-y-4">
			{/* Top Action Bar */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h3 className="text-sm font-semibold tracking-tight text-muted-foreground uppercase">
						Balances & Payouts
					</h3>
				</div>
				{canWithdraw && (
					<Button
						size="sm"
						variant={isWithdrawOpen ? "outline" : "default"}
						className="gap-1.5 shadow-xs"
						onClick={handleWithdrawClick}
						disabled={availableBalance <= 0}
					>
						<ArrowDownToLine className="h-4 w-4" />
						{isWithdrawOpen ? "Close Form" : "Request Withdrawal"}
					</Button>
				)}
			</div>

			{/* 3 Identical Reusable Stat Cards matching dashboard layout */}
			<div className="grid gap-4 sm:grid-cols-3">
				<StatCard
					label="Available Balance"
					value={`${currency} ${availableBalance.toFixed(2)}`}
					iconSrc={balanceIcon}
					description="Funds ready to withdraw"
				/>

				<StatCard
					label="Pending Balance"
					value={`${currency} ${pendingBalance.toFixed(2)}`}
					iconSrc={statIcons.ongoing}
					description="Transactions clearing"
				/>

				<StatCard
					label="Total Payouts"
					value={`${currency} ${totalPayouts.toFixed(2)}`}
					iconSrc={statIcons.analytics}
					description="Cumulative withdrawals"
				/>
			</div>

			{/* Step 1: Enter amount form dropdown */}
			{isWithdrawOpen && (
				<Card className="border-primary/30 bg-primary/5 transition-all animate-in fade-in slide-in-from-top-2 duration-200">
					<CardHeader className="pb-3">
						<CardTitle className="text-base flex items-center justify-between">
							<span className="flex items-center gap-2">
								<ArrowDownToLine className="h-4 w-4 text-primary" />
								Request Withdrawal
							</span>
							<span className="text-xs font-normal text-muted-foreground">
								Max: <strong className="text-foreground">{currency} {availableBalance.toFixed(2)}</strong>
							</span>
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="withdrawal-amount">
									Amount ({currency}) <span className="text-destructive">*</span>
								</Label>
								<Input
									id="withdrawal-amount"
									type="number"
									min={1}
									max={availableBalance}
									step="0.01"
									value={amount}
									onChange={(e) => setAmount(e.target.value)}
									placeholder={`e.g. ${availableBalance.toFixed(2)}`}
									autoFocus
								/>
								{parsedAmount > availableBalance && (
									<p className="text-xs text-destructive">
										Amount exceeds available balance ({currency}{" "}
										{availableBalance.toFixed(2)})
									</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="withdrawal-description">
									Description / Reference (optional)
								</Label>
								<Input
									id="withdrawal-description"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder="e.g. Monthly event revenue payout"
								/>
							</div>
						</div>
						<div className="flex justify-end gap-3 pt-2">
							<Button
								variant="ghost"
								onClick={() => setIsWithdrawOpen(false)}
							>
								Cancel
							</Button>
							<Button
								onClick={handleProceed}
								disabled={!isValidAmount || isSubmitting}
							>
								{isSubmitting && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Continue to Confirm
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Step 2: Confirm password */}
			<ConfirmPasswordDialog
				open={isConfirmOpen}
				onOpenChange={setIsConfirmOpen}
				title="Confirm Withdrawal"
				description={`You are about to request a withdrawal of ${currency} ${parsedAmount > 0 ? parsedAmount.toFixed(2) : "0.00"}. Please enter your account password to confirm.`}
				confirmLabel="Submit Withdrawal"
				onConfirm={handleConfirmedWithdraw}
			/>
		</div>
	);
}
