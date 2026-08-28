"use client";
// src/components/organization/billing/FeeCalculator.tsx

import { Calculator } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateFee, type TransactionType } from "@/lib/constants/pricing";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface FeeCalculatorProps {
	readonly className?: string;
}

const TRANSACTION_TYPES: TransactionType[] = ["vote", "nomination", "ticket"];

export function FeeCalculator({ className }: FeeCalculatorProps) {
	const [previewAmount, setPreviewAmount] = useState<string>("100");
	const [previewType, setPreviewType] = useState<TransactionType>("ticket");

	const amount = parseFloat(previewAmount) || 0;
	const breakdown = amount > 0 ? calculateFee(amount, previewType) : null;

	return (
		<Card className={cn("bg-card rounded-md p-6", className)}>
			<div className="flex items-center gap-2 mb-4">
				<Calculator className="w-5 h-5 text-[#FFCD00]" />
				<h3 className="font-semibold">Fee Calculator</h3>
			</div>
			<p className="text-xs text-muted-foreground mb-4">
				Preview how fees apply to different transaction types.
			</p>

			<div className="space-y-4">
				<div className="flex gap-2">
					{TRANSACTION_TYPES.map((type) => (
						<Button
							variant={previewType === type ? "tertiary" : "outline"}
							key={type}
							size="sm"
							onClick={() => setPreviewType(type)}
							className={cn(
								"px-3 py-1.5 text-xs font-bold uppercase tracking-wider",
							)}
						>
							{type}
						</Button>
					))}
				</div>

				<div className="space-y-2">
					<Label className="text-sm">Transaction Amount (GHS)</Label>
					<Input
						type="number"
						value={previewAmount}
						onChange={(e) => setPreviewAmount(e.target.value)}
						placeholder="100"
						min={0}
						className="h-10"
					/>
				</div>

				{breakdown && (
					<div className="rounded-md p-4 border border-[#009A44]/20 bg-[#009A44]/3">
						<div className="space-y-2">
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">
									Transaction Amount
								</span>
								<span className="font-medium">
									GHS {breakdown.amount.toFixed(2)}
								</span>
							</div>
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">
									Platform Fee ({breakdown.feePercentage * 100}%
									{breakdown.fixedFee > 0 ? ` + GHS ${breakdown.fixedFee}` : ""}
									)
								</span>
								<span className="font-bold text-red-600">
									− GHS {breakdown.totalPlatformFee.toFixed(2)}
								</span>
							</div>
							<div className="border-t pt-2 flex justify-between text-sm">
								<span className="font-semibold">You Receive</span>
								<span className="font-black text-[#009A44] text-base">
									GHS {breakdown.organizerReceives.toFixed(2)}
								</span>
							</div>
						</div>
					</div>
				)}
			</div>
		</Card>
	);
}
