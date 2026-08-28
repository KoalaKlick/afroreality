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
import { Loader2, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import {
	createVotingCategory,
	updateVotingCategory,
} from "@/lib/server-functions/voting";
import { useImageUpload } from "@/hooks/use-image-upload";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { getErrorMessage } from "@/lib/utils";
import {
	DEFAULT_NOMINATION_PRICE,
	DEFAULT_VOTE_PRICE,
	MIN_NOMINATION_PRICE,
	MIN_VOTE_PRICE,
} from "@/lib/constants/pricing";

export interface CategoryItem {
	id: string;
	eventId: string;
	name: string;
	description?: string | null;
	votePrice?: number;
	nominationPrice?: number;
	allowMultiple?: boolean;
	allowPublicNomination?: boolean;
	requireApproval?: boolean;
	showTotalVotesPublicly?: boolean;
	showFinalImage?: boolean;
	templateImage?: string | null;
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
	}[];
}

interface CategorySheetProps {
	readonly eventId: string;
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly editingCategory: CategoryItem | null;
	readonly onSaved?: () => void;
}

export function CategorySheet({
	eventId,
	open,
	onOpenChange,
	editingCategory,
	onSaved,
}: CategorySheetProps) {
	const [isPending, startTransition] = useTransition();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const { isUploading, upload } = useImageUpload({
		folder: "templates",
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
		votePrice: DEFAULT_VOTE_PRICE,
		nominationPrice: DEFAULT_NOMINATION_PRICE,
		maxVotesPerUser: 10,
		allowMultiple: true,
		allowPublicNomination: false,
		requireApproval: true,
		showTotalVotesPublicly: true,
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

			setFormData({
				name: editingCategory.name,
				description: editingCategory.description ?? "",
				templateImage: editingCategory.templateImage ?? null,
				votePrice: editingCategory.votePrice ?? DEFAULT_VOTE_PRICE,
				nominationPrice:
					editingCategory.nominationPrice ?? DEFAULT_NOMINATION_PRICE,
				maxVotesPerUser: 10,
				allowMultiple: editingCategory.allowMultiple ?? true,
				allowPublicNomination: editingCategory.allowPublicNomination ?? false,
				requireApproval: editingCategory.requireApproval ?? true,
				showTotalVotesPublicly:
					editingCategory.showTotalVotesPublicly ?? true,
				showFinalImage: editingCategory.showFinalImage ?? true,
				nominationDeadline: deadlineStr,
			});
		} else {
			setFormData({
				name: "",
				description: "",
				templateImage: null,
				votePrice: DEFAULT_VOTE_PRICE,
				nominationPrice: DEFAULT_NOMINATION_PRICE,
				maxVotesPerUser: 10,
				allowMultiple: true,
				allowPublicNomination: false,
				requireApproval: true,
				showTotalVotesPublicly: true,
				showFinalImage: true,
				nominationDeadline: "",
			});
		}
	}, [editingCategory, open]);

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

		const votePriceNum = Number(formData.votePrice);
		if (Number.isNaN(votePriceNum) || votePriceNum < 0) {
			toast.error("Vote price cannot be negative");
			return;
		}

		const nomPriceNum = Number(formData.nominationPrice);
		if (Number.isNaN(nomPriceNum) || nomPriceNum < 0) {
			toast.error("Nomination fee cannot be negative");
			return;
		}

		startTransition(async () => {
			try {
				if (editingCategory) {
					await updateVotingCategory({
						data: {
							id: editingCategory.id,
							name: formData.name,
							description: formData.description || undefined,
							templateImage: formData.templateImage || null,
							votePrice: Number(formData.votePrice) || 1,
							nominationPrice: Number(formData.nominationPrice) || 0,
							allowMultiple: formData.allowMultiple,
							allowPublicNomination: formData.allowPublicNomination,
							requireApproval: formData.requireApproval,
							showTotalVotesPublicly: formData.showTotalVotesPublicly,
							showFinalImage: formData.showFinalImage,
							nominationDeadline: formData.nominationDeadline || null,
						},
					});
					toast.success("Category updated successfully");
				} else {
					await createVotingCategory({
						data: {
							eventId,
							name: formData.name,
							description: formData.description || undefined,
							templateImage: formData.templateImage || undefined,
							votePrice: Number(formData.votePrice) || 1,
							nominationPrice: Number(formData.nominationPrice) || 0,
							allowMultiple: formData.allowMultiple,
							allowPublicNomination: formData.allowPublicNomination,
							requireApproval: formData.requireApproval,
							showTotalVotesPublicly: formData.showTotalVotesPublicly,
							showFinalImage: formData.showFinalImage,
							nominationDeadline: formData.nominationDeadline || undefined,
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
			<SheetContent className="w-full sm:max-w-lg flex flex-col h-full overflow-y-auto">
				<SheetHeader>
					<SheetTitle>
						{editingCategory ? "Edit Voting Category" : "Add Voting Category"}
					</SheetTitle>
					<SheetDescription>
						Configure category rules, nominee poster template, and pricing.
					</SheetDescription>
				</SheetHeader>

				<form onSubmit={handleSubmit} className="space-y-4 py-4 flex-1 flex flex-col">
					<Tabs defaultValue="basic" className="w-full flex-1">
						<TabsList variant="afro" className="grid w-full grid-cols-3 mb-4">
							<TabsTrigger variant="afro" value="basic">Basic Info</TabsTrigger>
							<TabsTrigger variant="afro" value="nominations">Nominations</TabsTrigger>
							<TabsTrigger variant="afro" value="pricing">Pricing</TabsTrigger>
						</TabsList>

						{/* ── 1. Basic Tab ── */}
						<TabsContent value="basic" className="space-y-4">
							{/* Category Template Image Upload */}
							<div className="space-y-2">
								<Label>Category Template / Header Image</Label>
								<input
									ref={fileInputRef}
									type="file"
									accept="image/*"
									onChange={handleImageUpload}
									className="hidden"
								/>
								{templateDisplayUrl ? (
									<div className="relative w-full h-40 rounded-xl overflow-hidden border bg-muted group/img">
										<img
											src={templateDisplayUrl}
											alt="Category template"
											className="size-full object-cover"
										/>
										<div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
											<Button
												type="button"
												size="sm"
												variant="secondary"
												onClick={() => fileInputRef.current?.click()}
												disabled={isUploading}
											>
												{isUploading ? (
													<Loader2 className="size-4 animate-spin" />
												) : (
													"Change Image"
												)}
											</Button>
											<Button
												type="button"
												size="icon"
												variant="destructive"
												className="size-8"
												onClick={() =>
													setFormData((prev) => ({
														...prev,
														templateImage: null,
													}))
												}
											>
												<X className="size-4" />
											</Button>
										</div>
									</div>
								) : (
									<button
										type="button"
										onClick={() => fileInputRef.current?.click()}
										disabled={isUploading}
										className="w-full h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/40 transition-colors"
									>
										{isUploading ? (
											<Loader2 className="size-6 animate-spin mb-1" />
										) : (
											<>
												<ImageIcon className="size-6 mb-1.5 opacity-40" />
												<span className="text-xs font-semibold">
													Upload Template Image
												</span>
												<span className="text-[10px] text-muted-foreground/70">
													For flyers and nominee posters (PNG, JPG, WebP)
												</span>
											</>
										)}
									</button>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="category-name">Category Name *</Label>
								<Input
									id="category-name"
									value={formData.name}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, name: e.target.value }))
									}
									placeholder="e.g., Best Male Artist, Innovator of the Year"
									required
								/>
							</div>

							<div className="space-y-2">
								<Label>Description (Optional)</Label>
								<RichTextEditor
									value={formData.description}
									onChange={(val) =>
										setFormData((prev) => ({
											...prev,
											description: val,
										}))
									}
									placeholder="Criteria or rules for this category..."
									minimal
								/>
							</div>

							<div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
								<div className="space-y-0.5">
									<Label>Public Vote Counts</Label>
									<p className="text-xs text-muted-foreground">
										Show live vote counts publicly to voters
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
						</TabsContent>

						{/* ── 2. Nominations Tab ── */}
						<TabsContent value="nominations" className="space-y-4">
							<div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
								<div className="space-y-0.5">
									<Label>Allow Public Nominations</Label>
									<p className="text-xs text-muted-foreground">
										Allow audience members to submit nominees
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
								<>
									<div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
										<div className="space-y-0.5">
											<Label>Require Admin Approval</Label>
											<p className="text-xs text-muted-foreground">
												Submitted nominees must be approved before voting
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

									<div className="space-y-2">
										<Label htmlFor="nomination-deadline">
											Nomination Deadline
										</Label>
										<Input
											id="nomination-deadline"
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
								</>
							)}

							<div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
								<div className="space-y-0.5">
									<Label>Multiple Nominee Selections</Label>
									<p className="text-xs text-muted-foreground">
										Allow voters to vote for multiple nominees in this category
									</p>
								</div>
								<Switch
									checked={formData.allowMultiple}
									onCheckedChange={(checked) =>
										setFormData((prev) => ({
											...prev,
											allowMultiple: checked,
										}))
									}
								/>
							</div>
						</TabsContent>

						{/* ── 3. Pricing Tab ── */}
						<TabsContent value="pricing" className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="vote-price">Price Per Vote (GHS)</Label>
									<Input
										id="vote-price"
										type="number"
										min={MIN_VOTE_PRICE}
										step="0.1"
										value={formData.votePrice}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												votePrice: parseFloat(e.target.value) || 0,
											}))
										}
										required
									/>
									<p className="text-[10px] text-muted-foreground">
										Cost charged per single vote cast (min GHS {MIN_VOTE_PRICE}).
									</p>
								</div>

								<div className="space-y-2">
									<Label htmlFor="nom-price">Nomination Fee (GHS)</Label>
									<Input
										id="nom-price"
										type="number"
										min={MIN_NOMINATION_PRICE}
										step="0.1"
										value={formData.nominationPrice}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												nominationPrice: parseFloat(e.target.value) || 0,
											}))
										}
									/>
									<p className="text-[10px] text-muted-foreground">
										Fee for public nomination submissions (min GHS {MIN_NOMINATION_PRICE}).
									</p>
								</div>
							</div>
						</TabsContent>
					</Tabs>

					<SheetFooter className="pt-6 border-t mt-auto">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isPending || isUploading}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending || isUploading}>
							{isPending ? (
								<>
									<Loader2 className="mr-2 size-4 animate-spin" />
									Saving...
								</>
							) : editingCategory ? (
								"Save Changes"
							) : (
								"Create Category"
							)}
						</Button>
					</SheetFooter>
				</form>
			</SheetContent>
		</Sheet>
	);
}
