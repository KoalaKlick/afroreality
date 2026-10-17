"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
	Send,
	Clock,
	CheckCircle2,
	AlertCircle,
	Radio,
	MessageSquare,
	RefreshCw,
	Save,
	Users,
	Smartphone,
	ExternalLink,
	ShieldCheck,
	Copy,
	Check,
	Webhook,
	BarChart3,
	DollarSign,
	TrendingUp,
	Activity,
	Layers,
	Search,
	Settings2,
	CheckSquare,
	Square,
	Phone,
	KeyRound,
	Sparkles,
	SlidersHorizontal,
	ChevronRight,
	ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	NomineeReportSettings,
	ReportInterval,
	ActiveEventSummary,
	updateNomineeReportSettings,
	dispatchNomineeReportsNow,
} from "@/lib/server-functions/nominee-reports";
import { WhatsAppUsageSummary, registerNomineeConfirmationTemplate } from "@/lib/server-functions/whatsapp-usage";
import { SmsUsageSummary } from "@/lib/services/sms";
import {
	EventMessagingConfigData,
	ConfirmChannel,
	ReportChannel,
	saveEventMessagingConfig,
} from "@/lib/server-functions/event-messaging-config";
import { updatePhoneLoginOtpChannel } from "@/lib/server-functions/auth";

interface NomineeReportsContentProps {
	initialSettings: NomineeReportSettings;
	summaryData: {
		activeEventsCount: number;
		eligibleNomineesCount: number;
		totalVotesCast: number;
	};
	usageData?: WhatsAppUsageSummary;
	smsUsageData?: SmsUsageSummary;
	activeEvents?: ActiveEventSummary[];
	allConfigs?: Array<EventMessagingConfigData & { eventTitle: string; orgName: string; orgSlug: string }>;
	initialOtpChannel?: "sms" | "whatsapp";
}

export function NomineeReportsContent({
	initialSettings,
	summaryData,
	usageData,
	smsUsageData,
	activeEvents = [],
	allConfigs = [],
	initialOtpChannel = "sms",
}: NomineeReportsContentProps) {
	const [activeTab, setActiveTab] = useState("overview");
	const [settings, setSettings] = useState<NomineeReportSettings>(initialSettings);
	const [configsList, setConfigsList] = useState(allConfigs);
	const [otpChannel, setOtpChannel] = useState<"sms" | "whatsapp">(initialOtpChannel);
	const [isSaving, startSavingTransition] = useTransition();
	const [isSavingOtpChannel, startSavingOtpTransition] = useTransition();
	const [isDispatching, startDispatchTransition] = useTransition();
	const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
	const [copiedField, setCopiedField] = useState<string | null>(null);

	// Search & pagination filters for clean Facebook-style tables
	const [eventSearchQuery, setEventSearchQuery] = useState("");
	const [smsSearchQuery, setSmsSearchQuery] = useState("");
	const [waSearchQuery, setWaSearchQuery] = useState("");
	const [smsPage, setSmsPage] = useState(1);
	const [waPage, setWaPage] = useState(1);
	const PAGE_SIZE = 10;

	// Broadcast modal state
	const [targetScope, setTargetScope] = useState<"all" | "selected">("selected");
	const [selectedEventIds, setSelectedEventIds] = useState<string[]>(() =>
		activeEvents.length > 0 && activeEvents[0]?.id ? [activeEvents[0].id] : []
	);
	const [broadcastChannel, setBroadcastChannel] = useState<"event_default" | "whatsapp" | "sms" | "both">("event_default");

	// Event config quick-edit modal
	const [editingEventConfig, setEditingEventConfig] = useState<(EventMessagingConfigData & { eventTitle: string }) | null>(null);
	const [isSavingEventConfig, startSavingEventConfigTransition] = useTransition();
	const [isRegisteringTemplate, startRegisterTransition] = useTransition();
	const [templateRegResult, setTemplateRegResult] = useState<{ status?: string; error?: string } | null>(null);

	const handleCopy = (text: string, fieldName: string) => {
		navigator.clipboard.writeText(text);
		setCopiedField(fieldName);
		toast.success(`Copied ${fieldName} to clipboard!`);
		setTimeout(() => setCopiedField(null), 2000);
	};

	const handleSaveSchedule = () => {
		startSavingTransition(async () => {
			const res = await updateNomineeReportSettings(settings);
			if (res.success && res.settings) {
				setSettings(res.settings);
				toast.success("Schedule settings saved successfully");
			} else {
				toast.error(res.error || "Failed to update configuration");
			}
		});
	};

	const handleUpdateOtpChannel = (newChannel: "sms" | "whatsapp") => {
		setOtpChannel(newChannel);
		startSavingOtpTransition(async () => {
			const res = await updatePhoneLoginOtpChannel(newChannel);
			if (res.success) {
				toast.success(`Phone login OTP will now be sent via ${newChannel === "whatsapp" ? "WhatsApp" : "SMS"}`);
			} else {
				toast.error("Failed to update OTP channel setting");
			}
		});
	};

	const handleManualDispatch = () => {
		if (targetScope === "selected" && selectedEventIds.length === 0) {
			toast.error("Please select at least one event to broadcast reports to.");
			return;
		}

		setConfirmDialogOpen(false);
		startDispatchTransition(async () => {
			toast.info("Broadcasting voting progress reports to candidates...");
			const res = await dispatchNomineeReportsNow({
				force: true,
				triggeredBy: "super_admin_manual",
				selectedEventIds: targetScope === "selected" ? selectedEventIds : undefined,
				channelOverride: broadcastChannel,
			});

			if (res.success) {
				toast.success(
					`Broadcast completed! ${res.successCount} sent successfully${res.failureCount > 0 ? `, ${res.failureCount} failed` : ""}.`
				);
				setSettings((prev) => ({
					...prev,
					lastRunAt: new Date().toISOString(),
					lastRunStats: {
						totalNominees: res.totalNominees,
						successCount: res.successCount,
						failureCount: res.failureCount,
						timestamp: new Date().toISOString(),
						triggeredBy: "Manual Broadcast",
						eventIds: targetScope === "selected" ? selectedEventIds : undefined,
					},
				}));
			} else {
				toast.error(res.error || res.reason || "Dispatch failed");
			}
		});
	};

	const handleSaveSingleEventConfig = () => {
		if (!editingEventConfig) return;
		startSavingEventConfigTransition(async () => {
			const res = await saveEventMessagingConfig(editingEventConfig);
			if (res.success && res.config) {
				setConfigsList((prev) =>
					prev.map((c) =>
						c.eventId === editingEventConfig.eventId ? { ...c, ...res.config! } : c
					)
				);
				toast.success(`Messaging rules saved for "${editingEventConfig.eventTitle}"`);
				setEditingEventConfig(null);
			} else {
				toast.error(res.error || "Failed to save event messaging settings");
			}
		});
	};

	const toggleEventSelection = (eventId: string) => {
		setSelectedEventIds((prev) =>
			prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
		);
	};

	// Filtered configs list
	const filteredConfigs = useMemo(() => {
		if (!eventSearchQuery.trim()) return configsList;
		const q = eventSearchQuery.toLowerCase();
		return configsList.filter(
			(c) =>
				c.eventTitle?.toLowerCase().includes(q) ||
				c.orgName?.toLowerCase().includes(q)
		);
	}, [configsList, eventSearchQuery]);

	// Filtered SMS logs
	const filteredSmsLogs = useMemo(() => {
		const logs = smsUsageData?.recentLogs || [];
		if (!smsSearchQuery.trim()) return logs;
		const q = smsSearchQuery.toLowerCase();
		return logs.filter(
			(l) =>
				l.recipientPhone?.toLowerCase().includes(q) ||
				l.message?.toLowerCase().includes(q) ||
				l.purpose?.toLowerCase().includes(q) ||
				l.status?.toLowerCase().includes(q)
		);
	}, [smsUsageData?.recentLogs, smsSearchQuery]);

	const totalSmsPages = Math.max(1, Math.ceil(filteredSmsLogs.length / PAGE_SIZE));
	const paginatedSmsLogs = useMemo(() => {
		const start = (smsPage - 1) * PAGE_SIZE;
		return filteredSmsLogs.slice(start, start + PAGE_SIZE);
	}, [filteredSmsLogs, smsPage]);

	// Filtered WhatsApp logs
	const filteredWaLogs = useMemo(() => {
		const logs = usageData?.recentLogs || [];
		if (!waSearchQuery.trim()) return logs;
		const q = waSearchQuery.toLowerCase();
		return logs.filter(
			(l) =>
				l.recipientPhone?.toLowerCase().includes(q) ||
				l.templateName?.toLowerCase().includes(q) ||
				l.category?.toLowerCase().includes(q) ||
				l.status?.toLowerCase().includes(q) ||
				l.errorMessage?.toLowerCase().includes(q)
		);
	}, [usageData?.recentLogs, waSearchQuery]);

	const totalWaPages = Math.max(1, Math.ceil(filteredWaLogs.length / PAGE_SIZE));
	const paginatedWaLogs = useMemo(() => {
		const start = (waPage - 1) * PAGE_SIZE;
		return filteredWaLogs.slice(start, start + PAGE_SIZE);
	}, [filteredWaLogs, waPage]);

	const calculatedRecipients = targetScope === "all"
		? summaryData.eligibleNomineesCount
		: activeEvents
				.filter((e) => selectedEventIds.includes(e.id))
				.reduce((acc, curr) => acc + curr.nomineeCount, 0);

	const formatHour = (hour: number) => {
		const h = hour % 24;
		const ampm = h >= 12 ? "PM" : "AM";
		const formatted = h % 12 === 0 ? 12 : h % 12;
		return `${formatted}:00 ${ampm} UTC`;
	};

	const webhookInfo = usageData?.webhookConfig || {
		callbackUrl: "https://fextiva.com/api/webhooks/whatsapp",
		verifyToken: "fextiva_whatsapp_secure_webhook_token_2026",
		wabaId: "1744340760020720",
		phoneNumberId: "1279312171935266",
		displayPhone: "+233 50 989 7757",
	};

	return (
		<div className="space-y-6 max-w-7xl mx-auto">
			{/* ── Facebook-Style Clean Header ────────────────────────────────────── */}
			<div className="bg-card border border-border/70 rounded-2xl p-6 shadow-xs">
				<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
					<div className="space-y-1.5">
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
								<MessageSquare className="h-5 w-5" />
							</div>
							<div>
								<div className="flex items-center gap-2.5">
									<h1 className="text-xl font-bold tracking-tight text-foreground">
										Messaging & Communications Hub
									</h1>
									<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
										<span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
										All Gateways Connected
									</span>
								</div>
								<p className="text-xs text-muted-foreground mt-0.5">
									Manage automated nominee reports, ticket confirmations, and phone verification across WhatsApp & Arkesel SMS.
								</p>
							</div>
						</div>
					</div>

					{/* Primary Quick Actions */}
					<div className="flex items-center gap-2.5 shrink-0">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setConfirmDialogOpen(true)}
							disabled={isDispatching || summaryData.eligibleNomineesCount === 0}
							className="rounded-xl border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 text-xs font-semibold gap-2 h-9 px-4"
						>
							<Send className={`h-3.5 w-3.5 ${isDispatching ? "animate-pulse" : ""}`} />
							{isDispatching ? "Broadcasting..." : "Send Reports Now"}
						</Button>

						<Button
							onClick={handleSaveSchedule}
							disabled={isSaving}
							size="sm"
							className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold gap-2 h-9 px-4 shadow-xs"
						>
							<Save className="h-3.5 w-3.5" />
							{isSaving ? "Saving..." : "Save Schedule"}
						</Button>
					</div>
				</div>

				{/* ── Clean Channel Status Strip (Facebook Meta Business Suite style) ── */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-5 border-t border-border/50">
					{/* Arkesel SMS status */}
					<div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/50">
						<div className="flex items-center gap-3">
							<div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
								<Smartphone className="h-4 w-4" />
							</div>
							<div>
								<div className="flex items-center gap-1.5">
									<p className="text-xs font-semibold text-foreground">Arkesel SMS Gateway</p>
									<span className="text-[10px] bg-emerald-500/15 text-emerald-600 font-medium px-1.5 py-0.2 rounded">Active</span>
								</div>
								<p className="text-[11px] text-muted-foreground">
									Sender ID: <span className="font-semibold text-foreground">Fextiva</span> &bull; {(smsUsageData?.totalSent ?? 0).toLocaleString()} sent
								</p>
							</div>
						</div>
						<div className="text-right">
							<p className="text-xs font-bold text-foreground">
								${(smsUsageData?.estimatedSpendUsd ?? 0).toFixed(2)}
							</p>
							<p className="text-[10px] text-muted-foreground">Est. Spend</p>
						</div>
					</div>

					{/* Meta WhatsApp status */}
					<div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/50">
						<div className="flex items-center gap-3">
							<div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
								<MessageSquare className="h-4 w-4" />
							</div>
							<div>
								<div className="flex items-center gap-1.5">
									<p className="text-xs font-semibold text-foreground">Meta WhatsApp Cloud</p>
									<span className="text-[10px] bg-emerald-500/15 text-emerald-600 font-medium px-1.5 py-0.2 rounded">Tier 1</span>
								</div>
								<p className="text-[11px] text-muted-foreground truncate max-w-[140px]">
									+233 50 989 7757 &bull; {usageData?.deliveryRate ?? 100}% del.
								</p>
							</div>
						</div>
						<div className="text-right">
							<p className="text-xs font-bold text-foreground">
								{(usageData?.totalSent ?? 0).toLocaleString()}
							</p>
							<p className="text-[10px] text-muted-foreground">Messages</p>
						</div>
					</div>

					{/* Phone Login OTP Channel Quick Control */}
					<div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/50">
						<div className="flex items-center gap-3">
							<div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
								<KeyRound className="h-4 w-4" />
							</div>
							<div>
								<p className="text-xs font-semibold text-foreground">Login OTP Channel</p>
								<p className="text-[11px] text-muted-foreground">
									Delivers phone sign-in codes
								</p>
							</div>
						</div>
						<div className="flex items-center gap-1 bg-background border border-border rounded-lg p-0.5">
							<button
								type="button"
								onClick={() => handleUpdateOtpChannel("sms")}
								disabled={isSavingOtpChannel}
								className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-all ${
									otpChannel === "sms"
										? "bg-amber-500 text-white shadow-xs"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								SMS
							</button>
							<button
								type="button"
								onClick={() => handleUpdateOtpChannel("whatsapp")}
								disabled={isSavingOtpChannel}
								className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-all ${
									otpChannel === "whatsapp"
										? "bg-emerald-600 text-white shadow-xs"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								WhatsApp
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* ── Modern Navigation Tabs ────────────────────────────────────────── */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
				<div className="bg-card border border-border/70 rounded-xl p-1.5 shadow-xs">
					<TabsList className="bg-transparent h-auto p-0 flex flex-wrap gap-1.5 w-full justify-start">
						<TabsTrigger
							value="overview"
							className="rounded-lg px-4 py-2 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 transition-all"
						>
							<Clock className="h-3.5 w-3.5" />
							Schedule & Broadcast
						</TabsTrigger>

						<TabsTrigger
							value="events"
							className="rounded-lg px-4 py-2 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 transition-all"
						>
							<Layers className="h-3.5 w-3.5" />
							Event Channels
							<span className="ml-1 text-[10px] px-1.5 py-0.2 bg-muted rounded-full">
								{configsList.length}
							</span>
						</TabsTrigger>

						<TabsTrigger
							value="sms"
							className="rounded-lg px-4 py-2 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 transition-all"
						>
							<Smartphone className="h-3.5 w-3.5" />
							SMS Deliverability & Logs
						</TabsTrigger>

						<TabsTrigger
							value="whatsapp"
							className="rounded-lg px-4 py-2 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 transition-all"
						>
							<Activity className="h-3.5 w-3.5" />
							WhatsApp Cloud & Webhooks
						</TabsTrigger>
					</TabsList>
				</div>

				{/* ══════════════════════════════════════════════════════════════════════
				    TAB 1: OVERVIEW & SCHEDULE
				══════════════════════════════════════════════════════════════════════ */}
				<TabsContent value="overview" className="space-y-6 m-0">
					{/* 4 Clean Metric Cards */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						<div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs flex items-center justify-between">
							<div className="space-y-1">
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
									Scheduler Status
								</p>
								<p className="text-xl font-bold text-foreground">
									{settings.enabled ? "Active" : "Paused"}
								</p>
								<p className="text-[11px] text-muted-foreground">
									{settings.enabled ? `Runs ${settings.interval.replace(/_/g, " ")}` : "Turn on to automate"}
								</p>
							</div>
							<div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
								<Radio className={`h-5 w-5 ${settings.enabled ? "animate-pulse" : ""}`} />
							</div>
						</div>

						<div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs flex items-center justify-between">
							<div className="space-y-1">
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
									Eligible Candidates
								</p>
								<p className="text-xl font-bold text-foreground">
									{summaryData.eligibleNomineesCount.toLocaleString()}
								</p>
								<p className="text-[11px] text-muted-foreground">
									Across {summaryData.activeEventsCount} active events
								</p>
							</div>
							<div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
								<Users className="h-5 w-5" />
							</div>
						</div>

						<div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs flex items-center justify-between">
							<div className="space-y-1">
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
									Delivery Time
								</p>
								<p className="text-xl font-bold text-foreground">
									{formatHour(settings.preferredHourUtc)}
								</p>
								<p className="text-[11px] text-muted-foreground capitalize">
									Cadence: {settings.interval.replace(/_/g, " ")}
								</p>
							</div>
							<div className="h-11 w-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
								<Clock className="h-5 w-5" />
							</div>
						</div>

						<div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs flex items-center justify-between">
							<div className="space-y-1">
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
									Total Votes Tracked
								</p>
								<p className="text-xl font-bold text-foreground">
									{summaryData.totalVotesCast.toLocaleString()}
								</p>
								<p className="text-[11px] text-muted-foreground">
									Live voting transactions
								</p>
							</div>
							<div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
								<BarChart3 className="h-5 w-5" />
							</div>
						</div>
					</div>

					{/* Global Schedule Card */}
					<Card className="border border-border/70 rounded-2xl shadow-xs">
						<CardHeader className="p-6 pb-4 border-b border-border/50">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
								<div className="space-y-0.5">
									<CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
										<Clock className="h-4 w-4 text-primary" />
										Automated Nominee Report Schedule
									</CardTitle>
									<CardDescription className="text-xs">
										Configure global defaults for periodic voting standings sent to candidates' phones.
									</CardDescription>
								</div>

								<div className="flex items-center gap-2.5 bg-muted/40 px-3 py-1.5 rounded-xl border border-border/60">
									<Label htmlFor="master-toggle" className="text-xs font-semibold cursor-pointer">
										{settings.enabled ? "Automation Enabled" : "Automation Paused"}
									</Label>
									<Switch
										id="master-toggle"
										checked={settings.enabled}
										onCheckedChange={(checked) =>
											setSettings((prev) => ({ ...prev, enabled: checked }))
										}
									/>
								</div>
							</div>
						</CardHeader>

						<CardContent className="p-6 space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{/* Group A: Cadence & Timing */}
								<div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-4">
									<div className="flex items-center gap-2 border-b border-border/40 pb-2">
										<Clock className="h-4 w-4 text-purple-500" />
										<div>
											<p className="font-bold text-foreground text-xs">Cadence & Timing</p>
											<p className="text-[10px] text-muted-foreground">Controls broadcast frequency and scheduled delivery hour</p>
										</div>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										{/* Frequency */}
										<div className="space-y-1.5">
											<Label className="text-xs font-semibold">Frequency</Label>
											<Select
												value={settings.interval}
												onValueChange={(val: ReportInterval) =>
													setSettings((prev) => ({ ...prev, interval: val }))
												}
											>
												<SelectTrigger className="rounded-xl text-xs bg-background">
													<SelectValue placeholder="Frequency" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="every_6_hours">Every 6 Hours</SelectItem>
													<SelectItem value="every_12_hours">Every 12 Hours</SelectItem>
													<SelectItem value="daily">Daily</SelectItem>
													<SelectItem value="weekly">Weekly</SelectItem>
												</SelectContent>
											</Select>
										</div>

										{/* Time */}
										<div className="space-y-1.5">
											<Label className="text-xs font-semibold">Scheduled Hour</Label>
											<Select
												value={String(settings.preferredHourUtc)}
												onValueChange={(val) =>
													setSettings((prev) => ({ ...prev, preferredHourUtc: Number(val) }))
												}
											>
												<SelectTrigger className="rounded-xl text-xs bg-background">
													<SelectValue placeholder="Select hour" />
												</SelectTrigger>
												<SelectContent>
													{[6, 8, 9, 10, 12, 14, 16, 18, 20].map((hour) => (
														<SelectItem key={hour} value={String(hour)}>
															{hour}:00 UTC ({hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`})
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</div>
								</div>

								{/* Group B: Delivery & Audience */}
								<div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-4">
									<div className="flex items-center gap-2 border-b border-border/40 pb-2">
										<MessageSquare className="h-4 w-4 text-emerald-500" />
										<div>
											<p className="font-bold text-foreground text-xs">Delivery & Audience Filter</p>
											<p className="text-[10px] text-muted-foreground">Select candidate gateway and vote threshold</p>
										</div>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										{/* Default Channel */}
										<div className="space-y-1.5">
											<Label className="text-xs font-semibold">Default Report Channel</Label>
											<Select
												value={settings.defaultChannel || "whatsapp"}
												onValueChange={(val: any) =>
													setSettings((prev) => ({ ...prev, defaultChannel: val }))
												}
											>
												<SelectTrigger className="rounded-xl text-xs bg-background">
													<SelectValue placeholder="Channel" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="both">WhatsApp with SMS Fallback (Recommended)</SelectItem>
													<SelectItem value="whatsapp">WhatsApp Only (Meta Cloud)</SelectItem>
													<SelectItem value="sms">SMS Only (Arkesel)</SelectItem>
												</SelectContent>
											</Select>
										</div>

										{/* Recipient Filter */}
										<div className="space-y-1.5">
											<Label className="text-xs font-semibold">Audience Filter</Label>
											<div className="pt-2 flex items-center gap-2">
												<Switch
													id="onlyWithVotesToggle"
													checked={settings.onlyWithVotes}
													onCheckedChange={(checked) =>
														setSettings((prev) => ({ ...prev, onlyWithVotes: checked }))
													}
												/>
												<Label htmlFor="onlyWithVotesToggle" className="text-xs cursor-pointer text-muted-foreground">
													Only nominees with &gt; 0 votes
												</Label>
											</div>
										</div>
									</div>
								</div>
							</div>

							{/* Last Run Stats Banner */}
							{settings.lastRunStats && (
								<div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
									<div className="flex items-center gap-3">
										<div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
											<CheckCircle2 className="h-5 w-5" />
										</div>
										<div>
											<p className="text-xs font-semibold text-foreground">
												Last Broadcast: {new Date(settings.lastRunStats.timestamp).toLocaleString()} ({settings.lastRunStats.triggeredBy || "Automated"})
											</p>
											<p className="text-[11px] text-muted-foreground">
												<span className="text-emerald-600 dark:text-emerald-400 font-semibold">
													{settings.lastRunStats.successCount} sent
												</span>
												{settings.lastRunStats.failureCount > 0 && (
													<span className="text-destructive font-semibold ml-1.5">
														({settings.lastRunStats.failureCount} failed)
													</span>
												)}
												{" "}&bull; Total eligible: {settings.lastRunStats.totalNominees}
											</p>
										</div>
									</div>

									<Button
										variant="outline"
										size="sm"
										onClick={() => setConfirmDialogOpen(true)}
										className="rounded-xl shrink-0 text-xs gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
									>
										<Send className="h-3 w-3" />
										Trigger Immediate Broadcast
									</Button>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* ══════════════════════════════════════════════════════════════════════
				    TAB 2: EVENT CHANNEL ROUTING
				══════════════════════════════════════════════════════════════════════ */}
				<TabsContent value="events" className="space-y-6 m-0">
					<Card className="border border-border/70 rounded-2xl shadow-xs overflow-hidden">
						<CardHeader className="p-6 pb-4 border-b border-border/50">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
								<div>
									<CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
										<Layers className="h-4 w-4 text-indigo-500" />
										Event Notification Channels
									</CardTitle>
									<CardDescription className="text-xs mt-0.5">
										Customize delivery channels for ticket purchases, voting receipts, and nominee reports per individual event.
									</CardDescription>
								</div>

								{/* Search Bar */}
								<div className="relative w-full sm:w-64">
									<Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
									<Input
										placeholder="Search event or org..."
										value={eventSearchQuery}
										onChange={(e) => setEventSearchQuery(e.target.value)}
										className="pl-8 text-xs rounded-xl h-9"
									/>
								</div>
							</div>
						</CardHeader>

						<CardContent className="p-0">
							{filteredConfigs.length === 0 ? (
								<div className="text-center py-12 text-muted-foreground text-xs">
									{eventSearchQuery ? "No events match your search." : "No published or ongoing events found."}
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full text-left text-xs">
										<thead className="bg-muted/40 border-b border-border/50 text-muted-foreground">
											<tr>
												<th className="py-3 px-5 font-semibold">Event</th>
												<th className="py-3 px-4 font-semibold">Organization</th>
												<th className="py-3 px-4 font-semibold">Tickets</th>
												<th className="py-3 px-4 font-semibold">Vote Receipts</th>
												<th className="py-3 px-4 font-semibold">Nominee Reports</th>
												<th className="py-3 px-5 font-semibold text-right">Settings</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-border/40">
											{filteredConfigs.map((cfg) => (
												<tr key={cfg.eventId} className="hover:bg-muted/20 transition-colors">
													<td className="py-3.5 px-5 font-medium text-foreground">
														{cfg.eventTitle}
													</td>
													<td className="py-3.5 px-4 text-muted-foreground">
														{cfg.orgName}
													</td>
													<td className="py-3.5 px-4">
														<span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
															cfg.ticketConfirmChannel === "whatsapp_sms"
																? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
																: cfg.ticketConfirmChannel === "whatsapp"
																	? "bg-green-500/10 text-green-600 border border-green-500/20"
																	: cfg.ticketConfirmChannel === "sms"
																		? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
																		: "bg-muted text-muted-foreground"
														}`}>
															{cfg.ticketConfirmChannel.replace("_", " + ")}
														</span>
													</td>
													<td className="py-3.5 px-4">
														<span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
															cfg.voteReceiptChannel === "whatsapp_sms"
																? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
																: cfg.voteReceiptChannel === "whatsapp"
																	? "bg-green-500/10 text-green-600 border border-green-500/20"
																	: cfg.voteReceiptChannel === "sms"
																		? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
																		: "bg-muted text-muted-foreground"
														}`}>
															{cfg.voteReceiptChannel.replace("_", " + ")}
														</span>
													</td>
													<td className="py-3.5 px-4">
														<div className="flex items-center gap-1.5">
															<span
																className={`h-2 w-2 rounded-full ${
																	cfg.reportEnabled ? "bg-emerald-500" : "bg-muted-foreground/30"
																}`}
															/>
															<span className="font-medium text-foreground">
																{cfg.reportEnabled
																	? `${cfg.reportChannel.replace("_", " + ")}`
																	: "Disabled"}
															</span>
														</div>
													</td>
													<td className="py-3.5 px-5 text-right">
														<Button
															variant="outline"
															size="sm"
															onClick={() => setEditingEventConfig(cfg)}
															className="rounded-lg h-7 px-3 text-xs gap-1.5 border-border hover:bg-muted"
														>
															<Settings2 className="h-3 w-3" />
															Edit
														</Button>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* ══════════════════════════════════════════════════════════════════════
				    TAB 3: SMS DELIVERABILITY & LOGS (ARKESEL)
				══════════════════════════════════════════════════════════════════════ */}
				<TabsContent value="sms" className="space-y-6 m-0">
					{/* SMS KPI Overview */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						<div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs flex items-center justify-between">
							<div className="space-y-1">
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
									Total SMS Sent
								</p>
								<p className="text-xl font-bold text-foreground">
									{(smsUsageData?.totalSent ?? 0).toLocaleString()}
								</p>
								<p className="text-[11px] text-muted-foreground">Provider: Arkesel Ghana</p>
							</div>
							<div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
								<Smartphone className="h-5 w-5" />
							</div>
						</div>

						<div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs flex items-center justify-between">
							<div className="space-y-1">
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
									Deliverability Rate
								</p>
								<p className="text-xl font-bold text-foreground">
									{smsUsageData?.totalSent && smsUsageData.totalSent > 0
										? `${Math.round(((smsUsageData.totalSent - (smsUsageData.totalFailed || 0)) / smsUsageData.totalSent) * 100)}%`
										: "100%"}
								</p>
								<p className="text-[11px] text-muted-foreground">
									{smsUsageData?.totalFailed ?? 0} delivery failures
								</p>
							</div>
							<div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
								<CheckCircle2 className="h-5 w-5" />
							</div>
						</div>

						<div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs flex items-center justify-between">
							<div className="space-y-1">
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
									Estimated Spend
								</p>
								<p className="text-xl font-bold text-foreground">
									${(smsUsageData?.estimatedSpendUsd ?? 0).toFixed(3)} USD
								</p>
								<p className="text-[11px] text-muted-foreground">
									~GH₵{((smsUsageData?.estimatedSpendUsd ?? 0) * 15.5).toFixed(2)} GHS
								</p>
							</div>
							<div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
								<DollarSign className="h-5 w-5" />
							</div>
						</div>

						<div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs flex items-center justify-between">
							<div className="space-y-1">
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
									Sender ID
								</p>
								<p className="text-xl font-bold text-foreground">Fextiva</p>
								<p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
									Active & Verified
								</p>
							</div>
							<div className="h-11 w-11 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
								<ShieldCheck className="h-5 w-5" />
							</div>
						</div>
					</div>

					{/* Searchable SMS Outbound Logs Table */}
					<Card className="border border-border/70 rounded-2xl shadow-xs overflow-hidden">
						<CardHeader className="p-6 pb-4 border-b border-border/50">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
								<div>
									<CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
										<Smartphone className="h-4 w-4 text-amber-500" />
										Recent Arkesel SMS Outbound Logs
									</CardTitle>
									<CardDescription className="text-xs mt-0.5">
										Single-segment SMS notifications sent for ticket confirmations, voting receipts, nominee reports, and OTPs.
									</CardDescription>
								</div>

								<div className="relative w-full sm:w-64">
									<Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
									<Input
										placeholder="Search phone or text..."
										value={smsSearchQuery}
										onChange={(e) => {
											setSmsSearchQuery(e.target.value);
											setSmsPage(1);
										}}
										className="pl-8 text-xs rounded-xl h-9"
									/>
								</div>
							</div>
						</CardHeader>

						<CardContent className="p-0">
							{filteredSmsLogs.length === 0 ? (
								<div className="text-center py-12 text-muted-foreground text-xs">
									{smsSearchQuery ? "No logs match your search filter." : "No SMS messages sent yet."}
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full text-left text-xs">
										<thead className="bg-muted/40 border-b border-border/50 text-muted-foreground">
											<tr>
												<th className="py-3 px-5 font-semibold">Recipient</th>
												<th className="py-3 px-4 font-semibold">Purpose</th>
												<th className="py-3 px-4 font-semibold">Message Preview</th>
												<th className="py-3 px-4 font-semibold">Status</th>
												<th className="py-3 px-5 font-semibold text-right">Time</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-border/40">
											{paginatedSmsLogs.map((log) => (
												<tr key={log.id} className="hover:bg-muted/20">
													<td className="py-3.5 px-5 font-mono text-xs text-foreground font-medium">
														{log.recipientPhone}
													</td>
													<td className="py-3.5 px-4">
														<span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground capitalize">
															{log.purpose?.replace(/_/g, " ") || "General"}
														</span>
													</td>
													<td className="py-3.5 px-4 max-w-sm truncate text-muted-foreground font-mono text-[11px]">
														{log.message || "—"}
													</td>
													<td className="py-3.5 px-4">
														<span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
															log.status === "sent" || log.status === "delivered"
																? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
																: "bg-destructive/10 text-destructive border border-destructive/20"
														}`}>
															{log.status}
														</span>
													</td>
													<td className="py-3.5 px-5 text-right text-muted-foreground text-[11px]">
														{new Date(log.createdAt).toLocaleString()}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}

							{/* Pagination Footer */}
							{filteredSmsLogs.length > 0 && (
								<div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border/50 text-xs text-muted-foreground bg-muted/10">
									<div>
										Showing <span className="font-semibold text-foreground">{Math.min((smsPage - 1) * PAGE_SIZE + 1, filteredSmsLogs.length)}</span> to{" "}
										<span className="font-semibold text-foreground">{Math.min(smsPage * PAGE_SIZE, filteredSmsLogs.length)}</span> of{" "}
										<span className="font-semibold text-foreground">{filteredSmsLogs.length}</span> records
									</div>
									<div className="flex items-center gap-1.5">
										<Button
											variant="outline"
											size="sm"
											className="h-8 px-2.5 text-xs rounded-lg gap-1"
											disabled={smsPage <= 1}
											onClick={() => setSmsPage((p) => Math.max(1, p - 1))}
										>
											<ChevronLeft className="h-3.5 w-3.5" />
											Prev
										</Button>
										<span className="text-xs font-medium px-2">
											Page {smsPage} of {totalSmsPages}
										</span>
										<Button
											variant="outline"
											size="sm"
											className="h-8 px-2.5 text-xs rounded-lg gap-1"
											disabled={smsPage >= totalSmsPages}
											onClick={() => setSmsPage((p) => Math.min(totalSmsPages, p + 1))}
										>
											Next
											<ChevronRight className="h-3.5 w-3.5" />
										</Button>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* ══════════════════════════════════════════════════════════════════════
				    TAB 4: WHATSAPP CLOUD & WEBHOOKS
				══════════════════════════════════════════════════════════════════════ */}
				<TabsContent value="whatsapp" className="space-y-6 m-0">
					{/* WhatsApp KPI Overview */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						<div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs flex items-center justify-between">
							<div className="space-y-1">
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
									Total WA Sent
								</p>
								<p className="text-xl font-bold text-foreground">
									{(usageData?.totalSent ?? 0).toLocaleString()}
								</p>
								<p className="text-[11px] text-muted-foreground">Meta Cloud API logs</p>
							</div>
							<div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
								<MessageSquare className="h-5 w-5" />
							</div>
						</div>

						<div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs flex items-center justify-between">
							<div className="space-y-1">
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
									Delivery Rate
								</p>
								<p className="text-xl font-bold text-foreground">
									{usageData?.deliveryRate ?? 100}%
								</p>
								<p className="text-[11px] text-muted-foreground">
									{usageData?.totalDelivered ?? 0} confirmed delivered
								</p>
							</div>
							<div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
								<TrendingUp className="h-5 w-5" />
							</div>
						</div>

						<div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs flex items-center justify-between">
							<div className="space-y-1">
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
									Estimated Spend
								</p>
								<p className="text-xl font-bold text-foreground">
									${(usageData?.estimatedSpendUsd ?? 0).toFixed(3)} USD
								</p>
								<p className="text-[11px] text-muted-foreground">
									{usageData?.billableCount ?? 0} billable conversations
								</p>
							</div>
							<div className="h-11 w-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
								<DollarSign className="h-5 w-5" />
							</div>
						</div>

						<div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs flex items-center justify-between">
							<div className="space-y-1">
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
									Account Tier
								</p>
								<p className="text-xl font-bold text-foreground">Tier 1 (1k/day)</p>
								<p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
									Verified & Active
								</p>
							</div>
							<div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
								<ShieldCheck className="h-5 w-5" />
							</div>
						</div>
					</div>

					{/* Template Management Card */}
					<Card className="border border-border/70 rounded-2xl shadow-xs">
						<CardHeader className="p-6 pb-4 border-b border-border/50">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
								<div className="space-y-0.5">
									<CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
										<Sparkles className="h-4 w-4 text-indigo-500" />
										Message Template Registration
									</CardTitle>
									<CardDescription className="text-xs">
										Submit templates to Meta as <span className="font-semibold text-emerald-600">UTILITY</span> — the cheapest tier (~$0.007) with no marketing opt-in required.
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className="p-6">
							<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 rounded-xl border border-border/60 bg-muted/20">
								<div className="space-y-1">
									<p className="text-xs font-semibold text-foreground">fextiva_nominee_confirmation_en</p>
									<p className="text-[11px] text-muted-foreground">
										Header: Event flier image · Body: Name, Event, Category, Voting Code · Buttons: View Event + Contact Organizer (wa.me)
									</p>
									{templateRegResult && (
										<p className={`text-[11px] font-semibold mt-1 ${
											templateRegResult?.error ? "text-destructive" :
											templateRegResult?.status === "APPROVED" ? "text-emerald-600" : "text-amber-600"
										}`}>
											{templateRegResult.error ? `❌ ${templateRegResult.error}` : `✅ Status: ${templateRegResult.status || "PENDING"}`}
										</p>
									)}
								</div>
								<Button
									size="sm"
									disabled={isRegisteringTemplate}
									className="rounded-xl text-xs font-semibold gap-2 shrink-0"
									onClick={() => startRegisterTransition(async () => {
										const res = await registerNomineeConfirmationTemplate();
										setTemplateRegResult({ status: res.status, error: res.error });
										if (res.success) toast.success(`Template submitted — status: ${res.status || "PENDING"}`);
										else toast.error(res.error || "Template registration failed");
									})}
								>
									{isRegisteringTemplate
										? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Submitting...</>
										: <><Send className="h-3.5 w-3.5" /> Register Template</>
									}
								</Button>
							</div>
						</CardContent>
					</Card>

					{/* Meta Webhook Integration Card */}
					<Card className="border border-border/70 rounded-2xl shadow-xs">
						<CardHeader className="p-6 pb-4 border-b border-border/50">
							<div className="space-y-0.5">
								<CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
									<Webhook className="h-4 w-4 text-emerald-500" />
									Meta Cloud API Webhook Integration
								</CardTitle>
								<CardDescription className="text-xs">
									Configure these values in Meta Developers &gt; WhatsApp &gt; Configuration to receive live delivery status callbacks.
								</CardDescription>
							</div>
						</CardHeader>
						<CardContent className="p-6 space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="p-4 bg-muted/30 rounded-xl border border-border/60 space-y-1.5">
									<div className="flex items-center justify-between">
										<span className="text-xs font-semibold text-muted-foreground">Callback URL</span>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleCopy(webhookInfo.callbackUrl, "Callback URL")}
											className="h-6 px-2 text-xs gap-1 rounded-lg"
										>
											{copiedField === "Callback URL" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
											Copy
										</Button>
									</div>
									<p className="text-xs font-mono break-all text-foreground select-all font-medium">
										{webhookInfo.callbackUrl}
									</p>
								</div>

								<div className="p-4 bg-muted/30 rounded-xl border border-border/60 space-y-1.5">
									<div className="flex items-center justify-between">
										<span className="text-xs font-semibold text-muted-foreground">Verify Token</span>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleCopy(webhookInfo.verifyToken, "Verify Token")}
											className="h-6 px-2 text-xs gap-1 rounded-lg"
										>
											{copiedField === "Verify Token" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
											Copy
										</Button>
									</div>
									<p className="text-xs font-mono break-all text-foreground select-all font-medium">
										{webhookInfo.verifyToken}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Searchable WhatsApp Outbound Logs Table */}
					<Card className="border border-border/70 rounded-2xl shadow-xs overflow-hidden">
						<CardHeader className="p-6 pb-4 border-b border-border/50">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
								<div>
									<CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
										<MessageSquare className="h-4 w-4 text-emerald-500" />
										Recent WhatsApp Cloud API Outbound Logs
									</CardTitle>
									<CardDescription className="text-xs mt-0.5">
										Live transmission records, delivery confirmations, cost attribution, and error telemetry from Meta Cloud.
									</CardDescription>
								</div>

								<div className="relative w-full sm:w-64">
									<Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
									<Input
										placeholder="Search phone, template, status..."
										value={waSearchQuery}
										onChange={(e) => {
											setWaSearchQuery(e.target.value);
											setWaPage(1);
										}}
										className="pl-8 text-xs rounded-xl h-9"
									/>
								</div>
							</div>
						</CardHeader>

						<CardContent className="p-0">
							{filteredWaLogs.length === 0 ? (
								<div className="text-center py-12 text-muted-foreground text-xs">
									{waSearchQuery ? "No logs match your search filter." : "No WhatsApp messages sent yet."}
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full text-left text-xs">
										<thead className="bg-muted/40 border-b border-border/50 text-muted-foreground">
											<tr>
												<th className="py-3 px-5 font-semibold">Recipient</th>
												<th className="py-3 px-4 font-semibold">Type / Template</th>
												<th className="py-3 px-4 font-semibold">Category</th>
												<th className="py-3 px-4 font-semibold">Status</th>
												<th className="py-3 px-4 font-semibold">Cost</th>
												<th className="py-3 px-5 font-semibold text-right">Time</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-border/40">
											{paginatedWaLogs.map((log) => (
												<tr key={log.id} className="hover:bg-muted/20">
													<td className="py-3.5 px-5 font-mono text-xs text-foreground font-medium">
														{log.recipientPhone}
													</td>
													<td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground">
														{log.templateName || "direct_text"}
													</td>
													<td className="py-3.5 px-4">
														<span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground uppercase">
															{log.category || "UTILITY"}
														</span>
													</td>
													<td className="py-3.5 px-4">
														<div>
															<span
																className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
																	log.status === "delivered"
																		? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
																		: log.status === "read"
																			? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
																			: log.status === "sent"
																				? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
																				: "bg-destructive/10 text-destructive border border-destructive/20"
																}`}
															>
																{log.status}
															</span>
															{log.errorMessage && (
																<p className="text-[10px] text-destructive mt-1 max-w-xs break-words">
																	{log.errorMessage}
																</p>
															)}
														</div>
													</td>
													<td className="py-3.5 px-4 font-mono text-muted-foreground text-[11px]">
														${log.estimatedCost ? log.estimatedCost.toFixed(3) : "0.007"}
													</td>
													<td className="py-3.5 px-5 text-right text-muted-foreground text-[11px] whitespace-nowrap">
														{new Date(log.createdAt).toLocaleString()}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}

							{/* Pagination Footer */}
							{filteredWaLogs.length > 0 && (
								<div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border/50 text-xs text-muted-foreground bg-muted/10">
									<div>
										Showing <span className="font-semibold text-foreground">{Math.min((waPage - 1) * PAGE_SIZE + 1, filteredWaLogs.length)}</span> to{" "}
										<span className="font-semibold text-foreground">{Math.min(waPage * PAGE_SIZE, filteredWaLogs.length)}</span> of{" "}
										<span className="font-semibold text-foreground">{filteredWaLogs.length}</span> records
									</div>
									<div className="flex items-center gap-1.5">
										<Button
											variant="outline"
											size="sm"
											className="h-8 px-2.5 text-xs rounded-lg gap-1"
											disabled={waPage <= 1}
											onClick={() => setWaPage((p) => Math.max(1, p - 1))}
										>
											<ChevronLeft className="h-3.5 w-3.5" />
											Prev
										</Button>
										<span className="text-xs font-medium px-2">
											Page {waPage} of {totalWaPages}
										</span>
										<Button
											variant="outline"
											size="sm"
											className="h-8 px-2.5 text-xs rounded-lg gap-1"
											disabled={waPage >= totalWaPages}
											onClick={() => setWaPage((p) => Math.min(totalWaPages, p + 1))}
										>
											Next
											<ChevronRight className="h-3.5 w-3.5" />
										</Button>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* ── BROADCAST CONFIRMATION MODAL ──────────────────────────────────── */}
			<Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
				<DialogContent className="sm:max-w-xl rounded-2xl">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-foreground font-bold">
							<Send className="h-5 w-5 text-emerald-500" />
							Trigger Immediate Nominee Reports Broadcast
						</DialogTitle>
						<DialogDescription className="text-xs">
							Send current standing and vote tallies directly to candidate phones via WhatsApp or SMS.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						{/* Target Scope */}
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold">Target Audience</Label>
							<div className="grid grid-cols-2 gap-3">
								<button
									type="button"
									onClick={() => setTargetScope("selected")}
									className={`p-3 rounded-xl border text-left text-xs transition-all ${
										targetScope === "selected"
											? "border-emerald-500 bg-emerald-500/10 text-foreground"
											: "border-border/70 hover:bg-muted/40 text-muted-foreground"
									}`}
								>
									<p className="font-semibold text-foreground">Selected Events ({selectedEventIds.length})</p>
									<p className="text-[11px] mt-0.5">Target specific events only</p>
								</button>

								<button
									type="button"
									onClick={() => setTargetScope("all")}
									className={`p-3 rounded-xl border text-left text-xs transition-all ${
										targetScope === "all"
											? "border-emerald-500 bg-emerald-500/10 text-foreground"
											: "border-border/70 hover:bg-muted/40 text-muted-foreground"
									}`}
								>
									<p className="font-semibold text-foreground">All Active Events ({activeEvents.length})</p>
									<p className="text-[11px] mt-0.5">Broadcast across entire platform</p>
								</button>
							</div>
						</div>

						{/* Delivery Channel */}
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold">Delivery Channel</Label>
							<Select
								value={broadcastChannel}
								onValueChange={(val: any) => setBroadcastChannel(val)}
							>
								<SelectTrigger className="bg-background text-xs rounded-xl">
									<SelectValue placeholder="Select delivery channel" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="event_default">⚙️ Use Each Event's Configured Channel (Recommended)</SelectItem>
									<SelectItem value="whatsapp">📱 WhatsApp Only (Meta Cloud API)</SelectItem>
									<SelectItem value="sms">💬 SMS Only (Arkesel Ghana)</SelectItem>
									<SelectItem value="both">⚡ WhatsApp with SMS Fallback</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Event Selector List when 'selected' is picked */}
						{targetScope === "selected" && (
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<Label className="text-xs font-semibold">Choose Events to Report:</Label>
									<div className="flex items-center gap-2 text-[11px]">
										<button
											type="button"
											onClick={() => setSelectedEventIds(activeEvents.map((e) => e.id))}
											className="text-primary hover:underline font-medium"
										>
											Select All
										</button>
										<span>&bull;</span>
										<button
											type="button"
											onClick={() => setSelectedEventIds([])}
											className="text-muted-foreground hover:underline"
										>
											Clear
										</button>
									</div>
								</div>

								<div className="max-h-52 overflow-y-auto space-y-1.5 p-2 rounded-xl border border-border/70 bg-muted/20">
									{activeEvents.length === 0 ? (
										<p className="text-xs text-muted-foreground text-center py-4">
											No active voting events found.
										</p>
									) : (
										activeEvents.map((ev) => {
											const isChecked = selectedEventIds.includes(ev.id);
											return (
												<div
													key={ev.id}
													onClick={() => toggleEventSelection(ev.id)}
													className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs border transition-colors ${
														isChecked
															? "bg-emerald-500/10 border-emerald-500/30 text-foreground"
															: "bg-background border-border/60 hover:bg-muted/40 text-muted-foreground"
													}`}
												>
													<div className="flex items-center gap-2.5 min-w-0">
														{isChecked ? (
															<CheckSquare className="h-4 w-4 text-emerald-600 shrink-0" />
														) : (
															<Square className="h-4 w-4 text-muted-foreground/60 shrink-0" />
														)}
														<div className="min-w-0">
															<p className="font-medium text-foreground truncate">{ev.title}</p>
															<p className="text-[10px] text-muted-foreground">{ev.organizationName}</p>
														</div>
													</div>

													<Badge variant="outline" className="text-[10px] shrink-0">
														{ev.nomineeCount} candidates
													</Badge>
												</div>
											);
										})
									)}
								</div>
							</div>
						)}

						{/* Broadcast Summary Box */}
						<div className="p-3.5 bg-muted/40 rounded-xl text-xs space-y-1.5 border border-border/70">
							<div className="flex justify-between">
								<span className="text-muted-foreground">Target Events:</span>
								<span className="font-semibold text-foreground">
									{targetScope === "all" ? `${activeEvents.length} (All Active)` : `${selectedEventIds.length} Selected`}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Estimated Recipients:</span>
								<span className="font-semibold text-emerald-600 dark:text-emerald-400">
									~{calculatedRecipients} Candidates
								</span>
							</div>
						</div>
					</div>

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="ghost"
							onClick={() => setConfirmDialogOpen(false)}
							disabled={isDispatching}
							className="rounded-xl text-xs"
						>
							Cancel
						</Button>
						<Button
							onClick={handleManualDispatch}
							disabled={isDispatching || calculatedRecipients === 0}
							className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold gap-2"
						>
							{isDispatching ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
							Dispatch Broadcast
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ── INDIVIDUAL EVENT CONFIGURATION MODAL ─────────────────────────── */}
			{editingEventConfig && (
				<Dialog open={!!editingEventConfig} onOpenChange={(open) => !open && setEditingEventConfig(null)}>
					<DialogContent className="sm:max-w-md rounded-2xl">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2 text-foreground font-bold">
								<Settings2 className="h-5 w-5 text-primary" />
								Configure: {editingEventConfig.eventTitle}
							</DialogTitle>
							<DialogDescription className="text-xs">
								Override purchase confirmation and report channels for this event.
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4 py-2 text-xs">
							{/* Group 1: Voter & Customer Notifications */}
							<div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-3">
								<div className="flex items-center gap-2 border-b border-border/40 pb-2">
									<span className="text-sm">🎟️</span>
									<div>
										<p className="font-bold text-foreground text-xs">Voter & Customer Notifications</p>
										<p className="text-[10px] text-muted-foreground">Channels used for delivering purchases to public users</p>
									</div>
								</div>

								<div className="space-y-1.5">
									<Label className="text-xs font-semibold">Ticket Purchase Delivery</Label>
									<Select
										value={editingEventConfig.ticketConfirmChannel}
										onValueChange={(val: ConfirmChannel) =>
											setEditingEventConfig((prev) => prev ? { ...prev, ticketConfirmChannel: val } : prev)
										}
									>
										<SelectTrigger className="bg-background rounded-xl">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="whatsapp">WhatsApp Only</SelectItem>
											<SelectItem value="whatsapp_sms">WhatsApp with SMS Fallback (Recommended)</SelectItem>
											<SelectItem value="sms">SMS Only</SelectItem>
											<SelectItem value="none">Disabled</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-1.5">
									<Label className="text-xs font-semibold">Vote Payment Receipt</Label>
									<Select
										value={editingEventConfig.voteReceiptChannel}
										onValueChange={(val: ConfirmChannel) =>
											setEditingEventConfig((prev) => prev ? { ...prev, voteReceiptChannel: val } : prev)
										}
									>
										<SelectTrigger className="bg-background rounded-xl">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="whatsapp">WhatsApp Only</SelectItem>
											<SelectItem value="whatsapp_sms">WhatsApp with SMS Fallback (Recommended)</SelectItem>
											<SelectItem value="sms">SMS Only</SelectItem>
											<SelectItem value="none">Disabled</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							{/* Group 2: Nominee & Candidate Communications */}
							<div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-3.5">
								<div className="flex items-center gap-2 border-b border-border/40 pb-2">
									<span className="text-sm">👥</span>
									<div>
										<p className="font-bold text-foreground text-xs">Nominee & Candidate Communications</p>
										<p className="text-[10px] text-muted-foreground">Channels for nominee alerts, profile updates & voting standings</p>
									</div>
								</div>

								<div className="space-y-1.5">
									<Label className="text-xs font-semibold">Candidate Notice & Updates Channel</Label>
									<p className="text-[10px] text-muted-foreground">Delivers nominee profile changes, voting codes, and reports</p>
									<Select
										value={editingEventConfig.reportChannel}
										onValueChange={(val: ReportChannel) =>
											setEditingEventConfig((prev) => prev ? { ...prev, reportChannel: val } : prev)
										}
									>
										<SelectTrigger className="bg-background rounded-xl">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="whatsapp_sms">WhatsApp with SMS Fallback (Recommended)</SelectItem>
											<SelectItem value="whatsapp">WhatsApp Only</SelectItem>
											<SelectItem value="sms">SMS Only</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="flex items-center justify-between pt-2 border-t border-border/40">
									<div>
										<Label className="text-xs font-semibold">Automated Progress Reports</Label>
										<p className="text-[10px] text-muted-foreground">Broadcast periodic vote tallies to candidate phones</p>
									</div>
									<Switch
										checked={editingEventConfig.reportEnabled}
										onCheckedChange={(checked) =>
											setEditingEventConfig((prev) => prev ? { ...prev, reportEnabled: checked } : prev)
										}
									/>
								</div>
							</div>
						</div>

						<DialogFooter className="gap-2 sm:gap-0">
							<Button
								variant="ghost"
								onClick={() => setEditingEventConfig(null)}
								disabled={isSavingEventConfig}
								className="rounded-xl text-xs"
							>
								Cancel
							</Button>
							<Button
								onClick={handleSaveSingleEventConfig}
								disabled={isSavingEventConfig}
								className="gap-2 rounded-xl text-xs font-semibold"
							>
								{isSavingEventConfig && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
								Save Settings
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
