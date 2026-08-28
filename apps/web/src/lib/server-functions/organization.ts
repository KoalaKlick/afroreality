"use server";

import { prisma } from "@repo/db";
import { revalidatePath } from "next/cache";
import { requireSession } from "../session";
import { serializeJsonSafe } from "../utils";
import { requireOrgRole } from "./auth-helpers";

export async function getUserOrganizations(): Promise<any[]> {
	const session = await requireSession();
	const memberships = await prisma.teamMember.findMany({
		where: { userId: session.userId },
		include: {
			organization: {
				include: {
					_count: { select: { team: true } },
					socialLinks: true,
				},
			},
		},
	});

	return serializeJsonSafe(
		memberships.map((m) => ({
			...m.organization,
			role: m.role,
			memberCount: m.organization._count.team,
			socialLinks: m.organization.socialLinks ?? [],
		})),
	);
}

export async function getOrganizationById({
	data,
}: {
	data: { id: string };
}): Promise<any> {
	await requireSession();
	const org = await prisma.organization.findUnique({
		where: { id: data.id },
		include: {
			socialLinks: true,
			team: {
				include: {
					user: {
						select: {
							id: true,
							fullName: true,
							email: true,
							avatarUrl: true,
						},
					},
				},
			},
		},
	});
	return serializeJsonSafe(org);
}

export async function createOrganizationAccount({
	data,
}: {
	data: any;
}): Promise<any> {
	const session = await requireSession();
	const org = await prisma.organization.create({
		data: {
			name: data.name.trim(),
			slug: data.slug.trim(),
			description: data.description || null,
			logoUrl: data.logoUrl || null,
			contactEmail: data.contactEmail || null,
			websiteUrl: data.websiteUrl || null,
			primaryColor: data.primaryColor || "#02a605",
			secondaryColor: data.secondaryColor || "#ffe100",
			tertiaryColor: data.tertiaryColor || "#dc2626",
			createdBy: session.userId,
			team: {
				create: {
					userId: session.userId,
					role: "owner",
				},
			},
		},
	});
	revalidatePath("/organization/manage");
	return serializeJsonSafe(org);
}

export async function updateOrganizationSettings({
	data,
}: {
	data: any;
}): Promise<any> {
	const { id, socialLinks, ...rest } = data;
	await requireOrgRole(id, ["owner", "admin"]);

	const updated = await prisma.$transaction(async (tx) => {
		const org = await tx.organization.update({
			where: { id },
			data: rest,
		});

		if (Array.isArray(socialLinks)) {
			await tx.organizationSocialLink.deleteMany({
				where: { organizationId: id },
			});
			if (socialLinks.length > 0) {
				await tx.organizationSocialLink.createMany({
					data: socialLinks.map((url: string) => ({
						url,
						organizationId: id,
					})),
				});
			}
		}

		return org;
	});

	revalidatePath("/organization/manage");
	return serializeJsonSafe(updated);
}

export async function checkOrgSlug({
	data,
}: {
	data: { slug: string };
}): Promise<{ available: boolean }> {
	const existing = await prisma.organization.findUnique({
		where: { slug: data.slug.toLowerCase().trim() },
	});
	return { available: !existing };
}
