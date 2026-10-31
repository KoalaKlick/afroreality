"use client";

import React, { useState, useEffect, useTransition, useMemo, useRef } from "react";
import {
	RotateCcw,
	Search,
	Smartphone,
	CheckCircle2,
	AlertCircle,
	AlertTriangle,
	Loader2,
	Ticket,
	Building2,
	Calendar,
	Sparkles,
	Tag,
	User,
	Phone,
	Mail,
	ArrowRight,
	X,
	Info,
	Check,
	CreditCard,
	ShieldCheck,
	Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	adminProcessUserRefund,
	getAdminRefundContext,
	searchOrdersForRefund,
	type AdminRefundContextData,
	type AdminRefundOrderSearchResult,
} from "@/lib/server-functions/admin";
import { formatAmount, cn } from "@/lib/utils";

interface AdminRefundModalProps {
	isOpen: boolean;
	onClose: () => void;
	/** Pre-selected organization ID if opened from a specific wallet/org card */
	preselectedOrgId?: string | null;
	/** Pre-selected event ID if opened from an event context */
	preselectedEventId?: string | null;
	/** Callback when a refund has been successfully processed */
	onSuccess?: (result: {
		reference: string;
		amount: number;
		recipientName: string;
		smsSent?: boolean;
	}) => void;
}

const REASON_PRESETS = [
	"Attendee Ticket Cancellation",
	"Duplicate / Overcharge Payment",
	"Event Cancellation / Postponement",
	"Gate Admission Issue / Entry Denied",
	"Service Compensation / Goodwill",
	"Custom Reason",
];

const DEFAULT_SMS_TEMPLATE =
	"Hello {{name}}, your refund of GH₵{{amount}} for {{event}} has been processed. Ref: {{reference}}. - Fextiva";

export function AdminRefundModal({
	isOpen,
	onClose,
	preselectedOrgId,
	preselectedEventId,
	onSuccess,
}: AdminRefundModalProps) {
	const [contextData, setContextData] = useState<AdminRefundContextData | null>(null);
	const [isLoadingContext, setIsLoadingContext] = useState(false);
	const [isSubmitting, startSubmittingTransition] = useTransition();

	// Order quick-search
	const [orderSearchQuery, setOrderSearchQuery] = useState("");
	const [isSearchingOrders, startOrderSearch] = useTransition();
	const [searchResults, setSearchResults] = useState<AdminRefundOrderSearchResult[]>([]);
	const [selectedOrder, setSelectedOrder] = useState<AdminRefundOrderSearchResult | null>(null);

	// Form fields
	const [recipientName, setRecipientName] = useState("");
	const [recipientPhone, setRecipientPhone] = useState("");
	const [recipientEmail, setRecipientEmail] = useState("");
	const [amount, setAmount] = useState<string>("");
	const [reasonCategory, setReasonCategory] = useState("Attendee Ticket Cancellation");
	const [customReason, setCustomReason] = useState("Attendee Ticket Cancellation");
	const [adminNotes, setAdminNotes] = useState("");

	// Organizer deduction & event selection
	const [deductFromOrganizer, setDeductFromOrganizer] = useState(true);
	const [selectedOrgId, setSelectedOrgId] = useState<string>(preselectedOrgId || "");
	const [selectedEventId, setSelectedEventId] = useState<string>(preselectedEventId || "");

	// SMS configuration
	const [sendSms, setSendSms] = useState(true);
	const [smsMessage, setSmsMessage] = useState(DEFAULT_SMS_TEMPLATE);
	const smsTextareaRef = useRef<HTMLTextAreaElement>(null);

	// Paystack Gateway configuration
	const [processPaystackRefund, setProcessPaystackRefund] = useState(false);
	const [paystackTransactionRef, setPaystackTransactionRef] = useState("");

	// Load refund context (organizations, wallets, and events) when modal opens
	useEffect(() => {
		if (isOpen) {
			setIsLoadingContext(true);
			getAdminRefundContext()
				.then((res) => {
					setContextData(res);
					if (preselectedOrgId) {
						setSelectedOrgId(preselectedOrgId);
					}
					if (preselectedEventId) {
						setSelectedEventId(preselectedEventId);
					}
				})
				.catch((err) => {
					console.error("Failed to load admin refund context", err);
					toast.error("Failed to load events and organizations.");
				})
				.finally(() => {
					setIsLoadingContext(false);
				});
		} else {
			// Reset form state on close
			setOrderSearchQuery("");
			setSearchResults([]);
			setSelectedOrder(null);
			setRecipientName("");
			setRecipientPhone("");
			setRecipientEmail("");
			setAmount("");
			setReasonCategory("Attendee Ticket Cancellation");
			setCustomReason("Attendee Ticket Cancellation");
			setAdminNotes("");
			setDeductFromOrganizer(true);
			setSelectedOrgId(preselectedOrgId || "");
			setSelectedEventId(preselectedEventId || "");
			setSendSms(true);
			setSmsMessage(DEFAULT_SMS_TEMPLATE);
			setProcessPaystackRefund(false);
			setPaystackTransactionRef("");
		}
	}, [isOpen, preselectedOrgId, preselectedEventId]);

	// Flatten all events with their parent organization data
	const allEvents = useMemo(() => {
		if (!contextData) return [];
		const list: Array<{
			id: string;
			title: string;
			slug: string;
			orgId: string;
			orgName: string;
			walletBalance: number;
		}> = [];

		for (const org of contextData.organizations) {
			const bal = org.wallet?.balance || 0;
			for (const ev of org.events) {
				list.push({
					id: ev.id,
					title: ev.title,
					slug: ev.slug,
					orgId: org.id,
					orgName: org.name,
					walletBalance: bal,
				});
			}
		}
		return list;
	}, [contextData]);

	// Filtered events if an organization is selected
	const availableEvents = useMemo(() => {
		if (!selectedOrgId) return allEvents;
		return allEvents.filter((ev) => ev.orgId === selectedOrgId);
	}, [allEvents, selectedOrgId]);

	// Selected event object & organizer wallet
	const currentEvent = useMemo(() => {
		return allEvents.find((e) => e.id === selectedEventId) || null;
	}, [allEvents, selectedEventId]);

	const currentOrg = useMemo(() => {
		if (!contextData) return null;
		const orgId = currentEvent?.orgId || selectedOrgId;
		return contextData.organizations.find((o) => o.id === orgId) || null;
	}, [contextData, currentEvent, selectedOrgId]);

	const organizerBalance = currentOrg?.wallet?.balance ?? 0;
	const parsedAmount = parseFloat(amount) || 0;

	// Fairness refund calculations:
	// If linked to an order, max allowable refund is full order total (organizer share + platform fee).
	const isExceedingOrderTotal = Boolean(
		selectedOrder && parsedAmount > selectedOrder.totalAmount + 0.009,
	);

	// Target organizer liability:
	// If linked to an order, organizer is only liable up to their share (subtotal).
	// If not linked to an order, target is the full parsedAmount.
	const targetOrgShare = selectedOrder
		? Math.min(parsedAmount, selectedOrder.subtotal)
		: parsedAmount;

	// Actual organizer deduction cannot exceed what's currently available in their wallet:
	const actualOrgDeduction = deductFromOrganizer
		? Math.min(targetOrgShare, Math.max(0, organizerBalance))
		: 0;

	// Platform absorbed portion (platform fee portion + any balance deficit if organizer left):
	const platformAbsorbed = deductFromOrganizer
		? Math.max(0, Math.round((parsedAmount - actualOrgDeduction) * 100) / 100)
		: parsedAmount;

	const isFairnessRefund = deductFromOrganizer && parsedAmount > 0 && platformAbsorbed > 0;

	// Handle Order Quick-search
	const handleSearchOrders = () => {
		const q = orderSearchQuery.trim();
		if (!q || q.length < 2) {
			toast.info("Please enter at least 2 characters to search orders.");
			return;
		}

		startOrderSearch(async () => {
			try {
				const results = await searchOrdersForRefund(q);
				setSearchResults(results);
				if (results.length === 0) {
					toast.info("No matching orders found.");
				}
			} catch (err: any) {
				toast.error(err?.message || "Failed to search orders.");
			}
		});
	};

	// Auto-fill from an order selection
	const handleSelectOrder = (order: AdminRefundOrderSearchResult) => {
		setSelectedOrder(order);
		setRecipientName(order.buyerName || "Customer");
		setRecipientPhone(order.buyerPhone || "");
		setRecipientEmail(order.buyerEmail || "");
		setAmount(order.totalAmount.toFixed(2));
		setSelectedOrgId(order.event.organization.id);
		setSelectedEventId(order.event.id);
		setDeductFromOrganizer(true);
		setCustomReason(`Order #${order.orderNumber} refund (${order.ticketCount} tickets)`);
		setSearchResults([]);

		if (order.canRefundViaPaystack) {
			setProcessPaystackRefund(true);
			setPaystackTransactionRef(
				order.payment?.providerReference || order.payment?.reference || "",
			);
			toast.success(`Loaded Order #${order.orderNumber} (⚡ Paystack Payment Linked)`);
		} else {
			setProcessPaystackRefund(false);
			setPaystackTransactionRef("");
			toast.success(`Loaded details for Order #${order.orderNumber}`);
		}
	};

	// Insert variable tag into SMS
	const handleInsertVariable = (tag: string) => {
		const el = smsTextareaRef.current;
		if (el) {
			const start = el.selectionStart || 0;
			const end = el.selectionEnd || 0;
			const next = smsMessage.slice(0, start) + tag + smsMessage.slice(end);
			setSmsMessage(next);
			setTimeout(() => {
				el.focus();
				el.setSelectionRange(start + tag.length, start + tag.length);
			}, 50);
		} else {
			setSmsMessage((prev) => prev + " " + tag);
		}
	};

	// Evaluated SMS preview
	const evaluatedSmsPreview = useMemo(() => {
		const name = recipientName.trim() || "Customer";
		const amt = parsedAmount > 0 ? parsedAmount.toFixed(2) : "0.00";
		const ev = currentEvent?.title || "your event";
		const ref = "TXN-REF-PREVIEW";
		const reason = customReason || "Administrative Refund";

		return smsMessage
			.replace(/\{\{name\}\}/gi, name)
			.replace(/\{\{amount\}\}/gi, amt)
			.replace(/\{\{currency\}\}/gi, "GH₵")
			.replace(/\{\{event\}\}/gi, ev)
			.replace(/\{\{reference\}\}/gi, ref)
			.replace(/\{\{reason\}\}/gi, reason);
	}, [smsMessage, recipientName, parsedAmount, currentEvent, customReason]);

	const smsCharCount = evaluatedSmsPreview.length;
	const smsSegmentCount = smsCharCount <= 160 ? 1 : Math.ceil(smsCharCount / 153);

	// Handle Submit
	const handleSubmitRefund = (e: React.FormEvent) => {
		e.preventDefault();

		if (!recipientPhone.trim() || recipientPhone.trim().length < 8) {
			toast.error("Please enter a valid recipient phone number.");
			return;
		}

		if (parsedAmount <= 0) {
			toast.error("Please enter a refund amount greater than GH₵0.00.");
			return;
		}

		if (deductFromOrganizer && !selectedEventId && !selectedOrgId) {
			toast.error("Please select an event or organization to deduct this refund from.");
			return;
		}

		if (isExceedingOrderTotal && selectedOrder) {
			toast.error(
				`Cannot refund GH₵${parsedAmount.toFixed(2)}. Amount exceeds order total of GH₵${selectedOrder.totalAmount.toFixed(2)} (Organizer share GH₵${selectedOrder.subtotal.toFixed(2)} + Platform fee GH₵${selectedOrder.fees.toFixed(2)}).`,
			);
			return;
		}

		if (
			processPaystackRefund &&
			!paystackTransactionRef.trim() &&
			!selectedOrder?.payment
		) {
			toast.error(
				"Please provide a Paystack transaction reference for automated gateway refund.",
			);
			return;
		}

		startSubmittingTransition(async () => {
			const res = await adminProcessUserRefund({
				recipientName: recipientName.trim() || "Customer",
				recipientPhone: recipientPhone.trim(),
				recipientEmail: recipientEmail.trim() || undefined,
				amount: parsedAmount,
				reason: customReason.trim() || reasonCategory,
				adminNotes: adminNotes.trim() || undefined,
				deductFromOrganizer,
				organizationId: currentEvent?.orgId || selectedOrgId || undefined,
				eventId: selectedEventId || undefined,
				ticketOrderId: selectedOrder?.id || undefined,
				sendSms,
				customSmsMessage: sendSms ? smsMessage : undefined,
				processPaystackRefund,
				paystackTransactionRef: paystackTransactionRef.trim() || undefined,
			});

			if (res.success) {
				toast.success(res.message || "Refund processed successfully!");
				if (onSuccess && res.reference) {
					onSuccess({
						reference: res.reference,
						amount: parsedAmount,
						recipientName: recipientName.trim() || "Customer",
						smsSent: res.smsSent,
					});
				}
				onClose();
			} else {
				toast.error(res.error || "Failed to process refund.");
			}
		});
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto border border-border p-5 sm:p-6 rounded-xl bg-background shadow-xl">
				<DialogHeader className="pb-3 border-b border-border/70 space-y-1">
					<div className="flex items-center gap-2">
						<div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
							<RotateCcw className="size-4" />
						</div>
						<div>
							<DialogTitle className="text-base font-bold text-foreground">
								Issue User / Attendee Refund
							</DialogTitle>
							<DialogDescription className="text-xs text-muted-foreground">
								Process a direct refund to a customer. Optionally deduct from the organizer&apos;s
								event wallet, and dispatch an SMS notification.
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<form onSubmit={handleSubmitRefund} className="space-y-5 pt-3">
					{/* ── 1. OPTIONAL QUICK ORDER LOOKUP ──────────────────────────────── */}
					<div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-2.5">
						<div className="flex items-center justify-between">
							<Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
								<Search className="size-3.5 text-primary" />
								Quick Order Lookup (Optional Auto-Fill)
							</Label>
							{selectedOrder && (
								<button
									type="button"
									onClick={() => setSelectedOrder(null)}
									className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
								>
									<X className="size-3" /> Clear linked order
								</button>
							)}
						</div>

						{selectedOrder ? (
							<div className="p-2.5 rounded-lg border border-primary/30 bg-primary/5 flex items-center justify-between text-xs">
								<div className="flex items-center gap-2 min-w-0">
									<Ticket className="size-4 text-primary shrink-0" />
									<div className="min-w-0">
										<div className="flex items-center gap-1.5 flex-wrap">
											<p className="font-bold text-foreground truncate">
												Order #{selectedOrder.orderNumber} • {selectedOrder.event.title}
											</p>
											{selectedOrder.canRefundViaPaystack && (
												<Badge
													variant="outline"
													className="text-[9px] px-1.5 py-0 h-4 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold flex items-center gap-0.5"
												>
													<Zap className="size-2.5" /> Paystack Paid
												</Badge>
											)}
										</div>
										<p className="text-[11px] text-muted-foreground">
											Buyer: {selectedOrder.buyerName} ({selectedOrder.buyerPhone}) • Total:{" "}
											<span className="font-semibold text-foreground font-mono">
												GH₵{selectedOrder.totalAmount.toFixed(2)}
											</span>
											<span className="text-[10px] text-muted-foreground ml-1">
												(Org Share: GH₵{selectedOrder.subtotal.toFixed(2)} + Platform Fee: GH₵{selectedOrder.fees.toFixed(2)})
											</span>
										</p>
									</div>
								</div>
								<Badge
									variant="outline"
									className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shrink-0"
								>
									Linked
								</Badge>
							</div>
						) : (
							<div className="flex gap-2">
								<Input
									placeholder="Search by Order #, phone number, or buyer name..."
									value={orderSearchQuery}
									onChange={(e) => setOrderSearchQuery(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											handleSearchOrders();
										}
									}}
									className="h-8 text-xs bg-background border-border/80"
								/>
								<Button
									type="button"
									variant="secondary"
									size="sm"
									onClick={handleSearchOrders}
									disabled={isSearchingOrders}
									className="h-8 text-xs shrink-0 cursor-pointer"
								>
									{isSearchingOrders ? (
										<Loader2 className="size-3.5 animate-spin" />
									) : (
										"Find Order"
									)}
								</Button>
							</div>
						)}

						{/* Search results dropdown */}
						{searchResults.length > 0 && !selectedOrder && (
							<div className="border border-border/80 rounded-lg bg-card divide-y divide-border/60 max-h-48 overflow-y-auto">
								{searchResults.map((res) => (
									<button
										key={res.id}
										type="button"
										onClick={() => handleSelectOrder(res)}
										className="w-full p-2.5 text-left hover:bg-muted/50 transition-colors flex items-center justify-between gap-3 text-xs cursor-pointer"
									>
										<div className="min-w-0">
											<div className="flex items-center gap-1.5 flex-wrap">
												<p className="font-bold text-foreground truncate">
													#{res.orderNumber} — {res.buyerName || "Guest"} ({res.buyerPhone})
												</p>
												{res.canRefundViaPaystack && (
													<Badge
														variant="outline"
														className="text-[9px] px-1 py-0 h-3.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium"
													>
														Paystack
													</Badge>
												)}
											</div>
											<p className="text-[11px] text-muted-foreground truncate">
												{res.event.title} • {res.event.organization.name}
											</p>
										</div>
										<div className="text-right shrink-0">
											<p className="font-mono font-bold text-foreground">
												GH₵{res.totalAmount.toFixed(2)}
											</p>
											<span className="text-[10px] text-primary font-medium flex items-center gap-0.5">
												Select <ArrowRight className="size-2.5" />
											</span>
										</div>
									</button>
								))}
							</div>
						)}
					</div>

					{/* ── 2. RECIPIENT INFORMATION ─────────────────────────────────── */}
					<div className="space-y-3">
						<h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
							<User className="size-3.5 text-primary" />
							Recipient Details
						</h4>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div className="space-y-1">
								<Label htmlFor="refund-name" className="text-xs font-semibold">
									Recipient Name *
								</Label>
								<Input
									id="refund-name"
									placeholder="e.g. Kwame Mensah"
									value={recipientName}
									onChange={(e) => setRecipientName(e.target.value)}
									required
									className="h-9 text-xs bg-background border-border/80"
								/>
							</div>

							<div className="space-y-1">
								<Label htmlFor="refund-phone" className="text-xs font-semibold">
									Recipient Phone Number *
								</Label>
								<Input
									id="refund-phone"
									placeholder="e.g. 0241234567 or +233241234567"
									value={recipientPhone}
									onChange={(e) => setRecipientPhone(e.target.value)}
									required
									className="h-9 text-xs bg-background border-border/80 font-mono"
								/>
							</div>
						</div>

						<div className="space-y-1">
							<Label htmlFor="refund-email" className="text-xs font-semibold text-muted-foreground">
								Recipient Email (Optional)
							</Label>
							<Input
								id="refund-email"
								type="email"
								placeholder="e.g. attendee@example.com"
								value={recipientEmail}
								onChange={(e) => setRecipientEmail(e.target.value)}
								className="h-9 text-xs bg-background border-border/80"
							/>
						</div>
					</div>

					{/* ── 3. DEDUCT FROM ORGANIZER BALANCE TOGGLE & EVENT SELECTOR ──── */}
					<div className="p-4 rounded-xl border border-border/70 bg-card space-y-3.5">
						<div className="flex items-center justify-between gap-3">
							<div className="space-y-0.5">
								<Label className="text-xs font-bold text-foreground">
									Deduct from Organizer&apos;s Wallet Balance
								</Label>
								<p className="text-[11px] text-muted-foreground leading-relaxed">
									When enabled, the refund is debited as an outflow from the event organizer&apos;s
									balance. When disabled, the platform covers it without reducing organizer funds.
								</p>
							</div>
							<Switch
								checked={deductFromOrganizer}
								onCheckedChange={setDeductFromOrganizer}
								className="cursor-pointer shrink-0"
							/>
						</div>

						{deductFromOrganizer ? (
							<div className="space-y-3 pt-2 border-t border-border/60">
								<div className="space-y-1.5">
									<Label className="text-xs font-semibold text-foreground flex items-center justify-between">
										<span>Select Associated Event & Organizer *</span>
										{organizerBalance > 0 && (
											<span className="text-[11px] font-normal text-muted-foreground">
												Available Balance:{" "}
												<strong className="text-emerald-600 dark:text-emerald-400 font-mono">
													GH₵{organizerBalance.toFixed(2)}
												</strong>
											</span>
										)}
									</Label>

									<Select
										value={selectedEventId}
										onValueChange={(val) => {
											setSelectedEventId(val);
											const ev = allEvents.find((e) => e.id === val);
											if (ev) {
												setSelectedOrgId(ev.orgId);
											}
										}}
									>
										<SelectTrigger className="w-full text-xs h-9 bg-background border-border/80">
											<SelectValue placeholder="Choose an event to debit..." />
										</SelectTrigger>
										<SelectContent className="max-h-56">
											{availableEvents.map((ev) => (
												<SelectItem key={ev.id} value={ev.id} className="text-xs">
													{ev.title} — {ev.orgName} (GH₵{ev.walletBalance.toFixed(2)})
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								{/* Warning if refund amount exceeds total order amount */}
								{isExceedingOrderTotal && selectedOrder && (
									<div className="p-2.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-start gap-2">
										<AlertCircle className="size-4 shrink-0 mt-0.5" />
										<div className="text-[11px] leading-relaxed space-y-0.5">
											<p className="font-bold">Exceeds Maximum Order Total</p>
											<p>
												The refund amount (GH₵{parsedAmount.toFixed(2)}) cannot exceed the
												order total of <strong>GH₵{selectedOrder.totalAmount.toFixed(2)}</strong>{" "}
												(Organizer share: GH₵{selectedOrder.subtotal.toFixed(2)} + Platform fee: GH₵
												{selectedOrder.fees.toFixed(2)}).
											</p>
										</div>
									</div>
								)}

								{/* Fairness Refund Settlement breakdown */}
								{!isExceedingOrderTotal && isFairnessRefund && (
									<div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs space-y-2">
										<div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold text-[11px]">
											<ShieldCheck className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
											<span>Fairness Refund Policy Active</span>
											<Badge
												variant="outline"
												className="text-[9px] px-1 py-0 h-4 border-amber-500/30 text-amber-700 dark:text-amber-400"
											>
												Split Settlement
											</Badge>
										</div>
										<p className="text-[11px] text-muted-foreground leading-relaxed">
											For organizer departure or fairness settlement, the customer receives the full
											refund while the platform absorbs its fee or balance deficit:
										</p>
										<div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
											<div className="p-2 rounded-lg bg-background/80 border border-border/60">
												<span className="text-[10px] text-muted-foreground block font-sans">
													Organizer Debited:
												</span>
												<strong className="text-foreground">
													GH₵{actualOrgDeduction.toFixed(2)}
												</strong>
												{organizerBalance < targetOrgShare && (
													<span className="text-[9px] text-amber-600 dark:text-amber-400 block font-sans">
														(capped at balance)
													</span>
												)}
											</div>
											<div className="p-2 rounded-lg bg-background/80 border border-border/60">
												<span className="text-[10px] text-muted-foreground block font-sans">
													Platform Absorbed:
												</span>
												<strong className="text-emerald-600 dark:text-emerald-400">
													GH₵{platformAbsorbed.toFixed(2)}
												</strong>
												<span className="text-[9px] text-muted-foreground block font-sans">
													(fee &amp; platform subsidy)
												</span>
											</div>
										</div>
									</div>
								)}

								{currentEvent && !isExceedingOrderTotal && !isFairnessRefund && parsedAmount > 0 && (
									<p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
										<Info className="size-3.5 text-primary shrink-0" />
										This refund will reflect as an outflow on{" "}
										<strong className="text-foreground">{currentEvent.orgName}</strong>&apos;s
										wallet ledger tagged to{" "}
										<strong className="text-foreground">{currentEvent.title}</strong>.
									</p>
								)}
							</div>
						) : (
							<div className="p-2.5 rounded-lg border border-primary/20 bg-primary/5 text-xs text-muted-foreground flex items-center justify-between">
								<span className="flex items-center gap-1.5 text-foreground font-medium text-[11px]">
									<Sparkles className="size-3.5 text-primary" />
									Platform-Funded Adjustment
								</span>
								<Badge
									variant="outline"
									className="text-[10px] bg-background border-border text-muted-foreground"
								>
									Organizer balance unaffected
								</Badge>
							</div>
						)}
					</div>

					{/* ── 4. REFUND AMOUNT & PRESETS ─────────────────────────────────── */}
					<div className="space-y-2.5">
						<div className="flex items-center justify-between">
							<Label htmlFor="refund-amount" className="text-xs font-semibold">
								Refund Amount (GH₵) *
							</Label>
							{selectedOrder && (
								<button
									type="button"
									onClick={() => setAmount(selectedOrder.totalAmount.toFixed(2))}
									className="text-[11px] text-primary font-medium hover:underline cursor-pointer"
								>
									Reset to Full Order Total (GH₵{selectedOrder.totalAmount.toFixed(2)})
								</button>
							)}
						</div>

						<div className="relative">
							<span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground font-mono">
								GH₵
							</span>
							<Input
								id="refund-amount"
								type="number"
								step="0.01"
								min="0.01"
								placeholder="0.00"
								value={amount}
								onChange={(e) => setAmount(e.target.value)}
								required
								className="h-10 pl-11 text-sm font-bold font-mono bg-background border-border/80"
							/>
						</div>

						{/* Quick chips */}
						<div className="flex flex-wrap items-center gap-1.5 pt-0.5">
							<span className="text-[11px] text-muted-foreground mr-1">Presets:</span>
							{[20, 50, 100, 200, 500].map((preset) => (
								<Button
									key={preset}
									type="button"
									variant="outline"
									size="sm"
									onClick={() => setAmount(preset.toFixed(2))}
									className="h-6 px-2 text-[11px] font-mono rounded-md border-border/70 hover:bg-muted cursor-pointer"
								>
									+GH₵{preset}
								</Button>
							))}
							{amount && (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => setAmount("")}
									className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
								>
									Clear
								</Button>
							)}
						</div>
					</div>

					{/* ── 5. PAYSTACK GATEWAY DISBURSEMENT ─────────────────────────── */}
					<div className="p-4 rounded-xl border border-border/70 bg-card space-y-3.5">
						<div className="flex items-center justify-between gap-3">
							<div className="space-y-0.5">
								<div className="flex items-center gap-2">
									<CreditCard className="size-4 text-emerald-500" />
									<Label className="text-xs font-bold text-foreground">
										Process Gateway Refund via Paystack
									</Label>
									<Badge
										variant="outline"
										className={cn(
											"text-[10px] h-4 px-1.5 font-medium",
											processPaystackRefund
												? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
												: "bg-muted text-muted-foreground border-border",
										)}
									>
										{processPaystackRefund ? "Automated MoMo/Card Reversal" : "In-App Wallet Credit"}
									</Badge>
								</div>
								<p className="text-[11px] text-muted-foreground leading-relaxed">
									When enabled, funds are sent directly back to the customer&apos;s Mobile Money (MTN, Telecel, AT)
									or Bank Card via Paystack API (just like event security deposit refunds).
								</p>
							</div>
							<Switch
								checked={processPaystackRefund}
								onCheckedChange={setProcessPaystackRefund}
								className="cursor-pointer shrink-0"
							/>
						</div>

						{processPaystackRefund ? (
							<div className="space-y-2.5 pt-2 border-t border-border/60">
								{selectedOrder?.payment ? (
									<div className="p-2.5 rounded-lg border border-emerald-500/25 bg-emerald-500/5 text-xs space-y-1">
										<div className="flex items-center justify-between">
											<span className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
												<ShieldCheck className="size-3.5" />
												Verified Paystack Transaction Found
											</span>
											<span className="font-mono text-[10px] text-muted-foreground">
												{selectedOrder.payment.currency} {selectedOrder.payment.amount.toFixed(2)}
											</span>
										</div>
										<p className="text-[11px] text-muted-foreground font-mono truncate">
											Ref: {selectedOrder.payment.providerReference || selectedOrder.payment.reference}
										</p>
									</div>
								) : (
									<div className="space-y-1">
										<Label
											htmlFor="paystack-ref"
											className="text-xs font-semibold text-foreground flex items-center justify-between"
										>
											<span>Paystack Transaction Reference / ID *</span>
											<span className="text-[10px] font-normal text-muted-foreground">
												From Paystack Dashboard
											</span>
										</Label>
										<Input
											id="paystack-ref"
											placeholder="e.g. T123456789 or ref_abc123"
											value={paystackTransactionRef}
											onChange={(e) => setPaystackTransactionRef(e.target.value)}
											className="h-8 text-xs font-mono bg-background border-border/80"
										/>
									</div>
								)}

								<div className="p-2 rounded-lg bg-muted/40 border border-border/60 text-[11px] text-muted-foreground flex items-center gap-1.5">
									<Info className="size-3.5 text-primary shrink-0" />
									<span>
										Customer receives money back into their original payment source (MoMo/Card).
										Their in-app platform balance will not be duplicate-credited.
									</span>
								</div>
							</div>
						) : (
							<div className="p-2.5 rounded-lg border border-border/60 bg-muted/30 text-xs text-muted-foreground flex items-center justify-between">
								<span className="text-[11px]">
									Customer will receive an internal wallet credit on Fextiva if they hold a profile.
								</span>
								<Badge variant="outline" className="text-[10px]">
									Manual / Wallet
								</Badge>
							</div>
						)}
					</div>

					{/* ── 6. REASON & ADMIN NOTES ───────────────────────────────────── */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold">Refund Category *</Label>
							<Select
								value={reasonCategory}
								onValueChange={(val) => {
									setReasonCategory(val);
									if (val !== "Custom Reason") {
										setCustomReason(val);
									}
								}}
							>
								<SelectTrigger className="h-9 text-xs bg-background border-border/80">
									<SelectValue placeholder="Select reason" />
								</SelectTrigger>
								<SelectContent>
									{REASON_PRESETS.map((p) => (
										<SelectItem key={p} value={p} className="text-xs">
											{p}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="custom-reason" className="text-xs font-semibold">
								Specific Reason (Shown on statement/SMS) *
							</Label>
							<Input
								id="custom-reason"
								placeholder="e.g. Ticket cancellation, Gate denied..."
								value={customReason}
								onChange={(e) => setCustomReason(e.target.value)}
								required
								className="h-9 text-xs bg-background border-border/80"
							/>
						</div>
					</div>

					<div className="space-y-1">
						<Label htmlFor="admin-notes" className="text-xs font-semibold text-muted-foreground">
							Internal Admin Notes (Super Admin audit only)
						</Label>
						<Input
							id="admin-notes"
							placeholder="e.g. Authorized by Super Admin per customer dispute ticket #441"
							value={adminNotes}
							onChange={(e) => setAdminNotes(e.target.value)}
							className="h-9 text-xs bg-background border-border/80"
						/>
					</div>

					{/* ── 7. SMS NOTIFICATION CONFIGURATION & LIVE PREVIEW ──────────── */}
					<div className="p-4 rounded-xl border border-border/70 bg-card/60 space-y-3.5">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Smartphone className="size-4 text-primary" />
								<Label className="text-xs font-bold text-foreground">
									Send SMS Notification to Recipient
								</Label>
							</div>
							<Switch
								checked={sendSms}
								onCheckedChange={setSendSms}
								className="cursor-pointer shrink-0"
							/>
						</div>

						{sendSms && (
							<div className="space-y-3 pt-2 border-t border-border/60">
								{/* Variable Tag Inserters */}
								<div className="flex flex-wrap items-center gap-1.5">
									<span className="text-[11px] text-muted-foreground mr-1 flex items-center gap-1">
										<Tag className="size-3 text-primary" /> Insert Tags:
									</span>
									{["{{name}}", "{{amount}}", "{{event}}", "{{reference}}", "{{reason}}"].map(
										(tag) => (
											<button
												key={tag}
												type="button"
												onClick={() => handleInsertVariable(tag)}
												className="px-2 py-0.5 rounded text-[10px] font-mono bg-muted/80 hover:bg-muted text-foreground border border-border/70 transition-colors cursor-pointer"
											>
												{tag}
											</button>
										),
									)}
								</div>

								{/* SMS Textarea */}
								<div className="space-y-1">
									<Textarea
										ref={smsTextareaRef}
										rows={2}
										value={smsMessage}
										onChange={(e) => setSmsMessage(e.target.value)}
										className="text-xs bg-background font-mono leading-relaxed border-border/80 resize-none"
										placeholder="Compose SMS message..."
									/>
									<div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
										<span>
											{smsCharCount} / 160 characters ({smsSegmentCount} SMS segment
											{smsSegmentCount > 1 ? "s" : ""})
										</span>
										<button
											type="button"
											onClick={() => setSmsMessage(DEFAULT_SMS_TEMPLATE)}
											className="text-primary hover:underline cursor-pointer"
										>
											Reset template
										</button>
									</div>
								</div>

								{/* Live SMS Speech Bubble Preview */}
								<div className="p-3 rounded-lg bg-muted/40 border border-border/70 space-y-1.5">
									<div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
										<span>Live SMS Preview</span>
										<Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-primary/30 text-primary">
											Arkesel GSM-7
										</Badge>
									</div>
									<div className="p-2.5 rounded-lg bg-background border border-border text-xs text-foreground font-mono leading-relaxed shadow-sm">
										{evaluatedSmsPreview}
									</div>
								</div>
							</div>
						)}
					</div>

					{/* ── 8. DIALOG FOOTER & ACTIONS ───────────────────────────────── */}
					<DialogFooter className="pt-2 gap-2 sm:gap-0">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={onClose}
							disabled={isSubmitting}
							className="text-xs cursor-pointer"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							size="sm"
							disabled={
								isSubmitting ||
								parsedAmount <= 0 ||
								Boolean(isExceedingOrderTotal) ||
								(deductFromOrganizer && !selectedEventId && !selectedOrgId) ||
								(processPaystackRefund && !paystackTransactionRef.trim() && !selectedOrder?.payment)
							}
							className="text-xs font-semibold gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
						>
							{isSubmitting ? (
								<>
									<Loader2 className="size-3.5 animate-spin" />
									Processing {processPaystackRefund ? "Paystack " : ""}Refund...
								</>
							) : (
								<>
									<RotateCcw className="size-3.5" />
									Issue GH₵{parsedAmount > 0 ? parsedAmount.toFixed(2) : "0.00"}{" "}
									{processPaystackRefund ? "via Paystack" : "Refund"}
								</>
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

