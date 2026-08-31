"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
	CheckCircle2,
	Loader2,
	Lock,
	Mail,
	Minus,
	Phone,
	Plus,
	Ticket,
	User,
	XCircle,
	ExternalLink,
	Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { initiatePublicTicketCheckout } from "@/lib/server-functions/public-checkout";
import Link from "next/link";
import { toast } from "sonner";

interface PublicTicketPaymentModalProps {
	readonly ticket: {
		readonly id: string;
		readonly name: string;
		readonly price: number;
		readonly currency?: string;
		readonly status: string;
		readonly maxPerOrder?: number;
		readonly minPerOrder?: number;
	} | null;
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly event: {
		readonly id: string;
		readonly title: string;
		readonly organizationId: string;
	};
	readonly routing: {
		readonly orgSlug: string;
		readonly eventSlug: string;
	};
	readonly organization?: {
		readonly primaryColor?: string | null;
		readonly secondaryColor?: string | null;
		readonly tertiaryColor?: string | null;
	};
	readonly brandVars?: React.CSSProperties;
}

type ModalStep = "checkout" | "processing" | "success" | "error";

export function PublicTicketPaymentModal({
	ticket,
	open,
	onOpenChange,
	event,
	routing,
	organization,
	brandVars,
}: PublicTicketPaymentModalProps) {
	const router = useRouter();

	const [step, setStep] = useState<ModalStep>("checkout");
	const [quantity, setQuantity] = useState(1);
	const [buyerName, setBuyerName] = useState("");
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [errorMsg, setErrorMsg] = useState("");
	const [createdTickets, setCreatedTickets] = useState<any[]>([]);
	const [viewUrl, setViewUrl] = useState<string>("");

	const resetModal = useCallback(() => {
		setStep("checkout");
		setQuantity(1);
		setBuyerName("");
		setPhone("");
		setEmail("");
		setLoading(false);
		setErrorMsg("");
		setCreatedTickets([]);
		setViewUrl("");
	}, []);

	const handleClose = useCallback(
		(nextOpen: boolean) => {
			if (!nextOpen) resetModal();
			onOpenChange(nextOpen);
		},
		[onOpenChange, resetModal],
	);

	if (!ticket) return null;
	const selectedTicket = ticket;

	const minPerOrder = Math.max(selectedTicket.minPerOrder || 1, 1);
	const maxPerOrder = Math.max(selectedTicket.maxPerOrder || 10, minPerOrder);
	const unitPrice = Number(selectedTicket.price);
	const totalAmount = unitPrice * quantity;
	const isFree = totalAmount === 0;

	async function handleSubmitPayment(e: React.FormEvent) {
		e.preventDefault();
		if (!buyerName.trim() || !email.trim()) {
			toast.error("Please enter your name and email address.");
			return;
		}

		setLoading(true);
		setErrorMsg("");
		setStep("processing");

		try {
			const result = await initiatePublicTicketCheckout({
				data: {
					eventId: event.id,
					ticketTypeId: selectedTicket.id,
					quantity,
					buyerName: buyerName.trim(),
					buyerEmail: email.trim(),
					buyerPhone: phone.trim() || undefined,
				},
			});

			if (result.isFree) {
				setCreatedTickets(result.tickets || []);
				setViewUrl(result.viewUrl || `/ticket/view?token=${result.tickets?.[0]?.token}`);
				setStep("success");
				toast.success("Registration successful! Your ticket is ready.");
			} else if (result.authorizationUrl) {
				// Redirect to Paystack Checkout
				window.location.href = result.authorizationUrl;
			} else {
				throw new Error("Unable to proceed to payment.");
			}
		} catch (err: any) {
			setStep("error");
			setErrorMsg(err.message || "Checkout failed. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	const computedBrandVars =
		brandVars ||
		({
			"--color-brand-primary": organization?.primaryColor || "#009A44",
			"--color-brand-secondary": organization?.secondaryColor || "#FFD100",
			"--color-brand-tertiary": organization?.tertiaryColor || "#EF3340",
		} as React.CSSProperties);

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-md p-6" style={computedBrandVars}>
				<DialogHeader>
					<DialogTitle className="text-xl font-bold">
						{step === "success"
							? "Tickets Confirmed!"
							: step === "error"
								? "Checkout Error"
								: isFree
									? "Register for Event"
									: "Ticket Checkout"}
					</DialogTitle>
				</DialogHeader>

				{step === "checkout" && (
					<form onSubmit={handleSubmitPayment} className="space-y-5 pt-2">
						{/* Tier Summary Banner */}
						<div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
							<div>
								<h4 className="font-bold text-sm text-foreground">
									{selectedTicket.name}
								</h4>
								<p className="text-xs text-muted-foreground">{event.title}</p>
							</div>
							<div className="text-right">
								<span className="text-base font-black text-primary">
									{isFree ? "Free" : `GHS ${(unitPrice * quantity).toFixed(2)}`}
								</span>
								{!isFree && (
									<p className="text-[10px] text-muted-foreground">
										GHS {unitPrice.toFixed(2)} each
									</p>
								)}
							</div>
						</div>

						{/* Quantity Selector */}
						<div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
							<span className="text-xs font-semibold text-foreground">
								Quantity:
							</span>
							<div className="flex items-center gap-3">
								<Button
									type="button"
									variant="outline"
									size="icon"
									className="size-8"
									onClick={() => setQuantity((q) => Math.max(minPerOrder, q - 1))}
									disabled={quantity <= minPerOrder || loading}
								>
									<Minus className="size-3.5" />
								</Button>
								<span className="text-sm font-bold w-6 text-center font-mono">
									{quantity}
								</span>
								<Button
									type="button"
									variant="outline"
									size="icon"
									className="size-8"
									onClick={() => setQuantity((q) => Math.min(maxPerOrder, q + 1))}
									disabled={quantity >= maxPerOrder || loading}
								>
									<Plus className="size-3.5" />
								</Button>
							</div>
						</div>

						{/* Attendee Details Form */}
						<div className="space-y-3.5">
							<div className="space-y-1.5">
								<Label htmlFor="buyer-name" className="text-xs">
									Full Name *
								</Label>
								<div className="relative">
									<User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
									<Input
										id="buyer-name"
										placeholder="e.g. Kwame Mensah"
										value={buyerName}
										onChange={(e) => setBuyerName(e.target.value)}
										className="pl-9 h-9 text-xs"
										required
										disabled={loading}
									/>
								</div>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="buyer-email" className="text-xs">
									Email Address *
								</Label>
								<div className="relative">
									<Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
									<Input
										id="buyer-email"
										type="email"
										placeholder="kwame@example.com"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										className="pl-9 h-9 text-xs"
										required
										disabled={loading}
									/>
								</div>
								<p className="text-[10px] text-muted-foreground">
									Tickets and QR codes will be delivered to this email.
								</p>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="buyer-phone" className="text-xs">
									Phone Number (Optional)
								</Label>
								<div className="relative">
									<Phone className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
									<Input
										id="buyer-phone"
										type="tel"
										placeholder="024 123 4567"
										value={phone}
										onChange={(e) => setPhone(e.target.value)}
										className="pl-9 h-9 text-xs"
										disabled={loading}
									/>
								</div>
							</div>
						</div>

						<Button
							type="submit"
							className="w-full font-bold text-xs h-10 gap-2"
							disabled={loading}
						>
							<Lock className="size-3.5" />
							{isFree
								? "Claim Free Ticket"
								: `Pay GHS ${totalAmount.toFixed(2)} Securely`}
						</Button>
					</form>
				)}

				{step === "processing" && (
					<div className="py-12 text-center space-y-4">
						<Loader2 className="size-10 text-primary animate-spin mx-auto" />
						<div>
							<h4 className="font-bold text-base">Processing Your Request...</h4>
							<p className="text-xs text-muted-foreground mt-1">
								Please wait while we secure your tickets.
							</p>
						</div>
					</div>
				)}

				{step === "success" && (
					<div className="py-8 text-center space-y-5">
						<div className="size-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto dark:bg-green-950/50 dark:text-green-400">
							<CheckCircle2 className="size-8" />
						</div>

						<div className="space-y-1">
							<h4 className="font-bold text-lg text-foreground">
								You're Going to {event.title}!
							</h4>
							<p className="text-xs text-muted-foreground max-w-xs mx-auto">
								Your tickets have been confirmed and sent to{" "}
								<strong>{email}</strong>.
							</p>
						</div>

						{createdTickets.length > 0 && (
							<div className="p-3 rounded-xl bg-muted/40 border text-xs font-mono">
								<span className="text-muted-foreground">Ticket Code: </span>
								<strong className="text-foreground">
									{createdTickets[0].ticketCode}
								</strong>
							</div>
						)}

						<div className="flex flex-col gap-2 pt-2">
							{viewUrl && (
								<Button asChild className="w-full gap-2 text-xs font-bold h-10">
									<Link href={viewUrl} target="_blank">
										<ExternalLink className="size-3.5" /> View &amp; Download Ticket
									</Link>
								</Button>
							)}
							<Button
								variant="outline"
								onClick={() => handleClose(false)}
								className="w-full text-xs h-9"
							>
								Done
							</Button>
						</div>
					</div>
				)}

				{step === "error" && (
					<div className="py-8 text-center space-y-4">
						<div className="size-12 rounded-full bg-red-100 text-destructive flex items-center justify-center mx-auto dark:bg-red-950/50">
							<XCircle className="size-7" />
						</div>
						<div>
							<h4 className="font-bold text-base text-foreground">
								Checkout Failed
							</h4>
							<p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
								{errorMsg || "An unexpected error occurred during checkout."}
							</p>
						</div>
						<div className="flex gap-2 justify-center pt-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setStep("checkout")}
								className="text-xs"
							>
								Try Again
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => handleClose(false)}
								className="text-xs"
							>
								Close
							</Button>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
