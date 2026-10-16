"use server";

import { prisma } from "@repo/db";
import { requireSession } from "@/lib/session";
import { checkMembership } from "./auth-helpers";
import { revalidatePath } from "next/cache";

export interface EnableUssdResult {
	success: boolean;
	data?: {
		hasUssd: boolean;
		ussdCode: string;
	};
	error?: string;
}

/**
 * Generates the next available USSD extension code.
 * Prioritizes 2-digit codes from "01" to "99".
 * If all 01-99 codes are allocated, jumps to 3-digit codes (100-999), and then 4-digit codes.
 */
export async function generateAvailableUssdCode(): Promise<string | null> {
	const events = await prisma.event.findMany({
		where: { ussdCode: { not: null } },
		select: { ussdCode: true },
	});

	const allocated = new Set<string>();
	for (const ev of events) {
		if (ev.ussdCode) {
			const clean = ev.ussdCode.trim();
			allocated.add(clean);
			const parsed = Number.parseInt(clean, 10);
			if (!Number.isNaN(parsed)) {
				allocated.add(parsed.toString());
				if (parsed < 100) {
					allocated.add(parsed.toString().padStart(2, "0"));
				}
			}
		}
	}

	// 1. Try 2-digit codes from "01" to "99"
	for (let i = 1; i <= 99; i++) {
		const code = i.toString().padStart(2, "0");
		if (!allocated.has(code)) {
			return code;
		}
	}

	// 2. If all 01-99 are allocated, jump to 3-digit codes (100 to 999)
	for (let i = 100; i <= 999; i++) {
		const code = i.toString();
		if (!allocated.has(code)) {
			return code;
		}
	}

	// 3. Fallback to 4-digit codes (1000 to 9999)
	for (let i = 1000; i <= 9999; i++) {
		const code = i.toString();
		if (!allocated.has(code)) {
			return code;
		}
	}

	return null;
}

/**
 * Enables USSD for an event by generating an available USSD extension code (2 digits "01"-"99", then 3 digits).
 */
export async function enableUssdForEvent(eventId: string): Promise<EnableUssdResult> {
	try {
		const session = await requireSession();
		if (!session?.userId) {
			return { success: false, error: "Unauthorized. Please log in." };
		}

		// Find the event and check organization membership
		const event = await prisma.event.findUnique({
			where: { id: eventId },
			select: {
				id: true,
				slug: true,
				organizationId: true,
				hasUssd: true,
				ussdCode: true,
				organization: {
					select: {
						id: true,
						slug: true,
					},
				},
			},
		});

		if (!event) {
			return { success: false, error: "Event not found." };
		}

		const membership = await checkMembership(session.userId, event.organizationId);
		if (!membership) {
			return {
				success: false,
				error: "You do not have permission to modify this event.",
			};
		}

		// If event already has USSD active with a code, return it
		if (event.hasUssd && event.ussdCode) {
			return {
				success: true,
				data: {
					hasUssd: true,
					ussdCode: event.ussdCode,
				},
			};
		}

		// Generate the next available USSD extension code (2 digits "01"-"99", then 3 digits)
		const newCode = await generateAvailableUssdCode();

		if (!newCode) {
			return {
				success: false,
				error: "All USSD extension codes are currently allocated. Please contact support.",
			};
		}

		// Update event in database
		await prisma.event.update({
			where: { id: eventId },
			data: {
				hasUssd: true,
				ussdCode: newCode,
			},
		});

		if (event.organization?.slug && event.slug) {
			revalidatePath(`/${event.organization.slug}/event/${event.slug}`);
		}
		revalidatePath(`/dashboard/events/${eventId}`);
		revalidatePath(`/my-events/${eventId}`);

		return {
			success: true,
			data: {
				hasUssd: true,
				ussdCode: newCode,
			},
		};
	} catch (error: any) {
		console.error("[USSD] Error enabling USSD:", error);
		return {
			success: false,
			error: error?.message || "An unexpected error occurred while activating USSD.",
		};
	}
}

/**
 * Disables USSD channel for an event.
 */
export async function disableUssdForEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
	try {
		const session = await requireSession();
		if (!session?.userId) {
			return { success: false, error: "Unauthorized. Please log in." };
		}

		const event = await prisma.event.findUnique({
			where: { id: eventId },
			select: {
				id: true,
				slug: true,
				organizationId: true,
				organization: {
					select: {
						slug: true,
					},
				},
			},
		});

		if (!event) {
			return { success: false, error: "Event not found." };
		}

		const membership = await checkMembership(session.userId, event.organizationId);
		if (!membership) {
			return {
				success: false,
				error: "You do not have permission to modify this event.",
			};
		}

		await prisma.event.update({
			where: { id: eventId },
			data: {
				hasUssd: false,
			},
		});

		if (event.organization?.slug && event.slug) {
			revalidatePath(`/${event.organization.slug}/event/${event.slug}`);
		}
		revalidatePath(`/dashboard/events/${eventId}`);

		return { success: true };
	} catch (error: any) {
		console.error("[USSD] Error disabling USSD:", error);
		return {
			success: false,
			error: error?.message || "Failed to disable USSD channel.",
		};
	}
}
