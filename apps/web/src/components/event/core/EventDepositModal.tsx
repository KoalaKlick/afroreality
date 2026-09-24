"use client";

import React, { useState } from "react";
import { ShieldCheck, ArrowRight, Loader2, Info, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { initializeEventDepositPayment } from "@/lib/server-functions/event-mgmt";

interface EventDepositModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	eventId: string;
	eventTitle: string;
	amount: number;
	refundWindowDays: number;
	onSuccess?: () => void;
}

export function EventDepositModal({
	open,
	onOpenChange,
	eventId,
	eventTitle,
	amount,
	refundWindowDays,
	onSuccess,
}: EventDepositModalProps) {
	const [isLoading, setIsLoading] = useState(false);

	const handlePayDeposit = async () => {
		setIsLoading(true);
		try {
			const res = await initializeEventDepositPayment({ eventId });
			if (res.success && res.authorizationUrl) {
				toast.info("Redirecting to Paystack secure checkout...");
				if (onSuccess) onSuccess();
				window.location.href = res.authorizationUrl;
			} else {
				toast.error(res.error || "Failed to initialize security deposit payment.");
				setIsLoading(false);
			}
		} catch (err: any) {
			console.error("[EVENT-DEPOSIT-MODAL-ERROR]", err);
			toast.error(err?.message || "An unexpected error occurred.");
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md p-0 overflow-hidden border-border/80 shadow-2xl">
				{/* Top Branding Banner */}
				<div className="bg-gradient-to-br from-primary/15 via-primary/5 to-background p-6 border-b border-border/60">
					<div className="flex items-center gap-3 mb-2">
						<div className="h-10 w-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 shadow-xs border border-primary/30">
							<ShieldCheck className="h-5 w-5" />
						</div>
						<div>
							<DialogTitle className="text-lg font-bold text-foreground tracking-tight">
								Refundable Security Deposit
							</DialogTitle>
							<DialogDescription className="text-xs text-muted-foreground mt-0.5">
								Required commitment fee before publishing your event.
							</DialogDescription>
						</div>
					</div>
				</div>

				<div className="p-6 space-y-5">
					{/* Deposit Card */}
					<div className="rounded-md border border-gray-300/30 bg-gray-100 p-4 relative overflow-hidden">
						<div className="flex items-center justify-between mb-1.5">
							<span className="text-xs font-semibold text-gray-500 uppercase ">
								Commitment Deposit
							</span>
							<Badge className="bg-gray-400/20 rounded-xs text-gray-900 hover:bg-gray-400/10 font-semibold text-[11px] px-2 py-0.5">
								100% Refundable
							</Badge>
						</div>
						<div className="flex items-baseline gap-1.5">
							<span className="text-3xl font-black text-foreground tracking-tight">
								GHS {amount.toFixed(2)}
							</span>
							<span className="text-xs text-muted-foreground">held in escrow</span>
						</div>
						<p className="text-xs text-muted-foreground mt-2 border-t border-primary/10 pt-2 font-medium">
							For event: <strong className="text-foreground">{eventTitle}</strong>
						</p>
					</div>

					{/* Policy Highlights */}
					<div className="space-y-3">
						<div className="flex items-start gap-2.5 text-xs text-muted-foreground">
							<Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
							<div>
								<span className="font-semibold text-foreground">Refunded within {refundWindowDays} days: </span>
								Fextiva review and refund the deposit directly to your original payment method.
							</div>
						</div>

						<div className="flex items-start gap-2.5 text-xs text-muted-foreground">
							<RefreshCw className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
							<div>
								<span className="font-semibold text-foreground">Direct Paystack Refund: </span>
								The refund goes straight back to your Mobile Money or Card — never deducted from ticket sales or voting revenue.
							</div>
						</div>

						<div className="flex items-start gap-2.5 text-xs text-muted-foreground">
							<Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
							<div>
								<span className="font-semibold text-foreground">Platform Integrity: </span>
								This deposit prevents spam and guarantees authentic event hosting on the network.
							</div>
						</div>
					</div>
				</div>

				<DialogFooter className="p-4 bg-muted/30  flex border-t border-border/60 gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => onOpenChange(false)}
						disabled={isLoading}
						className="text-xs h-9"
					>
						Cancel
					</Button>
					<Button
						size="sm"
						onClick={handlePayDeposit}
						disabled={isLoading}
						className="text-xs h-9 font-semibold gap-1.5 shadow-sm"
					>
						{isLoading ? (
							<>
								<Loader2 className="h-3.5 w-3.5 animate-spin" />
								Initializing Checkout...
							</>
						) : (
							<>
								Pay GHS {amount.toFixed(2)} & Publish
								<ArrowRight className="h-3.5 w-3.5" />
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
