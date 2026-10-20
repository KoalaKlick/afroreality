"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { verifyAndCheckInTicket } from "@/lib/server-functions/public-checkout";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

/** Clean, professional custom SVG emblems */
function ValidTicketSvg({ className = "size-16" }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 64 64"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
		>
			<circle cx="32" cy="32" r="30" fill="url(#valid-grad)" />
			<circle cx="32" cy="32" r="26" fill="#10B981" />
			<path
				d="M21 32.5L28.5 40L43 25"
				stroke="white"
				strokeWidth="4"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<defs>
				<linearGradient
					id="valid-grad"
					x1="6"
					y1="6"
					x2="58"
					y2="58"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#34D399" />
					<stop offset="1" stopColor="#059669" />
				</linearGradient>
			</defs>
		</svg>
	);
}

function AlreadyCheckedInSvg({ className = "size-16" }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 64 64"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
		>
			<circle cx="32" cy="32" r="30" fill="url(#checked-grad)" />
			<circle cx="32" cy="32" r="26" fill="#F59E0B" />
			<path
				d="M32 19V32.5L41 37"
				stroke="white"
				strokeWidth="3.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<circle cx="32" cy="32" r="14" stroke="white" strokeWidth="2" strokeOpacity="0.35" />
			<defs>
				<linearGradient
					id="checked-grad"
					x1="6"
					y1="6"
					x2="58"
					y2="58"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#FBBF24" />
					<stop offset="1" stopColor="#D97706" />
				</linearGradient>
			</defs>
		</svg>
	);
}

function InvalidTicketSvg({ className = "size-16" }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 64 64"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
		>
			<circle cx="32" cy="32" r="30" fill="url(#invalid-grad)" />
			<circle cx="32" cy="32" r="26" fill="#EF4444" />
			<path
				d="M23 23L41 41M41 23L23 41"
				stroke="white"
				strokeWidth="4"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<defs>
				<linearGradient
					id="invalid-grad"
					x1="6"
					y1="6"
					x2="58"
					y2="58"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#F87171" />
					<stop offset="1" stopColor="#DC2626" />
				</linearGradient>
			</defs>
		</svg>
	);
}

function UnauthorizedSvg({ className = "size-16" }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 64 64"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
		>
			<circle cx="32" cy="32" r="30" fill="url(#unauth-grad)" />
			<circle cx="32" cy="32" r="26" fill="#64748B" />
			<path
				d="M25 29V24C25 20.134 28.134 17 32 17C35.866 17 39 20.134 39 24V29"
				stroke="white"
				strokeWidth="3.5"
				strokeLinecap="round"
			/>
			<rect x="22" y="29" width="20" height="17" rx="3.5" fill="white" />
			<circle cx="32" cy="37" r="2" fill="#475569" />
			<defs>
				<linearGradient
					id="unauth-grad"
					x1="6"
					y1="6"
					x2="58"
					y2="58"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#94A3B8" />
					<stop offset="1" stopColor="#475569" />
				</linearGradient>
			</defs>
		</svg>
	);
}

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
			<div className="py-12 text-center space-y-4">
				<UnauthorizedSvg className="size-16 mx-auto" />
				<div className="space-y-1.5">
					<h2 className="text-2xl font-bold tracking-tight text-foreground">
						Organizer Sign-In Required
					</h2>
					<p className="text-sm text-muted-foreground max-w-sm mx-auto">
						{message || "You must be logged in as an event organizer to verify tickets."}
					</p>
				</div>
				<Button asChild size="lg" className="h-11 px-8 font-semibold text-sm">
					<Link href="/login">Sign In to Verify</Link>
				</Button>
			</div>
		);
	}

	if (authState === "unauthorized") {
		return (
			<div className="py-12 text-center space-y-4">
				<UnauthorizedSvg className="size-16 mx-auto" />
				<div className="space-y-1.5">
					<h2 className="text-2xl font-bold tracking-tight text-foreground">
						Access Restricted
					</h2>
					<p className="text-sm text-muted-foreground max-w-sm mx-auto">
						{message || "You are not an authorized organizer for this event."}
					</p>
				</div>
				<Button asChild variant="outline" size="lg" className="h-11 px-8 font-semibold text-sm">
					<Link href="/dashboard">Back to Dashboard</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{/* Code Lookup Bar */}
			<form onSubmit={handleLookupCode} className="flex gap-2">
				<Input
					placeholder="Enter ticket code (e.g. TIX-...)"
					value={ticketCodeInput}
					onChange={(e) => setTicketCodeInput(e.target.value.toUpperCase())}
					className="font-mono text-sm uppercase h-11 bg-muted/20"
				/>
				<Button
					type="submit"
					disabled={isPending || !ticketCodeInput.trim()}
					size="lg"
					className="h-11 px-6 text-sm font-semibold shrink-0"
				>
					{isPending ? (
						<Loader2 className="size-4 animate-spin" />
					) : (
						"Lookup"
					)}
				</Button>
			</form>

			{/* Status Banner - Clean, Spacious, NO borders around status */}
			{!valid ? (
				<div className="py-10 text-center space-y-3">
					<InvalidTicketSvg className="size-20 mx-auto" />
					<div className="space-y-1">
						<h2 className="text-2xl font-bold tracking-tight text-destructive">
							Invalid Ticket
						</h2>
						<p className="text-sm text-muted-foreground max-w-sm mx-auto">
							{message || "This ticket signature is invalid or forged. Do not grant entry."}
						</p>
					</div>
				</div>
			) : ticket ? (
				<div className="space-y-8">
					{/* Status Header - Clean, Bold, Spacious */}
					<div className="text-center space-y-3 py-4">
						{status === "checked_in" ? (
							<>
								<AlreadyCheckedInSvg className="size-20 mx-auto" />
								<div className="space-y-1">
									<h2 className="text-3xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400">
										Already Checked In
									</h2>
									<p className="text-sm text-muted-foreground">
										This ticket has already been used
										{ticket.checkedInAt && ` · ${formatDate(ticket.checkedInAt, true)}`}
									</p>
								</div>
							</>
						) : (
							<>
								<ValidTicketSvg className="size-20 mx-auto" />
								<div className="space-y-1">
									<h2 className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
										Valid Ticket
									</h2>
									<p className="text-sm text-muted-foreground">
										Ready for entry check-in.
									</p>
								</div>
							</>
						)}
					</div>

					{/* Ticket & Attendee Details - Clean & Spacious, NO nested inner border box */}
					<div className="space-y-6">
						<div className="flex items-center justify-between border-b pb-3">
							<div>
								<h3 className="text-lg font-bold text-foreground">
									{ticket.event?.title}
								</h3>
								<p className="text-xs text-muted-foreground">
									{ticket.event?.organization?.name}
								</p>
							</div>
							<span className="font-mono text-xs font-bold px-3 py-1 rounded bg-muted/60 text-foreground">
								{ticket.ticketCode}
							</span>
						</div>

						<div className="grid grid-cols-2 gap-y-5 gap-x-6">
							<div>
								<p className="text-xs text-muted-foreground">Attendee Name</p>
								<p className="text-base font-bold text-foreground mt-0.5">
									{ticket.attendeeName || ticket.order?.buyerName || "Guest"}
								</p>
							</div>

							<div>
								<p className="text-xs text-muted-foreground">Ticket Tier</p>
								<p className="text-base font-bold text-primary mt-0.5">
									{ticket.ticketType?.name || "General"}
								</p>
							</div>

							{(ticket.attendeeEmail || ticket.order?.buyerEmail) && (
								<div>
									<p className="text-xs text-muted-foreground">Email</p>
									<p className="text-sm text-foreground truncate mt-0.5">
										{ticket.attendeeEmail || ticket.order?.buyerEmail}
									</p>
								</div>
							)}

							{(ticket.attendeePhone || ticket.order?.buyerPhone) && (
								<div>
									<p className="text-xs text-muted-foreground">Phone</p>
									<p className="text-sm text-foreground font-mono mt-0.5">
										{ticket.attendeePhone || ticket.order?.buyerPhone}
									</p>
								</div>
							)}

							{ticket.checkedInAt && (
								<div className="col-span-2">
									<p className="text-xs text-muted-foreground">Check-in Time</p>
									<p className="text-sm font-semibold text-foreground mt-0.5">
										{formatDate(ticket.checkedInAt, true)}
									</p>
								</div>
							)}
						</div>

						{/* Action: Confirm Check-In or Undo */}
						<div className="pt-4">
							{status !== "checked_in" ? (
								<Button
									size="lg"
									onClick={handleCheckIn}
									disabled={isPending}
									className="w-full h-14 text-base font-bold shadow-none"
								>
									{isPending ? (
										<Loader2 className="size-5 animate-spin" />
									) : (
										"Confirm Check-In"
									)}
								</Button>
							) : (
								<Button
									size="lg"
									variant="outline"
									onClick={handleCheckOut}
									disabled={isPending}
									className="w-full h-12 text-sm font-semibold border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 shadow-none"
								>
									{isPending ? (
										<Loader2 className="size-4 animate-spin" />
									) : (
										"Undo Check-In"
									)}
								</Button>
							)}
						</div>

						{verifierName && (
							<p className="text-xs text-center text-muted-foreground pt-2">
								Verified by <span className="text-foreground font-medium">{verifierName}</span>
							</p>
						)}
					</div>
				</div>
			) : (
				<p className="text-center py-12 text-sm text-muted-foreground">
					Scan attendee QR code or enter ticket code above.
				</p>
			)}
		</div>
	);
}
