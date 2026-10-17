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
import headerBannerImg from "@/assets/payment-concent.jpg";

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
				<DialogContent className="max-w-md p-0 overflow-hidden bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 gap-0">
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
							className="object-cover object-center object-bottom"
						/>
						<div className="absolute inset-0 " />
				
					</div>

					<div className="p-5 sm:p-6 space-y-4 dark:bg-zinc-900/60">

						<div>

							<div className="text-base font-bold tracking-tight mt-0.5">
								Settlement & Payout Agreement
							</div>
						</div>
						<div className="space-y-1">
							<div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
								Publishing &ldquo;{eventTitle}&rdquo;
							</div>
							<p className="text-[11px] text-zinc-500 leading-relaxed">
								Making this event live enables ticketing, voting, and attendee transactions subject to platform financial clearance.
							</p>
						</div>

						{/* Clean Policy Highlights Card */}


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
								className="text-xs text-zinc-700 inline dark:text-zinc-300 font-normal cursor-pointer"
							>
								I confirm that I have reviewed, understand, and agree to the{" "}
								<button
									type="button"
									onClick={(e) => {
										e.preventDefault();
										setIsPolicyModalOpen(true);
									}}
									className="text-primary inline-flex font-medium underline underline-offset-2 hover:opacity-80"
								>
									Platform Settlement & Payout Policy
								</button>

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
