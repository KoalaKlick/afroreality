"use client";

import React, { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X, Download, ShieldCheck, FileText } from "lucide-react";

export interface PayoutPolicyRules {
	minAmount?: number;
	transferFee?: number;
	freePerWeek?: number;
	minEventAgeDays?: number;
	residualAutoPayoutDays?: number;
	currency?: string;
}

interface PayoutPolicyModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	rules?: PayoutPolicyRules;
}

export function PayoutPolicyModal({
	open,
	onOpenChange,
	rules,
}: PayoutPolicyModalProps) {
	const printRef = useRef<HTMLDivElement>(null);

	const minAmount = rules?.minAmount ?? 20;
	const transferFee = rules?.transferFee ?? 1.0;
	const freePerWeek = rules?.freePerWeek ?? 1;
	const minEventAgeDays = rules?.minEventAgeDays ?? 7;
	const residualAutoPayoutDays = rules?.residualAutoPayoutDays ?? 14;
	const currency = rules?.currency || "GHS";

	const handlePrint = () => {
		const printContent = printRef.current;
		if (!printContent) {
			window.print();
			return;
		}

		// Create a clean, isolated hidden iframe specifically calibrated for 100% full A4 PDF printing
		const iframe = document.createElement("iframe");
		iframe.setAttribute("style", "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:0;opacity:0;pointer-events:none;");
		document.body.appendChild(iframe);

		const doc = iframe.contentWindow?.document;
		if (!doc) {
			window.print();
			return;
		}

		// Gather stylesheets from main document
		const styleSheets = Array.from(document.querySelectorAll("link[rel='stylesheet'], style"))
			.map((el) => el.outerHTML)
			.join("\n");

		doc.open();
		doc.write(`
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="utf-8" />
				<title>FEXTIVA_Settlement_Payout_Policy.pdf</title>
				${styleSheets}
				<style>
					@page {
						size: A4 portrait;
						margin: 14mm 16mm 14mm 16mm;
					}
					* {
						box-sizing: border-box;
						-webkit-print-color-adjust: exact !important;
						print-color-adjust: exact !important;
					}
					html, body {
						margin: 0 !important;
						padding: 0 !important;
						background: #ffffff !important;
						color: #18181b !important;
						font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
						font-size: 11px;
						line-height: 1.6;
						width: 100% !important;
					}
					.print-document-root {
						width: 100% !important;
						max-width: 100% !important;
						margin: 0 !important;
						padding: 0 !important;
						border: none !important;
						box-shadow: none !important;
						background: #ffffff !important;
					}
					section {
						break-inside: avoid;
						page-break-inside: avoid;
						margin-bottom: 16px;
					}
					table, .letterhead, .signoff {
						break-inside: avoid;
						page-break-inside: avoid;
					}
				</style>
			</head>
			<body>
				<div class="print-document-root">
					${printContent.innerHTML}
				</div>
			</body>
			</html>
		`);
		doc.close();

		iframe.contentWindow?.focus();
		setTimeout(() => {
			try {
				iframe.contentWindow?.print();
			} catch (e) {
				window.print();
			} finally {
				setTimeout(() => {
					if (document.body.contains(iframe)) {
						document.body.removeChild(iframe);
					}
				}, 2000);
			}
		}, 300);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton={false}
				className="max-w-3xl md:max-w-4xl p-0 overflow-hidden bg-zinc-100 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 gap-0 max-h-[99dvh] flex flex-col rounded-none print:p-0 print:m-0 print:border-none print:shadow-none print:max-w-none print:w-full print:h-auto print:static print:transform-none"
			>
				<DialogHeader className="sr-only">
					<DialogTitle>Official Platform Settlement & Payout Policy</DialogTitle>
					<DialogDescription>
						Regulatory terms and operational conditions for organizer revenue withdrawals and post-event settlements.
					</DialogDescription>
				</DialogHeader>

				{/* Global Print Stylesheet for native Ctrl+P */}
				<style jsx global>{`
					@media print {
						@page {
							size: A4 portrait !important;
							margin: 12mm 15mm !important;
						}
						[data-slot="dialog-overlay"],
						[data-slot="dialog-close"],
						.print\\:hidden {
							display: none !important;
						}
						[data-slot="dialog-content"] {
							position: static !important;
							top: auto !important;
							left: auto !important;
							transform: none !important;
							width: 100% !important;
							max-width: 100% !important;
							height: auto !important;
							max-height: none !important;
							padding: 0 !important;
							margin: 0 !important;
							border: none !important;
							box-shadow: none !important;
							background: white !important;
							overflow: visible !important;
						}
						.policy-print-canvas {
							padding: 0 !important;
							margin: 0 !important;
							background: white !important;
							overflow: visible !important;
						}
						.policy-print-sheet {
							padding: 0 !important;
							margin: 0 !important;
							width: 100% !important;
							max-width: 100% !important;
							border: none !important;
							box-shadow: none !important;
							background: white !important;
							color: #000000 !important;
						}
					}
				`}</style>

				{/* Document Toolbar */}
				<div className="flex items-center justify-between px-6 py-3 bg-zinc-200/80 dark:bg-zinc-900 border-b border-zinc-300 dark:border-zinc-800 shrink-0 print:hidden">
					<div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 text-xs font-semibold tracking-wide">
						<FileText className="size-4 text-zinc-600 dark:text-zinc-400" />
						<span>OFFICIAL POLICY DOCUMENT &bull; PDF FORMAT</span>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={handlePrint}
							className="h-8 text-xs font-medium gap-1.5 bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 text-zinc-800 dark:text-zinc-200"
						>
							<Printer className="size-3.5" />
							Print / Save as PDF
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => onOpenChange(false)}
							className="h-8 w-8 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
							aria-label="Close"
						>
							<X className="size-4" />
						</Button>
					</div>
				</div>

				{/* Scrollable PDF Document Canvas */}
				<div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-zinc-200/50 dark:bg-zinc-950 policy-print-canvas">
					{/* PDF Sheet Representation */}
					<div
						ref={printRef}
						className="policy-print-sheet bg-white text-zinc-900 p-8 sm:p-12 w-full max-w-[800px] mx-auto font-sans text-xs leading-relaxed border border-zinc-200/80 shadow-sm print:m-0 print:p-0 print:w-full print:max-w-none print:shadow-none print:border-none print:text-black print:bg-white"
					>
						{/* Official Letterhead */}
						<div className="border-b-2 border-zinc-900 pb-5 mb-6">
							<div className="flex items-start justify-between gap-4">
								<div>
									<div className="text-[11px] font-bold tracking-widest text-zinc-600 uppercase">
										FEXTIVA .
									</div>
									<h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 uppercase mt-0.5">
										SETTLEMENT, DISBURSEMENT & PAYOUT POLICY
									</h1>
									<div className="text-[11px] font-semibold text-zinc-500 mt-1">
										Official Standard Operating Terms &bull; Version 2026.2
									</div>
								</div>
								<div className="text-right shrink-0 border-l border-zinc-300 pl-4">
									<div className="text-[9px] font-mono uppercase text-zinc-500 font-bold">Document Ref</div>
									<div className="text-[11px] font-mono font-bold text-zinc-900">DOC-POL-PAYOUT-GH</div>
									<div className="text-[9px] font-mono uppercase text-zinc-500 font-bold mt-1">Classification</div>
									<div className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block">
										OFFICIAL / BINDING
									</div>
								</div>
							</div>

							{/* Document Summary Matrix */}
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-50 border border-zinc-200 rounded p-3 mt-4 text-[10px]">
								<div>
									<span className="text-zinc-500 block uppercase font-bold text-[9px]">Effective Date</span>
									<span className="font-semibold text-zinc-900">July 2026</span>
								</div>
								<div>
									<span className="text-zinc-500 block uppercase font-bold text-[9px]">Jurisdiction</span>
									<span className="font-semibold text-zinc-900">Ghana (BoG Act 987)</span>
								</div>
								<div>
									<span className="text-zinc-500 block uppercase font-bold text-[9px]">Settlement Gateway</span>
									<span className="font-semibold text-zinc-900">Paystack Transfers</span>
								</div>
								<div>
									<span className="text-zinc-500 block uppercase font-bold text-[9px]">Settlement Cycle</span>
									<span className="font-semibold text-zinc-900">T+1 Business Days</span>
								</div>
							</div>
						</div>

						{/* Document Body - Clean Legal Clauses without emojis */}
						<div className="space-y-6 text-zinc-800">
							{/* Section 1 */}
							<section>
								<h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-200 pb-1 mb-2">
									1. Purpose and Scope
								</h2>
								<p>
									This policy establishes the formal terms governing the collection, holding, clearance, and disbursement
									of all funds generated through ticket sales, paid voting ballots, registrations, and nominations hosted
									on the platform. By creating an event or requesting a disbursement, organizers enter into a legally binding
									agreement subject to the operational controls outlined herein.
								</p>
							</section>

							{/* Section 2 */}
							<section>
								<h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-200 pb-1 mb-2">
									2. Payout Account Verification and Compliance
								</h2>
								<p>
									Disbursements are executed exclusively to verified domestic accounts registered within Ghana. Acceptable
									destinations comprise registered Mobile Money accounts (MTN MoMo, Telecel Cash, AT Money) and accredited
									commercial banking institutions.
								</p>
								<ul className="list-disc list-inside mt-2 space-y-1 pl-2 text-zinc-700">
									<li>The recipient account name must match the identity documentation submitted by the organization.</li>
									<li>Unverified, dormant, or third-party proxy accounts are strictly prohibited from receiving disbursements.</li>
									<li>Account details must be validated through automated bank resolution prior to publishing ticketed or voting events.</li>
								</ul>
							</section>

							{/* Section 3 */}
							<section>
								<h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-200 pb-1 mb-2">
									3. Settlement Schedule (T+1 Clearance Cycle)
								</h2>
								<p>
									Platform revenues operate on an industry-standard <strong>T+1 settlement schedule</strong> (one business day).
									Customer transactions completed on Day T become cleared and available for organizer withdrawal on Day T+1.
								</p>
								<p className="mt-1 text-zinc-700">
									Transactions settled on Fridays, weekends, or statutory public holidays clear on the subsequent official
									business day. Uncleared pending balances cannot be disbursed until full settlement confirmation is received
									from banking networks.
								</p>
							</section>

							{/* Section 4 */}
							<section>
								<h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-200 pb-1 mb-2">
									4. Minimum Withdrawal Threshold and Fee Structure
								</h2>
								<div className="bg-zinc-50 border border-zinc-200 rounded p-3 my-2 space-y-1.5">
									<div className="flex justify-between items-center py-0.5 border-b border-zinc-200">
										<span className="font-medium text-zinc-700">Minimum Single Withdrawal:</span>
										<span className="font-mono font-bold text-zinc-900">{currency} {minAmount.toFixed(2)}</span>
									</div>
								
									<div className="flex justify-between items-center py-0.5">
										<span className="font-normal text-zinc-700">Free Weekly Withdrawal Allowance:</span>
										<span className=" font-normal text-gray-600">{freePerWeek} free transfer per week and {currency} {transferFee.toFixed(2)} for other transfers in same week</span>
									</div>
								</div>
								<p className="text-[11px] text-zinc-600">
									The platform absorbs network transfer costs for the first {freePerWeek} withdrawal in each rolling seven-day
									window. Subsequent withdrawals within the same window incur the standard {currency} {transferFee.toFixed(2)} transfer
									fee, automatically deducted from the disbursed total.
								</p>
							</section>

							{/* Section 5 - Cooling Period */}
							<section>
								<h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-200 pb-1 mb-2">
									5. Event Inflow Holding Period (Anti-Fraud Cooling Window)
								</h2>
								<p>
									To safeguard ticket holders, voters, and sponsors against fraudulent cancellations and premature fund diversion,
									a mandatory <strong>{minEventAgeDays}-day holding period</strong> is enforced on all events.
								</p>
								<div className="bg-amber-50/60 border border-amber-200/80 rounded p-3 my-2 text-amber-950">
									<span className="font-bold block uppercase text-[10px] tracking-wide text-amber-900 mb-1">
										Mandatory Cooling Period Clause
									</span>
									<p className="text-[11px] leading-relaxed">
										The organizer may not initiate an initial withdrawal for any event until at least <strong>{minEventAgeDays} calendar days</strong> have
										elapsed from the timestamp of the first completed financial transaction (ticket purchase or vote) recorded for that event.
										Attempts to request disbursements prior to the completion of this cooling period will be automatically restricted by the settlement engine.
									</p>
								</div>
							</section>

							{/* Section 6 - Post Event Residual Sweep */}
							<section>
								<h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-200 pb-1 mb-2">
									6. Post-Event Residual Balance Settlement
								</h2>
								<p>
									Upon the formal conclusion of an event, if an organizer's remaining cleared wallet balance is below the standard
									minimum withdrawal threshold of {currency} {minAmount.toFixed(2)}, the organizer is not penalized or required to forfeit their earnings.
								</p>
								<div className="bg-emerald-50/60 border border-emerald-200/80 rounded p-3 my-2 text-emerald-950">
									<span className="font-bold block uppercase text-[10px] tracking-wide text-emerald-900 mb-1">
										Automated Residual Clearance Clause
									</span>
									<p className="text-[11px] leading-relaxed">
										Within <strong>{residualAutoPayoutDays} calendar days</strong> after an event has ended, the platform settlement system
										automatically initiates a residual disbursement for 100% of any remaining cleared balance below the {currency} {minAmount.toFixed(2)} threshold,
										direct to the organizer's verified account. All network transfer fees for automated residual payouts are <strong>100% waived</strong> by the platform.
									</p>
								</div>
							</section>

							{/* Section 7 */}
							<section>
								<h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-200 pb-1 mb-2">
									7. Chargeback Reserves and Administrative Holds
								</h2>
								<p>
									The platform reserves the right to temporarily pause, defer, or place administrative reserves on wallet withdrawals
									under any of the following circumstances:
								</p>
								<ul className="list-disc list-inside mt-2 space-y-1 pl-2 text-zinc-700">
									<li>Notice of event cancellation, date postponement, or significant venue relocation without attendee notification.</li>
									<li>Disputed charges or chargeback rates exceeding 1.0% of total event transaction volume.</li>
									<li>Unverified security deposit status where refundable commitment deposit obligations apply.</li>
									<li>Evidence of fraudulent voting syndicates, automated bot transactions, or unauthorized payment credentials.</li>
								</ul>
							</section>

							{/* Section 8 */}
							<section>
								<h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-200 pb-1 mb-2">
									8. Electronic Consent and Audit Acknowledgement
								</h2>
								<p>
									Consent to this policy is recorded electronically with timestamp, IP address, and authenticated user credentials
									upon publishing an event and prior to each withdrawal submission. This electronic record constitutes a legally binding
									instrument under the Electronic Transactions Act of Ghana.
								</p>
							</section>
						</div>

						{/* Document Sign-Off Block */}
						<div className="border-t-2 border-zinc-900 mt-10 pt-6">
							<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-[10px] text-zinc-600">
								<div>
									<div className="font-bold text-zinc-900 uppercase">Treasury & Compliance Operations</div>
									<div>FEXTIVA Technologies Ltd. &bull; Accra, Ghana</div>
									<div className="font-mono text-zinc-500 mt-0.5">support@fextiva.com &bull; compliance@fextiva.com</div>
								</div>
								<div className="text-left sm:text-right border-l sm:border-l-0 sm:border-r border-zinc-300 pl-4 sm:pl-0 sm:pr-4">
									<div className="font-mono font-bold text-zinc-900">VERIFIED OFFICIAL POLICY</div>
									<div className="font-mono text-zinc-500">DIGITAL HASH: AF-PAY-2026-GH-SEC</div>
									<div className="font-mono text-zinc-500">AUDIT TRAIL: ENFORCED VIA SMART DAL</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Modal Footer */}
				<div className="flex items-center justify-between px-6 py-3 bg-zinc-100 dark:bg-zinc-900 border-t border-zinc-300 dark:border-zinc-800 shrink-0 print:hidden">
					<div className="text-xs text-zinc-500">
						Please review all terms carefully. Consent is required before payouts or event publishing.
					</div>
					<Button
						size="sm"
						onClick={() => onOpenChange(false)}
						className="text-xs font-semibold px-4"
					>
						Close Document
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
