"use client";
// src/components/event/nomination/CategoryDetailModal.tsx

import { useState, useEffect, type ReactNode } from "react";
import Image from "next/image";
import { ResponsiveContainer, PieChart, Pie, Tooltip } from "recharts";
import type { TooltipContentProps } from "recharts";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Trophy, Vote, User, Loader2 } from "lucide-react";
import { getEventImageUrl } from "@/lib/image-url-utils";
import {
	InternalVoterParticipation,
	type VoteParticipant,
} from "./InternalVoterParticipation";

export interface VotingChartNominee {
	id: string;
	optionText: string;
	votesCount: number | bigint;
	imageUrl?: string | null;
	nomineeCode?: string | null;
}

export interface VotingChartCategory {
	id: string;
	name: string;
	description?: string | null;
	votePrice?: number;
	votingOptions: VotingChartNominee[];
}

interface CategoryDetailModalProps {
	readonly category: VotingChartCategory | null;
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly isInternalVoting?: boolean;
	readonly eventId?: string;
}

const BAR_COLORS = [
	"var(--primary, #02a605)",
	"var(--color-secondary-400, #f59e0b)",
	"var(--color-tertiary-500, #dc2626)",
	"#3b82f6",
	"#8b5cf6",
	"#ec4899",
	"#10b981",
	"#6366f1",
];

function ModalPieTooltip({ active, payload }: TooltipContentProps): ReactNode {
	if (!active || !payload?.length) return null;
	const entry = payload[0];
	const fullName = entry?.payload?.fullName as string;
	const pct = entry?.payload?.pct as string;
	return (
		<div className="rounded-lg border border-primary/20 bg-background px-3 py-2 text-xs shadow-md">
			<p className="font-semibold text-primary">{fullName}</p>
			<p className="text-muted-foreground">
				{Number(entry?.value ?? 0).toLocaleString()} votes ({pct}%)
			</p>
		</div>
	);
}

export function CategoryDetailModal({
	category,
	open,
	onOpenChange,
	isInternalVoting = false,
	eventId,
}: CategoryDetailModalProps) {
	const [participants, setParticipants] = useState<VoteParticipant[]>([]);
	const [loadingParticipants, setLoadingParticipants] = useState(false);

	if (!category) return null;

	const nominees = [...(category.votingOptions || [])].sort(
		(a, b) => Number(b.votesCount || 0) - Number(a.votesCount || 0),
	);
	const totalVotes = nominees.reduce(
		(sum, n) => sum + Number(n.votesCount || 0),
		0,
	);
	const leader = nominees[0];

	const chartConfig: ChartConfig = {
		votes: { label: "Votes", color: BAR_COLORS[0] },
	};

	const chartData = nominees.map((n, idx) => ({
		name: n.optionText.length > 14 ? `${n.optionText.slice(0, 13)}…` : n.optionText,
		fullName: n.optionText,
		votes: Number(n.votesCount || 0),
		fill: BAR_COLORS[idx % BAR_COLORS.length],
		pct: totalVotes > 0 ? ((Number(n.votesCount || 0) / totalVotes) * 100).toFixed(1) : "0",
	}));

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-6 border-border/80">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
						<Vote className="size-5 text-primary" />
						<span>{category.name}</span>
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 pt-1">
					{/* Summary Header Box */}
					<div className="flex items-center justify-between rounded-xl border border-primary/20 p-4 bg-muted/30">
						<div>
							<span className="text-xs text-muted-foreground font-medium">Total Votes Cast</span>
							<p className="text-xl font-black text-primary mt-0.5">
								{totalVotes.toLocaleString()}
							</p>
						</div>
						{leader && totalVotes > 0 && (
							<div className="text-right">
								<div className="flex items-center gap-1 justify-end text-xs text-amber-500 font-semibold">
									<Trophy className="size-3.5" />
									<span>Leading</span>
								</div>
								<p className="text-sm font-bold text-foreground truncate max-w-[150px] mt-0.5">
									{leader.optionText}
								</p>
							</div>
						)}
					</div>

					{/* Side-by-side Pie Chart and Legend */}
					{totalVotes > 0 && (
						<div className="flex items-center w-full gap-4 py-2 border rounded-xl px-3 bg-card">
							<ChartContainer
								config={chartConfig}
								className="h-[180px] w-[180px] shrink-0 [&>div]:aspect-auto!"
							>
								<ResponsiveContainer width="100%" height="100%">
									<PieChart>
										<Pie
											data={chartData}
											dataKey="votes"
											nameKey="name"
											cx="50%"
											cy="50%"
											innerRadius="50%"
											outerRadius="95%"
											paddingAngle={2}
											strokeWidth={0}
										/>
										<Tooltip content={ModalPieTooltip} />
									</PieChart>
								</ResponsiveContainer>
							</ChartContainer>

							{/* Legend list */}
							<ul className="flex flex-col gap-1.5 flex-1 min-w-0 max-h-44 overflow-y-auto pr-1">
								{chartData.map((d) => (
									<li
										key={d.fullName}
										className="flex items-center justify-between gap-2 min-w-0 text-xs"
									>
										<div className="flex items-center gap-2 min-w-0">
											<span
												className="size-2.5 rounded-xs shrink-0"
												style={{ backgroundColor: d.fill }}
											/>
											<span className="truncate text-muted-foreground">
												{d.name}
											</span>
										</div>
										<span className="font-semibold text-foreground text-[11px] shrink-0 font-mono">
											{d.pct}%
										</span>
									</li>
								))}
							</ul>
						</div>
					)}

					{/* Rankings Table */}
					<div className="rounded-xl border overflow-hidden bg-card">
						<div className="grid grid-cols-[auto_auto_1fr_auto_auto] gap-x-3 px-4 py-2.5 bg-muted/50 border-b text-xs font-semibold text-muted-foreground">
							<span className="w-5">#</span>
							<span className="w-7"></span>
							<span>Nominee</span>
							<span className="text-right">Votes</span>
							<span className="text-right w-12">Share</span>
						</div>
						<div className="divide-y max-h-56 overflow-y-auto">
							{nominees.length === 0 ? (
								<div className="py-8 text-center text-xs text-muted-foreground">
									No nominees registered in this category.
								</div>
							) : (
								nominees.map((nominee, idx) => {
									const votes = Number(nominee.votesCount || 0);
									const pct = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : "0";
									const imgUrl = nominee.imageUrl ? getEventImageUrl(nominee.imageUrl) : null;

									return (
										<div
											key={nominee.id}
											className="grid grid-cols-[auto_auto_1fr_auto_auto] gap-x-3 px-4 py-2.5 text-xs items-center hover:bg-muted/20 transition-colors"
										>
											<span className="text-muted-foreground font-bold w-5">
												{idx + 1}
											</span>
											<div className="size-7 rounded-md bg-muted border overflow-hidden flex items-center justify-center shrink-0">
												{imgUrl ? (
													<img
														src={imgUrl}
														alt=""
														className="size-full object-cover"
													/>
												) : (
													<User className="size-3.5 text-muted-foreground" />
												)}
											</div>
											<div className="min-w-0">
												<p className="font-medium text-foreground truncate">{nominee.optionText}</p>
												{nominee.nomineeCode && (
													<span className="text-[10px] font-mono text-muted-foreground">
														Code: {nominee.nomineeCode}
													</span>
												)}
											</div>
											<span className="text-right font-bold text-foreground tabular-nums font-mono">
												{votes.toLocaleString()}
											</span>
											<span className="text-right text-muted-foreground tabular-nums w-12 font-mono">
												{pct}%
											</span>
										</div>
									);
								})
							)}
						</div>
					</div>

					{/* Internal Voter Participation */}
					{isInternalVoting && participants.length > 0 && (
						<div className="border-t pt-4">
							<InternalVoterParticipation
								participants={participants}
								categoryName={category.name}
							/>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

