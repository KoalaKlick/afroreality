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

import Image from "next/image";
import refundableHeaderImg from "@/assets/refundable-bg.jpg";

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
			<DialogContent
				className="max-w-md p-0 overflow-hidden bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xl rounded-lg gap-0"
			>
				{/* Accessible Title & Description for Screen Readers */}
				<DialogTitle className="sr-only">
					Refundable Security Deposit
				</DialogTitle>
				<DialogDescription className="sr-only">
					Refundable commitment deposit for publishing this event.
				</DialogDescription>

				{/* Header Banner Image */}
				<div className="relative w-full h-40 sm:h-32 overflow-hidden bg-zinc-100 dark:bg-zinc-800/60 border-b border-zinc-200/80 dark:border-zinc-800">
					<Image
						src={refundableHeaderImg}
						alt="Refundable Deposit"
						fill
						priority
						className="object-cover object-center"
					/>
				</div>

				<div className="p-5 sm:p-6 space-y-4 dark:bg-zinc-900/60">
					{/* Deposit Card - Meta styled clean gray */}
					<div className="rounded-xl  bg-zinc-50 dark:border-zinc-800 bg-white dark:bg-zinc-800/80 p-4 shadow-2xs">
						<div className="flex items-center justify-between mb-1.5">
							<span className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
								Commitment Deposit
							</span>
							<Badge className="bg-zinc-200 dark:bg-zinc-700/80 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200/80 border-zinc-200 dark:border-zinc-600 font-medium text-[11px] px-2 py-0.5 rounded-xs">
								100% Refundable
							</Badge>
						</div>
						<div className="flex items-baseline gap-2">
							<span className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
								GHS {amount.toFixed(2)}
							</span>
							<span className="text-xs text-zinc-500">held in escrow</span>
						</div>
						<p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-700/60 font-medium truncate">
							For event: <strong className="text-zinc-900 dark:text-zinc-200">{eventTitle}</strong>
						</p>
					</div>

					{/* Policy Highlights - Gray & subtle */}
					<div className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-400 px-0.5">
						<div className="flex items-start gap-2.5">
							<Clock className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
							<div>
								<span className="font-semibold text-zinc-800 dark:text-zinc-200">
									Refunded within {refundWindowDays} days:{" "}
								</span>
								Fextiva reviews and refunds the deposit directly to your original payment method.
							</div>
						</div>

						<div className="flex items-start gap-2.5">
							<RefreshCw className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
							<div>
								<span className="font-semibold text-zinc-800 dark:text-zinc-200">
									Direct Paystack Refund:{" "}
								</span>
								Sent straight back to your Mobile Money or Card — never deducted from ticket sales or voting revenue.
							</div>
						</div>

						<div className="flex items-start gap-2.5">
							<Info className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
							<div>
								<span className="font-semibold text-zinc-800 dark:text-zinc-200">
									Platform Integrity:{" "}
								</span>
								This deposit prevents spam and guarantees authentic event hosting on the network.
							</div>
						</div>
					</div>
				</div>

				<DialogFooter className="p-4 bg-zinc-100/70 dark:bg-zinc-800/40 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-end gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onOpenChange(false)}
						disabled={isLoading}
						className="text-xs h-9 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-700"
					>
						Cancel
					</Button>
					<Button
						size="sm"
						onClick={handlePayDeposit}
						disabled={isLoading}
						className="text-xs h-9 font-semibold gap-1.5 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 shadow-sm"
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
