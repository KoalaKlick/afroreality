import { headers } from "next/headers";
import { prisma } from "@repo/db";

/**
 * Extracts the client machine IP address from incoming request headers.
 * Looks through standard proxy headers: x-forwarded-for, x-real-ip, cf-connecting-ip.
 */
export async function getClientIp(): Promise<string | null> {
	try {
		const h = await headers();
		const forwarded = h.get("x-forwarded-for");
		if (forwarded) {
			// In case of multiple proxies, client IP is the first entry
			const clientIp = forwarded.split(",")[0]?.trim();
			if (clientIp) return clientIp;
		}
		const realIp = h.get("x-real-ip");
		if (realIp) return realIp.trim();

		const cfIp = h.get("cf-connecting-ip");
		if (cfIp) return cfIp.trim();

		const trueClientIp = h.get("true-client-ip");
		if (trueClientIp) return trueClientIp.trim();

		return null;
	} catch {
		return null;
	}
}

/**
 * Extracts the user agent string from incoming request headers.
 */
export async function getUserAgent(): Promise<string | null> {
	try {
		const h = await headers();
		return h.get("user-agent") || null;
	} catch {
		return null;
	}
}

export interface LogEventActivityParams {
	eventId: string;
	organizationId?: string | null;
	userId?: string | null;
	action: string;
	entityType: "nominee" | "event" | "category" | "ticket" | "member" | "payout";
	entityId?: string | null;
	description: string;
	metadata?: Record<string, any> | null;
}

/**
 * Records an activity log for an event, automatically capturing the machine IP and user agent.
 */
export async function logEventActivity({
	eventId,
	organizationId,
	userId,
	action,
	entityType,
	entityId,
	description,
	metadata,
}: LogEventActivityParams) {
	try {
		const [ipAddress, userAgent] = await Promise.all([
			getClientIp(),
			getUserAgent(),
		]);

		// If organizationId was not provided, look it up from the event
		let finalOrgId = organizationId;
		if (!finalOrgId && eventId) {
			const evt = await prisma.event.findUnique({
				where: { id: eventId },
				select: { organizationId: true },
			});
			if (evt) finalOrgId = evt.organizationId;
		}

		await prisma.activityLog.create({
			data: {
				organizationId: finalOrgId || null,
				userId: userId || null,
				action,
				entityType,
				entityId: entityId || eventId,
				description,
				metadata: {
					eventId,
					...(metadata || {}),
				},
				ipAddress: ipAddress || null,
				userAgent: userAgent || null,
			},
		});
	} catch (error) {
		// Activity logging should never crash the primary business operation
		console.error("[EVENT-AUDIT-LOG-ERROR]", error);
	}
}
