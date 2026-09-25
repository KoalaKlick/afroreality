"use server";

import { prisma } from "@repo/db";
import { revalidatePath } from "next/cache";
import { serializeJsonSafe } from "../utils";
import { requireEventRole, requireOrgRole } from "./auth-helpers";
import { requireSession } from "@/lib/session";
import { logEventActivity } from "@/lib/audit/audit-logger";
import { paystack } from "../paystack";

/**
 * Event types that collect money (tickets / votes). Standard events are free
 * listings and never require a payout account to publish.
 */
const PAID_EVENT_TYPES = ["ticketed", "hybrid", "voting"];

/**
 * Server-side enforcement of:
 * 1. Payout account activated before publishing (FIRST check).
 * 2. Refundable commitment deposit paid before publishing (SECOND check).
 *
 * This lives on the server so rules cannot be bypassed from the client.
 */
async function assertCanPublish(eventId: string, newStatus?: string): Promise<void> {
	if (newStatus !== "published") return;

	const event = await prisma.event.findUnique({
		where: { id: eventId },
		select: {
			id: true,
			type: true,
			organizationId: true,
			organization: {
				select: {
					subaccountCode: true,
					paystackAccountNumber: true,
				},
			},
		},
	});

	if (!event) throw new Error("Event not found");

	// Step 1: Payout account gate FIRST
	const isPaidEvent = PAID_EVENT_TYPES.includes(event.type);
	const hasPayoutActivated = !!(event.organization?.subaccountCode || event.organization?.paystackAccountNumber);
	if (isPaidEvent && !hasPayoutActivated) {
		throw new Error(
			"Please verify and add a payout account in your organization settings before publishing a paid event.",
		);
	}

	// Step 2: Refundable security deposit gate SECOND (Only after payout account is satisfied)
	const depositReq = await checkEventDepositRequirement({
		eventId: event.id,
		organizationId: event.organizationId,
	});

	if (depositReq.required) {
		throw new Error(
			`A refundable commitment deposit of GHS ${Number(depositReq.amount || 100).toFixed(2)} is required before publishing. Please complete the deposit payment.`,
		);
	}
}

export async function createNewEvent({ data }: { data: any }) {
	const session = await requireSession();
	let organizationId = data.organizationId;

	if (!organizationId) {
		const membership = await prisma.teamMember.findFirst({
			where: { userId: session.userId },
			select: { organizationId: true },
		});
		organizationId = membership?.organizationId;
	}

	if (!organizationId) {
		throw new Error(
			"Please create or select an organization before creating events.",
		);
	}

	const { session: _session } = await requireOrgRole(organizationId, [
		"owner",
		"admin",
	]);

	// Sanitize slug
	let slug = (data.slug || data.title || "event")
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9-]/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");

	if (!slug) slug = "event-" + Math.random().toString(36).substring(2, 7);

	// Check if slug exists in org
	const existing = await prisma.event.findUnique({
		where: {
			organizationId_slug: {
				organizationId,
				slug,
			},
		},
		select: { id: true },
	});

	if (existing) {
		slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
	}

	// Filter valid sponsors/social links
	const validSponsors = Array.isArray(data.sponsors)
		? data.sponsors
			.filter((s: any) => s && s.name && s.name.trim())
			.map((s: any) => ({
				name: s.name.trim(),
				logo: s.logo || null,
			}))
		: [];

	const validSocialLinks = Array.isArray(data.socialLinks)
		? data.socialLinks
			.filter((s: any) => s && s.url && s.url.trim())
			.map((s: any) => ({
				url: s.url.trim(),
			}))
		: [];

	const validGalleryLinks = Array.isArray(data.galleryLinks)
		? data.galleryLinks
			.filter((g: any) => g && g.name && g.url && g.url.trim())
			.map((g: any) => ({
				name: g.name.trim(),
				url: g.url.trim(),
			}))
		: [];

	const event = await prisma.event.create({
		data: {
			organizationId,
			creatorId: session.userId,
			title: (data.title || "Untitled Event").trim(),
			slug,
			type: data.type || "ticketed",
			category: data.category || null,
			tags: Array.isArray(data.tags) ? data.tags : [],
			description: data.description || null,
			startDate: data.startDate ? new Date(data.startDate) : null,
			endDate: data.endDate ? new Date(data.endDate) : null,
			timezone: data.timezone || "Africa/Accra",
			isPublic: data.isPublic ?? true,
			flierImage: data.flierImage || null,
			bannerImage: data.bannerImage || null,
			venueName: data.venueName || null,
			venueAddress: data.venueAddress || null,
			venueCity: data.venueCity || null,
			venueCountry: data.venueCountry || "Ghana",
			latitude: data.latitude !== undefined && data.latitude !== null ? Number(data.latitude) : null,
			longitude: data.longitude !== undefined && data.longitude !== null ? Number(data.longitude) : null,
			isVirtual: data.isVirtual ?? false,
			virtualLink: data.virtualLink || null,
			maxAttendees: data.maxAttendees ? Number(data.maxAttendees) : null,
			hasUssd: data.hasUssd ?? false,
			ussdCode: data.ussdCode || null,
			sponsors: validSponsors.length > 0 ? { create: validSponsors } : undefined,
			socialLinks:
				validSocialLinks.length > 0 ? { create: validSocialLinks } : undefined,
			galleryLinks:
				validGalleryLinks.length > 0 ? { create: validGalleryLinks } : undefined,
		},
		include: { sponsors: true, socialLinks: true, galleryLinks: true },
	});

	revalidatePath("/my-events");
	revalidatePath("/dashboard");

	return serializeJsonSafe(event);
}

export async function updateExistingEvent({ data }: { data: any }) {
	const { session, event } = await requireEventRole(data.id, ["owner", "admin"]);

	// If this update transitions the event to published, enforce the payout gate.
	if (data.status === "published") {
		await assertCanPublish(data.id, "published");
	}

	const { id, startDate, endDate, sponsors, socialLinks, galleryLinks, ...rest } = data;

	const updated = await prisma.event.update({
		where: { id },
		data: {
			...rest,
			...(data.status === "published" ? { publishedAt: new Date() } : {}),
			startDate: startDate ? new Date(startDate) : undefined,
			endDate: endDate ? new Date(endDate) : undefined,
			sponsors: sponsors ? { deleteMany: {}, create: sponsors } : undefined,
			socialLinks: socialLinks ? { deleteMany: {}, create: socialLinks } : undefined,
			galleryLinks: galleryLinks ? { deleteMany: {}, create: galleryLinks } : undefined,
		},
		include: { sponsors: true, socialLinks: true, galleryLinks: true },
	});

	await logEventActivity({
		eventId: id,
		organizationId: event.organizationId,
		userId: session.userId,
		action: data.status ? "event_status_changed" : "event_updated",
		entityType: "event",
		entityId: id,
		description: data.status
			? `Changed event status to "${data.status}"`
			: `Updated event details for "${updated.title}"`,
		metadata: {
			eventId: id,
			eventTitle: updated.title,
			updatedFields: Object.keys(rest),
		},
	});

	revalidatePath("/my-events");
	revalidatePath(`/my-events/${id}`);
	return serializeJsonSafe(updated);
}

export async function changeEventStatus({
	data,
}: {
	data: { id: string; status: any };
}) {
	const { session, event } = await requireEventRole(data.id, ["owner", "admin"]);

	// Publishing an event requires the organization payout account to be set up.
	if (data.status === "published") {
		await assertCanPublish(data.id, "published");
	}

	const updated = await prisma.event.update({
		where: { id: data.id },
		data: {
			status: data.status,
			publishedAt: data.status === "published" ? new Date() : undefined,
		},
	});

	await logEventActivity({
		eventId: data.id,
		organizationId: event.organizationId,
		userId: session.userId,
		action: "event_status_changed",
		entityType: "event",
		entityId: data.id,
		description: `Changed event status to "${data.status}"`,
		metadata: {
			eventId: data.id,
			status: data.status,
		},
	});

	revalidatePath("/my-events");
	revalidatePath(`/my-events/${data.id}`);
	return serializeJsonSafe(updated);
}

export async function deleteExistingEvent({
	data,
}: {
	data: { id: string };
}) {
	await requireEventRole(data.id, ["owner", "admin"]);
	const evt = await prisma.event.findUnique({
		where: { id: data.id },
		select: { status: true },
	});
	if (!evt) throw new Error("Event not found");
	if (evt.status !== "draft") throw new Error("Only draft events can be deleted");

	await prisma.event.delete({ where: { id: data.id } });

	revalidatePath("/my-events");
	revalidatePath("/dashboard");
	return { success: true };
}

/**
 * Loads dynamic event deposit rules configured by Super Admin (falls back to defaults).
 */
export async function getDynamicEventDepositRules() {
	try {
		const setting = await prisma.platformSetting.findUnique({
			where: { key: "event_deposit_rules" },
		});
		if (setting?.value && typeof setting.value === "object") {
			const v = setting.value as any;
			return {
				enabled: typeof v.enabled === "boolean" ? v.enabled : true,
				amount: typeof v.amount === "number" && v.amount > 0 ? Number(v.amount) : 100,
				scope: v.scope === "every_event" ? ("every_event" as const) : ("first_event_only" as const),
				refundWindowDays: typeof v.refundWindowDays === "number" && v.refundWindowDays > 0 ? Number(v.refundWindowDays) : 2,
			};
		}
	} catch (e) {
		console.warn("[EVENT-DEPOSIT-RULES-FETCH-WARN]", e);
	}
	return {
		enabled: true,
		amount: 100,
		scope: "first_event_only" as const,
		refundWindowDays: 2,
	};
}

/**
 * Checks whether an event requires a refundable security deposit before publishing.
 * Prioritizes payout setup first, then evaluates deposit rules.
 */
export async function checkEventDepositRequirement(data: {
	eventId: string;
	organizationId?: string;
}): Promise<{
	required: boolean;
	amount?: number;
	refundWindowDays?: number;
	currency?: string;
	reason?: string;
	paid?: boolean;
	paymentId?: string;
}> {
	const rules = await getDynamicEventDepositRules();

	if (!rules.enabled) {
		return { required: false, reason: "disabled" };
	}

	let orgId = data.organizationId;
	if (!orgId) {
		const ev = await prisma.event.findUnique({
			where: { id: data.eventId },
			select: { organizationId: true },
		});
		orgId = ev?.organizationId;
	}

	// 1. Check if deposit is already paid for this specific event
	const eventDeposit = await prisma.payment.findFirst({
		where: {
			status: "completed",
			metadata: { path: ["eventId"], equals: data.eventId },
		},
	});

	if (eventDeposit && (eventDeposit.metadata as any)?.isEventDeposit === true) {
		return {
			required: false,
			paid: true,
			paymentId: eventDeposit.id,
			reason: "already_paid",
		};
	}

	// 2. If scope is "first_event_only", check if the organization has already paid an event deposit or published previously
	if (rules.scope === "first_event_only" && orgId) {
		// Check prior completed deposit payments for this org
		const priorDeposit = await prisma.payment.findFirst({
			where: {
				status: "completed",
				metadata: { path: ["organizationId"], equals: orgId },
			},
		});

		if (priorDeposit && (priorDeposit.metadata as any)?.isEventDeposit === true) {
			return {
				required: false,
				reason: "exempt_first_event_only",
			};
		}

		// Also check if the organization has any prior published/live events
		const priorPublished = await prisma.event.findFirst({
			where: {
				organizationId: orgId,
				status: { in: ["published", "ongoing", "ended"] },
				id: { not: data.eventId },
			},
			select: { id: true },
		});

		if (priorPublished) {
			return {
				required: false,
				reason: "exempt_prior_events_exist",
			};
		}
	}

	return {
		required: true,
		amount: rules.amount,
		refundWindowDays: rules.refundWindowDays,
		currency: "GHS",
	};
}

/**
 * Initiates a Paystack checkout transaction for the event's refundable security deposit.
 */
export async function initializeEventDepositPayment(data: {
	eventId: string;
}): Promise<{
	success: boolean;
	authorizationUrl?: string;
	reference?: string;
	accessCode?: string;
	amount?: number;
	error?: string;
}> {
	try {
		const { session, event } = await requireEventRole(data.eventId, ["owner", "admin"]);

		const depReq = await checkEventDepositRequirement({
			eventId: data.eventId,
			organizationId: event.organizationId,
		});

		if (!depReq.required) {
			return {
				success: false,
				error: "A refundable deposit is not required for this event.",
			};
		}

		const amount = depReq.amount || 100;
		const reference = `DEP-${event.id.replace(/-/g, "").slice(0, 8)}-${Date.now()}`;

		const org = await prisma.organization.findUnique({
			where: { id: event.organizationId },
			select: { id: true, name: true, slug: true, contactEmail: true },
		});

		const user = await prisma.profile.findUnique({
			where: { id: session.userId },
			select: { email: true, fullName: true },
		});

		const email = user?.email || org?.contactEmail || "organizer@fextiva.com";

		// 1. Create Pending Payment Record with isEventDeposit: true
		await prisma.payment.create({
			data: {
				reference,
				userId: session.userId,
				email,
				purpose: "wallet_topup",
				amount,
				currency: "GHS",
				provider: "paystack",
				status: "pending",
				metadata: {
					isEventDeposit: true,
					depositStatus: "held",
					eventId: event.id,
					eventTitle: event.title,
					organizationId: event.organizationId,
					organizationName: org?.name || "Organization",
					userId: session.userId,
					refundWindowDays: depReq.refundWindowDays || 2,
				},
			},
		});

		// 2. Initialize Paystack Transaction
		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fextiva.com";
		const callbackUrl = `${baseUrl.replace(/\/$/, "")}/my-events/${event.id}?deposit_ref=${reference}`;

		const paystackRes = await paystack.transaction.initialize({
			email,
			amount: Math.round(amount * 100),
			currency: "GHS",
			callback_url: callbackUrl,
			metadata: {
				isEventDeposit: true,
				depositStatus: "held",
				eventId: event.id,
				eventTitle: event.title,
				organizationId: event.organizationId,
				organizationName: org?.name,
				custom_fields: [
					{
						display_name: "Deposit Type",
						variable_name: "deposit_type",
						value: "Refundable Event Security Deposit",
					},
					{
						display_name: "Event Title",
						variable_name: "event_title",
						value: event.title,
					},
				],
			},
		});

		if (!paystackRes.status || !paystackRes.data?.authorization_url) {
			return {
				success: false,
				error: paystackRes.message || "Failed to initialize Paystack deposit payment.",
			};
		}

		return {
			success: true,
			authorizationUrl: paystackRes.data.authorization_url,
			reference,
			accessCode: paystackRes.data.access_code,
			amount,
		};
	} catch (err: any) {
		console.error("[INIT_EVENT_DEPOSIT_PAYMENT_ERROR]", err);
		return { success: false, error: err?.message || "Failed to initialize deposit payment." };
	}
}

/**
 * Verifies that a refundable security deposit was successfully paid on Paystack.
 */
export async function verifyEventDepositPayment(data: {
	reference: string;
	eventId: string;
}): Promise<{
	success: boolean;
	alreadyCompleted?: boolean;
	message?: string;
	error?: string;
}> {
	try {
		const { session, event } = await requireEventRole(data.eventId, ["owner", "admin"]);

		const payment = await prisma.payment.findUnique({
			where: { reference: data.reference },
		});

		if (!payment) {
			return { success: false, error: "Payment record not found." };
		}

		if (payment.status === "completed") {
			return { success: true, alreadyCompleted: true, message: "Deposit already verified." };
		}

		const verifyRes = await paystack.transaction.verify(data.reference);
		if (!verifyRes.status || verifyRes.data?.status !== "success") {
			return {
				success: false,
				error: verifyRes.message || "Deposit transaction was not successful on Paystack.",
			};
		}

		const now = new Date();
		const currentMeta = (payment.metadata as any) || {};

		await prisma.payment.update({
			where: { id: payment.id },
			data: {
				status: "completed",
				verifiedAt: now,
				providerReference: String(verifyRes.data.id || ""),
				paystackTransactionId: String(verifyRes.data.id || ""),
				providerResponse: verifyRes.data,
				metadata: {
					...currentMeta,
					depositStatus: "held",
					verifiedAt: now.toISOString(),
					paidAt: verifyRes.data.paid_at || now.toISOString(),
					channel: verifyRes.data.channel,
					currency: verifyRes.data.currency,
				},
			},
		});

		await logEventActivity({
			eventId: data.eventId,
			organizationId: event.organizationId,
			userId: session.userId,
			action: "event_deposit_paid",
			entityType: "event",
			entityId: data.eventId,
			description: `Paid refundable event security deposit of GHS ${Number(payment.amount).toFixed(2)}`,
			metadata: {
				reference: data.reference,
				amount: Number(payment.amount),
				depositStatus: "held",
			},
		});

		revalidatePath(`/my-events/${data.eventId}`);
		revalidatePath("/super/deposits");

		return {
			success: true,
			message: "Security deposit confirmed successfully.",
		};
	} catch (err: any) {
		console.error("[VERIFY_EVENT_DEPOSIT_ERROR]", err);
		return { success: false, error: err?.message || "Failed to verify deposit payment." };
	}
}

