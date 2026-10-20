"use client";

import { useState, useTransition } from "react";
import {
	CheckCircle2,
	AlertCircle,
	XCircle,
	Loader2,
	LogOut,
	LogIn,
	Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { verifyAndCheckInTicket } from "@/lib/server-functions/public-checkout";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface TicketVerifyClientProps {
	readonly initialToken?: string;
	readonly initialTicket?: any;
	readonly initialStatus?: string;
	readonly initialMessage?: string;
	readonly isValid?: boolean;
	readonly verifierName?: string;
}

export function TicketVerifyClient({
	initialToken,
	initialTicket,
	initialStatus = "not_checked_in",
	initialMessage,
	isValid = true,
	verifierName,
}: TicketVerifyClientProps) {
	const [ticket, setTicket] = useState<any>(initialTicket);
	const [status, setStatus] = useState<string>(initialStatus);
	const [message, setMessage] = useState<string>(initialMessage || "");
	const [valid, setValid] = useState<boolean>(isValid);
	const [ticketCodeInput, setTicketCodeInput] = useState<string>("");
	const [isPending, startTransition] = useTransition();
	const [authState, setAuthState] = useState<"ok" | "login_required" | "unauthorized">(
		initialStatus === "login_required" || initialStatus === "unauthorized"
			? initialStatus
			: "ok",
	);

	async function handleLookupCode(e: React.FormEvent) {
		e.preventDefault();
		const code = ticketCodeInput.trim().toUpperCase();
		if (!code) return;

		startTransition(async () => {
			try {
				const result = await verifyAndCheckInTicket({
					data: {
						ticketCode: code,
						action: "status",
					},
				});

				if (result.status === "login_required" || result.status === "unauthorized") {
					setAuthState(result.status);
					setValid(false);
					setMessage(result.message || "Organizer authentication required.");
					setTicket(null);
					return;
				}

				if (!result.isValid || !result.ticket) {
					setValid(false);
					setMessage(result.message || "Invalid ticket code.");
					setTicket(null);
				} else {
					setValid(true);
					setTicket(result.ticket);
					setStatus(result.ticket.checkInStatus);
					setMessage(
						result.ticket.checkInStatus === "checked_in"
							? "Already checked in."
							: "Valid ticket. Ready for entry.",
					);
				}
			} catch (err: any) {
				toast.error(err.message || "Lookup failed.");
			}
		});
	}

	async function handleCheckIn() {
		if (!ticket) return;

		startTransition(async () => {
			try {
				const result = await verifyAndCheckInTicket({
					data: {
						token: initialToken,
						ticketCode: ticket.ticketCode,
						action: "check_in",
					},
				});

				if (result.status === "login_required" || result.status === "unauthorized") {
					setAuthState(result.status);
					return;
				}

				if (result.isValid && result.ticket) {
					setTicket(result.ticket);
					setStatus("checked_in");
					if (result.status === "already_checked_in") {
						setMessage("Already checked in.");
						toast.info("Attendee is already checked in.");
					} else {
						setMessage("Check-in recorded.");
						toast.success("Attendee checked in.");
					}
				} else {
					toast.error(result.message || "Check-in failed.");
				}
			} catch (err: any) {
				toast.error(err.message || "Check-in failed.");
			}
		});
	}

	async function handleCheckOut() {
		if (!ticket) return;

		startTransition(async () => {
			try {
				const result = await verifyAndCheckInTicket({
					data: {
						token: initialToken,
						ticketCode: ticket.ticketCode,
						action: "check_out",
					},
				});

				if (result.status === "login_required" || result.status === "unauthorized") {
					setAuthState(result.status);
					return;
				}

				if (result.isValid && result.ticket) {
					setTicket(result.ticket);
					setStatus("not_checked_in");
					setMessage("Check-in undone.");
					toast.success("Check-in undone.");
				}
			} catch (err: any) {
				toast.error(err.message || "Check-out failed.");
			}
		});
	}

	if (authState === "login_required") {
		return (
			<div className="p-5 border border-border/70 rounded-lg text-center space-y-3 bg-muted/10">
				<div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-foreground">
					<AlertCircle className="size-3.5 text-primary" />
					<span>Sign-In Required</span>
				</div>
				<p className="text-xs text-muted-foreground max-w-xs mx-auto">
					{message || "Organizer authentication required to verify passes."}
				</p>
				<Button asChild size="sm" className="h-8 text-xs font-semibold">
					<Link href="/login">Sign In</Link>
				</Button>
			</div>
		);
	}

	if (authState === "unauthorized") {
		return (
			<div className="p-5 border border-destructive/20 rounded-lg text-center space-y-3 bg-destructive/[0.03]">
				<div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-destructive">
					<XCircle className="size-3.5" />
					<span>Access Restricted</span>
				</div>
				<p className="text-xs text-muted-foreground max-w-xs mx-auto">
					{message || "You are not an organizer for this event."}
				</p>
				<Button asChild variant="outline" size="sm" className="h-8 text-xs">
					<Link href="/dashboard">Back to Dashboard</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Code Lookup Bar */}
			<form onSubmit={handleLookupCode} className="flex gap-2">
				<Input
					placeholder="Enter ticket code (e.g. TIX-...)"
					value={ticketCodeInput}
					onChange={(e) => setTicketCodeInput(e.target.value.toUpperCase())}
					className="font-mono text-xs uppercase h-9 bg-card/60 border-border/70"
				/>
				<Button
					type="submit"
					disabled={isPending || !ticketCodeInput.trim()}
					size="sm"
					className="h-9 px-4 text-xs font-semibold shrink-0"
				>
					{isPending ? (
						<Loader2 className="size-3.5 animate-spin" />
					) : (
						"Lookup"
					)}
				</Button>
			</form>

			{/* Status Banner */}
			{!valid ? (
				<div className="p-4 rounded-lg bg-destructive/[0.04] border border-destructive/20 flex items-start gap-2.5 text-xs">
					<XCircle className="size-4 text-destructive shrink-0 mt-0.5" />
					<div>
						<p className="font-semibold text-foreground">Invalid Ticket</p>
						<p className="text-muted-foreground mt-0.5">
							{message || "Ticket signature or code is invalid."}
						</p>
					</div>
				</div>
			) : ticket ? (
				<div className="space-y-3">
					{/* Status Pill */}
					<div
						className={`px-3.5 py-2.5 rounded-lg border flex items-center justify-between text-xs ${
							status === "checked_in"
								? "bg-amber-500/[0.08] border-amber-500/30 text-amber-700 dark:text-amber-300"
								: "bg-emerald-500/[0.08] border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
						}`}
					>
						<div className="flex items-center gap-2">
							{status === "checked_in" ? (
								<Clock className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
							) : (
								<CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
							)}
							<span className="font-semibold">
								{status === "checked_in" ? "Already Checked In" : "Valid Ticket"}
							</span>
						</div>

						<span className="text-[11px] opacity-80 font-mono">
							{status === "checked_in" && ticket.checkedInAt
								? formatDate(ticket.checkedInAt, true)
								: "Ready for entry"}
						</span>
					</div>

					{/* Attendee Details Card */}
					<div className="p-4 rounded-lg border border-border/70 bg-card/40 space-y-3">
						<div className="flex items-center justify-between border-b border-border/50 pb-2.5">
							<div>
								<h4 className="font-semibold text-xs text-foreground">
									{ticket.event?.title}
								</h4>
								<p className="text-[11px] text-muted-foreground">
									{ticket.event?.organization?.name}
								</p>
							</div>
							<span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-muted/60 border border-border/60">
								{ticket.ticketCode}
							</span>
						</div>

						<div className="grid grid-cols-2 gap-3 text-xs">
							<div>
								<span className="text-[11px] text-muted-foreground block">Attendee</span>
								<p className="font-semibold text-foreground truncate">
									{ticket.attendeeName || ticket.order?.buyerName || "Guest"}
								</p>
							</div>

							<div>
								<span className="text-[11px] text-muted-foreground block">Ticket Tier</span>
								<p className="font-semibold text-primary">
									{ticket.ticketType?.name || "General"}
								</p>
							</div>

							{(ticket.attendeeEmail || ticket.order?.buyerEmail) && (
								<div>
									<span className="text-[11px] text-muted-foreground block">Email</span>
									<p className="text-foreground truncate text-[11px]">
										{ticket.attendeeEmail || ticket.order?.buyerEmail}
									</p>
								</div>
							)}

							{(ticket.attendeePhone || ticket.order?.buyerPhone) && (
								<div>
									<span className="text-[11px] text-muted-foreground block">Contact</span>
									<p className="text-foreground text-[11px] font-mono">
										{ticket.attendeePhone || ticket.order?.buyerPhone}
									</p>
								</div>
							)}
						</div>

						{/* Action: Check-In / Undo */}
						<div className="pt-2">
							{status !== "checked_in" ? (
								<Button
									onClick={handleCheckIn}
									disabled={isPending}
									className="w-full h-9 text-xs font-semibold gap-1.5"
								>
									{isPending ? (
										<Loader2 className="size-3.5 animate-spin" />
									) : (
										<>
											<LogIn className="size-3.5" /> Confirm Check-In
										</>
									)}
								</Button>
							) : (
								<Button
									variant="outline"
									onClick={handleCheckOut}
									disabled={isPending}
									className="w-full h-8 text-xs font-medium border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 gap-1.5"
								>
									{isPending ? (
										<Loader2 className="size-3.5 animate-spin" />
									) : (
										<>
											<LogOut className="size-3.5" /> Undo Check-In
										</>
									)}
								</Button>
							)}
						</div>
					</div>

					{verifierName && (
						<p className="text-[11px] text-center text-muted-foreground">
							Verified by <span className="text-foreground font-medium">{verifierName}</span>
						</p>
					)}
				</div>
			) : (
				<p className="text-center py-8 text-xs text-muted-foreground">
					Scan a QR ticket or enter a ticket code above.
				</p>
			)}
		</div>
	);
}
