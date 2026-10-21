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
import {
	DEFAULT_NOTIFICATION_TEMPLATES,
	type NotificationVariableContext,
	type SendAdminNotificationPayload,
	type NotificationBroadcastResult,
	type BroadcastHistoryItem,
	type NotificationTemplate,
} from "@/types/admin-notifications";

export type {
	NotificationVariableContext,
	SendAdminNotificationPayload,
	NotificationBroadcastResult,
	BroadcastHistoryItem,
	NotificationTemplate,
};

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
				team: {
					select: {
						id: true,
						role: true,
						user: {
							select: {
								id: true,
								fullName: true,
								email: true,
								phone: true,
							},
						},
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

		// Determine if member-level targeting is active
		const hasMemberTargeting = payload.selectedMemberIds && payload.selectedMemberIds.length > 0;

		// Deduplicate sent-to tracking to avoid double-sending to the same user across orgs
		const sentToEmails = new Set<string>();
		const sentToPhones = new Set<string>();

		// Process each organizer
		for (const org of organizers) {
			// Active or latest event
			const primaryEvent = org.events.find((e) => e.status === "published" || e.status === "ongoing") || org.events[0];
			const eventName = primaryEvent?.title || `${org.name} Events`;
			const eventSlug = primaryEvent?.slug || org.slug;

			// Build list of recipients for this org
			type Recipient = { name: string; email: string | null; phone: string | null };
			const recipients: Recipient[] = [];

			if (hasMemberTargeting) {
				// Only send to selected members within this org
				for (const member of org.team) {
					if (payload.selectedMemberIds!.includes(member.user.id)) {
						recipients.push({
							name: member.user.fullName,
							email: member.user.email?.trim() || null,
							phone: member.user.phone?.trim() || null,
						});
					}
				}
			} else {
				// Default: send to org contact/creator
				recipients.push({
					name: org.creator?.fullName || org.name,
					email: org.contactEmail?.trim() || org.creator?.email?.trim() || null,
					phone: org.phone?.trim() || org.creator?.phone?.trim() || null,
				});
			}

			// Send to each recipient in this org
			for (const recipient of recipients) {
				const recipientName = recipient.name;
				const recipientEmail = recipient.email;
				const recipientPhone = recipient.phone;

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
				if (recipientEmail && !sentToEmails.has(recipientEmail) && transporter && sender) {
					sentToEmails.add(recipientEmail);
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
						console.error(`[AdminNotification] Email error for ${recipientName} (${recipientEmail}):`, mailErr);
						if (errors.length < 5) {
							errors.push(`${recipientName} (${org.name}): ${mailErr.message || "Email send failed"}`);
						}
					}
				} else if (!recipientEmail) {
					emailFailed++;
					if (errors.length < 5) {
						errors.push(`${recipientName} (${org.name}): No valid email on file.`);
					}
				}
			}

			// 2. Send SMS if applicable
			if (shouldSendSms) {
				if (recipientPhone && !sentToPhones.has(recipientPhone)) {
					sentToPhones.add(recipientPhone);
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
								errors.push(`${recipientName} (${org.name}): SMS failed (${smsRes.error || "provider error"})`);
							}
						}
					} catch (smsErr: any) {
						smsFailed++;
						console.error(`[AdminNotification] SMS error for ${recipientName} (${recipientPhone}):`, smsErr);
						if (errors.length < 5) {
							errors.push(`${recipientName} (${org.name}): SMS send exception: ${smsErr.message || String(smsErr)}`);
						}
					}
				} else if (!recipientPhone) {
					smsFailed++;
					if (errors.length < 5) {
						errors.push(`${recipientName} (${org.name}): No valid phone number on file.`);
					}
				}
			}
			} // end recipient loop
		} // end organizer loop

		// Log broadcast to ActivityLog for persistence & auditing
		const actualRecipientCount = Math.max(sentToEmails.size, sentToPhones.size, hasMemberTargeting ? payload.selectedMemberIds!.length : organizers.length);
		try {
			await prisma.activityLog.create({
				data: {
					userId: adminState.userId,
					action: "admin.organizer_notification_broadcast",
					entityType: "organizer_broadcast",
					description: hasMemberTargeting
						? `Notification sent to ${actualRecipientCount} member(s) across ${organizers.length} organizer(s). (${emailSent} emails, ${smsSent} SMS).`
						: `Notification broadcast sent to ${organizers.length} organizers. (${emailSent} emails, ${smsSent} SMS).`,
					metadata: {
						adminEmail,
						adminName,
						channels: payload.channels,
						targetAudience: payload.targetAudience,
						memberTargeting: hasMemberTargeting || false,
						selectedMemberCount: hasMemberTargeting ? payload.selectedMemberIds!.length : 0,
						recipientsCount: actualRecipientCount,
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
			message: hasMemberTargeting
				? `Broadcast completed. Sent ${emailSent} email(s) and ${smsSent} SMS to ${actualRecipientCount} member(s) across ${organizers.length} org(s).`
				: `Broadcast completed. Sent ${emailSent} email(s) and ${smsSent} SMS message(s) to ${organizers.length} organizers.`,
			recipientsCount: actualRecipientCount,
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
