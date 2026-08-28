"use client";
// src/components/event/core/EventDetailHeader.tsx

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	Check,
	ChevronDown,
	ExternalLink,
	EyeOff,
	Loader2,
	Pencil,
	Plus,
	Ticket,
	Users,
	Vote,
	X,
	LayoutDashboard,
	Settings,
} from "lucide-react";
import { useRef, useState, useTransition } from "react";
import AddFilesIcon from "@/assets/add-files.svg";
import { toast } from "sonner";
import { StatusBadge } from "@/components/common/status-badge";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useImageUpload } from "@/hooks/use-image-upload";
import { getEventLifecycleStatus } from "@/lib/event-status";
import { getEventImageUrl, getOrgImageUrl } from "@/lib/image-url-utils";
import { updateExistingEvent } from "@/lib/server-functions/event-mgmt";
import { cn, getErrorMessage } from "@/lib/utils";

interface EventDetailHeaderProps {
	readonly event: any;
	readonly onRefresh?: () => void;
	readonly canEdit?: boolean;
	readonly activeTab?: string;
	readonly onTabChange?: (tab: string) => void;
	readonly isTicketed?: boolean;
	readonly isVoting?: boolean;
	readonly ticketCount?: number;
	readonly votingCount?: number;
	readonly onAddTicket?: () => void;
	readonly onAddCategory?: () => void;
	readonly showMembers?: boolean;
}

const statusBadgeVariants: Record<string, "draft" | "upcoming" | "ongoing" | "ended"> = {
	draft: "draft",
	upcoming: "upcoming",
	ongoing: "ongoing",
	ended: "ended",
};



export function EventDetailHeader({
	event,
	onRefresh,
	canEdit = true,
	activeTab = "overview",
	onTabChange,
	isTicketed = false,
	isVoting = false,
	ticketCount = 0,
	votingCount = 0,
	onAddTicket,
	onAddCategory,
	showMembers = false,
}: EventDetailHeaderProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [isStatusChanging, startStatusTransition] = useTransition();
	const [editingTitle, setEditingTitle] = useState(false);
	const [titleValue, setTitleValue] = useState(event.title ?? "");
	const bannerImage = event.bannerImage ?? "";
	const [flierImage, setFlierImage] = useState(event.flierImage ?? "");
	const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);

	const flierInputRef = useRef<HTMLInputElement>(null);

	const { isUploading: isUploadingFlier, upload: uploadFlier } = useImageUpload({
		folder: "events",
		convertOptions: { quality: 0.9, maxWidth: 800, maxHeight: 800 },
	});

	const lifecycleStatus = getEventLifecycleStatus(event);

	// The pill badge always shows the date-based lifecycle status
	// (Ongoing, Ended, Upcoming). Publication status (Draft/Published)
	// is handled by the separate dropdown button in the header actions.
	const activeStatusKey = lifecycleStatus;
	const activeStatusLabel =
		lifecycleStatus === "ongoing"
			? "Ongoing"
			: lifecycleStatus === "ended"
				? "Ended"
				: "Upcoming";

 	const organization = event?.organization;
 	const orgBannerUrl = organization?.bannerUrl ? getOrgImageUrl(organization.bannerUrl) : null;
 	const bannerDisplayUrl = orgBannerUrl || (bannerImage ? getEventImageUrl(bannerImage) : null);
 	const flierDisplayUrl = getEventImageUrl(flierImage);
 	const hasPaymentAccount = !!organization?.paystackAccountNumber;

 	// Save single field
	async function saveField(fieldName: string, value: any) {
		startTransition(async () => {
			try {
				await updateExistingEvent({
					data: {
						id: event.id,
						[fieldName]: value,
					},
				});
				toast.success("Event updated");
				if (onRefresh) onRefresh();
			} catch (err) {
				toast.error(getErrorMessage(err));
			}
		});
	}

	// Publication status change (Draft <-> Published)
	async function handlePublicationStatusChange(
		newStatus: "draft" | "published",
	) {
		if (newStatus === event.status) return;

		// Gate paid event publishing behind a payout account
		const isPaidEvent =
			event.type === "ticketed" ||
			event.type === "hybrid" ||
			event.type === "voting";
		if (newStatus === "published" && isPaidEvent && !hasPaymentAccount) {
			setShowPaymentPrompt(true);
			return;
		}

		startStatusTransition(async () => {
			try {
				await updateExistingEvent({
					data: {
						id: event.id,
						status: newStatus,
					},
				});
				toast.success(
					newStatus === "published"
						? "Event published live!"
						: "Event moved to draft",
				);
				if (onRefresh) onRefresh();
			} catch (err) {
				toast.error(getErrorMessage(err));
			}
		});
	}

	const handleFlierUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const res = await uploadFlier(file);
			if (res) {
				setFlierImage(res.url);
				await saveField("flierImage", res.url);
			}
		}
	};

	const handleRemoveFlier = () => {
		setFlierImage("");
		void saveField("flierImage", "");
		if (flierInputRef.current) flierInputRef.current.value = "";
	};

	const handleSaveTitle = () => {
		if (!titleValue.trim()) {
			toast.error("Event title cannot be empty");
			return;
		}
		void saveField("title", titleValue);
		setEditingTitle(false);
	};

	return (
		<>
			<div className="bg-card border rounded-2xl rounded-t-none overflow-hidden">
				{/* Hidden file input */}
			<input
				ref={flierInputRef}
				type="file"
				accept="image/*"
				onChange={handleFlierUpload}
				className="hidden"
			/>

			{/* Banner Container (Inherits Organization Banner) */}
			<div className="relative h-36 sm:h-36 md:h-48 bg-linear-to-r from-primary/20 via-primary/10 to-primary/5 overflow-hidden">
				{bannerDisplayUrl ? (
					<img
						src={bannerDisplayUrl}
						alt={organization?.name || event.title || "Header Banner"}
						className="size-full object-cover"
					/>
				) : (
					<div className="size-full bg-linear-to-r from-primary/15 via-primary/5 to-accent/15" />
				)}
			</div>

			{/* Lower Info Section (Clean White/Card Background) */}
			<div className="px-6 pb-6 pt-0 relative">
				<div className="flex flex-col sm:flex-row gap-5 sm:items-end">
					{/* Flier Image (Overlaps Banner Only) */}
					<div className="relative shrink-0 -mt-14 sm:-mt-16 z-10">
						<div className="size-28 sm:size-36 rounded-2xl border-4 border-card bg-card  overflow-hidden group/flier relative">
							{flierImage && flierDisplayUrl ? (
								<>
									<img
										src={flierDisplayUrl}
										alt={event.title}
										className="size-full object-cover"
									/>
									{canEdit && (
										<>
											<button
												type="button"
												onClick={() => flierInputRef.current?.click()}
												disabled={isUploadingFlier}
												className="absolute inset-0 bg-black/50 opacity-0 group-hover/flier:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
											>
												{isUploadingFlier ? (
													<Loader2 className="size-5 text-white animate-spin" />
												) : (
													<Pencil className="size-5 text-white" />
												)}
											</button>
											<button
												type="button"
												onClick={handleRemoveFlier}
												className="absolute top-1.5 right-1.5 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm hover:bg-destructive/90 z-10 opacity-0 group-hover/flier:opacity-100 transition-opacity"
											>
												<X className="size-3" />
											</button>
										</>
									)}
								</>
							) : canEdit ? (
								<button
									type="button"
									className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors bg-background hover:bg-muted/50 "
									onClick={() => flierInputRef.current?.click()}
									disabled={isUploadingFlier}
								>
									{isUploadingFlier ? (
										<Loader2 className="size-6 animate-spin text-muted-foreground" />
									) : (
										<>
											<AddFilesIcon className="size-12 mb-1" />
											<span className="text-[10px] text-muted-foreground">
												Upload Flier
											</span>
										</>
									)}
								</button>
							) : (
								<div className="w-full h-full flex items-center justify-center bg-muted p-3">
									<AddFilesIcon className="size-16" />
								</div>
							)}
						</div>
					</div>

					{/* Title, Badges & Meta (Completely in the Lower White Section) */}
					<div className="flex-1 min-w-0 pt-3 sm:pt-4">
						{/* Badges Row */}
						<div className="flex flex-wrap items-center gap-2 mb-2">
							{/* Main Status Pill: Draft, Ongoing, Ended, or Upcoming */}
							<StatusBadge
								variant={statusBadgeVariants[activeStatusKey] || "default"}
								text={activeStatusLabel}
							/>

							{/* Event Type Badge */}
							<StatusBadge variant={event.type} text={event.type} />

							

							{/* Private Badge (if not public) */}
							{!event.isPublic && (
								<Badge variant="secondary" className="gap-1 text-xs">
									<EyeOff className="size-3" />
									Private
								</Badge>
							)}
						</div>

						{/* Editable Title */}
						{editingTitle ? (
							<div className="flex items-center gap-2 max-w-lg mt-1">
								<Input
									value={titleValue}
									onChange={(e) => setTitleValue(e.target.value)}
									className="text-lg sm:text-xl font-bold"
									autoFocus
								/>
								<Button
									size="icon"
									variant="ghost"
									onClick={handleSaveTitle}
									disabled={isPending}
								>
									<Check className="size-4 text-emerald-600" />
								</Button>
								<Button
									size="icon"
									variant="ghost"
									onClick={() => {
										setTitleValue(event.title);
										setEditingTitle(false);
									}}
								>
									<X className="size-4" />
								</Button>
							</div>
						) : (
							<button
								type="button"
								className={cn(
									"text-xl sm:text-2xl font-black tracking-tight text-left truncate max-w-2xl flex items-center gap-2 group",
									canEdit && "cursor-pointer hover:text-primary transition-colors",
								)}
								onClick={() => canEdit && setEditingTitle(true)}
							>
								<span className="truncate">{event.title}</span>
								{canEdit && (
									<Pencil className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
								)}
							</button>
						)}

						<p className="text-xs font-mono text-muted-foreground mt-1">
							/{event.slug}
						</p>
						<p className="text-xs text-muted-foreground mt-0.5">
							Created {new Date(event.createdAt).toLocaleDateString()}
							{" · "}
							Updated {new Date(event.updatedAt).toLocaleDateString()}
						</p>
					</div>

					{/* Header Actions */}
					<div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 sm:pt-0">
						{/* Add buttons */}
						{canEdit && isTicketed && onAddTicket && (
							<Button
								size="sm"
								onClick={onAddTicket}
								className="gap-1.5"
							>
								<Plus className="size-4" />
								Add Ticket Tier
							</Button>
						)}
						{canEdit && isVoting && onAddCategory && (
							<Button
								size="sm"
								onClick={onAddCategory}
								className="gap-1.5"
							>
								<Plus className="size-4" />
								Add Category
							</Button>
						)}

						{/* Publication Status Selector Dropdown */}
						{canEdit && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="outline"
										size="sm"
										className="gap-2 capitalize"
										disabled={isStatusChanging}
									>
										{isStatusChanging ? (
											<Loader2 className="size-4 animate-spin" />
										) : (
											<>
												<span
													className={cn(
														"size-2 rounded-full",
														event.status === "published"
															? "bg-green-500"
															: "bg-yellow-500",
													)}
												/>
												{event.status === "published" ? "Published" : "Draft"}
												<ChevronDown className="size-3.5 text-muted-foreground" />
											</>
										)}
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem
										onClick={() => handlePublicationStatusChange("draft")}
										className="gap-2 cursor-pointer"
									>
										<span className="size-2 rounded-full bg-yellow-500" />
										Draft
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => handlePublicationStatusChange("published")}
										className="gap-2 cursor-pointer"
									>
										<span className="size-2 rounded-full bg-green-500" />
										Published
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						)}

						{event.slug && (
							<Button asChild variant="outline" size="sm" className="gap-1.5">
								<Link href={`/events/${event.slug}` as any} target="_blank">
									<ExternalLink className="size-4" />
									Public Page
								</Link>
							</Button>
						)}
					</div>
				</div>

				{/* Navigation Tabs */}
				{onTabChange && (
					<div className="mt-6">
						<Tabs value={activeTab} onValueChange={onTabChange}>
							<TabsList variant="afro" className="grid grid-cols-2 sm:flex sm:inline-flex w-full sm:w-auto">
								<TabsTrigger
									variant="afro"
									value="overview"
									className="gap-2 rounded"
								>
									<LayoutDashboard className="size-4" />
									Overview
								</TabsTrigger>

								{isTicketed && (
									<TabsTrigger
										variant="afro"
										value="tickets"
										className="gap-2 rounded"
									>
										<Ticket className="size-4" />
										Tickets ({ticketCount})
									</TabsTrigger>
								)}

							{isVoting && (
								<TabsTrigger
									variant="afro"
									value="voting"
									className="gap-2 rounded"
								>
									<Vote className="size-4" />
									Voting ({votingCount})
								</TabsTrigger>
							)}

						{showMembers && (
							<TabsTrigger
								variant="afro"
								value="members"
								className="gap-2 rounded"
							>
								<Users className="size-4" />
								Members
							</TabsTrigger>
						)}

						<TabsTrigger
								variant="afro"
								value="settings"
								className="gap-2 rounded"
							>
								<Settings className="size-4" />
								Settings
							</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>
				)}
			</div>
		</div>

		<AlertDialog open={showPaymentPrompt} onOpenChange={setShowPaymentPrompt}>
			<AlertDialogContent variant="afro">
				<AlertDialogHeader>
					<AlertDialogTitle>Payout Account Required</AlertDialogTitle>
					<AlertDialogDescription>
						You need to set up an organization payout method (Mobile Money
						or Bank Account) before you can publish a paid event. This
						ensures you can receive earnings from ticket sales or votes.
						<em className="block text-center bg-secondary-100/50 mt-2">
							<br />
							Note: No amount is charged from your account.
						</em>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => {
							setShowPaymentPrompt(false);
							void router.push("/organization/wallet");
						}}
					>
						Set up Payout Account
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
		</>
	);
}
