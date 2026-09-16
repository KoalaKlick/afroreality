"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { getEventImageUrl } from "@/lib/image-url-utils";
import {
	Vote,
	Loader2,
	CheckCircle2,
	XCircle,
	Coins,
	Minus,
	Plus,
	Mail,
	Lock,
	User,
	Phone,
} from "lucide-react";
import { initiatePublicVote } from "@/lib/server-functions/public-checkout";
import { toast } from "sonner";

interface VotingOption {
	id: string;
	optionText: string;
	nomineeCode?: string | null;
	imageUrl?: string | null;
	votesCount?: number | bigint;
}

interface VotePaymentModalProps {
	readonly nominee: VotingOption | null;
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly votePrice: number;
	readonly eventId: string;
	readonly categoryId: string;
	readonly isPublic?: boolean;
	readonly votingMode?: "internal" | "general" | string;
	readonly orgSlug?: string;
	readonly eventSlug?: string;
	readonly brandVars?: React.CSSProperties;
	readonly isUpcoming?: boolean;
	readonly startDate?: string | Date | null;
}

type ModalStep = "checkout" | "processing" | "success" | "error";

export function VotePaymentModal({
	nominee,
	open,
	onOpenChange,
	votePrice,
	eventId,
	categoryId,
	votingMode = "general",
	brandVars,
	isUpcoming = false,
	startDate,
}: VotePaymentModalProps) {
	const router = useRouter();
	const isInternalVoting = votingMode === "internal";
	const isFree = !isInternalVoting && votePrice === 0;

	const [step, setStep] = useState<ModalStep>("checkout");
	const [voteCount, setVoteCount] = useState(1);
	const [voterKey, setVoterKey] = useState("");
	const [voterEmail, setVoterEmail] = useState("");
	const [voterPhone, setVoterPhone] = useState("");
	const [loading, setLoading] = useState(false);
	const [errorMsg, setErrorMsg] = useState("");

	const resetModal = useCallback(() => {
		setStep("checkout");
		setVoteCount(1);
		setVoterKey("");
		setVoterEmail("");
		setVoterPhone("");
		setLoading(false);
		setErrorMsg("");
	}, []);

	const handleClose = useCallback(
		(nextOpen: boolean) => {
			if (!nextOpen) resetModal();
			onOpenChange(nextOpen);
		},
		[onOpenChange, resetModal],
	);

	if (!nominee) return null;

	const totalAmount = votePrice * voteCount;
	const nomineeImgUrl = nominee.imageUrl
		? getEventImageUrl(nominee.imageUrl)
		: null;

	const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
	const isValidPhone = (val: string) => {
		const cleaned = val.replace(/[\s\-\(\)]/g, "");
		return cleaned.length >= 9 && /^[+]?[0-9]{9,15}$/.test(cleaned);
	};

	const isEmailValid = !voterEmail.trim() || isValidEmail(voterEmail);
	const isPhoneValid = isValidPhone(voterPhone);

	const isFormValid = (() => {
		if (isInternalVoting) {
			if (!voterKey.trim()) return false;
			if (voterEmail.trim() && !isValidEmail(voterEmail)) return false;
			return true;
		}
		if (voteCount < 1) return false;
		if (!isPhoneValid) return false;
		if (!isEmailValid) return false;
		return true;
	})();

	async function handleSubmitVote(e: React.FormEvent) {
		e.preventDefault();

		if (isInternalVoting && !voterKey.trim()) {
			toast.error("Please enter your confidential voting key.");
			return;
		}

		if (!isInternalVoting) {
			if (!isPhoneValid) {
				toast.error("Please enter a valid phone number (e.g. 024 123 4567).");
				return;
			}
			if (voterEmail.trim() && !isValidEmail(voterEmail)) {
				toast.error("Please enter a valid email address or leave it empty.");
				return;
			}
		}

		setLoading(true);
		setErrorMsg("");
		setStep("processing");

		try {
			const result = await initiatePublicVote({
				data: {
					eventId,
					categoryId,
					optionId: nominee!.id,
					voteCount: isInternalVoting ? 1 : voteCount,
					voterEmail: voterEmail.trim() || undefined,
					voterPhone: voterPhone.trim() || undefined,
					voterKey: voterKey.trim().toUpperCase() || undefined,
				},
			});

			if (!result || !result.success) {
				setStep("error");
				setErrorMsg(result?.error || "Failed to submit vote. Please try again.");
				return;
			}

			if (result.isInternal || result.isFree) {
				setStep("success");
				toast.success("Vote cast successfully!");
				router.refresh();
			} else if (result.authorizationUrl) {
				window.location.href = result.authorizationUrl;
			} else {
				setStep("error");
				setErrorMsg("Unable to redirect to payment gateway.");
			}
		} catch (err: any) {
			setStep("error");
			setErrorMsg(err?.message || "Failed to submit vote. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-md" style={brandVars}>
				<DialogHeader>
					<DialogTitle className="text-xl font-bold">
						{step === "success"
							? "Vote Recorded!"
							: step === "error"
								? "Voting Error"
								: isInternalVoting
									? "Cast Member Ballot"
									: isFree
										? "Cast Free Vote"
										: "Vote for Nominee"}
					</DialogTitle>
				</DialogHeader>

				{step === "checkout" && (
					<form onSubmit={handleSubmitVote} className="space-y-5 pt-2">
						{/* Nominee Profile Header */}
						<div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-muted/40 border">
							<div className="size-14 rounded-lg bg-muted border overflow-hidden shrink-0 flex items-center justify-center">
								{nomineeImgUrl ? (
									<img
										src={nomineeImgUrl}
										alt={nominee.optionText}
										className="size-full object-cover"
									/>
								) : (
									<User className="size-6 text-muted-foreground" />
								)}
							</div>
							<div className="min-w-0 flex-1">
								<h4 className="font-bold text-sm text-foreground truncate">
									{nominee.optionText}
								</h4>
								{nominee.nomineeCode && (
									<p className="text-[11px] font-mono text-muted-foreground uppercase">
										Code: {nominee.nomineeCode}
									</p>
								)}
								<p className="text-xs text-primary font-semibold mt-0.5">
									{isInternalVoting
										? "1 Ballot Per Member"
										: isFree
											? "Free Public Vote"
											: `GHS ${votePrice.toFixed(2)} per vote`}
								</p>
							</div>
						</div>

						{/* 1. Internal Member Voter Key Input */}
						{isInternalVoting ? (
							<div className="space-y-3">
								<div className="p-3 rounded-xl border border-primary/20 bg-primary/5 text-xs text-primary flex items-center gap-2">
									<Lock className="size-4 shrink-0" />
									<span>
										Enter your private voter key delivered to your email address.
									</span>
								</div>

								<div className="space-y-1.5">
									<Label htmlFor="voter-key" className="text-xs">
										Confidential Voter Key *
									</Label>
									<Input
										id="voter-key"
										placeholder="e.g. VK-ABCD-1234"
										value={voterKey}
										onChange={(e) => setVoterKey(e.target.value.toUpperCase())}
										className="font-mono text-xs uppercase tracking-wider h-10"
										required
										disabled={loading}
									/>
								</div>
							</div>
						) : (
							/* 2. General Voting: Vote Quantity + Contact */
							<div className="space-y-4">
								{!isFree && (
									<div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
										<span className="text-xs font-semibold text-foreground">
											Number of Votes:
										</span>
										<div className="flex items-center gap-3">
											<Button
												type="button"
												variant="outline"
												size="icon"
												className="size-8"
												onClick={() => setVoteCount((c) => Math.max(1, c - 1))}
												disabled={voteCount <= 1 || loading}
											>
												<Minus className="size-3.5" />
											</Button>
											<span className="text-sm font-bold w-8 text-center font-mono">
												{voteCount}
											</span>
											<Button
												type="button"
												variant="outline"
												size="icon"
												className="size-8"
												onClick={() => setVoteCount((c) => c + 1)}
												disabled={loading}
											>
												<Plus className="size-3.5" />
											</Button>
										</div>
									</div>
								)}

								{/* Phone Number (Required on top) */}
								<div className="space-y-2">
									<Label htmlFor="voter-phone" className="text-xs font-semibold">
										Phone Number {!isInternalVoting ? "*" : "(Optional)"}
									</Label>
									<div className="relative">
										<Phone className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
										<Input
											id="voter-phone"
											type="tel"
											placeholder="024 123 4567"
											value={voterPhone}
											onChange={(e) => setVoterPhone(e.target.value)}
											className="pl-9 h-9 text-xs"
											required={!isInternalVoting}
											disabled={loading}
										/>
									</div>
									<p className="text-[10px] text-muted-foreground">
										Required for mobile money prompt and vote confirmation.
									</p>
								</div>

								{/* Email Address (Optional below) */}
								<div className="space-y-2">
									<Label htmlFor="voter-email" className="text-xs font-semibold">
										Email Address (Optional)
									</Label>
									<div className="relative">
										<Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
										<Input
											id="voter-email"
											type="email"
											placeholder="kwame@example.com (optional)"
											value={voterEmail}
											onChange={(e) => setVoterEmail(e.target.value)}
											className="pl-9 h-9 text-xs"
											disabled={loading}
										/>
									</div>
									<p className="text-[10px] text-muted-foreground">
										Optional for receiving an email ballot receipt.
									</p>
								</div>
							</div>
						)}

						{isUpcoming && (
							<div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-700 dark:text-amber-400 text-center">
								Voting for this event has not started yet.
								{startDate && (
									<>
										{" "}Voting opens on{" "}
										{new Date(startDate).toLocaleString("en-GH", {
											dateStyle: "medium",
											timeStyle: "short",
										})}.
									</>
								)}
							</div>
						)}

						<Button
							type="submit"
							className="w-full font-bold text-xs h-10 gap-2"
							disabled={loading || !isFormValid || isUpcoming}
						>
							<Vote className="size-4" />
							{isUpcoming
								? "Voting Not Started Yet"
								: isInternalVoting
									? "Cast Confidential Ballot"
									: isFree
										? "Submit Free Vote"
										: `Pay GHS ${totalAmount.toFixed(2)} for ${voteCount} ${voteCount === 1 ? "Vote" : "Votes"}`}
						</Button>
					</form>
				)}

				{step === "processing" && (
					<div className="py-12 text-center space-y-4">
						<Loader2 className="size-10 text-primary animate-spin mx-auto" />
						<div>
							<h4 className="font-bold text-base">Processing Your Ballot...</h4>
							<p className="text-xs text-muted-foreground mt-1">
								Please wait while we verify and record your vote.
							</p>
						</div>
					</div>
				)}

				{step === "success" && (
					<div className="py-8 text-center space-y-5">
						<div className="size-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto dark:bg-green-950/50 dark:text-green-400">
							<CheckCircle2 className="size-8" />
						</div>

						<div className="space-y-1">
							<h4 className="font-bold text-lg text-foreground">
								Vote Cast Successfully!
							</h4>
							<p className="text-xs text-muted-foreground max-w-xs mx-auto">
								Your ballot for <strong>{nominee.optionText}</strong> has been
								verified and recorded in the live election tally.
							</p>
						</div>

						<Button
							onClick={() => handleClose(false)}
							className="w-full text-xs h-9 font-bold"
						>
							Done
						</Button>
					</div>
				)}

				{step === "error" && (
					<div className="py-8 text-center space-y-4">
						<div className="size-12 rounded-full bg-red-100 text-destructive flex items-center justify-center mx-auto dark:bg-red-950/50">
							<XCircle className="size-7" />
						</div>
						<div>
							<h4 className="font-bold text-base text-foreground">
								Vote Submission Failed
							</h4>
							<p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
								{errorMsg || "An error occurred while submitting your vote."}
							</p>
						</div>
						<div className="flex gap-2 justify-center pt-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setStep("checkout")}
								className="text-xs"
							>
								Try Again
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => handleClose(false)}
								className="text-xs"
							>
								Close
							</Button>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
