"use client";

import { useState } from "react";
import { TicketRenderer } from "@/components/shared/ticket-variants/TicketRenderer";
import { TicketDownloadButton } from "./TicketDownloadButton";
import {
	ChevronLeft,
	ChevronRight,
	Copy,
	Check,
	Layers,
	CheckCircle2,
	Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
			toast.success("Pass link copied!");
			setTimeout(() => setCopied(false), 2500);
		} catch {
			toast.error("Failed to copy link");
		}
	};


	return (
		<div className="w-full flex flex-col items-center space-y-5 min-w-0">
			{/* Multi-Pass Wallet Selector (shown if > 1 pass) */}
			{isMultiPass && (
				<div className="w-full max-w-xl bg-tertiary-50 rounded-lg p-3 sm:p-4 shadow-none print:hidden space-y-3 min-w-0">
					<div className="flex items-center justify-between gap-2 min-w-0">
						<div className="flex items-center gap-2 min-w-0">
							<div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
								<Layers className="size-4" />
							</div>
							<div className="min-w-0">
								<p className="text-xs font-bold text-foreground flex items-center gap-1.5 truncate">
									Order ID
									{orderNumber && (
										<span className="font-mono font-medium text-[11px] text-muted-foreground shrink-0">
											#{orderNumber}
										</span>
									)}
								</p>
								<p className="text-[10px] text-muted-foreground">
									Pass {activeIdx + 1} of {passes.length}
								</p>
							</div>
						</div>

						{/* Prev / Next Arrows */}
						<div className="flex items-center gap-1 shrink-0">
							<Button
								variant="outline"
								size="icon"
								onClick={handlePrev}
								disabled={activeIdx === 0}
								className="size-8 rounded-lg border-border/80 shadow-none cursor-pointer"
								title="Previous Pass"
							>
								<ChevronLeft className="size-4" />
							</Button>
							<span className="text-xs font-mono font-bold px-1 text-muted-foreground">
								{activeIdx + 1}/{passes.length}
							</span>
							<Button
								variant="outline"
								size="icon"
								onClick={handleNext}
								disabled={activeIdx === passes.length - 1}
								className="size-8 rounded-lg border-border/80 shadow-none cursor-pointer"
								title="Next Pass"
							>
								<ChevronRight className="size-4" />
							</Button>
						</div>
					</div>

					{/* Scrollable Pass Pills */}
					<div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
						{passes.map((pass, idx) => {
							const isSelected = idx === activeIdx;
							return (
								<button
									key={pass.id}
									type="button"
									onClick={() => setActiveIdx(idx)}
									className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 border cursor-pointer ${isSelected
											? "bg-emerald-600 text-white border-emerald-600 scale-[1.02]"
											: "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/60"
										}`}
								>
									<span className="font-mono text-[10px] opacity-80">
										#{idx + 1}
									</span>
									<span className="truncate max-w-20">
										{pass.attendeeName}
									</span>
									{isSelected && <CheckCircle2 className="size-3 shrink-0" />}
								</button>
							);
						})}
					</div>

					{/* Privacy footnote */}
					<p className="text-[10px] text-muted-foreground/60 flex items-center gap-1 pt-0.5">
						<span>🔒</span>
						Attendee names are abbreviated to initials for privacy
					</p>
				</div>
			)}

			{/* Interactive 3D Ticket Card */}
			<div
				id="ticket-render-card"
				className="w-full max-w-2xl flex justify-center transition-all duration-300 min-w-0 overflow-hidden"
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

			{/* Action row — Share, Copy Link, Print, and Download */}
			<div className="w-full max-w-xl flex flex-col items-center gap-3 print:hidden min-w-0">
				<div className="flex flex-wrap items-center justify-center gap-2">

					<Button
						variant="outline"
						size="sm"
						onClick={handleCopyLink}
						className="text-xs gap-1.5 h-9 border-border/80 hover:bg-accent cursor-pointer"
						title="Copy Pass Link"
					>
						{copied ? (
							<Check className="size-3.5 text-emerald-600" />
						) : (
							<Copy className="size-3.5" />
						)}
						{copied ? "Link Copied" : "Copy Link"}
					</Button>

					{/* Download / Print actions */}
					<TicketDownloadButton
						ticketCode={activePass.ticketCode}
						eventTitle={event.title}
					/>
				</div>
			</div>

			{/* Hidden Offscreen Export Containers */}
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
