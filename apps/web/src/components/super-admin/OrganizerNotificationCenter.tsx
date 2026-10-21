"use client";

import React, { useState, useTransition, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import {
	Mail,
	MessageSquare,
	Send,
	Smartphone,
	Sparkles,
	CheckCircle2,
	AlertCircle,
	Eye,
	Laptop,
	Copy,
	Plus,
	Check,
	Search,
	Users,
	Calendar,
	Building2,
	Tag,
	RefreshCw,
	FileText,
	HelpCircle,
	Info,
	ExternalLink,
	ShieldCheck,
	History,
	Bookmark,
	Layers,
	ChevronRight,
	X,
	ArrowUpRight,
	SlidersHorizontal,
	PhoneCall,
	ChevronDown,
	UserCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import type { AdminOrganizerItem } from "@/lib/dal/admin";
import {
	sendAdminOrganizerNotification,
	getAdminNotificationTemplates,
	saveAdminNotificationTemplate,
} from "@/lib/server-functions/admin-organizer-notifications";
import {
	DEFAULT_NOTIFICATION_TEMPLATES,
	type BroadcastHistoryItem,
	type NotificationTemplate,
} from "@/types/admin-notifications";
import { cn } from "@/lib/utils";

interface OrganizerNotificationCenterProps {
	organizers: AdminOrganizerItem[];
	adminUser: {
		name: string;
		email: string;
		phone?: string;
		avatar?: string;
	};
	initialHistory?: BroadcastHistoryItem[];
	preselectedOrgId?: string | null;
}

// Dynamic variable definition with description and sample value
interface VariableDefinition {
	tag: string;
	label: string;
	description: string;
	sampleValue: (org: AdminOrganizerItem | null, admin: { name: string; email: string }) => string;
}

const AVAILABLE_VARIABLES: VariableDefinition[] = [
	{
		tag: "{{identity}}",
		label: "Identity / Org Name",
		description: "Organizer business name or contact name",
		sampleValue: (org) => org?.name || "Apex Entertainment",
	},
	{
		tag: "{{contact_name}}",
		label: "Contact Person",
		description: "Full name of the organizer account owner",
		sampleValue: (org) => org?.creator?.fullName || "Kwame Mensah",
	},
	{
		tag: "{{event_name}}",
		label: "Event Name",
		description: "Title of organizer's primary or latest event",
		sampleValue: (org) =>
			org?.eventsSummary.eventsList.find((e) => e.status === "published" || e.status === "ongoing")?.title ||
			org?.eventsSummary.eventsList[0]?.title ||
			"Accra Summer Festival 2026",
	},
	{
		tag: "{{organizer_email}}",
		label: "Organizer Email",
		description: "Registered organizer contact or owner email",
		sampleValue: (org) => org?.contactEmail || org?.creator?.email || "organizer@example.com",
	},
	{
		tag: "{{organizer_phone}}",
		label: "Organizer Phone",
		description: "Contact or creator mobile number",
		sampleValue: (org) => org?.phone || org?.creator?.phone || "+233 24 123 4567",
	},
	{
		tag: "{{admin_name}}",
		label: "Admin Name",
		description: "Sending platform administrator's name",
		sampleValue: (_, admin) => admin.name || "Fextiva Administration",
	},
	{
		tag: "{{admin_email}}",
		label: "Admin Email",
		description: "Sending platform administrator's email",
		sampleValue: (_, admin) => admin.email || "admin@fextiva.com",
	},
	{
		tag: "{{dashboard_url}}",
		label: "Portal Link",
		description: "Direct URL to organizer portal",
		sampleValue: () => "https://fextiva.com/dashboard",
	},
	{
		tag: "{{platform_name}}",
		label: "Platform Name",
		description: "Brand name (Fextiva)",
		sampleValue: () => "Fextiva",
	},
	{
		tag: "{{current_date}}",
		label: "Current Date",
		description: "Formatted date of notification dispatch",
		sampleValue: () =>
			new Date().toLocaleDateString("en-US", {
				month: "long",
				day: "numeric",
				year: "numeric",
			}),
	},
];

export function OrganizerNotificationCenter({
	organizers,
	adminUser,
	initialHistory = [],
	preselectedOrgId,
}: OrganizerNotificationCenterProps) {
	const [activeMainTab, setActiveMainTab] = useState<"composer" | "history" | "templates">("composer");
	const [isPending, startTransition] = useTransition();

	// ── Targeting State ──────────────────────────────────────────────────────────
	const [targetAudience, setTargetAudience] = useState<"all" | "active_events" | "selected">(
		preselectedOrgId ? "selected" : "all"
	);
	const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>(
		preselectedOrgId ? [preselectedOrgId] : []
	);
	const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
	const [expandedOrgIds, setExpandedOrgIds] = useState<string[]>([]);
	const [orgSearchQuery, setOrgSearchQuery] = useState("");

	// ── Channel State ────────────────────────────────────────────────────────────
	const [channels, setChannels] = useState<"both" | "email" | "sms">("both");

	// ── Message Content State ────────────────────────────────────────────────────
	const [emailSubject, setEmailSubject] = useState("Important Platform Update for {{identity}}");
	const [emailPreviewText, setEmailPreviewText] = useState("");
	const [emailHtml, setEmailHtml] = useState(
		`<h2>Hello {{identity}},</h2><p>We are reaching out with an important administrative update regarding your event <strong>{{event_name}}</strong> and organizer account on Fextiva.</p><p>Please take a moment to review the upcoming schedules, payout settlements, and attendee communication channels.</p><blockquote>Our team is available 24/7 to support your ticket onsales and voting operations.</blockquote><p>Best regards,<br/><strong>{{admin_name}}</strong></p>`
	);
	const [includeCta, setIncludeCta] = useState(true);
	const [ctaLabel, setCtaLabel] = useState("Open Organizer Portal");
	const [ctaUrl, setCtaUrl] = useState("{{dashboard_url}}");

	const [smsMessage, setSmsMessage] = useState(
		`Notice for {{identity}}: Important updates for your event {{event_name}} are now live in your Fextiva portal. Review details at {{dashboard_url}} - {{admin_name}}`
	);

	// ── Last Focused Field for Intuitive Prefix Insertion ────────────────────────
	// 'subject' | 'editor' | 'sms' | 'ctaLabel' | 'ctaUrl'
	const [lastFocusedField, setLastFocusedField] = useState<"subject" | "editor" | "sms" | "ctaLabel" | "ctaUrl">("editor");

	const subjectInputRef = useRef<HTMLInputElement>(null);
	const smsTextareaRef = useRef<HTMLTextAreaElement>(null);
	const ctaLabelRef = useRef<HTMLInputElement>(null);
	const ctaUrlRef = useRef<HTMLInputElement>(null);

	// ── Preview State ────────────────────────────────────────────────────────────
	const [previewChannel, setPreviewChannel] = useState<"email" | "sms">("email");
	const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
	const [previewOrgId, setPreviewOrgId] = useState<string>(
		organizers[0]?.id || ""
	);

	// ── Dialog States ────────────────────────────────────────────────────────────
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [isTestSendOpen, setIsTestSendOpen] = useState(false);
	const [testEmail, setTestEmail] = useState(adminUser.email);
	const [testPhone, setTestPhone] = useState(adminUser.phone || "");
	const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
	const [newTemplateTitle, setNewTemplateTitle] = useState("");
	const [newTemplateCategory, setNewTemplateCategory] = useState("Announcements");

	// ── Templates & History State ────────────────────────────────────────────────
	const [templates, setTemplates] = useState<NotificationTemplate[]>(DEFAULT_NOTIFICATION_TEMPLATES);
	const [history, setHistory] = useState<BroadcastHistoryItem[]>(initialHistory);

	// Find the organizer currently chosen for preview
	const previewOrg = useMemo(() => {
		return organizers.find((o) => o.id === previewOrgId) || organizers[0] || null;
	}, [organizers, previewOrgId]);

	// Filtered list of organizers based on audience criteria
	const targetOrganizers = useMemo(() => {
		if (targetAudience === "selected") {
			return organizers.filter((o) => selectedOrgIds.includes(o.id));
		}
		if (targetAudience === "active_events") {
			return organizers.filter((o) => o.eventsSummary.published > 0 || o.eventsSummary.ongoing > 0);
		}
		return organizers;
	}, [organizers, targetAudience, selectedOrgIds]);

	// Organizers with valid email and phone counts, accounting for member-level targeting
	const audienceStats = useMemo(() => {
		// When member-level targeting is active, count selected members
		if (selectedMemberIds.length > 0) {
			let withEmail = 0;
			let withPhone = 0;
			for (const org of targetOrganizers) {
				for (const member of org.members) {
					if (selectedMemberIds.includes(member.user.id)) {
						if (member.user.email?.trim()) withEmail++;
						if (member.user.phone?.trim()) withPhone++;
					}
				}
			}
			return { total: selectedMemberIds.length, withEmail, withPhone };
		}
		// Default org-level counts
		const total = targetOrganizers.length;
		const withEmail = targetOrganizers.filter(
			(o) => Boolean(o.contactEmail?.trim()) || Boolean(o.creator?.email?.trim())
		).length;
		const withPhone = targetOrganizers.filter(
			(o) => Boolean(o.phone?.trim()) || Boolean(o.creator?.phone?.trim())
		).length;
		return { total, withEmail, withPhone };
	}, [targetOrganizers, selectedMemberIds]);

	// Filtered organizers for the multi-select picker
	const searchableOrganizers = useMemo(() => {
		if (!orgSearchQuery.trim()) return organizers;
		const q = orgSearchQuery.toLowerCase();
		return organizers.filter(
			(o) =>
				o.name.toLowerCase().includes(q) ||
				o.slug.toLowerCase().includes(q) ||
				(o.creator?.fullName && o.creator.fullName.toLowerCase().includes(q)) ||
				(o.contactEmail && o.contactEmail.toLowerCase().includes(q))
		);
	}, [organizers, orgSearchQuery]);

	// List of actual targeted recipients with phone & email for live display
	const smsRecipientsList = useMemo(() => {
		const list: Array<{ id: string; name: string; orgName: string; phone: string | null; email: string | null }> = [];
		if (selectedMemberIds.length > 0) {
			for (const org of targetOrganizers) {
				for (const member of org.members || []) {
					if (selectedMemberIds.includes(member.user.id)) {
						list.push({
							id: member.user.id,
							name: member.user.fullName || "Member",
							orgName: org.name,
							phone: member.user.phone?.trim() || null,
							email: member.user.email?.trim() || null,
						});
					}
				}
			}
		} else {
			for (const org of targetOrganizers) {
				list.push({
					id: org.id,
					name: org.creator?.fullName || org.name,
					orgName: org.name,
					phone: org.phone?.trim() || org.creator?.phone?.trim() || null,
					email: org.contactEmail?.trim() || org.creator?.email?.trim() || null,
				});
			}
		}
		return list;
	}, [targetOrganizers, selectedMemberIds]);

	// Evaluate variables against the selected preview organizer
	const evaluateVariables = (text: string, org: AdminOrganizerItem | null): string => {
		if (!text) return "";
		let out = text;
		for (const v of AVAILABLE_VARIABLES) {
			const val = v.sampleValue(org, adminUser);
			out = out.replace(new RegExp(v.tag.replace(/([{}])/g, "\\$1"), "gi"), val);
		}
		return out;
	};

	// Evaluated preview content
	const evaluatedSubject = useMemo(
		() => evaluateVariables(emailSubject, previewOrg),
		[emailSubject, previewOrg, adminUser]
	);

	const evaluatedHtmlBody = useMemo(
		() => evaluateVariables(emailHtml, previewOrg),
		[emailHtml, previewOrg, adminUser]
	);

	const evaluatedCtaLabel = useMemo(
		() => evaluateVariables(ctaLabel, previewOrg),
		[ctaLabel, previewOrg, adminUser]
	);

	const evaluatedCtaUrl = useMemo(
		() => evaluateVariables(ctaUrl, previewOrg),
		[ctaUrl, previewOrg, adminUser]
	);

	const evaluatedSms = useMemo(
		() => evaluateVariables(smsMessage, previewOrg),
		[smsMessage, previewOrg, adminUser]
	);

	// Character and Segment count for SMS
	const smsCharCount = evaluatedSms.length;
	const smsSegmentCount = smsCharCount <= 160 ? 1 : Math.ceil(smsCharCount / 153);

	// ── Intuitive Prefix / Variable Insertion Handler ──────────────────────────
	const insertVariable = (tag: string) => {
		if (lastFocusedField === "subject") {
			const el = subjectInputRef.current;
			if (el) {
				const start = el.selectionStart ?? el.value.length;
				const end = el.selectionEnd ?? el.value.length;
				const next = emailSubject.slice(0, start) + tag + emailSubject.slice(end);
				setEmailSubject(next);
				setTimeout(() => {
					el.focus();
					el.setSelectionRange(start + tag.length, start + tag.length);
				}, 50);
				toast.info(`Inserted ${tag} into Subject`);
				return;
			}
		}

		if (lastFocusedField === "sms") {
			const el = smsTextareaRef.current;
			if (el) {
				const start = el.selectionStart ?? el.value.length;
				const end = el.selectionEnd ?? el.value.length;
				const next = smsMessage.slice(0, start) + tag + smsMessage.slice(end);
				setSmsMessage(next);
				setTimeout(() => {
					el.focus();
					el.setSelectionRange(start + tag.length, start + tag.length);
				}, 50);
				toast.info(`Inserted ${tag} into SMS`);
				return;
			}
		}

		if (lastFocusedField === "ctaLabel") {
			setCtaLabel((prev) => prev + " " + tag);
			toast.info(`Inserted ${tag} into Button Label`);
			return;
		}

		if (lastFocusedField === "ctaUrl") {
			setCtaUrl(tag);
			toast.info(`Set Button URL to ${tag}`);
			return;
		}

		// Default to appending/inserting in the Rich Text Editor HTML
		setEmailHtml((prev) => {
			if (prev.endsWith("</p>")) {
				return prev.replace(/<\/p>$/, ` ${tag}</p>`);
			}
			return prev + `<p>${tag}</p>`;
		});
		toast.info(`Inserted ${tag} into Rich Text Email`);
	};

	// One-click copy email text to SMS draft
	const handleSyncEmailToSms = () => {
		const plain = emailHtml
			.replace(/<br\s*[\/]?>/gi, " ")
			.replace(/<\/p>/gi, ". ")
			.replace(/<[^>]+>/g, "")
			.replace(/\s+/g, " ")
			.trim();

		const snippet = plain.length > 120 ? plain.slice(0, 120) + "…" : plain;
		const draft = `${emailSubject}: ${snippet} Read more at {{dashboard_url}} - {{admin_name}}`;
		setSmsMessage(draft);
		toast.success("Generated tailored SMS draft from email!");
	};

	// Load a pre-configured or saved template
	const handleApplyTemplate = (tpl: NotificationTemplate) => {
		setEmailSubject(tpl.emailSubject);
		setEmailHtml(tpl.emailHtml);
		setSmsMessage(tpl.smsMessage);
		setChannels(tpl.channels);
		if (tpl.actionButton) {
			setIncludeCta(true);
			setCtaLabel(tpl.actionButton.label);
			setCtaUrl(tpl.actionButton.url);
		}
		toast.success(`Loaded "${tpl.title}" template.`);
	};

	// Dispatch test send
	const handleSendTest = () => {
		if (!testEmail && (channels === "email" || channels === "both")) {
			toast.error("Please enter a test recipient email.");
			return;
		}

		startTransition(async () => {
			const res = await sendAdminOrganizerNotification({
				targetAudience: "all",
				channels,
				emailSubject,
				emailHtml,
				emailPreviewText,
				smsMessage,
				actionButton: includeCta && ctaLabel && ctaUrl ? { label: ctaLabel, url: ctaUrl } : undefined,
				isTest: true,
				testEmail,
				testPhone: testPhone || undefined,
			});

			if (res.success) {
				toast.success(res.message);
				setIsTestSendOpen(false);
			} else {
				toast.error(res.message || "Test send encountered errors.");
			}
		});
	};

	// Dispatch live broadcast
	const handleConfirmBroadcast = () => {
		if (targetOrganizers.length === 0) {
			toast.error("No recipients selected.");
			return;
		}

		startTransition(async () => {
			const res = await sendAdminOrganizerNotification({
				targetAudience,
				selectedOrgIds,
				selectedMemberIds: selectedMemberIds.length > 0 ? selectedMemberIds : undefined,
				channels,
				emailSubject,
				emailHtml,
				emailPreviewText,
				smsMessage,
				actionButton: includeCta && ctaLabel && ctaUrl ? { label: ctaLabel, url: ctaUrl } : undefined,
				isTest: false,
			});

			if (res.success) {
				toast.success(res.message, { duration: 6000 });
				setIsConfirmOpen(false);

				// Add to local history tab
				const newHistoryItem: BroadcastHistoryItem = {
					id: `log_${Date.now()}`,
					createdAt: new Date().toISOString(),
					adminEmail: adminUser.email,
					subject: emailSubject,
					channels,
					targetAudience,
					recipientsCount: res.recipientsCount,
					emailSent: res.emailSent,
					smsSent: res.smsSent,
					snippet: smsMessage.slice(0, 100),
				};
				setHistory((prev) => [newHistoryItem, ...prev]);
			} else {
				toast.error(res.message || "Failed to dispatch notification broadcast.");
			}
		});
	};

	// Save custom template
	const handleSaveTemplate = () => {
		if (!newTemplateTitle.trim()) {
			toast.error("Please provide a template title.");
			return;
		}

		startTransition(async () => {
			const res = await saveAdminNotificationTemplate({
				title: newTemplateTitle.trim(),
				description: "Custom admin broadcast template",
				category: newTemplateCategory,
				channels,
				emailSubject,
				emailHtml,
				smsMessage,
				actionButton: includeCta && ctaLabel && ctaUrl ? { label: ctaLabel, url: ctaUrl } : undefined,
			});

			if (res.success) {
				toast.success(res.message);
				setIsSaveTemplateOpen(false);
				setNewTemplateTitle("");
				// Refresh local list
				const updatedTemplates = await getAdminNotificationTemplates();
				setTemplates(updatedTemplates);
			} else {
				toast.error(res.message || "Failed to save template.");
			}
		});
	};

	return (
		<TooltipProvider delayDuration={200}>
			<div className="flex flex-col gap-6 max-w-full">
				{/* Top Header Card */}
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-xl border border-border bg-card shadow-sm">
					<div className="flex items-start gap-3.5">
						<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
							<Send className="h-5 w-5" />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h1 className="text-xl font-bold tracking-tight text-foreground">
									Organizer Notification Center
								</h1>
								<Badge variant="outline" className="text-[10px] font-semibold bg-primary/10 border-primary/30 text-primary uppercase">
									Multi-Channel Hub
								</Badge>
							</div>
							<p className="text-xs text-muted-foreground mt-0.5">
								Compose rich HTML emails and SMS alerts to organizers with dynamic merge prefixes like{" "}
								<code className="text-primary font-mono bg-muted/60 px-1 py-0.5 rounded text-[11px] font-semibold">
									{"{{identity}}"}
								</code>
								,{" "}
								<code className="text-primary font-mono bg-muted/60 px-1 py-0.5 rounded text-[11px] font-semibold">
									{"{{event_name}}"}
								</code>
								, and{" "}
								<code className="text-primary font-mono bg-muted/60 px-1 py-0.5 rounded text-[11px] font-semibold">
									{"{{admin_name}}"}
								</code>
								.
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2 shrink-0">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsTestSendOpen(true)}
							className="text-xs font-semibold rounded-lg h-9"
						>
							<Sparkles className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
							Send Test to Me
						</Button>

						<Button
							size="sm"
							onClick={() => setIsConfirmOpen(true)}
							disabled={targetOrganizers.length === 0}
							className="text-xs font-semibold rounded-lg h-9 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
						>
							<Send className="h-3.5 w-3.5 mr-1.5" />
							Dispatch to {targetOrganizers.length} Organizer{targetOrganizers.length === 1 ? "" : "s"}
						</Button>
					</div>
				</div>

				{/* Navigation Tabs */}
				<Tabs
					value={activeMainTab}
					onValueChange={(v) => setActiveMainTab(v as any)}
					className="w-full space-y-5"
				>
					<div className="flex items-center justify-between border-b border-border pb-2">
						<TabsList className="bg-muted/60 p-1 rounded-lg">
							<TabsTrigger value="composer" className="text-xs font-semibold gap-1.5 px-3.5">
								<FileText className="h-3.5 w-3.5" />
								Message Composer & Preview
							</TabsTrigger>
							<TabsTrigger value="templates" className="text-xs font-semibold gap-1.5 px-3.5">
								<Bookmark className="h-3.5 w-3.5" />
								Templates ({templates.length})
							</TabsTrigger>
							<TabsTrigger value="history" className="text-xs font-semibold gap-1.5 px-3.5">
								<History className="h-3.5 w-3.5" />
								Broadcast History ({history.length})
							</TabsTrigger>
						</TabsList>

						<div className="flex items-center gap-2 text-xs text-muted-foreground hidden sm:flex">
							<span className="font-semibold text-foreground">{organizers.length}</span> total organizers registered
						</div>
					</div>

					{/* ──────────────────────────────────────────────────────────────────────── */}
					{/* TAB 1: COMPOSER & LIVE PREVIEW                                          */}
					{/* ──────────────────────────────────────────────────────────────────────── */}
					<TabsContent value="composer" className="m-0 focus-visible:outline-none">
						<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
							
							{/* LEFT COLUMN: Composer Controls (7 cols) */}
							<div className="lg:col-span-7 space-y-5">
								
								{/* 1. Target Audience & Channels Card */}
								<Card className="border-border bg-card rounded-xl">
									<CardHeader className="pb-3 border-b border-border/70">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<Users className="h-4 w-4 text-primary" />
												<CardTitle className="text-sm font-bold">1. Target Audience & Channels</CardTitle>
											</div>
											<Badge variant="secondary" className="text-[11px] font-mono">
												{audienceStats.total} Recipient(s)
											</Badge>
										</div>
										<CardDescription className="text-xs">
											Choose which organizers receive this notification and via which channels.
										</CardDescription>
									</CardHeader>

									<CardContent className="pt-4 space-y-4">
										{/* Audience Radios */}
										<div>
											<Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">
												Recipient Filter
											</Label>
											<div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
												<div
													onClick={() => setTargetAudience("all")}
													className={cn(
														"p-3 rounded-lg border cursor-pointer transition-all text-left",
														targetAudience === "all"
															? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
															: "border-border hover:bg-muted/40 text-muted-foreground"
													)}
												>
													<div className="flex items-center justify-between">
														<span className="text-xs font-bold text-foreground">All Organizers</span>
														<Building2 className="h-3.5 w-3.5 text-primary" />
													</div>
													<p className="text-[11px] text-muted-foreground mt-1">
														Broadcast to all {organizers.length} registered organizations
													</p>
												</div>

												<div
													onClick={() => setTargetAudience("active_events")}
													className={cn(
														"p-3 rounded-lg border cursor-pointer transition-all text-left",
														targetAudience === "active_events"
															? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
															: "border-border hover:bg-muted/40 text-muted-foreground"
													)}
												>
													<div className="flex items-center justify-between">
														<span className="text-xs font-bold text-foreground">Active Events Only</span>
														<Calendar className="h-3.5 w-3.5 text-primary" />
													</div>
													<p className="text-[11px] text-muted-foreground mt-1">
														Organizers with live or published events
													</p>
												</div>

												<div
													onClick={() => setTargetAudience("selected")}
													className={cn(
														"p-3 rounded-lg border cursor-pointer transition-all text-left",
														targetAudience === "selected"
															? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
															: "border-border hover:bg-muted/40 text-muted-foreground"
													)}
												>
													<div className="flex items-center justify-between">
														<span className="text-xs font-bold text-foreground">Specific Organizers</span>
														<Badge variant="outline" className="text-[9px] px-1 py-0">
															{selectedOrgIds.length} chosen
														</Badge>
													</div>
													<p className="text-[11px] text-muted-foreground mt-1">
														Handpick individual organizers
													</p>
												</div>
											</div>
										</div>

										{/* Specific Organizers Multi-Select Picker */}
										{targetAudience === "selected" && (
											<div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-2.5">
												<div className="flex items-center justify-between gap-2">
													<div className="relative flex-1">
														<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
														<Input
															placeholder="Search organizers by name, email or slug..."
															value={orgSearchQuery}
															onChange={(e) => setOrgSearchQuery(e.target.value)}
															className="h-8 text-xs pl-8 bg-background border-border"
														/>
													</div>
													<Button
														variant="outline"
														size="sm"
														onClick={() =>
															setSelectedOrgIds(
																selectedOrgIds.length === organizers.length
																	? []
																	: organizers.map((o) => o.id)
															)
														}
														className="text-xs h-8 shrink-0"
													>
														{selectedOrgIds.length === organizers.length ? "Deselect All" : "Select All"}
													</Button>
												</div>

												{/* Member targeting indicator */}
												{selectedMemberIds.length > 0 && (
													<div className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-primary/10 border border-primary/20 text-xs">
														<span className="text-[11px] text-foreground font-medium">
															Targeting <strong className="text-primary font-bold">{selectedMemberIds.length}</strong> specific member{selectedMemberIds.length === 1 ? "" : "s"} across {selectedOrgIds.length} org{selectedOrgIds.length === 1 ? "" : "s"}
														</span>
														<button
															type="button"
															onClick={() => setSelectedMemberIds([])}
															className="text-[10px] text-muted-foreground hover:text-foreground underline"
														>
															Reset to all org contacts
														</button>
													</div>
												)}

												{/* Scrollable list of organizations with member drill-down */}
												<div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 border border-border/60 rounded-md bg-background p-1.5">
													{searchableOrganizers.map((org) => {
														const isOrgSelected = selectedOrgIds.includes(org.id);
														const isExpanded = expandedOrgIds.includes(org.id);
														const orgMembers = org.members || [];
														const selectedOrgMemberCount = orgMembers.filter((m) =>
															selectedMemberIds.includes(m.user.id)
														).length;

														return (
															<div
																key={org.id}
																className={cn(
																	"rounded-md border transition-all text-xs overflow-hidden",
																	isOrgSelected
																		? "border-primary/40 bg-primary/5"
																		: "border-border/60 hover:border-border bg-card/50"
																)}
															>
																{/* Organization Header Row */}
																<div className="flex items-center justify-between p-2 gap-2">
																	<div
																		className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
																		onClick={() => {
																			if (isOrgSelected) {
																				setSelectedOrgIds((prev) => prev.filter((id) => id !== org.id));
																				// Remove any selected members for this org
																				const memberUserIds = orgMembers.map((m) => m.user.id);
																				setSelectedMemberIds((prev) =>
																					prev.filter((id) => !memberUserIds.includes(id))
																				);
																			} else {
																				setSelectedOrgIds((prev) => [...prev, org.id]);
																			}
																		}}
																	>
																		<div
																			className={cn(
																				"h-4 w-4 rounded flex items-center justify-center border transition-colors shrink-0",
																				isOrgSelected
																					? "bg-primary border-primary text-primary-foreground"
																					: "border-muted-foreground/40 bg-background"
																			)}
																		>
																			{isOrgSelected && <Check className="h-3 w-3 stroke-[3]" />}
																		</div>
																		<span className="font-semibold text-foreground truncate max-w-[190px]">
																			{org.name}
																		</span>
																		<span className="text-[11px] text-muted-foreground truncate hidden sm:inline">
																			({org.creator?.fullName || org.contactEmail || "No name"})
																		</span>
																	</div>

																	<div className="flex items-center gap-1.5 shrink-0">
																		{/* Contact chips */}
																		<div className="flex items-center gap-1.5 text-[10px] mr-1">
																			{channels !== "sms" && (org.contactEmail || org.creator?.email) && (
																				<span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 max-w-[150px] truncate" title={org.contactEmail || org.creator?.email || ""}>
																					<Mail className="h-3 w-3 shrink-0" />
																					<span className="truncate hidden sm:inline">{org.contactEmail || org.creator?.email}</span>
																				</span>
																			)}
																			{(org.phone || org.creator?.phone) ? (
																				<span className="flex items-center gap-1 font-mono text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
																					<Smartphone className="h-3 w-3 shrink-0" />
																					<span>{org.phone || org.creator?.phone}</span>
																				</span>
																			) : (
																				(channels === "sms" || channels === "both") && (
																					<span className="text-[10px] text-red-500 dark:text-red-400 font-medium bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
																						No phone
																					</span>
																				)
																			)}
																		</div>

																		{/* Expand Members Button */}
																		{orgMembers.length > 0 && (
																			<Button
																				type="button"
																				variant="ghost"
																				size="sm"
																				onClick={(e) => {
																					e.stopPropagation();
																					setExpandedOrgIds((prev) =>
																						isExpanded
																							? prev.filter((id) => id !== org.id)
																							: [...prev, org.id]
																					);
																				}}
																				className={cn(
																					"h-6 px-1.5 text-[10px] gap-1 rounded hover:bg-muted font-normal",
																					selectedOrgMemberCount > 0
																						? "text-primary font-semibold"
																						: "text-muted-foreground"
																				)}
																			>
																				<UserCircle className="h-3 w-3" />
																				<span>
																					{selectedOrgMemberCount > 0
																						? `${selectedOrgMemberCount}/${orgMembers.length} selected`
																						: `${orgMembers.length} member${orgMembers.length === 1 ? "" : "s"}`}
																				</span>
																				<ChevronDown
																					className={cn(
																						"h-3 w-3 transition-transform",
																						isExpanded ? "rotate-180" : ""
																					)}
																				/>
																			</Button>
																		)}
																	</div>
																</div>

																{/* Expanded Members Sub-List */}
																{isExpanded && orgMembers.length > 0 && (
																	<div className="border-t border-border/60 bg-muted/30 p-2 space-y-1">
																		<div className="flex items-center justify-between pb-1 px-1 text-[10px] text-muted-foreground">
																			<span className="font-medium uppercase tracking-wider">
																				Select specific team members:
																			</span>
																			<div className="flex items-center gap-2">
																				<button
																					type="button"
																					onClick={(e) => {
																						e.stopPropagation();
																						const userIds = orgMembers.map((m) => m.user.id);
																						setSelectedMemberIds((prev) =>
																							Array.from(new Set([...prev, ...userIds]))
																						);
																						if (!isOrgSelected) {
																							setSelectedOrgIds((prev) => [...prev, org.id]);
																						}
																					}}
																					className="text-primary hover:underline font-medium"
																				>
																					Select all members
																				</button>
																				<span>•</span>
																				<button
																					type="button"
																					onClick={(e) => {
																						e.stopPropagation();
																						const userIds = orgMembers.map((m) => m.user.id);
																						setSelectedMemberIds((prev) =>
																							prev.filter((id) => !userIds.includes(id))
																						);
																					}}
																					className="text-muted-foreground hover:text-foreground"
																				>
																					Clear members
																				</button>
																			</div>
																		</div>

																		<div className="space-y-1">
																			{orgMembers.map((member) => {
																				const isMemberSelected = selectedMemberIds.includes(
																					member.user.id
																				);
																				return (
																					<div
																						key={member.id}
																						onClick={(e) => {
																							e.stopPropagation();
																							setSelectedMemberIds((prev) =>
																								isMemberSelected
																									? prev.filter((id) => id !== member.user.id)
																									: [...prev, member.user.id]
																							);
																							// Ensure parent org is selected
																							if (!isOrgSelected) {
																								setSelectedOrgIds((prev) => [...prev, org.id]);
																							}
																						}}
																						className={cn(
																							"flex items-center justify-between p-1.5 rounded cursor-pointer transition-colors text-xs",
																							isMemberSelected
																								? "bg-primary/15 text-foreground font-medium"
																								: "hover:bg-muted/60 text-muted-foreground"
																						)}
																					>
																						<div className="flex items-center gap-2 min-w-0">
																							<div
																								className={cn(
																									"h-3.5 w-3.5 rounded flex items-center justify-center border transition-colors shrink-0",
																									isMemberSelected
																										? "bg-primary border-primary text-primary-foreground"
																										: "border-muted-foreground/40 bg-background"
																								)}
																							>
																								{isMemberSelected && (
																									<Check className="h-2.5 w-2.5 stroke-[3]" />
																								)}
																							</div>
																							<span className="truncate max-w-[150px] text-foreground">
																								{member.user.fullName || "Unnamed member"}
																							</span>
																							<Badge
																								variant="outline"
																								className="text-[9px] px-1 py-0 uppercase text-muted-foreground border-border/80"
																							>
																								{member.role || "MEMBER"}
																							</Badge>
																						</div>

																						<div className="flex items-center gap-1.5 text-[10px] shrink-0">
																							{channels !== "sms" && (
																								member.user.email ? (
																									<span
																										className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded max-w-[130px] truncate"
																										title={member.user.email}
																									>
																										<Mail className="h-3 w-3 text-emerald-500 shrink-0" />
																										<span className="truncate hidden sm:inline">
																											{member.user.email}
																										</span>
																									</span>
																								) : (
																									<span className="text-[9px] text-red-400">
																										No email
																									</span>
																								)
																							)}
																							{member.user.phone ? (
																								<span
																									className="flex items-center gap-1 font-mono text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20"
																									title={member.user.phone}
																								>
																									<Smartphone className="h-3 w-3 text-amber-500 shrink-0" />
																									<span>{member.user.phone}</span>
																								</span>
																							) : (
																								(channels === "sms" || channels === "both") && (
																									<span className="text-[9px] text-red-400 bg-red-500/10 px-1 py-0.5 rounded">
																										No phone
																									</span>
																								)
																							)}
																						</div>
																					</div>
																				);
																			})}
																		</div>
																	</div>
																)}
															</div>
														);
													})}
												</div>
											</div>
										)}

										{/* Channel Switcher */}
										<div>
											<Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">
												Delivery Channel
											</Label>
											<div className="grid grid-cols-3 gap-2.5">
												<button
													type="button"
													onClick={() => {
														setChannels("both");
														setPreviewChannel("email");
													}}
													className={cn(
														"p-3 rounded-lg border text-left transition-all flex flex-col justify-between",
														channels === "both"
															? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
															: "border-border hover:bg-muted/40 text-muted-foreground"
													)}
												>
													<div className="flex items-center justify-between">
														<span className="text-xs font-bold text-foreground">Email & SMS</span>
														<div className="flex items-center gap-1">
															<Mail className="h-3.5 w-3.5 text-primary" />
															<Smartphone className="h-3.5 w-3.5 text-primary" />
														</div>
													</div>
													<span className="text-[11px] text-muted-foreground mt-1">
														Dual delivery (Both)
													</span>
												</button>

												<button
													type="button"
													onClick={() => {
														setChannels("email");
														setPreviewChannel("email");
													}}
													className={cn(
														"p-3 rounded-lg border text-left transition-all flex flex-col justify-between",
														channels === "email"
															? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
															: "border-border hover:bg-muted/40 text-muted-foreground"
													)}
												>
													<div className="flex items-center justify-between">
														<span className="text-xs font-bold text-foreground">Email Only</span>
														<Mail className="h-3.5 w-3.5 text-primary" />
													</div>
													<span className="text-[11px] text-muted-foreground mt-1">
														Rich HTML inbox email
													</span>
												</button>

												<button
													type="button"
													onClick={() => {
														setChannels("sms");
														setPreviewChannel("sms");
													}}
													className={cn(
														"p-3 rounded-lg border text-left transition-all flex flex-col justify-between",
														channels === "sms"
															? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
															: "border-border hover:bg-muted/40 text-muted-foreground"
													)}
												>
													<div className="flex items-center justify-between">
														<span className="text-xs font-bold text-foreground">SMS Only</span>
														<Smartphone className="h-3.5 w-3.5 text-primary" />
													</div>
													<span className="text-[11px] text-muted-foreground mt-1">
														Arkesel text message
													</span>
												</button>
											</div>

											{/* Deliverability Badge Summary */}
											<div className="mt-3 flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border text-xs">
												<span className="text-muted-foreground">Deliverability Coverage:</span>
												<div className="flex items-center gap-3">
													<span className="flex items-center gap-1 font-semibold text-foreground">
														<Mail className="h-3.5 w-3.5 text-emerald-500" />
														{audienceStats.withEmail} / {audienceStats.total} with Email
													</span>
													<span className="flex items-center gap-1 font-semibold text-foreground">
														<Smartphone className="h-3.5 w-3.5 text-amber-500" />
														{audienceStats.withPhone} / {audienceStats.total} with Phone
													</span>
												</div>
											</div>
										</div>

									</CardContent>
								</Card>

								{/* 2. Intuitive Dynamic Variable Prefixes Toolbar */}
								<Card className="border-border bg-card rounded-xl">
									<CardHeader className="pb-2.5 border-b border-border/70">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<Tag className="h-4 w-4 text-primary" />
												<CardTitle className="text-sm font-bold">
													2. Dynamic Variables / Prefixes
												</CardTitle>
											</div>
											<Badge variant="outline" className="text-[10px] bg-muted/40 font-mono">
												Click to Insert
											</Badge>
										</div>
										<CardDescription className="text-xs">
											Click any prefix button below to insert it at cursor position in your Subject, Email body, or SMS.
										</CardDescription>
									</CardHeader>

									<CardContent className="pt-3">
										<div className="flex flex-wrap gap-1.5">
											{AVAILABLE_VARIABLES.map((v) => (
												<Tooltip key={v.tag}>
													<TooltipTrigger asChild>
														<Button
															type="button"
															variant="outline"
															size="sm"
															onClick={() => insertVariable(v.tag)}
															className="h-7 text-xs font-mono font-medium rounded-md border-border/80 hover:border-primary hover:bg-primary/10 hover:text-primary transition-colors gap-1 px-2.5"
														>
															<Plus className="h-3 w-3 text-primary shrink-0" />
															<span>{v.tag}</span>
														</Button>
													</TooltipTrigger>
													<TooltipContent side="top" className="text-xs max-w-xs">
														<p className="font-bold">{v.label}</p>
														<p className="text-muted-foreground">{v.description}</p>
														<p className="text-[11px] text-primary mt-1">
															Sample: &ldquo;{v.sampleValue(previewOrg, adminUser)}&rdquo;
														</p>
													</TooltipContent>
												</Tooltip>
											))}
										</div>

										<div className="mt-2.5 text-[11px] text-muted-foreground flex items-center gap-1.5">
											<Info className="h-3.5 w-3.5 text-primary shrink-0" />
											<span>
												Currently inserting into:{" "}
												<strong className="text-foreground capitalize">{lastFocusedField}</strong>.
												Hover any chip to see its evaluated value.
											</span>
										</div>
									</CardContent>
								</Card>

								{/* 3. Email Composer (Shown if Email or Both) */}
								{(channels === "email" || channels === "both") && (
									<Card className="border-border bg-card rounded-xl">
										<CardHeader className="pb-3 border-b border-border/70">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<Mail className="h-4 w-4 text-primary" />
													<CardTitle className="text-sm font-bold">3. Rich Text Email Content</CardTitle>
												</div>
												<Badge variant="secondary" className="text-[10px] font-mono">
													HTML Rich Email
												</Badge>
											</div>
											<CardDescription className="text-xs">
												Formatted email with tri-color Fextiva branding, subject line, and optional CTA button.
											</CardDescription>
										</CardHeader>

										<CardContent className="pt-4 space-y-4">
											{/* Subject Line */}
											<div className="space-y-1.5">
												<div className="flex items-center justify-between">
													<Label htmlFor="subject" className="text-xs font-semibold">
														Email Subject
													</Label>
													<span className="text-[11px] text-muted-foreground">
														Supports dynamic variables like {"{{identity}}"}
													</span>
												</div>
												<Input
													id="subject"
													ref={subjectInputRef}
													value={emailSubject}
													onChange={(e) => setEmailSubject(e.target.value)}
													onFocus={() => setLastFocusedField("subject")}
													placeholder="Subject line for organizers..."
													className="text-xs h-9 bg-background font-medium border-border"
												/>
											</div>

											{/* Preview Preheader Text (Optional) */}
											<div className="space-y-1.5">
												<Label htmlFor="preheader" className="text-xs font-semibold text-muted-foreground">
													Inbox Preview / Preheader Text (Optional)
												</Label>
												<Input
													id="preheader"
													value={emailPreviewText}
													onChange={(e) => setEmailPreviewText(e.target.value)}
													placeholder="Brief snippet shown next to subject in Gmail/Apple Mail..."
													className="text-xs h-8 bg-background border-border text-muted-foreground"
												/>
											</div>

											{/* TipTap Rich Text Editor */}
											<div className="space-y-1.5">
												<div className="flex items-center justify-between">
													<Label className="text-xs font-semibold">
														Email Body (Rich Text)
													</Label>
													<span className="text-[11px] text-muted-foreground">
														Bold, Italic, Headings, Lists, Blockquotes, Links
													</span>
												</div>
												<div
													onClick={() => setLastFocusedField("editor")}
													className="border border-border rounded-lg overflow-hidden"
												>
													<RichTextEditor
														value={emailHtml}
														onChange={(html) => setEmailHtml(html)}
														minHeight="220px"
														placeholder="Write custom message to organizers..."
													/>
												</div>
											</div>

											{/* Optional Call to Action Button */}
											<div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-3">
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-2">
														<input
															type="checkbox"
															id="include-cta"
															checked={includeCta}
															onChange={(e) => setIncludeCta(e.target.checked)}
															className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
														/>
														<Label htmlFor="include-cta" className="text-xs font-semibold cursor-pointer">
															Include Primary Action Button (Call-to-Action)
														</Label>
													</div>
													{includeCta && (
														<Badge variant="outline" className="text-[9px] text-primary border-primary/30">
															Active
														</Badge>
													)}
												</div>

												{includeCta && (
													<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
														<div className="space-y-1">
															<Label className="text-[11px] text-muted-foreground font-semibold">
																Button Text
															</Label>
															<Input
																ref={ctaLabelRef}
																value={ctaLabel}
																onChange={(e) => setCtaLabel(e.target.value)}
																onFocus={() => setLastFocusedField("ctaLabel")}
																placeholder="e.g. Open Organizer Portal"
																className="text-xs h-8 bg-background border-border"
															/>
														</div>
														<div className="space-y-1">
															<Label className="text-[11px] text-muted-foreground font-semibold">
																Button URL
															</Label>
															<Input
																ref={ctaUrlRef}
																value={ctaUrl}
																onChange={(e) => setCtaUrl(e.target.value)}
																onFocus={() => setLastFocusedField("ctaUrl")}
																placeholder="e.g. {{dashboard_url}}"
																className="text-xs h-8 bg-background border-border font-mono"
															/>
														</div>
													</div>
												)}
											</div>

										</CardContent>
									</Card>
								)}

								{/* 4. SMS Composer (Shown if SMS or Both) */}
								{(channels === "sms" || channels === "both") && (
									<Card className="border-border bg-card rounded-xl">
										<CardHeader className="pb-3 border-b border-border/70">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<Smartphone className="h-4 w-4 text-primary" />
													<CardTitle className="text-sm font-bold">4. SMS Text Alert</CardTitle>
												</div>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													onClick={handleSyncEmailToSms}
													className="text-[11px] h-7 gap-1 text-primary hover:text-primary hover:bg-primary/10"
												>
													<Copy className="h-3 w-3" />
													Draft from Email
												</Button>
											</div>
											<CardDescription className="text-xs">
												Direct SMS dispatched via Arkesel under the verified &ldquo;Fextiva&rdquo; Sender ID.
											</CardDescription>
										</CardHeader>

										<CardContent className="pt-4 space-y-3">
											<div className="space-y-1.5">
												<div className="flex items-center justify-between">
													<Label htmlFor="sms" className="text-xs font-semibold">
														SMS Message Text
													</Label>
													<div className="flex items-center gap-2 text-[11px]">
														<span className={cn(
															"font-mono font-medium",
															smsCharCount > 160 ? "text-amber-500 font-bold" : "text-muted-foreground"
														)}>
															{smsCharCount} / 160 characters
														</span>
														<Badge
															variant="outline"
															className={cn(
																"text-[9px] px-1.5",
																smsSegmentCount > 1 ? "border-amber-500/40 text-amber-500" : "text-muted-foreground"
															)}
														>
															{smsSegmentCount} SMS Segment{smsSegmentCount > 1 ? "s" : ""}
														</Badge>
													</div>
												</div>

												<Textarea
													id="sms"
													ref={smsTextareaRef}
													value={smsMessage}
													onChange={(e) => setSmsMessage(e.target.value)}
													onFocus={() => setLastFocusedField("sms")}
													placeholder="Write SMS message to organizers..."
													rows={4}
													className="text-xs bg-background font-mono leading-relaxed border-border resize-none"
												/>
											</div>

											{smsCharCount > 160 && (
												<div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs flex items-start gap-2">
													<AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
													<span>
														This message exceeds 160 characters ({smsCharCount} chars) and will be delivered as a {smsSegmentCount}-part concatenated SMS.
													</span>
												</div>
											)}

											<div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
												<span>Sender ID: <strong className="text-foreground">Fextiva</strong></span>
												<span>Estimated SMS cost: ~GH₵0.08 per recipient segment</span>
											</div>

											{/* Live SMS Contacts List */}
											<div className="p-3 rounded-lg border border-border bg-muted/20 space-y-2 mt-2">
												<div className="flex items-center justify-between text-xs">
													<div className="flex items-center gap-1.5 font-semibold text-foreground">
														<PhoneCall className="h-3.5 w-3.5 text-primary" />
														<span>SMS Destination Numbers ({smsRecipientsList.length}):</span>
													</div>
													<Badge variant="outline" className="text-[10px] font-mono">
														{smsRecipientsList.filter((r) => Boolean(r.phone)).length} / {smsRecipientsList.length} ready to receive
													</Badge>
												</div>

												<div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 border border-border/60 rounded-md bg-background p-1.5">
													{smsRecipientsList.length === 0 ? (
														<p className="text-[11px] text-muted-foreground italic p-1">No organizers selected. Choose an audience above.</p>
													) : (
														smsRecipientsList.map((rec, i) => (
															<div
																key={`${rec.id}_${i}`}
																className="flex items-center justify-between p-1.5 rounded bg-muted/40 text-xs gap-2"
															>
																<div className="flex items-center gap-1.5 min-w-0">
																	<span className="font-semibold text-foreground truncate max-w-[140px]">{rec.name}</span>
																	<span className="text-[11px] text-muted-foreground truncate hidden sm:inline">({rec.orgName})</span>
																</div>
																<div className="shrink-0 font-mono text-[11px]">
																	{rec.phone ? (
																		<span className="text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
																			{rec.phone}
																		</span>
																	) : (
																		<span className="text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded text-[10px] font-sans font-medium">
																			⚠️ No phone number
																		</span>
																	)}
																</div>
															</div>
														))
													)}
												</div>
											</div>
										</CardContent>
									</Card>
								)}

								{/* Bottom Action Bar */}
								<div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => setIsSaveTemplateOpen(true)}
										className="text-xs h-9"
									>
										<Bookmark className="h-3.5 w-3.5 mr-1.5" />
										Save as Reusable Template
									</Button>

									<div className="flex items-center gap-2">
										<Button
											type="button"
											variant="secondary"
											size="sm"
											onClick={() => setIsTestSendOpen(true)}
											className="text-xs h-9 font-semibold"
										>
											<Sparkles className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
											Test Send
										</Button>

										<Button
											type="button"
											size="sm"
											onClick={() => setIsConfirmOpen(true)}
											disabled={targetOrganizers.length === 0}
											className="text-xs h-9 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
										>
											<Send className="h-3.5 w-3.5 mr-1.5" />
											Dispatch Broadcast ({targetOrganizers.length})
										</Button>
									</div>
								</div>

							</div>

							{/* RIGHT COLUMN: Live Interactive Preview Side (5 cols) */}
							<div className="lg:col-span-5 sticky top-4 space-y-4">
								
								{/* Preview Control Bar */}
								<Card className="border-border bg-card rounded-xl">
									<CardHeader className="p-3.5 border-b border-border/70 flex flex-row items-center justify-between space-y-0">
										<div className="flex items-center gap-2">
											<Eye className="h-4 w-4 text-primary" />
											<span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
												Live Preview Side
											</span>
										</div>

										{/* Channel & Device Switcher */}
										<div className="flex items-center gap-1.5">
											{channels === "both" && (
												<div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border">
													<Button
														type="button"
														variant={previewChannel === "email" ? "secondary" : "ghost"}
														size="sm"
														onClick={() => setPreviewChannel("email")}
														className="h-6 px-2 text-[11px] font-semibold"
													>
														<Mail className="h-3 w-3 mr-1" />
														Email
													</Button>
													<Button
														type="button"
														variant={previewChannel === "sms" ? "secondary" : "ghost"}
														size="sm"
														onClick={() => setPreviewChannel("sms")}
														className="h-6 px-2 text-[11px] font-semibold"
													>
														<Smartphone className="h-3 w-3 mr-1" />
														SMS
													</Button>
												</div>
											)}

											{previewChannel === "email" && (
												<div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border">
													<Button
														type="button"
														variant={previewDevice === "desktop" ? "secondary" : "ghost"}
														size="sm"
														onClick={() => setPreviewDevice("desktop")}
														className="h-6 w-6 p-0"
														title="Desktop View"
													>
														<Laptop className="h-3 w-3" />
													</Button>
													<Button
														type="button"
														variant={previewDevice === "mobile" ? "secondary" : "ghost"}
														size="sm"
														onClick={() => setPreviewDevice("mobile")}
														className="h-6 w-6 p-0"
														title="Mobile View"
													>
														<Smartphone className="h-3 w-3" />
													</Button>
												</div>
											)}
										</div>
									</CardHeader>

									<CardContent className="p-3.5 space-y-3">
										{/* Recipient Preview Switcher */}
										<div className="flex items-center justify-between gap-2">
											<Label className="text-[11px] font-semibold text-muted-foreground shrink-0">
												Previewing with:
											</Label>
											<Select value={previewOrgId} onValueChange={setPreviewOrgId}>
												<SelectTrigger className="h-7 text-xs bg-background border-border">
													<SelectValue placeholder="Select organizer to preview" />
												</SelectTrigger>
												<SelectContent className="max-h-56">
													{organizers.map((org) => (
														<SelectItem key={org.id} value={org.id} className="text-xs">
															{org.name} ({org.creator?.fullName || "Owner"})
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>

										<p className="text-[11px] text-muted-foreground italic">
											Variables like <span className="text-primary font-mono font-medium">{"{{identity}}"}</span> and <span className="text-primary font-mono font-medium">{"{{event_name}}"}</span> are resolved in real-time below using {previewOrg?.name}&apos;s data.
										</p>
									</CardContent>
								</Card>

								{/* ── EMAIL PREVIEW DISPLAY ────────────────────────────────────── */}
								{previewChannel === "email" && (
									<div
										className={cn(
											"mx-auto transition-all duration-300 rounded-xl overflow-hidden border border-border bg-white text-zinc-900 shadow-md",
											previewDevice === "mobile" ? "max-w-[340px]" : "w-full"
										)}
									>
										{/* Tri-color Accent Bar */}
										<div className="flex h-1.5 w-full">
											<div className="h-full w-1/3 bg-[#ca0808]" />
											<div className="h-full w-1/3 bg-[#e88722]" />
											<div className="h-full w-1/3 bg-[#53967a]" />
										</div>

										{/* Email Header Info */}
										<div className="p-4 border-b border-zinc-200 bg-zinc-50/70 space-y-2">
											<div className="flex items-center justify-between">
												<span className="text-[10px] font-bold text-[#53967a] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase tracking-wider">
													Official Notification
												</span>
												<span className="text-xs font-semibold text-zinc-600 truncate max-w-[170px]">
													{previewOrg?.name}
												</span>
											</div>

											<div className="space-y-0.5 text-xs text-zinc-600">
												<div>
													<span className="text-zinc-400 font-medium">From:</span>{" "}
													<strong className="text-zinc-800">{adminUser.name}</strong> &lt;{adminUser.email}&gt;
												</div>
												<div>
													<span className="text-zinc-400 font-medium">To:</span>{" "}
													<strong className="text-zinc-800">
														{previewOrg?.creator?.fullName || previewOrg?.name}
													</strong>{" "}
													&lt;{previewOrg?.contactEmail || previewOrg?.creator?.email || "organizer@example.com"}&gt;
												</div>
											</div>
										</div>

										{/* Email Subject Title */}
										<div className="p-4 pb-2 border-b border-zinc-100">
											<h2 className="text-base font-bold text-zinc-900 leading-snug">
												{evaluatedSubject || "(No subject provided)"}
											</h2>
											{emailPreviewText && (
												<p className="text-xs text-zinc-400 mt-1 italic truncate">
													{emailPreviewText}
												</p>
											)}
										</div>

										{/* Email Body Content */}
										<div className="p-5 space-y-4 text-xs sm:text-sm text-zinc-700 leading-relaxed font-sans min-h-[180px]">
											<div
												className="prose prose-sm max-w-none text-zinc-800 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-zinc-900 [&_h2]:mt-2 [&_h2]:mb-1 [&_p]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-[#53967a] [&_blockquote]:bg-emerald-50/60 [&_blockquote]:p-2.5 [&_blockquote]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
												dangerouslySetInnerHTML={{ __html: evaluatedHtmlBody || "<p>(Write message content above...)</p>" }}
											/>

											{/* CTA Button */}
											{includeCta && evaluatedCtaLabel && (
												<div className="pt-2 pb-1 text-center">
													<a
														href={evaluatedCtaUrl || "#"}
														target="_blank"
														rel="noreferrer"
														onClick={(e) => e.preventDefault()}
														className="inline-block px-5 py-2.5 rounded-md text-xs font-bold text-white bg-[#53967a] hover:bg-[#437d65] shadow-sm transition-colors"
													>
														{evaluatedCtaLabel}
													</a>
												</div>
											)}

											<div className="pt-4 border-t border-zinc-200 text-xs text-zinc-500">
												<p className="m-0">Best regards,</p>
												<p className="m-0 font-bold text-zinc-900">{adminUser.name}</p>
												<p className="m-0 text-[11px] text-zinc-400">Fextiva Platform Governance</p>
											</div>
										</div>

										{/* Email Footer */}
										<div className="p-3 bg-zinc-100/70 border-t border-zinc-200 text-center text-[10px] text-zinc-400">
											&copy; {new Date().getFullYear()} Fextiva. Sent to registered organizers.
										</div>
									</div>
								)}

								{/* ── SMS PHONE MOCKUP PREVIEW ─────────────────────────────────── */}
								{previewChannel === "sms" && (
									<div className="space-y-3">
										{/* Preview Recipient Details Card */}
										<div className="p-3 bg-muted/40 rounded-xl border border-border text-xs space-y-1.5">
											<div className="flex items-center justify-between">
												<span className="text-muted-foreground font-medium">Recipient:</span>
												<span className="font-semibold text-foreground">
													{previewOrg?.creator?.fullName || previewOrg?.name}
												</span>
											</div>
											<div className="flex items-center justify-between">
												<span className="text-muted-foreground font-medium">Organization:</span>
												<span className="text-foreground">{previewOrg?.name}</span>
											</div>
											<div className="flex items-center justify-between">
												<span className="text-muted-foreground font-medium">Destination Phone:</span>
												{previewOrg?.phone || previewOrg?.creator?.phone ? (
													<span className="font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
														{previewOrg?.phone || previewOrg?.creator?.phone}
													</span>
												) : (
													<span className="text-red-500 font-semibold bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 text-[10px]">
														No phone number on file
													</span>
												)}
											</div>
										</div>

										{!(previewOrg?.phone || previewOrg?.creator?.phone) && (
											<div className="p-2.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
												<AlertCircle className="h-4 w-4 shrink-0" />
												<span>This organizer does not have a phone number on file. SMS cannot be delivered to them.</span>
											</div>
										)}

										<div className="max-w-[320px] mx-auto rounded-[32px] border-[6px] border-zinc-800 bg-zinc-950 p-3 shadow-2xl text-white">
											{/* Phone Speaker Notch */}
											<div className="mx-auto h-4 w-28 rounded-full bg-zinc-800 mb-3 flex items-center justify-center">
												<div className="h-1.5 w-10 rounded-full bg-zinc-700" />
											</div>

											{/* Phone Header */}
											<div className="text-center pb-3 border-b border-zinc-800">
												<div className="h-9 w-9 rounded-full bg-primary/20 border border-primary/40 text-primary mx-auto flex items-center justify-center font-bold text-xs mb-1">
													F
												</div>
												<p className="text-xs font-bold text-zinc-200">Fextiva</p>
												<p className="text-[10px] font-mono">
													{previewOrg?.phone || previewOrg?.creator?.phone ? (
														<span className="text-zinc-400">{previewOrg?.phone || previewOrg?.creator?.phone}</span>
													) : (
														<span className="text-red-400 font-sans">No phone registered</span>
													)}
												</p>
											</div>

											{/* SMS Message Bubble */}
											<div className="py-6 min-h-[220px] flex flex-col justify-end">
												<div className="bg-primary/90 text-primary-foreground p-3.5 rounded-2xl rounded-bl-sm text-xs leading-relaxed shadow-sm font-sans">
													<p className="m-0 break-words whitespace-pre-wrap">
														{evaluatedSms || "(Write SMS draft above...)"}
													</p>
													<div className="flex items-center justify-between text-[9px] text-primary-foreground/70 mt-2 font-mono">
														<span>Sender ID: Fextiva</span>
														<span>Now</span>
													</div>
												</div>
											</div>

											{/* Phone Bottom Home Bar */}
											<div className="pt-2 pb-1 flex justify-center">
												<div className="h-1 w-24 rounded-full bg-zinc-700" />
											</div>
										</div>
									</div>
								)}

							</div>

						</div>
					</TabsContent>

					{/* ──────────────────────────────────────────────────────────────────────── */}
					{/* TAB 2: PRE-MADE & SAVED TEMPLATES                                       */}
					{/* ──────────────────────────────────────────────────────────────────────── */}
					<TabsContent value="templates" className="m-0 focus-visible:outline-none">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{templates.map((tpl) => (
								<Card key={tpl.id} className="border-border bg-card rounded-xl flex flex-col justify-between">
									<CardHeader className="pb-3 border-b border-border">
										<div className="flex items-start justify-between gap-2">
											<div>
												<Badge variant="outline" className="text-[10px] font-semibold text-primary border-primary/30 uppercase mb-1">
													{tpl.category}
												</Badge>
												<CardTitle className="text-sm font-bold text-foreground">
													{tpl.title}
												</CardTitle>
											</div>
											<Badge variant="secondary" className="text-[10px] uppercase font-mono">
												{tpl.channels}
											</Badge>
										</div>
										<CardDescription className="text-xs mt-1">
											{tpl.description}
										</CardDescription>
									</CardHeader>

									<CardContent className="pt-3.5 space-y-3">
										<div className="space-y-1 text-xs">
											<span className="font-semibold text-muted-foreground block text-[11px] uppercase">
												Subject Line:
											</span>
											<p className="font-mono text-xs bg-muted/30 p-2 rounded border border-border/60 text-foreground truncate">
												{tpl.emailSubject}
											</p>
										</div>

										<div className="space-y-1 text-xs">
											<span className="font-semibold text-muted-foreground block text-[11px] uppercase">
												SMS Snippet:
											</span>
											<p className="font-mono text-xs bg-muted/30 p-2 rounded border border-border/60 text-muted-foreground line-clamp-2">
												{tpl.smsMessage}
											</p>
										</div>

										<div className="pt-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => {
													handleApplyTemplate(tpl);
													setActiveMainTab("composer");
												}}
												className="w-full text-xs font-semibold rounded-lg border-border hover:bg-primary hover:text-primary-foreground hover:border-primary"
											>
												<Sparkles className="h-3.5 w-3.5 mr-1.5" />
												Use This Template
											</Button>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</TabsContent>

					{/* ──────────────────────────────────────────────────────────────────────── */}
					{/* TAB 3: BROADCAST HISTORY & AUDIT LOGS                                   */}
					{/* ──────────────────────────────────────────────────────────────────────── */}
					<TabsContent value="history" className="m-0 focus-visible:outline-none">
						{history.length === 0 ? (
							<Card className="border-border rounded-xl">
								<CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
									<History className="h-10 w-10 mb-3 opacity-30" />
									<h3 className="text-base font-semibold text-foreground">No broadcasts sent yet</h3>
									<p className="text-xs max-w-sm mt-1">
										When you dispatch administrative notifications to organizers, delivery records and metrics will appear here.
									</p>
								</CardContent>
							</Card>
						) : (
							<div className="space-y-3">
								{history.map((item) => (
									<Card key={item.id} className="border-border bg-card rounded-xl">
										<CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
											<div className="space-y-1 min-w-0">
												<div className="flex items-center gap-2">
													<span className="font-bold text-sm text-foreground truncate max-w-md">
														{item.subject}
													</span>
													<Badge variant="outline" className="text-[10px] font-mono capitalize">
														{item.channels}
													</Badge>
												</div>
												<p className="text-muted-foreground text-[11px] truncate max-w-lg">
													{item.snippet}
												</p>
												<div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
													<span>By: <strong className="text-foreground">{item.adminEmail}</strong></span>
													<span>•</span>
													<span>{new Date(item.createdAt).toLocaleString()}</span>
												</div>
											</div>

											<div className="flex items-center gap-3 shrink-0 bg-muted/30 p-2.5 rounded-lg border border-border">
												<div className="text-center px-2">
													<span className="text-[10px] font-bold text-muted-foreground block uppercase">
														Recipients
													</span>
													<span className="font-bold text-foreground font-mono text-sm">
														{item.recipientsCount}
													</span>
												</div>
												<div className="h-6 w-px bg-border" />
												<div className="text-center px-2">
													<span className="text-[10px] font-bold text-emerald-600 block uppercase">
														Emails
													</span>
													<span className="font-bold text-foreground font-mono text-sm">
														{item.emailSent}
													</span>
												</div>
												<div className="h-6 w-px bg-border" />
												<div className="text-center px-2">
													<span className="text-[10px] font-bold text-amber-600 block uppercase">
														SMS
													</span>
													<span className="font-bold text-foreground font-mono text-sm">
														{item.smsSent}
													</span>
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						)}
					</TabsContent>

				</Tabs>

				{/* ── DIALOG 1: SEND TEST MODAL ─────────────────────────────────────── */}
				<Dialog open={isTestSendOpen} onOpenChange={setIsTestSendOpen}>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle className="text-base font-bold flex items-center gap-2">
								<Sparkles className="h-4 w-4 text-amber-500" />
								Send Test Notification to Admin
							</DialogTitle>
							<DialogDescription className="text-xs">
								Send a real sample message to your own email and phone to inspect the layout and variable rendering before sending to all organizers.
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-3.5 py-2">
							{(channels === "email" || channels === "both") && (
								<div className="space-y-1">
									<Label htmlFor="test-email" className="text-xs font-semibold">
										Test Email Address
									</Label>
									<Input
										id="test-email"
										value={testEmail}
										onChange={(e) => setTestEmail(e.target.value)}
										placeholder="admin@example.com"
										className="text-xs h-9"
									/>
								</div>
							)}

							{(channels === "sms" || channels === "both") && (
								<div className="space-y-1">
									<Label htmlFor="test-phone" className="text-xs font-semibold">
										Test Mobile Phone (SMS)
									</Label>
									<Input
										id="test-phone"
										value={testPhone}
										onChange={(e) => setTestPhone(e.target.value)}
										placeholder="+233XXXXXXXXX"
										className="text-xs h-9 font-mono"
									/>
									<span className="text-[11px] text-muted-foreground">
										Must include country code (e.g. +233, +234, +1)
									</span>
								</div>
							)}
						</div>

						<DialogFooter className="gap-2 sm:gap-0">
							<Button variant="ghost" size="sm" onClick={() => setIsTestSendOpen(false)} disabled={isPending}>
								Cancel
							</Button>
							<Button size="sm" onClick={handleSendTest} disabled={isPending} className="bg-primary text-primary-foreground font-semibold">
								{isPending ? "Sending Test..." : "Send Test Now"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* ── DIALOG 2: CONFIRM BROADCAST MODAL ─────────────────────────────── */}
				<Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
					<DialogContent className="sm:max-w-lg">
						<DialogHeader>
							<DialogTitle className="text-base font-bold flex items-center gap-2">
								<ShieldCheck className="h-5 w-5 text-primary" />
								Confirm Notification Broadcast
							</DialogTitle>
							<DialogDescription className="text-xs">
								Please verify your target audience and channels before dispatching this administrative message.
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-3 py-2 text-xs">
							<div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-2">
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">Target Recipients:</span>
									<span className="font-bold text-foreground">{targetOrganizers.length} Organizers</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">Delivery Channels:</span>
									<Badge variant="secondary" className="font-mono uppercase text-[10px]">
										{channels}
									</Badge>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">Email Deliverability:</span>
									<span className="font-medium text-emerald-600 dark:text-emerald-400">
										{audienceStats.withEmail} of {audienceStats.total} have email on file
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">SMS Deliverability:</span>
									<span className="font-medium text-amber-600 dark:text-amber-400">
										{audienceStats.withPhone} of {audienceStats.total} have phone on file
									</span>
								</div>
							</div>

							<div className="space-y-1">
								<span className="text-muted-foreground block font-semibold text-[11px] uppercase">
									Subject Preview:
								</span>
								<p className="font-medium text-foreground bg-background p-2 rounded border border-border">
									{evaluatedSubject}
								</p>
							</div>

							{(channels === "sms" || channels === "both") && (
								<div className="space-y-1">
									<span className="text-muted-foreground block font-semibold text-[11px] uppercase">
										SMS Preview:
									</span>
									<p className="font-mono text-[11px] text-muted-foreground bg-background p-2 rounded border border-border">
										{evaluatedSms}
									</p>
								</div>
							)}
						</div>

						<DialogFooter className="gap-2 sm:gap-0">
							<Button variant="ghost" size="sm" onClick={() => setIsConfirmOpen(false)} disabled={isPending}>
								Cancel
							</Button>
							<Button size="sm" onClick={handleConfirmBroadcast} disabled={isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
								{isPending ? "Dispatching Broadcast..." : `Confirm & Send to ${targetOrganizers.length} Organizers`}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* ── DIALOG 3: SAVE TEMPLATE MODAL ─────────────────────────────────── */}
				<Dialog open={isSaveTemplateOpen} onOpenChange={setIsSaveTemplateOpen}>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle className="text-base font-bold flex items-center gap-2">
								<Bookmark className="h-4 w-4 text-primary" />
								Save Custom Notification Template
							</DialogTitle>
							<DialogDescription className="text-xs">
								Save your current rich message, prefixes, and SMS draft for reuse in future broadcasts.
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-3 py-2">
							<div className="space-y-1">
								<Label htmlFor="tpl-title" className="text-xs font-semibold">
									Template Title
								</Label>
								<Input
									id="tpl-title"
									value={newTemplateTitle}
									onChange={(e) => setNewTemplateTitle(e.target.value)}
									placeholder="e.g. End of Month Settlement Update"
									className="text-xs h-9"
								/>
							</div>

							<div className="space-y-1">
								<Label htmlFor="tpl-category" className="text-xs font-semibold">
									Category
								</Label>
								<Select value={newTemplateCategory} onValueChange={setNewTemplateCategory}>
									<SelectTrigger className="h-9 text-xs">
										<SelectValue placeholder="Category" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Announcements" className="text-xs">Announcements</SelectItem>
										<SelectItem value="Finance" className="text-xs">Finance & Settlements</SelectItem>
										<SelectItem value="Event Operations" className="text-xs">Event Operations</SelectItem>
										<SelectItem value="Compliance" className="text-xs">Policy & Compliance</SelectItem>
										<SelectItem value="System" className="text-xs">System Notices</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<DialogFooter className="gap-2 sm:gap-0">
							<Button variant="ghost" size="sm" onClick={() => setIsSaveTemplateOpen(false)} disabled={isPending}>
								Cancel
							</Button>
							<Button size="sm" onClick={handleSaveTemplate} disabled={isPending} className="bg-primary text-primary-foreground font-semibold">
								{isPending ? "Saving..." : "Save Template"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

			</div>
		</TooltipProvider>
	);
}
