"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
	ArrowLeft,
	Home,
	Loader2,
	Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusIllustration } from "@/components/shared/StatusIllustration";
import { getPaymentStatusByReference } from "@/lib/server-functions/public-checkout";
import { VoteSuccessAnimation } from "@/components/voting/VoteSuccessAnimation";

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

			// Poll every 2 seconds for up to 120 seconds (60 polls)
			intervalId = setInterval(async () => {
				pollCountRef.current += 1;
				const done = await checkStatus();
				if (done || pollCountRef.current >= 60) {
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

	const successTitle = isTicketPayment
		? "Ticket confirmed"
		: isVotePayment
			? "Vote confirmed"
			: isNominationPayment
				? "Nomination confirmed"
				: "Payment successful";

	const successDescription = isTicketPayment
		? `${meta.quantity || 1} pass${Number(meta.quantity || 1) > 1 ? "es" : ""} for ${meta.ticketTypeName || "your event"} are ready.`
		: isVotePayment
			? `${meta.voteCount || 1} vote${Number(meta.voteCount || 1) > 1 ? "s" : ""} for ${meta.nomineeName || "your nominee"} recorded.`
			: isNominationPayment
				? `Nomination for ${meta.nomineeName || "your nominee"} submitted.`
				: "Your payment has been completed.";

	return (
		<main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
			<div className="w-full max-w-md">
				<div className="bg-card text-card-foreground rounded-xl border border-border/70 overflow-hidden">
					<div className="p-8 flex flex-col items-center text-center">
						{state === "verifying" && (
							<>
								<div className="mb-5 flex items-center justify-center">
									<Loader2 className="size-8 text-primary animate-spin" />
								</div>
								<h1 className="text-base font-semibold tracking-tight mb-1">
									Confirming payment
								</h1>
								<p className="text-muted-foreground text-xs leading-relaxed max-w-xs">
									This usually takes a few seconds.
								</p>
							</>
						)}

						{state === "success" && (
							<>
								{isVotePayment ? (
									<VoteSuccessAnimation size="lg" className="mb-4" />
								) : (
									<StatusIllustration
										variant="valid"
										alt="Payment successful"
										className="mb-4"
									/>
								)}

								<h1 className="text-base font-semibold tracking-tight mb-1">
									{successTitle}
								</h1>
								<p className="text-muted-foreground text-xs leading-relaxed max-w-xs mb-5">
									{successDescription}
								</p>

								{payment?.amount !== undefined && (
									<p className="text-sm font-semibold text-foreground mb-6">
										{payment.currency || "GHS"} {Number(payment.amount).toFixed(2)}
										{isTicketPayment && meta.quantity
											? ` · ${meta.quantity} pass${Number(meta.quantity) > 1 ? "es" : ""}`
											: ""}
										{isVotePayment && meta.voteCount
											? ` · ${meta.voteCount} vote${Number(meta.voteCount) > 1 ? "s" : ""}`
											: ""}
									</p>
								)}

								<div className="flex items-center justify-center gap-2">
									{isTicketPayment && ticketViewUrl && (
										<Button
											asChild
											size="sm"
											className="h-9 px-4 text-xs font-semibold"
										>
											<Link href={ticketViewUrl}>
												<Ticket className="size-3.5 mr-1.5" />
												View ticket
											</Link>
										</Button>
									)}

									<Button
										asChild
										size="sm"
										variant={isTicketPayment && ticketViewUrl ? "outline" : "default"}
										className="h-9 px-5 text-xs font-semibold"
									>
										<Link href={destinationUrl}>Done</Link>
									</Button>
								</div>
							</>
						)}

						{state === "failed" && (
							<>
								<StatusIllustration
									variant="invalid"
									alt="Payment not confirmed"
									className="mb-4"
								/>
								<h1 className="text-base font-semibold tracking-tight mb-1">
									Payment not confirmed
								</h1>
								<p className="text-muted-foreground text-xs leading-relaxed max-w-xs mb-6">
									If you were charged, your order will update once the network
									finishes processing.
								</p>
								<div className="flex gap-2 w-full">
									<Button asChild variant="outline" size="sm" className="flex-1 h-9 text-xs">
										<Link href={destinationUrl}>
											<ArrowLeft className="size-3.5 mr-1.5" />
											Go back
										</Link>
									</Button>
									<Button asChild size="sm" className="flex-1 h-9 text-xs font-semibold">
										<Link href={destinationUrl}>Try again</Link>
									</Button>
								</div>
							</>
						)}

						{state === "unknown" && (
							<>
								<StatusIllustration
									variant="locked"
									alt="Reference missing"
									className="mb-4"
								/>
								<h1 className="text-base font-semibold tracking-tight mb-1">
									Reference missing
								</h1>
								<p className="text-muted-foreground text-xs leading-relaxed max-w-xs mb-6">
									No payment reference was found. Return to the event page or check
									your receipt email.
								</p>
								<Button asChild size="sm" className="h-9 px-5 text-xs font-semibold">
									<Link href="/">
										<Home className="size-3.5 mr-1.5" />
										Return home
									</Link>
								</Button>
							</>
						)}
					</div>
				</div>
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
