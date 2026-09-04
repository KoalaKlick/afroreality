"use client";

import { use, useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
	ShieldCheck,
	AlertTriangle,
	CheckCircle2,
	XCircle,
	ArrowRight,
	Loader2,
	Building2,
	Trash2,
	Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
	getNomineeChangeRequest,
	approveNomineeChangeRequest,
	rejectNomineeChangeRequest,
} from "@/lib/server-functions/voting-options";
import { getEventImageUrl, getOrgImageUrl } from "@/lib/image-url-utils";

interface ConfirmChangePageProps {
	params: Promise<{
		requestId: string;
	}>;
}

export default function ConfirmChangePage({ params }: ConfirmChangePageProps) {
	const { requestId } = use(params);
	const [request, setRequest] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [confirmationCode, setConfirmationCode] = useState("");
	const [isSubmitting, startTransition] = useTransition();
	const [outcome, setOutcome] = useState<"approved" | "rejected" | null>(null);

	useEffect(() => {
		if (requestId) {
			getNomineeChangeRequest(requestId)
				.then((res) => {
					setRequest(res);
					if (res?.status && res.status !== "pending") {
						setOutcome(res.status);
					}
				})
				.catch((err) => console.error("Error loading change request:", err))
				.finally(() => setIsLoading(false));
		}
	}, [requestId]);

	const handleApprove = (e: React.FormEvent) => {
		e.preventDefault();
		if (!confirmationCode.trim()) {
			toast.error("Please enter your 6-digit Confirmation Code.");
			return;
		}

		startTransition(async () => {
			try {
				const res = await approveNomineeChangeRequest({
					requestId,
					confirmationCode: confirmationCode.trim(),
				});

				if (!res.success) {
					toast.error(res.error || "Failed to approve request");
					return;
				}

				setOutcome("approved");
				toast.success("Change request approved successfully!");
			} catch (err: any) {
				toast.error(err.message || "An unexpected error occurred.");
			}
		});
	};

	const handleReject = () => {
		startTransition(async () => {
			try {
				const res = await rejectNomineeChangeRequest({ requestId });
				if (!res.success) {
					toast.error(res.error || "Failed to decline request");
					return;
				}

				setOutcome("rejected");
				toast.success("Change request declined.");
			} catch (err: any) {
				toast.error(err.message || "An unexpected error occurred.");
			}
		});
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
				<Loader2 className="size-8 animate-spin text-primary mb-3" />
				<p className="text-sm font-medium text-muted-foreground">Loading Change Request...</p>
			</div>
		);
	}

	if (!request) {
		return (
			<div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4 text-center">
				<Card className="max-w-md w-full p-6 space-y-4">
					<AlertTriangle className="size-10 text-amber-500 mx-auto" />
					<h2 className="text-xl font-bold">Request Not Found</h2>
					<p className="text-sm text-muted-foreground">
						This change request link is invalid or may have expired.
					</p>
					<Button asChild className="w-full">
						<Link href="/">Return to Homepage</Link>
					</Button>
				</Card>
			</div>
		);
	}

	const { option, requestType, proposedChanges } = request;
	const changes = proposedChanges || {};
	const isDelete = requestType === "DELETE";

	if (outcome === "approved") {
		return (
			<div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4 text-center">
				<Card className="max-w-md w-full p-8 space-y-5">
					<div className="size-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
						<CheckCircle2 className="size-10" />
					</div>
					<div className="space-y-2">
						<h2 className="text-2xl font-black">Request Approved!</h2>
						<p className="text-sm text-muted-foreground leading-relaxed">
							{isDelete
								? `Your profile "${option.optionText}" has been removed.`
								: `Your profile updates for "${option.optionText}" have been applied.`}
						</p>
					</div>
					{option.event && (
						<Button asChild className="w-full">
							<Link href={`/${option.event.organization.slug}/event/${option.event.slug}`}>
								View Event Standings
							</Link>
						</Button>
					)}
				</Card>
			</div>
		);
	}

	if (outcome === "rejected") {
		return (
			<div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4 text-center">
				<Card className="max-w-md w-full p-8 space-y-5">
					<div className="size-16 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center mx-auto">
						<XCircle className="size-10" />
					</div>
					<div className="space-y-2">
						<h2 className="text-2xl font-black">Request Declined</h2>
						<p className="text-sm text-muted-foreground leading-relaxed">
							You declined this proposed change. No changes were made to your nominee profile.
						</p>
					</div>
					{option.event && (
						<Button asChild variant="outline" className="w-full">
							<Link href={`/${option.event.organization.slug}/event/${option.event.slug}`}>
								Return to Event
							</Link>
						</Button>
					)}
				</Card>
			</div>
		);
	}

	return (
		<main className="min-h-screen bg-muted/20 py-12 px-4 flex flex-col items-center justify-center">
			<div className="max-w-xl w-full space-y-6">
				{/* Top Branding */}
				<div className="text-center space-y-2">
					<div className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
						<Building2 className="size-4 text-primary" />
						<span>{option.event.organization.name}</span>
						<span>&bull;</span>
						<span>{option.event.title}</span>
					</div>
					<h1 className="text-2xl sm:text-3xl font-black tracking-tight">
						{isDelete ? "Approve Profile Deletion" : "Approve Profile Changes"}
					</h1>
					<p className="text-xs sm:text-sm text-muted-foreground">
						The organizer has submitted a proposed change for your review.
					</p>
				</div>

				{/* Proposed Changes Review Card */}
				<Card className="border-border">
					<CardHeader className="pb-4">
						<div className="flex items-center justify-between">
							<CardTitle className="text-base font-bold flex items-center gap-2">
								{isDelete ? (
									<Trash2 className="size-4 text-red-500" />
								) : (
									<Edit3 className="size-4 text-primary" />
								)}
								<span>Nominee: {option.optionText}</span>
							</CardTitle>
							<Badge variant={isDelete ? "destructive" : "default"} className="uppercase text-[10px]">
								{isDelete ? "Deletion" : "Edit Request"}
							</Badge>
						</div>
						<CardDescription className="text-xs">
							Category: <span className="font-semibold text-foreground">{option.category?.name || "General"}</span>
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{isDelete ? (
							<div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs font-medium leading-relaxed">
								Warning: Approving this action will permanently remove candidate profile &quot;{option.optionText}&quot; from the category.
							</div>
						) : (
							<div className="space-y-3 divide-y text-xs">
								{changes.optionText && changes.optionText !== option.optionText && (
									<div className="pt-2 flex justify-between gap-4">
										<span className="text-muted-foreground font-medium">Name:</span>
										<span className="font-semibold text-right">
											{option.optionText} &rarr; <span className="text-primary">{changes.optionText}</span>
										</span>
									</div>
								)}
								{changes.email && changes.email !== option.email && (
									<div className="pt-2 flex justify-between gap-4">
										<span className="text-muted-foreground font-medium">Email:</span>
										<span className="font-semibold text-right">
											{option.email || "None"} &rarr; <span className="text-primary">{changes.email}</span>
										</span>
									</div>
								)}
								{changes.phone && changes.phone !== option.phone && (
									<div className="pt-2 flex justify-between gap-4">
										<span className="text-muted-foreground font-medium">Phone:</span>
										<span className="font-semibold text-right">
											{option.phone || "None"} &rarr; <span className="text-primary">{changes.phone}</span>
										</span>
									</div>
								)}
								{changes.imageUrl && changes.imageUrl !== option.imageUrl && (
									<div className="pt-2 space-y-1.5">
										<span className="text-muted-foreground font-medium block">Photo Update:</span>
										<div className="flex items-center gap-3">
											<div className="size-14 rounded-lg overflow-hidden border bg-muted">
												<img
													src={getEventImageUrl(option.imageUrl) ?? ""}
													alt="Current"
													className="size-full object-cover"
												/>
											</div>
											<ArrowRight className="size-4 text-muted-foreground" />
											<div className="size-14 rounded-lg overflow-hidden border bg-primary/10">
												<img
													src={getEventImageUrl(changes.imageUrl) ?? ""}
													alt="Proposed"
													className="size-full object-cover"
												/>
											</div>
										</div>
									</div>
								)}
								{changes.description && (
									<div className="pt-2 space-y-1">
										<span className="text-muted-foreground font-medium block">Updated Bio:</span>
										<div
											className="p-3 rounded-lg bg-muted/40 text-muted-foreground text-xs leading-relaxed max-h-32 overflow-y-auto"
											dangerouslySetInnerHTML={{ __html: changes.description }}
										/>
									</div>
								)}
							</div>
						)}

						{/* Confirmation Code Form */}
						<form onSubmit={handleApprove} className="space-y-4 pt-4 border-t">
							<div className="space-y-2">
								<Label htmlFor="code" className="text-xs font-bold uppercase tracking-wider text-foreground">
									Enter 6-Digit Confirmation Code *
								</Label>
								<Input
									id="code"
									value={confirmationCode}
									onChange={(e) => setConfirmationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
									placeholder="e.g. 123456"
									maxLength={6}
									className="font-mono text-center text-lg tracking-widest h-12 border-2"
									required
								/>
								<div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 text-[11px] leading-relaxed flex items-start gap-2">
									<ShieldCheck className="size-4 shrink-0 mt-0.5" />
									<span>
										<strong>Keep this code private.</strong> Enter your 6-digit Confirmation Code sent to your email to approve this request (similar to a Mobile Money OTP).
									</span>
								</div>
							</div>

							<div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
								<Button
									type="submit"
									disabled={isSubmitting || confirmationCode.length < 6}
									variant={isDelete ? "destructive" : "default"}
									className="w-full sm:flex-1 h-10 font-bold"
								>
									{isSubmitting ? (
										<>
											<Loader2 className="mr-2 size-4 animate-spin" />
											Processing...
										</>
									) : isDelete ? (
										"Approve Deletion"
									) : (
										"Approve Changes"
									)}
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={handleReject}
									disabled={isSubmitting}
									className="w-full sm:w-auto h-10 text-muted-foreground hover:text-foreground"
								>
									Decline Request
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
