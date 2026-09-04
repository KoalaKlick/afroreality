"use client";
// src/components/event/voting-manager/CategorySheet.tsx
import { useState, useTransition, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Switch } from "@/components/ui/switch";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, X, Info, Lock, Percent, Hash } from "lucide-react";
import AddFilesIcon from "@/assets/add-files.svg";
import { toast } from "sonner";
import {
	createVotingCategory,
	updateVotingCategory,
} from "@/lib/server-functions/voting";
import { useImageUpload } from "@/hooks/use-image-upload";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { getErrorMessage, cn } from "@/lib/utils";
import { MIN_VOTE_PRICE, DEFAULT_VOTE_PRICE } from "@/lib/constants/pricing";

export interface CategoryItem {
	id: string;
	eventId: string;
	name: string;
	description?: string | null;
	votePrice?: number;
	nominationPrice?: number;
	allowPublicNomination?: boolean;
	requireApproval?: boolean;
	showTotalVotesPublicly?: boolean;
	showFinalImage?: boolean;
	templateImage?: string | null;
	templateConfig?: any;
	nominationDeadline?: string | Date | null;
	votingOptions: {
		id: string;
		categoryId: string;
		optionText: string;
		nomineeCode?: string | null;
		description?: string | null;
		imageUrl?: string | null;
		votesCount: number | bigint;
		status?: string | null;
		isPublicNomination?: boolean;
		email?: string | null;
		nominatedByName?: string | null;
		nominatedByEmail?: string | null;
		deletionCode?: string | null;
		createdAt?: string | Date;
	}[];
}

interface CategorySheetProps {
	readonly eventId: string;
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly editingCategory: CategoryItem | null;
	readonly votingMode?: string | null;
	readonly onSaved?: () => void;
}

export function CategorySheet({
	eventId,
	open,
	onOpenChange,
	editingCategory,
	votingMode = "general",
	onSaved,
}: CategorySheetProps) {
	const isInternal = votingMode === "internal";
	const [isPending, startTransition] = useTransition();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const { isUploading, upload } = useImageUpload({
		folder: "events",
		convertOptions: {
			quality: 0.85,
			maxWidth: 1200,
			maxHeight: 1200,
			maxSizeMB: 2,
		},
	});

	const [formData, setFormData] = useState({
		name: "",
		description: "",
		templateImage: "" as string | null,
		votePrice: isInternal ? 0 : DEFAULT_VOTE_PRICE,
		nominationPrice: 0,
		maxVotesPerUser: isInternal ? 1 : 10,
		allowPublicNomination: false,
		requireApproval: true,
		showTotalVotesPublicly: true,
		resultDisplayType: "percentage" as "percentage" | "count",
		showFinalImage: true,
		nominationDeadline: "",
	});

	useEffect(() => {
		if (editingCategory) {
			let deadlineStr = "";
			if (editingCategory.nominationDeadline) {
				deadlineStr =
					typeof editingCategory.nominationDeadline === "string"
						? editingCategory.nominationDeadline.slice(0, 16)
						: new Date(editingCategory.nominationDeadline)
								.toISOString()
								.slice(0, 16);
			}

			const displayType =
				editingCategory.templateConfig?.resultDisplayType === "count"
					? "count"
					: "percentage";

			setFormData({
				name: editingCategory.name,
				description: editingCategory.description ?? "",
				templateImage: editingCategory.templateImage ?? null,
				votePrice: isInternal ? 0 : Number(editingCategory.votePrice ?? 0),
				nominationPrice: isInternal
					? 0
					: Number(editingCategory.nominationPrice ?? 0),
				maxVotesPerUser: isInternal ? 1 : 10,
				allowPublicNomination: editingCategory.allowPublicNomination ?? false,
				requireApproval: editingCategory.requireApproval ?? true,
				showTotalVotesPublicly:
					editingCategory.showTotalVotesPublicly ?? true,
				resultDisplayType: displayType,
				showFinalImage: editingCategory.showFinalImage ?? true,
				nominationDeadline: deadlineStr,
			});
		} else {
			setFormData({
				name: "",
				description: "",
				templateImage: null,
				votePrice: isInternal ? 0 : DEFAULT_VOTE_PRICE,
				nominationPrice: 0,
				maxVotesPerUser: isInternal ? 1 : 10,
				allowPublicNomination: false,
				requireApproval: true,
				showTotalVotesPublicly: true,
				resultDisplayType: "percentage",
				showFinalImage: true,
				nominationDeadline: "",
			});
		}
	}, [editingCategory, open, isInternal]);

	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const res = await upload(file);
			if (res?.url) {
				setFormData((prev) => ({ ...prev, templateImage: res.url }));
			}
		}
	};

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!formData.name.trim()) {
			toast.error("Category name is required");
			return;
		}

		const votePriceNum = isInternal ? 0 : Math.max(0, Number(formData.votePrice) || 0);
		const nomPriceNum = isInternal ? 0 : Math.max(0, Number(formData.nominationPrice) || 0);

		if (!isInternal && votePriceNum < MIN_VOTE_PRICE) {
			toast.error(
				`General voting requires a minimum vote price of ${MIN_VOTE_PRICE.toFixed(2)} GHS`,
			);
			return;
		}

		startTransition(async () => {
			try {
				const existingTemplateConfig = editingCategory?.templateConfig || {};
				const updatedTemplateConfig = {
					...existingTemplateConfig,
					resultDisplayType: formData.resultDisplayType,
				};

				const cleanDescription =
					formData.description && formData.description.replace(/<[^>]*>/g, "").trim()
						? formData.description.trim()
						: null;

				if (editingCategory) {
					await updateVotingCategory({
						data: {
							id: editingCategory.id,
							name: formData.name,
							description: cleanDescription || undefined,
							templateImage: formData.templateImage || null,
							templateConfig: updatedTemplateConfig,
							votePrice: votePriceNum,
							nominationPrice: nomPriceNum,
							allowMultiple: false,
							allowPublicNomination: formData.allowPublicNomination,
							requireApproval: formData.requireApproval,
							showTotalVotesPublicly: formData.showTotalVotesPublicly,
							showFinalImage: formData.showFinalImage,
							nominationDeadline: formData.nominationDeadline || null,
							votingMode: isInternal ? "internal" : "general",
						},
					});
					toast.success("Category updated successfully");
				} else {
					await createVotingCategory({
						data: {
							eventId,
							name: formData.name,
							description: cleanDescription || undefined,
							templateImage: formData.templateImage || undefined,
							templateConfig: updatedTemplateConfig,
							votePrice: votePriceNum,
							nominationPrice: nomPriceNum,
							allowMultiple: false,
							allowPublicNomination: formData.allowPublicNomination,
							requireApproval: formData.requireApproval,
							showTotalVotesPublicly: formData.showTotalVotesPublicly,
							showFinalImage: formData.showFinalImage,
							nominationDeadline: formData.nominationDeadline || undefined,
							votingMode: isInternal ? "internal" : "general",
						},
					});
					toast.success("Category created successfully");
				}

				onOpenChange(false);
				if (onSaved) onSaved();
			} catch (err) {
				toast.error(getErrorMessage(err));
			}
		});
	}

	const templateDisplayUrl = formData.templateImage
		? getEventImageUrl(formData.templateImage)
		: null;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="sm:max-w-lg overflow-y-auto">
				<form onSubmit={handleSubmit} className="flex flex-col h-full">
					<SheetHeader className="pb-4 border-b">
						<SheetTitle>
							{editingCategory ? "Edit Category" : "Add Voting Category"}
						</SheetTitle>
						<SheetDescription>
							{isInternal
								? "Set up a category for internal organization member voting."
								: "Configure category rules, pricing, nominations, and flyers."}
						</SheetDescription>
					</SheetHeader>

					<Tabs defaultValue="basic" className="flex-1 py-4 flex flex-col">
						<TabsList className="grid grid-cols-3 mb-4">
							<TabsTrigger value="basic">Basic Info</TabsTrigger>
							<TabsTrigger value="voting">Voting Rules</TabsTrigger>
							<TabsTrigger value="nominations">Nominations</TabsTrigger>
						</TabsList>

						{/* 1. Basic Info Tab */}
						<TabsContent value="basic" className="space-y-4 flex-1">
							<div className="space-y-2">
								<Label htmlFor="category-name">Category Name *</Label>
								<Input
									id="category-name"
									placeholder="e.g. Best Artist of the Year"
									value={formData.name}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, name: e.target.value }))
									}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label>Description / Criteria</Label>
								<RichTextEditor
									value={formData.description}
									onChange={(val) =>
										setFormData((prev) => ({ ...prev, description: val }))
									}
									placeholder="Briefly describe what this category recognizes..."
									minimal
								/>
							</div>

							{/* Template Flyer Image */}
							<div className="space-y-2 pt-2 border-t">
								<Label>Nominee Flyer Template (Optional)</Label>
								<p className="text-xs text-muted-foreground">
									Upload a background template image to generate flyer graphics for nominees.
								</p>

								{templateDisplayUrl ? (
									<div className="relative rounded-xl overflow-hidden border border-border aspect-video max-h-44 bg-muted flex items-center justify-center">
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img
											src={templateDisplayUrl}
											alt="Template Preview"
											className="w-full h-full object-contain"
										/>
										<Button
											type="button"
											variant="destructive"
											size="icon"
											className="absolute top-2 right-2 size-7 rounded-full shadow-md"
											onClick={() =>
												setFormData((prev) => ({
													...prev,
													templateImage: null,
												}))
											}
										>
											<X className="size-3.5" />
										</Button>
									</div>
								) : (
									<button
										type="button"
										onClick={() => fileInputRef.current?.click()}
										disabled={isUploading}
										className="w-full rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer text-center gap-1 hover:bg-primary/5 transition-colors bg-muted/40"
									>
										{isUploading ? (
											<Loader2 className="size-8 animate-spin text-primary" />
										) : (
											<>
												<AddFilesIcon className="size-10 text-primary/80 mb-1" />
												<span className="text-xs font-medium text-foreground">
													Upload Category Image
												</span>
												<span className="text-[10px] text-muted-foreground">
													PNG, JPG or WebP
												</span>
											</>
										)}
									</button>
								)}

								<input
									ref={fileInputRef}
									type="file"
									accept="image/*"
									className="hidden"
									onChange={handleImageUpload}
									disabled={isUploading}
								/>
							</div>
						</TabsContent>

						{/* 2. Voting Rules Tab */}
						<TabsContent value="voting" className="space-y-4 flex-1">
							{!isInternal && (
								<div className="space-y-2">
									<Label htmlFor="vote-price">Price Per Vote (GHS / Currency)</Label>
									<Input
										id="vote-price"
										type="number"
										step="0.01"
										min={MIN_VOTE_PRICE}
										placeholder={`${MIN_VOTE_PRICE.toFixed(2)} (minimum for general voting)`}
										value={formData.votePrice}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												votePrice: Number(e.target.value),
											}))
										}
									/>
									<p className="text-xs text-muted-foreground">
										Minimum {MIN_VOTE_PRICE.toFixed(2)} GHS for general/public voting.
									</p>
								</div>
							)}

							{/* Live Vote Display Settings */}
							<div className="space-y-3 p-3.5 rounded-xl border bg-muted/20">
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label className="text-sm font-medium">Show Live Results Publicly</Label>
										<p className="text-xs text-muted-foreground">
											Display real-time voting progress publicly to voters
										</p>
									</div>
									<Switch
										checked={formData.showTotalVotesPublicly}
										onCheckedChange={(checked) =>
											setFormData((prev) => ({
												...prev,
												showTotalVotesPublicly: checked,
											}))
										}
									/>
								</div>

								{formData.showTotalVotesPublicly && (
									<div className="pt-2.5 border-t border-border/60 flex flex-col gap-2">
										<Label className="text-xs font-medium text-muted-foreground">
											Public Result Display Format:
										</Label>
										<div className="grid grid-cols-2 gap-2">
											<button
												type="button"
												onClick={() =>
													setFormData((prev) => ({
														...prev,
														resultDisplayType: "percentage",
													}))
												}
												className={cn(
													"flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all",
													formData.resultDisplayType === "percentage"
														? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
														: "border-border/60 bg-background text-muted-foreground hover:bg-muted/50"
												)}
											>
												<Percent className="size-3.5" />
												<span>Percentage Only</span>
											</button>
											<button
												type="button"
												onClick={() =>
													setFormData((prev) => ({
														...prev,
														resultDisplayType: "count",
													}))
												}
												className={cn(
													"flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all",
													formData.resultDisplayType === "count"
														? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
														: "border-border/60 bg-background text-muted-foreground hover:bg-muted/50"
												)}
											>
												<Hash className="size-3.5" />
												<span>Actual Vote Count</span>
											</button>
										</div>
									</div>
								)}
							</div>

							{isInternal && (
								<div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex items-center gap-2.5 text-xs text-primary">
									<Lock className="size-4 shrink-0" />
									<span>
										<strong>Internal Voting Rules:</strong> Each member receives 1
										vote per category using their confidential voting key.
									</span>
								</div>
							)}
						</TabsContent>

						{/* 3. Nominations Tab */}
						<TabsContent value="nominations" className="space-y-4 flex-1">
							<div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/20">
								<div className="space-y-0.5">
									<Label className="text-sm font-medium">Allow Public Nominations</Label>
									<p className="text-xs text-muted-foreground">
										Allow audience members to submit nominees for this category
									</p>
								</div>
								<Switch
									checked={formData.allowPublicNomination}
									onCheckedChange={(checked) =>
										setFormData((prev) => ({
											...prev,
											allowPublicNomination: checked,
										}))
									}
								/>
							</div>

							{formData.allowPublicNomination && (
								<div className="space-y-4 p-3.5 rounded-xl border bg-muted/10">
									<div className="space-y-2">
										<Label htmlFor="nom-price">Nomination Submission Fee</Label>
										<Input
											id="nom-price"
											type="number"
											step="0.01"
											min="0"
											placeholder="0.00 (Leave 0 for Free submission)"
											value={formData.nominationPrice}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													nominationPrice: Number(e.target.value),
												}))
											}
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="nom-deadline">Nomination Deadline</Label>
										<Input
											id="nom-deadline"
											type="datetime-local"
											value={formData.nominationDeadline}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													nominationDeadline: e.target.value,
												}))
											}
										/>
									</div>

									<div className="flex items-center justify-between pt-2">
										<div className="space-y-0.5">
											<Label className="text-xs font-medium">Require Organizer Approval</Label>
											<p className="text-[11px] text-muted-foreground">
												New nominees must be approved before appearing publicly
											</p>
										</div>
										<Switch
											checked={formData.requireApproval}
											onCheckedChange={(checked) =>
												setFormData((prev) => ({
													...prev,
													requireApproval: checked,
												}))
											}
										/>
									</div>
								</div>
							)}
						</TabsContent>
					</Tabs>

					<SheetFooter className="pt-4 border-t gap-2 sm:gap-0">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isPending || isUploading}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending || isUploading}>
							{(isPending || isUploading) && (
								<Loader2 className="mr-2 size-4 animate-spin" />
							)}
							{editingCategory ? "Save Changes" : "Create Category"}
						</Button>
					</SheetFooter>
				</form>
			</SheetContent>
		</Sheet>
	);
}
