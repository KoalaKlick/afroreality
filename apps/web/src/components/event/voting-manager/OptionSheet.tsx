"use client";
// src/components/event/voting-manager/OptionSheet.tsx
import { useState, useTransition, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Loader2, Upload, X, Lock, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import {
	createVotingOption,
	requestNomineeChange,
	getSuggestedNomineeCode,
	sendNomineeWhatsAppConfirmation,
} from "@/lib/server-functions/voting-options";
import { useImageUpload } from "@/hooks/use-image-upload";
import { getEventImageUrl } from "@/lib/image-url-utils";
import AddFilesIcon from "@/assets/add-files.svg";
import { getErrorMessage } from "@/lib/utils";

export interface OptionItem {
	id: string;
	categoryId: string;
	optionText: string;
	email?: string | null;
	phone?: string | null;
	nomineeCode?: string | null;
	description?: string | null;
	imageUrl?: string | null;
	votesCount?: number | bigint;
	status?: string | null;
}

interface OptionSheetProps {
	readonly eventId: string;
	readonly categoryId: string;
	readonly categoryName: string;
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly editingOption: OptionItem | null;
	readonly onSaved?: () => void;
}

export function OptionSheet({
	eventId,
	categoryId,
	categoryName,
	open,
	onOpenChange,
	editingOption,
	onSaved,
}: OptionSheetProps) {
	const [isPending, startTransition] = useTransition();
	const [optionText, setOptionText] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [nomineeCode, setNomineeCode] = useState("");
	const [description, setDescription] = useState("");
	const [imageUrl, setImageUrl] = useState("");
	const [sendWhatsApp, setSendWhatsApp] = useState(true);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const { isUploading, upload } = useImageUpload({
		folder: "nominees",
		convertOptions: {
			quality: 0.85,
			maxWidth: 800,
			maxHeight: 800,
			maxSizeMB: 2,
		},
	});

	useEffect(() => {
		if (editingOption) {
			setOptionText(editingOption.optionText);
			setEmail(editingOption.email ?? "");
			setPhone(editingOption.phone ?? "");
			setNomineeCode(editingOption.nomineeCode ?? "");
			setDescription(editingOption.description ?? "");
			setImageUrl(editingOption.imageUrl ?? "");
			setSendWhatsApp(false); // Don't re-send on every edit unless explicitly re-checked
		} else {
			setOptionText("");
			setEmail("");
			setPhone("");
			setNomineeCode("");
			setDescription("");
			setImageUrl("");
			setSendWhatsApp(true); // Default true when adding a new nominee with phone

			// Auto-generate nominee code from category initials
			if (open && eventId && categoryId) {
				getSuggestedNomineeCode({ data: { eventId, categoryId } })
					.then((res) => {
						const result = res as { code?: string };
						if (result?.code) setNomineeCode(result.code);
					})
					.catch(() => {});
			}
		}
	}, [editingOption, open, eventId, categoryId]);

	const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const res = await upload(file);
			if (res) {
				setImageUrl(res.url);
			}
		}
	};

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!optionText.trim()) {
			toast.error("Nominee name is required");
			return;
		}

		startTransition(async () => {
			try {
				const cleanDesc =
					description && description.replace(/<[^>]*>/g, "").trim()
						? description.trim()
						: null;
				const cleanEmail = email.trim() || undefined;
				const cleanPhone = phone.trim() || undefined;

				if (editingOption) {
					// NOTE: nomineeCode is intentionally omitted when editing to prevent
					// breaking USSD routing, printed flyers, or triggering voting started errors.
					const res = await requestNomineeChange({
						data: {
							optionId: editingOption.id,
							requestType: "EDIT",
							proposedChanges: {
								optionText: optionText.trim(),
								email: cleanEmail,
								phone: cleanPhone,
								description: cleanDesc || undefined,
								imageUrl: imageUrl || undefined,
							},
						},
					});

					if (res.success === false) {
						toast.error(res.message || "Failed to update nominee.");
						return;
					}

					// If user checked send WhatsApp during edit
					if (sendWhatsApp && cleanPhone) {
						sendNomineeWhatsAppConfirmation({
							data: { optionId: editingOption.id },
						}).then((waRes) => {
							if (waRes.success) {
								toast.success(waRes.message || "WhatsApp nomination confirmation sent!");
							} else if (waRes.waUrl) {
								toast.info(waRes.error || "Click to open WhatsApp chat", {
									action: {
										label: "Open WhatsApp",
										onClick: () => window.open(waRes.waUrl, "_blank"),
									},
								});
							}
						}).catch(() => {});
					}

					if (res.requiresNomineeApproval) {
						toast.success(res.message || "Change request sent to nominee for approval.");
					} else {
						toast.success(res.message || "Nominee updated successfully.");
					}
				} else {
					await createVotingOption({
						data: {
							eventId,
							categoryId,
							optionText: optionText.trim(),
							email: cleanEmail,
							phone: cleanPhone,
							nomineeCode: nomineeCode.trim() || undefined,
							description: cleanDesc,
							imageUrl: imageUrl || undefined,
							sendWhatsAppConfirmation: sendWhatsApp && Boolean(cleanPhone),
						},
					});

					const notices: string[] = [];
					if (cleanEmail) notices.push(`Email confirmation sent to ${cleanEmail}`);
					if (sendWhatsApp && cleanPhone) notices.push(`WhatsApp confirmation sent to ${cleanPhone}`);

					toast.success(
						notices.length > 0
							? `Nominee added successfully. (${notices.join(" & ")})`
							: "Nominee added successfully.",
					);
				}

				onOpenChange(false);
				if (onSaved) onSaved();
			} catch (err) {
				const errMsg = getErrorMessage(err);
				toast.error(typeof errMsg === "string" ? errMsg : "An unexpected error occurred.");
			}
		});
	}

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-full sm:max-w-lg p-0 flex flex-col h-full overflow-hidden">
				<form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
					<SheetHeader className="shrink-0 p-6 pb-4 border-b">
						<SheetTitle>
							{editingOption ? "Edit Nominee / Option" : "Add Nominee / Option"}
						</SheetTitle>
						<SheetDescription>
							Category: <span className="font-semibold">{categoryName}</span>
						</SheetDescription>
					</SheetHeader>

					<div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
						{/* Photo Upload */}
						<div className="space-y-2">
							<Label>Nominee Photo (Optional)</Label>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								onChange={handleImageChange}
								className="hidden"
							/>
							{imageUrl ? (
								<div className="relative size-28 rounded-xl overflow-hidden border">
									<img
										src={getEventImageUrl(imageUrl) ?? ""}
										alt="Nominee"
										className="size-full object-cover"
									/>
									<button
										type="button"
										onClick={() => setImageUrl("")}
										className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
									>
										<X className="size-3.5" />
									</button>
								</div>
							) : (
								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									disabled={isUploading}
									className="size-28 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/60 flex flex-col items-center justify-center gap-1.5 text-muted-foreground transition-colors"
								>
									{isUploading ? (
										<Loader2 className="size-6 animate-spin" />
									) : (
										<>
											<AddFilesIcon className="size-8 text-primary/80 mb-0.5" />
											<span className="text-[10px] font-medium">Upload Photo</span>
										</>
									)}
								</button>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="option-name">Nominee Name / Option *</Label>
							<Input
								id="option-name"
								value={optionText}
								onChange={(e) => setOptionText(e.target.value)}
								placeholder="e.g., John Doe or Team Alpha"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="nominee-email">Nominee Email (Optional)</Label>
							<Input
								id="nominee-email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="e.g., nominee@example.com (optional)"
							/>
							<p className="text-xs text-muted-foreground">
								Optional. If provided, the nominee receives their voting code and update notices.
							</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="nominee-phone">Nominee Phone (Optional)</Label>
							<Input
								id="nominee-phone"
								type="tel"
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								placeholder="e.g., +233 24 123 4567"
							/>
							{phone.trim() && (
								<div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs mt-1.5">
									<Checkbox
										id="send-whatsapp-confirm"
										checked={sendWhatsApp}
										onCheckedChange={(checked) => setSendWhatsApp(Boolean(checked))}
										className="mt-0.5"
									/>
									<div className="space-y-0.5 leading-snug">
										<Label
											htmlFor="send-whatsapp-confirm"
											className="text-xs font-semibold text-emerald-950 dark:text-emerald-100 cursor-pointer flex items-center gap-1.5"
										>
											<MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
											Send WhatsApp nomination confirmation
										</Label>
										<p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
											Notifies candidate of their nomination, asks for their flyer picture, and includes organizer contact info.
										</p>
									</div>
								</div>
							)}
						</div>

						{/* Nominee Code Field: Editable when adding new; Locked/Disabled when editing */}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="nominee-code">Nominee Code</Label>
								{editingOption && (
									<span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
										<Lock className="size-2.5" />
										Locked
									</span>
								)}
							</div>
							<Input
								id="nominee-code"
								value={nomineeCode}
								onChange={(e) => setNomineeCode(e.target.value.toUpperCase())}
								placeholder="e.g., JD01"
								disabled={Boolean(editingOption)}
								readOnly={Boolean(editingOption)}
								className={
									editingOption
										? "bg-muted text-muted-foreground cursor-not-allowed opacity-85 select-none"
										: ""
								}
							/>
							{editingOption ? (
								<p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
									<Lock className="size-3 shrink-0" />
									Nominee code is permanent once created (preserves voting, flyers & USSD routing).
								</p>
							) : (
								<p className="text-xs text-muted-foreground">
									Used for USSD and quick vote identification. Auto-generated if left blank.
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label>Bio / Description (Optional)</Label>
							<RichTextEditor
								value={description}
								onChange={(val) => setDescription(val)}
								placeholder="Brief profile or details about this nominee..."
								minimal
							/>
						</div>
					</div>

					<SheetFooter className="px-6 py-4 border-t bg-muted/20 shrink-0 flex flex-row items-center justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isPending}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending || isUploading}>
							{isPending ? (
								<>
									<Loader2 className="mr-2 size-4 animate-spin" />
									Saving...
								</>
							) : editingOption ? (
								"Save Nominee"
							) : (
								"Add Nominee"
							)}
						</Button>
					</SheetFooter>
				</form>
			</SheetContent>
		</Sheet>
	);
}
