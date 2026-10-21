"use client";

import { useState } from "react";
import { TicketRenderer } from "@/components/shared/ticket-variants/TicketRenderer";
import { TicketDownloadButton } from "./TicketDownloadButton";
import {
	ChevronLeft,
	ChevronRight,
	Copy,
	Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface TicketPassItem {
	id: string;
	ticketCode: string;
	attendeeName: string;
	attendeeEmail: string | null;
	ticketType: string;
	designVariant: string;
	primaryColor: string;
	secondaryColor: string;
	token: string;
	verifyUrl: string;
	directUrl: string;
	passIndex: number;
	totalPasses: number;
	checkInStatus?: string;
}

interface MultiTicketPassbookProps {
	passes: TicketPassItem[];
	initialSelectedTicketId: string;
	orderNumber?: string;
	event: {
		id: string;
		title: string;
		flierImage?: string | null;
		bannerImage?: string | null;
		startDate?: string | null;
		venue?: string;
	};
	organization: {
		name: string;
		logoUrl?: string | null;
	};
}

export function MultiTicketPassbook({
	passes,
	initialSelectedTicketId,
	orderNumber,
	event,
	organization,
}: MultiTicketPassbookProps) {
	const initialIndex = passes.findIndex(
		(p) => p.id === initialSelectedTicketId,
	);
	const [activeIdx, setActiveIdx] = useState(
		initialIndex >= 0 ? initialIndex : 0,
	);
	const [copied, setCopied] = useState(false);

	const activePass = passes[activeIdx] ?? passes[0];
	if (!activePass) return null;

	const isMultiPass = passes.length > 1;

	const handlePrev = () => {
		if (activeIdx > 0) setActiveIdx(activeIdx - 1);
	};

	const handleNext = () => {
		if (activeIdx < passes.length - 1) setActiveIdx(activeIdx + 1);
	};

	const handleCopyLink = async () => {
		try {
			await navigator.clipboard.writeText(activePass.directUrl);
			setCopied(true);
			toast.success("Pass link copied");
			setTimeout(() => setCopied(false), 2500);
		} catch {
			toast.error("Failed to copy link");
		}
	};

	return (
		<div className="w-full flex flex-col items-center gap-6 min-w-0">
			{isMultiPass && (
				<div className="w-full max-w-xl rounded-xl border border-border/70 bg-card p-3 print:hidden min-w-0 space-y-3">
					<div className="flex items-center justify-between gap-2 min-w-0">
						<div className="min-w-0">
							<p className="text-xs font-semibold text-foreground truncate">
								{orderNumber ? `Order #${orderNumber}` : "Your passes"}
							</p>
							<p className="text-[11px] text-muted-foreground">
								Pass {activeIdx + 1} of {passes.length}
							</p>
						</div>

						<div className="flex items-center gap-1 shrink-0">
							<Button
								variant="outline"
								size="icon"
								onClick={handlePrev}
								disabled={activeIdx === 0}
								className="size-8 rounded-lg border-border/70 shadow-none"
								aria-label="Previous pass"
							>
								<ChevronLeft className="size-4" />
							</Button>
							<Button
								variant="outline"
								size="icon"
								onClick={handleNext}
								disabled={activeIdx === passes.length - 1}
								className="size-8 rounded-lg border-border/70 shadow-none"
								aria-label="Next pass"
							>
								<ChevronRight className="size-4" />
							</Button>
						</div>
					</div>

					<div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
						{passes.map((pass, idx) => {
							const isSelected = idx === activeIdx;
							return (
								<button
									key={pass.id}
									type="button"
									onClick={() => setActiveIdx(idx)}
									className={cn(
										"px-2.5 py-1.5 rounded-lg text-[11px] font-medium shrink-0 transition-colors border cursor-pointer",
										isSelected
											? "bg-primary text-primary-foreground border-primary"
											: "bg-muted/40 text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted",
									)}
								>
									<span className="truncate max-w-24">{pass.attendeeName}</span>
								</button>
							);
						})}
					</div>
				</div>
			)}

			<div
				id="ticket-render-card"
				className="w-full max-w-2xl flex justify-center min-w-0 overflow-hidden"
			>
				<TicketRenderer
					key={activePass.id}
					variant={activePass.designVariant}
					primaryColor={activePass.primaryColor}
					secondaryColor={activePass.secondaryColor}
					ticketCode={activePass.ticketCode}
					buyerName={activePass.attendeeName}
					ticketType={activePass.ticketType}
					eventName={event.title}
					organizationName={organization.name}
					logoUrl={organization.logoUrl}
					flierImage={event.flierImage}
					bannerImage={event.bannerImage}
					dateTime={event.startDate ? String(event.startDate) : undefined}
					venue={event.venue || "Venue TBA"}
					qrPayload={activePass.verifyUrl}
				/>
			</div>

			<div className="w-full max-w-xl flex flex-wrap items-center justify-center gap-2 print:hidden">
				<Button
					variant="outline"
					size="sm"
					onClick={handleCopyLink}
					className="text-xs gap-1.5 h-9 border-border/70 shadow-none"
				>
					{copied ? (
						<Check className="size-3.5 text-emerald-600" />
					) : (
						<Copy className="size-3.5" />
					)}
					{copied ? "Copied" : "Copy link"}
				</Button>

				<TicketDownloadButton
					ticketCode={activePass.ticketCode}
					eventTitle={event.title}
				/>
			</div>

			<div
				className="absolute top-[-9999px] left-[-9999px] pointer-events-none"
				aria-hidden="true"
			>
				<div
					id="ticket-export-front"
					className="bg-transparent p-0 w-140 min-w-140"
				>
					<TicketRenderer
						variant={activePass.designVariant}
						primaryColor={activePass.primaryColor}
						secondaryColor={activePass.secondaryColor}
						ticketCode={activePass.ticketCode}
						buyerName={activePass.attendeeName}
						ticketType={activePass.ticketType}
						eventName={event.title}
						organizationName={organization.name}
						logoUrl={organization.logoUrl}
						flierImage={event.flierImage}
						bannerImage={event.bannerImage}
						dateTime={event.startDate ? String(event.startDate) : undefined}
						venue={event.venue || "Venue TBA"}
						qrPayload={activePass.verifyUrl}
						exportMode={true}
						exportSide="front"
					/>
				</div>

				<div
					id="ticket-export-back"
					className="bg-transparent p-0 w-140 min-w-140"
				>
					<TicketRenderer
						variant={activePass.designVariant}
						primaryColor={activePass.primaryColor}
						secondaryColor={activePass.secondaryColor}
						ticketCode={activePass.ticketCode}
						buyerName={activePass.attendeeName}
						ticketType={activePass.ticketType}
						eventName={event.title}
						organizationName={organization.name}
						logoUrl={organization.logoUrl}
						flierImage={event.flierImage}
						bannerImage={event.bannerImage}
						dateTime={event.startDate ? String(event.startDate) : undefined}
						venue={event.venue || "Venue TBA"}
						qrPayload={activePass.verifyUrl}
						exportMode={true}
						exportSide="back"
					/>
				</div>
				<div
					id="ticket-export-both"
					className="bg-transparent p-0 w-140 min-w-140"
				>
					<TicketRenderer
						variant={activePass.designVariant}
						primaryColor={activePass.primaryColor}
						secondaryColor={activePass.secondaryColor}
						ticketCode={activePass.ticketCode}
						buyerName={activePass.attendeeName}
						ticketType={activePass.ticketType}
						eventName={event.title}
						organizationName={organization.name}
						logoUrl={organization.logoUrl}
						flierImage={event.flierImage}
						bannerImage={event.bannerImage}
						dateTime={event.startDate ? String(event.startDate) : undefined}
						venue={event.venue || "Venue TBA"}
						qrPayload={activePass.verifyUrl}
						exportMode={true}
						exportSide="both"
					/>
				</div>
			</div>
		</div>
	);
}
