"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X, Mail, Loader2, Calendar, User, Sparkles } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { formatDate } from "@/lib/utils";
import { resendNominationEmail } from "@/lib/server-functions/voting-options";
import { toast } from "sonner";
import type { NominationOption } from "./NominationRequestsSheet";

interface NominationDetailsDialogProps {
	readonly selectedOption: {
		option: NominationOption;
		categoryName: string;
	} | null;
	readonly onClose: () => void;
	readonly onApprove?: (optionId: string) => void;
	readonly onReject?: (optionId: string) => void;
	readonly isPending?: boolean;
}

export function NominationDetailsDialog({
	selectedOption,
	onClose,
	onApprove,
	onReject,
	isPending = false,
}: NominationDetailsDialogProps) {
	const [isSendingEmail, setIsSendingEmail] = useState(false);

	if (!selectedOption) return null;
	const { option, categoryName } = selectedOption;

	const handleResend = async () => {
		setIsSendingEmail(true);
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
			toast.error(err.message || "Failed to resend confirmation email");
		} finally {
			setIsSendingEmail(false);
		}
	};

	const recipientEmail = option.nominatedByEmail || option.email;

	return (
		<Dialog open={!!selectedOption} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col p-6">
				<DialogHeader className="shrink-0 space-y-1">
					<div className="flex items-center justify-between gap-2 pr-6">
						<DialogTitle className="text-xl font-black uppercase tracking-tight">
							Nomination Details
						</DialogTitle>
						<StatusBadge variant={(option.status as any) || "pending"} size="sm" />
					</div>
					<DialogDescription className="text-xs text-muted-foreground">
						Review candidate submission details and nominator information.
					</DialogDescription>
				</DialogHeader>

				<div className="flex-1 overflow-y-auto space-y-5 pr-1 py-3">
					{/* Nominee Header Card */}
					<div className="flex items-start gap-4 p-4 rounded-xl bg-muted/40 border border-border/60">
						<Avatar className="size-16 rounded-xl border shrink-0">
							<AvatarImage
								src={getEventImageUrl(option.imageUrl) ?? undefined}
								alt={option.optionText}
								className="object-cover"
							/>
							<AvatarFallback className="rounded-xl text-lg font-bold">
								{option.optionText.slice(0, 2).toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<div className="flex-1 min-w-0 space-y-1">
							<h3 className="text-base font-black text-foreground truncate">
								{option.optionText}
							</h3>
							<div className="flex flex-wrap items-center gap-2">
								<Badge variant="secondary" className="text-xs font-semibold">
									{categoryName}
								</Badge>
								{option.nomineeCode && (
									<span className="text-xs font-mono font-bold text-primary">
										#{option.nomineeCode}
									</span>
								)}
							</div>
							{option.email && (
								<p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate">
									<Mail className="size-3" />
									<span>{option.email}</span>
								</p>
							)}
						</div>
					</div>

					{/* Why Vote For Me / Statement */}
					<div className="space-y-2 rounded-xl p-4 bg-muted/20 border border-border/60">
						<h5 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
							<Sparkles className="size-3.5 text-primary" />
							<span>Nominee Statement / Bio</span>
						</h5>
						{option.description ? (
							<RichTextDisplay
								content={option.description}
								className="text-xs text-muted-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none"
							/>
						) : (
							<p className="text-xs text-muted-foreground italic">
								No statement or bio provided by the nominator.
							</p>
						)}
					</div>

					{/* Nominator Information */}
					<div className="rounded-xl p-4 bg-muted/20 border border-border/60 space-y-3">
						<h5 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
							<User className="size-3.5 text-primary" />
							<span>Nominator Information</span>
						</h5>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
							<div>
								<span className="text-muted-foreground block text-[11px] font-semibold uppercase">
									Submitted By
								</span>
								<span className="font-semibold text-foreground">
									{option.nominatedByName || "Self-Nominated / Guest"}
								</span>
							</div>

							<div>
								<span className="text-muted-foreground block text-[11px] font-semibold uppercase">
									Contact Email
								</span>
								<span className="font-semibold text-foreground truncate block">
									{option.nominatedByEmail || option.email || "None provided"}
								</span>
							</div>

							<div>
								<span className="text-muted-foreground block text-[11px] font-semibold uppercase">
									Submitted On
								</span>
								<span className="font-medium text-foreground flex items-center gap-1 mt-0.5">
									<Calendar className="size-3 text-muted-foreground" />
									{formatDate(option.createdAt)}
								</span>
							</div>
						</div>
					</div>
				</div>

				<DialogFooter className="pt-3 border-t border-border/80 flex sm:flex-row items-center justify-between gap-2 shrink-0">
					{recipientEmail ? (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={handleResend}
							disabled={isSendingEmail}
							className="text-xs gap-1.5"
						>
							{isSendingEmail ? (
								<Loader2 className="size-3.5 animate-spin" />
							) : (
								<Mail className="size-3.5" />
							)}
							<span>Resend Email</span>
						</Button>
					) : (
						<div />
					)}

					<div className="flex items-center gap-2">
						{option.status === "pending" && (
							<>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => {
										onReject?.(option.id);
										onClose();
									}}
									disabled={isPending}
									className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
								>
									<X className="size-3.5" />
									<span>Reject</span>
								</Button>
								<Button
									type="button"
									size="sm"
									onClick={() => {
										onApprove?.(option.id);
										onClose();
									}}
									disabled={isPending}
									className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
								>
									<Check className="size-3.5" />
									<span>Approve</span>
								</Button>
							</>
						)}
						<Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-xs">
							Close
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
