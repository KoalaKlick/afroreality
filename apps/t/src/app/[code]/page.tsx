import type { Metadata } from "next";
import { prisma } from "@repo/db";
import { redirect } from "next/navigation";

interface ShortTicketPageProps {
  params: Promise<{ code: string }>;
}

function normalizeCode(raw: string): { clean: string; lookupCodes: string[] } {
  const clean = (raw || "").trim().toUpperCase();
  const lookupCodes = [clean];

  // If 11 chars unhyphenated (E7K2M9M4P10) -> also lookup E7K2M-9M4P10
  const match = clean.match(/^([2-9A-Z]{5})([2-9A-Z]{6})$/);
  if (match) {
    lookupCodes.push(`${match[1]}-${match[2]}`);
  }

  // If 12 chars hyphenated (E7K2M-9M4P10) -> also lookup E7K2M9M4P10
  const hypMatch = clean.match(/^([2-9A-Z]{5})-([2-9A-Z]{6})$/);
  if (hypMatch) {
    lookupCodes.push(`${hypMatch[1]}${hypMatch[2]}`);
  }

  return { clean, lookupCodes };
}

export async function generateMetadata({ params }: ShortTicketPageProps): Promise<Metadata> {
  const { code } = await params;
  const { lookupCodes } = normalizeCode(code);

  try {
    const ticket = await prisma.ticket.findFirst({
      where: { ticketCode: { in: lookupCodes } },
      include: { event: true, ticketType: true },
    });

    if (!ticket || !ticket.event) {
      return {
        title: "Admission Ticket Pass | Fextiva",
        description: "Official admission pass verified on Fextiva.",
      };
    }

    const { event } = ticket;
    const rawImage = event.flierImage || event.bannerImage;
    const ogImage = rawImage
      ? rawImage.startsWith("http")
        ? rawImage
        : `https://fextiva.com${rawImage.startsWith("/") ? "" : "/"}${rawImage}`
      : undefined;

    const venueStr = event.isVirtual
      ? "Virtual / Online Event"
      : [event.venueName, event.venueCity].filter(Boolean).join(", ");

    return {
      title: `${event.title} — Official Pass | Fextiva`,
      description: `Official admission pass for ${event.title}${venueStr ? ` · ${venueStr}` : ""}. Tap to view your ticket.`,
      openGraph: {
        title: `${event.title} — Official Ticket Pass`,
        description: `Official admission pass for ${event.title}${venueStr ? ` · ${venueStr}` : ""}. Tap to view.`,
        type: "website",
        ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630 }] } : {}),
      },
      twitter: {
        card: ogImage ? "summary_large_image" : "summary",
        title: `${event.title} — Official Ticket Pass`,
        description: `Official admission pass for ${event.title}. Tap to view.`,
        ...(ogImage ? { images: [ogImage] } : {}),
      },
    };
  } catch (err) {
    // Graceful fallback if database is not configured
    return {
      title: "Admission Ticket Pass | Fextiva",
      description: "Official admission pass verified on Fextiva.",
    };
  }
}

export default async function ShortTicketPage({ params }: ShortTicketPageProps) {
  const { code } = await params;
  const { clean } = normalizeCode(code);

  const mainAppUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://fextiva.com").replace(/\/+$/, "");
  const targetUrl = `${mainAppUrl}/ticket/view?code=${encodeURIComponent(clean)}`;

  // Immediate redirect for browser visitors
  redirect(targetUrl);
}

