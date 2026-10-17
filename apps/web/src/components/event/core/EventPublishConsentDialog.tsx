"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText, ShieldCheck, Clock, CheckCircle2 } from "lucide-react";
import { PayoutPolicyModal, PayoutPolicyRules } from "@/components/shared/PayoutPolicyModal";
import headerBannerImg from "@/assets/refundable-bg.jpg";

interface EventPublishConsentDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	eventTitle: string;
	eventType: string;
	isPaidEvent: boolean;
	policyRules?: PayoutPolicyRules;
	onConfirm: () => void;
	isPublishing?: boolean;
}

export function EventPublishConsentDialog({
	open,
	onOpenChange,
	eventTitle,
	eventType,
	isPaidEvent,
	policyRules,
	onConfirm,
	isPublishing = false,
}: EventPublishConsentDialogProps) {
	const [hasAgreed, setHasAgreed] = useState(false);
	const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);

	const minEventAgeDays = policyRules?.minEventAgeDays ?? 7;
	const residualAutoPayoutDays = policyRules?.residualAutoPayoutDays ?? 14;
	const minAmount = policyRules?.minAmount ?? 20;
	const currency = policyRules?.currency || "GHS";

	const handleProceed = () => {
		if (!hasAgreed) return;
		onConfirm();
	};

	return (
		<>
			<Dialog
				open={open}
				onOpenChange={(newOpen) => {
					if (!isPublishing) {
						onOpenChange(newOpen);
						if (!newOpen) setHasAgreed(false);
					}
				}}
			>
				<DialogContent className="max-w-md p-0 overflow-hidden bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xl rounded-xl gap-0">
					{/* Accessible Title & Description for Screen Readers */}
					<DialogTitle className="sr-only">
						Publish Event & Settlement Policy Agreement
					</DialogTitle>
					<DialogDescription className="sr-only">
						Review and acknowledge platform settlement terms and cooling periods before publishing live.
					</DialogDescription>

					{/* Clean Header Banner Image */}
					<div className="relative w-full h-36 sm:h-32 overflow-hidden bg-zinc-100 dark:bg-zinc-800/60 border-b border-zinc-200/80 dark:border-zinc-800">
						<Image
							src={headerBannerImg}
							alt="Platform Settlement Policy"
							fill
							priority
							className="object-cover object-center"
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
						<div className="absolute bottom-3 left-5 right-5 flex items-end justify-between text-white">
							<div>
								<div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
									<ShieldCheck className="size-3.5" />
									<span>Official Publication Policy</span>
								</div>
								<div className="text-base font-bold text-white tracking-tight mt-0.5">
									Settlement & Payout Agreement
								</div>
							</div>
							<Badge className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border-white/20 text-[10px] px-2 py-0.5 font-mono">
								T+1 Cycle
							</Badge>
						</div>
					</div>

					<div className="p-5 sm:p-6 space-y-4 dark:bg-zinc-900/60">
						<div className="space-y-1">
							<div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
								Publishing &ldquo;{eventTitle}&rdquo;
							</div>
							<p className="text-[11px] text-zinc-500 leading-relaxed">
								Making this event live enables ticketing, voting, and attendee transactions subject to platform financial clearance.
							</p>
						</div>

						{/* Clean Policy Highlights Card */}
						{isPaidEvent ? (
							<div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-3.5 space-y-2.5 text-xs">
								<div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
									<span>Platform Settlement Rules</span>
									<span className="text-[10px] font-mono text-zinc-500 uppercase">T+1 Clearance</span>
								</div>

								<div className="space-y-2 text-[11px] text-zinc-600 dark:text-zinc-400">
									<div className="flex items-start gap-2">
										<Clock className="size-3.5 text-primary shrink-0 mt-0.5" />
										<span>
											<strong>Cooling Period:</strong> Initial event withdrawal requires a minimum holding window of <strong>{minEventAgeDays} days</strong> following the first event transaction.
										</span>
									</div>
									<div className="flex items-start gap-2">
										<CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
										<span>
											<strong>Residual Clearance:</strong> Remaining balances under {currency} {minAmount.toFixed(2)} are automatically disbursed within <strong>{residualAutoPayoutDays} days</strong> after event conclusion with transfer fees waived.
										</span>
									</div>
								</div>

								<div className="pt-2 border-t border-zinc-200 dark:border-zinc-700/60 flex justify-end">
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
						) : (
							<div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-3 text-xs text-zinc-500">
								This is a free admission event. No attendee ticketing fees or financial deductions apply.
							</div>
						)}

						{/* Consent Checkbox */}
						<div className="flex items-start space-x-2.5 pt-1">
							<Checkbox
								id="publish-payout-consent"
								checked={hasAgreed}
								onCheckedChange={(checked) => setHasAgreed(checked === true)}
								className="mt-0.5 shrink-0"
							/>
							<Label
								htmlFor="publish-payout-consent"
								className="text-xs text-zinc-700 dark:text-zinc-300 font-normal leading-relaxed cursor-pointer"
							>
								I confirm that I have reviewed, understand, and agree to the{" "}
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
								{isPaidEvent
									? `, including the ${minEventAgeDays}-day holding period before initial withdrawal and post-event residual disbursement terms.`
									: " and platform terms of service."}
							</Label>
						</div>
					</div>

					<DialogFooter className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0 gap-2 sm:gap-0">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => onOpenChange(false)}
							disabled={isPublishing}
						>
							Cancel
						</Button>
						<Button
							type="button"
							size="sm"
							onClick={handleProceed}
							disabled={!hasAgreed || isPublishing}
							className="font-semibold"
						>
							{isPublishing ? "Publishing..." : "Confirm & Publish Live"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Official PDF Document Viewer Modal */}
			<PayoutPolicyModal
				open={isPolicyModalOpen}
				onOpenChange={setIsPolicyModalOpen}
				rules={policyRules}
			/>
		</>
	);
}
