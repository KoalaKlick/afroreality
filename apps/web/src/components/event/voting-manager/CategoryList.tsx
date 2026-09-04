"use client";
// src/components/event/voting-manager/CategoryList.tsx
import { useState, useTransition, useMemo } from "react";
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
import {
	deleteVotingOption,
	requestNomineeChange,
	approveNomination,
	rejectNomination,
	resendNominationEmail,
} from "@/lib/server-functions/voting-options";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { NoCategoryIllustration } from "@/components/common/NoCategoryIllustration";
import { NoNomineeIllustration } from "@/components/common/NoNomineeIllustration";
import { AnimatedDeleteDialog } from "@/components/common/AnimatedDeleteDialog";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { Card } from "@/components/ui/card";
import { getErrorMessage, formatAmount, cn } from "@/lib/utils";
import { NomineeCard } from "../nomination/NomineeCard";

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
	const [resendingOptionId, setResendingOptionId] = useState<string | null>(null);

	// Extract all public nominations across all categories (excluding admin-created nominees)
	const allPublicNominations = useMemo(() => {
		const list: NominationOption[] = [];
		for (const cat of categories) {
			for (const opt of cat.votingOptions) {
				if (opt.isPublicNomination) {
					list.push({
						...opt,
						categoryId: cat.id,
						categoryName: cat.name,
					} as unknown as NominationOption);
				}
			}
		}
		return list;
	}, [categories]);

	const totalEventPendingCount = allPublicNominations.filter(
		(o) => o.status === "pending"
	).length;

	function handleOpenAllNominations() {
		setIsNominationSheetOpen(true);
	}

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

	async function handleResendCode(option: any) {
		if (!option?.id) return;
		setResendingOptionId(option.id);
		toast.loading("Resending nomination confirmation email...");
		try {
			const res = await resendNominationEmail({ data: { optionId: option.id } });
			toast.dismiss();
			if (res.success) {
				toast.success("Confirmation email resent successfully!");
			} else {
				toast.error(res.error || "Failed to resend confirmation email");
			}
		} catch (err: any) {
			toast.dismiss();
			toast.error(getErrorMessage(err) || "Failed to resend confirmation email");
		} finally {
			setResendingOptionId(null);
		}
	}

	function handleDeleteCategory() {
		if (!catToDelete) return;
		const totalVotes =
			catToDelete.votingOptions?.reduce(
				(sum, o) => sum + Number(o.votesCount || 0),
				0,
			) || 0;
		if (totalVotes > 0) {
			toast.error(
				`Cannot delete "${catToDelete.name}" because it has ${totalVotes.toLocaleString()} recorded vote${totalVotes > 1 ? "s" : ""}. Categories with votes cannot be deleted.`,
			);
			setCatToDelete(null);
			return;
		}

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

	function handleDeleteOption(optionId?: string) {
		const targetId = optionId || optionToDelete?.id;
		if (!targetId) return;

		const targetOpt = categories
			.flatMap((c) => c.votingOptions)
			.find((o) => o.id === targetId);
		if (targetOpt && Number(targetOpt.votesCount || 0) > 0) {
			toast.error(
				`Cannot delete "${targetOpt.optionText}" because they already have ${Number(targetOpt.votesCount).toLocaleString()} recorded vote${Number(targetOpt.votesCount) > 1 ? "s" : ""}.`,
			);
			setOptionToDelete(null);
			return;
		}

		startTransition(async () => {
			try {
				const res = await requestNomineeChange({
					data: {
						optionId: targetId,
						requestType: "DELETE",
					},
				});
				toast.success(res.message || "Deletion request sent to nominee for approval.");
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
					<div className="flex items-center gap-2">
						{allPublicNominations.length > 0 && (
							<Button
								variant="outline"
								size="sm"
								className="gap-1.5 font-semibold text-xs relative"
								onClick={handleOpenAllNominations}
							>
								<Inbox className="size-3.5 text-primary" />
								<span>Nomination Requests</span>
								{totalEventPendingCount > 0 && (
									<Badge className="bg-yellow-500 hover:bg-yellow-600 text-white text-[10px] h-4 px-1.5 font-mono">
										{totalEventPendingCount}
									</Badge>
								)}
							</Button>
						)}
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
					</div>
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
										{(() => {
											const catTotalVotes = cat.votingOptions.reduce(
												(sum, o) => sum + Number(o.votesCount || 0),
												0,
											);
											return (
												<Button
													size="icon"
													variant="ghost"
													onClick={() => {
														if (catTotalVotes > 0) {
															toast.error(
																`Cannot delete category "${cat.name}" because it already has ${catTotalVotes.toLocaleString()} recorded vote${catTotalVotes > 1 ? "s" : ""}. Categories with votes cannot be removed to preserve contest integrity.`,
															);
															return;
														}
														setCatToDelete(cat);
													}}
													className={cn(
														"size-8 text-destructive hover:bg-destructive/10",
														catTotalVotes > 0 &&
															"opacity-40 cursor-not-allowed hover:bg-transparent text-muted-foreground",
													)}
													title={
														catTotalVotes > 0
															? `Cannot delete category with ${catTotalVotes.toLocaleString()} recorded vote${catTotalVotes > 1 ? "s" : ""}`
															: "Delete Category"
													}
												>
													<Trash2 className="size-4" />
												</Button>
											);
										})()}
									</div>
								)}
							</div>

							{/* Category Options / Nominees Grid */}
							{(() => {
								const approvedNominees = cat.votingOptions.filter(
									(o) => o.status === "approved" || (!o.status && !(o as any).isPublicNomination)
								);
								const pendingCount = cat.votingOptions.filter(
									(o) => o.isPublicNomination && o.status === "pending"
								).length;

								return (
									<div className="p-4 sm:p-5">
										{approvedNominees.length === 0 ? (
											<div className="flex flex-col items-center justify-center py-8 text-center rounded-xl border border-dashed bg-muted/5">
												<NoNomineeIllustration className="w-36 h-auto mb-3 opacity-80" />
												<h5 className="font-semibold text-sm">
													{pendingCount > 0 ? "Nominees Pending Review" : "No nominees yet"}
												</h5>
												<p className="text-xs text-muted-foreground mt-0.5 mb-3 max-w-xs">
													{pendingCount > 0
														? `You have ${pendingCount} public nomination request${pendingCount > 1 ? "s" : ""} waiting for review.`
														: "Add candidates to this category to start voting."}
												</p>
												{canEdit && (
													<div className="flex items-center gap-2">
														<Button
															size="sm"
															variant="outline"
															onClick={() => handleAddOption(cat)}
															className="gap-1.5"
														>
															<Plus className="size-3.5" />
															Add Nominee
														</Button>
													</div>
												)}
											</div>
										) : (
											<div className="@container">
												<div className="grid grid-cols-1 @xs:grid-cols-2 @md:grid-cols-3 @2xl:grid-cols-4 @4xl:grid-cols-5 @6xl:grid-cols-6 gap-3.5">
													{approvedNominees.map((opt) => (
														<NomineeCard
															key={opt.id}
															option={opt as any}
															displayImage={opt.imageUrl ?? null}
															canEdit={canEdit}
															isPending={isDeleting}
															isResending={resendingOptionId === opt.id}
															requiresDeletionCode={false}
															onEdit={() => handleEditOption(cat, opt)}
															onResendCode={() => handleResendCode(opt)}
															onDelete={() => {
																const votesCount = Number(opt.votesCount || 0);
																if (votesCount > 0) {
																	toast.error(
																		`Cannot delete "${opt.optionText}" because they already have ${votesCount.toLocaleString()} recorded vote${votesCount > 1 ? "s" : ""}. Nominees with votes cannot be removed.`
																	);
																	return;
																}
																setOptionToDelete(opt);
															}}
														/>
													))}
												</div>
											</div>
										)}
									</div>
								);
							})()}
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
			<NominationRequestsSheet
				open={isNominationSheetOpen}
				onOpenChange={setIsNominationSheetOpen}
				options={allPublicNominations}
				categories={categories.map((c) => ({ id: c.id, name: c.name }))}
				onRefresh={() => {
					onRefresh?.();
				}}
			/>
		</div>
	);
}
