"use client";

import { useState } from "react";
import {
	Vote,
	User,
	Share2,
	Trophy,
	Sparkles,
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
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { shareNominee } from "@/lib/utils/share-utils";

interface VotingOption {
	id: string;
	optionText: string;
	nomineeCode?: string | null;
	imageUrl?: string | null;
	bio?: string | null;
	votes?: number;
}

interface NomineeGridProps {
	readonly nominees: VotingOption[];
	readonly votePrice: number;
	readonly eventId: string;
	readonly categoryId: string;
	readonly categoryName?: string;
	readonly votingMode?: string;
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
	orgSlug = "",
	eventSlug = "",
}: NomineeGridProps) {
	const [sheetOpen, setSheetOpen] = useState(false);
	const [voteModalOpen, setVoteModalOpen] = useState(false);
	const [selectedNominee, setSelectedNominee] = useState<VotingOption | null>(
		null,
	);

	const isFree = Number(votePrice) === 0;

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
			bio: nominee.bio,
			imageUrl: nominee.imageUrl,
			categoryName: categoryName,
		});
	};

	if (!nominees || nominees.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center p-12 text-center border rounded-2xl bg-card">
				<Trophy className="size-12 text-muted-foreground/40 mb-3" />
				<h4 className="text-lg font-bold">No Nominees Yet</h4>
				<p className="text-xs text-muted-foreground max-w-sm mt-1">
					Nominees have not been announced or approved for this category yet.
				</p>
			</div>
		);
	}

	return (
		<>
			<div className="grid grid-cols-1 @lg:grid-cols-2 @4xl:grid-cols-3 @6xl:grid-cols-4 gap-5">
				{nominees.concat(nominees).map((nominee) => {
					return (
						<div
							key={nominee.id}
							className="group relative flex flex-col justify-between rounded-2xl border border-transparent bg-card p-4 transition-all duration-300 hover:border-primary/50"
						>
							<div
								onClick={() => handleOpenSheet(nominee)}
								className="cursor-pointer space-y-3"
							>
								{/* Nominee Avatar */}
								<div className="relative aspect-4/5 w-full rounded-xl overflow-hidden bg-muted flex items-center justify-center border">
									{nominee.imageUrl ? (
										<img
											src={getEventImageUrl(nominee.imageUrl) || ""}
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

							{/* Actions */}
							<div className="pt-3 mt-3 border-t flex items-center justify-between gap-2">
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

							<div className="flex items-center gap-3 pt-4 border-t">
								<Button
									className="flex-1 font-bold gap-2"
									onClick={() => {
										setSheetOpen(false);
										setVoteModalOpen(true);
									}}
								>
									<Vote className="size-4" />
									<span>
										{votingMode === "internal"
											? "Cast Ballot"
											: isFree
												? "Vote Free"
												: `Vote (GHS ${votePrice.toFixed(2)})`}
									</span>
								</Button>
								<Button
									variant="outline"
									size="icon"
									className="size-10 shrink-0"
									onClick={(e) => handleShare(e, selectedNominee)}
									title="Share Nominee"
								>
									<Share2 className="size-4" />
								</Button>
							</div>
						</div>
					)}
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
				/>
			)}
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
	readonly orgSlug: string;
	readonly eventSlug: string;
}

export function PublicNomineeSheet({
	category,
	eventId,
	votingMode = "general",
	orgSlug,
	eventSlug,
}: PublicNomineeSheetProps) {
	return (
		<div className="space-y-8">
			{/* Public Nomination Banner */}
			{category.allowPublicNomination && (
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl border bg-card text-foreground">
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

			{/* Nominees Grid */}
			<NomineeGrid
				nominees={category.votingOptions || []}
				votePrice={category.votePrice || 0}
				eventId={eventId}
				categoryId={category.id}
				categoryName={category.name}
				votingMode={votingMode}
				orgSlug={orgSlug}
				eventSlug={eventSlug}
			/>
		</div>
	);
}
