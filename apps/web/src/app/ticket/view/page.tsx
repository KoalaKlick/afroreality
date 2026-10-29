import { notFound } from "next/navigation";
import { verifyTicketToken, createTicketToken } from "@/lib/ticket-crypto";
import { parseTicketCode } from "@/lib/utils/ticket-code";
import { prisma } from "@repo/db";
import { getFrontendBaseUrl } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
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
		const parsed = parseTicketCode(ticketCode);
		const lookupCodes = Array.from(new Set([ticketCode, parsed.normalizedCode, parsed.passCode]));
		ticket = await prisma.ticket.findFirst({
			where: { ticketCode: { in: lookupCodes } },
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
						include: { organization: true, sponsors: true },
					},
					ticketType: true,
					order: true,
				},
			});
		}
	}

	if (!ticket && ticketCode) {
		const parsed = parseTicketCode(ticketCode);
		const lookupCodes = Array.from(new Set([ticketCode, parsed.normalizedCode, parsed.passCode]));
		ticket = await prisma.ticket.findFirst({
			where: {
				ticketCode: { in: lookupCodes },
			},
			include: {
				event: {
					include: { organization: true, sponsors: true },
				},
				ticketType: true,
				order: true,
			},
		});
	}

	if (!ticket) {
		let isTransferred = false;
		if (token) {
			const verified = verifyTicketToken(token);
			if (verified) {
				const existing = await prisma.ticket.findUnique({
					where: { id: verified.ticketId },
				});
				if (existing && existing.ticketCode !== verified.ticketCode) {
					isTransferred = true;
				}
			}
		}

		if (!isTransferred && ticketCode) {
			try {
				const parsed = parseTicketCode(ticketCode);
				const lookupCodes = Array.from(
					new Set([ticketCode, parsed.normalizedCode, parsed.passCode]),
				);
				const transferLog = await prisma.activityLog.findFirst({
					where: {
						action: "ticket_transferred",
						OR: lookupCodes.map((code) => ({
							metadata: {
								path: ["oldTicketCode"],
								equals: code,
							},
						})),
					},
				});
				if (transferLog) {
					isTransferred = true;
				}
			} catch {
				// Fallthrough
			}
		}

		if (isTransferred) {
			return (
				<div className="min-h-[70vh] flex items-center justify-center p-6">
					<div className="w-full max-w-md rounded-xl border border-border/70 bg-card">
						<EmptyState
							variant="invalid"
							title="Ticket Pass Transferred"
							description="This ticket was transferred to another recipient. The original pass and QR code have been invalidated."
							className="py-12"
						/>
					</div>
				</div>
			);
		}

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

	return (
		<div className="min-h-screen text-foreground flex flex-col selection:bg-primary/20 relative">
			{/* Floating Back Link */}
			<Link
				href={`/${organization.slug}/event/${event.slug}`}
				className="fixed top-4 left-4 z-50 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/95 backdrop-blur-md border border-border/60 text-xs font-semibold text-foreground hover:bg-card transition-all shadow-md print:hidden"
			>
				<ArrowLeft className="size-3.5 text-primary" />
				Back to event
			</Link>

			{/* Content Area */}
			<div className="flex-1 relative flex flex-col items-center justify-center min-w-0 print:block">

				<main className="max-w-4xl w-full mx-auto px-4 py-10 sm:py-14 flex flex-col items-center gap-6 relative z-10 print:py-0 print:px-0 print:m-0">
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
							venueName: event.venueName,
							venueAddress: event.venueAddress,
							venueCity: event.venueCity,
							venueCountry: event.venueCountry,
							latitude: event.latitude,
							longitude: event.longitude,
							isVirtual: event.isVirtual,
							virtualLink: event.virtualLink,
							sponsors: (event.sponsors as any[])?.map((s: any) => ({
								id: s.id,
								name: s.name,
								logo: s.logo,
							})) || [],
						}}
						organization={{
							name: organization.name,
							logoUrl: organization.logoUrl,
							websiteUrl: organization.websiteUrl,
						}}
					/>
				</main>
			</div>

			{/* Footer */}
			<footer className="border-t border-border/60 bg-card py-6 mt-auto print:hidden relative z-10">
				<PoweredByFooter />
			</footer>
		</div>
	);
}
