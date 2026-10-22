import { notFound } from "next/navigation";
import { verifyTicketToken, createTicketToken } from "@/lib/ticket-crypto";
import { prisma } from "@repo/db";
import { getFrontendBaseUrl } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PoweredByFooter } from "@/components/shared/PoweredByFooter";
import { EmptyState } from "@/components/shared/EmptyState";
import { MultiTicketPassbook } from "./MultiTicketPassbook";
import { getEventImageUrl } from "@/lib/image-url-utils";

import type { Metadata } from "next";

interface TicketViewPageProps {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/** Dynamic OG metadata so the ticket URL renders as a rich card on WhatsApp / social */
export async function generateMetadata({
	searchParams,
}: TicketViewPageProps): Promise<Metadata> {
	const params = await searchParams;
	const token = typeof params.token === "string" ? params.token.trim() : "";
	const ticketCode =
		typeof params.code === "string"
			? params.code.trim()
			: typeof params.ticketCode === "string"
				? params.ticketCode.trim()
				: "";

	if (!token && !ticketCode) return { title: "Ticket | fextiva" };

	const { prisma } = await import("@repo/db");
	let ticket: any = null;

	if (token) {
		const { verifyTicketToken } = await import("@/lib/ticket-crypto");
		const verified = verifyTicketToken(token);
		if (verified) {
			ticket = await prisma.ticket.findFirst({
				where: { id: verified.ticketId, ticketCode: verified.ticketCode },
				include: { event: { include: { organization: true } }, ticketType: true },
			});
		}
	}

	if (!ticket && ticketCode) {
		ticket = await prisma.ticket.findFirst({
			where: { ticketCode },
			include: { event: { include: { organization: true } }, ticketType: true },
		});
	}

	if (!ticket) return { title: "Ticket | fextiva" };

	const { event } = ticket;
	const resolvedImg = getEventImageUrl(event.flierImage || event.bannerImage);
	const ogImage = resolvedImg
		? resolvedImg.startsWith("http")
			? resolvedImg
			: `${getFrontendBaseUrl()}${resolvedImg.startsWith("/") ? "" : "/"}${resolvedImg}`
		: null;
	const venueStr = event.isVirtual
		? "Virtual / Online Event"
		: [event.venueName, event.venueCity].filter(Boolean).join(", ") || "Venue TBA";

	return {
		title: `${event.title} — Official Ticket | fextiva`,
		description: `Your admission pass for ${event.title}${venueStr ? ` · ${venueStr}` : ""}. View and download your official ticket.`,
		openGraph: {
			title: `${event.title} — Official Ticket`,
			description: `Tap to view your official admission pass for ${event.title}.`,
			...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630 }] } : {}),
			type: "website",
		},
		twitter: {
			card: ogImage ? "summary_large_image" : "summary",
			title: `${event.title} — Official Ticket`,
			description: `Tap to view your official admission pass for ${event.title}.`,
			...(ogImage ? { images: [ogImage] } : {}),
		},
	};
}

export default async function TicketViewPage({
	searchParams,
}: TicketViewPageProps) {
	const params = await searchParams;
	const token = typeof params.token === "string" ? params.token.trim() : "";
	const ticketCode =
		typeof params.code === "string"
			? params.code.trim()
			: typeof params.ticketCode === "string"
				? params.ticketCode.trim()
				: "";

	if (!token && !ticketCode) {
		return (
			<div className="min-h-[70vh] flex items-center justify-center p-6">
				<div className="w-full max-w-md rounded-xl border border-border/70 bg-card">
					<EmptyState
						variant="tickets"
						title="Missing ticket link"
						description="Open this page from the link in your email, SMS, or WhatsApp receipt."
						className="py-12"
					/>
				</div>
			</div>
		);
	}

	let ticket: any = null;

	if (token) {
		const verified = verifyTicketToken(token);
		if (verified) {
			ticket = await prisma.ticket.findFirst({
				where: {
					id: verified.ticketId,
					ticketCode: verified.ticketCode,
				},
				include: {
					event: {
						include: { organization: true },
					},
					ticketType: true,
					order: true,
				},
			});
		}
	}

	if (!ticket && ticketCode) {
		ticket = await prisma.ticket.findFirst({
			where: {
				ticketCode,
			},
			include: {
				event: {
					include: { organization: true },
				},
				ticketType: true,
				order: true,
			},
		});
	}

	if (!ticket) {
		return (
			<div className="min-h-[70vh] flex items-center justify-center p-6">
				<div className="w-full max-w-md rounded-xl border border-border/70 bg-card">
					<EmptyState
						variant="invalid"
						title="Invalid ticket link"
						description="This ticket link could not be verified. Use the original receipt link from email, SMS, or WhatsApp."
						className="py-12"
					/>
				</div>
			</div>
		);
	}

	if (!ticket) {
		return notFound();
	}

	const { event, order } = ticket;
	const { organization } = event;

	// Load all tickets belonging to this order if an orderId exists
	const rawOrderTickets = ticket.orderId
		? await prisma.ticket.findMany({
			where: { orderId: ticket.orderId },
			include: { ticketType: true },
			orderBy: { createdAt: "asc" },
		})
		: [ticket];

	// Security & Privacy: Only the primary user (the first ticket in the order) can view
	// all passes in the order passbook. Individual attendees only see their own single ticket pass.
	const isPrimaryUser =
		rawOrderTickets.length > 0 && rawOrderTickets[0]?.id === ticket.id;
	const allOrderTickets = isPrimaryUser ? rawOrderTickets : [ticket];

	const baseUrl = getFrontendBaseUrl();

	/** Converts a full name into privacy-safe initials, e.g. "John Doe" → "J. D." */
	function toInitials(name: string): string {
		return name
			.trim()
			.split(/\s+/)
			.map((part) => part[0]?.toUpperCase() + ".")
			.join(" ");
	}

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

		// Privacy: use initials instead of full names so a lost/shared link
		// cannot reveal the ticket holder's identity.
		const rawName =
			t.attendeeName ||
			order?.buyerName ||
			null;
		const attendeeLabel = rawName
			? toInitials(rawName)
			: allOrderTickets.length > 1
				? `Pass #${index + 1}`
				: "Guest";

		return {
			id: t.id,
			ticketCode: t.ticketCode,
			attendeeName: attendeeLabel,
			attendeeEmail: null, // never expose email
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

	const bgImageUrl = getEventImageUrl(event.flierImage || event.bannerImage);

	return (
		<div className="min-h-screen bg-slate-950 text-foreground flex flex-col relative overflow-x-hidden selection:bg-primary/20">
			{/* Ambient Event Flier Backdrop */}
			{bgImageUrl ? (
				<div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
					<Image
						src={bgImageUrl}
						alt={event.title}
						fill
						className="object-cover object-center blur-3xl opacity-30 dark:opacity-25 scale-110"
						priority
						unoptimized
					/>
					<div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/85 to-slate-950/95" />
				</div>
			) : (
				<div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950" />
			)}

			<header className="border-b border-white/10 bg-slate-950/40 backdrop-blur-md sticky top-0 z-40 print:hidden relative">
				<div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between text-xs">
					<Link
						href={`/${organization.slug}/event/${event.slug}`}
						className="font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
					>
						<ArrowLeft className="size-3.5" /> Back to event
					</Link>
					<span className="text-slate-400">
						{passes.length > 1 ? `${passes.length} passes` : "Your ticket"}
					</span>
				</div>
			</header>

			<main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-8 flex flex-col items-center gap-6 relative z-10">
				<div className="text-center print:hidden space-y-1">
					<h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
						{event.title}
					</h1>
					<p className="text-xs text-slate-400">
						Official admission pass · download for offline entry
					</p>
				</div>

				<MultiTicketPassbook
					passes={passes}
					initialSelectedTicketId={ticket.id}
					orderNumber={order?.orderNumber}
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
				/>

				<p className="text-[11px] text-muted-foreground text-center max-w-sm print:hidden">
					Keep this pass private — each QR admits one entry.
				</p>
			</main>

			<footer className="py-6 border-t border-border/40 print:hidden mt-auto">
				<PoweredByFooter />
			</footer>
		</div>
	);
}
