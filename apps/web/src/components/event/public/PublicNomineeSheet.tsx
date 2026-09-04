"use client";

import { useState } from "react";
import { Vote, Share2, Sparkles, BarChart2, Hash, Users } from "lucide-react";
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
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { shareNominee } from "@/lib/utils/share-utils";
import { NoNomineeIllustration } from "@/components/common/NoNomineeIllustration";
import { extractCategoryPrefix } from "@/lib/utils/nominee-code";

interface VotingOption {
	id: string;
	optionText: string;
	nomineeCode?: string | null;
	imageUrl?: string | null;
	bio?: string | null;
	description?: string | null;
	votes?: number;
	votesCount?: number | bigint;
}

function stripHtml(html?: string | null): string {
	if (!html) return "";
	return html.replace(/<[^>]*>?/gm, "").trim();
}

interface NomineeGridProps {
	readonly nominees: VotingOption[];
	readonly votePrice: number;
	readonly eventId: string;
	readonly categoryId: string;
	readonly categoryName?: string;
	readonly votingMode?: string;
	readonly isEnded?: boolean;
	readonly showTotalVotesPublicly?: boolean;
	readonly templateConfig?: {
		resultDisplayType?: "percentage" | "count";
		[key: string]: any;
	} | null;
	readonly brandVars?: React.CSSProperties;
	readonly orgSlug?: string;
	readonly eventSlug?: string;
}

export function NomineeGrid({
	nominees,
	votePrice,
	eventId,
	categoryId,
	categoryName = "",
	votingMode = "general",
	isEnded = false,
	showTotalVotesPublicly = true,
	templateConfig,
	brandVars,
	orgSlug = "",
	eventSlug = "",
}: NomineeGridProps) {
	const [sheetOpen, setSheetOpen] = useState(false);
	const [voteModalOpen, setVoteModalOpen] = useState(false);
	const [selectedNominee, setSelectedNominee] = useState<VotingOption | null>(
		null,
	);

	const isFree = Number(votePrice) === 0;

	// Calculate total votes across all nominees in this category
	const totalCategoryVotes = nominees.reduce((acc, n) => {
		const count = Number(n.votesCount ?? n.votes ?? 0);
		return acc + (Number.isFinite(count) ? count : 0);
	}, 0);

	const resultDisplayType =
		templateConfig?.resultDisplayType === "count" ? "count" : "percentage";

	const handleOpenVoteModal = (nominee: VotingOption) => {
		setSelectedNominee(nominee);
		setVoteModalOpen(true);
	};

	const handleOpenSheet = (nominee: VotingOption) => {
		setSelectedNominee(nominee);
		setSheetOpen(true);
	};

	const handleShare = async (e: React.MouseEvent, nominee: VotingOption) => {
		e.stopPropagation();
		await shareNominee({
			optionText: nominee.optionText,
			nomineeCode: nominee.nomineeCode,
			bio: nominee.description || nominee.bio,
			imageUrl: nominee.imageUrl,
			categoryName: categoryName,
		});
	};

	if (!nominees || nominees.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-card">
				<NoNomineeIllustration className="w-48 h-auto mb-4 opacity-85" />
				<h4 className="text-xl font-bold uppercase tracking-tight mb-1">No Nominees Yet</h4>
				<p className="text-xs text-muted-foreground max-w-sm mt-1">
					Nominees have not been announced or approved for this category yet. Check back soon!
				</p>
			</div>
		);
	}

	return (
		<div className="@container">
			<div className="grid grid-cols-1 @lg:grid-cols-2 @2xl:grid-cols-3 @6xl:grid-cols-4 gap-5">
				{nominees.concat().map((nominee, index) => {
					const nomineeVotes = Number(nominee.votesCount ?? nominee.votes ?? 0);
					const votePercentage =
						totalCategoryVotes > 0
							? (nomineeVotes / totalCategoryVotes) * 100
							: 0;

					return (
						<div
							key={`${nominee.id}-${index}`}
							onClick={() => handleOpenSheet(nominee)}
							className="group relative flex flex-col justify-between h-full gap-2.5 rounded-2xl bg-card p-2.5 transition-all duration-300 hover:shadow-md cursor-pointer"
						>
							<div className="space-y-2.5 flex-1 flex flex-col">
								{/* Nominee Avatar / Poster */}
								<div className="relative aspect-4/5 w-full rounded-xl overflow-hidden bg-muted flex items-center justify-center shadow-none shrink-0">
									{nominee.imageUrl ? (
										<img
											src={getEventImageUrl(nominee.imageUrl) || ""}
											alt={nominee.optionText}
											className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
										/>
									) : (
										<div className="size-full flex flex-col items-center justify-center bg-muted/50 text-muted-foreground p-4 text-center">
											<NoNomineeIllustration className="w-full h-full p-4 object-contain opacity-75" />
										</div>
									)}

									<div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-200" />

									{/* Top-Left Code Badge (mirrors EventCard top-left badge) */}
									<div className="absolute top-2.5 left-2.5 bg-background/95 backdrop-blur-md rounded-md py-1 px-2.5 flex flex-col items-center justify-center min-w-[48px] border border-border/80 shadow-none z-10">
										<span className="text-[9px] font-bold uppercase text-muted-foreground tracking-wider">
											CODE
										</span>
										<span className="text-sm font-bold font-mono text-primary leading-none mt-0.5">
											{nominee.nomineeCode || `${extractCategoryPrefix(categoryName)}${String(index + 1).padStart(2, "0")}`}
										</span>
									</div>

									{/* Real-Time Live Standings Badge on Image (if enabled) */}
									{showTotalVotesPublicly && (
										<div className="absolute bottom-2.5 left-2.5 rounded-md bg-background/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold border border-border/70 flex items-center gap-1 shadow-xs text-foreground z-10">
											<BarChart2 className="size-3 text-primary" />
											<span>
												{resultDisplayType === "count"
													? `${nomineeVotes.toLocaleString()} votes`
													: `${votePercentage.toFixed(1)}%`}
											</span>
										</div>
									)}
								</div>

								{/* Nominee Meta */}
								<div className="flex flex-col gap-1 px-0.5">
									<h4 className="font-bold text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors">
										{nominee.optionText}
									</h4>
									{(nominee.description || nominee.bio) && (
										<p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
											{stripHtml(nominee.description || nominee.bio)}
										</p>
									)}
								</div>
							</div>

							{/* Actions */}
							<div className="pt-2 mt-auto border-t border-border/50 flex items-center justify-between gap-2">
								<Button
									variant="ghost"
									size="icon"
									className="size-8 rounded-full shrink-0"
									onClick={(e) => handleShare(e, nominee)}
									title="Share Nominee"
								>
									<Share2 className="size-3.5 text-muted-foreground" />
								</Button>

								<Button
									size="sm"
									onClick={(e) => {
										e.stopPropagation();
										handleOpenVoteModal(nominee);
									}}
									className="text-xs font-bold gap-1.5 h-8 flex-1"
									disabled={isEnded}
								>
									<Vote className="size-3.5" />
									<span>
										{isEnded
											? "Voting Closed"
											: votingMode === "internal"
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

			{/* Nominee Profile Quick-View Sheet / Drawer */}
			<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
				<SheetContent
					className="sm:max-w-md p-6 overflow-y-auto flex flex-col justify-between"
					style={brandVars}
				>
					{selectedNominee && (() => {
						const selectedVotes = Number(
							selectedNominee.votesCount ?? selectedNominee.votes ?? 0,
						);
						const selectedPct =
							totalCategoryVotes > 0
								? (selectedVotes / totalCategoryVotes) * 100
								: 0;

						return (
							<div className="space-y-6 flex-1 flex flex-col">
								<SheetHeader className="text-left space-y-1">
									<SheetTitle className="text-2xl font-black uppercase tracking-tight">
										{selectedNominee.optionText}
									</SheetTitle>
									{selectedNominee.nomineeCode && (
										<div className="flex items-center gap-1.5 text-xs font-mono font-bold text-primary">
											<Hash className="size-3.5" />
											<span>{selectedNominee.nomineeCode}</span>
										</div>
									)}
								</SheetHeader>

								<div className="relative aspect-4/5 w-full rounded-2xl overflow-hidden bg-muted border border-border/60 shadow-sm flex items-center justify-center shrink-0">
									{selectedNominee.imageUrl ? (
										<img
											src={getEventImageUrl(selectedNominee.imageUrl) || ""}
											alt={selectedNominee.optionText}
											className="size-full object-cover"
										/>
									) : (
										<div className="size-full flex flex-col items-center justify-center bg-muted/50 text-muted-foreground p-6 text-center">
											<NoNomineeIllustration className="w-full h-full p-6 object-contain opacity-75" />
										</div>
									)}

									{/* Real-Time Live Standings Badge on Sheet Image */}
									{showTotalVotesPublicly && (
										<div className="absolute bottom-3 left-3 rounded-md bg-background/90 backdrop-blur-md px-3 py-1.5 text-xs font-bold border border-border/60 flex items-center gap-1.5 shadow-md text-foreground">
											<BarChart2 className="size-3.5 text-primary" />
											<span>
												{resultDisplayType === "count"
													? `${selectedVotes.toLocaleString()} votes`
													: `${selectedPct.toFixed(1)}%`}
											</span>
										</div>
									)}
								</div>

								{/* Why Vote For Me / Description */}
								<div className="space-y-2 rounded-xl p-4 bg-muted/40 border border-border/60">
									<h5 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
										<Sparkles className="size-3.5 text-primary" />
										<span>Why Vote For Me</span>
									</h5>
									{(selectedNominee.description || selectedNominee.bio) ? (
										<RichTextDisplay
											content={selectedNominee.description || selectedNominee.bio || ""}
											className="text-xs text-muted-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none"
										/>
									) : (
										<p className="text-xs text-muted-foreground italic">
											No statement provided by nominee.
										</p>
									)}
								</div>

								<div className="flex items-center gap-3 pt-4 border-t border-border/80 mt-auto shrink-0">
									<Button
										className="flex-1 font-bold gap-2 h-11"
										disabled={isEnded}
										onClick={() => {
											setSheetOpen(false);
											setVoteModalOpen(true);
										}}
									>
										<Vote className="size-4" />
										<span>
											{isEnded
												? "Voting Closed"
												: votingMode === "internal"
													? "Cast Ballot"
													: isFree
														? "Vote Free"
														: `Vote for ${selectedNominee.optionText} (GHS ${votePrice.toFixed(2)})`}
										</span>
									</Button>
									<Button
										variant="outline"
										size="icon"
										className="size-11 shrink-0"
										onClick={(e) => handleShare(e, selectedNominee)}
										title="Share Nominee"
									>
										<Share2 className="size-4" />
									</Button>
								</div>
							</div>
						);
					})()}
				</SheetContent>
			</Sheet>

			{/* Public Vote Modal */}
			{selectedNominee && (
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
					brandVars={brandVars}
				/>
			)}
		</div>
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
	readonly isEnded?: boolean;
	readonly votingMode?: string;
	readonly brandVars?: React.CSSProperties;
	readonly orgSlug: string;
	readonly eventSlug: string;
}

export function PublicNomineeSheet({
	category,
	eventId,
	isEnded = false,
	votingMode = "general",
	brandVars,
	orgSlug,
	eventSlug,
}: PublicNomineeSheetProps) {
	return (
		<div className="space-y-8 @container">
			{/* Public Nomination Banner */}
			{category.allowPublicNomination && !isEnded && (
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-lg bg-card text-foreground">
					<div className="space-y-1 text-center sm:text-left">
						<h4 className="font-black text-sm uppercase tracking-tight flex items-center justify-center sm:justify-start gap-2">
							<Sparkles className="size-4 text-primary" />
							<span>Nominate a Candidate</span>
						</h4>
						<p className="text-xs text-muted-foreground max-w-xl">
							Have an exceptional nominee in mind for {category.name}? Submit a
							nomination now to be approved by event organizers.
						</p>
					</div>

					<PublicNominationModal
						category={{
							id: category.id,
							name: category.name,
							description: category.description ?? null,
							nominationPrice: Number(category.nominationPrice || 0),
							votePrice: Number(category.votePrice || 0),
							eventId: eventId,
							allowMultiple: category.allowMultiple ?? false,
							allowPublicNomination: category.allowPublicNomination ?? true,
							showTotalVotesPublicly: category.showTotalVotesPublicly ?? true,
							orderIdx: 0,
							templateConfig: category.templateConfig ?? null,
							templateImage: null,
							votingOptions: [],
						}}
						eventId={eventId}
						brandVars={brandVars}
						orgSlug={orgSlug}
						eventSlug={eventSlug}
						trigger={
							<Button className="shrink-0 text-xs font-bold uppercase tracking-wider">
								Nominate Candidate
							</Button>
						}
					/>
				</div>
			)}

			{/* Nominees Grid with Live Standings */}
			<NomineeGrid
				nominees={category.votingOptions || []}
				votePrice={category.votePrice || 0}
				eventId={eventId}
				categoryId={category.id}
				categoryName={category.name}
				votingMode={votingMode}
				isEnded={isEnded}
				showTotalVotesPublicly={category.showTotalVotesPublicly ?? true}
				templateConfig={category.templateConfig}
				brandVars={brandVars}
				orgSlug={orgSlug}
				eventSlug={eventSlug}
			/>
		</div>
	);
}
