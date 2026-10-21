// src/types/admin-notifications.ts

import type { AdminOrganizerItem } from "@/lib/dal/admin";

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
 * Built-in default notification templates.
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
