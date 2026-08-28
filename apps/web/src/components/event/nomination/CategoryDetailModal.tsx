"use client";

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
	"#009A44",
	"#FFD100",
	"#EF3340",
	"#3b82f6",
	"#8b5cf6",
	"#ec4899",
	"#10b981",
	"#f59e0b",
];

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

	const nominees = category.votingOptions || [];
	const totalVotes = nominees.reduce(
		(sum, n) => sum + Number(n.votesCount || 0),
		0,
	);

	const chartData = nominees.map((n, idx) => ({
		name: n.optionText,
		fullName: n.optionText,
		votes: Number(n.votesCount || 0),
		fill: BAR_COLORS[idx % BAR_COLORS.length],
	}));

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto p-6">
				<DialogHeader>
					<DialogTitle className="text-xl font-bold flex items-center gap-2">
						<Trophy className="size-5 text-amber-500" />
						<span>{category.name}</span>
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-6 pt-2">
					{/* Summary Stats */}
					<div className="grid grid-cols-2 gap-4">
						<div className="p-4 rounded-xl border bg-muted/30">
							<span className="text-xs text-muted-foreground font-medium">
								Total Nominees
							</span>
							<p className="text-2xl font-black text-foreground mt-1">
								{nominees.length}
							</p>
						</div>
						<div className="p-4 rounded-xl border bg-muted/30">
							<span className="text-xs text-muted-foreground font-medium">
								Total Ballots Recorded
							</span>
							<p className="text-2xl font-black text-primary mt-1">
								{totalVotes}
							</p>
						</div>
					</div>

					{/* Nominees Breakdown */}
					<div className="space-y-3">
						<h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
							Nominee Rankings
						</h4>
						<div className="space-y-2">
							{nominees
								.slice()
								.sort(
									(a, b) => Number(b.votesCount || 0) - Number(a.votesCount || 0),
								)
								.map((nominee, idx) => {
									const votes = Number(nominee.votesCount || 0);
									const percentage =
										totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
									const imgUrl = nominee.imageUrl
										? getEventImageUrl(nominee.imageUrl)
										: null;

									return (
										<div
											key={nominee.id}
											className="p-3.5 rounded-xl border bg-card/60 flex items-center justify-between gap-3"
										>
											<div className="flex items-center gap-3 min-w-0">
												<span className="text-xs font-bold w-5 text-muted-foreground">
													#{idx + 1}
												</span>
												<div className="size-10 rounded-lg bg-muted border overflow-hidden shrink-0 flex items-center justify-center">
													{imgUrl ? (
														<img
															src={imgUrl}
															alt=""
															className="size-full object-cover"
														/>
													) : (
														<User className="size-5 text-muted-foreground" />
													)}
												</div>
												<div className="min-w-0">
													<p className="text-xs font-bold text-foreground truncate">
														{nominee.optionText}
													</p>
													{nominee.nomineeCode && (
														<span className="text-[10px] font-mono text-muted-foreground">
															Code: {nominee.nomineeCode}
														</span>
													)}
												</div>
											</div>

											<div className="text-right shrink-0">
												<p className="text-xs font-black text-foreground">
													{votes} {votes === 1 ? "Vote" : "Votes"}
												</p>
												<p className="text-[10px] text-muted-foreground">
													{percentage.toFixed(1)}%
												</p>
											</div>
										</div>
									);
								})}
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
