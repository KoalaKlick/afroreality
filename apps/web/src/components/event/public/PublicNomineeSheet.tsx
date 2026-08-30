"use client";

import { useState } from "react";
import {
	Vote,
	User,
	Share2,
	Trophy,
	Sparkles,
	Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { VotePaymentModal } from "@/components/event/nomination/VotePaymentModal";
import { PublicNominationModal } from "@/components/event/public/PublicNominationModal";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { toast } from "sonner";
import { RichTextDisplay } from "@/components/ui/rich-text-display";

interface VotingOption {
	id: string;
	optionText: string;
	imageUrl?: string | null;
	nomineeCode?: string | null;
	bio?: string | null;
	votes?: number;
}

interface NomineeGridProps {
	readonly nominees: VotingOption[];
	readonly votePrice: number;
	readonly eventId: string;
	readonly categoryId: string;
	readonly votingMode?: string;
	readonly showTotalVotesPublicly?: boolean;
	readonly resultDisplayType?: "percentage" | "count";
	readonly orgSlug?: string;
	readonly eventSlug?: string;
}

export function NomineeGrid({
	nominees,
	votePrice,
	eventId,
	categoryId,
	votingMode = "general",
	showTotalVotesPublicly = true,
	resultDisplayType = "percentage",
	orgSlug = "",
	eventSlug = "",
}: NomineeGridProps) {
	const [selectedNominee, setSelectedNominee] = useState<VotingOption | null>(
		null,
	);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [voteModalOpen, setVoteModalOpen] = useState(false);

	const isFree = Number(votePrice) === 0;

	// Total votes for percentage calculation
	const totalVotesAcrossCategory = nominees.reduce(
		(acc, n) => acc + (n.votes || 0),
		0,
	);

	const handleOpenNominee = (nominee: VotingOption) => {
		setSelectedNominee(nominee);
		setSheetOpen(true);
	};

	const handleOpenVoteModal = (nominee: VotingOption) => {
		setSelectedNominee(nominee);
		setVoteModalOpen(true);
	};

	const handleShare = async (nominee: VotingOption) => {
		const shareUrl = typeof window !== "undefined" ? window.location.href : "";
		const shareData = {
			title: `Vote for ${nominee.optionText}`,
			text: `Vote for ${nominee.optionText} (${nominee.nomineeCode || ""}) on AfroReality!`,
			url: shareUrl,
		};

		if (navigator.share && navigator.canShare?.(shareData)) {
			try {
				await navigator.share(shareData);
				return;
			} catch {
				// Fallback to clipboard
			}
		}

		if (typeof window !== "undefined") {
			navigator.clipboard.writeText(shareUrl);
			toast.success("Nominee link copied to clipboard!");
		}
	};

	if (nominees.length === 0) {
		return (
			<div className="text-center py-16 border rounded-2xl bg-card/40 p-8">
				<User className="size-12 mx-auto text-muted-foreground/40 mb-3" />
				<h4 className="text-lg font-bold">No nominees yet</h4>
				<p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
					Nominees for this category have not been published yet. Please check back later.
				</p>
			</div>
		);
	}

	return (
		<>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
				{nominees.map((nominee) => {
					const votes = nominee.votes || 0;
					const pct =
						totalVotesAcrossCategory > 0
							? ((votes / totalVotesAcrossCategory) * 100).toFixed(1)
							: "0.0";
					const imgUrl = getEventImageUrl(nominee.imageUrl);

					return (
						<div
							key={nominee.id}
							className="group rounded-2xl border bg-card/70 p-4 transition-all duration-300 hover:border-primary/50 flex flex-col justify-between"
						>
							<div
								onClick={() => handleOpenNominee(nominee)}
								className="cursor-pointer space-y-3"
							>
								{/* Nominee Avatar */}
								<div className="relative aspect-4/3 w-full rounded-xl overflow-hidden bg-muted border flex items-center justify-center">
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
										<div className="absolute top-2.5 right-2.5 rounded-full bg-background/85 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase border text-primary">
											#{nominee.nomineeCode}
										</div>
									)}
								</div>

								{/* Nominee Meta */}
								<div>
									<h4 className="font-bold text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors">
										{nominee.optionText}
									</h4>
									{nominee.bio && (
										<RichTextDisplay
											content={nominee.bio}
											className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed"
										/>
									)}
								</div>
							</div>

							{/* Live Results Display */}
							{showTotalVotesPublicly && (
								<div className="mt-3 pt-3 border-t">
									{resultDisplayType === "count" ? (
										<div className="flex items-center justify-between text-xs">
											<span className="text-muted-foreground font-medium flex items-center gap-1">
												<Vote className="size-3 text-primary" /> Total Votes:
											</span>
											<span className="font-mono font-bold text-foreground">
												{votes.toLocaleString()}
											</span>
										</div>
									) : (
										<div className="space-y-1.5">
											<div className="flex items-center justify-between text-xs">
												<span className="text-muted-foreground font-medium flex items-center gap-1">
													<Percent className="size-3 text-primary" /> Share:
												</span>
												<span className="font-mono font-bold text-primary">
													{pct}%
												</span>
											</div>
											<div className="w-full bg-muted/80 rounded-full h-1.5 overflow-hidden">
												<div
													className="bg-primary h-full rounded-full transition-all duration-500"
													style={{
														width: `${Math.min(100, Math.max(0, Number(pct)))}%`,
													}}
												/>
											</div>
										</div>
									)}
								</div>
							)}

							{/* Actions */}
							<div className="pt-3 mt-3 border-t flex items-center justify-between gap-2">
								<Button
									variant="ghost"
									size="icon"
									className="size-8 rounded-full"
									onClick={() => handleShare(nominee)}
									title="Share Nominee"
								>
									<Share2 className="size-3.5 text-muted-foreground" />
								</Button>

								<Button
									size="sm"
									onClick={() => handleOpenVoteModal(nominee)}
									className="text-xs font-bold gap-1.5 h-8 flex-1"
								>
									<Vote className="size-3.5" />
									<span>
										{votingMode === "internal"
											? "Cast Ballot"
											: isFree
												? "Vote Free"
												: `Vote (GHS ${votePrice.toFixed(2)})`}
									</span>
								</Button>
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
									<RichTextDisplay
										content={selectedNominee.bio}
										className="text-xs text-muted-foreground leading-relaxed"
									/>
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
				isPublic={true}
				votingMode={votingMode}
				orgSlug={orgSlug}
				eventSlug={eventSlug}
			/>
		</>
	);
}

interface PublicNomineeSheetProps {
	readonly category: {
		id: string;
		name: string;
		description?: string | null;
		votePrice?: number;
		nominationPrice?: number;
		allowPublicNomination?: boolean;
		allowMultiple?: boolean;
		showTotalVotesPublicly?: boolean;
		templateConfig?: any;
		votingOptions?: VotingOption[];
	};
	readonly eventId: string;
	readonly votingMode?: string;
	readonly orgSlug?: string;
	readonly eventSlug?: string;
}

export function PublicNomineeSheet({
	category,
	eventId,
	votingMode = "general",
	orgSlug,
	eventSlug,
}: PublicNomineeSheetProps) {
	const resultDisplayType =
		category.templateConfig?.resultDisplayType === "count"
			? "count"
			: "percentage";

	return (
		<div className="space-y-8">
			{/* Public Nomination Banner */}
			{category.allowPublicNomination && (
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-primary/5 border border-primary/20">
					<div className="space-y-1 text-center sm:text-left">
						<div className="flex items-center justify-center sm:justify-start gap-2 text-primary font-bold text-sm">
							<Sparkles className="size-4" />
							<span>Public Nominations Open!</span>
						</div>
						<p className="text-xs text-muted-foreground">
							Know an exceptional candidate? Submit a nominee for the{" "}
							<strong>{category.name}</strong> category.
						</p>
					</div>

					<PublicNominationModal
						eventId={eventId}
						category={category as any}
						orgSlug={orgSlug}
						eventSlug={eventSlug}
						trigger={
							<Button className="text-xs font-bold gap-1.5 shrink-0">
								<Trophy className="size-3.5" />
								<span>Submit Nomination</span>
							</Button>
						}
					/>
				</div>
			)}

			{/* Nominees Grid */}
			<NomineeGrid
				nominees={category.votingOptions || []}
				votePrice={category.votePrice || 0}
				eventId={eventId}
				categoryId={category.id}
				votingMode={votingMode}
				showTotalVotesPublicly={category.showTotalVotesPublicly ?? true}
				resultDisplayType={resultDisplayType}
				orgSlug={orgSlug}
				eventSlug={eventSlug}
			/>
		</div>
	);
}
