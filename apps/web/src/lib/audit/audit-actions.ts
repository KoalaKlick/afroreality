"use server";

import { prisma } from "@repo/db";
import { requireSession } from "@/lib/session";
import { serializeJsonSafe } from "@/lib/utils";

export interface EventAuditLogItem {
	id: string;
	action: string;
	entityType: string;
	entityId: string | null;
	description: string;
	metadata: any;
	ipAddress: string | null;
	userAgent: string | null;
	createdAt: string | Date;
	user?: {
		id: string;
		fullName: string | null;
		email: string;
		avatarUrl: string | null;
	} | null;
}

/**
 * Retrieves the audit trail activity logs for a specific event.
 * This is a server action so it can be safely called from client components.
 */
export async function getEventAuditTrail(
	eventId: string,
	options: { limit?: number } = {},
): Promise<EventAuditLogItem[]> {
	await requireSession();
	if (!eventId) return [];

	const limit = options.limit ?? 100;

	const logs = await prisma.activityLog.findMany({
		where: {
			OR: [
				{ entityId: eventId },
				{ metadata: { path: ["eventId"], equals: eventId } },
			],
		},
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
		orderBy: { createdAt: "desc" },
		take: limit,
	});

	return serializeJsonSafe(logs);
}
