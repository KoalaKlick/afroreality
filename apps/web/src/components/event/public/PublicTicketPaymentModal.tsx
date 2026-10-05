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
	Users,
	XCircle,
	ExternalLink,
	Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
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
		readonly salesStart?: string | null;
		readonly salesEnd?: string | null;
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

interface AttendeeEntry {
	name: string;
	email: string;
}

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
	const [attendees, setAttendees] = useState<AttendeeEntry[]>([]);
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
		setAttendees([]);
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

	const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
	const isValidPhone = (val: string) => {
		const cleaned = val.replace(/[\s\-\(\)]/g, "");
		return cleaned.length >= 9 && /^[+]?[0-9]{9,15}$/.test(cleaned);
	};

	const isUpcoming = Boolean(
		selectedTicket.salesStart && new Date(selectedTicket.salesStart).getTime() > Date.now()
	);
	const isSalesEnded = Boolean(
		selectedTicket.salesEnd && new Date(selectedTicket.salesEnd).getTime() < Date.now()
	);
	const isEmailValid = !email.trim() || isValidEmail(email);
	const isPhoneValid = isValidPhone(phone);
	const isNameValid = buyerName.trim().length >= 2;
	const isQuantityValid = quantity >= minPerOrder && quantity <= maxPerOrder;
	const isFormValid = isNameValid && isPhoneValid && isEmailValid && isQuantityValid && !isUpcoming && !isSalesEnded;

	const handleQuantityChange = (newQty: number) => {
		const clamped = Math.max(minPerOrder, Math.min(maxPerOrder, newQty));
		setQuantity(clamped);
		setAttendees((prev) => {
			const updated = [...prev];
			while (updated.length < clamped) {
				updated.push({ name: "", email: "" });
			}
			return updated.slice(0, clamped);
		});
	};

	const handleCopyBuyerToAll = () => {
		if (!buyerName.trim()) {
			toast.error("Please enter your name first.");
			return;
		}
		setAttendees((prev) => {
			const updated = Array.from({ length: quantity }).map((_, idx) => ({
				name: idx === 0 ? buyerName.trim() : `${buyerName.trim()} (Guest #${idx + 1})`,
				email: idx === 0 ? email.trim() : prev[idx]?.email || "",
			}));
			return updated;
		});
		toast.success("Applied to all passes!");
	};

	async function handleSubmitPayment(e: React.FormEvent) {
		e.preventDefault();
		if (!isNameValid) {
			toast.error("Please enter attendee full name.");
			return;
		}
		if (!isPhoneValid) {
			toast.error("Please enter a valid phone number (e.g. 024 123 4567).");
			return;
		}
		if (email.trim() && !isValidEmail(email)) {
			toast.error("Please enter a valid email address or leave it empty.");
			return;
		}

		setLoading(true);
		setErrorMsg("");
		setStep("processing");

		const attendeesPayload = Array.from({ length: quantity }).map((_, idx) => {
			if (idx === 0) {
				return {
					name: buyerName.trim(),
					email: email.trim() || undefined,
					phone: phone.trim() || undefined,
				};
			}
			const att = attendees[idx];
			return {
				name: att?.name?.trim() || `${buyerName.trim()} (Guest #${idx + 1})`,
				email: att?.email?.trim() || undefined,
			};
		});

		try {
			const result = await initiatePublicTicketCheckout({
				data: {
					eventId: event.id,
					ticketTypeId: selectedTicket.id,
					quantity,
					buyerName: buyerName.trim(),
					buyerPhone: phone.trim(),
					buyerEmail: email.trim() || undefined,
					attendees: attendeesPayload,
				},
			});

			if (result.isFree) {
				setCreatedTickets(result.tickets || []);
				setViewUrl(result.viewUrl || `/ticket/view?token=${result.tickets?.[0]?.token}`);
				setStep("success");
				toast.success("Registration successful! Your tickets are ready.");
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
		<Sheet open={open} onOpenChange={handleClose}>
			<SheetContent
				className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-lg shadow-none border-l border-border/80 bg-background"
				style={computedBrandVars}
			>
				<SheetHeader className="border-b px-6 py-4">
					<SheetTitle className="text-left text-xl font-black uppercase tracking-tight">
						{step === "success"
							? "Tickets Confirmed!"
							: step === "error"
								? "Checkout Error"
								: isFree
									? "Register for Event"
									: "Ticket Checkout"}
					</SheetTitle>
				</SheetHeader>

				{step === "checkout" && (
					<form onSubmit={handleSubmitPayment} className="flex h-full flex-col flex-1 overflow-hidden">
						<div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
							{/* Tier Summary Card */}
							<div className="p-4 rounded-xl border border-border/80 bg-muted/20 flex items-center justify-between">
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
							<div className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-muted/20">
								<div>
									<span className="text-xs font-bold text-foreground">
										Quantity
									</span>
									<p className="text-[10px] text-muted-foreground">
										Number of passes to purchase
									</p>
								</div>
								<div className="flex items-center gap-3">
									<Button
										type="button"
										variant="outline"
										size="icon"
										className="size-8 border-border/80 cursor-pointer"
										onClick={() => handleQuantityChange(quantity - 1)}
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
										className="size-8 border-border/80 cursor-pointer"
										onClick={() => handleQuantityChange(quantity + 1)}
										disabled={quantity >= maxPerOrder || loading}
									>
										<Plus className="size-3.5" />
									</Button>
								</div>
							</div>

							{/* Primary Buyer Details (Ticket 1 & Billing Contact) */}
							<div className="space-y-4">
								<div className="flex items-center justify-between border-b border-border/60 pb-2">
									<Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
										{quantity > 1 ? "Primary Buyer & Pass #1" : "Attendee Information"}
									</Label>
									{quantity > 1 && (
										<span className="text-[10px] text-muted-foreground">
											WhatsApp &amp; payment contact
										</span>
									)}
								</div>

								<div className="space-y-1.5">
									<Label htmlFor="buyer-name" className="text-xs font-medium">
										Full Name *
									</Label>
									<div className="relative">
										<User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
										<Input
											id="buyer-name"
											placeholder="e.g. Kwame Mensah"
											value={buyerName}
											onChange={(e) => setBuyerName(e.target.value)}
											className="pl-9 h-9 text-xs border-border/80 bg-background"
											required
											disabled={loading}
										/>
									</div>
								</div>

								<div className="space-y-1.5">
									<Label htmlFor="buyer-phone" className="text-xs font-medium">
										Phone Number *
									</Label>
									<div className="relative">
										<Phone className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
										<Input
											id="buyer-phone"
											type="tel"
											placeholder="024 123 4567"
											value={phone}
											onChange={(e) => setPhone(e.target.value)}
											className="pl-9 h-9 text-xs border-border/80 bg-background"
											required
											disabled={loading}
										/>
									</div>
									<p className="text-[10px] text-muted-foreground">
										Required for payment prompt and WhatsApp ticket link delivery.
									</p>
								</div>

								<div className="space-y-1.5">
									<Label htmlFor="buyer-email" className="text-xs font-medium">
										Email Address (Optional)
									</Label>
									<div className="relative">
										<Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
										<Input
											id="buyer-email"
											type="email"
											placeholder="kwame@example.com (optional)"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											className="pl-9 h-9 text-xs border-border/80 bg-background"
											disabled={loading}
										/>
									</div>
									<p className="text-[10px] text-muted-foreground">
										Optional. A copy of your wallet pass link will also be sent here.
									</p>
								</div>
							</div>

							{/* Additional Attendees Section when Quantity > 1 */}
							{quantity > 1 && (
								<div className="space-y-4 pt-2 border-t border-border/60">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-1.5">
											<Users className="size-3.5 text-primary" />
											<Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
												Additional Passes ({quantity - 1})
											</Label>
										</div>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={handleCopyBuyerToAll}
											className="h-6 text-[10px] px-2 text-primary hover:text-primary gap-1"
											title="Autofill remaining passes with your name"
										>
											<Copy className="size-3" />
											Use my name for all
										</Button>
									</div>
									<p className="text-[11px] text-muted-foreground leading-relaxed">
										Enter individual attendee details for each ticket so gate admission passes are accurately labeled and tamper-proof.
									</p>

									{/* Vertical List of Additional Attendee Fields */}
									<div className="space-y-3">
										{Array.from({ length: quantity - 1 }).map((_, i) => {
											const passNum = i + 2;
											const current = attendees[passNum - 1] || { name: "", email: "" };
											return (
												<div
													key={passNum}
													className="border border-border/80 rounded-xl p-3.5 space-y-3 bg-muted/20"
												>
													<div className="flex items-center justify-between">
														<span className="text-xs font-bold text-foreground flex items-center gap-1.5">
															<Ticket className="size-3.5 text-primary" />
															Pass #{passNum}
														</span>
														<span className="text-[10px] font-mono text-muted-foreground">
															{selectedTicket.name}
														</span>
													</div>

													<div className="space-y-1">
														<Label className="text-[11px] text-muted-foreground">
															Attendee Full Name
														</Label>
														<Input
															placeholder={`Attendee #${passNum} Full Name`}
															value={current.name}
															onChange={(e) => {
																const val = e.target.value;
																setAttendees((prev) => {
																	const copy = [...prev];
																	while (copy.length < quantity) {
																		copy.push({ name: "", email: "" });
																	}
																	copy[passNum - 1] = {
																		...copy[passNum - 1],
																		name: val,
																		email: copy[passNum - 1]?.email || "",
																	};
																	return copy;
																});
															}}
															className="h-9 text-xs border-border/80 bg-background"
															disabled={loading}
														/>
													</div>

													<div className="space-y-1">
														<Label className="text-[11px] text-muted-foreground">
															Email (Optional)
														</Label>
														<Input
															type="email"
															placeholder="attendee@example.com (optional)"
															value={current.email}
															onChange={(e) => {
																const val = e.target.value;
																setAttendees((prev) => {
																	const copy = [...prev];
																	while (copy.length < quantity) {
																		copy.push({ name: "", email: "" });
																	}
																	copy[passNum - 1] = {
																		...copy[passNum - 1],
																		email: val,
																		name: copy[passNum - 1]?.name || "",
																	};
																	return copy;
																});
															}}
															className="h-9 text-xs border-border/80 bg-background"
															disabled={loading}
														/>
													</div>
												</div>
											);
										})}
									</div>
								</div>
							)}

							{isUpcoming && (
								<div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs text-amber-700 dark:text-amber-400 text-center">
									Ticket sales have not started yet. Sales open on{" "}
									{new Date(selectedTicket.salesStart!).toLocaleString("en-GH", {
										dateStyle: "medium",
										timeStyle: "short",
									})}.
								</div>
							)}

							{isSalesEnded && (
								<div className="rounded-xl bg-destructive/10 border border-destructive/30 p-3.5 text-xs text-destructive text-center">
									Ticket sales for this tier have ended.
								</div>
							)}
						</div>

						<SheetFooter className="border-t bg-background p-6">
							<Button
								type="submit"
								variant="brand-cta"
								size="lg"
								className="w-full font-bold gap-2 cursor-pointer"
								disabled={loading || !isFormValid}
							>
								<Lock className="size-3.5" />
								{isUpcoming
									? "Sales Not Started Yet"
									: isSalesEnded
										? "Sales Ended"
										: isFree
											? (quantity > 1 ? `Claim ${quantity} Free Tickets` : "Claim Free Ticket")
											: `Pay GHS ${totalAmount.toFixed(2)} Securely`}
							</Button>
						</SheetFooter>
					</form>
				)}

				{step === "processing" && (
					<div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
						<Loader2 className="size-10 text-primary animate-spin" />
						<div>
							<h4 className="font-bold text-base">Processing Your Request...</h4>
							<p className="text-xs text-muted-foreground mt-1">
								Please wait while we secure your tickets.
							</p>
						</div>
					</div>
				)}

				{step === "success" && (
					<div className="flex flex-col flex-1 overflow-hidden">
						<div className="flex-1 overflow-y-auto px-6 py-8 text-center space-y-6">
							<div className="size-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto dark:bg-green-950/50 dark:text-green-400">
								<CheckCircle2 className="size-8" />
							</div>

							<div className="space-y-1.5">
								<h4 className="font-bold text-lg text-foreground">
									You're Going to {event.title}!
								</h4>
								<p className="text-xs text-muted-foreground max-w-xs mx-auto">
									Your tickets have been confirmed and sent to{" "}
									<strong>{phone || email}</strong>.
								</p>
							</div>

							{createdTickets.length > 0 && (
								<div className="p-3.5 rounded-xl bg-muted/30 border border-border/80 text-xs font-mono">
									<span className="text-muted-foreground">
										{createdTickets.length > 1 ? "Primary Ticket Code: " : "Ticket Code: "}
									</span>
									<strong className="text-foreground">
										{createdTickets[0].ticketCode}
									</strong>
								</div>
							)}
						</div>

						<SheetFooter className="border-t bg-background p-6 flex flex-col gap-2">
							{viewUrl && (
								<Button asChild variant="brand-cta" size="lg" className="w-full gap-2 text-xs font-bold cursor-pointer">
									<Link href={viewUrl} target="_blank">
										<ExternalLink className="size-3.5" />
										{createdTickets.length > 1
											? `View & Download ${createdTickets.length} Passes`
											: "View & Download Pass"}
									</Link>
								</Button>
							)}
							<Button
								variant="outline"
								onClick={() => handleClose(false)}
								className="w-full text-xs h-9 border-border/80 cursor-pointer"
							>
								Done
							</Button>
						</SheetFooter>
					</div>
				)}

				{step === "error" && (
					<div className="flex flex-col flex-1 overflow-hidden">
						<div className="flex-1 overflow-y-auto px-6 py-8 text-center space-y-4">
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
						</div>

						<SheetFooter className="border-t bg-background p-6 flex gap-2">
							<Button
								variant="outline"
								onClick={() => setStep("checkout")}
								className="flex-1 text-xs border-border/80 cursor-pointer"
							>
								Try Again
							</Button>
							<Button
								variant="ghost"
								onClick={() => handleClose(false)}
								className="text-xs cursor-pointer"
							>
								Close
							</Button>
						</SheetFooter>
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}
