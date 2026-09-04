"use client";
// src/components/event/voting-manager/NominationRequestsSheet.tsx

import { useState, useTransition, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Check,
	X,
	Eye,
	Mail,
	Search,
	Loader2,
	Inbox,
} from "lucide-react";
import { toast } from "sonner";
import {
	approveNomination,
	rejectNomination,
	resendNominationEmail,
} from "@/lib/server-functions/voting-options";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { getErrorMessage } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";
import { NoNomineeIllustration } from "@/components/common/NoNomineeIllustration";
import { NominationDetailsDialog } from "./NominationDetailsDialog";

export interface NominationOption {
	id: string;
	optionText: string;
	description?: string | null;
	imageUrl?: string | null;
	email?: string | null;
	nomineeCode?: string | null;
	status: string;
	isPublicNomination?: boolean;
	nominatedByEmail?: string | null;
	nominatedByName?: string | null;
	deletionCode?: string | null;
	createdAt: string;
	categoryId?: string;
	categoryName?: string;
}

interface NominationRequestsSheetProps {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly options?: NominationOption[];
	readonly pendingOptions?: NominationOption[];
	readonly categories?: { id: string; name: string }[];
	readonly categoryName?: string;
	readonly onRefresh?: () => void;
}

type FilterTab = "pending" | "approved" | "rejected" | "all";

export function NominationRequestsSheet({
	open,
	onOpenChange,
	options,
	pendingOptions,
	categories = [],
	categoryName = "",
	onRefresh,
}: NominationRequestsSheetProps) {
	const [isPending, startTransition] = useTransition();
	const [activeTab, setActiveTab] = useState<FilterTab>("pending");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
	const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);

	const [selectedDialogOption, setSelectedDialogOption] = useState<{
		option: NominationOption;
		categoryName: string;
	} | null>(null);

	// Normalize incoming items: ensure strictly public nominations are shown
	const rawList = options ?? pendingOptions ?? [];
	const allNominations = useMemo(() => {
		return rawList.filter((item) => {
			// Only include public nominations
			return item.isPublicNomination !== false;
		});
	}, [rawList]);

	// Counts
	const pendingCount = allNominations.filter((o) => o.status === "pending").length;
	const approvedCount = allNominations.filter((o) => o.status === "approved").length;
	const rejectedCount = allNominations.filter((o) => o.status === "rejected").length;

	// Filtered items
	const filteredNominations = useMemo(() => {
		return allNominations.filter((opt) => {
			// Tab filter
			if (activeTab !== "all" && opt.status !== activeTab) {
				return false;
			}
			// Category filter
			if (
				selectedCategoryFilter !== "all" &&
				opt.categoryId &&
				opt.categoryId !== selectedCategoryFilter
			) {
				return false;
			}
			// Search filter
			if (searchQuery.trim()) {
				const query = searchQuery.toLowerCase();
				const matchName = opt.optionText.toLowerCase().includes(query);
				const matchCode = opt.nomineeCode?.toLowerCase().includes(query);
				const matchEmail = opt.email?.toLowerCase().includes(query);
				const matchNominator = opt.nominatedByName?.toLowerCase().includes(query);
				const matchNominatorEmail = opt.nominatedByEmail?.toLowerCase().includes(query);
				const matchCat = opt.categoryName?.toLowerCase().includes(query);
				if (
					!matchName &&
					!matchCode &&
					!matchEmail &&
					!matchNominator &&
					!matchNominatorEmail &&
					!matchCat
				) {
					return false;
				}
			}
			return true;
		});
	}, [allNominations, activeTab, selectedCategoryFilter, searchQuery]);

	// Actions
	const handleApprove = (optionId: string) => {
		startTransition(async () => {
			try {
				await approveNomination({ data: { optionId } });
				toast.success("Nomination approved successfully");
				onRefresh?.();
			} catch (error) {
				toast.error(getErrorMessage(error));
			}
		});
	};

	const handleReject = (optionId: string) => {
		if (!confirm("Are you sure you want to reject this nomination request?")) return;
		startTransition(async () => {
			try {
				await rejectNomination({ data: { optionId } });
				toast.success("Nomination rejected");
				onRefresh?.();
			} catch (error) {
				toast.error(getErrorMessage(error));
			}
		});
	};

	const handleResendEmail = async (option: NominationOption) => {
		const targetEmail = option.nominatedByEmail || option.email;
		if (!targetEmail) {
			toast.error("No recipient email associated with this nomination");
			return;
		}

		setSendingEmailId(option.id);
		toast.loading(`Resending confirmation email to ${targetEmail}...`);
		try {
			const res = await resendNominationEmail({ data: { optionId: option.id } });
			toast.dismiss();
			if (res.success) {
				toast.success("Confirmation email resent successfully!");
			} else {
				toast.error(res.error || "Failed to resend email");
			}
		} catch (err: any) {
			toast.dismiss();
			toast.error(err.message || "Failed to resend confirmation email");
		} finally {
			setSendingEmailId(null);
		}
	};

	const resolveCategoryName = (opt: NominationOption) => {
		if (opt.categoryName) return opt.categoryName;
		if (categoryName) return categoryName;
		if (opt.categoryId && categories.length > 0) {
			const found = categories.find((c) => c.id === opt.categoryId);
			if (found) return found.name;
		}
		return "Category";
	};

	return (
		<>
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetContent
					side="right"
					className="w-full sm:max-w-4xl p-6 flex flex-col h-full overflow-hidden"
				>
					{/* Header */}
					<SheetHeader className="shrink-0 pb-4 border-b border-border/80">
						<div className="flex items-center justify-between gap-3 pr-6">
							<div>
								<SheetTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
									<Inbox className="size-5 text-primary" />
									<span>Public Nomination Requests</span>
								</SheetTitle>
								<SheetDescription className="text-xs text-muted-foreground mt-1">
									Review, approve, and manage candidate submissions from the public.
								</SheetDescription>
							</div>

							{pendingCount > 0 && (
								<Badge className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-xs px-2.5 py-0.5">
									{pendingCount} Pending Review
								</Badge>
							)}
						</div>
					</SheetHeader>

					{/* Toolbar: Search, Filters & Tabs */}
					<div className="py-3 space-y-3 shrink-0">
						<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
							{/* Status Filter Tabs */}
							<Tabs
								value={activeTab}
								onValueChange={(val) => setActiveTab(val as FilterTab)}
								className="w-full sm:w-auto"
							>
								<TabsList className="h-9 w-full sm:w-auto p-1">
									<TabsTrigger
										value="pending"
										className="text-xs font-semibold gap-1.5 px-3 flex-1 sm:flex-initial"
									>
										<span>Pending</span>
										{pendingCount > 0 && (
											<span className="px-1.5 py-0.2 rounded-full text-[10px] bg-yellow-500 text-white font-mono font-bold">
												{pendingCount}
											</span>
										)}
									</TabsTrigger>

									<TabsTrigger
										value="approved"
										className="text-xs font-semibold gap-1.5 px-3 flex-1 sm:flex-initial"
									>
										<span>Approved</span>
										<span className="text-[10px] font-mono opacity-60">
											({approvedCount})
										</span>
									</TabsTrigger>

									<TabsTrigger
										value="rejected"
										className="text-xs font-semibold gap-1.5 px-3 flex-1 sm:flex-initial"
									>
										<span>Rejected</span>
										{rejectedCount > 0 && (
											<span className="text-[10px] font-mono opacity-60">
												({rejectedCount})
											</span>
										)}
									</TabsTrigger>

									<TabsTrigger
										value="all"
										className="text-xs font-semibold gap-1.5 px-3 flex-1 sm:flex-initial"
									>
										<span>All ({allNominations.length})</span>
									</TabsTrigger>
								</TabsList>
							</Tabs>

							{/* Search Input */}
							<div className="relative flex-1 sm:max-w-xs">
								<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
								<Input
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder="Search candidate, nominator, email..."
									className="h-8 pl-8 text-xs rounded-lg"
								/>
							</div>
						</div>
					</div>

					{/* Nominations Table */}
					<div className="flex-1 overflow-y-auto rounded-xl border border-border/80 bg-card">
						{filteredNominations.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-14 px-4 text-center">
								<NoNomineeIllustration className="w-32 h-auto mb-3 opacity-70" />
								<h5 className="font-bold text-sm text-foreground">
									No nomination requests found
								</h5>
								<p className="text-xs text-muted-foreground mt-1 max-w-sm">
									{searchQuery.trim()
										? `No submissions matched "${searchQuery}". Try adjusting your search term.`
										: activeTab === "pending"
											? "All public nomination submissions have been reviewed and processed!"
											: "No nomination submissions found for this status tab."}
								</p>
							</div>
						) : (
							<Table>
								<TableHeader className="bg-muted/40 sticky top-0 z-10 backdrop-blur-md">
									<TableRow>
										<TableHead className="w-[30%]">Nominee</TableHead>
										<TableHead className="w-[20%]">Category</TableHead>
										<TableHead className="w-[25%]">Nominator &amp; Contact</TableHead>
										<TableHead className="w-[12%]">Status</TableHead>
										<TableHead className="w-[13%] text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredNominations.map((option) => {
										const catName = resolveCategoryName(option);
										const contactEmail = option.nominatedByEmail || option.email;

										return (
											<TableRow key={option.id} className="hover:bg-muted/30 transition-colors">
												{/* Nominee Candidate */}
												<TableCell>
													<div className="flex items-center gap-3">
														<Avatar className="size-9 rounded-lg border shrink-0">
															<AvatarImage
																src={getEventImageUrl(option.imageUrl) ?? undefined}
																alt={option.optionText}
																className="object-cover"
															/>
															<AvatarFallback className="rounded-lg text-xs font-bold">
																{option.optionText.slice(0, 2).toUpperCase()}
															</AvatarFallback>
														</Avatar>
														<div className="min-w-0">
															<div className="font-bold text-sm text-foreground truncate">
																{option.optionText}
															</div>
															<div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
																{option.nomineeCode && (
																	<span className="text-[11px] font-mono font-bold text-primary">
																		#{option.nomineeCode}
																	</span>
																)}
																{option.email && (
																	<span className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
																		<Mail className="size-3 shrink-0 text-muted-foreground/70" />
																		<span className="truncate">{option.email}</span>
																	</span>
																)}
															</div>
														</div>
													</div>
												</TableCell>

												{/* Category */}
												<TableCell>
													<Badge
														variant="secondary"
														className="text-xs font-semibold truncate max-w-[150px]"
													>
														{catName}
													</Badge>
												</TableCell>

												{/* Nominator & Contact */}
												<TableCell>
													<div className="flex flex-col text-xs text-muted-foreground leading-tight">
														<span className="font-medium text-foreground truncate">
															{option.nominatedByName ? `By: ${option.nominatedByName}` : "Self-Nominated"}
														</span>
														{option.nominatedByEmail ? (
															<span className="text-[11px] text-muted-foreground truncate mt-0.5 flex items-center gap-1">
																<Mail className="size-3 shrink-0 text-muted-foreground/70" />
																<span className="truncate">{option.nominatedByEmail}</span>
															</span>
														) : option.email && !option.nominatedByName ? (
															<span className="text-[11px] text-muted-foreground truncate mt-0.5 flex items-center gap-1">
																<Mail className="size-3 shrink-0 text-muted-foreground/70" />
																<span className="truncate">{option.email}</span>
															</span>
														) : null}
													</div>
												</TableCell>

												{/* Status */}
												<TableCell>
													<StatusBadge
														variant={(option.status as any) || "pending"}
														size="sm"
													/>
												</TableCell>

												{/* Actions */}
												<TableCell className="text-right">
													<div className="flex items-center justify-end gap-1">
														{/* View Details */}
														<Button
															variant="ghost"
															size="icon"
															className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
															onClick={() =>
																setSelectedDialogOption({
																	option,
																	categoryName: catName,
																})
															}
															title="View Details"
														>
															<Eye className="size-4" />
														</Button>

														{/* Resend Email */}
														{contactEmail && (
															<Button
																variant="ghost"
																size="icon"
																className="size-8 rounded-lg text-muted-foreground hover:text-primary"
																onClick={() => handleResendEmail(option)}
																disabled={sendingEmailId === option.id}
																title="Resend Confirmation Email"
															>
																{sendingEmailId === option.id ? (
																	<Loader2 className="size-4 animate-spin text-primary" />
																) : (
																	<Mail className="size-4" />
																)}
															</Button>
														)}

														{/* Pending: Approve / Reject */}
														{option.status === "pending" && (
															<>
																<Button
																	variant="outline"
																	size="icon"
																	className="size-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
																	onClick={() => handleReject(option.id)}
																	disabled={isPending}
																	title="Reject"
																>
																	<X className="size-4" />
																</Button>
																<Button
																	variant="outline"
																	size="icon"
																	className="size-8 rounded-lg text-emerald-600 hover:bg-emerald-600/10 hover:text-emerald-600 border-emerald-600/30"
																	onClick={() => handleApprove(option.id)}
																	disabled={isPending}
																	title="Approve"
																>
																	<Check className="size-4" />
																</Button>
															</>
														)}
													</div>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						)}
					</div>
				</SheetContent>
			</Sheet>

			{/* Detailed View Modal */}
			<NominationDetailsDialog
				selectedOption={selectedDialogOption}
				onClose={() => setSelectedDialogOption(null)}
				onApprove={handleApprove}
				onReject={handleReject}
				isPending={isPending}
			/>
		</>
	);
}
