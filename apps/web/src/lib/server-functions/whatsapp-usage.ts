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
				take: 2000,
				orderBy: { createdAt: "desc" },
				select: {
					id: true,
					messageId: true,
					recipientPhone: true,
					templateName: true,
					category: true,
					pricingCategory: true,
					status: true,
					isBillable: true,
					estimatedCost: true,
					errorMessage: true,
					createdAt: true,
				},
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

const GRAPH_API_VERSION = "v20.0";

export interface RegisterTemplateResult {
	success: boolean;
	templateId?: string;
	status?: string; // PENDING | APPROVED | REJECTED
	error?: string;
	raw?: any;
}

/**
 * Submits a WhatsApp message template to Meta for review via the Graph API.
 *
 * Use category "UTILITY" for transactional / notification messages such as
 * nomination confirmations, order receipts, OTP codes, etc.
 *
 * UTILITY templates are cheaper than MARKETING and do NOT require prior
 * opt-in from the recipient for business-initiated messages.
 *
 * Pricing reference (West Africa): UTILITY ≈ $0.007 | MARKETING ≈ $0.025
 */
export async function registerWhatsAppTemplate(templatePayload: {
	name: string;
	language: string;
	category: "UTILITY" | "MARKETING" | "AUTHENTICATION";
	components: object[];
}): Promise<RegisterTemplateResult> {
	await requirePlatformAdmin();

	const token = process.env.WHATSAPP_API_TOKEN;
	const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "1744340760020720";

	if (!token) {
		return { success: false, error: "WHATSAPP_API_TOKEN not configured" };
	}

	try {
		const res = await fetch(
			`https://graph.facebook.com/${GRAPH_API_VERSION}/${wabaId}/message_templates`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(templatePayload),
			},
		);

		const data = await res.json();

		if (!res.ok || data.error) {
			console.error("[WhatsApp] Template registration failed:", data.error);
			return {
				success: false,
				error: data.error?.message || "Template registration failed",
				raw: data,
			};
		}

		console.log(`[WhatsApp] Template "${templatePayload.name}" submitted — id: ${data.id} status: ${data.status}`);
		return { success: true, templateId: data.id, status: data.status, raw: data };
	} catch (err: any) {
		console.error("[WhatsApp] Exception during template registration:", err);
		return { success: false, error: err?.message || "Unknown error" };
	}
}

/**
 * Registers the fextiva_nominee_confirmation_en template as UTILITY.
 *
 * Template spec:
 *   Header:   IMAGE  (event flier sent dynamically at send-time)
 *   Body:     {{1}} nomineeName · {{2}} eventName · {{3}} categoryName · {{4}} votingCode
 *   Button 0: URL "View Event"        → https://fextiva.com/{{1}}
 *   Button 1: URL "Contact Organizer" → https://wa.me/{{1}}
 *   Footer:   "Powering African Events · Fextiva"
 *
 * Category UTILITY → cheapest tier (~$0.007), no marketing opt-in required.
 * Call once from Super Admin → WhatsApp Cloud & Webhooks tab.
 */
export async function registerNomineeConfirmationTemplate(): Promise<RegisterTemplateResult> {
	return registerWhatsAppTemplate({
		name: "fextiva_nominee_confirmation_en",
		language: "en",
		category: "UTILITY",
		components: [
			{
				type: "HEADER",
				format: "IMAGE",
			},
			{
				type: "BODY",
				text: "Hi {{1}},\n\nYou've been nominated for *{{2}}* as *{{3}}*. 🎉\n\nWe're following up to confirm your nomination and keep you updated on the next steps.\n\n📸 Kindly send us a picture to be used for your nomination flyer.\n\n🗳️ *Your Voting Code:* {{4}}\nShare this code with your supporters so they can vote for you on the platform or via USSD.\n\nThank you for participating! 💚",
				example: {
					body_text: [["Tee Jay Kobby", "MUMFORD EXCELLENCE AWARDS 2026", "CEO of the Year", "#BMA01"]],
				},
			},
			{
				type: "BUTTONS",
				buttons: [
					{
						type: "URL",
						text: "View Event",
						url: "https://fextiva.com/{{1}}",
						example: ["mumford-org/event/excellence-awards-2026"],
					},
					{
						type: "URL",
						text: "Contact Organizer",
						url: "https://wa.me/{{1}}",
						example: ["233509897757"],
					},
				],
			},
			{
				type: "FOOTER",
				text: "Powering African Events · Fextiva",
			},
		],
	});
}
