"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/db";
import { requirePlatformAdmin } from "@/lib/admin/admin-auth";
import { getTransporter, getMailSender } from "@/lib/mail/transport";
import { sendSmsMessage } from "@/lib/services/sms";
import {
	renderOrganizerNotificationEmailHtml,
	renderOrganizerNotificationEmailText,
} from "@/lib/email/organizer-notification";
import { getSafeUser } from "@/lib/dal/auth";

export interface NotificationVariableContext {
	organizerName: string;
	recipientName: string;
	organizerEmail: string;
	organizerPhone: string;
	eventName: string;
	eventSlug: string;
	adminName: string;
	adminEmail: string;
	dashboardUrl: string;
	platformName: string;
	currentDate: string;
}

export interface SendAdminNotificationPayload {
	targetAudience: "all" | "active_events" | "selected";
	selectedOrgIds?: string[];
	channels: "email" | "sms" | "both";
	emailSubject: string;
	emailHtml: string;
	emailPreviewText?: string;
	smsMessage: string;
	actionButton?: {
		label: string;
		url: string;
	};
	isTest?: boolean;
	testEmail?: string;
	testPhone?: string;
}

export interface NotificationBroadcastResult {
	success: boolean;
	message: string;
	recipientsCount: number;
	emailSent: number;
	emailFailed: number;
	smsSent: number;
	smsFailed: number;
	errors: string[];
}

export interface BroadcastHistoryItem {
	id: string;
	createdAt: string;
	adminEmail: string;
	subject: string;
	channels: "email" | "sms" | "both";
	targetAudience: string;
	recipientsCount: number;
	emailSent: number;
	smsSent: number;
	snippet: string;
}

export interface NotificationTemplate {
	id: string;
	title: string;
	description: string;
	category: string;
	channels: "email" | "sms" | "both";
	emailSubject: string;
	emailHtml: string;
	smsMessage: string;
	actionButton?: {
		label: string;
		url: string;
	};
}

/**
 * Replaces all supported template tags with values from context.
 * Supports {{identity}}, {{organizer_name}}, {{contact_name}}, etc.
 */
export async function replaceNotificationVariables(
	template: string,
	ctx: NotificationVariableContext
): Promise<string> {
	if (!template) return "";

	const map: Record<string, string> = {
		"{{identity}}": ctx.organizerName || ctx.recipientName || "Valued Organizer",
		"{{organizer_name}}": ctx.organizerName || "Valued Organizer",
		"{{contact_name}}": ctx.recipientName || ctx.organizerName || "Partner",
		"{{organizer_email}}": ctx.organizerEmail || "",
		"{{organizer_phone}}": ctx.organizerPhone || "",
		"{{event_name}}": ctx.eventName || "Your Event",
		"{{event_slug}}": ctx.eventSlug || "",
		"{{admin_name}}": ctx.adminName || "Fextiva Administration",
		"{{admin_email}}": ctx.adminEmail || "support@fextiva.com",
		"{{dashboard_url}}": ctx.dashboardUrl || "https://fextiva.com/dashboard",
		"{{platform_name}}": ctx.platformName || "Fextiva",
		"{{current_date}}": ctx.currentDate,
		// Case insensitive single braces support
		"{identity}": ctx.organizerName || ctx.recipientName || "Valued Organizer",
		"{organizer_name}": ctx.organizerName || "Valued Organizer",
		"{contact_name}": ctx.recipientName || ctx.organizerName || "Partner",
		"{event_name}": ctx.eventName || "Your Event",
		"{admin_name}": ctx.adminName || "Fextiva Administration",
	};

	let result = template;
	for (const [tag, value] of Object.entries(map)) {
		const regex = new RegExp(tag.replace(/([{}])/g, "\\$1"), "gi");
		result = result.replace(regex, value);
	}

	return result;
}

/**
 * Send customized notifications (Email and/or SMS) to organizers.
 */
export async function sendAdminOrganizerNotification(
	payload: SendAdminNotificationPayload
): Promise<NotificationBroadcastResult> {
	try {
		const adminState = await requirePlatformAdmin();
		const adminUser = await getSafeUser(adminState.userId);

		const adminName = adminUser?.fullName || adminState.fullName || "Fextiva Administrator";
		const adminEmail = adminUser?.email || adminState.email || "admin@fextiva.com";
		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fextiva.com";
		const currentDate = new Date().toLocaleDateString("en-US", {
			month: "long",
			day: "numeric",
			year: "numeric",
		});

		// ── TEST SEND MODE ──────────────────────────────────────────────────────────
		if (payload.isTest) {
			const targetEmail = payload.testEmail || adminEmail;
			const targetPhone = payload.testPhone || adminUser?.phone || null;

			const sampleCtx: NotificationVariableContext = {
				organizerName: "Apex Entertainment (Test Preview)",
				recipientName: adminName,
				organizerEmail: targetEmail,
				organizerPhone: targetPhone || "+233240000000",
				eventName: "Accra Summer Music Fest 2026",
				eventSlug: "accra-summer-fest",
				adminName,
				adminEmail,
				dashboardUrl: `${baseUrl}/dashboard`,
				platformName: "Fextiva",
				currentDate,
			};

			const errors: string[] = [];
			let emailSent = 0;
			let smsSent = 0;

			// Send Test Email
			if ((payload.channels === "email" || payload.channels === "both") && targetEmail) {
				try {
					const finalSubject = `[TEST] ${await replaceNotificationVariables(payload.emailSubject, sampleCtx)}`;
					const finalBody = await replaceNotificationVariables(payload.emailHtml, sampleCtx);
					const finalCta = payload.actionButton?.url
						? {
								label: await replaceNotificationVariables(payload.actionButton.label, sampleCtx),
								url: await replaceNotificationVariables(payload.actionButton.url, sampleCtx),
						  }
						: undefined;

					const html = renderOrganizerNotificationEmailHtml({
						subject: finalSubject,
						contentHtml: finalBody,
						organizerName: sampleCtx.organizerName,
						recipientName: sampleCtx.recipientName,
						previewText: payload.emailPreviewText,
						actionButton: finalCta,
						adminName,
						adminEmail,
						platformName: "Fextiva",
					});

					const text = renderOrganizerNotificationEmailText({
						subject: finalSubject,
						contentHtml: finalBody,
						organizerName: sampleCtx.organizerName,
						recipientName: sampleCtx.recipientName,
						actionButton: finalCta,
						adminName,
						platformName: "Fextiva",
					});

					const transporter = getTransporter();
					const sender = getMailSender();

					await transporter.sendMail({
						from: sender.formatted,
						to: targetEmail,
						subject: finalSubject,
						html,
						text,
					});

					emailSent++;
				} catch (err: any) {
					console.error("[AdminNotification] Test email failed:", err);
					errors.push(`Email test failed: ${err.message || String(err)}`);
				}
			}

			// Send Test SMS
			if ((payload.channels === "sms" || payload.channels === "both") && targetPhone) {
				try {
					const finalSms = await replaceNotificationVariables(payload.smsMessage, sampleCtx);
					const res = await sendSmsMessage({
						to: targetPhone,
						message: finalSms,
						purpose: "admin_test_notification",
					});

					if (res.success) {
						smsSent++;
					} else {
						errors.push(`SMS test failed: ${res.error || "Arkesel error"}`);
					}
				} catch (err: any) {
					console.error("[AdminNotification] Test SMS failed:", err);
					errors.push(`SMS test failed: ${err.message || String(err)}`);
				}
			}

			return {
				success: errors.length === 0,
				message:
					errors.length === 0
						? `Test notification sent successfully to ${targetEmail}${targetPhone ? ` and ${targetPhone}` : ""}.`
						: `Test notification completed with issues: ${errors.join("; ")}`,
				recipientsCount: 1,
				emailSent,
				emailFailed: (payload.channels === "email" || payload.channels === "both") && emailSent === 0 ? 1 : 0,
				smsSent,
				smsFailed: (payload.channels === "sms" || payload.channels === "both") && targetPhone && smsSent === 0 ? 1 : 0,
				errors,
			};
		}

		// ── PRODUCTION BROADCAST MODE ───────────────────────────────────────────────
		// Determine which organizers to fetch
		const orgWhere: any = {};
		if (payload.targetAudience === "selected") {
			if (!payload.selectedOrgIds || payload.selectedOrgIds.length === 0) {
				return {
					success: false,
					message: "No organizers selected for this notification broadcast.",
					recipientsCount: 0,
					emailSent: 0,
					emailFailed: 0,
					smsSent: 0,
					smsFailed: 0,
					errors: ["No organizers selected."],
				};
			}
			orgWhere.id = { in: payload.selectedOrgIds };
		} else if (payload.targetAudience === "active_events") {
			orgWhere.events = {
				some: {
					status: { in: ["published", "ongoing"] },
				},
			};
		}

		const organizers = await prisma.organization.findMany({
			where: orgWhere,
			include: {
				creator: {
					select: {
						id: true,
						fullName: true,
						email: true,
						phone: true,
					},
				},
				events: {
					select: {
						id: true,
						title: true,
						slug: true,
						status: true,
					},
					orderBy: { createdAt: "desc" },
					take: 3,
				},
			},
			orderBy: { name: "asc" },
		});

		if (organizers.length === 0) {
			return {
				success: false,
				message: "No matching organizers found for the specified target criteria.",
				recipientsCount: 0,
				emailSent: 0,
				emailFailed: 0,
				smsSent: 0,
				smsFailed: 0,
				errors: ["Zero recipients matched."],
			};
		}

		const shouldSendEmail = payload.channels === "email" || payload.channels === "both";
		const shouldSendSms = payload.channels === "sms" || payload.channels === "both";

		const transporter = shouldSendEmail ? getTransporter() : null;
		const sender = shouldSendEmail ? getMailSender() : null;

		let emailSent = 0;
		let emailFailed = 0;
		let smsSent = 0;
		let smsFailed = 0;
		const errors: string[] = [];

		// Process each organizer
		for (const org of organizers) {
			const recipientName = org.creator?.fullName || org.name;
			const recipientEmail = org.contactEmail?.trim() || org.creator?.email?.trim() || null;
			const recipientPhone = org.phone?.trim() || org.creator?.phone?.trim() || null;

			// Active or latest event
			const primaryEvent = org.events.find((e) => e.status === "published" || e.status === "ongoing") || org.events[0];
			const eventName = primaryEvent?.title || `${org.name} Events`;
			const eventSlug = primaryEvent?.slug || org.slug;

			const ctx: NotificationVariableContext = {
				organizerName: org.name,
				recipientName,
				organizerEmail: recipientEmail || "",
				organizerPhone: recipientPhone || "",
				eventName,
				eventSlug,
				adminName,
				adminEmail,
				dashboardUrl: `${baseUrl}/dashboard`,
				platformName: "Fextiva",
				currentDate,
			};

			// 1. Send Email if applicable
			if (shouldSendEmail) {
				if (recipientEmail && transporter && sender) {
					try {
						const finalSubject = await replaceNotificationVariables(payload.emailSubject, ctx);
						const finalBody = await replaceNotificationVariables(payload.emailHtml, ctx);
						const finalCta = payload.actionButton?.url
							? {
									label: await replaceNotificationVariables(payload.actionButton.label, ctx),
									url: await replaceNotificationVariables(payload.actionButton.url, ctx),
							  }
							: undefined;

						const html = renderOrganizerNotificationEmailHtml({
							subject: finalSubject,
							contentHtml: finalBody,
							organizerName: org.name,
							recipientName,
							previewText: payload.emailPreviewText,
							actionButton: finalCta,
							adminName,
							adminEmail,
							platformName: "Fextiva",
						});

						const text = renderOrganizerNotificationEmailText({
							subject: finalSubject,
							contentHtml: finalBody,
							organizerName: org.name,
							recipientName,
							actionButton: finalCta,
							adminName,
							platformName: "Fextiva",
						});

						await transporter.sendMail({
							from: sender.formatted,
							to: recipientEmail,
							subject: finalSubject,
							html,
							text,
						});

						emailSent++;
					} catch (mailErr: any) {
						emailFailed++;
						console.error(`[AdminNotification] Email error for ${org.name} (${recipientEmail}):`, mailErr);
						if (errors.length < 5) {
							errors.push(`${org.name}: ${mailErr.message || "Email send failed"}`);
						}
					}
				} else {
					emailFailed++;
					if (errors.length < 5) {
						errors.push(`${org.name}: No valid email on file.`);
					}
				}
			}

			// 2. Send SMS if applicable
			if (shouldSendSms) {
				if (recipientPhone) {
					try {
						const finalSms = await replaceNotificationVariables(payload.smsMessage, ctx);
						const smsRes = await sendSmsMessage({
							to: recipientPhone,
							message: finalSms,
							purpose: "organizer_broadcast",
						});

						if (smsRes.success) {
							smsSent++;
						} else {
							smsFailed++;
							if (errors.length < 5) {
								errors.push(`${org.name}: SMS failed (${smsRes.error || "provider error"})`);
							}
						}
					} catch (smsErr: any) {
						smsFailed++;
						console.error(`[AdminNotification] SMS error for ${org.name} (${recipientPhone}):`, smsErr);
						if (errors.length < 5) {
							errors.push(`${org.name}: SMS send exception: ${smsErr.message || String(smsErr)}`);
						}
					}
				} else {
					smsFailed++;
					if (errors.length < 5) {
						errors.push(`${org.name}: No valid phone number on file.`);
					}
				}
			}
		}

		// Log broadcast to ActivityLog for persistence & auditing
		try {
			await prisma.activityLog.create({
				data: {
					userId: adminState.userId,
					action: "admin.organizer_notification_broadcast",
					entityType: "organizer_broadcast",
					description: `Notification broadcast sent to ${organizers.length} organizers. (${emailSent} emails, ${smsSent} SMS).`,
					metadata: {
						adminEmail,
						adminName,
						channels: payload.channels,
						targetAudience: payload.targetAudience,
						recipientsCount: organizers.length,
						emailSubject: payload.emailSubject,
						emailSnippet: payload.emailHtml.replace(/<[^>]+>/g, "").slice(0, 140),
						smsSnippet: payload.smsMessage.slice(0, 140),
						emailSent,
						emailFailed,
						smsSent,
						smsFailed,
					},
				},
			});
		} catch (logErr) {
			console.error("[AdminNotification] Failed to record ActivityLog:", logErr);
		}

		revalidatePath("/super/organizers");
		revalidatePath("/super/notifications");

		const totalDelivered = emailSent + smsSent;
		const totalFailed = emailFailed + smsFailed;

		return {
			success: totalDelivered > 0,
			message: `Broadcast completed. Sent ${emailSent} email(s) and ${smsSent} SMS message(s) to ${organizers.length} organizers.`,
			recipientsCount: organizers.length,
			emailSent,
			emailFailed,
			smsSent,
			smsFailed,
			errors,
		};
	} catch (error: any) {
		console.error("[sendAdminOrganizerNotification] Fatal error:", error);
		return {
			success: false,
			message: error.message || "Failed to dispatch notification broadcast.",
			recipientsCount: 0,
			emailSent: 0,
			emailFailed: 0,
			smsSent: 0,
			smsFailed: 0,
			errors: [error.message || String(error)],
		};
	}
}

/**
 * Retrieves the recent broadcast history from activity logs.
 */
export async function getAdminNotificationHistory(): Promise<BroadcastHistoryItem[]> {
	try {
		await requirePlatformAdmin();

		const logs = await prisma.activityLog.findMany({
			where: {
				action: "admin.organizer_notification_broadcast",
			},
			orderBy: { createdAt: "desc" },
			take: 20,
		});

		return logs.map((log) => {
			const meta = (log.metadata as any) || {};
			return {
				id: log.id,
				createdAt: log.createdAt.toISOString(),
				adminEmail: meta.adminEmail || "Super Admin",
				subject: meta.emailSubject || "Administrative Notification",
				channels: meta.channels || "email",
				targetAudience: meta.targetAudience || "all",
				recipientsCount: meta.recipientsCount || 0,
				emailSent: meta.emailSent || 0,
				smsSent: meta.smsSent || 0,
				snippet: meta.emailSnippet || meta.smsSnippet || log.description,
			};
		});
	} catch (err) {
		console.error("Failed to fetch notification history:", err);
		return [];
	}
}

/**
 * Built-in default notification templates to assist admins immediately.
 */
export const DEFAULT_NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
	{
		id: "platform_announcement",
		title: "Platform Feature Announcement",
		description: "Notify organizers of major platform improvements, new tools, and ticket sales features.",
		category: "Announcement",
		channels: "both",
		emailSubject: "Exciting New Features on Fextiva for {{identity}}",
		emailHtml: `<h2>Hello {{identity}},</h2>
<p>We are thrilled to announce a suite of new tools designed to accelerate your event ticketing, voting analytics, and audience reach on Fextiva.</p>
<p><strong>What's new this month:</strong></p>
<ul>
  <li><strong>Instant WhatsApp & SMS Delivery:</strong> Real-time ticket receipts and confirmation delivery for all your attendees.</li>
  <li><strong>Advanced Wallet Settlements:</strong> Faster next-day revenue clearances directly into your Mobile Money and Bank accounts.</li>
  <li><strong>Multi-tier Voting Analytics:</strong> Detailed reports and voter heatmaps to keep your contestants and fans engaged.</li>
</ul>
<blockquote>We are committed to empowering African event creators with the most reliable ticketing and voting infrastructure.</blockquote>
<p>You can test out these features directly from your organizer portal right now.</p>`,
		smsMessage: `Hello {{identity}}, exciting news! Fextiva has launched faster MoMo/Bank payouts and real-time WhatsApp & SMS ticketing. Check your portal at {{dashboard_url}}`,
		actionButton: {
			label: "Open Organizer Portal",
			url: "{{dashboard_url}}",
		},
	},
	{
		id: "payout_settlement_update",
		title: "Payout & Balance Clearance Notice",
		description: "Inform organizers regarding payout processing schedules, bank integrations, or clearance timings.",
		category: "Finance",
		channels: "both",
		emailSubject: "Financial Settlement & Payout Notice for {{event_name}}",
		emailHtml: `<h2>Dear {{contact_name}},</h2>
<p>This is an administrative update regarding the revenue clearance and payout schedule for <strong>{{identity}}</strong>.</p>
<p>Our payment gateway settlements for <em>{{event_name}}</em> are processed automatically according to the standard clearance cycles.</p>
<ul>
  <li><strong>Available Balance:</strong> Ready for immediate withdrawal to your linked payment account.</li>
  <li><strong>Pending Clearance (T+1):</strong> Funds from recent ticket purchases and votes are cleared after anti-fraud validation.</li>
</ul>
<p>Please ensure your payout account details (Mobile Money number or Bank Account) remain verified in your organizer settings.</p>
<p>If you have any questions or require custom settlement arrangements, feel free to contact us directly.</p>`,
		smsMessage: `Notice for {{identity}}: Payout settlements for {{event_name}} are processing normally. Review your wallet balance anytime at {{dashboard_url}}`,
		actionButton: {
			label: "View Wallet & Payouts",
			url: "{{dashboard_url}}/wallet",
		},
	},
	{
		id: "event_compliance_reminder",
		title: "Event Setup & Compliance Reminder",
		description: "Remind organizers to complete their event description, ticket tiers, or banner before launch.",
		category: "Event Operations",
		channels: "both",
		emailSubject: "Important Action: Finalize Details for {{event_name}}",
		emailHtml: `<h2>Greetings {{identity}},</h2>
<p>Our team conducted a review of upcoming events on Fextiva, and we want to ensure your event <strong>{{event_name}}</strong> has everything configured for maximum ticket conversions.</p>
<p><strong>Recommended checklist:</strong></p>
<ul>
  <li>High-resolution banner and flyer graphic uploaded</li>
  <li>Clear ticket pricing, early bird tiers, and sales deadlines</li>
  <li>Accurate venue address or livestream access details</li>
  <li>Contact phone number for attendee inquiries</li>
</ul>
<p>Completing these items helps your event qualify for featured placement on the Fextiva homepage!</p>`,
		smsMessage: `Hi {{identity}}, ensure your event "{{event_name}}" is ready for attendees! Review tickets, flyer, and venue details at {{dashboard_url}} - {{admin_name}}`,
		actionButton: {
			label: "Edit Event Details",
			url: "{{dashboard_url}}/events",
		},
	},
	{
		id: "urgent_maintenance_notice",
		title: "Scheduled System Maintenance Window",
		description: "Advance notice of planned infrastructure maintenance or scheduled downtime.",
		category: "System",
		channels: "both",
		emailSubject: "Scheduled Platform Maintenance Notice: {{current_date}}",
		emailHtml: `<h2>Dear {{identity}} Team,</h2>
<p>To deliver superior speed and reliability for your high-traffic ticket onsales, our engineering team will perform scheduled database upgrades.</p>
<p><strong>Maintenance Details:</strong></p>
<ul>
  <li><strong>Date:</strong> This Sunday at 02:00 UTC - 03:30 UTC</li>
  <li><strong>Expected Duration:</strong> Under 30 minutes</li>
  <li><strong>Impact:</strong> Public ticket checkout and voting pages will experience intermittent pauses. All existing data is 100% secure.</li>
</ul>
<p>We apologize for any temporary inconvenience and appreciate your partnership as we continue improving Fextiva.</p>`,
		smsMessage: `Notice for {{identity}}: Brief scheduled platform maintenance this Sunday 02:00 UTC (~30 mins). All ticket and attendee data remains safe. - Fextiva`,
		actionButton: {
			label: "Visit Fextiva Status",
			url: "https://status.fextiva.com",
		},
	},
];

/**
 * Loads saved custom templates combined with defaults.
 */
export async function getAdminNotificationTemplates(): Promise<NotificationTemplate[]> {
	try {
		await requirePlatformAdmin();

		const setting = await prisma.platformSetting.findUnique({
			where: { key: "admin_organizer_notification_templates" },
		});

		if (setting?.value && Array.isArray(setting.value)) {
			const customTemplates = setting.value as unknown as NotificationTemplate[];
			return [...customTemplates, ...DEFAULT_NOTIFICATION_TEMPLATES];
		}

		return DEFAULT_NOTIFICATION_TEMPLATES;
	} catch (err) {
		console.error("Error reading notification templates:", err);
		return DEFAULT_NOTIFICATION_TEMPLATES;
	}
}

/**
 * Saves a new custom notification template.
 */
export async function saveAdminNotificationTemplate(template: Omit<NotificationTemplate, "id">): Promise<{ success: boolean; message: string }> {
	try {
		const adminState = await requirePlatformAdmin();

		const newTemplate: NotificationTemplate = {
			...template,
			id: `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
		};

		const setting = await prisma.platformSetting.findUnique({
			where: { key: "admin_organizer_notification_templates" },
		});

		let currentList: NotificationTemplate[] = [];
		if (setting?.value && Array.isArray(setting.value)) {
			currentList = setting.value as unknown as NotificationTemplate[];
		}

		currentList.unshift(newTemplate);

		await prisma.platformSetting.upsert({
			where: { key: "admin_organizer_notification_templates" },
			create: {
				key: "admin_organizer_notification_templates",
				value: currentList as any,
				description: "Custom admin notification broadcast templates for organizers",
				updatedBy: adminState.userId,
			},
			update: {
				value: currentList as any,
				updatedBy: adminState.userId,
			},
		});

		revalidatePath("/super/notifications");

		return {
			success: true,
			message: `Template "${template.title}" saved successfully.`,
		};
	} catch (err: any) {
		console.error("Failed to save notification template:", err);
		return {
			success: false,
			message: err.message || "Failed to save template.",
		};
	}
}
