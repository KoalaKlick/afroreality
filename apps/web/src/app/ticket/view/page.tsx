import { Suspense } from "react";
import { notFound } from "next/navigation";
import { verifyTicketToken } from "@/lib/ticket-crypto";
import { prisma } from "@repo/db";
import { TicketRenderer } from "@/components/shared/ticket-variants/TicketRenderer";
import { TicketDownloadButton } from "./TicketDownloadButton";
import { getFrontendBaseUrl } from "@/lib/utils";
import {
	AlertCircle,
	ArrowLeft,
	CheckCircle2,
	ShieldAlert,
	ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { PanAfricanDivider } from "@/components/shared/PanAficDivider";
import { PoweredByFooter } from "@/components/shared/PoweredByFooter";
import { StatusBadge } from "@/components/common/status-badge";

interface TicketViewPageProps {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata = {
	title: "Official Event Ticket | fextiva",
	description: "View and download your official event ticket and admission pass.",
};

export default async function TicketViewPage({
	searchParams,
}: TicketViewPageProps) {
	const params = await searchParams;
	const token = typeof params.token === "string" ? params.token : "";

	if (!token) {
		return (
			<div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
				<div className="size-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center dark:bg-amber-950/50">
					<AlertCircle className="size-8" />
				</div>
				<h1 className="text-2xl font-black text-foreground">
					Missing Ticket Link
				</h1>
				<p className="text-xs text-muted-foreground leading-relaxed">
					No valid ticket token was found. Please access this page using the link
					sent to your email.
				</p>
			</div>
		);
	}

	const verified = verifyTicketToken(token);

	if (!verified) {
		return (
			<div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
				<div className="size-16 rounded-full bg-red-100 text-destructive flex items-center justify-center dark:bg-red-950/50">
					<AlertCircle className="size-8" />
				</div>
				<h1 className="text-2xl font-black text-foreground">
					Invalid Ticket Token
				</h1>
				<p className="text-xs text-muted-foreground leading-relaxed">
					This ticket token could not be verified or has been tampered with.
					Please check your email for the original receipt link.
				</p>
			</div>
		);
	}

	const ticket = await prisma.ticket.findUnique({
		where: { id: verified.ticketId },
		include: {
			event: {
				include: { organization: true },
			},
			ticketType: true,
			order: true,
		},
	});

	if (!ticket) {
		return notFound();
	}

	const { event, ticketType, order } = ticket;
	const { organization } = event;

	const primaryColor =
		ticketType.primaryColor ||
		ticketType.color ||
		organization.primaryColor ||
		"#009A44";
	const secondaryColor =
		ticketType.secondaryColor || organization.secondaryColor || "#FFD100";

	const verifyUrl = `${getFrontendBaseUrl()}/ticket/verify?token=${token}`;

	return (
		<div className="min-h-screen bg-background text-foreground flex flex-col">
			{/* Top Bar */}
			<header className="border-b border-border/80 bg-card/60 backdrop-blur-md sticky top-0 z-40 print:hidden">
				<div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between text-xs">
					<Link
						href={`/${organization.slug}/event/${event.slug}`}
						className="font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
					>
						<ArrowLeft className="size-3.5" /> Back to Event
					</Link>

					<StatusBadge variant="approved" text="Official Ticket Pass" />
				</div>
			</header>

			{/* Main Ticket Display Container */}
			<main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col items-center justify-center space-y-8">
				<div className="text-center space-y-1.5 print:hidden">
					<h1 className="text-2xl sm:text-3xl font-millik font-black text-muted-foreground tracking-tight">
						{event.title}
					</h1>
					<p className="text-xs text-muted-foreground">
						Click the card to flip front/back. Download for high-resolution offline access.
					</p>
				</div>

				{/* Interactive Ticket Card Component */}
				<div id="ticket-render-card" className="w-full max-w-2xl flex justify-center">
					<TicketRenderer
						variant={ticketType.designVariant || "classic"}
						primaryColor={primaryColor}
						secondaryColor={secondaryColor}
						ticketCode={ticket.ticketCode}
						buyerName={ticket.attendeeName || order.buyerName || "Guest"}
						ticketType={ticketType.name}
						eventName={event.title}
						organizationName={organization.name}
						logoUrl={organization.logoUrl}
						flierImage={event.flierImage}
						bannerImage={event.bannerImage}
						dateTime={event.startDate ? String(event.startDate) : undefined}
						venue={
							event.isVirtual
								? "Virtual / Online Event"
								: [event.venueName, event.venueCity].filter(Boolean).join(", ") ||
									"Venue TBA"
						}
						qrPayload={verifyUrl}
					/>
				</div>

				{/* Action Toolbar */}
				<div className="flex flex-col items-center gap-5 print:hidden pt-2 w-full max-w-xl">
					<TicketDownloadButton
						ticketCode={ticket.ticketCode}
						eventTitle={event.title}
					/>

					{/* Security / Confidentiality Notice */}
					<div className="w-full bg-amber-500/5 dark:bg-amber-950/20 p-4 shadow-xs">
						<div className="flex items-start gap-3">
							<div className="size-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
								<ShieldAlert className="size-4" />
							</div>
							<div className="space-y-1 text-xs text-left">
								<p className="font-bold text-amber-900 dark:text-amber-300">
									Do Not Share This URL or Ticket Code
								</p>
								<p className="text-muted-foreground leading-relaxed">
									This page link and QR code are unique to your booking and admit one entry at the gate. Do not forward this URL, publish your QR code online, or share your Ticket ID (<strong className="font-mono text-foreground font-semibold">{ticket.ticketCode}</strong>) with anyone. Anyone with access to this pass can redeem it upon arrival.
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Hidden Offscreen Export Containers for High-Resolution PNG Rasterization */}
				<div
					className="absolute top-[-9999px] left-[-9999px] pointer-events-none"
					aria-hidden="true"
				>
					{/* Front Side Only (Event Souvenir Face) */}
					<div
						id="ticket-export-front"
						className="bg-transparent p-0 w-[560px] min-w-[560px]"
					>
						<TicketRenderer
							variant={ticketType.designVariant || "classic"}
							primaryColor={primaryColor}
							secondaryColor={secondaryColor}
							ticketCode={ticket.ticketCode}
							buyerName={ticket.attendeeName || order.buyerName || "Guest"}
							ticketType={ticketType.name}
							eventName={event.title}
							organizationName={organization.name}
							logoUrl={organization.logoUrl}
							flierImage={event.flierImage}
							bannerImage={event.bannerImage}
							dateTime={event.startDate ? String(event.startDate) : undefined}
							venue={
								event.isVirtual
									? "Virtual / Online Event"
									: [event.venueName, event.venueCity].filter(Boolean).join(", ") ||
										"Venue TBA"
							}
							qrPayload={verifyUrl}
							exportMode={true}
							exportSide="front"
						/>
					</div>

					{/* Back Side Only (QR Gate Pass) */}
					<div
						id="ticket-export-back"
						className="bg-transparent p-0 w-[560px] min-w-[560px]"
					>
						<TicketRenderer
							variant={ticketType.designVariant || "classic"}
							primaryColor={primaryColor}
							secondaryColor={secondaryColor}
							ticketCode={ticket.ticketCode}
							buyerName={ticket.attendeeName || order.buyerName || "Guest"}
							ticketType={ticketType.name}
							eventName={event.title}
							organizationName={organization.name}
							logoUrl={organization.logoUrl}
							flierImage={event.flierImage}
							bannerImage={event.bannerImage}
							dateTime={event.startDate ? String(event.startDate) : undefined}
							venue={
								event.isVirtual
									? "Virtual / Online Event"
									: [event.venueName, event.venueCity].filter(Boolean).join(", ") ||
										"Venue TBA"
							}
							qrPayload={verifyUrl}
							exportMode={true}
							exportSide="back"
						/>
					</div>

					{/* Both Sides (Full Ticket Stacked) */}
					<div
						id="ticket-export-both"
						className="bg-transparent p-0 w-[560px] min-w-[560px]"
					>
						<TicketRenderer
							variant={ticketType.designVariant || "classic"}
							primaryColor={primaryColor}
							secondaryColor={secondaryColor}
							ticketCode={ticket.ticketCode}
							buyerName={ticket.attendeeName || order.buyerName || "Guest"}
							ticketType={ticketType.name}
							eventName={event.title}
							organizationName={organization.name}
							logoUrl={organization.logoUrl}
							flierImage={event.flierImage}
							bannerImage={event.bannerImage}
							dateTime={event.startDate ? String(event.startDate) : undefined}
							venue={
								event.isVirtual
									? "Virtual / Online Event"
									: [event.venueName, event.venueCity].filter(Boolean).join(", ") ||
										"Venue TBA"
							}
							qrPayload={verifyUrl}
							exportMode={true}
							exportSide="both"
						/>
					</div>
				</div>
			</main>

			<PanAfricanDivider className="my-10 print:hidden" />
			<div className="print:hidden">
				<PoweredByFooter />
			</div>
		</div>
	);
}
