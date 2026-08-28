"use client";
// src/components/event/ticket-manager/TicketList.tsx

import {
	Calendar,
	Pencil,
	Plus,
	Tag,
	Trash2,
	Users,
} from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { NoTicketIllustration } from "@/components/common/NoTicketIllustration";
import { AnimatedDeleteDialog } from "@/components/common/AnimatedDeleteDialog";
import { TicketRenderer } from "@/components/shared/ticket-variants/TicketRenderer";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { deleteTicketType } from "@/lib/server-functions/ticket";
import { cn, formatAmount, getErrorMessage } from "@/lib/utils";
import { type TicketTypeItem, TicketTypeSheet } from "./TicketTypeSheet";
import { Card } from "@/components/ui/card";

interface TicketListProps {
	readonly eventId: string;
	readonly organizationId: string;
	readonly organization?: {
		name?: string;
		logoUrl?: string | null;
		primaryColor?: string | null;
		secondaryColor?: string | null;
	};
	readonly eventTitle: string;
	readonly flierImage?: string | null;
	readonly ticketTypes: TicketTypeItem[];
	readonly onRefresh?: () => void;
	readonly canEdit?: boolean;
	readonly isSheetOpen?: boolean;
	readonly onSheetOpenChange?: (open: boolean) => void;
}

interface TicketStatProps {
	label: string;
	icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	value: React.ReactNode;
	className?: string;
}

function TicketStat({ label, icon: Icon, value, className }: TicketStatProps) {
	return (
		<div className="rounded-md border p-3">
			<p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
				{label}
			</p>
			<div
				className={cn(
					"flex items-center gap-1.5 text-xs text-muted-foreground",
					className,
				)}
			>
				{Icon && <Icon className="size-3.5 text-primary" />}
				{value}
			</div>
		</div>
	);
}

export function TicketList({
	eventId,
	organizationId,
	organization,
	eventTitle,
	flierImage,
	ticketTypes,
	onRefresh,
	canEdit = true,
	isSheetOpen,
	onSheetOpenChange,
}: TicketListProps) {
	const [editingTicket, setEditingTicket] = useState<TicketTypeItem | null>(
		null,
	);
	const [ticketToDelete, setTicketToDelete] = useState<TicketTypeItem | null>(
		null,
	);
	const [isDeleting, startTransition] = useTransition();

	const primaryColor = organization?.primaryColor || "#009A44";
	const secondaryColor = organization?.secondaryColor || "#CE1126";
	const organizationName = organization?.name || "AfroReality";

	function handleEdit(ticket: TicketTypeItem) {
		setEditingTicket(ticket);
		onSheetOpenChange?.(true);
	}

	function handleDelete() {
		if (!ticketToDelete) return;

		startTransition(async () => {
			try {
				await deleteTicketType({
					data: { id: ticketToDelete.id, organizationId },
				});
				toast.success("Ticket tier removed");
				setTicketToDelete(null);
				if (onRefresh) onRefresh();
			} catch (err) {
				toast.error(getErrorMessage(err));
			}
		});
	}

	return (
		<div className="space-y-4">
			{ticketTypes.length === 0 ? (
				<Card className="flex flex-col items-center justify-center py-16 text-center">
					<NoTicketIllustration className="size-48 mb-6 opacity-80" />
					<h4 className="text-xl font-bold uppercase tracking-tight mb-2">
						No Ticket Tiers Created
					</h4>
					<p className="text-muted-foreground text-sm max-w-xs text-center mb-6">
						You haven't set up any ticket tiers for this event yet. Create your
						first tier to start selling tickets.
					</p>
					{canEdit && (
						<Button
							size="sm"
							onClick={() => {
								setEditingTicket(null);
								onSheetOpenChange?.(true);
							}}
						>
							<Plus className="size-4 mr-2" />
							Add Ticket Tier
						</Button>
					)}
				</Card>
			) : (
				<div className="grid gap-4">
					{ticketTypes.map((ticket) => (
						<div
							key={ticket.id}
							className="group rounded-md border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-xs"
						>
							<div className="grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)] lg:items-center">
								<div className="mx-auto lg:mx-0 w-full">
									<TicketRenderer
										variant={ticket.designVariant}
										className="max-w-lg"
										primaryColor={
											ticket.primaryColor || ticket.color || primaryColor
										}
										secondaryColor={ticket.secondaryColor || secondaryColor}
										logoUrl={organization?.logoUrl}
										flierImage={flierImage}
										organizationName={organizationName}
										eventName={eventTitle}
										ticketType={ticket.name}
										dateTime={
											ticket.salesStart
												? new Date(ticket.salesStart).toLocaleString("en-GH", {
														dateStyle: "medium",
														timeStyle: "short",
													})
												: "Date to be announced"
										}
										venue={undefined}
										ticketCode={`TIER-${ticket.orderIdx !== undefined && ticket.orderIdx !== null ? ticket.orderIdx + 1 : 1}`}
										stacked={false}
									/>
								</div>

								<div className="space-y-4">
									<div className="flex flex-wrap items-center gap-2">
										<h4 className="text-lg font-bold">{ticket.name}</h4>
										<Badge
											variant={
												ticket.status === "available" ? "default" : "secondary"
											}
											className={cn(
												"text-[10px] uppercase font-bold tracking-wider",
												ticket.status === "available" && "hover:opacity-90",
											)}
											style={
												ticket.status === "available"
													? {
															backgroundColor:
																ticket.primaryColor ||
																ticket.color ||
																primaryColor,
															color: "white",
														}
													: undefined
											}
										>
											{(ticket.status || "available").replace("_", " ")}
										</Badge>
									</div>

									{ticket.description && (
										<RichTextDisplay
											content={ticket.description}
											className="text-sm text-muted-foreground line-clamp-2"
										/>
									)}

									<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
										<TicketStat
											label="Price"
											icon={Tag}
											value={
												<span className="font-semibold text-foreground">
													{ticket.price === 0
														? "FREE"
														: formatAmount(
																ticket.price,
																ticket.currency || "GHS",
															)}
												</span>
											}
										/>

										<TicketStat
											label="Inventory"
											icon={Users}
											value={
												ticket.quantityTotal
													? `${ticket.quantitySold ?? 0} / ${ticket.quantityTotal} Sold`
													: `${ticket.quantitySold ?? 0} Sold`
											}
										/>

										<TicketStat
											label="Sales Window"
											icon={Calendar}
											value={
												ticket.salesEnd
													? `Ends ${new Date(ticket.salesEnd).toLocaleDateString()}`
													: "Evergreen"
											}
										/>

										<TicketStat
											label="Palette"
											className="gap-2"
											value={
												<>
													<span
														className="block h-5 w-5 rounded-full border"
														style={{
															backgroundColor:
																ticket.primaryColor ||
																ticket.color ||
																primaryColor,
														}}
													/>
													<span
														className="block h-5 w-5 rounded-full border"
														style={{
															backgroundColor:
																ticket.secondaryColor || secondaryColor,
														}}
													/>
												</>
											}
										/>
									</div>

									{canEdit && (
										<div className="flex items-center gap-2 pt-1">
											<Button
												size="sm"
												variant="outline"
												onClick={() => handleEdit(ticket)}
											>
												<Pencil className="mr-2 size-4" />
												Edit Ticket
											</Button>
											<AlertDialog>
												<AlertDialogTrigger asChild>
													<Button
														size="sm"
														variant="ghost"
														className="text-destructive hover:bg-destructive/10 hover:text-destructive"
													>
														<Trash2 className="mr-2 size-4" />
														Remove
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>
															Delete Ticket Tier?
														</AlertDialogTitle>
														<AlertDialogDescription>
															Are you sure you want to remove &quot;
															{ticket.name}&quot;?
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>Cancel</AlertDialogCancel>
														<AlertDialogAction
															onClick={() => {
																setTicketToDelete(ticket);
															}}
															className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
														>
															Delete
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										</div>
									)}
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			<TicketTypeSheet
				eventId={eventId}
				organizationId={organizationId}
				flierImage={flierImage}
				open={isSheetOpen ?? false}
				onOpenChange={onSheetOpenChange ?? (() => {})}
				editingTicket={editingTicket}
				onSaved={() => {
					onRefresh?.();
				}}
			/>

			<AnimatedDeleteDialog
				isOpen={!!ticketToDelete}
				isDeleting={isDeleting}
				onOpenChange={(open) => !open && !isDeleting && setTicketToDelete(null)}
				onConfirm={handleDelete}
				title="Delete Ticket Tier"
				itemName={ticketToDelete?.name ?? "this ticket tier"}
				itemType="Ticket Tier"
				description={`This will remove the "${ticketToDelete?.name}" ticket tier. This action cannot be undone.`}
			/>
		</div>
	);
}
