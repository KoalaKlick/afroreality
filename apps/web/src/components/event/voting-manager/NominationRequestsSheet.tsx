"use client";
// src/components/event/voting-manager/NominationRequestsSheet.tsx


import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Check, X, User, Mail, Calendar } from "lucide-react";
import { toast } from "sonner";
import { approveNomination, rejectNomination } from "@/lib/server-functions/voting-options";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { getErrorMessage, formatDate } from "@/lib/utils";

export interface NominationOption {
	id: string;
	optionText: string;
	description?: string | null;
	imageUrl?: string | null;
	email?: string | null;
	nomineeCode?: string | null;
	status: string;
	nominatedByEmail?: string | null;
	nominatedByName?: string | null;
	createdAt: string;
}

interface NominationRequestsSheetProps {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly pendingOptions: NominationOption[];
	readonly onRefresh?: () => void;
}

const statusBadgeStyles: Record<string, string> = {
	pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
	approved: "bg-green-100 text-green-800 border-green-300",
	rejected: "bg-red-100 text-red-800 border-red-300",
};

export function NominationRequestsSheet({
	open,
	onOpenChange,
	pendingOptions,
	onRefresh,
}: NominationRequestsSheetProps) {
	const [isPending, startTransition] = useTransition();
	const [activeTab, setActiveTab] = useState<"pending" | "approved" | "all">("pending");

	const filteredOptions = pendingOptions.filter((opt) => {
		if (activeTab === "all") return true;
		return opt.status === activeTab;
	});

	const handleApprove = (optionId: string) => {
		startTransition(async () => {
			try {
				await approveNomination({ data: { optionId } });
				toast.success("Nomination approved");
				onRefresh?.();
			} catch (error) {
				toast.error(getErrorMessage(error));
			}
		});
	};

	const handleReject = (optionId: string) => {
		if (!confirm("Are you sure you want to reject this nomination?")) return;
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

	const pendingCount = pendingOptions.filter((o) => o.status === "pending").length;

	const tabs = ["pending", "approved", "all"] as const;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-full sm:max-w-lg flex flex-col h-full overflow-y-auto">
				<SheetHeader>
					<SheetTitle className="flex items-center gap-2">
						Nomination Requests
						{pendingCount > 0 && (
							<Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
								{pendingCount} pending
							</Badge>
						)}
					</SheetTitle>
					<SheetDescription>
						Review and approve public nominations for this category.
					</SheetDescription>
				</SheetHeader>

				<div className="flex gap-2 py-4 border-b">
					{tabs.map((tab) => (
						<button
							key={tab}
							onClick={() => setActiveTab(tab)}
							className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
								activeTab === tab
									? "bg-primary text-primary-foreground"
									: "bg-muted text-muted-foreground hover:bg-muted/80"
							}`}
						>
							{tab}
							{tab === "pending" && pendingCount > 0 && (
								<span className="ml-1 text-xs">({pendingCount})</span>
							)}
						</button>
					))}
				</div>

				<div className="flex-1 overflow-y-auto py-4 space-y-3">
					{filteredOptions.length === 0 ? (
						<div className="text-center py-12 text-muted-foreground">
							<User className="size-12 mx-auto mb-3 opacity-30" />
							<p className="font-medium">No nominations found</p>
							<p className="text-sm">
								{activeTab === "pending"
									? "All nominations have been reviewed."
									: `No ${activeTab} nominations.`}
							</p>
						</div>
					) : (
						filteredOptions.map((option) => (
							<div
								key={option.id}
							 className="rounded-lg border bg-card p-4 space-y-3"
							>
								<div className="flex items-start gap-3">
									{option.imageUrl ? (
										<img
											src={getEventImageUrl(option.imageUrl) ?? ""}
											alt={option.optionText}
											className="size-12 rounded-lg object-cover shrink-0"
										/>
									) : (
										<div className="size-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
											<User className="size-5 text-muted-foreground" />
										</div>
									)}
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<h4 className="font-semibold truncate">
												{option.optionText}
											</h4>
											<Badge
												variant="outline"
												className={`text-xs capitalize ${
													statusBadgeStyles[option.status]
												}`}
											>
												{option.status}
											</Badge>
										</div>
										{option.nomineeCode && (
											<p className="text-xs font-mono text-muted-foreground">
												Code: {option.nomineeCode}
											</p>
										)}
									</div>
								</div>

								{option.description && (
									<RichTextDisplay
										content={option.description}
										className="text-sm text-muted-foreground line-clamp-2"
									/>
								)}

								<div className="flex items-center gap-4 text-xs text-muted-foreground">
									{option.email && (
										<span className="flex items-center gap-1">
											<Mail className="size-3" />
											{option.email}
										</span>
									)}
									<span className="flex items-center gap-1">
										<Calendar className="size-3" />
										{formatDate(option.createdAt)}
									</span>
								</div>

								{option.status === "pending" && (
									<div className="flex items-center gap-2 pt-2 border-t">
										<Button
											size="sm"
											onClick={() => handleApprove(option.id)}
											disabled={isPending}
											className="gap-1.5"
										>
											<Check className="size-3.5" />
											Approve
										</Button>
										<Button
											size="sm"
											variant="outline"
											className="gap-1.5 text-destructive hover:text-destructive"
											onClick={() => handleReject(option.id)}
											disabled={isPending}
										>
											<X className="size-3.5" />
											Reject
										</Button>
									</div>
								)}
							</div>
						))
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
