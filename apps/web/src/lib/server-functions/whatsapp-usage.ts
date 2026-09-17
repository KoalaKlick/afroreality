"use server";

import { prisma } from "@repo/db";
import { requirePlatformAdmin } from "@/lib/admin/admin-auth";
import { getFrontendBaseUrl } from "@/lib/utils";

export interface WhatsAppUsageSummary {
	totalSent: number;
	totalDelivered: number;
	totalRead: number;
	totalFailed: number;
	deliveryRate: number;
	billableCount: number;
	estimatedSpendUsd: number;
	categoryBreakdown: {
		utility: number;
		marketing: number;
		service: number;
		other: number;
	};
	recentLogs: Array<{
		id: string;
		messageId: string | null;
		recipientPhone: string;
		templateName: string | null;
		category: string | null;
		status: string;
		isBillable: boolean;
		estimatedCost: number;
		errorMessage: string | null;
		createdAt: string;
	}>;
	webhookConfig: {
		callbackUrl: string;
		verifyToken: string;
		wabaId: string;
		phoneNumberId: string;
		displayPhone: string;
	};
}

export async function getWhatsAppUsageOverview(): Promise<WhatsAppUsageSummary> {
	await requirePlatformAdmin();

	const baseUrl = getFrontendBaseUrl();
	const callbackUrl = `${baseUrl.replace(/\/$/, "")}/api/webhooks/whatsapp`;
	const verifyToken =
		process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ||
		"fextiva_whatsapp_secure_webhook_token_2026";
	const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "1744340760020720";
	const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "1279312171935266";
	const displayPhone = "+233 50 989 7757";

	try {
		const [
			totalCount,
			deliveredCount,
			readCount,
			failedCount,
			billableCount,
			recentLogsRaw,
		] = await Promise.all([
			prisma.whatsAppMessageLog.count(),
			prisma.whatsAppMessageLog.count({ where: { status: "delivered" } }),
			prisma.whatsAppMessageLog.count({ where: { status: "read" } }),
			prisma.whatsAppMessageLog.count({ where: { status: "failed" } }),
			prisma.whatsAppMessageLog.count({ where: { isBillable: true } }),
			prisma.whatsAppMessageLog.findMany({
				take: 25,
				orderBy: { createdAt: "desc" },
			}),
		]);

		const successfulDeliveries = deliveredCount + readCount;
		const deliveryRate =
			totalCount > 0 ? Math.round((successfulDeliveries / totalCount) * 100) : 100;

		// Calculate estimated spend ($0.007 per utility, $0.025 per marketing)
		let estimatedSpendUsd = 0;
		let utilityCount = 0;
		let marketingCount = 0;
		let serviceCount = 0;
		let otherCount = 0;

		recentLogsRaw.forEach((log) => {
			const cat = (log.pricingCategory || log.category || "").toLowerCase();
			if (cat.includes("utility")) utilityCount++;
			else if (cat.includes("marketing")) marketingCount++;
			else if (cat.includes("service")) serviceCount++;
			else otherCount++;

			estimatedSpendUsd += Number(log.estimatedCost || 0.007);
		});

		const recentLogs = recentLogsRaw.map((log) => ({
			id: log.id,
			messageId: log.messageId,
			recipientPhone: log.recipientPhone,
			templateName: log.templateName,
			category: log.category,
			status: log.status,
			isBillable: log.isBillable,
			estimatedCost: Number(log.estimatedCost || 0.007),
			errorMessage: log.errorMessage,
			createdAt: log.createdAt.toISOString(),
		}));

		return {
			totalSent: totalCount,
			totalDelivered: deliveredCount,
			totalRead: readCount,
			totalFailed: failedCount,
			deliveryRate,
			billableCount,
			estimatedSpendUsd: Number(estimatedSpendUsd.toFixed(3)),
			categoryBreakdown: {
				utility: utilityCount,
				marketing: marketingCount,
				service: serviceCount,
				other: otherCount,
			},
			recentLogs,
			webhookConfig: {
				callbackUrl,
				verifyToken,
				wabaId,
				phoneNumberId,
				displayPhone,
			},
		};
	} catch (error) {
		console.error("[WhatsApp Usage] Error aggregating usage stats:", error);
		return {
			totalSent: 0,
			totalDelivered: 0,
			totalRead: 0,
			totalFailed: 0,
			deliveryRate: 100,
			billableCount: 0,
			estimatedSpendUsd: 0,
			categoryBreakdown: { utility: 0, marketing: 0, service: 0, other: 0 },
			recentLogs: [],
			webhookConfig: {
				callbackUrl,
				verifyToken,
				wabaId,
				phoneNumberId,
				displayPhone,
			},
		};
	}
}
