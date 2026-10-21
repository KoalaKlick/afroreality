"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusIllustration } from "@/components/shared/StatusIllustration";
import { verifyAndCheckInTicket } from "@/lib/server-functions/public-checkout";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
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
			<div className="rounded-xl border border-border/70 bg-card">
				<EmptyState
					variant="locked"
					title="Organizer sign-in required"
					description={
						message ||
						"Sign in with an event organizer account to verify tickets at the gate."
					}
					action={
						<Button asChild size="sm" className="h-9 px-5 text-xs font-semibold">
							<Link href="/login">Sign in to verify</Link>
						</Button>
					}
					className="py-12"
				/>
			</div>
		);
	}

	if (authState === "unauthorized") {
		return (
			<div className="rounded-xl border border-border/70 bg-card">
				<EmptyState
					variant="locked"
					title="Access restricted"
					description={
						message || "You are not an authorized organizer for this event."
					}
					action={
						<Button asChild variant="outline" size="sm" className="h-9 px-5 text-xs font-semibold">
							<Link href="/dashboard">Back to dashboard</Link>
						</Button>
					}
					className="py-12"
				/>
			</div>
		);
	}

	const checkedIn = status === "checked_in";

	return (
		<div className="flex flex-col gap-6">
			<form onSubmit={handleLookupCode} className="flex gap-2">
				<Input
					placeholder="Ticket code (e.g. TIX-…)"
					value={ticketCodeInput}
					onChange={(e) => setTicketCodeInput(e.target.value.toUpperCase())}
					className="font-mono text-sm uppercase h-10 bg-card border-border/70"
					aria-label="Ticket code"
				/>
				<Button
					type="submit"
					disabled={isPending || !ticketCodeInput.trim()}
					size="sm"
					className="h-10 px-5 text-xs font-semibold shrink-0"
				>
					{isPending ? <Loader2 className="size-4 animate-spin" /> : "Lookup"}
				</Button>
			</form>

			{!valid ? (
				<div className="rounded-xl border border-border/70 bg-card px-6 py-10 text-center space-y-3">
					<StatusIllustration variant="invalid" alt="Invalid ticket" />
					<div className="space-y-1">
						<h2 className="text-base font-semibold text-destructive">Invalid ticket</h2>
						<p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
							{message || "This ticket could not be verified. Do not grant entry."}
						</p>
					</div>
				</div>
			) : ticket ? (
				<div className="rounded-xl border border-border/70 bg-card overflow-hidden">
					<div className="px-5 py-8 text-center space-y-3 border-b border-border/60">
						<StatusIllustration
							variant={checkedIn ? "checked_in" : "valid"}
							alt={checkedIn ? "Already checked in" : "Valid ticket"}
						/>
						<div className="space-y-1">
							<h2
								className={cn(
									"text-base font-semibold tracking-tight",
									checkedIn
										? "text-amber-700 dark:text-amber-400"
										: "text-emerald-700 dark:text-emerald-400",
								)}
							>
								{checkedIn ? "Already checked in" : "Valid ticket"}
							</h2>
							<p className="text-xs text-muted-foreground">
								{checkedIn
									? ticket.checkedInAt
										? `Checked in ${formatDate(ticket.checkedInAt, true)}`
										: "This pass has already been used"
									: "Ready for entry"}
							</p>
						</div>
					</div>

					<div className="px-5 py-5 space-y-5">
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0">
								<p className="text-sm font-semibold text-foreground truncate">
									{ticket.event?.title}
								</p>
								<p className="text-[11px] text-muted-foreground mt-0.5 truncate">
									{ticket.event?.organization?.name}
								</p>
							</div>
							<span className="font-mono text-[11px] font-semibold px-2.5 py-1 rounded-md bg-muted/60 text-foreground shrink-0">
								{ticket.ticketCode}
							</span>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<p className="text-[11px] text-muted-foreground">Attendee</p>
								<p className="text-sm font-semibold text-foreground mt-0.5">
									{ticket.attendeeName || ticket.order?.buyerName || "Guest"}
								</p>
							</div>
							<div>
								<p className="text-[11px] text-muted-foreground">Tier</p>
								<p className="text-sm font-semibold text-foreground mt-0.5">
									{ticket.ticketType?.name || "General"}
								</p>
							</div>
						</div>

						{checkedIn ? (
							<Button
								size="sm"
								variant="outline"
								onClick={handleCheckOut}
								disabled={isPending}
								className="w-full h-10 text-xs font-semibold border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 shadow-none"
							>
								{isPending ? (
									<Loader2 className="size-4 animate-spin" />
								) : (
									"Undo check-in"
								)}
							</Button>
						) : (
							<Button
								size="sm"
								onClick={handleCheckIn}
								disabled={isPending}
								className="w-full h-10 text-xs font-semibold shadow-none"
							>
								{isPending ? (
									<Loader2 className="size-4 animate-spin" />
								) : (
									"Confirm check-in"
								)}
							</Button>
						)}

						{verifierName && (
							<p className="text-[11px] text-center text-muted-foreground">
								Verified by{" "}
								<span className="text-foreground font-medium">{verifierName}</span>
							</p>
						)}
					</div>
				</div>
			) : (
				<div className="rounded-xl border border-border/70 bg-card">
					<EmptyState
						variant="tickets"
						title="Ready to scan"
						description="Scan an attendee QR code or enter a ticket code above."
						className="py-12"
					/>
				</div>
			)}
		</div>
	);
}
