"use server";

import { prisma } from "@repo/db";
import { requireSession } from "../session";
import type { SessionPayload } from "../types/auth";

export type AllowedRole = "owner" | "admin" | "member";

export async function checkMembership(
	userId: string,
	organizationId: string,
	requiredRoles: AllowedRole[] | null = null,
): Promise<{ role: string; isOwner: boolean } | null> {
	if (!userId || !organizationId) return null;

	const org = await prisma.organization.findUnique({
		where: { id: organizationId },
		select: { id: true, createdBy: true },
	});

	if (!org) return null;

	const isCreator = org.createdBy === userId;

	const membership = await prisma.teamMember.findUnique({
		where: {
			organizationId_userId: {
				organizationId,
				userId,
			},
		},
		select: { role: true },
	});

	const effectiveRole = (membership?.role || (isCreator ? "owner" : null)) as AllowedRole | null;

	if (!effectiveRole) return null;

	if (requiredRoles && requiredRoles.length > 0) {
		const isRoleAllowed =
			requiredRoles.includes(effectiveRole) ||
			(isCreator && requiredRoles.includes("owner"));

		if (!isRoleAllowed) return null;
	}

	return {
		role: effectiveRole,
		isOwner: effectiveRole === "owner" || isCreator,
	};
}

export async function requireOrgRole(
	organizationId: string,
	requiredRoles: AllowedRole[] = ["owner", "admin"],
): Promise<{ session: SessionPayload; role: string; isOwner: boolean }> {
	const session = await requireSession();
	const result = await checkMembership(session.userId, organizationId, requiredRoles);

	if (!result) {
		throw new Error(
			`Unauthorized: You do not have the required permissions (${requiredRoles.join(
				", ",
			)}) for this organization.`,
		);
	}

	return {
		session,
		role: result.role,
		isOwner: result.isOwner,
	};
}

export async function requireEventRole(
	eventId: string,
	requiredRoles: AllowedRole[] = ["owner", "admin"],
): Promise<{ session: SessionPayload; role: string; event: any }> {
	const session = await requireSession();

	const event = await prisma.event.findUnique({
		where: { id: eventId },
		select: { id: true, organizationId: true, title: true },
	});

	if (!event) {
		throw new Error("Event not found.");
	}

	const result = await checkMembership(session.userId, event.organizationId, requiredRoles);

	if (!result) {
		throw new Error(
			`Unauthorized: You do not have permissions to manage this event.`,
		);
	}

	return {
		session,
		role: result.role,
		event,
	};
}
