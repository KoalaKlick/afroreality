"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Users } from "lucide-react";

export interface VoteParticipant {
	id: string;
	name?: string | null;
	email?: string | null;
	hasVoted: boolean;
	votedAt?: Date | string | null;
}

interface InternalVoterParticipationProps {
	readonly participants: VoteParticipant[];
	readonly categoryName?: string;
}

/**
 * Shows which org members have voted vs. haven't in an internal event.
 * NEVER shows which nominee they voted for — only participation status.
 */
export function InternalVoterParticipation({
	participants,
	categoryName,
}: InternalVoterParticipationProps) {
	const votedCount = participants.filter((p) => p.hasVoted).length;
	const totalCount = participants.length;

	return (
		<div className="space-y-4">
			{/* Summary */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Users className="size-4 text-muted-foreground" />
					<span className="text-sm font-medium">
						Voter Participation
						{categoryName && (
							<span className="text-muted-foreground font-normal">
								{" "}
								— {categoryName}
							</span>
						)}
					</span>
				</div>
				<Badge variant="outline" className="text-xs font-mono">
					{votedCount} / {totalCount} voted
				</Badge>
			</div>

			{/* Progress bar */}
			<div className="h-2 rounded-full bg-muted overflow-hidden">
				<div
					className="h-full bg-primary transition-all duration-300 rounded-full"
					style={{
						width: `${totalCount > 0 ? (votedCount / totalCount) * 100 : 0}%`,
					}}
				/>
			</div>

			{/* Member List */}
			<div className="space-y-1.5 max-h-64 overflow-y-auto">
				{participants.map((p) => (
					<div
						key={p.id}
						className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 text-xs"
					>
						<span className="font-medium text-foreground">
							{p.name || p.email || "Member"}
						</span>
						{p.hasVoted ? (
							<span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
								<CheckCircle2 className="size-3.5" /> Voted
							</span>
						) : (
							<span className="flex items-center gap-1 text-muted-foreground">
								<XCircle className="size-3.5" /> Not Voted
							</span>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
