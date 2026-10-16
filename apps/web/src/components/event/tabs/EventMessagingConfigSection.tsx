"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
	MessageSquare,
	Smartphone,
	Mail,
	BarChart3,
	Save,
	RefreshCw,
	Sparkles,
	Check,
	Clock,
	Info,
	AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	ConfirmChannel,
	NominationChannel,
	ReportChannel,
	ReportInterval,
	EventMessagingConfigData,
	getEventMessagingConfig,
	saveEventMessagingConfig,
} from "@/lib/server-functions/event-messaging-config";

interface EventMessagingConfigSectionProps {
	eventId: string;
	canEdit?: boolean;
	initialConfig?: EventMessagingConfigData;
}

export function EventMessagingConfigSection({
	eventId,
	canEdit = true,
	initialConfig,
}: EventMessagingConfigSectionProps) {
	const [config, setConfig] = useState<EventMessagingConfigData | null>(initialConfig || null);
	const [isLoading, setIsLoading] = useState(!initialConfig);
	const [isSaving, startSavingTransition] = useTransition();

	useEffect(() => {
		if (!initialConfig) {
			let isMounted = true;
			getEventMessagingConfig(eventId)
				.then((res) => {
					if (isMounted) {
						setConfig(res);
						setIsLoading(false);
					}
				})
				.catch((err) => {
					console.error("Failed to load messaging config", err);
					if (isMounted) setIsLoading(false);
				});
			return () => {
				isMounted = false;
			};
		}
	}, [eventId, initialConfig]);

	const handleSave = () => {
		if (!config) return;
		startSavingTransition(async () => {
			const res = await saveEventMessagingConfig(config);
			if (res.success && res.config) {
				setConfig(res.config);
				toast.success("Event messaging settings saved successfully!");
			} else {
				toast.error(res.error || "Failed to save messaging settings");
			}
		});
	};

	if (isLoading) {
		return (
			<Card className="border border-border/80">
				<CardContent className="flex items-center justify-center py-12">
					<RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
				</CardContent>
			</Card>
		);
	}

	if (!config) return null;

	return (
		<div className="space-y-6">
			<Card className="border border-border/80 shadow-sm">
				<CardHeader className="pb-4 border-b border-border/60">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
						<div className="space-y-1">
							<div className="flex items-center gap-2">
								<MessageSquare className="h-5 w-5 text-emerald-500" />
								<CardTitle className="text-lg font-semibold">Messaging & Channel Routing</CardTitle>
								<Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
									WhatsApp + SMS
								</Badge>
							</div>
							<CardDescription className="text-sm">
								Configure which delivery channels are used for ticket receipts, vote confirmations, and nominee reports for this event.
							</CardDescription>
						</div>

						{canEdit && (
							<Button
								onClick={handleSave}
								disabled={isSaving}
								size="sm"
								className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
							>
								<Save className="h-4 w-4" />
								{isSaving ? "Saving..." : "Save Settings"}
							</Button>
						)}
					</div>
				</CardHeader>

				<CardContent className="space-y-6 pt-6">
					{/* Purchase Notifications */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* Ticket Confirmations */}
						<div className="space-y-3 p-4 rounded-xl border border-border/70 bg-card/50">
							<div className="flex items-center gap-2">
								<Smartphone className="h-4 w-4 text-primary" />
								<Label className="font-semibold text-sm">Ticket Purchase Confirmations</Label>
							</div>
							<p className="text-xs text-muted-foreground leading-relaxed">
								How ticket buyers receive their ticket code and digital link on mobile.
							</p>
							<Select
								disabled={!canEdit}
								value={config.ticketConfirmChannel}
								onValueChange={(val: ConfirmChannel) =>
									setConfig((prev) => prev ? { ...prev, ticketConfirmChannel: val } : prev)
								}
							>
								<SelectTrigger className="w-full bg-background">
									<SelectValue placeholder="Select channel" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="whatsapp">WhatsApp Only (Standard)</SelectItem>
									<SelectItem value="whatsapp_sms">WhatsApp with SMS Fallback (Recommended)</SelectItem>
									<SelectItem value="sms">SMS Only (Arkesel)</SelectItem>
									<SelectItem value="none">Disabled (Email Only)</SelectItem>
								</SelectContent>
							</Select>
							<div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1">
								<Info className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
								<span>
									{config.ticketConfirmChannel === "whatsapp_sms"
										? "Attempts WhatsApp first. If undeliverable, automatically sends SMS."
										: config.ticketConfirmChannel === "whatsapp"
											? "Sends interactive WhatsApp ticket card with QR code link."
											: config.ticketConfirmChannel === "sms"
												? "Sends concise single-segment SMS via Arkesel."
												: "No instant messaging — confirmation sent only by email."}
								</span>
							</div>
						</div>

						{/* Vote Receipts */}
						<div className="space-y-3 p-4 rounded-xl border border-border/70 bg-card/50">
							<div className="flex items-center gap-2">
								<Sparkles className="h-4 w-4 text-amber-500" />
								<Label className="font-semibold text-sm">Vote Receipt Confirmations</Label>
							</div>
							<p className="text-xs text-muted-foreground leading-relaxed">
								Confirmation sent to voters immediately after successful vote payment.
							</p>
							<Select
								disabled={!canEdit}
								value={config.voteReceiptChannel}
								onValueChange={(val: ConfirmChannel) =>
									setConfig((prev) => prev ? { ...prev, voteReceiptChannel: val } : prev)
								}
							>
								<SelectTrigger className="w-full bg-background">
									<SelectValue placeholder="Select channel" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="whatsapp">WhatsApp Only</SelectItem>
									<SelectItem value="whatsapp_sms">WhatsApp with SMS Fallback (Recommended)</SelectItem>
									<SelectItem value="sms">SMS Only (Arkesel)</SelectItem>
									<SelectItem value="none">Disabled</SelectItem>
								</SelectContent>
							</Select>
							<div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1">
								<Info className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
								<span>
									{config.voteReceiptChannel === "whatsapp_sms"
										? "Cost-optimized: tries WhatsApp first, falls back to SMS on failure."
										: config.voteReceiptChannel === "whatsapp"
											? "Sends official WhatsApp vote receipt with nominee name & tally."
											: config.voteReceiptChannel === "sms"
												? "Sends concise SMS receipt with reference code."
												: "No vote receipt sent to voter phone."}
								</span>
							</div>
						</div>
					</div>

					{/* Nomination Channel */}
					<div className="p-4 rounded-xl border border-border/70 bg-card/50 space-y-3">
						<div className="flex items-center gap-2">
							<Mail className="h-4 w-4 text-blue-500" />
							<Label className="font-semibold text-sm">Nomination Notifications</Label>
						</div>
						<p className="text-xs text-muted-foreground">
							Notifications sent to nominees and nominators upon submission and approval.
						</p>
						<div className="max-w-md">
							<Select
								disabled={!canEdit}
								value={config.nominationChannel}
								onValueChange={(val: NominationChannel) =>
									setConfig((prev) => prev ? { ...prev, nominationChannel: val } : prev)
								}
							>
								<SelectTrigger className="w-full bg-background">
									<SelectValue placeholder="Select channel" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="email">Email Only (Standard)</SelectItem>
									<SelectItem value="email_whatsapp">Email + WhatsApp</SelectItem>
									<SelectItem value="sms">SMS Only</SelectItem>
									<SelectItem value="none">Disabled</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Nominee Voting Progress Reports */}
					<div className="p-5 rounded-xl border border-border/80 bg-muted/20 space-y-5">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
							<div className="space-y-1">
								<div className="flex items-center gap-2">
									<BarChart3 className="h-5 w-5 text-indigo-500" />
									<h4 className="font-semibold text-sm">Nominee Voting Progress Reports</h4>
								</div>
								<p className="text-xs text-muted-foreground">
									Automatically broadcast vote counts and leaderboard standing directly to active candidates.
								</p>
							</div>

							<div className="flex items-center gap-3">
								<span className="text-xs font-medium text-muted-foreground">
									{config.reportEnabled ? "Reports Enabled" : "Reports Paused"}
								</span>
								<Switch
									disabled={!canEdit}
									checked={config.reportEnabled}
									onCheckedChange={(checked) =>
										setConfig((prev) => prev ? { ...prev, reportEnabled: checked } : prev)
									}
								/>
							</div>
						</div>

						{config.reportEnabled && (
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
								{/* Channel */}
								<div className="space-y-2">
									<Label className="text-xs font-medium">Broadcast Channel</Label>
									<Select
										disabled={!canEdit}
										value={config.reportChannel}
										onValueChange={(val: ReportChannel) =>
											setConfig((prev) => prev ? { ...prev, reportChannel: val } : prev)
										}
									>
										<SelectTrigger className="bg-background">
											<SelectValue placeholder="Select channel" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="whatsapp">WhatsApp Only</SelectItem>
											<SelectItem value="whatsapp_sms">WhatsApp with SMS Fallback</SelectItem>
											<SelectItem value="sms">SMS Only (Arkesel)</SelectItem>
										</SelectContent>
									</Select>
								</div>

								{/* Frequency */}
								<div className="space-y-2">
									<Label className="text-xs font-medium">Frequency</Label>
									<Select
										disabled={!canEdit}
										value={config.reportInterval}
										onValueChange={(val: ReportInterval) =>
											setConfig((prev) => prev ? { ...prev, reportInterval: val } : prev)
										}
									>
										<SelectTrigger className="bg-background">
											<SelectValue placeholder="Interval" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="every_6_hours">Every 6 Hours</SelectItem>
											<SelectItem value="every_12_hours">Every 12 Hours</SelectItem>
											<SelectItem value="daily">Daily</SelectItem>
											<SelectItem value="weekly">Weekly</SelectItem>
										</SelectContent>
									</Select>
								</div>

								{/* Preferred Hour */}
								<div className="space-y-2">
									<Label className="text-xs font-medium">Scheduled Time (UTC)</Label>
									<Select
										disabled={!canEdit}
										value={String(config.reportPreferredHourUtc)}
										onValueChange={(val) =>
											setConfig((prev) => prev ? { ...prev, reportPreferredHourUtc: Number(val) } : prev)
										}
									>
										<SelectTrigger className="bg-background">
											<SelectValue placeholder="Time" />
										</SelectTrigger>
										<SelectContent>
											{[8, 9, 10, 12, 14, 16, 18, 20].map((hour) => (
												<SelectItem key={hour} value={String(hour)}>
													{hour}:00 UTC ({hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`})
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								{/* Toggles */}
								<div className="sm:col-span-2 lg:col-span-3 pt-2 flex flex-col sm:flex-row gap-6 border-t border-border/50">
									<div className="flex items-center justify-between sm:justify-start gap-3">
										<Switch
											id="onlyWithVotes"
											disabled={!canEdit}
											checked={config.reportOnlyWithVotes}
											onCheckedChange={(checked) =>
												setConfig((prev) => prev ? { ...prev, reportOnlyWithVotes: checked } : prev)
											}
										/>
										<Label htmlFor="onlyWithVotes" className="text-xs cursor-pointer">
											Only notify nominees with at least 1 vote
										</Label>
									</div>

									<div className="flex items-center justify-between sm:justify-start gap-3">
										<Switch
											id="showRank"
											disabled={!canEdit}
											checked={config.reportShowRank}
											onCheckedChange={(checked) =>
												setConfig((prev) => prev ? { ...prev, reportShowRank: checked } : prev)
											}
										/>
										<Label htmlFor="showRank" className="text-xs cursor-pointer">
											Include leaderboard rank position in report
										</Label>
									</div>
								</div>
							</div>
						)}

						{config.reportLastRunAt && (
							<div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-2 border-t border-border/40">
								<Clock className="h-3.5 w-3.5" />
								<span>Last broadcast: {new Date(config.reportLastRunAt).toLocaleString()}</span>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
