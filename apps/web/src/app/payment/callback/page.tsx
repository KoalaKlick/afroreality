"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
	ArrowLeft,
	CheckCircle2,
	Home,
	Loader2,
	Ticket,
	Vote,
	XCircle,
	Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPaymentStatusByReference } from "@/lib/server-functions/public-checkout";

type CallbackState = "verifying" | "success" | "failed" | "unknown";

interface PaymentDetails {
	id: string;
	reference: string;
	status: string;
	amount: number;
	currency: string;
	purpose: string;
	metadata: Record<string, any>;
	tickets?: Array<{ id: string; ticketCode: string; token: string }>;
	viewUrl?: string;
}

function PaymentCallbackContent() {
	const searchParams = useSearchParams();
	const reference = searchParams.get("reference") || searchParams.get("trxref");
	const [state, setState] = useState<CallbackState>("verifying");
	const [payment, setPayment] = useState<PaymentDetails | null>(null);
	const pollCountRef = useRef(0);

	const checkStatus = useCallback(async () => {
		if (!reference) {
			setState("unknown");
			return true;
		}

		try {
			const res = await getPaymentStatusByReference({ reference });
			if (res.success && res.payment) {
				setPayment(res.payment);

				if (res.payment.status === "completed") {
					setState("success");
					return true;
				}
				if (res.payment.status === "failed") {
					setState("failed");
					return true;
				}
			}
		} catch (err) {
			console.error("Payment status check error:", err);
		}
		return false;
	}, [reference]);

	useEffect(() => {
		if (!reference) {
			setState("unknown");
			return;
		}

		let intervalId: NodeJS.Timeout | null = null;

		async function runPoll() {
			const isDone = await checkStatus();
			if (isDone) return;

			// Poll every 2 seconds for up to 60 seconds (30 polls)
			intervalId = setInterval(async () => {
				pollCountRef.current += 1;
				const done = await checkStatus();
				if (done || pollCountRef.current >= 30) {
					if (intervalId) clearInterval(intervalId);
					if (!done && state === "verifying") {
						setState("failed");
					}
				}
			}, 2000);
		}

		runPoll();

		return () => {
			if (intervalId) clearInterval(intervalId);
		};
	}, [reference, checkStatus, state]);

	const meta = payment?.metadata || {};
	const purpose = payment?.purpose || meta.purpose || "";
	const isTicketPayment =
		purpose === "ticket_purchase" || meta.ticketOrderId || !!meta.ticketTypeId;
	const isVotePayment =
		purpose === "vote_purchase" || !!meta.categoryId || !!meta.optionId;
	const isNominationPayment =
		purpose === "nomination" || meta.purpose === "nomination";

	const destinationUrl =
		meta.sourcePath ||
		(meta.orgSlug && meta.eventSlug
			? `/${meta.orgSlug}/event/${meta.eventSlug}${
					meta.categoryId ? `/category/${meta.categoryId}` : ""
				}`
			: "/");

	const ticketViewUrl =
		payment?.viewUrl ||
		(payment?.tickets?.[0]?.token
			? `/ticket/view?token=${payment.tickets[0].token}`
			: null);

	return (
		<main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
			<div className="w-full max-w-md">
				<div className="bg-card text-card-foreground rounded-2xl shadow-2xl border border-border overflow-hidden backdrop-blur-md">
					{/* Brand Gradient Strip */}
					<div className="h-1.5 bg-linear-to-r from-[#009A44] via-[#FFD100] to-[#CE1126]" />

					<div className="p-8 flex flex-col items-center text-center">
						{/* ── 1. Verifying State ── */}
						{state === "verifying" && (
							<>
								<div className="relative w-20 h-20 mb-6">
									<div className="absolute inset-0 rounded-full bg-[#009A44]/20 animate-ping" />
									<div className="relative w-20 h-20 rounded-full bg-[#009A44]/10 border border-[#009A44]/30 flex items-center justify-center">
										<Loader2 className="w-10 h-10 text-[#009A44] animate-spin" />
									</div>
								</div>
								<h1 className="text-2xl font-black uppercase tracking-tight mb-2">
									Verifying Payment
								</h1>
								<p className="text-muted-foreground text-xs leading-relaxed max-w-xs">
									Please wait while we confirm your payment with the network.
									This usually takes a few seconds.
								</p>
								<div className="mt-6 flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
									<div className="w-2 h-2 rounded-full bg-[#009A44] animate-pulse" />
									Listening for network confirmation...
								</div>
							</>
						)}

						{/* ── 2. Success State ── */}
						{state === "success" && (
							<>
								<div className="relative w-20 h-20 rounded-full bg-[#009A44]/15 border border-[#009A44]/40 flex items-center justify-center mb-6 shadow-lg shadow-[#009A44]/10">
									<CheckCircle2 className="w-11 h-11 text-[#009A44]" />
									<div className="absolute -top-1 -right-1 bg-[#FFD100] text-black p-1 rounded-full shadow-xs">
										<Sparkles className="size-3.5" />
									</div>
								</div>

								<h1 className="text-2xl font-black uppercase tracking-tight mb-2">
									{isTicketPayment
										? "Ticket Confirmed!"
										: isVotePayment
											? "Vote Confirmed!"
											: isNominationPayment
												? "Nomination Confirmed!"
												: "Payment Successful!"}
								</h1>

								<p className="text-muted-foreground text-xs leading-relaxed max-w-xs mb-6">
									{isTicketPayment
										? `${meta.quantity || 1} ticket pass${
												Number(meta.quantity || 1) > 1 ? "es" : ""
											} for "${meta.ticketTypeName || "your event"}" confirmed successfully.`
										: isVotePayment
											? `${meta.voteCount || 1} vote${
													Number(meta.voteCount || 1) > 1 ? "s" : ""
												} for "${meta.nomineeName || "your nominee"}" recorded successfully.`
											: isNominationPayment
												? `Nomination for "${meta.nomineeName || "your nominee"}" submitted successfully. A confirmation receipt and exit key have been emailed to you.`
												: "Your payment has been completed and verified successfully."}
								</p>

								{payment?.amount !== undefined && (
									<div className="w-full rounded-xl bg-muted/40 border border-border/70 p-4 mb-6 text-left space-y-2">
										<div className="flex justify-between items-center text-xs">
											<span className="text-muted-foreground font-medium">
												Amount Paid
											</span>
											<span className="font-bold text-[#009A44] text-sm">
												{payment.currency || "GHS"}{" "}
												{Number(payment.amount).toFixed(2)}
											</span>
										</div>
										{reference && (
											<div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-border/40">
												<span className="text-muted-foreground">Reference</span>
												<span className="font-mono text-muted-foreground text-[10px]">
													{reference}
												</span>
											</div>
										)}
									</div>
								)}

								<div className="flex flex-col gap-2.5 w-full">
									{isTicketPayment && ticketViewUrl && (
										<Button
											asChild
											variant="brand-cta"
											className="w-full h-11 font-bold shadow-md shadow-[#009A44]/20"
										>
											<Link href={ticketViewUrl}>
												<Ticket className="w-4 h-4 mr-2" />
												View & Download Ticket
											</Link>
										</Button>
									)}

									<Button
										asChild
										variant={
											isTicketPayment && ticketViewUrl ? "outline" : "brand-cta"
										}
										className="w-full h-11 font-semibold"
									>
										<Link href={destinationUrl}>
											{isVotePayment ? (
												<>
													<Vote className="w-4 h-4 mr-2" />
													Back to Category
												</>
											) : (
												<>
													<Home className="w-4 h-4 mr-2" />
													Back to Event
												</>
											)}
										</Link>
									</Button>
								</div>
							</>
						)}

						{/* ── 3. Failed State ── */}
						{state === "failed" && (
							<>
								<div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6">
									<XCircle className="w-10 h-10 text-red-500" />
								</div>
								<h1 className="text-2xl font-black uppercase tracking-tight mb-2">
									Payment Pending or Failed
								</h1>
								<p className="text-muted-foreground text-xs leading-relaxed max-w-xs mb-6">
									We haven't received confirmation for this transaction yet. If
									your account was debited, your order will update automatically
									once the network processes it.
								</p>
								<div className="flex gap-2.5 w-full">
									<Button asChild variant="outline" className="flex-1 h-11">
										<Link href={destinationUrl}>
											<ArrowLeft className="w-4 h-4 mr-1.5" />
											Go Back
										</Link>
									</Button>
									<Button asChild variant="brand-cta" className="flex-1 h-11">
										<Link href={destinationUrl}>Try Again</Link>
									</Button>
								</div>
							</>
						)}

						{/* ── 4. Unknown Reference ── */}
						{state === "unknown" && (
							<>
								<div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6">
									<XCircle className="w-10 h-10 text-amber-500" />
								</div>
								<h1 className="text-2xl font-black uppercase tracking-tight mb-2">
									Payment Reference Missing
								</h1>
								<p className="text-muted-foreground text-xs leading-relaxed max-w-xs mb-6">
									No valid transaction reference was detected. Please check your
									email or return to the main event page.
								</p>
								<Button asChild variant="brand-cta" className="w-full h-11">
									<Link href="/">
										<Home className="w-4 h-4 mr-2" />
										Return Home
									</Link>
								</Button>
							</>
						)}
					</div>
				</div>

				<p className="text-center text-[10px] text-muted-foreground mt-4">
					Payments secured by Paystack & fextiva Platform.
				</p>
			</div>
		</main>
	);
}

export default function PaymentCallbackPage() {
	return (
		<Suspense
			fallback={
				<main className="min-h-screen bg-background flex items-center justify-center p-4">
					<Loader2 className="w-10 h-10 text-[#009A44] animate-spin" />
				</main>
			}
		>
			<PaymentCallbackContent />
		</Suspense>
	);
}
