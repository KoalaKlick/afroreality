"use client";

import { useRouter } from "next/navigation";
import { UnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";
import {
	Calendar,
	EyeOff,
	Globe,
	Image as ImageIcon,
	Loader2,
	MapPin,
	Pencil,
	Plus,
	Share2,
	Trash2,
	Video,
} from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { AnimatedDeleteDialog } from "@/components/common/AnimatedDeleteDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Switch } from "@/components/ui/switch";
import { getEventImageUrl } from "@/lib/image-url-utils";
import {
	deleteExistingEvent,
	updateExistingEvent,
} from "@/lib/server-functions/event-mgmt";
import { cn, formatDate, getErrorMessage } from "@/lib/utils";
import { getGalleryProvider, getSocialPlatform } from "@/lib/utils/event-icons";

import { GalleryLinkDialog } from "./GalleryLinkDialog";
import { SocialLinkDialog } from "./SocialLinkDialog";
import { SponsorDialog } from "./SponsorDialog";
import { UssdSettings } from "@/components/event/settings/UssdSettings";
import type { EventGalleryLink, EventSocialLink, EventSponsor } from "./types";

interface EventSettingsTabProps {
	readonly event: any;
	readonly onRefresh?: () => void;
	readonly canEdit?: boolean;
}

export function EventSettingsTab({
	event,
	onRefresh,
	canEdit = true,
}: EventSettingsTabProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [isDeleting, setIsDeleting] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [editingSection, setEditingSection] = useState<string | null>(null);

	const [sponsorModalOpen, setSponsorModalOpen] = useState(false);
	const [selectedSponsor, setSelectedSponsor] =
		useState<EventSponsor | null>(null);
	const [socialModalOpen, setSocialModalOpen] = useState(false);
	const [selectedSocial, setSelectedSocial] =
		useState<EventSocialLink | null>(null);
	const [galleryModalOpen, setGalleryModalOpen] = useState(false);
	const [selectedGallery, setSelectedGallery] =
		useState<EventGalleryLink | null>(null);

	const [formData, setFormData] = useState({
		description: event.description ?? "",
		startDate: event.startDate
			? new Date(event.startDate).toISOString().slice(0, 16)
			: "",
		endDate: event.endDate
			? new Date(event.endDate).toISOString().slice(0, 16)
			: "",
		timezone: event.timezone ?? "Africa/Accra",
		isVirtual: event.isVirtual ?? false,
		virtualLink: event.virtualLink ?? "",
		venueName: event.venueName ?? "",
		venueAddress: event.venueAddress ?? "",
		venueCity: event.venueCity ?? "",
		venueCountry: event.venueCountry ?? "Ghana",
		isPublic: event.isPublic ?? true,
		hasUssd: event.hasUssd ?? false,
		ussdCode: event.ussdCode ?? null,
		maxAttendees: event.maxAttendees ? String(event.maxAttendees) : "",
		sponsors: (event.sponsors ?? []) as EventSponsor[],
		socialLinks: (event.socialLinks ?? []) as EventSocialLink[],
		galleryLinks: (event.galleryLinks ?? []) as EventGalleryLink[],
	});

	function saveFields(fields: Record<string, any>) {
		startTransition(async () => {
			try {
				await updateExistingEvent({ data: { id: event.id, ...fields } });
				toast.success("Settings saved");
				setEditingSection(null);
				if (onRefresh) onRefresh();
			} catch (err) {
				toast.error(getErrorMessage(err));
			}
		});
	}

	function handleDeleteEvent() {
		setIsDeleting(true);
		startTransition(async () => {
			try {
				await deleteExistingEvent({ data: { id: event.id } });
				toast.success("Event deleted");
				router.push("/my-events");
			} catch (err) {
				toast.error(getErrorMessage(err));
				setIsDeleting(false);
			}
		});
	}

	return (
		<>
			<UnsavedChangesGuard
				isDirty={editingSection !== null}
				isSaving={isPending}
				cancelGotoId={editingSection ? `save-section-${editingSection}` : undefined}
			/>
			<div className="space-y-6 w-full">
				{/* Description */}
				<Card className="p-6">
					<div className="flex items-center justify-between mb-4">
						<div>
							<h3 className="text-base font-semibold">Event Description</h3>
							<p className="text-xs text-muted-foreground">
								Detailed summary and schedule of the event
							</p>
						</div>
						{canEdit && editingSection !== "description" && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setEditingSection("description")}
							>
								<Pencil className="size-4 mr-2" /> Edit
							</Button>
						)}
					</div>
					{editingSection === "description" ? (
						<div className="space-y-4">
							<RichTextEditor
								value={formData.description}
								onChange={(val) =>
									setFormData((p) => ({ ...p, description: val }))
								}
								placeholder="Describe what attendees can expect..."
							/>
							<div className="flex justify-end gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										setFormData((p) => ({
											...p,
											description: event.description ?? "",
										}));
										setEditingSection(null);
									}}
								>
									Cancel
								</Button>
								<Button
									id="save-section-description"
									size="sm"
									onClick={() =>
										saveFields({
											description: formData.description || undefined,
										})
									}
									disabled={isPending}
								>
									{isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
									Save Description
								</Button>
							</div>
						</div>
					) : (
						<RichTextDisplay
							content={event.description}
							className="text-muted-foreground"
							fallback="No description provided."
						/>
					)}
				</Card>

				{/* Date & Time */}
				<Card className="p-6">
					<div className="flex items-center justify-between mb-4">
						<div>
							<h3 className="text-base font-semibold">Date &amp; Time</h3>
							<p className="text-xs text-muted-foreground">
								Event start, end time, and timezone
							</p>
						</div>
						{canEdit && editingSection !== "datetime" && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setEditingSection("datetime")}
							>
								<Pencil className="size-4 mr-2" /> Edit
							</Button>
						)}
					</div>
					{editingSection === "datetime" ? (
						<div className="space-y-4">
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label>Start Date &amp; Time</Label>
									<Input
										type="datetime-local"
										value={formData.startDate}
										onChange={(e) =>
											setFormData((p) => ({ ...p, startDate: e.target.value }))
										}
									/>
								</div>
								<div className="space-y-2">
									<Label>End Date &amp; Time</Label>
									<Input
										type="datetime-local"
										value={formData.endDate}
										min={formData.startDate}
										onChange={(e) =>
											setFormData((p) => ({ ...p, endDate: e.target.value }))
										}
									/>
								</div>
							</div>
							<div className="flex justify-end gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										setFormData((p) => ({
											...p,
											startDate: event.startDate
												? new Date(event.startDate).toISOString().slice(0, 16)
												: "",
											endDate: event.endDate
												? new Date(event.endDate).toISOString().slice(0, 16)
												: "",
										}));
										setEditingSection(null);
									}}
								>
									Cancel
								</Button>
								<Button
									id="save-section-datetime"
									size="sm"
									onClick={() =>
										saveFields({
											startDate: formData.startDate
												? new Date(formData.startDate).toISOString()
												: undefined,
											endDate: formData.endDate
												? new Date(formData.endDate).toISOString()
												: undefined,
										})
									}
									disabled={isPending}
								>
									{isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
									Save Dates
								</Button>
							</div>
						</div>
					) : (
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="p-3 rounded-lg border bg-muted/20 flex items-center gap-3">
								<Calendar className="size-5 text-primary shrink-0" />
								<div>
									<p className="font-semibold">
										{event.startDate
											? formatDate(event.startDate)
											: "Not configured"}
									</p>
									<p className="text-xs text-muted-foreground">Start Date</p>
								</div>
							</div>
							<div className="p-3 rounded-lg border bg-muted/20 flex items-center gap-3">
								<Calendar className="size-5 text-primary shrink-0" />
								<div>
									<p className="font-semibold">
										{event.endDate ? formatDate(event.endDate) : "Single day"}
									</p>
									<p className="text-xs text-muted-foreground">End Date</p>
								</div>
							</div>
						</div>
					)}
				</Card>

				{/* Location / Venue */}
				<Card className="p-6">
					<div className="flex items-center justify-between mb-4">
						<div>
							<h3 className="text-base font-semibold">Location &amp; Venue</h3>
							<p className="text-xs text-muted-foreground">
								Physical address or virtual event link
							</p>
						</div>
						{canEdit && editingSection !== "location" && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setEditingSection("location")}
							>
								<Pencil className="size-4 mr-2" /> Edit
							</Button>
						)}
					</div>
					{editingSection === "location" ? (
						<div className="space-y-4">
							<div className="flex items-center space-x-2 pb-2">
								<Switch
									id="isVirtual"
									checked={formData.isVirtual}
									onCheckedChange={(checked) =>
										setFormData((p) => ({ ...p, isVirtual: checked }))
									}
								/>
								<Label htmlFor="isVirtual" className="font-semibold cursor-pointer">
									This is a virtual event
								</Label>
							</div>

							{formData.isVirtual ? (
								<div className="space-y-2">
									<Label>Virtual Meeting / Streaming URL</Label>
									<Input
										placeholder="https://zoom.us/j/..."
										value={formData.virtualLink}
										onChange={(e) =>
											setFormData((p) => ({
												...p,
												virtualLink: e.target.value,
											}))
										}
									/>
								</div>
							) : (
								<div className="grid gap-4 sm:grid-cols-2">
									<div className="space-y-2 sm:col-span-2">
										<Label>Venue Name</Label>
										<Input
											placeholder="e.g. Accra International Conference Centre"
											value={formData.venueName}
											onChange={(e) =>
												setFormData((p) => ({
													...p,
													venueName: e.target.value,
												}))
											}
										/>
									</div>
									<div className="space-y-2">
										<Label>City</Label>
										<Input
											placeholder="Accra"
											value={formData.venueCity}
											onChange={(e) =>
												setFormData((p) => ({
													...p,
													venueCity: e.target.value,
												}))
											}
										/>
									</div>
									<div className="space-y-2">
										<Label>Country</Label>
										<Input
											placeholder="Ghana"
											value={formData.venueCountry}
											onChange={(e) =>
												setFormData((p) => ({
													...p,
													venueCountry: e.target.value,
												}))
											}
										/>
									</div>
									<div className="space-y-2 sm:col-span-2">
										<Label>Street Address</Label>
										<Input
											placeholder="Castle Road, Osu"
											value={formData.venueAddress}
											onChange={(e) =>
												setFormData((p) => ({
													...p,
													venueAddress: e.target.value,
												}))
											}
										/>
									</div>
								</div>
							)}

							<div className="flex justify-end gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										setFormData((p) => ({
											...p,
											isVirtual: event.isVirtual ?? false,
											virtualLink: event.virtualLink ?? "",
											venueName: event.venueName ?? "",
											venueCity: event.venueCity ?? "",
											venueCountry: event.venueCountry ?? "Ghana",
											venueAddress: event.venueAddress ?? "",
										}));
										setEditingSection(null);
									}}
								>
									Cancel
								</Button>
								<Button
									id="save-section-location"
									size="sm"
									onClick={() =>
										saveFields({
											isVirtual: formData.isVirtual,
											virtualLink: formData.isVirtual
												? formData.virtualLink || undefined
												: undefined,
											venueName: !formData.isVirtual
												? formData.venueName || undefined
												: undefined,
											venueCity: !formData.isVirtual
												? formData.venueCity || undefined
												: undefined,
											venueCountry: !formData.isVirtual
												? formData.venueCountry || undefined
												: undefined,
											venueAddress: !formData.isVirtual
												? formData.venueAddress || undefined
												: undefined,
										})
									}
									disabled={isPending}
								>
									{isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
									Save Location
								</Button>
							</div>
						</div>
					) : (
						<div className="p-3 rounded-lg border bg-muted/20 flex items-center gap-3">
							{event.isVirtual ? (
								<>
									<Video className="size-5 text-primary shrink-0" />
									<div>
										<p className="font-semibold">Virtual Event</p>
										<p className="text-xs text-muted-foreground truncate max-w-sm">
											{event.virtualLink || "Link to be provided"}
										</p>
									</div>
								</>
							) : (
								<>
									<MapPin className="size-5 text-primary shrink-0" />
									<div>
										<p className="font-semibold">
											{event.venueName || "Venue TBD"}
										</p>
										<p className="text-xs text-muted-foreground">
											{[
												event.venueAddress,
												event.venueCity,
												event.venueCountry,
											]
												.filter(Boolean)
												.join(", ") || "No physical address provided"}
										</p>
									</div>
								</>
							)}
						</div>
					)}
				</Card>

				{/* Privacy & Visibility */}
				<Card className="p-6">
					<div className="flex items-center justify-between mb-4">
						<div>
							<h3 className="text-base font-semibold">Visibility &amp; Capacity</h3>
							<p className="text-xs text-muted-foreground">
								Public listing and maximum attendees
							</p>
						</div>
						{canEdit && editingSection !== "visibility" && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setEditingSection("visibility")}
							>
								<Pencil className="size-4 mr-2" /> Edit
							</Button>
						)}
					</div>
					{editingSection === "visibility" ? (
						<div className="space-y-4">
							<div className="flex items-center justify-between p-3 rounded-lg border">
								<div className="space-y-0.5">
									<Label className="text-sm font-semibold">Public Listing</Label>
									<p className="text-xs text-muted-foreground">
										Show this event on your public organization profile
									</p>
								</div>
								<Switch
									checked={formData.isPublic}
									onCheckedChange={(checked) =>
										setFormData((p) => ({ ...p, isPublic: checked }))
									}
								/>
							</div>

							<div className="space-y-2">
								<Label>Maximum Attendees (Optional)</Label>
								<Input
									type="number"
									placeholder="e.g. 500"
									value={formData.maxAttendees}
									onChange={(e) =>
										setFormData((p) => ({ ...p, maxAttendees: e.target.value }))
									}
								/>
							</div>

							<div className="flex justify-end gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										setFormData((p) => ({
											...p,
											isPublic: event.isPublic ?? true,
											maxAttendees: event.maxAttendees
												? String(event.maxAttendees)
												: "",
										}));
										setEditingSection(null);
									}}
								>
									Cancel
								</Button>
								<Button
									id="save-section-visibility"
									size="sm"
									onClick={() =>
										saveFields({
											isPublic: formData.isPublic,
											maxAttendees: formData.maxAttendees
												? Number(formData.maxAttendees)
												: null,
										})
									}
									disabled={isPending}
								>
									{isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
									Save Visibility
								</Button>
							</div>
						</div>
					) : (
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="p-3 rounded-lg border bg-muted/20 flex items-center gap-3">
								{event.isPublic ? (
									<Globe className="size-5 text-primary shrink-0" />
								) : (
									<EyeOff className="size-5 text-muted-foreground shrink-0" />
								)}
								<div>
									<p className="font-semibold">
										{event.isPublic ? "Public Event" : "Private / Unlisted"}
									</p>
									<p className="text-xs text-muted-foreground">
										{event.isPublic
											? "Listed on your public page"
											: "Only accessible via direct organizer link"}
									</p>
								</div>
							</div>
							<div className="p-3 rounded-lg border bg-muted/20 flex items-center gap-3">
								<Calendar className="size-5 text-primary shrink-0" />
								<div>
									<p className="font-semibold">
										{event.maxAttendees
											? `${event.maxAttendees} Attendees`
											: "Unlimited Capacity"}
									</p>
									<p className="text-xs text-muted-foreground">Maximum capacity</p>
								</div>
							</div>
						</div>
					)}
				</Card>

				{/* USSD Settings Section */}
				<UssdSettings
					eventId={event.id}
					hasUssd={event.hasUssd}
					ussdCode={event.ussdCode}
					canEdit={canEdit}
					onUpdated={(hasUssd, ussdCode) => {
						setFormData((prev) => ({ ...prev, hasUssd, ussdCode }));
						if (onRefresh) onRefresh();
					}}
				/>

				{/* Sponsors */}
				<Card className="p-6">
					<div className="flex items-center justify-between mb-4">
						<div className="space-y-1">
							<h3 className="text-base font-semibold flex items-center gap-2">
								<Plus className="size-4 text-primary" /> Sponsors
							</h3>
							<p className="text-xs text-muted-foreground">
								Showcase partnering organizations &amp; sponsors
							</p>
						</div>
						{canEdit && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									setSelectedSponsor(null);
									setSponsorModalOpen(true);
								}}
								disabled={isPending}
							>
								<Plus className="size-4 mr-2" /> Add Sponsor
							</Button>
						)}
					</div>
					<div className="flex gap-4 flex-wrap">
						{formData.sponsors.map((sponsor, index) => (
							<div
								key={sponsor.id || index}
								className="group relative p-4 rounded-xl border bg-card hover:border-primary/50 transition-all flex flex-col items-center gap-2 text-center w-32"
							>
								<div className="size-16 rounded-lg border bg-muted flex items-center justify-center overflow-hidden">
									{sponsor.logo ? (
										<img
											src={getEventImageUrl(sponsor.logo) ?? ""}
											alt={sponsor.name}
											className="size-full object-contain p-2"
										/>
									) : (
										<ImageIcon className="size-6 text-muted-foreground opacity-30" />
									)}
								</div>
								<h4 className="text-xs font-bold truncate w-full">
									{sponsor.name}
								</h4>
								{canEdit && (
									<div className="flex gap-1 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
										<Button
											variant="outline"
											size="icon"
											className="size-6 rounded-md bg-background/80"
											onClick={() => {
												setSelectedSponsor(sponsor);
												setSponsorModalOpen(true);
											}}
										>
											<Pencil className="size-3" />
										</Button>
										<Button
											variant="outline"
											size="icon"
											className="size-6 rounded-md bg-background/80 text-destructive hover:text-destructive"
											onClick={() => {
												const newSponsors = formData.sponsors.filter(
													(_, i) => i !== index,
												);
												setFormData((p) => ({ ...p, sponsors: newSponsors }));
												saveFields({
													sponsors: newSponsors.map((s) => ({
														name: s.name,
														logo: s.logo || undefined,
													})),
												});
											}}
										>
											<Trash2 className="size-3" />
										</Button>
									</div>
								)}
							</div>
						))}
						{formData.sponsors.length === 0 && (
							<div className="w-full py-8 border border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground gap-2 bg-muted/10">
								<ImageIcon className="size-8 opacity-20" />
								<p className="text-sm">No sponsors added yet</p>
							</div>
						)}
					</div>
				</Card>

				{/* Social Links */}
				<Card className="p-6">
					<div className="flex items-center justify-between mb-4">
						<div className="space-y-1">
							<h3 className="text-base font-semibold flex items-center gap-2">
								<Share2 className="size-4 text-primary" /> Organization Socials
							</h3>
							<p className="text-xs text-muted-foreground">
								Connect attendees to your social handles
							</p>
						</div>
						{canEdit && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									setSelectedSocial(null);
									setSocialModalOpen(true);
								}}
								disabled={isPending}
							>
								<Plus className="size-4 mr-2" /> Add Social
							</Button>
						)}
					</div>
					<div className="flex flex-wrap gap-3">
						{formData.socialLinks.map((link, index) => {
							const platform = getSocialPlatform(link.url);
							return (
								<div
									key={link.id || index}
									className="flex items-center gap-3 p-3 border rounded-xl bg-card max-w-xs group relative"
								>
									<div className="size-9 rounded-lg bg-muted border flex items-center justify-center shrink-0">
										{platform.icon}
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
											{platform.name}
										</p>
										<a
											href={link.url}
											target="_blank"
											rel="noopener noreferrer"
											className="text-xs italic truncate block text-primary hover:underline max-w-[140px]"
										>
											{link.url}
										</a>
									</div>
									{canEdit && (
										<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
											<Button
												variant="ghost"
												size="icon"
												className="size-7"
												onClick={() => {
													setSelectedSocial(link);
													setSocialModalOpen(true);
												}}
											>
												<Pencil className="size-3" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="size-7 text-destructive hover:text-destructive"
												onClick={() => {
													const newLinks = formData.socialLinks.filter(
														(_, i) => i !== index,
													);
													setFormData((p) => ({
														...p,
														socialLinks: newLinks,
													}));
													saveFields({
														socialLinks: newLinks.map((l) => ({ url: l.url })),
													});
												}}
											>
												<Trash2 className="size-3" />
											</Button>
										</div>
									)}
								</div>
							);
						})}
						{formData.socialLinks.length === 0 && (
							<div className="w-full py-6 text-center text-sm text-muted-foreground italic bg-muted/10 rounded-xl border border-dashed">
								No social links added yet
							</div>
						)}
					</div>
				</Card>

				{/* Photo Gallery */}
				<Card className="p-6">
					<div className="flex items-center justify-between mb-4">
						<div className="space-y-1">
							<h3 className="text-base font-semibold flex items-center gap-2">
								<ImageIcon className="size-4 text-primary" /> Photo Gallery
								Links
							</h3>
							<p className="text-xs text-muted-foreground">
								Share external albums (Google Drive, Pixieset, etc.)
							</p>
						</div>
						{canEdit && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									setSelectedGallery(null);
									setGalleryModalOpen(true);
								}}
								disabled={isPending}
							>
								<Plus className="size-4 mr-2" /> Add Album
							</Button>
						)}
					</div>
					<div className="flex flex-wrap gap-3">
						{formData.galleryLinks.map((link, index) => {
							const provider = getGalleryProvider(link.url);
							return (
								<div
									key={link.id || index}
									className="flex items-center gap-3 p-3 border rounded-xl bg-card max-w-xs group relative"
								>
									<div className="size-9 rounded-lg bg-muted border flex items-center justify-center shrink-0">
										{provider.icon}
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-xs font-semibold truncate">
											{link.name}
										</p>
										<a
											href={link.url}
											target="_blank"
											rel="noopener noreferrer"
											className="text-xs italic truncate block text-primary hover:underline max-w-[140px]"
										>
											{link.url}
										</a>
									</div>
									{canEdit && (
										<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
											<Button
												variant="ghost"
												size="icon"
												className="size-7"
												onClick={() => {
													setSelectedGallery(link);
													setGalleryModalOpen(true);
												}}
											>
												<Pencil className="size-3" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="size-7 text-destructive hover:text-destructive"
												onClick={() => {
													const newGalleries = formData.galleryLinks.filter(
														(_, i) => i !== index,
													);
													setFormData((p) => ({
														...p,
														galleryLinks: newGalleries,
													}));
													saveFields({
														galleryLinks: newGalleries.map((g) => ({
															name: g.name,
															url: g.url,
														})),
													});
												}}
											>
												<Trash2 className="size-3" />
											</Button>
										</div>
									)}
								</div>
							);
						})}
						{formData.galleryLinks.length === 0 && (
							<div className="w-full py-6 text-center text-sm text-muted-foreground italic bg-muted/10 rounded-xl border border-dashed">
								No photo gallery links added yet
							</div>
						)}
					</div>
				</Card>

				{/* Danger Zone */}
				{canEdit && (
					<Card className="p-6 border-destructive/40 bg-destructive/5">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
							<div className="space-y-1">
								<h3 className="text-base font-semibold text-destructive">
									Delete Event
								</h3>
								<p className="text-xs text-muted-foreground">
									Permanently remove this event and all associated tickets,
									categories, and votes.
								</p>
							</div>
							<Button
								type="button"
								variant="destructive"
								onClick={() => setShowDeleteDialog(true)}
								disabled={isPending || isDeleting}
							>
								<Trash2 className="size-4 mr-2" /> Delete Event
							</Button>
						</div>
					</Card>
				)}

				{/* Modals */}
				<SponsorDialog
					open={sponsorModalOpen}
					onOpenChange={setSponsorModalOpen}
					sponsor={selectedSponsor}
					onSave={(sponsorData) => {
						let newSponsors: EventSponsor[] = [];
						if (selectedSponsor) {
							newSponsors = formData.sponsors.map((s) =>
								s.name === selectedSponsor.name ? sponsorData : s,
							);
						} else {
							newSponsors = [...formData.sponsors, sponsorData];
						}
						setFormData((p) => ({ ...p, sponsors: newSponsors }));
						saveFields({
							sponsors: newSponsors.map((s) => ({
								name: s.name,
								logo: s.logo || undefined,
							})),
						});
						setSponsorModalOpen(false);
					}}
					isPending={isPending}
				/>

				<SocialLinkDialog
					open={socialModalOpen}
					onOpenChange={setSocialModalOpen}
					link={selectedSocial}
					onSave={(url) => {
						let newLinks: EventSocialLink[] = [];
						if (selectedSocial) {
							newLinks = formData.socialLinks.map((l) =>
								l.url === selectedSocial.url ? { url } : l,
							);
						} else {
							newLinks = [...formData.socialLinks, { url }];
						}
						setFormData((p) => ({ ...p, socialLinks: newLinks }));
						saveFields({ socialLinks: newLinks.map((l) => ({ url: l.url })) });
						setSocialModalOpen(false);
					}}
					isPending={isPending}
				/>

				<GalleryLinkDialog
					open={galleryModalOpen}
					onOpenChange={setGalleryModalOpen}
					link={selectedGallery}
					onSave={(galleryData) => {
						let newGalleries: EventGalleryLink[] = [];
						if (selectedGallery) {
							newGalleries = formData.galleryLinks.map((g) =>
								g.name === selectedGallery.name ? galleryData : g,
							);
						} else {
							newGalleries = [...formData.galleryLinks, galleryData];
						}
						setFormData((p) => ({ ...p, galleryLinks: newGalleries }));
						saveFields({
							galleryLinks: newGalleries.map((g) => ({
								name: g.name,
								url: g.url,
							})),
						});
						setGalleryModalOpen(false);
					}}
					isPending={isPending}
				/>

				<AnimatedDeleteDialog
					isOpen={showDeleteDialog}
					isDeleting={isDeleting}
					onOpenChange={setShowDeleteDialog}
					onConfirm={handleDeleteEvent}
					title="Delete Event"
					itemName={event.title}
					itemType="Event"
					description={`This will permanently delete "${event.title}" and all associated ticket sales and voting records. This action cannot be undone.`}
				/>
			</div>
		</>
	);
}
