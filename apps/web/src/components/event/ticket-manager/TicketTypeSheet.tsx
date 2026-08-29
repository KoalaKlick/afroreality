"use client";
import { PRESET_COLORS } from "@/utils/theme/constants";
// src/components/event/ticket-manager/TicketTypeSheet.tsx

import {
	Calendar,
	Layout,
	ListFilter,
	Loader2,
	Palette,
	Ticket,
	Users,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { TicketRenderer } from "@/components/shared/ticket-variants/TicketRenderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetBody,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	createTicketType,
	updateTicketType,
} from "@/lib/server-functions/ticket";
import { getErrorMessage } from "@/lib/utils";
import {
	DEFAULT_TICKET_PRICE,
	MIN_TICKET_PRICE,
} from "@/lib/constants/pricing";

export interface TicketTypeItem {
	id: string;
	eventId: string;
	orderIdx?: number | null;
	name: string;
	description?: string | null;
	price: number;
	currency?: string;
	quantityTotal?: number | null;
	quantitySold?: number | null;
	salesStart?: string | Date | null;
	salesEnd?: string | Date | null;
	maxPerOrder: number;
	minPerOrder: number;
	status?: string;
	color?: string | null;
	primaryColor?: string | null;
	secondaryColor?: string | null;
	designVariant?: string | null;
}

interface TicketTypeSheetProps {
	readonly eventId: string;
	readonly organizationId: string;
	readonly flierImage?: string | null;
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly editingTicket: TicketTypeItem | null;
	readonly onSaved?: () => void;
}

export function TicketTypeSheet({
	eventId,
	organizationId,
	flierImage,
	open,
	onOpenChange,
	editingTicket,
	onSaved,
}: TicketTypeSheetProps) {
	const [isPending, startTransition] = useTransition();
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		price: DEFAULT_TICKET_PRICE,
		quantityTotal: "" as string | number,
		salesStart: "",
		salesEnd: "",
		maxPerOrder: 10,
		minPerOrder: 1,
		status: "available",
		primaryColor: "#009A44",
		secondaryColor: "#CE1126",
		designVariant: "classic",
	});

	useEffect(() => {
		if (editingTicket) {
			setFormData({
				name: editingTicket.name,
				description: editingTicket.description ?? "",
				price: editingTicket.price ?? DEFAULT_TICKET_PRICE,
				quantityTotal: editingTicket.quantityTotal ?? "",
				salesStart: editingTicket.salesStart
					? new Date(editingTicket.salesStart).toISOString().slice(0, 16)
					: "",
				salesEnd: editingTicket.salesEnd
					? new Date(editingTicket.salesEnd).toISOString().slice(0, 16)
					: "",
				maxPerOrder: editingTicket.maxPerOrder ?? 10,
				minPerOrder: editingTicket.minPerOrder ?? 1,
				status: editingTicket.status ?? "available",
				primaryColor:
					editingTicket.primaryColor || editingTicket.color || "#009A44",
				secondaryColor: editingTicket.secondaryColor || "#CE1126",
				designVariant: editingTicket.designVariant || "classic",
			});
		} else {
			setFormData({
				name: "",
				description: "",
				price: DEFAULT_TICKET_PRICE,
				quantityTotal: "",
				salesStart: "",
				salesEnd: "",
				maxPerOrder: 10,
				minPerOrder: 1,
				status: "available",
				primaryColor: "#009A44",
				secondaryColor: "#CE1126",
				designVariant: "classic",
			});
		}
	}, [editingTicket, open]);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!formData.name.trim()) {
			toast.error("Ticket name is required");
			return;
		}

		const priceNum = Number(formData.price);
		if (Number.isNaN(priceNum) || priceNum < 0) {
			toast.error("Ticket price cannot be negative");
			return;
		}

		const minOrder = Number(formData.minPerOrder);
		if (Number.isNaN(minOrder) || minOrder < 1) {
			toast.error("Minimum order quantity must be at least 1");
			return;
		}

		const maxOrder = Number(formData.maxPerOrder);
		if (Number.isNaN(maxOrder) || maxOrder < minOrder) {
			toast.error(
				"Maximum order quantity cannot be less than minimum order quantity",
			);
			return;
		}

		if (formData.quantityTotal !== "" && formData.quantityTotal !== null) {
			const totalQty = Number(formData.quantityTotal);
			if (Number.isNaN(totalQty) || totalQty < 1) {
				toast.error("Total ticket capacity must be at least 1");
				return;
			}
		}

		startTransition(async () => {
			try {
				if (editingTicket) {
					await updateTicketType({
						data: {
							id: editingTicket.id,
							organizationId,
							name: formData.name,
							description: formData.description || null,
							price: Number(formData.price) || 0,
							quantityTotal: formData.quantityTotal
								? Number(formData.quantityTotal)
								: null,
							salesStart: formData.salesStart || null,
							salesEnd: formData.salesEnd || null,
							maxPerOrder: Number(formData.maxPerOrder) || 10,
							minPerOrder: Number(formData.minPerOrder) || 1,
							status: formData.status as any,
							primaryColor: formData.primaryColor,
							secondaryColor: formData.secondaryColor,
							designVariant: formData.designVariant as any,
							color: formData.primaryColor,
						},
					});
					toast.success("Ticket tier updated successfully");
				} else {
					await createTicketType({
						data: {
							eventId,
							organizationId,
							name: formData.name,
							description: formData.description || undefined,
							price: Number(formData.price) || 0,
							currency: "GHS",
							quantityTotal: formData.quantityTotal
								? Number(formData.quantityTotal)
								: undefined,
							salesStart: formData.salesStart || undefined,
							salesEnd: formData.salesEnd || undefined,
							maxPerOrder: Number(formData.maxPerOrder) || 10,
							minPerOrder: Number(formData.minPerOrder) || 1,
							primaryColor: formData.primaryColor,
							secondaryColor: formData.secondaryColor,
							designVariant: formData.designVariant as any,
							color: formData.primaryColor,
						},
					});
					toast.success("Ticket tier created successfully");
				}

				onOpenChange(false);
				if (onSaved) onSaved();
			} catch (err) {
				toast.error(getErrorMessage(err));
			}
		});
	}

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-full sm:max-w-lg flex flex-col h-full overflow-y-auto">
				<SheetHeader>
					<SheetTitle>
						{editingTicket ? "Edit Ticket Tier" : "Create Ticket Tier"}
					</SheetTitle>
					<SheetDescription>
						Configure pricing, availability windows, order limits, and pass
						styling.
					</SheetDescription>
				</SheetHeader>

<SheetBody className="overflow-y-auto">
				<form
					onSubmit={handleSubmit}
					className="space-y-4 py-4 flex-1 flex flex-col"
				>
					<Tabs defaultValue="details" className="w-full flex-1">
						<TabsList variant="afro" className="grid w-full grid-cols-2 mb-4">
							<TabsTrigger variant="afro" value="details" className="gap-2">
								<Ticket className="size-4" />
								Details & Limits
							</TabsTrigger>
							<TabsTrigger variant="afro" value="design" className="gap-2">
								<Palette className="size-4" />
								Badge & Styling
							</TabsTrigger>
						</TabsList>

						{/* ── 1. Details Tab ── */}
						<TabsContent value="details" className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="ticket-name">Ticket Name *</Label>
								<Input
									id="ticket-name"
									value={formData.name}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, name: e.target.value }))
									}
									placeholder="e.g., VIP, Regular, Early Bird"
									required
								/>
							</div>

							<div className="space-y-2">
								<Label>Description (Optional)</Label>
								<RichTextEditor
									value={formData.description}
									onChange={(val) =>
										setFormData((prev) => ({
											...prev,
											description: val,
										}))
									}
									placeholder="What's included with this ticket pass?"
									minimal
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="ticket-price">Price (GHS) *</Label>
									<Input
										id="ticket-price"
										type="number"
										min={MIN_TICKET_PRICE}
										step="0.01"
										value={formData.price}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												price: parseFloat(e.target.value) || 0,
											}))
										}
										required
									/>
									<p className="text-[10px] text-muted-foreground">
										Set to 0 for a free ticket.
									</p>
								</div>

								<div className="space-y-2">
									<Label htmlFor="ticket-qty">Quantity Available</Label>
									<Input
										id="ticket-qty"
										type="number"
										min="1"
										value={formData.quantityTotal}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												quantityTotal: e.target.value,
											}))
										}
										placeholder="Unlimited"
									/>
									<p className="text-[10px] text-muted-foreground">
										Leave blank for unlimited.
									</p>
								</div>
							</div>

							{/* Order Limits */}
							<div className="space-y-2 pt-2">
								<div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
									<Users className="size-3.5" />
									Order Limits
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-1">
										<Label htmlFor="ticket-min">Min per order</Label>
										<Input
											id="ticket-min"
											type="number"
											min="1"
											max="100"
											value={formData.minPerOrder}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													minPerOrder: parseInt(e.target.value, 10) || 1,
												}))
											}
										/>
									</div>

									<div className="space-y-1">
										<Label htmlFor="ticket-max">Max per order</Label>
										<Input
											id="ticket-max"
											type="number"
											min="1"
											max="100"
											value={formData.maxPerOrder}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													maxPerOrder: parseInt(e.target.value, 10) || 10,
												}))
											}
										/>
									</div>
								</div>
							</div>

							{/* Sales Timeline */}
							<div className="space-y-2 pt-2">
								<div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
									<Calendar className="size-3.5" />
									Sales Window
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-1">
										<Label htmlFor="sales-start">Sales Start</Label>
										<Input
											id="sales-start"
											type="datetime-local"
											value={formData.salesStart}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													salesStart: e.target.value,
												}))
											}
										/>
									</div>

									<div className="space-y-1">
										<Label htmlFor="sales-end">Sales End</Label>
										<Input
											id="sales-end"
											type="datetime-local"
											value={formData.salesEnd}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													salesEnd: e.target.value,
												}))
											}
										/>
									</div>
								</div>
							</div>

							{/* Status selection */}
							{editingTicket && (
								<div className="space-y-2 pt-2">
									<div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
										<ListFilter className="size-3.5" />
										Tier Availability
									</div>
									<Select
										value={formData.status}
										onValueChange={(val) =>
											setFormData((prev) => ({ ...prev, status: val }))
										}
									>
										<SelectTrigger id="ticket-status">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="available">
												Available (Active Sales)
											</SelectItem>
											<SelectItem value="sold_out">Sold Out</SelectItem>
											<SelectItem value="hidden">
												Hidden (Internal Only)
											</SelectItem>
											<SelectItem value="expired">Expired (Closed)</SelectItem>
										</SelectContent>
									</Select>
								</div>
							)}
						</TabsContent>

						{/* ── 2. Design Tab ── */}
						<TabsContent value="design" className="space-y-5">
							{/* Live Ticket Pass Preview */}
							<div className="space-y-2">
								<Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
									Live Pass Preview
								</Label>
								<TicketRenderer
									variant={formData.designVariant}
									primaryColor={formData.primaryColor}
									secondaryColor={formData.secondaryColor}
									ticketType={formData.name || "VIP Pass"}
									eventName="Afrobeat Night 2026"
									flierImage={flierImage}
								/>
							</div>

							<div className="space-y-3">
								<Label className="flex items-center gap-2">
									<Layout className="size-4" />
									Pass Style Variant
								</Label>
								<Select
									value={formData.designVariant}
									onValueChange={(val) =>
										setFormData((prev) => ({ ...prev, designVariant: val }))
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="classic">Classic Ticket</SelectItem>
										<SelectItem value="modern">Modern Pass</SelectItem>
										<SelectItem value="geo">Geometric Style</SelectItem>
										<SelectItem value="retro">Retro Vintage</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-3">
								<Label>Primary Theme Color</Label>
								<div className="flex items-center gap-3">
									<input
										type="color"
										value={formData.primaryColor}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												primaryColor: e.target.value,
											}))
										}
										className="size-10 rounded-lg border cursor-pointer p-0.5 bg-background"
									/>
									<Input
										value={formData.primaryColor}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												primaryColor: e.target.value,
											}))
										}
										className="font-mono text-xs max-w-[140px]"
									/>
								</div>
								<div className="flex flex-wrap gap-2 pt-1">
									{PRESET_COLORS.map((col) => (
										<button
											key={col.value}
											type="button"
											title={col.name}
											onClick={() =>
												setFormData((prev) => ({ ...prev, primaryColor: col.value }))
											}
											className="size-6 rounded-full border-2 transition-transform hover:scale-110"
											style={{
												backgroundColor: col.value,
												borderColor:
													formData.primaryColor === col.value
														? "var(--foreground)"
														: "transparent",
											}}
										/>
									))}
								</div>
							</div>

							<div className="space-y-3">
								<Label>Secondary Accent Color</Label>
								<div className="flex items-center gap-3">
									<input
										type="color"
										value={formData.secondaryColor}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												secondaryColor: e.target.value,
											}))
										}
										className="size-10 rounded-lg border cursor-pointer p-0.5 bg-background"
									/>
									<Input
										value={formData.secondaryColor}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												secondaryColor: e.target.value,
											}))
										}
										className="font-mono text-xs max-w-[140px]"
									/>
								</div>
								<div className="flex flex-wrap gap-2 pt-1">
									{PRESET_COLORS.map((col) => (
										<button
											key={col.value}
											type="button"
											onClick={() =>
												setFormData((prev) => ({
													...prev,
													secondaryColor: col.value,
												}))
											}
											className="size-6 rounded-full border-2 transition-transform hover:scale-110"
											style={{
												backgroundColor: col.value,
												borderColor:
													formData.secondaryColor === col.value
														? "var(--foreground)"
														: "transparent",
											}}
										/>
									))}
								</div>
							</div>
						</TabsContent>
					</Tabs>

					<SheetFooter className="pt-6 border-t mt-auto">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isPending}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending ? (
								<>
									<Loader2 className="mr-2 size-4 animate-spin" />
									Saving...
								</>
							) : editingTicket ? (
								"Save Changes"
							) : (
								"Create Tier"
							)}
						</Button>
					</SheetFooter>
				</form>
				</SheetBody>
			</SheetContent>
		</Sheet>
	);
}


