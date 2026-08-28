"use client";

import { useState, useTransition } from "react";
import {
	CheckCircle2,
	AlertCircle,
	XCircle,
	Loader2,
	LogOut,
	LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { verifyAndCheckInTicket } from "@/lib/server-functions/public-checkout";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface TicketVerifyClientProps {
	readonly initialToken?: string;
	readonly initialTicket?: any;
	readonly initialStatus?: string;
	readonly initialMessage?: string;
	readonly isValid?: boolean;
}

export function TicketVerifyClient({
	initialToken,
	initialTicket,
	initialStatus = "not_checked_in",
	initialMessage,
	isValid = true,
}: TicketVerifyClientProps) {
	const [ticket, setTicket] = useState<any>(initialTicket);
	const [status, setStatus] = useState<string>(initialStatus);
	const [message, setMessage] = useState<string>(initialMessage || "");
	const [valid, setValid] = useState<boolean>(isValid);
	const [ticketCodeInput, setTicketCodeInput] = useState<string>("");
	const [isPending, startTransition] = useTransition();

	async function handleLookupCode(e: React.FormEvent) {
		e.preventDefault();
		if (!ticketCodeInput.trim()) return;

		startTransition(async () => {
			try {
				const result = await verifyAndCheckInTicket({
					data: {
						ticketCode: ticketCodeInput.trim().toUpperCase(),
						action: "status",
					},
				});

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
							? `Already checked in at ${result.ticket.checkedInAt ? formatDate(result.ticket.checkedInAt, true) : "earlier"}`
							: "Ticket verified! Ready for check-in.",
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

				if (result.isValid && result.ticket) {
					setTicket(result.ticket);
					setStatus("checked_in");
					setMessage(result.message || "Check-in recorded successfully!");
					toast.success("Attendee checked in!");
				} else {
					toast.error(result.message);
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

				if (result.isValid && result.ticket) {
					setTicket(result.ticket);
					setStatus("not_checked_in");
					setMessage("Checked out successfully.");
					toast.success("Attendee checked out.");
				}
			} catch (err: any) {
				toast.error(err.message || "Check-out failed.");
			}
		});
	}

	return (
		<div className="max-w-xl mx-auto space-y-6">
			{/* Manual Ticket Code Lookup */}
			<Card className="border-border/80 shadow-xs">
				<CardContent className="p-4 sm:p-5">
					<form onSubmit={handleLookupCode} className="flex gap-2">
						<Input
							placeholder="Enter Ticket Code (e.g. TIX-ABC12345)"
							value={ticketCodeInput}
							onChange={(e) => setTicketCodeInput(e.target.value.toUpperCase())}
							className="font-mono text-xs uppercase"
						/>
						<Button
							type="submit"
							disabled={isPending || !ticketCodeInput.trim()}
							size="sm"
							className="text-xs font-semibold shrink-0"
						>
							{isPending ? (
								<Loader2 className="size-3.5 animate-spin" />
							) : (
								"Verify Code"
							)}
						</Button>
					</form>
				</CardContent>
			</Card>

			{/* Status Banner */}
			{!valid ? (
				<div className="p-6 rounded-2xl bg-destructive/10 border border-destructive/20 text-center space-y-2">
					<XCircle className="size-12 text-destructive mx-auto" />
					<h3 className="text-lg font-bold text-foreground">Invalid Ticket</h3>
					<p className="text-xs text-muted-foreground">{message}</p>
				</div>
			) : ticket ? (
				<div className="space-y-6">
					{/* Status Card Header */}
					<div
						className={`p-6 rounded-2xl border text-center space-y-2 ${
							status === "checked_in"
								? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-300"
								: "bg-green-500/10 border-green-500/30 text-green-900 dark:text-green-300"
						}`}
					>
						{status === "checked_in" ? (
							<AlertCircle className="size-12 text-amber-500 mx-auto" />
						) : (
							<CheckCircle2 className="size-12 text-green-500 mx-auto" />
						)}
						<h3 className="text-xl font-black text-foreground">
							{status === "checked_in" ? "Already Checked In" : "Valid Ticket"}
						</h3>
						<p className="text-xs text-muted-foreground">{message}</p>
					</div>

					{/* Attendee and Event Details Card */}
					<Card className="border-border/80 shadow-xs">
						<CardContent className="p-6 space-y-4">
							<div className="flex items-center justify-between border-b pb-3">
								<div>
									<h4 className="font-bold text-base text-foreground">
										{ticket.event?.title}
									</h4>
									<p className="text-xs text-muted-foreground">
										{ticket.event?.organization?.name}
									</p>
								</div>
								<span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-muted border">
									{ticket.ticketCode}
								</span>
							</div>

							<div className="grid grid-cols-2 gap-4 text-xs">
								<div className="space-y-1">
									<span className="text-muted-foreground">Attendee:</span>
									<p className="font-bold text-foreground">
										{ticket.attendeeName || ticket.order?.buyerName || "Guest"}
									</p>
								</div>

								<div className="space-y-1">
									<span className="text-muted-foreground">Ticket Tier:</span>
									<p className="font-bold text-primary">
										{ticket.ticketType?.name}
									</p>
								</div>

								{ticket.attendeeEmail && (
									<div className="space-y-1">
										<span className="text-muted-foreground">Email:</span>
										<p className="font-semibold text-foreground truncate">
											{ticket.attendeeEmail}
										</p>
									</div>
								)}

								{ticket.checkedInAt && (
									<div className="space-y-1">
										<span className="text-muted-foreground">Checked In At:</span>
										<p className="font-semibold text-foreground">
											{formatDate(ticket.checkedInAt, true)}
										</p>
									</div>
								)}
							</div>

							{/* Actions: Check In / Check Out */}
							<div className="flex gap-3 pt-4 border-t">
								{status !== "checked_in" ? (
									<Button
										onClick={handleCheckIn}
										disabled={isPending}
										className="flex-1 font-bold text-xs h-10 gap-2"
									>
										<LogIn className="size-4" /> Check In Attendee
									</Button>
								) : (
									<Button
										variant="outline"
										onClick={handleCheckOut}
										disabled={isPending}
										className="flex-1 font-bold text-xs h-10 gap-2 border-amber-500/40 hover:bg-amber-500/10 text-amber-700 dark:text-amber-300"
									>
										<LogOut className="size-4" /> Undo / Check Out
									</Button>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			) : (
				<div className="text-center py-12 text-muted-foreground text-xs">
					Scan a ticket QR code or enter a ticket code above to verify.
				</div>
			)}
		</div>
	);
}
