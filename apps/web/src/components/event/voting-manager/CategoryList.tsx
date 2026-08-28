"use client";
// src/components/event/voting-manager/CategoryList.tsx
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Plus,
	Pencil,
	Trash2,
	User,
	Inbox,
	Check,
	X,
} from "lucide-react";
import { toast } from "sonner";
import { CategorySheet, type CategoryItem } from "./CategorySheet";
import { OptionSheet, type OptionItem } from "./OptionSheet";
import { NominationRequestsSheet, type NominationOption } from "./NominationRequestsSheet";
import { deleteVotingCategory } from "@/lib/server-functions/voting";
import { deleteVotingOption, approveNomination, rejectNomination } from "@/lib/server-functions/voting-options";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { NoCategoryIllustration } from "@/components/common/NoCategoryIllustration";
import { NoNomineeIllustration } from "@/components/common/NoNomineeIllustration";
import { AnimatedDeleteDialog } from "@/components/common/AnimatedDeleteDialog";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { Card } from "@/components/ui/card";
import { getErrorMessage, formatAmount } from "@/lib/utils";

const statusBadgeStyles: Record<string, string> = {
	pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
	approved: "bg-green-100 text-green-800 border-green-300",
	rejected: "bg-red-100 text-red-800 border-red-300",
};

interface CategoryListProps {
	readonly eventId: string;
	readonly categories: CategoryItem[];
	readonly votingMode?: string | null;
	readonly onRefresh?: () => void;
	readonly canEdit?: boolean;
	readonly isSheetOpen?: boolean;
	readonly onSheetOpenChange?: (open: boolean) => void;
}

export function CategoryList({
	eventId,
	categories,
	votingMode,
	onRefresh,
	canEdit = true,
	isSheetOpen,
	onSheetOpenChange,
}: CategoryListProps) {
	const [editingCat, setEditingCat] = useState<CategoryItem | null>(null);
	const [catToDelete, setCatToDelete] = useState<CategoryItem | null>(null);

	const [isOptSheetOpen, setIsOptSheetOpen] = useState(false);
	const [activeCategoryForOption, setActiveCategoryForOption] =
		useState<CategoryItem | null>(null);
	const [editingOption, setEditingOption] = useState<OptionItem | null>(null);
	const [optionToDelete, setOptionToDelete] = useState<OptionItem | null>(null);
	const [isDeleting, startTransition] = useTransition();

	const [isNominationSheetOpen, setIsNominationSheetOpen] = useState(false);
	const [activeCategoryForNominations, setActiveCategoryForNominations] =
		useState<CategoryItem | null>(null);

	function handleEditCategory(cat: CategoryItem) {
		setEditingCat(cat);
		onSheetOpenChange?.(true);
	}

	function handleAddOption(cat: CategoryItem) {
		setActiveCategoryForOption(cat);
		setEditingOption(null);
		setIsOptSheetOpen(true);
	}

	function handleEditOption(cat: CategoryItem, opt: any) {
		setActiveCategoryForOption(cat);
		setEditingOption(opt);
		setIsOptSheetOpen(true);
	}

	function handleOpenNominations(cat: CategoryItem) {
		setActiveCategoryForNominations(cat);
		setIsNominationSheetOpen(true);
	}

	function handleApproveOption(optionId: string) {
		startTransition(async () => {
			try {
				await approveNomination({ data: { optionId } });
				toast.success("Nomination approved");
				if (onRefresh) onRefresh();
			} catch (err) {
				toast.error(getErrorMessage(err));
			}
		});
	}

	function handleRejectOption(optionId: string) {
		startTransition(async () => {
			try {
				await rejectNomination({ data: { optionId } });
				toast.success("Nomination rejected");
				if (onRefresh) onRefresh();
			} catch (err) {
				toast.error(getErrorMessage(err));
			}
		});
	}

	function handleDeleteCategory() {
		if (!catToDelete) return;
		startTransition(async () => {
			try {
				await deleteVotingCategory({ data: { id: catToDelete.id } });
				toast.success("Category deleted");
				setCatToDelete(null);
				if (onRefresh) onRefresh();
			} catch (err) {
				toast.error(getErrorMessage(err));
			}
		});
	}

	function handleDeleteOption() {
		if (!optionToDelete) return;
		startTransition(async () => {
			try {
				await deleteVotingOption({ data: { id: optionToDelete.id } });
				toast.success("Nominee deleted");
				setOptionToDelete(null);
				if (onRefresh) onRefresh();
			} catch (err) {
				toast.error(getErrorMessage(err));
			}
		});
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div>
					<h3 className="text-lg font-bold text-foreground">
						Voting Categories &amp; Nominees
					</h3>
					<p className="text-xs text-muted-foreground">
						{categories.length} {categories.length === 1 ? "category" : "categories"} configured
						{votingMode === "internal" ? " · Internal membership voting" : " · General voting"}
					</p>
				</div>
				{canEdit && (
					<Button
						onClick={() => {
							setEditingCat(null);
							onSheetOpenChange?.(true);
						}}
						size="sm"
						className="gap-1.5 font-semibold text-xs"
					>
						<Plus className="size-3.5" />
						Add Category
					</Button>
				)}
			</div>

			{categories.length === 0 ? (
				<Card className="p-8 text-center border-dashed">
					<NoCategoryIllustration className="w-48 h-auto mx-auto mb-4 opacity-80" />
					<h4 className="font-semibold text-base">No voting categories yet</h4>
					<p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm mx-auto">
						Create categories for people to vote on. For example: "Best Artist",
						"Member of the Year".
					</p>
					{canEdit && (
						<Button
							onClick={() => {
								setEditingCat(null);
								onSheetOpenChange?.(true);
							}}
							className="gap-1.5"
						>
							<Plus className="size-4" />
							Create First Category
						</Button>
					)}
				</Card>
			) : (
				<div className="space-y-4">
					{categories.map((cat) => (
						<div
							key={cat.id}
							className="border rounded-xl bg-card overflow-hidden"
						>
							{/* Category Header */}
							<div className="p-4 sm:p-5 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
								<div className="flex items-center gap-3">
									{cat.templateImage && (
										<img
											src={getEventImageUrl(cat.templateImage) ?? ""}
											alt=""
											className="size-10 rounded-lg object-cover border shrink-0"
										/>
									)}
									<div>
										<div className="flex items-center gap-2">
											<h4 className="font-bold text-base">{cat.name}</h4>
											{votingMode !== "internal" && (
												<Badge variant="outline" className="text-[10px]">
													{cat.votePrice && cat.votePrice > 0
														? `GHS ${formatAmount(cat.votePrice)} / vote`
														: "Free Voting"}
												</Badge>
											)}
										</div>
										{cat.description && (
											<RichTextDisplay
												content={cat.description}
												className="text-xs text-muted-foreground line-clamp-1 prose-xs"
											/>
										)}
									</div>
								</div>

								{canEdit && (
									<div className="flex items-center gap-2">
										{cat.allowPublicNomination && (
											<Button
												size="sm"
												variant="outline"
												onClick={() => handleOpenNominations(cat)}
												className="gap-1.5"
											>
												<Inbox className="size-3.5" />
												Requests
												{cat.votingOptions.filter((o) => o.status === "pending").length > 0 && (
													<Badge
														variant="secondary"
														className="bg-yellow-500 text-white text-[10px] h-4 px-1"
													>
														{cat.votingOptions.filter((o) => o.status === "pending").length}
													</Badge>
												)}
											</Button>
										)}
										<Button
											size="sm"
											variant="outline"
											onClick={() => handleAddOption(cat)}
										>
											<Plus className="size-3.5 mr-1.5" />
											Add Nominee
										</Button>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => handleEditCategory(cat)}
										>
											<Pencil className="size-3.5" />
										</Button>
										<Button
											size="icon"
											variant="ghost"
											onClick={() => setCatToDelete(cat)}
											className="size-8 text-destructive hover:bg-destructive/10"
										>
											<Trash2 className="size-4" />
										</Button>
									</div>
								)}
							</div>

							{/* Category Options / Nominees Grid */}
							<div className="p-4 sm:p-5">
								{cat.votingOptions.length === 0 ? (
									<div className="flex flex-col items-center justify-center py-8 text-center rounded-xl border border-dashed bg-muted/5">
										<NoNomineeIllustration className="w-36 h-auto mb-3 opacity-80" />
										<h5 className="font-semibold text-sm">No nominees yet</h5>
										<p className="text-xs text-muted-foreground mt-0.5 mb-3 max-w-xs">
											Add candidates to this category to start voting.
										</p>
										{canEdit && (
											<Button
												size="sm"
												variant="outline"
												onClick={() => handleAddOption(cat)}
												className="gap-1.5"
											>
												<Plus className="size-3.5" />
												Add First Nominee
											</Button>
										)}
									</div>
								) : (
									<div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
										{cat.votingOptions.map((opt) => (
											<div
												key={opt.id}
												className={`p-3 rounded-lg border bg-background flex items-center gap-3 relative group ${
													opt.status === "pending"
														? "border-yellow-300 bg-yellow-50/30"
														: opt.status === "rejected"
															? "border-red-300 bg-red-50/30 opacity-75"
															: ""
												}`}
											>
												{opt.imageUrl ? (
													<img
														src={getEventImageUrl(opt.imageUrl) ?? ""}
														alt={opt.optionText}
														className="size-12 rounded-lg object-cover shrink-0"
													/>
												) : (
													<div className="size-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
														<User className="size-5 text-muted-foreground" />
													</div>
												)}

												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-1.5">
														<p className="font-semibold text-sm truncate">
															{opt.optionText}
														</p>
														{opt.status && opt.status !== "approved" && (
															<Badge
																variant="outline"
																className={`text-[10px] px-1 py-0 capitalize ${
																	statusBadgeStyles[opt.status]
																}`}
															>
																{opt.status}
															</Badge>
														)}
													</div>
													{opt.nomineeCode && (
														<p className="text-[10px] font-mono text-muted-foreground uppercase">
															Code: {opt.nomineeCode}
														</p>
													)}
													<p className="text-xs font-bold text-primary mt-0.5">
														{Number(opt.votesCount || 0).toLocaleString()} votes
													</p>
												</div>

												{canEdit && (
													<div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
														{opt.status === "pending" && (
															<>
																<button
																	type="button"
																	onClick={() => handleApproveOption(opt.id)}
																	className="p-1 hover:bg-green-100 rounded text-green-600"
																	title="Approve"
																>
																	<Check className="size-3.5" />
																</button>
																<button
																	type="button"
																	onClick={() => handleRejectOption(opt.id)}
																	className="p-1 hover:bg-red-100 rounded text-red-600"
																	title="Reject"
																>
																	<X className="size-3.5" />
																</button>
															</>
														)}
														<button
															type="button"
															onClick={() => handleEditOption(cat, opt)}
															className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
														>
															<Pencil className="size-3.5" />
														</button>
														<button
															type="button"
															onClick={() => setOptionToDelete(opt)}
															className="p-1 hover:bg-destructive/10 rounded text-destructive"
														>
															<Trash2 className="size-3.5" />
														</button>
													</div>
												)}
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			)}

			<CategorySheet
				eventId={eventId}
				open={isSheetOpen ?? false}
				onOpenChange={onSheetOpenChange ?? (() => {})}
				editingCategory={editingCat}
				votingMode={votingMode}
				onSaved={() => {
					onRefresh?.();
				}}
			/>

			{activeCategoryForOption && (
				<OptionSheet
					eventId={eventId}
					categoryId={activeCategoryForOption.id}
					categoryName={activeCategoryForOption.name}
					open={isOptSheetOpen}
					onOpenChange={setIsOptSheetOpen}
					editingOption={editingOption}
					onSaved={onRefresh}
				/>
			)}

			{/* Delete Category Confirmation */}
			<AnimatedDeleteDialog
				isOpen={!!catToDelete}
				isDeleting={isDeleting}
				onOpenChange={(open) => !open && !isDeleting && setCatToDelete(null)}
				onConfirm={handleDeleteCategory}
				title="Delete Category"
				itemName={catToDelete?.name ?? "this category"}
				itemType="Category"
				description={`This will delete "${catToDelete?.name}" and all its nominees and recorded votes. This action cannot be undone.`}
			/>

			{/* Delete Option / Nominee Confirmation */}
			<AnimatedDeleteDialog
				isOpen={!!optionToDelete}
				isDeleting={isDeleting}
				onOpenChange={(open) => !open && !isDeleting && setOptionToDelete(null)}
				onConfirm={handleDeleteOption}
				title="Delete Nominee"
				itemName={optionToDelete?.optionText ?? "this nominee"}
				itemType="Nominee"
				description={`This will permanently remove "${optionToDelete?.optionText}" from the category.`}
			/>

			{/* Nomination Requests Sheet */}
			{activeCategoryForNominations && (
				<NominationRequestsSheet
					open={isNominationSheetOpen}
					onOpenChange={setIsNominationSheetOpen}
					pendingOptions={activeCategoryForNominations.votingOptions.filter(
						(o) => o.status === "pending" || o.status === "approved" || o.status === "rejected"
					) as unknown as NominationOption[]}
					onRefresh={() => {
						onRefresh?.();
					}}
				/>
			)}
		</div>
	);
}
