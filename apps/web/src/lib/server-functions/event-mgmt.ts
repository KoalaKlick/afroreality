"use server";

import { prisma } from "@repo/db";
import { revalidatePath } from "next/cache";
import { serializeJsonSafe } from "../utils";
import { requireEventRole, requireOrgRole } from "./auth-helpers";
import { requireSession } from "@/lib/session";

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
	await requireEventRole(data.id, ["owner", "admin"]);
	const { id, startDate, endDate, sponsors, socialLinks, galleryLinks, ...rest } = data;

	const updated = await prisma.event.update({
		where: { id },
		data: {
			...rest,
			startDate: startDate ? new Date(startDate) : undefined,
			endDate: endDate ? new Date(endDate) : undefined,
			sponsors: sponsors ? { deleteMany: {}, create: sponsors } : undefined,
			socialLinks: socialLinks ? { deleteMany: {}, create: socialLinks } : undefined,
			galleryLinks: galleryLinks ? { deleteMany: {}, create: galleryLinks } : undefined,
		},
		include: { sponsors: true, socialLinks: true, galleryLinks: true },
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
	await requireEventRole(data.id, ["owner", "admin"]);
	const updated = await prisma.event.update({
		where: { id: data.id },
		data: {
			status: data.status,
			publishedAt: data.status === "published" ? new Date() : undefined,
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
