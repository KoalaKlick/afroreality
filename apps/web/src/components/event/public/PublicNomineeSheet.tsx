"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { Vote, Share2, Users, Hash, User, Trophy, Sparkles } from "lucide-react";
import type { VotingOption, VotingCategory } from "@/lib/types/voting";
import { VotePaymentModal } from "@/components/event/nomination/VotePaymentModal";
import { PublicNominationModal } from "./PublicNominationModal";
import { toast } from "sonner";

interface NomineeGridProps {
	readonly nominees: VotingOption[];
	readonly votePrice?: number;
	readonly eventId: string;
	readonly categoryId: string;
	readonly isPublic?: boolean;
	readonly votingMode?: "internal" | "general" | string;
	readonly showTotalVotesPublicly?: boolean;
	readonly orgSlug?: string;
	readonly eventSlug?: string;
}

export function NomineeGrid({
	nominees,
	votePrice = 0,
	eventId,
	categoryId,
	votingMode = "general",
	showTotalVotesPublicly = true,
	orgSlug,
	eventSlug,
}: NomineeGridProps) {
	const [selectedNominee, setSelectedNominee] = useState<VotingOption | null>(
		null,
	);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [voteModalOpen, setVoteModalOpen] = useState(false);

	const isFree = votingMode !== "internal" && votePrice === 0;

	const handleOpenNominee = (nominee: VotingOption) => {
		setSelectedNominee(nominee);
		setSheetOpen(true);
	};

	const handleOpenVoteModal = (nominee: VotingOption) => {
		setSelectedNominee(nominee);
		setVoteModalOpen(true);
	};

	const handleShare = async (nominee: VotingOption) => {
		const shareUrl = `${window.location.origin}/${orgSlug}/event/${eventSlug}/category/${categoryId}`;
		const shareText = `Vote for ${nominee.optionText} on AfroReality!`;

		if (navigator.share) {
			try {
				await navigator.share({
					title: nominee.optionText,
					text: shareText,
					url: shareUrl,
				});
			} catch {
				// Fallback to copy
			}
		} else {
			await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
			toast.success("Vote link copied to clipboard!");
		}
	};

	if (!nominees || nominees.length === 0) {
		return (
			<div className="text-center py-8 px-4 rounded-xl border border-dashed bg-card/40 text-xs text-muted-foreground">
				No nominees published for this category yet.
			</div>
		);
	}

	return (
		<>
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{nominees.map((nominee) => {
					const imgUrl = nominee.imageUrl
						? getEventImageUrl(nominee.imageUrl)
						: null;
					const votes = Number(nominee.votesCount || 0);

					return (
						<div
							key={nominee.id}
							className="group rounded-2xl border bg-card/60 p-4 transition-all duration-300 hover:border-primary/40 hover:shadow-lg flex flex-col justify-between"
						>
							<div
								onClick={() => handleOpenNominee(nominee)}
								className="cursor-pointer space-y-3"
							>
								{/* Nominee Avatar */}
								<div className="relative aspect-square w-full rounded-xl overflow-hidden bg-muted border flex items-center justify-center">
									{imgUrl ? (
										<img
											src={imgUrl}
											alt={nominee.optionText}
											className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
										/>
									) : (
										<User className="size-12 text-muted-foreground/50" />
									)}

									{nominee.nomineeCode && (
										<div className="absolute top-2.5 right-2.5 rounded-full bg-background/85 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase border shadow-xs">
											#{nominee.nomineeCode}
										</div>
									)}
								</div>

								{/* Nominee Meta */}
								<div>
									<h4 className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
										{nominee.optionText}
									</h4>
									{nominee.bio && (
										<p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
											{nominee.bio}
										</p>
									)}
								</div>
							</div>

							{/* Actions & Votes */}
							<div className="pt-4 mt-3 border-t flex items-center justify-between gap-2">
								{showTotalVotesPublicly && (
									<div className="text-left">
										<p className="text-[10px] uppercase font-bold text-muted-foreground">
											Votes
										</p>
										<p className="text-xs font-black text-foreground font-mono">
											{votes}
										</p>
									</div>
								)}

								<div className="flex items-center gap-1.5 ml-auto">
									<Button
										variant="ghost"
										size="icon"
										className="size-8"
										onClick={() => handleShare(nominee)}
										title="Share Nominee"
									>
										<Share2 className="size-3.5 text-muted-foreground" />
									</Button>

									<Button
										size="sm"
										onClick={() => handleOpenVoteModal(nominee)}
										className="text-xs font-bold gap-1.5 h-8"
									>
										<Vote className="size-3.5" />
										<span>
											{votingMode === "internal"
												? "Ballot"
												: isFree
													? "Vote"
													: `GHS ${votePrice}`}
										</span>
									</Button>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{/* Nominee Profile Quick-View Sheet */}
			<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
				<SheetContent className="sm:max-w-md p-6 overflow-y-auto">
					{selectedNominee && (
						<div className="space-y-6">
							<SheetHeader>
								<SheetTitle className="text-xl font-bold">
									{selectedNominee.optionText}
								</SheetTitle>
							</SheetHeader>

							<div className="relative aspect-4/5 w-full rounded-2xl overflow-hidden bg-muted border flex items-center justify-center">
								{selectedNominee.imageUrl ? (
									<img
										src={getEventImageUrl(selectedNominee.imageUrl) || ""}
										alt={selectedNominee.optionText}
										className="size-full object-cover"
									/>
								) : (
									<User className="size-16 text-muted-foreground/40" />
								)}
							</div>

							{selectedNominee.bio && (
								<div className="space-y-1">
									<h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
										About Nominee
									</h5>
									<p className="text-xs text-muted-foreground leading-relaxed">
										{selectedNominee.bio}
									</p>
								</div>
							)}

							<div className="flex gap-2 pt-2">
								<Button
									onClick={() => {
										setSheetOpen(false);
										setVoteModalOpen(true);
									}}
									className="flex-1 text-xs font-bold h-10 gap-2"
								>
									<Vote className="size-4" />
									Vote for {selectedNominee.optionText}
								</Button>
								<Button
									variant="outline"
									size="icon"
									className="size-10"
									onClick={() => handleShare(selectedNominee)}
								>
									<Share2 className="size-4" />
								</Button>
							</div>
						</div>
					)}
				</SheetContent>
			</Sheet>

			{/* Vote Modal */}
			<VotePaymentModal
				nominee={selectedNominee}
				open={voteModalOpen}
				onOpenChange={setVoteModalOpen}
				votePrice={votePrice}
				eventId={eventId}
				categoryId={categoryId}
				votingMode={votingMode}
				orgSlug={orgSlug}
				eventSlug={eventSlug}
			/>
		</>
	);
}

export function PublicNomineeSheet({
	category,
	eventId,
	votingMode = "general",
	orgSlug,
	eventSlug,
}: {
	category: VotingCategory;
	eventId: string;
	votingMode?: string;
	orgSlug: string;
	eventSlug: string;
}) {
	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-xl font-bold text-foreground">{category.name}</h3>
					{category.description && (
						<p className="text-xs text-muted-foreground mt-0.5">
							{category.description}
						</p>
					)}
				</div>
				{category.allowPublicNomination && (
					<PublicNominationModal
						eventId={eventId}
						category={category}
						orgSlug={orgSlug}
						eventSlug={eventSlug}
					/>
				)}
			</div>

			<NomineeGrid
				nominees={category.votingOptions || []}
				votePrice={category.votePrice}
				eventId={eventId}
				categoryId={category.id}
				isPublic={true}
				votingMode={votingMode === "internal" ? "internal" : "general"}
				showTotalVotesPublicly={category.showTotalVotesPublicly}
				orgSlug={orgSlug}
				eventSlug={eventSlug}
			/>
		</div>
	);
}
