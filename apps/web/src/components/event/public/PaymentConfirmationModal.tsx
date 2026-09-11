"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
	Dialog,
	DialogContent,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
	CheckCircle2,
	Loader2,
	XCircle,
	Sparkles,
	Ticket,
} from "lucide-react";
import Link from "next/link";
import { getPaymentStatusByReference } from "@/lib/server-functions/public-checkout";

type CallbackState = "idle" | "verifying" | "success" | "failed";

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

function PaymentConfirmationModalContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();

	const reference = searchParams.get("reference") || searchParams.get("trxref");
	const [isOpen, setIsOpen] = useState(false);
	const [state, setState] = useState<CallbackState>("idle");
	const [payment, setPayment] = useState<PaymentDetails | null>(null);
	const pollCountRef = useRef(0);

	const handleClose = useCallback(() => {
		setIsOpen(false);
		// Clean up query params from URL without page reload
		const params = new URLSearchParams(searchParams.toString());
		params.delete("reference");
		params.delete("trxref");
		const newQuery = params.toString();
		const newUrl = newQuery ? `${pathname}?${newQuery}` : pathname;
		router.replace(newUrl, { scroll: false });
		router.refresh();
	}, [pathname, router, searchParams]);

	const checkStatus = useCallback(
		async (ref: string) => {
			try {
				const res = await getPaymentStatusByReference({ reference: ref });
				if (res.success && res.payment) {
					setPayment(res.payment);
					if (res.payment.status === "completed") {
						setState("success");
						router.refresh();
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
		},
		[router],
	);

	useEffect(() => {
		if (!reference) {
			setIsOpen(false);
			setState("idle");
			return;
		}

		setIsOpen(true);
		setState("verifying");
		pollCountRef.current = 0;

		let intervalId: NodeJS.Timeout | null = null;

		async function runPoll() {
			const done = await checkStatus(reference!);
			if (done) return;

			intervalId = setInterval(async () => {
				pollCountRef.current += 1;
				const isDone = await checkStatus(reference!);
				if (isDone || pollCountRef.current >= 25) {
					if (intervalId) clearInterval(intervalId);
					if (!isDone && state === "verifying") {
						setState("failed");
					}
				}
			}, 2000);
		}

		runPoll();

		return () => {
			if (intervalId) clearInterval(intervalId);
		};
	}, [reference, checkStatus]);

	if (!reference || !isOpen) return null;

	const meta = payment?.metadata || {};
	const purpose = payment?.purpose || meta.purpose || "";
	const isTicketPayment =
		purpose === "ticket_purchase" || meta.ticketOrderId || !!meta.ticketTypeId;
	const isVotePayment =
		purpose === "vote_purchase" || !!meta.categoryId || !!meta.optionId;
	const isNominationPayment =
		purpose === "nomination" || meta.purpose === "nomination";

	const ticketViewUrl =
		payment?.viewUrl ||
		(payment?.tickets?.[0]?.token
			? `/ticket/view?token=${payment.tickets[0].token}`
			: null);

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
			<DialogContent
				showCloseButton={false}
				className="sm:max-w-md"
			>
				<DialogTitle className="sr-only">Payment Confirmation</DialogTitle>

				<div className="flex flex-col items-center text-center">
					{/* ── 1. Verifying State ── */}
					{state === "verifying" && (
						<div className="py-6 space-y-4">
							<div className="relative w-16 h-16 mx-auto">
								<div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
								<div className="relative w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
									<Loader2 className="w-8 h-8 text-primary animate-spin" />
								</div>
							</div>
							<h3 className="text-xl font-black uppercase tracking-tight">
								Verifying Payment
							</h3>
							<p className="text-muted-foreground text-xs leading-relaxed max-w-xs mx-auto">
								Please wait while we confirm your payment with the network...
							</p>
						</div>
					)}

					{/* ── 2. Success State ── */}
					{state === "success" && (
						<div className="py-2 space-y-4 w-full">
							<div className="relative w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto shadow-sm">
								<CheckCircle2 className="w-9 h-9 text-green-600 dark:text-green-400" />
								<div className="absolute -top-1 -right-1 bg-amber-400 text-black p-1 rounded-full shadow-xs">
									<Sparkles className="size-3" />
								</div>
							</div>

							<div>
								<h3 className="text-xl font-black uppercase tracking-tight">
									{isTicketPayment
										? "Tickets Confirmed!"
										: isVotePayment
											? "Vote Confirmed!"
											: isNominationPayment
												? "Nomination Confirmed!"
												: "Payment Successful!"}
								</h3>

								<p className="text-muted-foreground text-xs leading-relaxed max-w-xs mx-auto mt-1.5">
									{isTicketPayment
										? `${meta.quantity || 1} ticket pass${
												Number(meta.quantity || 1) > 1 ? "es" : ""
											} for "${meta.ticketTypeName || "your event"}" confirmed.`
										: isVotePayment
											? `${meta.voteCount || 1} vote${
													Number(meta.voteCount || 1) > 1 ? "s" : ""
												} for "${meta.nomineeName || "your nominee"}" recorded successfully.`
											: isNominationPayment
												? `Nomination for "${meta.nomineeName || "your nominee"}" submitted successfully.`
												: "Your payment has been verified successfully."}
								</p>
							</div>

							{/* Clean details: amount paid and votes only (no reference) */}
							{payment?.amount !== undefined && (
								<div className="w-full rounded-xl bg-muted/40 border border-border/70 p-3 text-left space-y-2">
									<div className="flex justify-between items-center text-xs">
										<span className="text-muted-foreground font-medium">
											Amount Paid
										</span>
										<span className="font-bold text-green-600 dark:text-green-400 text-sm">
											{payment.currency || "GHS"}{" "}
											{Number(payment.amount).toFixed(2)}
										</span>
									</div>
									{isVotePayment && meta.voteCount && (
										<div className="flex justify-between items-center text-xs pt-1.5 border-t border-border/40">
											<span className="text-muted-foreground font-medium">
												Votes Recorded
											</span>
											<span className="font-bold text-foreground">
												{meta.voteCount} {Number(meta.voteCount) === 1 ? "Vote" : "Votes"}
											</span>
										</div>
									)}
									{isTicketPayment && meta.quantity && (
										<div className="flex justify-between items-center text-xs pt-1.5 border-t border-border/40">
											<span className="text-muted-foreground font-medium">
												Tickets
											</span>
											<span className="font-bold text-foreground">
												{meta.quantity} Pass{Number(meta.quantity) > 1 ? "es" : ""}
											</span>
										</div>
									)}
								</div>
							)}

							<div className="flex items-center justify-center gap-2 pt-2">
								{isTicketPayment && ticketViewUrl && (
									<Button asChild size="sm" className="h-8 px-4 text-xs font-semibold">
										<Link href={ticketViewUrl}>
											<Ticket className="size-3.5 mr-1.5" />
											View Ticket
										</Link>
									</Button>
								)}
								<Button
									type="button"
									variant={isTicketPayment && ticketViewUrl ? "outline" : "default"}
									size="sm"
									className="h-8 px-5 text-xs font-semibold"
									onClick={handleClose}
								>
									Close
								</Button>
							</div>
						</div>
					)}

					{/* ── 3. Failed State ── */}
					{state === "failed" && (
						<div className="py-4 space-y-4">
							<div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto">
								<XCircle className="w-8 h-8 text-red-500" />
							</div>
							<h3 className="text-xl font-black uppercase tracking-tight">
								Payment Pending or Unconfirmed
							</h3>
							<p className="text-muted-foreground text-xs leading-relaxed max-w-xs mx-auto">
								We haven't received confirmation for this transaction yet. If your account was debited, it will update automatically once processed.
							</p>
							<div className="pt-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="h-8 px-4 text-xs font-semibold"
									onClick={handleClose}
								>
									Close
								</Button>
							</div>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

export function PaymentConfirmationModal() {
	return (
		<Suspense fallback={null}>
			<PaymentConfirmationModalContent />
		</Suspense>
	);
}
