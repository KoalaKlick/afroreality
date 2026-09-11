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
} from "lucide-react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
	const [activeFilter, setActiveFilter] = useState<"all" | "nominees" | "status">("all");
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

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				variant="brand"
				className="w-full sm:max-w-3xl overflow-y-auto p-0 flex flex-col h-full bg-background"
			>
				{/* Drawer Header */}
				<div className="p-5 pb-4 border-b border-border/70 bg-muted/20">
					<div className="flex items-start justify-between gap-4">
						<div className="flex items-center gap-3">
							<div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
								<ShieldCheck className="size-5" />
							</div>
							<div>
								<SheetTitle className="text-lg font-bold">
									Event Audit Trail
								</SheetTitle>
								<SheetDescription className="text-xs text-muted-foreground mt-0.5">
									{eventTitle ? `Tracking history for "${eventTitle}"` : "Complete immutable action history with machine IP tracking."}
								</SheetDescription>
							</div>
						</div>
						<Button
							variant="outline"
							size="icon"
							className="size-8 shrink-0"
							onClick={fetchLogs}
							disabled={isPending}
							title="Refresh logs"
						>
							<RefreshCw className={`size-3.5 ${isPending ? "animate-spin" : ""}`} />
						</Button>
					</div>

					{/* Search and Filters */}
					<div className="mt-4 space-y-2.5">
						<div className="relative">
							<Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
							<Input
								placeholder="Search actions, nominees, IPs or users..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9 h-9 text-xs bg-background"
							/>
						</div>

						<div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
							<button
								type="button"
								onClick={() => setActiveFilter("all")}
								className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
									activeFilter === "all"
										? "bg-primary text-primary-foreground"
										: "bg-muted text-muted-foreground hover:text-foreground"
								}`}
							>
								All ({logs.length})
							</button>
							<button
								type="button"
								onClick={() => setActiveFilter("nominees")}
								className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
									activeFilter === "nominees"
										? "bg-primary text-primary-foreground"
										: "bg-muted text-muted-foreground hover:text-foreground"
								}`}
							>
								Nominees ({logs.filter((l) => l.action.startsWith("nominee_")).length})
							</button>
							<button
								type="button"
								onClick={() => setActiveFilter("status")}
								className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
									activeFilter === "status"
										? "bg-primary text-primary-foreground"
										: "bg-muted text-muted-foreground hover:text-foreground"
								}`}
							>
								Status ({logs.filter((l) => l.action.includes("status")).length})
							</button>
						</div>
					</div>
				</div>

				{/* Drawer Body — Table */}
				<div className="flex-1 overflow-y-auto overflow-x-auto">
					{isPending && logs.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
							<RefreshCw className="size-6 animate-spin mb-2 text-primary" />
							<p className="text-xs font-medium">Loading audit history...</p>
						</div>
					) : filteredLogs.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground p-8">
							<History className="size-10 stroke-1 mb-2 text-muted-foreground/60" />
							<p className="text-sm font-semibold text-foreground">No Audit Records Found</p>
							<p className="text-xs max-w-xs mt-1">
								{searchQuery
									? "No activity matched your search filter."
									: "Actions such as creating, updating, or deleting nominees and changing event status will be recorded here."}
							</p>
						</div>
					) : (
						<table className="w-full text-xs">
							<thead className="sticky top-0 z-10 bg-muted/60 backdrop-blur-sm border-b border-border/70">
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
												<p className="text-foreground font-medium leading-snug line-clamp-2">
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
												<div className="flex items-center gap-2">
													<Avatar className="size-5 border">
														<AvatarImage src={log.user?.avatarUrl || ""} />
														<AvatarFallback className="text-[10px]">
															{log.user?.fullName?.charAt(0) || "S"}
														</AvatarFallback>
													</Avatar>
													<span className="font-medium text-foreground/80 truncate max-w-[120px]">
														{log.user?.fullName || log.user?.email || "System"}
													</span>
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
					)}
				</div>

				{/* Footer summary */}
				{filteredLogs.length > 0 && (
					<div className="px-4 py-2.5 border-t border-border/70 bg-muted/20 text-[11px] text-muted-foreground flex items-center justify-between">
						<span>
							Showing {filteredLogs.length} of {logs.length} records
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
