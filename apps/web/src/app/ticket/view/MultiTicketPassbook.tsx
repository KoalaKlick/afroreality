"use client";

import { useState } from "react";
import { TicketRenderer } from "@/components/shared/ticket-variants/TicketRenderer";
import { TicketDownloadButton } from "./TicketDownloadButton";
import {
	ChevronLeft,
	ChevronRight,
	Copy,
	Check,
	User,
	Layers,
	CheckCircle2,
	MessageCircle,
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
	buyerName?: string;
	buyerPhone?: string | null;
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
	authorizingToken: string;
}

export function MultiTicketPassbook({
	passes,
	initialSelectedTicketId,
	orderNumber,
	buyerName,
	buyerPhone,
	event,
	organization,
	authorizingToken,
}: MultiTicketPassbookProps) {
	// Find initial pass index or fallback to 0
	const initialIndex = passes.findIndex(
		(p) => p.id === initialSelectedTicketId,
	);
	const [activeIdx, setActiveIdx] = useState(
		initialIndex >= 0 ? initialIndex : 0,
	);
	const [copied, setCopied] = useState(false);

	const activePass = passes[activeIdx] ?? passes[0];
	if (!activePass) return null;

	const currentAttendeeName = activePass.attendeeName || "Valued Guest";
	const isMultiPass = passes.length > 1;

	const handlePrev = () => {
		if (activeIdx > 0) {
			setActiveIdx(activeIdx - 1);
		}
	};

	const handleNext = () => {
		if (activeIdx < passes.length - 1) {
			setActiveIdx(activeIdx + 1);
		}
	};

	const handleCopyLink = async () => {
		try {
			await navigator.clipboard.writeText(activePass.directUrl);
			setCopied(true);
			toast.success("Pass link copied to clipboard!");
			setTimeout(() => setCopied(false), 2500);
		} catch {
			toast.error("Failed to copy link");
		}
	};

	const handleShareWhatsApp = () => {
		const message = [
			`🎟️ *Your Official Ticket Pass for ${event.title}*`,
			``,
			`• *Tier:* ${activePass.ticketType}`,
			`• *Attendee:* ${currentAttendeeName}`,
			`• *Ticket ID:* \`${activePass.ticketCode}\``,
			event.venue ? `• *Venue:* ${event.venue}` : "",
			``,
			`👉 *View & Download your official admission pass here:*`,
			activePass.directUrl,
		]
			.filter(Boolean)
			.join("\n");

		const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
		window.open(url, "_blank");
	};

	return (
		<div className="w-full flex flex-col items-center space-y-6">
			{/* Multi-Pass Wallet Carousel / Segmented Selector (shown if > 1 pass) */}
			{isMultiPass && (
				<div className="w-full max-w-xl bg-card border border-border/80 rounded-2xl p-3 sm:p-4 shadow-none print:hidden space-y-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
								<Layers className="size-4" />
							</div>
							<div>
								<p className="text-xs font-bold text-foreground flex items-center gap-1.5">
									Order Passbook
									{orderNumber && (
										<span className="font-mono font-medium text-[11px] text-muted-foreground">
											#{orderNumber}
										</span>
									)}
								</p>
								<p className="text-[10px] text-muted-foreground">
									Pass {activeIdx + 1} of {passes.length} in this booking
								</p>
							</div>
						</div>

						{/* Quick Prev / Next Arrows */}
						<div className="flex items-center gap-1">
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
							<span className="text-xs font-mono font-bold px-1.5 text-muted-foreground">
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

					{/* Scrollable Pass Selection Pills */}
					<div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
						{passes.map((pass, idx) => {
							const isSelected = idx === activeIdx;
							const name = pass.attendeeName || `Pass #${idx + 1}`;
							return (
								<button
									key={pass.id}
									type="button"
									onClick={() => setActiveIdx(idx)}
									className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 border cursor-pointer ${
										isSelected
											? "bg-emerald-600 text-white border-emerald-600 scale-[1.02]"
											: "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/60"
									}`}
								>
									<span className="font-mono text-[10px] opacity-80">
										#{idx + 1}
									</span>
									<span className="truncate max-w-[120px]">{name}</span>
									{isSelected && <CheckCircle2 className="size-3 shrink-0" />}
								</button>
							);
						})}
					</div>
				</div>
			)}

			{/* Interactive 3D Card Display for Active Pass */}
			<div
				id="ticket-render-card"
				className="w-full max-w-2xl flex justify-center transition-all duration-300"
			>
				<TicketRenderer
					key={activePass.id}
					variant={activePass.designVariant}
					primaryColor={activePass.primaryColor}
					secondaryColor={activePass.secondaryColor}
					ticketCode={activePass.ticketCode}
					buyerName={currentAttendeeName}
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

			{/* Pass Details & Secure Share Card */}
			<div className="w-full max-w-xl bg-card border border-border/80 rounded-2xl p-4 shadow-none space-y-4 print:hidden">
				{/* Attendee Name & Code Row */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
					<div className="flex items-center gap-2.5 min-w-0">
						<div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
							<User className="size-4" />
						</div>
						<div className="min-w-0">
							<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
								Pass Assigned To
							</p>
							<p className="text-sm font-bold text-foreground truncate">
								{currentAttendeeName}
							</p>
						</div>
					</div>

					{/* Ticket Code Tag */}
					<div className="text-left sm:text-right shrink-0">
						<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
							Ticket Code
						</p>
						<p className="font-mono text-xs font-bold text-foreground">
							{activePass.ticketCode}
						</p>
					</div>
				</div>

				{/* Share & Transfer Controls */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
					{/* Share via WhatsApp */}
					<Button
						variant="outline"
						size="sm"
						onClick={handleShareWhatsApp}
						className="h-9 text-xs font-semibold gap-2 border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 shadow-none cursor-pointer"
					>
						<MessageCircle className="size-4 text-emerald-600" />
						Share Pass via WhatsApp
					</Button>

					{/* Copy Direct Pass Link */}
					<Button
						variant="outline"
						size="sm"
						onClick={handleCopyLink}
						className="h-9 text-xs font-semibold gap-2 border-border/80 hover:bg-accent shadow-none cursor-pointer"
					>
						{copied ? (
							<Check className="size-4 text-emerald-600" />
						) : (
							<Copy className="size-4 text-muted-foreground" />
						)}
						{copied ? "Link Copied!" : "Copy Pass Link"}
					</Button>
				</div>
			</div>

			{/* Action Toolbar for High-Res PNG Download & Print */}
			<div className="flex flex-col items-center gap-5 print:hidden pt-1 w-full max-w-xl">
				<TicketDownloadButton
					ticketCode={activePass.ticketCode}
					eventTitle={event.title}
				/>
			</div>

			{/* Hidden Offscreen Export Containers for Active Pass Rasterization */}
			<div
				className="absolute top-[-9999px] left-[-9999px] pointer-events-none"
				aria-hidden="true"
			>
				{/* Front Side Only */}
				<div
					id="ticket-export-front"
					className="bg-transparent p-0 w-[560px] min-w-[560px]"
				>
					<TicketRenderer
						variant={activePass.designVariant}
						primaryColor={activePass.primaryColor}
						secondaryColor={activePass.secondaryColor}
						ticketCode={activePass.ticketCode}
						buyerName={currentAttendeeName}
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

				{/* Back Side Only */}
				<div
					id="ticket-export-back"
					className="bg-transparent p-0 w-[560px] min-w-[560px]"
				>
					<TicketRenderer
						variant={activePass.designVariant}
						primaryColor={activePass.primaryColor}
						secondaryColor={activePass.secondaryColor}
						ticketCode={activePass.ticketCode}
						buyerName={currentAttendeeName}
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

				{/* Both Sides Stacked */}
				<div
					id="ticket-export-both"
					className="bg-transparent p-0 w-[560px] min-w-[560px]"
				>
					<TicketRenderer
						variant={activePass.designVariant}
						primaryColor={activePass.primaryColor}
						secondaryColor={activePass.secondaryColor}
						ticketCode={activePass.ticketCode}
						buyerName={currentAttendeeName}
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
