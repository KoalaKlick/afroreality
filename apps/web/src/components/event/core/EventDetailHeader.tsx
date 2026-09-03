"use client";
// src/components/event/core/EventDetailHeader.tsx

import Link from "next/link";
import {
	useRouter
} from "next/navigation";
import {
	Calendar,
	Check,
	ChevronDown,
	ExternalLink,
	EyeOff,
	LayoutDashboard,
	Loader2,
	MapPin,
	Pencil,
	Plus,
	QrCode,
	Settings,
	Share2,
	Ticket,
	Users,
	Vote,
	X,
} from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import AddFilesIcon from "@/assets/add-files.svg";
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
import { cleanStorageKey, getEventImageUrl } from "@/lib/image-url-utils";
import { updateExistingEvent } from "@/lib/server-functions/event-mgmt";
import { cn, formatDate, getErrorMessage } from "@/lib/utils";

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

const statusBadgeVariants: Record<string, "draft" | "published" | "ongoing" | "ended" | "upcoming" | "cancelled"> = {
	draft: "draft",
	published: "published",
	ongoing: "ongoing",
	ended: "ended",
	upcoming: "upcoming",
	cancelled: "cancelled",
};

function getEventLifecycle(event: any): "draft" | "ongoing" | "ended" | "upcoming" | "published" {
	if (event.status === "draft") return "draft";
	const now = new Date();
	const start = event.startDate ? new Date(event.startDate) : null;
	const end = event.endDate ? new Date(event.endDate) : null;
	if (start && start > now) return "upcoming";
	if (start && (!end || end >= now)) return "ongoing";
	if (end && end < now) return "ended";
	return "published";
}

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
	const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);

	// Editable state
	const [editingTitle, setEditingTitle] = useState(false);
	const [titleValue, setTitleValue] = useState(event.title || "");
	const [flierImage, setFlierImage] = useState(
		cleanStorageKey(event.flierImage || ""),
	);

	// File input ref
	const flierInputRef = useRef<HTMLInputElement>(null);

	// Image upload hook
	const { upload: uploadFlier, isUploading: isUploadingFlier } = useImageUpload(
		{
			folder: "events",
			convertOptions: { quality: 0.9, maxWidth: 1200, maxHeight: 1200 },
		},
	);

	const lifecycleStatus = getEventLifecycle(event);
	const activeStatusKey = lifecycleStatus;
	const activeStatusLabel =
		lifecycleStatus === "ongoing"
			? "Ongoing"
			: lifecycleStatus === "ended"
				? "Ended"
				: lifecycleStatus === "upcoming"
					? "Upcoming"
					: lifecycleStatus === "draft"
						? "Draft"
						: "Published";

	const organization = event?.organization;
	const flierDisplayUrl = flierImage ? getEventImageUrl(flierImage) : null;
	// Payout is "activated" once the org has a Paystack subaccount configured.
	// (A raw bank account number alone is not enough — the subaccount code is
	// only set when the payout account is fully configured.)
	const hasPayoutActivated = !!organization?.subaccountCode;

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
		if (newStatus === "published" && isPaidEvent && !hasPayoutActivated) {
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
				const relativeKey = cleanStorageKey(res.key || res.url);
				setFlierImage(relativeKey);
				await saveField("flierImage", relativeKey);
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

	const handleShare = () => {
		const url = `${window.location.origin}/${event.organization?.slug || organization?.slug || "org"}/event/${event.slug || event.id}`;
		navigator.clipboard.writeText(url);
		toast.success("Event link copied to clipboard!");
	};

	const dateStr = event.startDate
		? event.endDate
			? `${formatDate(event.startDate)} – ${formatDate(event.endDate)}`
			: formatDate(event.startDate)
		: null;

	return (
		<>
			<div className="space-y-4">
				{/* Hidden file input */}
				<input
					ref={flierInputRef}
					type="file"
					accept="image/*"
					onChange={handleFlierUpload}
					className="hidden"
				/>

				{/* Unified Hero Card with Clean Light Primary-50 Background, No Shadow, No Border Bottom */}
				<div className="relative rounded-t-2xl rounded-b-none border-t border-x border-b-0 border-border bg-primary-50/70 dark:bg-primary-950/20 overflow-hidden shadow-none">
					{/* Card Content: Flier sits flush at bottom, details beside */}
					<div className="flex flex-col md:flex-row items-stretch md:items-end gap-6 pl-5 pt-5 sm:pl-7 sm:pt-7 pr-5 sm:pr-7 pb-5 sm:pb-7 md:pb-0">
						{/* Event Flier (Flush with bottom, rounded top, no bottom roundness, border-background) */}
						<div className="relative shrink-0 w-36 sm:w-44 md:w-52 h-36 sm:h-44 md:h-56 rounded-t-2xl rounded-b-none border-t border-x border-b-0 border-background bg-background overflow-hidden shadow-none group/flier self-start md:self-end">
							{flierDisplayUrl ? (
								<>
									<img
										src={flierDisplayUrl}
										alt={event.title}
										className="size-full object-cover rounded-t-2xl rounded-b-none"
									/>
									{canEdit && (
										<>
											<button
												type="button"
												onClick={() => flierInputRef.current?.click()}
												disabled={isUploadingFlier}
												className="absolute inset-0 bg-black/50 opacity-0 group-hover/flier:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-t-2xl rounded-b-none"
												aria-label="Change flier"
											>
												{isUploadingFlier ? (
													<Loader2 className="size-6 text-white animate-spin" />
												) : (
													<div className="flex flex-col items-center text-white">
														<Pencil className="size-5 mb-1" />
														<span className="text-xs font-semibold">
															Change Flier
														</span>
													</div>
												)}
											</button>
											<button
												type="button"
												onClick={handleRemoveFlier}
												className="absolute top-2 right-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm hover:bg-destructive/90 z-10 opacity-0 group-hover/flier:opacity-100 transition-opacity"
												aria-label="Remove flier"
											>
												<X className="size-3.5" />
											</button>
										</>
									)}
								</>
							) : canEdit ? (
								<button
									type="button"
									className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-primary-100/50 dark:hover:bg-primary-900/30 transition-colors p-3 rounded-t-2xl rounded-b-none"
									onClick={() => flierInputRef.current?.click()}
									disabled={isUploadingFlier}
								>
									{isUploadingFlier ? (
										<Loader2 className="size-6 animate-spin text-primary" />
									) : (
										<>
											<AddFilesIcon className="size-12 mb-1.5 text-primary/80" />
											<span className="text-xs font-medium text-foreground">
												Upload Flier
											</span>
											<span className="text-[10px] text-muted-foreground mt-0.5">
												PNG, JPG or WebP
											</span>
										</>
									)}
								</button>
							) : (
								<div className="w-full h-full flex items-center justify-center p-3 rounded-t-2xl rounded-b-none">
									<AddFilesIcon className="size-14 text-muted-foreground/60" />
								</div>
							)}
						</div>

						{/* Event Details */}
						<div className="flex-1 min-w-0 flex flex-col justify-center space-y-3 pb-0 md:pb-6">

							{/* Title with inline edit */}
							{editingTitle ? (
								<div className="flex items-center gap-2 max-w-xl">
									<Input
										value={titleValue}
										onChange={(e) => setTitleValue(e.target.value)}
										className="text-xl sm:text-2xl font-bold bg-background"
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
								<div className="flex items-center gap-2.5">
									<button
										type="button"
										className={cn(
											"text-2xl sm:text-3xl font-black tracking-tight text-left text-foreground flex items-center gap-2 group",
											canEdit && "cursor-pointer hover:text-primary transition-colors",
										)}
										onClick={() => canEdit && setEditingTitle(true)}
									>
										<span>{event.title}</span>
										{canEdit && (
											<Pencil className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
										)}
									</button>
								</div>
							)}

							{/* Organization & Slug */}
							<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
								{organization?.name && (
									<span className="font-semibold text-foreground/80">
										{organization.name}
									</span>
								)}
								{event.slug && (
									<span className="font-mono text-muted-foreground">
										/{event.slug}
									</span>
								)}
							</div>

							{/* Date & Location Rows */}
							<div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground pt-0.5">
								{dateStr && (
									<div className="flex items-center gap-1.5 font-medium">
										<Calendar className="size-3.5 text-primary shrink-0" />
										<span>{dateStr}</span>
									</div>
								)}

								{(event.venueName || event.location) && (
									<div className="flex items-center gap-1.5 font-medium">
										<MapPin className="size-3.5 text-primary shrink-0" />
										<span>
											{[event.venueName, event.location]
												.filter(Boolean)
												.join(", ")}
										</span>
									</div>
								)}
							</div>

							{/* Action Buttons & Status Badges Row */}
							<div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
								{/* Left: Action Buttons */}
								<div className="flex flex-wrap items-center gap-2.5">
									{/* Primary Add Actions */}
									{canEdit && isTicketed && onAddTicket && (
										<Button
											size="sm"
											onClick={onAddTicket}
											className="gap-1.5 shadow-xs"
										>
											<Plus className="size-4" />
											Add Ticket Tier
										</Button>
									)}
									{canEdit && isVoting && onAddCategory && (
										<Button
											size="sm"
											onClick={onAddCategory}
											className="gap-1.5 shadow-xs"
										>
											<Plus className="size-4" />
											Add Category
										</Button>
									)}

									{/* Share Button */}
									<Button
										variant="outline"
										size="sm"
										onClick={handleShare}
										className="gap-1.5 bg-background/80 hover:bg-background"
									>
										<Share2 className="size-3.5" />
										Share
									</Button>

									{/* Publication Status Selector Dropdown */}
									{canEdit && (
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="outline"
													size="sm"
													className="gap-2 capitalize bg-background/80 hover:bg-background"
													disabled={isStatusChanging}
												>
													{isStatusChanging ? (
														<Loader2 className="size-3.5 animate-spin" />
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
															{event.status === "published"
																? "Published"
																: "Draft"}
															<ChevronDown className="size-3.5 text-muted-foreground" />
														</>
													)}
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													onClick={() =>
														handlePublicationStatusChange("draft")
													}
													className="gap-2 cursor-pointer"
												>
													<span className="size-2 rounded-full bg-yellow-500" />
													Draft
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() =>
														handlePublicationStatusChange("published")
													}
													className="gap-2 cursor-pointer"
												>
													<span className="size-2 rounded-full bg-green-500" />
													Published
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									)}

									{/* Public Link */}
									{event.slug && (
										<Button
											asChild
											variant="ghost"
											size="sm"
											className="gap-1.5 text-muted-foreground hover:text-foreground"
										>
											<Link
												href={`/${event.organization?.slug || organization?.slug || "org"}/event/${event.slug}` as any}
												target="_blank"
											>
												<ExternalLink className="size-3.5" />
												Public Page
											</Link>
										</Button>
									)}
								</div>

								{/* Right: Status Badges */}
								<div className="flex flex-wrap items-center gap-2">
									<StatusBadge
										variant={statusBadgeVariants[activeStatusKey] || "default"}
										text={activeStatusLabel}
									/>
									<StatusBadge variant={event.type} text={event.type} />
									{!event.isPublic && (
										<Badge variant="secondary" className="gap-1 text-xs font-medium">
											<EyeOff className="size-3" />
											Private
										</Badge>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Navigation Tabs Bar */}
				{onTabChange && (
					<div className="pt-1">
						<Tabs value={activeTab} onValueChange={onTabChange}>
							<TabsList
								variant="brand"
								className="grid grid-cols-2 sm:flex sm:inline-flex w-full sm:w-auto"
							>
								<TabsTrigger
									variant="brand"
									value="overview"
									className="gap-2 rounded"
								>
									<LayoutDashboard className="size-4" />
									Overview
								</TabsTrigger>

								{isTicketed && (
									<TabsTrigger
										variant="brand"
										value="tickets"
										className="gap-2 rounded"
									>
										<Ticket className="size-4" />
										Tickets ({ticketCount})
									</TabsTrigger>
								)}

								{isTicketed && (
									<TabsTrigger
										variant="brand"
										value="verification"
										className="gap-2 rounded"
									>
										<QrCode className="size-4" />
										Verification
									</TabsTrigger>
								)}

								{isVoting && (
									<TabsTrigger
										variant="brand"
										value="voting"
										className="gap-2 rounded"
									>
										<Vote className="size-4" />
										Voting ({votingCount})
									</TabsTrigger>
								)}

								{showMembers && (
									<TabsTrigger
										variant="brand"
										value="members"
										className="gap-2 rounded"
									>
										<Users className="size-4" />
										Members
									</TabsTrigger>
								)}

								<TabsTrigger
									variant="brand"
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

			{/* Payout Prompt Dialog */}
			<AlertDialog
				open={showPaymentPrompt}
				onOpenChange={setShowPaymentPrompt}
			>
				<AlertDialogContent variant="brand">
					<AlertDialogHeader>
						<AlertDialogTitle>Payout Account Required</AlertDialogTitle>
						<AlertDialogDescription>
							You need to set up an organization payout method (Mobile Money
							or Bank Account) before you can publish a paid event. This ensures
							you can receive earnings from ticket sales or votes.
							<em className="block text-center bg-secondary-100/50 mt-2 p-2 rounded">
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
