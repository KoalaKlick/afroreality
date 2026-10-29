"use client";

import { useState, useEffect, useRef } from "react";
import {
	ArrowRightLeft,
	CheckCircle2,
	Loader2,
	MessageCircle,
	MessageSquare,
	Phone,
	User,
	AlertTriangle,
	ExternalLink,
} from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { verifyRecipientPhone } from "@/lib/server-functions/paystack";
import { transferTicketPass } from "@/lib/server-functions/ticket-transfer";

interface TicketTransferModalProps {
	ticketId: string;
	currentTicketCode: string;
	attendeeName?: string;
	eventTitle: string;
	onTransferred?: (newTicketCode: string, newDirectUrl: string) => void;
}

type DeliveryChannel = "whatsapp" | "sms";

export function TicketTransferModal({
	ticketId,
	currentTicketCode,
	attendeeName,
	eventTitle,
	onTransferred,
}: TicketTransferModalProps) {
	const [open, setOpen] = useState(false);
	const [phone, setPhone] = useState("");
	const [name, setName] = useState("");
	const [channel, setChannel] = useState<DeliveryChannel>("whatsapp");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [successResult, setSuccessResult] = useState<{
		newTicketCode: string;
		newDirectUrl: string;
		recipientPhone: string;
		channel: DeliveryChannel;
	} | null>(null);

	const [phoneLookup, setPhoneLookup] = useState<{
		loading: boolean;
		accountName?: string | null;
	}>({ loading: false });

	const lookupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Debounced MoMo phone verification
	useEffect(() => {
		const digits = phone.replace(/[^0-9]/g, "");
		if (digits.length < 9) {
			setPhoneLookup({ loading: false, accountName: null });
			return;
		}

		if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);

		setPhoneLookup({ loading: true });
		lookupTimerRef.current = setTimeout(async () => {
			try {
				const res = await verifyRecipientPhone(phone);
				if (res.accountName) {
					setPhoneLookup({ loading: false, accountName: res.accountName });
					setName((prev) => (!prev.trim() ? res.accountName! : prev));
				} else {
					setPhoneLookup({ loading: false, accountName: null });
				}
			} catch {
				setPhoneLookup({ loading: false, accountName: null });
			}
		}, 550);

		return () => {
			if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);
		};
	}, [phone]);

	const resetState = () => {
		setPhone("");
		setName("");
		setChannel("whatsapp");
		setIsSubmitting(false);
		setSuccessResult(null);
		setPhoneLookup({ loading: false });
	};

	const handleOpenChange = (nextOpen: boolean) => {
		setOpen(nextOpen);
		if (!nextOpen) {
			setTimeout(resetState, 200);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const cleaned = phone.replace(/[^0-9]/g, "");
		if (cleaned.length < 9) {
			toast.error("Please enter a valid recipient phone number.");
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await transferTicketPass({
				data: {
					ticketId,
					currentTicketCode,
					recipientPhone: phone.trim(),
					recipientName: name.trim() || undefined,
					channel,
				},
			});

			if (res.success) {
				setSuccessResult({
					newTicketCode: res.newTicketCode,
					newDirectUrl: res.newDirectUrl,
					recipientPhone: res.recipientPhone,
					channel,
				});
				toast.success(`Ticket transferred via ${channel === "whatsapp" ? "WhatsApp" : "SMS"}!`);
				if (onTransferred) {
					onTransferred(res.newTicketCode, res.newDirectUrl);
				}
			}
		} catch (err: any) {
			toast.error(err.message || "Failed to transfer ticket pass.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="text-xs gap-1.5 h-9 border-border/70 shadow-sm cursor-pointer bg-card hover:bg-card/90 text-foreground"
				>
					<ArrowRightLeft className="size-3.5 text-primary" />
					Transfer pass
				</Button>
			</DialogTrigger>

			<DialogContent className="sm:max-w-md p-6 bg-background border-border/80 shadow-none">
				{!successResult ? (
					<form onSubmit={handleSubmit} className="space-y-4">
						<DialogHeader className="text-left space-y-1.5">
							<DialogTitle className="text-base font-bold flex items-center gap-2">
								<ArrowRightLeft className="size-4 text-primary" />
								Transfer Ticket Pass
							</DialogTitle>
							<DialogDescription className="text-xs text-muted-foreground leading-relaxed">
								Reassign this ticket to another person. A new ticket code will be
								generated and sent immediately.
							</DialogDescription>
						</DialogHeader>

						{/* Delivery Channel Picker */}
						<div className="space-y-1.5 pt-1">
							<Label className="text-xs font-semibold text-foreground">
								Delivery Channel *
							</Label>
							<div className="grid grid-cols-2 gap-2.5">
								{/* WhatsApp Channel */}
								<button
									type="button"
									onClick={() => setChannel("whatsapp")}
									className={cn(
										"flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer",
										channel === "whatsapp"
											? "border-emerald-500 bg-emerald-500/[0.08] text-foreground ring-1 ring-emerald-500"
											: "border-border/70 bg-muted/20 text-muted-foreground hover:bg-muted/40",
									)}
								>
									<div
										className={cn(
											"size-8 rounded-lg flex items-center justify-center shrink-0",
											channel === "whatsapp"
												? "bg-emerald-500 text-white"
												: "bg-muted text-muted-foreground",
										)}
									>
										<MessageCircle className="size-4" />
									</div>
									<div className="min-w-0">
										<p className="text-xs font-bold text-foreground">WhatsApp</p>
										<p className="text-[10px] text-muted-foreground truncate">
											Rich ticket card
										</p>
									</div>
								</button>

								{/* SMS Channel */}
								<button
									type="button"
									onClick={() => setChannel("sms")}
									className={cn(
										"flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer",
										channel === "sms"
											? "border-amber-500 bg-amber-500/[0.08] text-foreground ring-1 ring-amber-500"
											: "border-border/70 bg-muted/20 text-muted-foreground hover:bg-muted/40",
									)}
								>
									<div
										className={cn(
											"size-8 rounded-lg flex items-center justify-center shrink-0",
											channel === "sms"
												? "bg-amber-500 text-white"
												: "bg-muted text-muted-foreground",
										)}
									>
										<MessageSquare className="size-4" />
									</div>
									<div className="min-w-0">
										<p className="text-xs font-bold text-foreground">SMS</p>
										<p className="text-[10px] text-muted-foreground truncate">
											Text with short link
										</p>
									</div>
								</button>
							</div>
						</div>

						{/* Recipient Phone Input */}
						<div className="space-y-1.5">
							<Label htmlFor="transfer-phone" className="text-xs font-semibold">
								Recipient Phone Number *
							</Label>
							<div className="relative">
								<Phone className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
								<Input
									id="transfer-phone"
									type="tel"
									placeholder="e.g. 024 123 4567"
									value={phone}
									onChange={(e) => setPhone(e.target.value)}
									className="pl-9 h-9 text-xs border-border/80 bg-background"
									required
									disabled={isSubmitting}
								/>
							</div>
							{phoneLookup.loading ? (
								<p className="text-[10px] text-muted-foreground animate-pulse">
									Looking up name...
								</p>
							) : phoneLookup.accountName ? (
								<p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
									Verified: {phoneLookup.accountName}
								</p>
							) : (
								<p className="text-[10px] text-muted-foreground">
									The new pass link will be delivered directly to this number.
								</p>
							)}
						</div>

						{/* Recipient Name Input (Optional) */}
						<div className="space-y-1.5">
							<Label htmlFor="transfer-name" className="text-xs font-semibold">
								Recipient Full Name (Optional)
							</Label>
							<div className="relative">
								<User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
								<Input
									id="transfer-name"
									placeholder="e.g. Ama Mensah"
									value={name}
									onChange={(e) => setName(e.target.value)}
									className="pl-9 h-9 text-xs border-border/80 bg-background"
									disabled={isSubmitting}
								/>
							</div>
						</div>

						{/* Security / Deactivation Warning */}
						<div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
							<AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
							<div className="text-[11px] leading-relaxed">
								<strong className="font-semibold block text-amber-900 dark:text-amber-200">
									Immediate Invalidation
								</strong>
								Your current pass code (
								<span className="font-mono font-bold">{currentTicketCode}</span>)
								will be immediately revoked and cannot be recovered once transferred.
							</div>
						</div>

						<DialogFooter className="pt-2 flex flex-row items-center justify-end gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setOpen(false)}
								disabled={isSubmitting}
								className="text-xs border-border/80 cursor-pointer"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								size="sm"
								disabled={isSubmitting || phone.replace(/[^0-9]/g, "").length < 9}
								className="text-xs font-semibold gap-1.5 cursor-pointer"
							>
								{isSubmitting ? (
									<>
										<Loader2 className="size-3.5 animate-spin" />
										Transferring...
									</>
								) : (
									<>
										<ArrowRightLeft className="size-3.5" />
										Transfer Pass
									</>
								)}
							</Button>
						</DialogFooter>
					</form>
				) : (
					/* Success View */
					<div className="py-4 text-center space-y-4">
						<div className="size-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
							<CheckCircle2 className="size-7" />
						</div>

						<div className="space-y-1.5">
							<h4 className="font-bold text-base text-foreground">
								Ticket Transferred!
							</h4>
							<p className="text-xs text-muted-foreground max-w-xs mx-auto">
								A new pass has been generated and dispatched to{" "}
								<strong className="text-foreground">{successResult.recipientPhone}</strong> via{" "}
								<strong className="capitalize">{successResult.channel}</strong>.
							</p>
						</div>

						<div className="p-3 rounded-xl border border-border/80 bg-muted/20 text-left space-y-1.5">
							<div className="flex items-center justify-between text-xs">
								<span className="text-muted-foreground">New Pass Code:</span>
								<span className="font-mono font-bold text-primary">
									{successResult.newTicketCode}
								</span>
							</div>
							<div className="flex items-center justify-between text-xs">
								<span className="text-muted-foreground">Status:</span>
								<span className="text-emerald-600 dark:text-emerald-400 font-semibold">
									Delivered
								</span>
							</div>
						</div>

						<DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
							<Button
								asChild
								variant="outline"
								size="sm"
								className="text-xs flex-1 gap-1.5 border-border/80 cursor-pointer"
							>
								<a href={successResult.newDirectUrl} target="_blank" rel="noreferrer">
									<ExternalLink className="size-3.5" /> Open New Pass
								</a>
							</Button>
							<Button
								size="sm"
								onClick={() => setOpen(false)}
								className="text-xs font-semibold flex-1 cursor-pointer"
							>
								Done
							</Button>
						</DialogFooter>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}

