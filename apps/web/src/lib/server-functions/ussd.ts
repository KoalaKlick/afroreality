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
 * Enables USSD for an event by generating a unique 3-digit extension code.
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

		// Generate a unique 3-digit extension code (100 to 999)
		let newCode: string | null = null;
		let attempts = 0;

		while (!newCode && attempts < 50) {
			const candidate = Math.floor(Math.random() * 900) + 100;
			const strCandidate = candidate.toString();

			const existing = await prisma.event.findFirst({
				where: { ussdCode: strCandidate },
				select: { id: true },
			});

			if (!existing) {
				newCode = strCandidate;
			}
			attempts++;
		}

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
