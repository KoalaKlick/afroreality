"use client";

import { useState, useEffect } from "react";
import {
	PortraitReceiptTicket,
	type TicketSponsorItem,
} from "@/components/shared/ticket-variants/PortraitReceiptTicket";
import { WhatsAppDoodleBackground } from "@/components/shared/WhatsAppDoodleBackground";
import { TicketDownloadButton } from "./TicketDownloadButton";
import { TicketTransferModal } from "./TicketTransferModal";
import {
	ChevronLeft,
	ChevronRight,
	Copy,
	Check,
	HelpCircle,
	Ticket,
} from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type { TicketSponsorItem };

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
		venueName?: string | null;
		venueAddress?: string | null;
		venueCity?: string | null;
		venueCountry?: string | null;
		latitude?: number | null;
		longitude?: number | null;
		isVirtual?: boolean;
		virtualLink?: string | null;
		sponsors?: TicketSponsorItem[];
	};
	organization: {
		name: string;
		logoUrl?: string | null;
		websiteUrl?: string | null;
	};
}

export function MultiTicketPassbook({
	passes,
	initialSelectedTicketId,
	orderNumber,
	event,
	organization,
}: MultiTicketPassbookProps) {
	const [passesList, setPassesList] = useState(passes);
	const initialIndex = passesList.findIndex(
		(p) => p.id === initialSelectedTicketId,
	);
	const [activeIdx, setActiveIdx] = useState(
		initialIndex >= 0 ? initialIndex : 0,
	);
	const [isFlipped, setIsFlipped] = useState(false);
	const [copied, setCopied] = useState(false);
	const [showMultiPassGuide, setShowMultiPassGuide] = useState(false);

	const activePass = passesList[activeIdx] ?? passesList[0];
	const isMultiPass = passesList.length > 1;

	useEffect(() => {
		if (isMultiPass && typeof window !== "undefined") {
			const storageKey = `fextiva_pass_guide_${orderNumber || passesList[0]?.id}`;
			const hasSeen = sessionStorage.getItem(storageKey);
			if (!hasSeen) {
				setShowMultiPassGuide(true);
			}
		}
	}, [isMultiPass, orderNumber, passesList]);

	const handleDismissGuide = () => {
		setShowMultiPassGuide(false);
		if (typeof window !== "undefined") {
			const storageKey = `fextiva_pass_guide_${orderNumber || passesList[0]?.id}`;
			sessionStorage.setItem(storageKey, "true");
		}
	};

	const handlePrev = () => {
		if (activeIdx > 0) {
			setActiveIdx(activeIdx - 1);
			setIsFlipped(false);
		}
	};

	const handleNext = () => {
		if (activeIdx < passesList.length - 1) {
			setActiveIdx(activeIdx + 1);
			setIsFlipped(false);
		}
	};

	const handleSelectPass = (idx: number) => {
		setActiveIdx(idx);
		setIsFlipped(false);
	};

	const handlePassTransferred = (newCode: string, newUrl: string) => {
		setPassesList((prev) => {
			const copy = [...prev];
			if (copy[activeIdx]) {
				copy[activeIdx] = {
					...copy[activeIdx],
					ticketCode: newCode,
					directUrl: newUrl,
				};
			}
			return copy;
		});
	};

	const handleCopyLink = async () => {
		if (!activePass) return;
		try {
			await navigator.clipboard.writeText(activePass.directUrl);
			setCopied(true);
			toast.success("Pass link copied");
			setTimeout(() => setCopied(false), 2500);
		} catch {
			toast.error("Failed to copy link");
		}
	};

	if (!activePass) return null;

	return (
		<>
			<WhatsAppDoodleBackground
				primaryColor={activePass.primaryColor}
				className="fixed inset-0 pointer-events-none"
			/>
			<div className="w-full flex flex-col items-center gap-6 min-w-0 relative z-10">
				{isMultiPass && (
					<div className="w-full max-w-xl rounded-xl border border-border/70 bg-card p-3 print:hidden min-w-0 space-y-3">
						<div className="flex items-center justify-between gap-2 min-w-0">
							<div className="min-w-0">
								<div className="flex items-center gap-1.5">
									<p className="text-xs font-semibold text-foreground truncate">
										{orderNumber ? `Order #${orderNumber}` : "Your passes"}
									</p>
									<button
										type="button"
										onClick={() => setShowMultiPassGuide(true)}
										className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded cursor-pointer"
										title="How to share group passes"
									>
										<HelpCircle className="size-3.5 text-primary" />
									</button>
								</div>
								<p className="text-[11px] text-muted-foreground">
									Pass {activeIdx + 1} of {passesList.length}
									{activeIdx === 0 ? " · (Your personal pass)" : ""}
								</p>
							</div>

							<div className="flex items-center gap-1 shrink-0">
								<Button
									variant="outline"
									size="icon"
									onClick={handlePrev}
									disabled={activeIdx === 0}
									className="size-8 rounded-lg border-border/70 shadow-none cursor-pointer"
									aria-label="Previous pass"
								>
									<ChevronLeft className="size-4" />
								</Button>
								<Button
									variant="outline"
									size="icon"
									onClick={handleNext}
									disabled={activeIdx === passesList.length - 1}
									className="size-8 rounded-lg border-border/70 shadow-none cursor-pointer"
									aria-label="Next pass"
								>
									<ChevronRight className="size-4" />
								</Button>
							</div>
						</div>

						<div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
							{passesList.map((pass, idx) => {
								const isSelected = idx === activeIdx;
								const isBuyer = idx === 0;
								return (
									<button
										key={pass.id}
										type="button"
										onClick={() => handleSelectPass(idx)}
										className={cn(
											"px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all border cursor-pointer flex items-center gap-2",
											isSelected
												? "bg-primary text-primary-foreground border-primary shadow-sm"
												: "bg-muted/40 text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted",
										)}
									>
										<span
											className={cn(
												"size-4 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0",
												isSelected
													? "bg-primary-foreground/20 text-primary-foreground"
													: "bg-muted-foreground/20 text-muted-foreground",
											)}
										>
											{idx + 1}
										</span>
										<span className="truncate max-w-28 font-medium">
											{isBuyer ? `${pass.attendeeName} (You)` : pass.attendeeName}
										</span>
										{isBuyer && (
											<span
												className={cn(
													"text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold",
													isSelected
														? "bg-primary-foreground text-primary"
														: "bg-muted text-muted-foreground border border-border/70",
												)}
											>
												Buyer
											</span>
										)}
									</button>
								);
							})}
						</div>

						<div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2 text-xs">
							<div className="flex items-center gap-1.5 min-w-0">
								<span className="size-2 rounded-full bg-emerald-500 shrink-0" />
								<p className="text-foreground truncate font-medium">
									Active pass:{" "}
									<span className="font-bold underline decoration-primary underline-offset-2">
										{activePass.attendeeName}
									</span>{" "}
									{activeIdx === 0 ? "· Your admission pass" : `· Pass #${activeIdx + 1}`}
								</p>
							</div>
							<span className="text-[10px] text-muted-foreground shrink-0 font-medium bg-muted/60 px-2 py-0.5 rounded-md border border-border/50">
								{activePass.ticketType}
							</span>
						</div>
					</div>
				)}

				{/* Main Flippable Ticket Render Card */}
				<div
					id="ticket-render-card"
					className="w-full flex justify-center min-w-0"
				>
					<PortraitReceiptTicket
						key={activePass.id}
						variant={activePass.designVariant}
						primaryColor={activePass.primaryColor}
						secondaryColor={activePass.secondaryColor}
						ticketCode={activePass.ticketCode}
						buyerName={activePass.attendeeName}
						ticketType={activePass.ticketType}
						eventName={event.title}
						organizationName={organization.name}
						organizationWebsite={organization.websiteUrl}
						logoUrl={organization.logoUrl}
						flierImage={event.flierImage || event.bannerImage}
						bannerImage={event.bannerImage}
						dateTime={event.startDate ? String(event.startDate) : undefined}
						venue={event.venue || "Venue TBA"}
						venueName={event.venueName}
						venueAddress={event.venueAddress}
						venueCity={event.venueCity}
						venueCountry={event.venueCountry}
						latitude={event.latitude}
						longitude={event.longitude}
						isVirtual={event.isVirtual}
						virtualLink={event.virtualLink}
						sponsors={event.sponsors}
						qrPayload={activePass.verifyUrl}
						orderNumber={orderNumber}
						flipped={isFlipped}
						onFlipChange={setIsFlipped}
					/>
				</div>

				{/* Pass Actions Bar */}
				<div className="w-full max-w-xl flex flex-col items-center gap-2 print:hidden">
					<div className="w-full flex flex-wrap items-center justify-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={handleCopyLink}
							className="text-xs gap-1.5 h-9 border-border/70 shadow-sm cursor-pointer bg-card hover:bg-card/90 text-foreground"
							title={`Copy link for Pass #${activeIdx + 1} (${activePass.attendeeName})`}
						>
							{copied ? (
								<Check className="size-3.5 text-emerald-600" />
							) : (
								<Copy className="size-3.5" />
							)}
							{copied
								? "Copied"
								: isMultiPass
									? `Copy Pass #${activeIdx + 1} link (${activePass.attendeeName})`
									: "Copy link"}
						</Button>

						<TicketDownloadButton
							ticketCode={activePass.ticketCode}
							eventTitle={event.title}
						/>

						{activePass.checkInStatus !== "checked_in" && (
							<TicketTransferModal
								ticketId={activePass.id}
								currentTicketCode={activePass.ticketCode}
								token={activePass.token}
								attendeeName={activePass.attendeeName}
								eventTitle={event.title}
								onTransferred={handlePassTransferred}
							/>
						)}
					</div>

					{isMultiPass && (
						<p className="text-[11px] bg-background text-muted-foreground text-center px-4 leading-relaxed">
							Link above is unique to{" "}
							<span className="font-semibold text-foreground">
								Pass #{activeIdx + 1} ({activePass.attendeeName})
							</span>
							. To share another ticket, click their numbered tab above first.
						</p>
					)}
				</div>

				{/* Hidden Export Elements for html-to-image capture */}
				<div
					className="absolute top-[-9999px] left-[-9999px] pointer-events-none"
					aria-hidden="true"
				>
					{/* Front Side Export Container */}
					<div
						id="ticket-export-front"
						className="bg-transparent p-4 w-[390px] min-w-[390px]"
					>
						<PortraitReceiptTicket
							variant={activePass.designVariant}
							primaryColor={activePass.primaryColor}
							secondaryColor={activePass.secondaryColor}
							ticketCode={activePass.ticketCode}
							buyerName={activePass.attendeeName}
							ticketType={activePass.ticketType}
							eventName={event.title}
							organizationName={organization.name}
							organizationWebsite={organization.websiteUrl}
							logoUrl={organization.logoUrl}
							flierImage={event.flierImage || event.bannerImage}
							bannerImage={event.bannerImage}
							dateTime={event.startDate ? String(event.startDate) : undefined}
							venue={event.venue || "Venue TBA"}
							venueName={event.venueName}
							venueAddress={event.venueAddress}
							venueCity={event.venueCity}
							venueCountry={event.venueCountry}
							latitude={event.latitude}
							longitude={event.longitude}
							isVirtual={event.isVirtual}
							virtualLink={event.virtualLink}
							sponsors={event.sponsors}
							qrPayload={activePass.verifyUrl}
							orderNumber={orderNumber}
							exportMode={true}
							exportSide="front"
						/>
					</div>

					{/* Back Side Export Container */}
					<div
						id="ticket-export-back"
						className="bg-transparent p-4 w-[390px] min-w-[390px]"
					>
						<PortraitReceiptTicket
							variant={activePass.designVariant}
							primaryColor={activePass.primaryColor}
							secondaryColor={activePass.secondaryColor}
							ticketCode={activePass.ticketCode}
							buyerName={activePass.attendeeName}
							ticketType={activePass.ticketType}
							eventName={event.title}
							organizationName={organization.name}
							organizationWebsite={organization.websiteUrl}
							logoUrl={organization.logoUrl}
							flierImage={event.flierImage || event.bannerImage}
							bannerImage={event.bannerImage}
							dateTime={event.startDate ? String(event.startDate) : undefined}
							venue={event.venue || "Venue TBA"}
							venueName={event.venueName}
							venueAddress={event.venueAddress}
							venueCity={event.venueCity}
							venueCountry={event.venueCountry}
							latitude={event.latitude}
							longitude={event.longitude}
							isVirtual={event.isVirtual}
							virtualLink={event.virtualLink}
							sponsors={event.sponsors}
							qrPayload={activePass.verifyUrl}
							orderNumber={orderNumber}
							exportMode={true}
							exportSide="back"
						/>
					</div>

					{/* Combined Both Sides Export Container */}
					<div
						id="ticket-export-both"
						className="bg-transparent p-4 flex flex-col gap-6 w-[390px] min-w-[390px]"
					>
						<PortraitReceiptTicket
							variant={activePass.designVariant}
							primaryColor={activePass.primaryColor}
							secondaryColor={activePass.secondaryColor}
							ticketCode={activePass.ticketCode}
							buyerName={activePass.attendeeName}
							ticketType={activePass.ticketType}
							eventName={event.title}
							organizationName={organization.name}
							organizationWebsite={organization.websiteUrl}
							logoUrl={organization.logoUrl}
							flierImage={event.flierImage || event.bannerImage}
							bannerImage={event.bannerImage}
							dateTime={event.startDate ? String(event.startDate) : undefined}
							venue={event.venue || "Venue TBA"}
							venueName={event.venueName}
							venueAddress={event.venueAddress}
							venueCity={event.venueCity}
							venueCountry={event.venueCountry}
							latitude={event.latitude}
							longitude={event.longitude}
							isVirtual={event.isVirtual}
							virtualLink={event.virtualLink}
							sponsors={event.sponsors}
							qrPayload={activePass.verifyUrl}
							orderNumber={orderNumber}
							exportMode={true}
							exportSide="both"
						/>
					</div>
				</div>
			</div>

			{/* Group Passbook Orientation Guide Dialog */}
			<Dialog open={showMultiPassGuide} onOpenChange={setShowMultiPassGuide}>
				<DialogContent className="sm:max-w-md p-6 bg-background border-border/80 shadow-none">
					<div className="size-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-1">
						<Ticket className="size-5" />
					</div>
					<DialogHeader className="text-left space-y-1.5">
						<DialogTitle className="text-base font-bold text-foreground">
							Managing Your Group Passes
						</DialogTitle>
						<DialogDescription className="text-xs text-muted-foreground leading-relaxed">
							You have {passesList.length} tickets in this order. Here is how to share them without giving away your personal pass:
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-2.5 py-2 text-xs">
						<div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex gap-3 items-start">
							<div className="size-6 rounded-md bg-primary text-primary-foreground font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
								1
							</div>
							<div className="space-y-0.5 min-w-0">
								<p className="font-bold text-foreground">Pass #1 belongs to YOU</p>
								<p className="text-muted-foreground text-[11px] leading-relaxed">
									The first tab is your personal admission pass. Keep it for your own entry at the gate.
								</p>
							</div>
						</div>

						<div className="p-3 rounded-xl bg-muted/40 border border-border/70 flex gap-3 items-start">
							<div className="size-6 rounded-md bg-muted text-foreground font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5 border border-border/80">
								2
							</div>
							<div className="space-y-0.5 min-w-0">
								<p className="font-bold text-foreground">Switch tabs before sharing</p>
								<p className="text-muted-foreground text-[11px] leading-relaxed">
									To share a ticket with a guest, first tap their specific pass tab (e.g. <strong>Pass 2</strong> or <strong>Pass 3</strong>) at the top.
								</p>
							</div>
						</div>

						<div className="p-3 rounded-xl bg-muted/40 border border-border/70 flex gap-3 items-start">
							<div className="size-6 rounded-md bg-muted text-foreground font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5 border border-border/80">
								3
							</div>
							<div className="space-y-0.5 min-w-0">
								<p className="font-bold text-foreground">Copy or transfer that specific pass</p>
								<p className="text-muted-foreground text-[11px] leading-relaxed">
									Once on their tab, click <strong>Copy link</strong> . Each pass has its own unique QR code that can only be admitted once.
								</p>
							</div>
						</div>
					</div>

					<DialogFooter className="pt-2">
						<Button
							onClick={handleDismissGuide}
							className="w-full text-xs font-semibold h-9 cursor-pointer"
						>
							Got it, view my passes
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
