import { notFound } from "next/navigation";
import { verifyTicketToken, createTicketToken } from "@/lib/ticket-crypto";
import { prisma } from "@repo/db";
import { getFrontendBaseUrl } from "@/lib/utils";
import {
	AlertCircle,
	ArrowLeft,
	ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { PanAfricanDivider } from "@/components/shared/PanAficDivider";
import { PoweredByFooter } from "@/components/shared/PoweredByFooter";
import { StatusBadge } from "@/components/common/status-badge";
import { MultiTicketPassbook } from "./MultiTicketPassbook";

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
					sent to your email or WhatsApp receipt.
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
					Please check your email or WhatsApp message for the original receipt link.
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

	const { event, order } = ticket;
	const { organization } = event;

	// Load all tickets belonging to this order if an orderId exists
	const allOrderTickets = ticket.orderId
		? await prisma.ticket.findMany({
				where: { orderId: ticket.orderId },
				include: { ticketType: true },
				orderBy: { createdAt: "asc" },
		  })
		: [ticket];

	const baseUrl = getFrontendBaseUrl();

	const passes = allOrderTickets.map((t, index) => {
		const tToken = createTicketToken(t.id, t.ticketCode);
		const tPrimaryColor =
			t.ticketType.primaryColor ||
			t.ticketType.color ||
			organization.primaryColor ||
			"#009A44";
		const tSecondaryColor =
			t.ticketType.secondaryColor || organization.secondaryColor || "#FFD100";
		const tVerifyUrl = `${baseUrl}/ticket/verify?token=${tToken}`;
		const tDirectUrl = `${baseUrl}/ticket/view?token=${tToken}`;

		return {
			id: t.id,
			ticketCode: t.ticketCode,
			attendeeName:
				t.attendeeName ||
				order?.buyerName ||
				(allOrderTickets.length > 1
					? `Attendee #${index + 1}`
					: "Valued Guest"),
			attendeeEmail: t.attendeeEmail || null,
			ticketType: t.ticketType.name,
			designVariant: t.ticketType.designVariant || "classic",
			primaryColor: tPrimaryColor,
			secondaryColor: tSecondaryColor,
			token: tToken,
			verifyUrl: tVerifyUrl,
			directUrl: tDirectUrl,
			passIndex: index + 1,
			totalPasses: allOrderTickets.length,
			checkInStatus: t.checkInStatus,
		};
	});

	const venueLabel = event.isVirtual
		? "Virtual / Online Event"
		: [event.venueName, event.venueCity].filter(Boolean).join(", ") ||
		  "Venue TBA";

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

					<StatusBadge
						variant="approved"
						text={
							passes.length > 1
								? `Order Passbook (${passes.length} Passes)`
								: "Official Ticket Pass"
						}
					/>
				</div>
			</header>

			{/* Main Ticket Display Container */}
			<main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col items-center justify-center space-y-8">
				<div className="text-center space-y-1.5 print:hidden">
					<h1 className="text-2xl sm:text-3xl font-millik font-black text-foreground tracking-tight">
						{event.title}
					</h1>
					<p className="text-xs text-muted-foreground">
						{passes.length > 1
							? "View, assign, and download each pass in your booking. Click any card to flip front/back."
							: "Click the card to flip front/back. Download for high-resolution offline access."}
					</p>
				</div>

				{/* Multi-Ticket Passbook Wallet Component */}
				<MultiTicketPassbook
					passes={passes}
					initialSelectedTicketId={ticket.id}
					orderNumber={order?.orderNumber}
					buyerName={order?.buyerName || undefined}
					buyerPhone={order?.buyerPhone || undefined}
					event={{
						id: event.id,
						title: event.title,
						flierImage: event.flierImage,
						bannerImage: event.bannerImage,
						startDate: event.startDate ? String(event.startDate) : undefined,
						venue: venueLabel,
					}}
					organization={{
						name: organization.name,
						logoUrl: organization.logoUrl,
					}}
					authorizingToken={token}
				/>

				{/* Security / Confidentiality Notice */}
				<div className="w-full max-w-xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 p-4 rounded-xl print:hidden">
					<div className="flex items-start gap-3">
						<div className="size-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
							<ShieldAlert className="size-4" />
						</div>
						<div className="space-y-1 text-xs text-left">
							<p className="font-bold text-amber-900 dark:text-amber-300">
									Do Not Share This URL or Ticket Code
							</p>
							<p className="text-muted-foreground leading-relaxed">
								Each ticket pass and QR code in this booking is unique and admits one entry at the gate. If you purchased passes for friends, use the <strong className="text-foreground">"Share Pass via WhatsApp"</strong> button to send their dedicated pass directly to them. Do not publish full QR codes publicly online.
							</p>
						</div>
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
