import { Suspense } from "react";
import { notFound } from "next/navigation";
import { verifyTicketToken } from "@/lib/ticket-crypto";
import { prisma } from "@repo/db";
import { TicketRenderer } from "@/components/shared/ticket-variants/TicketRenderer";
import { TicketDownloadButton } from "./TicketDownloadButton";
import { getFrontendBaseUrl } from "@/lib/utils";
import { AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { PanAfricanDivider } from "@/components/shared/PanAficDivider";
import { PoweredByFooter } from "@/components/shared/PoweredByFooter";

interface TicketViewPageProps {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata = {
	title: "Official Event Ticket | AfroReality",
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

					<TicketDownloadButton
						ticketCode={ticket.ticketCode}
						elementId="ticket-render-card"
					/>
				</div>
			</header>

			{/* Main Ticket Display Container */}
			<main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col items-center justify-center space-y-8">
				<div className="text-center space-y-1.5 print:hidden">
					<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300 text-xs font-semibold mb-1">
						<CheckCircle2 className="size-3.5" /> Confirmed Admission
					</div>
					<h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
						{event.title}
					</h1>
					<p className="text-xs text-muted-foreground">
						Present this QR code at the entrance for verification and entry.
					</p>
				</div>

				{/* Ticket Card Component */}
				<div id="ticket-render-card" className="w-full max-w-2xl">
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
			</main>

			<PanAfricanDivider className="my-10 print:hidden" />
			<div className="print:hidden">
				<PoweredByFooter />
			</div>
		</div>
	);
}
