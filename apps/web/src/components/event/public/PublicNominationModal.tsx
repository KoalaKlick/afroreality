"use client";

import { useState, useTransition, useCallback } from "react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Loader2,
	PlusCircle,
	CheckCircle2,
	XCircle,
	User,
	Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import type { VotingCategory } from "@/lib/types/voting";

interface PublicNominationModalProps {
	readonly eventId: string;
	readonly category: VotingCategory;
	readonly orgSlug?: string;
	readonly eventSlug?: string;
	readonly trigger?: React.ReactNode;
}

export function PublicNominationModal({
	eventId,
	category,
	trigger,
}: PublicNominationModalProps) {
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [candidateName, setCandidateName] = useState("");
	const [candidateBio, setCandidateBio] = useState("");
	const [candidateEmail, setCandidateEmail] = useState("");
	const [nominatorName, setNominatorName] = useState("");
	const [nominatorEmail, setNominatorEmail] = useState("");
	const [isSuccess, setIsSuccess] = useState(false);

	const resetForm = useCallback(() => {
		setCandidateName("");
		setCandidateBio("");
		setCandidateEmail("");
		setNominatorName("");
		setNominatorEmail("");
		setIsSuccess(false);
	}, []);

	const handleOpenChange = useCallback(
		(nextOpen: boolean) => {
			if (!nextOpen) resetForm();
			setOpen(nextOpen);
		},
		[resetForm],
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!candidateName.trim()) {
			toast.error("Please provide the candidate's name.");
			return;
		}

		startTransition(async () => {
			try {
				// Simulating nomination submission
				setIsSuccess(true);
				toast.success("Nomination submitted for review!");
			} catch (err: any) {
				toast.error(err.message || "Failed to submit nomination.");
			}
		});
	};

	return (
		<Sheet open={open} onOpenChange={handleOpenChange}>
			<SheetTrigger asChild>
				{trigger || (
					<Button variant="outline" size="sm" className="text-xs gap-1.5 h-8">
						<PlusCircle className="size-3.5 text-primary" />
						<span>Nominate Candidate</span>
					</Button>
				)}
			</SheetTrigger>

			<SheetContent className="sm:max-w-md overflow-y-auto p-6">
				<SheetHeader>
					<SheetTitle className="text-lg font-bold">
						Nominate Candidate
					</SheetTitle>
					<SheetDescription className="text-xs">
						Submit a nominee for consideration in <strong>{category.name}</strong>.
					</SheetDescription>
				</SheetHeader>

				{isSuccess ? (
					<div className="py-12 text-center space-y-4">
						<div className="size-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto dark:bg-green-950/50 dark:text-green-400">
							<CheckCircle2 className="size-8" />
						</div>
						<div className="space-y-1">
							<h4 className="font-bold text-base text-foreground">
								Nomination Submitted!
							</h4>
							<p className="text-xs text-muted-foreground">
								Thank you for nominating <strong>{candidateName}</strong>. The
								event organizers will review the submission.
							</p>
						</div>
						<Button
							onClick={() => handleOpenChange(false)}
							className="text-xs h-9 font-bold"
						>
							Close
						</Button>
					</div>
				) : (
					<form onSubmit={handleSubmit} className="space-y-4 pt-4">
						<div className="space-y-1.5">
							<Label htmlFor="candidate-name" className="text-xs">
								Candidate / Nominee Name *
							</Label>
							<Input
								id="candidate-name"
								placeholder="e.g. Ama Serwaa"
								value={candidateName}
								onChange={(e) => setCandidateName(e.target.value)}
								className="h-9 text-xs"
								required
								disabled={isPending}
							/>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="candidate-email" className="text-xs">
								Candidate Email (Optional)
							</Label>
							<Input
								id="candidate-email"
								type="email"
								placeholder="ama@example.com"
								value={candidateEmail}
								onChange={(e) => setCandidateEmail(e.target.value)}
								className="h-9 text-xs"
								disabled={isPending}
							/>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="candidate-bio" className="text-xs">
								Why should they win? (Bio / Description)
							</Label>
							<Textarea
								id="candidate-bio"
								placeholder="Share achievements, projects, or why this nominee deserves recognition..."
								value={candidateBio}
								onChange={(e) => setCandidateBio(e.target.value)}
								className="text-xs min-h-24 resize-none"
								disabled={isPending}
							/>
						</div>

						<div className="border-t pt-3 space-y-3">
							<h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
								Your Details
							</h5>

							<div className="space-y-1.5">
								<Label htmlFor="nominator-name" className="text-xs">
									Your Name (Optional)
								</Label>
								<Input
									id="nominator-name"
									placeholder="e.g. Kwame Mensah"
									value={nominatorName}
									onChange={(e) => setNominatorName(e.target.value)}
									className="h-9 text-xs"
									disabled={isPending}
								/>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="nominator-email" className="text-xs">
									Your Email (Optional)
								</Label>
								<Input
									id="nominator-email"
									type="email"
									placeholder="kwame@example.com"
									value={nominatorEmail}
									onChange={(e) => setNominatorEmail(e.target.value)}
									className="h-9 text-xs"
									disabled={isPending}
								/>
							</div>
						</div>

						<Button
							type="submit"
							disabled={isPending || !candidateName.trim()}
							className="w-full text-xs font-bold h-10 gap-2 mt-4"
						>
							{isPending ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								<Sparkles className="size-4" />
							)}
							Submit Nomination
						</Button>
					</form>
				)}
			</SheetContent>
		</Sheet>
	);
}
