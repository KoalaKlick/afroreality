"use client";

import { useState, useTransition, useCallback, useRef } from "react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
	Loader2,
	PlusCircle,
	CheckCircle2,
	XCircle,
	X,
	CreditCard,
	Sparkles,
} from "lucide-react";
import AddFilesIcon from "@/assets/add-files.svg";
import { toast } from "sonner";
import { useImageUpload } from "@/hooks/use-image-upload";
import { initiatePublicNomination } from "@/lib/server-functions/public-checkout";
import type { VotingCategory } from "@/lib/types/voting";

interface PublicNominationModalProps {
	readonly eventId: string;
	readonly category: VotingCategory;
	readonly orgSlug?: string;
	readonly eventSlug?: string;
	readonly trigger?: React.ReactNode;
	readonly brandVars?: React.CSSProperties;
}

type PayStep = "checkout" | "processing" | "success" | "error";

export function PublicNominationModal({
	eventId,
	category,
	orgSlug,
	eventSlug,
	trigger,
	brandVars,
}: PublicNominationModalProps) {
	const [sheetOpen, setSheetOpen] = useState(false);
	const [isPending, startTransition] = useTransition();

	const nominationPrice = Number(category.nominationPrice || 0);
	const isPaid = nominationPrice > 0;

	// ── Confirmation dialog state ──
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);
	const [payStep, setPayStep] = useState<PayStep>("checkout");
	const [loading, setLoading] = useState(false);
	const [errorMsg, setErrorMsg] = useState("");

	// ── Form fields ──
	const [candidateName, setCandidateName] = useState("");
	const [candidateEmail, setCandidateEmail] = useState("");
	const [candidateBio, setCandidateBio] = useState("");
	const [nominatorName, setNominatorName] = useState("");
	const [nominatorEmail, setNominatorEmail] = useState("");

	const [pendingFile, setPendingFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [finalUploadedUrl, setFinalUploadedUrl] = useState<string | null>(null);
	const imageInputRef = useRef<HTMLInputElement>(null);

	const { isUploading, upload } = useImageUpload({
		folder: "nominees",
		convertOptions: {
			quality: 0.85,
			maxWidth: 800,
			maxHeight: 800,
			maxSizeMB: 1,
		},
	});

	const resetForm = useCallback(() => {
		setCandidateName("");
		setCandidateEmail("");
		setCandidateBio("");
		setNominatorName("");
		setNominatorEmail("");
		setPendingFile(null);
		setPreviewUrl(null);
		setFinalUploadedUrl(null);
		setPayStep("checkout");
		setLoading(false);
		setErrorMsg("");
		setShowConfirmDialog(false);
	}, []);

	const handleSheetOpenChange = useCallback(
		(nextOpen: boolean) => {
			if (!nextOpen) resetForm();
			setSheetOpen(nextOpen);
		},
		[resetForm],
	);

	const handleImageChange = (file: File) => {
		setPendingFile(file);
		const url = URL.createObjectURL(file);
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		setPreviewUrl(url);
	};

	const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

	const isCandidateNameValid = candidateName.trim().length >= 2;
	const isCandidateEmailValid = !candidateEmail.trim() || isValidEmail(candidateEmail);
	const isNominatorEmailValid = isPaid
		? isValidEmail(nominatorEmail)
		: !nominatorEmail.trim() || isValidEmail(nominatorEmail);

	const isFormValid = isCandidateNameValid && isCandidateEmailValid && isNominatorEmailValid;

	// ── Step 1: Submit Form to Review / Confirm Dialog ──
	const handleFormSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!isCandidateNameValid) {
			toast.error("Please provide the candidate's name (at least 2 characters).");
			return;
		}
		if (candidateEmail.trim() && !isValidEmail(candidateEmail)) {
			toast.error("Please enter a valid candidate email address.");
			return;
		}
		if (isPaid && !isValidEmail(nominatorEmail)) {
			toast.error("A valid email address is required for paid nomination receipts.");
			return;
		}
		if (nominatorEmail.trim() && !isValidEmail(nominatorEmail)) {
			toast.error("Please enter a valid email address.");
			return;
		}

		startTransition(async () => {
			let uploadedUrl = finalUploadedUrl;
			if (pendingFile && !uploadedUrl) {
				const uploadRes = await upload(pendingFile);
				if (uploadRes?.url) {
					uploadedUrl = uploadRes.url;
					setFinalUploadedUrl(uploadRes.url);
				}
			}

			setPayStep("checkout");
			setShowConfirmDialog(true);
		});
	};

	// ── Step 2: Finalize Submission (Free or Redirect to Paystack) ──
	const handleConfirmSubmission = async () => {
		setLoading(true);
		setErrorMsg("");
		setPayStep("processing");

		try {
			const cleanBio =
				candidateBio && candidateBio.replace(/<[^>]*>/g, "").trim()
					? candidateBio.trim()
					: undefined;

			const res = await initiatePublicNomination({
				data: {
					eventId,
					categoryId: category.id,
					nomineeName: candidateName.trim(),
					nomineeEmail: candidateEmail.trim() || undefined,
					nomineeBio: cleanBio,
					nomineeImageUrl: finalUploadedUrl || undefined,
					nominatorName: nominatorName.trim() || undefined,
					nominatorEmail: nominatorEmail.trim() || undefined,
					orgSlug,
					eventSlug,
				},
			});

			if (!res || !res.success) {
				setPayStep("error");
				setErrorMsg(res?.error || "Failed to submit nomination.");
				return;
			}

			if (res.isFree) {
				setPayStep("success");
				toast.success("Nomination submitted successfully!");
			} else if (res.authorizationUrl) {
				// Redirect to Paystack payment gateway
				window.location.href = res.authorizationUrl;
			} else {
				setPayStep("error");
				setErrorMsg("Unable to initialize payment gateway.");
			}
		} catch (err: any) {
			console.error("Nomination submission error:", err);
			setPayStep("error");
			setErrorMsg(err.message || "An unexpected error occurred.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			{/* ── Public Nomination Form Sheet ── */}
			<Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
				<SheetTrigger asChild>
					{trigger || (
						<Button variant="outline" size="sm" className="text-xs gap-1.5 h-8">
							<PlusCircle className="size-3.5 text-primary" />
							<span>Nominate Candidate</span>
						</Button>
					)}
				</SheetTrigger>

				<SheetContent
					className="sm:max-w-lg flex flex-col h-full p-0 sm:p-6 overflow-y-auto"
					style={brandVars}
				>
					<SheetHeader className="p-6 sm:p-0 shrink-0">
						<SheetTitle className="text-lg font-bold">Nominate Candidate</SheetTitle>
						<SheetDescription className="text-xs">
							Submit a candidate for consideration in <strong>{category.name}</strong>.
							{isPaid ? (
								<span className="block mt-1 font-bold text-primary">
									Nomination Fee: GHS {nominationPrice.toFixed(2)}
								</span>
							) : (
								<span className="block mt-1 font-medium text-emerald-600">
									Free Nomination
								</span>
							)}
						</SheetDescription>
					</SheetHeader>

					<form onSubmit={handleFormSubmit} className="flex-1 space-y-4 px-6 sm:px-0 py-2">
						{/* Nominee Photo (Optional) */}
						<div className="space-y-2">
							<Label className="text-xs font-semibold">Candidate Photo (Optional)</Label>
							<input
								ref={imageInputRef}
								type="file"
								accept="image/jpeg,image/png,image/webp"
								className="hidden"
								onChange={(e) => {
									const file = e.target.files?.[0];
									if (file) handleImageChange(file);
									e.target.value = "";
								}}
							/>
							{previewUrl ? (
								<div className="relative size-28 rounded-xl overflow-hidden border bg-muted">
									<img
										src={previewUrl}
										alt="Candidate Preview"
										className="size-full object-cover"
									/>
									<button
										type="button"
										onClick={() => {
											setPendingFile(null);
											setPreviewUrl(null);
											setFinalUploadedUrl(null);
											if (imageInputRef.current) imageInputRef.current.value = "";
										}}
										className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
										title="Remove photo"
									>
										<X className="size-3.5" />
									</button>
								</div>
							) : (
								<button
									type="button"
									onClick={() => imageInputRef.current?.click()}
									disabled={isUploading}
									className="size-28 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/60 flex flex-col items-center justify-center gap-1.5 text-muted-foreground transition-colors cursor-pointer"
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
							<p className="text-[11px] text-muted-foreground">
								JPG, PNG or WebP up to 5MB.
							</p>
						</div>

						{/* Candidate Name */}
						<div className="space-y-1.5">
							<Label htmlFor="candidate-name" className="text-xs">
								Candidate / Nominee Name *
							</Label>
							<Input
								id="candidate-name"
								placeholder="e.g. Kwame Mensah"
								value={candidateName}
								onChange={(e) => setCandidateName(e.target.value)}
								className="h-9 text-xs"
								required
								disabled={isPending || isUploading}
							/>
						</div>

						{/* Candidate Email */}
						<div className="space-y-1.5">
							<Label htmlFor="candidate-email" className="text-xs">
								Candidate Email (Optional)
							</Label>
							<Input
								id="candidate-email"
								type="email"
								placeholder="kwame@example.com (to notify nominee)"
								value={candidateEmail}
								onChange={(e) => setCandidateEmail(e.target.value)}
								className="h-9 text-xs"
								disabled={isPending || isUploading}
							/>
						</div>

						{/* Candidate Bio / Description */}
						<div className="space-y-1.5">
							<Label htmlFor="candidate-bio" className="text-xs">
								Why should they win? (Bio / Description)
							</Label>
							<RichTextEditor
								value={candidateBio}
								onChange={(val) => setCandidateBio(val)}
								placeholder="Highlight accomplishments, contributions, or why this candidate stands out..."
								minimal
								minHeight="min-h-[100px]"
								disabled={isPending || isUploading}
							/>
						</div>

						{/* Nominator Information */}
						<div className="border-t pt-3 space-y-3">
							<h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
								Your Details (Nominator)
							</h5>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div className="space-y-1.5">
									<Label htmlFor="nominator-name" className="text-xs">
										Your Name (Optional)
									</Label>
									<Input
										id="nominator-name"
										placeholder="e.g. Jane Doe"
										value={nominatorName}
										onChange={(e) => setNominatorName(e.target.value)}
										className="h-9 text-xs"
										disabled={isPending || isUploading}
									/>
								</div>

								<div className="space-y-1.5">
									<Label htmlFor="nominator-email" className="text-xs">
										Your Email {isPaid ? "*" : "(Optional)"}
									</Label>
									<Input
										id="nominator-email"
										type="email"
										placeholder="jane@example.com"
										value={nominatorEmail}
										onChange={(e) => setNominatorEmail(e.target.value)}
										className="h-9 text-xs"
										required={isPaid}
										disabled={isPending || isUploading}
									/>
								</div>
							</div>
							{isPaid && (
								<p className="text-[11px] text-muted-foreground">
									Required for your payment receipt and nomination exit key.
								</p>
							)}
						</div>

						<div className="flex justify-end gap-2 pt-4 pb-4 border-t">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => handleSheetOpenChange(false)}
								disabled={isPending || isUploading}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								size="sm"
								disabled={isPending || isUploading || !isFormValid}
								className="gap-1.5"
							>
								{(isPending || isUploading) && (
									<Loader2 className="size-3.5 animate-spin" />
								)}
								{isPaid
									? `Continue · GHS ${nominationPrice.toFixed(2)}`
									: "Submit Nomination"}
							</Button>
						</div>
					</form>
				</SheetContent>
			</Sheet>

			{/* ── Confirmation / Checkout Dialog ── */}
			<Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
				<DialogContent className="sm:max-w-sm" style={brandVars}>
					<DialogHeader>
						<DialogTitle className="text-base font-bold">
							{isPaid ? "Confirm & Pay Nomination" : "Confirm Nomination"}
						</DialogTitle>
					</DialogHeader>

					<div className="py-2">
						{/* Checkout Step */}
						{payStep === "checkout" && (
							<div className="space-y-4">
								<div className="rounded-xl border bg-muted/30 p-4 space-y-1.5 text-xs">
									<p className="text-muted-foreground">Nominee</p>
									<p className="font-bold text-sm text-foreground">{candidateName}</p>
									<p className="text-muted-foreground">{category.name}</p>
									{isPaid && (
										<p className="pt-2 text-base font-black text-emerald-600 border-t mt-2">
											GHS {nominationPrice.toFixed(2)}
										</p>
									)}
								</div>

								<p className="text-xs text-muted-foreground leading-relaxed">
									{isPaid
										? "You will be redirected to Paystack to complete payment securely via Mobile Money or Card."
										: "Your nomination will be submitted for organizer review."}
								</p>

								<Button
									size="lg"
									className="w-full h-11 text-xs font-bold gap-2"
									onClick={handleConfirmSubmission}
									disabled={loading || !isFormValid}
								>
									{loading ? (
										<>
											<Loader2 className="size-4 animate-spin" />
											{isPaid ? "Opening Paystack..." : "Submitting..."}
										</>
									) : isPaid ? (
										<>
											<CreditCard className="size-4" />
											Pay GHS {nominationPrice.toFixed(2)}
										</>
									) : (
										<>
											<Sparkles className="size-4" />
											Confirm Submission
										</>
									)}
								</Button>

								{isPaid && (
									<p className="text-[10px] text-center text-muted-foreground">
										Secured by Paystack &middot; MoMo &amp; Cards accepted
									</p>
								)}
							</div>
						)}

						{/* Processing Step */}
						{payStep === "processing" && (
							<div className="flex flex-col items-center py-8 space-y-3 text-center">
								<Loader2 className="size-8 text-primary animate-spin" />
								<p className="text-xs text-muted-foreground">
									{isPaid ? "Redirecting to payment gateway..." : "Submitting your nomination..."}
								</p>
							</div>
						)}

						{/* Success Step (For free nominations) */}
						{payStep === "success" && (
							<div className="flex flex-col items-center py-6 space-y-3 text-center">
								<div className="size-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
									<CheckCircle2 className="size-7" />
								</div>
								<div>
									<h4 className="font-bold text-base">Nomination Submitted!</h4>
									<p className="text-xs text-muted-foreground mt-1 max-w-xs">
										Your nomination of <strong>{candidateName}</strong> has been received.
										A confirmation email has been dispatched.
									</p>
								</div>
								<Button
									size="sm"
									className="text-xs h-9 font-bold mt-2"
									onClick={() => {
										setShowConfirmDialog(false);
										setSheetOpen(false);
										resetForm();
									}}
								>
									Done
								</Button>
							</div>
						)}

						{/* Error Step */}
						{payStep === "error" && (
							<div className="flex flex-col items-center py-6 space-y-3 text-center">
								<div className="size-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
									<XCircle className="size-7" />
								</div>
								<div>
									<h4 className="font-bold text-base">Submission Failed</h4>
									<p className="text-xs text-muted-foreground mt-1 max-w-xs">
										{errorMsg || "Something went wrong. Please try again."}
									</p>
								</div>
								<Button
									variant="outline"
									size="sm"
									className="text-xs h-9"
									onClick={() => setPayStep("checkout")}
								>
									Try Again
								</Button>
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
