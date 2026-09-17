"use client";

import { useEffect, useState, useTransition, useMemo } from "react";
import {
	History,
	RefreshCw,
	ShieldCheck,
	CheckCircle2,
	AlertCircle,
	Trash2,
	Edit3,
	PlusCircle,
	Globe,
	Search,
	ArrowRight,
	X,
	Tag,
	DollarSign,
	Coins,
	Ticket,
} from "lucide-react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/image/Image";
import {
	getEventAuditTrail,
	type EventAuditLogItem,
} from "@/lib/audit/audit-actions";

interface EventAuditTrailDrawerProps {
	readonly eventId: string;
	readonly eventTitle?: string;
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
}

function getActionConfig(action: string) {
	switch (action) {
		case "ticket_price_changed":
			return {
				label: "Ticket Price",
				badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
				icon: Tag,
			};
		case "vote_price_changed":
			return {
				label: "Vote Price",
				badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
				icon: Coins,
			};
		case "nomination_price_changed":
			return {
				label: "Nomination Price",
				badgeClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
				icon: DollarSign,
			};
		case "category_price_changed":
			return {
				label: "Price Changed",
				badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
				icon: DollarSign,
			};
		case "ticket_created":
			return {
				label: "Ticket Created",
				badgeClass: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800",
				icon: PlusCircle,
			};
		case "ticket_updated":
			return {
				label: "Ticket Updated",
				badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
				icon: Edit3,
			};
		case "ticket_deleted":
			return {
				label: "Ticket Deleted",
				badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
				icon: Trash2,
			};
		case "category_created":
			return {
				label: "Category Added",
				badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
				icon: PlusCircle,
			};
		case "category_updated":
			return {
				label: "Category Updated",
				badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
				icon: Edit3,
			};
		case "category_deleted":
			return {
				label: "Category Deleted",
				badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
				icon: Trash2,
			};
		case "nominee_created":
			return {
				label: "Created",
				badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
				icon: PlusCircle,
			};
		case "nominee_updated":
			return {
				label: "Updated",
				badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
				icon: Edit3,
			};
		case "nominee_deleted":
			return {
				label: "Deleted",
				badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
				icon: Trash2,
			};
		case "nominee_approved":
			return {
				label: "Approved",
				badgeClass: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800",
				icon: CheckCircle2,
			};
		case "nominee_rejected":
			return {
				label: "Rejected",
				badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
				icon: AlertCircle,
			};
		case "nominee_status_updated":
			return {
				label: "Status Changed",
				badgeClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
				icon: Edit3,
			};
		case "event_status_changed":
		case "event_published":
			return {
				label: "Event Status",
				badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
				icon: Globe,
			};
		default:
			return {
				label: action.replace(/_/g, " "),
				badgeClass: "bg-muted text-muted-foreground border-border",
				icon: History,
			};
	}
}

/**
 * Format the IP address for display — show "Localhost" for loopback addresses.
 */
function formatIpAddress(ip: string | null): string {
	if (!ip) return "—";
	const trimmed = ip.trim();
	if (trimmed === "::1" || trimmed === "127.0.0.1" || trimmed === "::ffff:127.0.0.1") {
		return "Localhost";
	}
	// Strip the IPv6 mapped IPv4 prefix for readability
	if (trimmed.startsWith("::ffff:")) {
		return trimmed.replace("::ffff:", "");
	}
	return trimmed;
}

function formatTimestamp(dateInput: string | Date): string {
	try {
		const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
		return d.toLocaleString(undefined, {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch {
		return String(dateInput);
	}
}

function formatRelativeTime(dateInput: string | Date): string {
	try {
		const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
		const diffMs = Date.now() - d.getTime();
		const diffSecs = Math.floor(diffMs / 1000);
		if (diffSecs < 60) return "just now";
		const diffMins = Math.floor(diffSecs / 60);
		if (diffMins < 60) return `${diffMins}m ago`;
		const diffHours = Math.floor(diffMins / 60);
		if (diffHours < 24) return `${diffHours}h ago`;
		const diffDays = Math.floor(diffHours / 24);
		if (diffDays < 7) return `${diffDays}d ago`;
		return formatTimestamp(d);
	} catch {
		return String(dateInput);
	}
}

export function EventAuditTrailDrawer({
	eventId,
	eventTitle,
	open,
	onOpenChange,
}: EventAuditTrailDrawerProps) {
	const [logs, setLogs] = useState<EventAuditLogItem[]>([]);
	const [isPending, startTransition] = useTransition();
	const [activeFilter, setActiveFilter] = useState<"all" | "pricing" | "nominees" | "status">("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [expandedRow, setExpandedRow] = useState<string | null>(null);

	const fetchLogs = () => {
		if (!eventId) return;
		startTransition(async () => {
			try {
				const res = await getEventAuditTrail(eventId, { limit: 100 });
				setLogs(res || []);
			} catch (err) {
				console.error("Failed to load audit trail:", err);
			}
		});
	};

	useEffect(() => {
		if (open) {
			fetchLogs();
		}
	}, [open, eventId]);

	const filteredLogs = useMemo(() => {
		return logs.filter((log) => {
			if (
				activeFilter === "pricing" &&
				!log.action.includes("price") &&
				!log.action.startsWith("ticket_") &&
				!log.action.startsWith("category_")
			) {
				return false;
			}
			if (activeFilter === "nominees" && !log.action.startsWith("nominee_")) {
				return false;
			}
			if (activeFilter === "status" && !log.action.includes("status")) {
				return false;
			}
			if (!searchQuery.trim()) return true;
			const q = searchQuery.toLowerCase();
			return (
				log.description?.toLowerCase().includes(q) ||
				log.ipAddress?.toLowerCase().includes(q) ||
				log.user?.fullName?.toLowerCase().includes(q) ||
				log.user?.email?.toLowerCase().includes(q) ||
				log.action?.toLowerCase().includes(q)
			);
		});
	}, [logs, activeFilter, searchQuery]);

	const pricingCount = useMemo(
		() =>
			logs.filter(
				(l) =>
					l.action.includes("price") ||
					l.action.startsWith("ticket_") ||
					l.action.startsWith("category_"),
			).length,
		[logs],
	);
	const nomineesCount = useMemo(
		() => logs.filter((l) => l.action.startsWith("nominee_")).length,
		[logs],
	);
	const statusCount = useMemo(
		() => logs.filter((l) => l.action.includes("status")).length,
		[logs],
	);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="w-full sm:max-w-4xl p-0 flex flex-col h-full overflow-hidden"
			>
				{/* Drawer Header */}
				<SheetHeader className="shrink-0">
					<div className="flex items-center justify-between gap-3">
						<div>
							<SheetTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
								<ShieldCheck className="size-5 text-primary" />
								<span>Event Audit Trail</span>
							</SheetTitle>
							<SheetDescription className="text-xs text-muted-foreground mt-1">
								{eventTitle ? `Tracking history for "${eventTitle}"` : "Complete immutable action history with machine IP tracking."}
							</SheetDescription>
						</div>

						<Button
							variant="outline"
							size="sm"
							className="h-8 gap-1.5 text-xs rounded-sm shrink-0"
							onClick={fetchLogs}
							disabled={isPending}
							title="Refresh logs"
						>
							<RefreshCw className={`size-3.5 ${isPending ? "animate-spin" : ""}`} />
							<span className="hidden sm:inline">Refresh</span>
						</Button>
					</div>
				</SheetHeader>

				{/* Toolbar: Tabs & Search Filter */}
				<div className="px-6 py-3 border-b bg-background/50 space-y-3 shrink-0">
					<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
						{/* Status Filter Tabs */}
						<Tabs
							value={activeFilter}
							onValueChange={(val) => setActiveFilter(val as any)}
							className="w-full sm:w-auto"
						>
							<TabsList className="h-9 w-full sm:w-auto p-1.5 gap-1.5 rounded-sm">
								<TabsTrigger
									value="all"
									className="text-xs font-semibold gap-1.5 px-3 flex-1 sm:flex-initial rounded-sm"
								>
									<span>All</span>
									<span className="px-1.5 py-0.2 rounded-full text-[10px] bg-muted text-muted-foreground font-mono font-bold">
										{logs.length}
									</span>
								</TabsTrigger>

								<TabsTrigger
									value="pricing"
									className="text-xs font-semibold gap-1.5 px-3 flex-1 sm:flex-initial rounded-sm"
								>
									<span>Pricing</span>
									{pricingCount > 0 && (
										<span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
											{pricingCount}
										</span>
									)}
								</TabsTrigger>

								<TabsTrigger
									value="nominees"
									className="text-xs font-semibold gap-1.5 px-3 flex-1 sm:flex-initial rounded-sm"
								>
									<span>Nominees</span>
									{nomineesCount > 0 && (
										<span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary/20 text-primary font-mono font-bold">
											{nomineesCount}
										</span>
									)}
								</TabsTrigger>

								<TabsTrigger
									value="status"
									className="text-xs font-semibold gap-1.5 px-3 flex-1 sm:flex-initial rounded-sm"
								>
									<span>Status & Config</span>
									{statusCount > 0 && (
										<span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-500/20 text-blue-600 dark:text-blue-400 font-mono font-bold">
											{statusCount}
										</span>
									)}
								</TabsTrigger>
							</TabsList>
						</Tabs>

						{/* Search Input on the right */}
						<div className="relative flex-1 sm:max-w-xs">
							<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
							<Input
								placeholder="Search actions, prices, nominees, IPs or users..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-8 h-8 text-xs bg-background rounded-sm"
							/>
							{searchQuery && (
								<button
									type="button"
									onClick={() => setSearchQuery("")}
									className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
								>
									<X className="size-3" />
								</button>
							)}
						</div>
					</div>
				</div>

				{/* Scrollable Content Body */}
				<div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
					{isPending && logs.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
							<RefreshCw className="size-6 animate-spin mb-2 text-primary" />
							<p className="text-xs font-medium">Loading audit history...</p>
						</div>
					) : filteredLogs.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground rounded-sm border border-dashed bg-muted/5 p-8">
							<History className="size-10 stroke-1 mb-2 text-muted-foreground/60" />
							<p className="text-sm font-semibold text-foreground">No Audit Records Found</p>
							<p className="text-xs max-w-xs mt-1">
								{searchQuery
									? "No activity matched your search filter."
									: "Actions such as price changes, nominee updates, and event status changes will be recorded here."}
							</p>
						</div>
					) : (
						<Card className="p-0 overflow-hidden border shadow-xs rounded-sm">
							<div className="overflow-x-auto">
								<table className="w-full text-xs">
									<thead className="bg-muted/40 border-b border-border/70">
										<tr>
											<th className="text-left font-semibold text-muted-foreground px-4 py-2.5 whitespace-nowrap">Action</th>
											<th className="text-left font-semibold text-muted-foreground px-4 py-2.5 whitespace-nowrap">Description</th>
											<th className="text-left font-semibold text-muted-foreground px-4 py-2.5 whitespace-nowrap">Performed By</th>
											<th className="text-left font-semibold text-muted-foreground px-4 py-2.5 whitespace-nowrap">IP Address</th>
											<th className="text-left font-semibold text-muted-foreground px-4 py-2.5 whitespace-nowrap">Timestamp</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-border/50">
										{filteredLogs.map((log) => {
											const config = getActionConfig(log.action);
											const ActionIcon = config.icon;
											const changes = log.metadata?.changes as Record<string, { from: any; to: any }> | undefined;
											const hasChanges = changes && Object.keys(changes).length > 0;
											const isExpanded = expandedRow === log.id;

											return (
												<tr
													key={log.id}
													className={`group transition-colors hover:bg-muted/30 cursor-pointer ${isExpanded ? "bg-muted/20" : ""}`}
													onClick={() => setExpandedRow(isExpanded ? null : log.id)}
													title={hasChanges ? "Click to view field changes" : undefined}
												>
													{/* Action Badge */}
													<td className="px-4 py-3 align-top whitespace-nowrap">
														<Badge
															variant="outline"
															className={`gap-1 font-semibold text-[11px] px-2 py-0.5 rounded-md ${config.badgeClass}`}
														>
															<ActionIcon className="size-3" />
															<span>{config.label}</span>
														</Badge>
													</td>

													{/* Description + expandable changes */}
													<td className="px-4 py-3 align-top max-w-[260px]">
														<p className="text-muted-foreground font-normal leading-snug line-clamp-2">
															{log.description}
														</p>
														{/* Expandable field changes */}
														{hasChanges && isExpanded && (
															<div className="mt-2 pt-2 border-t border-border/40 space-y-1">
																<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
																	Field Changes
																</p>
																{Object.entries(changes).map(([field, delta]) => (
																	<div
																		key={field}
																		className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]"
																	>
																		<span className="capitalize font-semibold text-foreground/80">
																			{field}:
																		</span>
																		<span className="line-through bg-destructive/10 text-destructive px-1 rounded">
																			{String(delta.from || "Empty")}
																		</span>
																		<ArrowRight className="size-3 text-muted-foreground shrink-0" />
																		<span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1 rounded font-semibold">
																			{String(delta.to || "Empty")}
																		</span>
																	</div>
																))}
															</div>
														)}
														{hasChanges && !isExpanded && (
															<p className="text-[10px] text-primary/70 mt-0.5 italic">
																Click to view {Object.keys(changes).length} field change{Object.keys(changes).length > 1 ? "s" : ""}
															</p>
														)}
													</td>

													{/* User */}
													<td className="px-4 py-3 align-top whitespace-nowrap">
														<div className="flex items-center gap-2.5">
															<Avatar
																src={log.user?.avatarUrl}
																alt={log.user?.fullName || log.user?.email || "User"}
																width={32}
																height={32}
																className="h-8 w-8 rounded-lg shrink-0 border border-border/60"
															/>
															<div className="flex flex-col min-w-0">
																<span className="font-semibold text-foreground truncate max-w-[130px]">
																	{log.user?.fullName || (log.user?.email ? log.user.email.split("@")[0] : "System")}
																</span>
																{log.user?.email && (
																	<span className="text-[10px] text-muted-foreground truncate max-w-[130px]">
																		{log.user.email}
																	</span>
																)}
															</div>
														</div>
													</td>

													{/* IP Address */}
													<td className="px-4 py-3 align-top whitespace-nowrap">
														<span className="font-mono text-[11px] text-muted-foreground bg-muted/60 border border-border/60 rounded px-1.5 py-0.5 inline-block">
															{formatIpAddress(log.ipAddress)}
														</span>
													</td>

													{/* Timestamp */}
													<td className="px-4 py-3 align-top whitespace-nowrap">
														<div className="flex flex-col">
															<span className="font-medium text-foreground/80">{formatRelativeTime(log.createdAt)}</span>
															<span className="text-[10px] text-muted-foreground/70">{formatTimestamp(log.createdAt)}</span>
														</div>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						</Card>
					)}
				</div>

				{/* Footer summary */}
				{filteredLogs.length > 0 && (
					<div className="px-6 py-3 border-t bg-muted/20 text-xs text-muted-foreground flex items-center justify-between shrink-0">
						<span>
							Showing <strong className="text-foreground">{filteredLogs.length}</strong> of {logs.length} records
						</span>
						<span>
							Last activity: {logs.length > 0 ? formatRelativeTime(logs[0]!.createdAt) : "—"}
						</span>
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}
