"use client";

import React, { useState, useTransition } from "react";
import {
	Send,
	Clock,
	Calendar,
	CheckCircle2,
	AlertCircle,
	Radio,
	Sparkles,
	MessageSquare,
	RefreshCw,
	Save,
	Users,
	Flame,
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
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
	updateNomineeReportSettings,
	dispatchNomineeReportsNow,
} from "@/lib/server-functions/nominee-reports";
import { WhatsAppUsageSummary } from "@/lib/server-functions/whatsapp-usage";

interface NomineeReportsContentProps {
	initialSettings: NomineeReportSettings;
	summaryData: {
		activeEventsCount: number;
		eligibleNomineesCount: number;
		totalVotesCast: number;
	};
	usageData?: WhatsAppUsageSummary;
}

export function NomineeReportsContent({
	initialSettings,
	summaryData,
	usageData,
}: NomineeReportsContentProps) {
	const [settings, setSettings] = useState<NomineeReportSettings>(initialSettings);
	const [isSaving, startSavingTransition] = useTransition();
	const [isDispatching, startDispatchTransition] = useTransition();
	const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
	const [copiedField, setCopiedField] = useState<string | null>(null);

	const handleCopy = (text: string, fieldName: string) => {
		navigator.clipboard.writeText(text);
		setCopiedField(fieldName);
		toast.success(`Copied ${fieldName} to clipboard!`);
		setTimeout(() => setCopiedField(null), 2000);
	};

	const handleSave = () => {
		startSavingTransition(async () => {
			const res = await updateNomineeReportSettings(settings);
			if (res.success && res.settings) {
				setSettings(res.settings);
				toast.success("Nominee report schedule updated successfully!");
			} else {
				toast.error(res.error || "Failed to update configuration");
			}
		});
	};

	const handleManualDispatch = () => {
		setConfirmDialogOpen(false);
		startDispatchTransition(async () => {
			toast.info("Broadcasting voting progress reports to nominees...");
			const res = await dispatchNomineeReportsNow({
				force: true,
				triggeredBy: "super_admin_manual",
			});

			if (res.success) {
				toast.success(
					`Broadcast completed! ${res.successCount} sent successfully${res.failureCount > 0 ? `, ${res.failureCount} failed` : ""}.`
				);
				// Update local settings state with fresh stats
				setSettings((prev) => ({
					...prev,
					lastRunAt: new Date().toISOString(),
					lastRunStats: {
						totalNominees: res.totalNominees,
						successCount: res.successCount,
						failureCount: res.failureCount,
						timestamp: new Date().toISOString(),
						triggeredBy: "Manual Broadcast",
					},
				}));
			} else {
				toast.error(res.error || res.reason || "Dispatch failed");
			}
		});
	};

	const formatHour = (hour: number) => {
		const h = hour % 24;
		const ampm = h >= 12 ? "PM" : "AM";
		const formatted = h % 12 === 0 ? 12 : h % 12;
		return `${formatted}:00 ${ampm} UTC (${String(h).padStart(2, "0")}:00)`;
	};

	const webhookInfo = usageData?.webhookConfig || {
		callbackUrl: "https://fextiva.com/api/webhooks/whatsapp",
		verifyToken: "fextiva_whatsapp_secure_webhook_token_2026",
		wabaId: "1744340760020720",
		phoneNumberId: "1279312171935266",
		displayPhone: "+233 50 989 7757",
	};

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-5">
				<div>
					<div className="flex items-center gap-2.5">
						<h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
							<MessageSquare className="h-6 w-6 text-emerald-500" />
							WhatsApp Communication & Reports
						</h1>
						<Badge
							variant="outline"
							className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
								settings.enabled
									? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
									: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
							}`}
						>
							{settings.enabled ? "Active Schedule" : "Automations Paused"}
						</Badge>
					</div>
					<p className="text-sm text-muted-foreground mt-1 max-w-3xl">
						Manage automated candidate reports, configure Meta webhook delivery callbacks,
						and track WhatsApp message consumption, deliverability rates, and costs.
					</p>
				</div>

				<div className="flex items-center gap-3">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setConfirmDialogOpen(true)}
						disabled={isDispatching || summaryData.eligibleNomineesCount === 0}
						className="gap-2 border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
					>
						<Send className={`h-4 w-4 ${isDispatching ? "animate-pulse" : ""}`} />
						{isDispatching ? "Broadcasting..." : "Send Reports Now"}
					</Button>
					<Button
						onClick={handleSave}
						disabled={isSaving}
						size="sm"
						className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
					>
						<Save className="h-4 w-4" />
						{isSaving ? "Saving..." : "Save Schedule"}
					</Button>
				</div>
			</div>

			{/* Main Navigation Tabs */}
			<Tabs defaultValue="schedule" className="space-y-6">
				<TabsList className="bg-muted/60 p-1 border border-border/80">
					<TabsTrigger value="schedule" className="gap-2 text-xs sm:text-sm">
						<Clock className="h-4 w-4" />
						Nominee Report Schedule
					</TabsTrigger>
					<TabsTrigger value="usage" className="gap-2 text-xs sm:text-sm">
						<Activity className="h-4 w-4 text-emerald-500" />
						WhatsApp Usage & Webhook Status
					</TabsTrigger>
				</TabsList>

				{/* TAB 1: SCHEDULE & AUTOMATION */}
				<TabsContent value="schedule" className="space-y-6 m-0">
					{/* Metrics Overview Grid */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						<Card className="border border-border/70 shadow-xs bg-card/60 backdrop-blur-xs">
							<CardContent className="p-4 flex items-center gap-3.5">
								<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
									<Radio className={`h-5 w-5 ${settings.enabled ? "animate-pulse text-emerald-500" : ""}`} />
								</div>
								<div className="min-w-0">
									<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
										Scheduler State
									</p>
									<p className="text-lg font-bold text-foreground">
										{settings.enabled ? "Scheduled & Active" : "Paused"}
									</p>
									<p className="text-[11px] text-muted-foreground truncate">
										{settings.enabled ? `Runs ${settings.interval.replace(/_/g, " ")}` : "Turn on to resume"}
									</p>
								</div>
							</CardContent>
						</Card>

						<Card className="border border-border/70 shadow-xs bg-card/60 backdrop-blur-xs">
							<CardContent className="p-4 flex items-center gap-3.5">
								<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
									<Users className="h-5 w-5" />
								</div>
								<div className="min-w-0">
									<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
										Eligible Nominees
									</p>
									<p className="text-lg font-bold text-foreground">
										{summaryData.eligibleNomineesCount.toLocaleString()}
									</p>
									<p className="text-[11px] text-muted-foreground truncate">
										Across {summaryData.activeEventsCount} active events
									</p>
								</div>
							</CardContent>
						</Card>

						<Card className="border border-border/70 shadow-xs bg-card/60 backdrop-blur-xs">
							<CardContent className="p-4 flex items-center gap-3.5">
								<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
									<Clock className="h-5 w-5" />
								</div>
								<div className="min-w-0">
									<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
										Configured Interval
									</p>
									<p className="text-lg font-bold text-foreground capitalize">
										{settings.interval === "every_6_hours"
											? "Every 6 Hours"
											: settings.interval === "every_12_hours"
												? "Every 12 Hours"
												: settings.interval}
									</p>
									<p className="text-[11px] text-muted-foreground truncate">
										{formatHour(settings.preferredHourUtc)}
									</p>
								</div>
							</CardContent>
						</Card>

						<Card className="border border-border/70 shadow-xs bg-card/60 backdrop-blur-xs">
							<CardContent className="p-4 flex items-center gap-3.5">
								<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
									<RefreshCw className="h-5 w-5" />
								</div>
								<div className="min-w-0">
									<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
										Last Broadcast
									</p>
									<p className="text-lg font-bold text-foreground truncate">
										{settings.lastRunAt
											? new Date(settings.lastRunAt).toLocaleDateString(undefined, {
													month: "short",
													day: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												})
											: "Never"}
									</p>
									<p className="text-[11px] text-muted-foreground truncate">
										{settings.lastRunStats
											? `${settings.lastRunStats.successCount}/${settings.lastRunStats.totalNominees} delivered`
											: "Awaiting first run"}
									</p>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Main Settings & WhatsApp Mockup Grid */}
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
						{/* Settings Controls (7 cols) */}
						<div className="lg:col-span-7 space-y-6">
							<Card className="border border-border/80 shadow-sm">
								<CardHeader className="pb-4 border-b border-border/50">
									<CardTitle className="text-lg font-semibold flex items-center gap-2">
										<Clock className="h-5 w-5 text-primary" />
										Schedule & Trigger Configuration
									</CardTitle>
									<CardDescription>
										Define how frequently and when live ranking updates should be sent to candidates.
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6 pt-5">
									{/* Master Enable Switch */}
									<div className="flex items-center justify-between p-4 rounded-xl border border-border/70 bg-muted/20">
										<div className="space-y-0.5 pr-4">
											<Label htmlFor="enabled-switch" className="text-sm font-semibold text-foreground cursor-pointer">
												Enable Automated Reports
											</Label>
											<p className="text-xs text-muted-foreground">
												When active, background workers or cron jobs will dispatch ranking updates according to the configured interval.
											</p>
										</div>
										<Switch
											id="enabled-switch"
											checked={settings.enabled}
											onCheckedChange={(checked) =>
												setSettings((prev) => ({ ...prev, enabled: checked }))
											}
										/>
									</div>

									{/* Interval Frequency */}
									<div className="space-y-2">
										<Label className="text-xs font-semibold text-foreground uppercase tracking-wider">
											Broadcast Frequency / Interval
										</Label>
										<Select
											value={settings.interval}
											onValueChange={(val: ReportInterval) =>
												setSettings((prev) => ({ ...prev, interval: val }))
											}
										>
											<SelectTrigger className="w-full bg-background">
												<SelectValue placeholder="Select interval" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="every_6_hours">
													Every 6 Hours (High-stakes / Finals)
												</SelectItem>
												<SelectItem value="every_12_hours">
													Every 12 Hours (Twice Daily)
												</SelectItem>
												<SelectItem value="daily">
													Daily (Standard 24-Hour Summary)
												</SelectItem>
												<SelectItem value="weekly">
													Weekly (Long-running Competitions)
												</SelectItem>
											</SelectContent>
										</Select>
										<p className="text-[11px] text-muted-foreground">
											Recommended: <strong>Daily</strong> for standard campaigns, or <strong>Every 6 Hours</strong> during finale voting periods.
										</p>
									</div>

									{/* Preferred Time (for Daily & Weekly) */}
									<div className="space-y-2">
										<Label className="text-xs font-semibold text-foreground uppercase tracking-wider">
											Preferred Delivery Window (UTC)
										</Label>
										<Select
											value={String(settings.preferredHourUtc)}
											onValueChange={(val) =>
												setSettings((prev) => ({ ...prev, preferredHourUtc: parseInt(val, 10) }))
											}
										>
											<SelectTrigger className="w-full bg-background">
												<SelectValue placeholder="Select target hour" />
											</SelectTrigger>
											<SelectContent className="max-h-60">
												{Array.from({ length: 24 }).map((_, i) => (
													<SelectItem key={i} value={String(i)}>
														{formatHour(i)}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<p className="text-[11px] text-muted-foreground">
											Ghana Time (GMT) is UTC+0. 09:00 UTC corresponds to 9:00 AM in Accra.
										</p>
									</div>

									{/* Audience Filtering */}
									<div className="flex items-center justify-between p-4 rounded-xl border border-border/70 bg-muted/20">
										<div className="space-y-0.5 pr-4">
											<Label htmlFor="votes-filter" className="text-sm font-semibold text-foreground cursor-pointer">
												Only Notify Active Nominees with &gt; 0 Votes
											</Label>
											<p className="text-xs text-muted-foreground">
												Skip sending WhatsApp messages to candidates who haven't received any votes yet to preserve API limits.
											</p>
										</div>
										<Switch
											id="votes-filter"
											checked={settings.onlyWithVotes}
											onCheckedChange={(checked) =>
												setSettings((prev) => ({ ...prev, onlyWithVotes: checked }))
											}
										/>
									</div>

									{/* Cron Integration Guide */}
									<div className="rounded-xl border border-border/70 bg-slate-950/40 p-4 font-mono text-xs text-slate-300">
										<div className="flex items-center justify-between mb-2">
											<span className="text-[11px] font-semibold text-muted-foreground uppercase">
												Scheduled Cron Webhook URL
											</span>
											<Badge variant="outline" className="text-[10px] bg-slate-800 text-slate-300 border-slate-700">
												GET / POST
											</Badge>
										</div>
										<div className="bg-slate-900/90 rounded-md p-2.5 break-all select-all text-emerald-400 text-[12px] border border-slate-800">
											https://fextiva.com/api/cron/nominee-reports
										</div>
										<p className="text-[11px] text-slate-400 mt-2 font-sans">
											Triggers automated evaluation. If the interval threshold has passed and scheduler is enabled, all active nominees receive updates.
										</p>
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Meta WhatsApp Live Preview (5 cols) */}
						<div className="lg:col-span-5 space-y-6">
							<Card className="border border-border/80 shadow-sm overflow-hidden">
								<CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
									<div className="flex items-center justify-between">
										<CardTitle className="text-base font-semibold flex items-center gap-2">
											<Smartphone className="h-4 w-4 text-emerald-500" />
											WhatsApp Template Preview
										</CardTitle>
										<Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] uppercase font-bold">
											UTILITY
										</Badge>
									</div>
									<CardDescription className="text-xs">
										Template: <code className="font-mono text-primary">fextiva_nominee_status_en</code>
									</CardDescription>
								</CardHeader>

								<CardContent className="p-4 bg-slate-100 dark:bg-slate-950/70">
									{/* WhatsApp Chat Simulation */}
									<div className="max-w-[340px] mx-auto bg-card rounded-2xl shadow-md border border-border/80 overflow-hidden">
										{/* WhatsApp Chat Header */}
										<div className="bg-[#075e54] dark:bg-[#054640] text-white px-3.5 py-2.5 flex items-center gap-2.5">
											<div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
												F
											</div>
											<div className="min-w-0 flex-1">
												<p className="text-xs font-semibold leading-none truncate flex items-center gap-1">
													Fextiva
													<ShieldCheck className="h-3 w-3 text-emerald-400 fill-emerald-400 inline" />
												</p>
												<p className="text-[10px] text-white/70 leading-none mt-0.5">
													Official Business Account
												</p>
											</div>
										</div>

										{/* Message Bubble */}
										<div className="p-3 bg-[#efeae2] dark:bg-[#0b141a] space-y-2">
											<div className="bg-white dark:bg-[#1f2c34] rounded-lg p-3 text-slate-800 dark:text-slate-100 shadow-xs border border-slate-200/50 dark:border-slate-700/50 text-xs leading-relaxed space-y-2">
												<p className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center gap-1.5">
													<ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
													Voting Status Update
												</p>
												<p>
													Hello <strong>Ama Serwaa</strong>, here is your account status update for{" "}
													<strong>AfroFest Awards 2026</strong> in category <strong>Best Vocalist</strong>.
												</p>
												<div className="bg-slate-50 dark:bg-slate-900/80 rounded p-2 space-y-1 font-mono text-[11px] border border-slate-200/60 dark:border-slate-800">
													<div className="flex justify-between">
														<span className="text-muted-foreground">Total Votes Recorded:</span>
														<strong className="text-emerald-600 dark:text-emerald-400">1,420</strong>
													</div>
													<div className="flex justify-between">
														<span className="text-muted-foreground">Current Category Rank:</span>
														<strong className="text-primary font-bold">#2</strong>
													</div>
												</div>
												<p className="text-[11px] text-muted-foreground pt-1 italic">
													This is an automated performance report from Fextiva.
												</p>
												<p className="text-[9px] text-muted-foreground text-right">
													09:00 AM ✓✓
												</p>
											</div>

											{/* Interactive URL Button */}
											<div className="bg-white dark:bg-[#1f2c34] rounded-lg py-2 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
												<ExternalLink className="h-3.5 w-3.5" />
												View Leaderboard
											</div>
										</div>
									</div>

									{/* Metadata summary */}
									<div className="mt-4 pt-3 border-t border-border/60 text-xs text-muted-foreground space-y-1">
										<div className="flex justify-between">
											<span>WABA Number:</span>
											<span className="font-mono font-medium text-foreground">+233 50 989 7757</span>
										</div>
										<div className="flex justify-between">
											<span>Language Code:</span>
											<span className="font-mono font-medium text-foreground">en (English)</span>
										</div>
										<div className="flex justify-between">
											<span>Category / Pricing:</span>
											<span className="font-medium text-emerald-600 dark:text-emerald-400">Utility (Free tier / ~0.007 USD)</span>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</TabsContent>

				{/* TAB 2: WHATSAPP USAGE, CONSUMPTION & WEBHOOK STATUS */}
				<TabsContent value="usage" className="space-y-6 m-0">
					{/* Usage Analytics Cards */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						<Card className="border border-border/70 shadow-xs bg-card/60 backdrop-blur-xs">
							<CardContent className="p-4 flex items-center gap-3.5">
								<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
									<Send className="h-5 w-5" />
								</div>
								<div className="min-w-0">
									<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
										Messages Sent
									</p>
									<p className="text-xl font-bold text-foreground">
										{(usageData?.totalSent || 0).toLocaleString()}
									</p>
									<p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
										{usageData?.totalDelivered || 0} Delivered ({usageData?.deliveryRate || 100}%)
									</p>
								</div>
							</CardContent>
						</Card>

						<Card className="border border-border/70 shadow-xs bg-card/60 backdrop-blur-xs">
							<CardContent className="p-4 flex items-center gap-3.5">
								<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
									<CheckCircle2 className="h-5 w-5" />
								</div>
								<div className="min-w-0">
									<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
										Read Receipts
									</p>
									<p className="text-xl font-bold text-foreground">
										{(usageData?.totalRead || 0).toLocaleString()}
									</p>
									<p className="text-[11px] text-muted-foreground truncate">
										Confirmed read by users
									</p>
								</div>
							</CardContent>
						</Card>

						<Card className="border border-border/70 shadow-xs bg-card/60 backdrop-blur-xs">
							<CardContent className="p-4 flex items-center gap-3.5">
								<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
									<DollarSign className="h-5 w-5" />
								</div>
								<div className="min-w-0">
									<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
										Estimated Spend
									</p>
									<p className="text-xl font-bold text-foreground">
										${(usageData?.estimatedSpendUsd || 0).toFixed(3)}
									</p>
									<p className="text-[11px] text-muted-foreground truncate">
										~GH₵{((usageData?.estimatedSpendUsd || 0) * 15.5).toFixed(2)} (Billable)
									</p>
								</div>
							</CardContent>
						</Card>

						<Card className="border border-border/70 shadow-xs bg-card/60 backdrop-blur-xs">
							<CardContent className="p-4 flex items-center gap-3.5">
								<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
									<AlertCircle className="h-5 w-5" />
								</div>
								<div className="min-w-0">
									<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
										Failed Deliveries
									</p>
									<p className="text-xl font-bold text-foreground">
										{(usageData?.totalFailed || 0).toLocaleString()}
									</p>
									<p className="text-[11px] text-muted-foreground truncate">
										Invalid phone numbers / blocks
									</p>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Webhook Configuration Details Card */}
					<Card className="border border-border/80 shadow-sm">
						<CardHeader className="pb-4 border-b border-border/50">
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="text-lg font-semibold flex items-center gap-2">
										<Webhook className="h-5 w-5 text-emerald-500" />
										Meta WhatsApp Webhook Configuration
									</CardTitle>
									<CardDescription>
										Copy these details into your Meta Developer App to receive real-time delivery callbacks,
										read receipts, and billable conversation tracking.
									</CardDescription>
								</div>
								<Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs">
									LIVE LISTENER
								</Badge>
							</div>
						</CardHeader>
						<CardContent className="space-y-6 pt-5">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{/* Callback URL Box */}
								<div className="space-y-1.5 p-3.5 rounded-xl border border-border/70 bg-muted/20">
									<div className="flex items-center justify-between">
										<Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
											Callback URL
										</Label>
										<Button
											variant="ghost"
											size="xs"
											className="h-7 text-xs gap-1 text-primary"
											onClick={() => handleCopy(webhookInfo.callbackUrl, "Callback URL")}
										>
											{copiedField === "Callback URL" ? (
												<Check className="h-3.5 w-3.5 text-emerald-500" />
											) : (
												<Copy className="h-3.5 w-3.5" />
											)}
											Copy
										</Button>
									</div>
									<div className="font-mono text-xs text-foreground bg-background p-2 rounded border border-border/80 break-all select-all">
										{webhookInfo.callbackUrl}
									</div>
								</div>

								{/* Verify Token Box */}
								<div className="space-y-1.5 p-3.5 rounded-xl border border-border/70 bg-muted/20">
									<div className="flex items-center justify-between">
										<Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
											Verify Token
										</Label>
										<Button
											variant="ghost"
											size="xs"
											className="h-7 text-xs gap-1 text-primary"
											onClick={() => handleCopy(webhookInfo.verifyToken, "Verify Token")}
										>
											{copiedField === "Verify Token" ? (
												<Check className="h-3.5 w-3.5 text-emerald-500" />
											) : (
												<Copy className="h-3.5 w-3.5" />
											)}
											Copy
										</Button>
									</div>
									<div className="font-mono text-xs text-foreground bg-background p-2 rounded border border-border/80 break-all select-all">
										{webhookInfo.verifyToken}
									</div>
								</div>
							</div>

							{/* Setup Instructions Walkthrough */}
							<div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs space-y-2.5">
								<p className="font-bold text-foreground flex items-center gap-1.5">
									<ShieldCheck className="h-4 w-4 text-emerald-500" />
									How to bind in Meta Developer Console:
								</p>
								<ol className="list-decimal list-inside space-y-1.5 text-muted-foreground">
									<li>
										Go to <a href="https://developers.facebook.com/apps/1616818269741842/whatsapp-business/wa-dev-console/" target="_blank" rel="noopener noreferrer" className="text-primary underline font-medium">Meta Developer Dashboard &gt; Fextiva Heya</a>.
									</li>
									<li>
										In the left menu under <strong>WhatsApp</strong>, click <strong>Configuration</strong>.
									</li>
									<li>
										Under <strong>Webhook</strong>, click <strong>Edit</strong>, paste the <strong>Callback URL</strong> and <strong>Verify Token</strong> above, and click <strong>Verify and Save</strong>.
									</li>
									<li>
										Under <strong>Webhook fields</strong>, click <strong>Manage</strong> and click <strong>Subscribe</strong> next to <code className="bg-muted px-1 rounded text-foreground font-semibold">messages</code>.
									</li>
								</ol>
							</div>
						</CardContent>
					</Card>

					{/* Recent Message Transmission Logs */}
					<Card className="border border-border/80 shadow-sm">
						<CardHeader className="pb-3 border-b border-border/50">
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="text-base font-semibold flex items-center gap-2">
										<BarChart3 className="h-4 w-4 text-primary" />
										Recent WhatsApp Transmission Logs
									</CardTitle>
									<CardDescription className="text-xs">
										Live delivery statuses and cost attribution captured from Meta callbacks.
									</CardDescription>
								</div>
								<Badge variant="outline" className="text-xs">
									Last {usageData?.recentLogs?.length || 0} Events
								</Badge>
							</div>
						</CardHeader>
						<CardContent className="p-0">
							{!usageData?.recentLogs || usageData.recentLogs.length === 0 ? (
								<div className="p-8 text-center text-xs text-muted-foreground">
									No WhatsApp message transmissions recorded yet. Messages sent via tickets, votes, or nominee reports will automatically stream here.
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full text-xs text-left">
										<thead className="bg-muted/40 text-muted-foreground border-b border-border/60">
											<tr>
												<th className="py-2.5 px-4 font-semibold">Time</th>
												<th className="py-2.5 px-4 font-semibold">Recipient</th>
												<th className="py-2.5 px-4 font-semibold">Type / Template</th>
												<th className="py-2.5 px-4 font-semibold">Category</th>
												<th className="py-2.5 px-4 font-semibold">Status</th>
												<th className="py-2.5 px-4 font-semibold">Cost</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-border/40">
											{usageData.recentLogs.map((log) => (
												<tr key={log.id} className="hover:bg-muted/20 transition-colors">
													<td className="py-2.5 px-4 text-muted-foreground whitespace-nowrap">
														{new Date(log.createdAt).toLocaleDateString(undefined, {
															month: "short",
															day: "numeric",
															hour: "2-digit",
															minute: "2-digit",
														})}
													</td>
													<td className="py-2.5 px-4 font-mono font-medium text-foreground">
														{log.recipientPhone}
													</td>
													<td className="py-2.5 px-4 font-mono text-[11px] text-muted-foreground">
														{log.templateName || "text"}
													</td>
													<td className="py-2.5 px-4">
														<Badge variant="outline" className="text-[10px] uppercase">
															{log.category || "UTILITY"}
														</Badge>
													</td>
													<td className="py-2.5 px-4">
														<Badge
															className={`text-[10px] uppercase font-bold ${
																log.status === "delivered"
																	? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
																	: log.status === "read"
																		? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
																		: log.status === "sent"
																			? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
																			: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
															}`}
														>
															{log.status}
														</Badge>
														{log.errorMessage && (
															<p className="text-[10px] text-red-500 mt-0.5 truncate max-w-xs">
																{log.errorMessage}
															</p>
														)}
													</td>
													<td className="py-2.5 px-4 text-muted-foreground font-mono">
														${log.estimatedCost.toFixed(3)}
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
			</Tabs>

			{/* Manual Broadcast Confirmation Dialog */}
			<Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-foreground">
							<Send className="h-5 w-5 text-emerald-500" />
							Trigger Immediate Nominee Broadcast?
						</DialogTitle>
						<DialogDescription>
							This will send an immediate live WhatsApp ranking update to all{" "}
							<strong>{summaryData.eligibleNomineesCount}</strong> candidates with valid phone numbers across{" "}
							<strong>{summaryData.activeEventsCount}</strong> active voting events.
						</DialogDescription>
					</DialogHeader>

					<div className="p-3 bg-muted/40 rounded-xl text-xs space-y-1.5 border border-border/70">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Audience:</span>
							<span className="font-semibold text-foreground">
								{settings.onlyWithVotes ? "Nominees with > 0 votes" : "All approved candidates"}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Estimated Recipients:</span>
							<span className="font-semibold text-foreground">{summaryData.eligibleNomineesCount}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Delivery Channel:</span>
							<span className="font-semibold text-emerald-600 dark:text-emerald-400">WhatsApp Cloud API</span>
						</div>
					</div>

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="ghost"
							onClick={() => setConfirmDialogOpen(false)}
							disabled={isDispatching}
						>
							Cancel
						</Button>
						<Button
							onClick={handleManualDispatch}
							disabled={isDispatching}
							className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
						>
							{isDispatching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
							Yes, Dispatch Broadcast
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
