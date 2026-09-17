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
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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

interface NomineeReportsContentProps {
	initialSettings: NomineeReportSettings;
	summaryData: {
		activeEventsCount: number;
		eligibleNomineesCount: number;
		totalVotesCast: number;
	};
}

export function NomineeReportsContent({
	initialSettings,
	summaryData,
}: NomineeReportsContentProps) {
	const [settings, setSettings] = useState<NomineeReportSettings>(initialSettings);
	const [isSaving, startSavingTransition] = useTransition();
	const [isDispatching, startDispatchTransition] = useTransition();
	const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
	const [lastResult, setLastResult] = useState<any>(null);

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
				setLastResult(res);
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

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-5">
				<div>
					<div className="flex items-center gap-2.5">
						<h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
							<MessageSquare className="h-6 w-6 text-emerald-500" />
							Nominee WhatsApp Reports
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
						Configure automated WhatsApp voting reports sent to nominees. Control
						schedule frequency, delivery window, and manually broadcast live ranking updates.
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
								Template: <code className="font-mono text-primary">fextiva_nominee_report_en</code>
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
											<Flame className="h-3.5 w-3.5 text-amber-500" />
											Voting Progress Update
										</p>
										<p>
											Hello <strong>Ama Serwaa</strong>, here is your live voting update for{" "}
											<strong>AfroFest Awards 2026</strong> in category <strong>Best Vocalist</strong>.
										</p>
										<div className="bg-slate-50 dark:bg-slate-900/80 rounded p-2 space-y-1 font-mono text-[11px] border border-slate-200/60 dark:border-slate-800">
											<div className="flex justify-between">
												<span className="text-muted-foreground">Current Votes:</span>
												<strong className="text-emerald-600 dark:text-emerald-400">1,420</strong>
											</div>
											<div className="flex justify-between">
												<span className="text-muted-foreground">Current Rank:</span>
												<strong className="text-primary font-bold">#2</strong>
											</div>
										</div>
										<p className="text-[11px] text-muted-foreground pt-1">
											Keep sharing your voting link to rally more votes! Thank you for participating on Fextiva.
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
