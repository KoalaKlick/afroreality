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
	Loader2,
	Ticket,
} from "lucide-react";
import Link from "next/link";
import { StatusIllustration } from "@/components/shared/StatusIllustration";
import { getPaymentStatusByReference } from "@/lib/server-functions/public-checkout";
import { VoteSuccessAnimation } from "@/components/voting/VoteSuccessAnimation";

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
		if (state === "success" && payment && typeof window !== "undefined") {
			const meta = payment.metadata || {};
			const purpose = payment.purpose || meta.purpose || "";
			const isVote = purpose === "vote_purchase" || !!meta.categoryId || !!meta.optionId;
			if (isVote) {
				const optionId = meta.optionId || meta.nomineeId;
				const addedVotes = Number(meta.voteCount || 1);
				window.dispatchEvent(
					new CustomEvent("vote-confirmed", {
						detail: {
							optionId,
							nomineeCode: meta.nomineeCode,
							nomineeName: meta.nomineeName,
							addedVotes,
							timestamp: Date.now(),
						},
					})
				);
			}
		}

		setIsOpen(false);
		// Clean up query params from URL without page reload
		const params = new URLSearchParams(searchParams.toString());
		params.delete("reference");
		params.delete("trxref");
		const newQuery = params.toString();
		const newUrl = newQuery ? `${pathname}?${newQuery}` : pathname;
		router.replace(newUrl, { scroll: false });
		router.refresh();
	}, [pathname, router, searchParams, state, payment]);

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
				if (isDone || pollCountRef.current >= 60) {
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
					{state === "verifying" && (
						<div className="py-6 space-y-3">
							<div className="flex items-center justify-center">
								<Loader2 className="size-8 text-primary animate-spin" />
							</div>
							<h3 className="text-base font-semibold tracking-tight">
								Confirming payment
							</h3>
							<p className="text-muted-foreground text-xs leading-relaxed max-w-xs mx-auto">
								This usually takes a few seconds.
							</p>
						</div>
					)}

					{state === "success" && (
						<div className="py-2 space-y-4 w-full">
							{isVotePayment ? (
								<VoteSuccessAnimation size="md" />
							) : (
								<StatusIllustration variant="valid" alt="Payment successful" />
							)}

							<div>
								<h3 className="text-base font-semibold tracking-tight">
									{isTicketPayment
										? "Ticket confirmed"
										: isVotePayment
											? "Vote confirmed"
											: isNominationPayment
												? "Nomination confirmed"
												: "Payment successful"}
								</h3>

								<p className="text-muted-foreground text-xs leading-relaxed max-w-xs mx-auto mt-1">
									{isTicketPayment
										? `${meta.quantity || 1} pass${
												Number(meta.quantity || 1) > 1 ? "es" : ""
											} for ${meta.ticketTypeName || "your event"} are ready.`
										: isVotePayment
											? `${meta.voteCount || 1} vote${
													Number(meta.voteCount || 1) > 1 ? "s" : ""
												} for ${meta.nomineeName || "your nominee"} recorded.`
											: isNominationPayment
												? `Nomination for ${meta.nomineeName || "your nominee"} submitted.`
												: "Your payment has been verified."}
								</p>
							</div>

							{payment?.amount !== undefined && (
								<p className="text-sm font-semibold text-foreground">
									{payment.currency || "GHS"} {Number(payment.amount).toFixed(2)}
									{isTicketPayment && meta.quantity
										? ` · ${meta.quantity} pass${Number(meta.quantity) > 1 ? "es" : ""}`
										: ""}
									{isVotePayment && meta.voteCount
										? ` · ${meta.voteCount} vote${Number(meta.voteCount) > 1 ? "s" : ""}`
										: ""}
								</p>
							)}

							<div className="flex items-center justify-center gap-2 pt-1">
								{isTicketPayment && ticketViewUrl && (
									<Button asChild size="sm" className="h-9 px-4 text-xs font-semibold">
										<Link href={ticketViewUrl}>
											<Ticket className="size-3.5 mr-1.5" />
											View ticket
										</Link>
									</Button>
								)}
								<Button
									type="button"
									variant={isTicketPayment && ticketViewUrl ? "outline" : "default"}
									size="sm"
									className="h-9 px-5 text-xs font-semibold"
									onClick={handleClose}
								>
									Done
								</Button>
							</div>
						</div>
					)}

					{state === "failed" && (
						<div className="py-4 space-y-3">
							<StatusIllustration variant="invalid" alt="Payment not confirmed" />
							<h3 className="text-base font-semibold tracking-tight">
								Payment not confirmed
							</h3>
							<p className="text-muted-foreground text-xs leading-relaxed max-w-xs mx-auto">
								If you were charged, your order will update once the network finishes
								processing.
							</p>
							<div className="pt-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="h-9 px-4 text-xs font-semibold"
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
