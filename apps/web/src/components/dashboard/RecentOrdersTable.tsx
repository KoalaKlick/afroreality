"use client";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Receipt } from "lucide-react";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatAmount } from "@/lib/utils";

export interface OrderItem {
	id: string;
	orderNumber: string;
	buyerName: string | null;
	buyerEmail: string;
	total: number;
	currency: string;
	status: string;
	createdAt: string;
	event: { title: string };
}

interface RecentOrdersTableProps {
	readonly orders: OrderItem[];
}

function formatRelative(date: string) {
	const d = new Date(date);
	const now = new Date();
	const diffMs = now.getTime() - d.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMins < 1) return "Just now";
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function RecentOrdersTable({ orders = [] }: RecentOrdersTableProps) {
	return (
		<div className="rounded-xl bg-card p-4 sm:p-6 shadow-xs border border-border/50 min-w-0 max-w-full overflow-hidden">
			<div className="mb-4 flex items-center gap-2">
				<Receipt className="size-4 text-emerald-600" />
				<h3 className="font-semibold text-foreground text-sm">Recent Orders</h3>
			</div>
			{orders.length === 0 ? (
				<EmptyState
					variant="orders"
					title="No orders yet"
					description="Ticket purchases and order activity from your events will show up here."
					className="py-6 min-h-[220px]"
					svgClassName="w-24 h-24 mb-2 opacity-90"
				/>
			) : (
				<div className="overflow-x-auto -mx-4 sm:-mx-6">
					<Table className="min-w-[500px]">
						<TableHeader>
							<TableRow>
								<TableHead className="pl-4 sm:pl-6">Buyer</TableHead>
								<TableHead>Event</TableHead>
								<TableHead>Amount</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="pr-4 sm:pr-6 text-right">When</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{orders.map((order) => (
								<TableRow key={order.id}>
									<TableCell className="pl-4 sm:pl-6">
										<div className="min-w-0">
											<p className="truncate text-sm font-medium">
												{order.buyerName || "Guest"}
											</p>
											<p className="truncate text-xs text-muted-foreground">
												{order.buyerEmail}
											</p>
										</div>
									</TableCell>
									<TableCell>
										<span className="truncate text-sm font-medium">
											{order.event.title}
										</span>
									</TableCell>
									<TableCell className="font-mono text-sm tabular-nums font-semibold">
										{formatAmount(Number(order.total), order.currency)}
									</TableCell>
									<TableCell>
										<StatusBadge variant={order.status === "paid" ? "completed" : order.status === "refunded" ? "warning" : order.status} />
									</TableCell>
									<TableCell className="pr-4 sm:pr-6 text-right text-xs text-muted-foreground">
										{formatRelative(order.createdAt)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
}
