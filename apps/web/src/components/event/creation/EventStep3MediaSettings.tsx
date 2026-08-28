"use client";
// src/components/event/creation/EventStep3MediaSettings.tsx
import {
	useState,
	useRef,
	useMemo,
	type ChangeEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	ArrowLeft,
	Loader2,
	Image as ImageIcon,
	X,
	Users,
	CheckCircle,
} from "lucide-react";
import { useImageUpload } from "@/hooks/use-image-upload";
import { getEventImageUrl } from "@/lib/image-url-utils";

const AddFilesIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <line x1="9" y1="15" x2="15" y2="15" />
  </svg>
);

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SelectionCard } from "./SelectionCard";
import { ConfirmDiscardDialog } from "@/components/common/ConfirmDiscardDialog";

// SVG Illustrations - vibrant and detailed
function PublicIllustration({ className }: { className?: string }) {
	return (
		<svg className={className} width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
			<circle cx="40" cy="34" r="16" fill="currentColor" fillOpacity="0.15"/>
			<circle cx="40" cy="34" r="16" stroke="currentColor" strokeWidth="2" fill="none"/>
			<circle cx="40" cy="34" r="6" fill="currentColor" fillOpacity="0.5"/>
			<path d="M22 56 Q40 44 58 56" stroke="currentColor" strokeWidth="2.5" fill="none"/>
			<path d="M40 18 V12 M56 22 L60 14 M24 22 L20 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
		</svg>
	);
}

function PrivateIllustration({ className }: { className?: string }) {
	return (
		<svg className={className} width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect x="16" y="18" width="48" height="44" rx="6" fill="currentColor" fillOpacity="0.12"/>
			<rect x="16" y="18" width="48" height="44" rx="6" stroke="currentColor" strokeWidth="2" fill="none"/>
			<circle cx="40" cy="34" r="9" fill="currentColor" fillOpacity="0.3"/>
			<path d="M30 54 Q40 46 50 54" stroke="currentColor" strokeWidth="2" fill="none"/>
			<rect x="30" y="58" width="20" height="10" rx="3" fill="currentColor" fillOpacity="0.4"/>
		</svg>
	);
}

const visibilityIllustrations: Record<string, React.ReactNode> = {
	public: <PublicIllustration className="text-primary" />,
	private: <PrivateIllustration className="text-muted-foreground" />,
};

interface EventStep3Props {
	readonly initialData: {
		flierImage?: string;
		bannerImage?: string;
		maxAttendees?: number | null;
		isPublic?: boolean;
	} | null;
	readonly onSuccess: (data: {
		flierImage?: string;
		bannerImage?: string;
		maxAttendees?: number | null;
		isPublic: boolean;
	}) => void;
	readonly onBack: () => void;
	readonly onSkip: () => void;
}

export function EventStep3MediaSettings({
	initialData,
	onSuccess,
	onBack,
	onSkip,
}: EventStep3Props) {
	const [flierImage, setFlierImage] = useState(initialData?.flierImage ?? "");
	const [maxAttendees, setMaxAttendees] = useState<string>(
		initialData?.maxAttendees?.toString() ?? "",
	);
	const [isPublic, setIsPublic] = useState(initialData?.isPublic ?? true);
	const [pendingFlierFile, setPendingFlierFile] = useState<File | null>(null);
	const [flierPreviewUrl, setFlierPreviewUrl] = useState<string | null>(null);
	const [showDiscardDialog, setShowDiscardDialog] = useState(false);
	const [pendingAction, setPendingAction] = useState<"back" | "skip" | null>(
		null,
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const isPrivate = !isPublic;

	const flierInputRef = useRef<HTMLInputElement>(null);

	const { isUploading: isUploadingFlier, upload: runUploadFlier } =
		useImageUpload({
			folder: "events",
			convertOptions: {
				quality: 0.85,
				maxWidth: 1200,
				maxHeight: 630,
				maxSizeMB: 2,
			},
		});
	const isUploading = isUploadingFlier;

	// Generate display URLs from paths or previews
	const flierDisplayPreview = flierPreviewUrl || getEventImageUrl(flierImage);

	const isDirty = useMemo(() => {
		return (
			pendingFlierFile !== null ||
			maxAttendees !== (initialData?.maxAttendees?.toString() ?? "") ||
			isPublic !== (initialData?.isPublic ?? true) ||
			flierImage !== (initialData?.flierImage ?? "")
		);
	}, [
		pendingFlierFile,
		maxAttendees,
		isPublic,
		flierImage,
		initialData,
	]);

	const handleBack = () => {
		if (isDirty) {
			setPendingAction("back");
			setShowDiscardDialog(true);
		} else {
			onBack();
		}
	};

	const handleSkip = () => {
		if (isDirty) {
			setPendingAction("skip");
			setShowDiscardDialog(true);
		} else {
			onSkip();
		}
	};

	const handleConfirmDiscard = () => {
		setShowDiscardDialog(false);
		if (pendingAction === "back") {
			onBack();
		} else if (pendingAction === "skip") {
			onSkip();
		}
		setPendingAction(null);
	};

	function handleImageUpload(file: File) {
		const previewUrl = URL.createObjectURL(file);
		setPendingFlierFile(file);
		setFlierPreviewUrl(previewUrl);
	}

	function handleFileChange(
		e: ChangeEvent<HTMLInputElement>,
	) {
		const file = e.target.files?.[0];
		if (file) {
			handleImageUpload(file);
		}
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			let finalFlierImage = flierImage;

			// Upload pending images if they exist
			if (pendingFlierFile) {
				const result = await runUploadFlier(pendingFlierFile);
				if (result) finalFlierImage = result.url;
				else {
					setIsSubmitting(false);
					return;
				}
			}

			onSuccess({
				flierImage: finalFlierImage,
				maxAttendees: maxAttendees ? parseInt(maxAttendees, 10) : null,
				isPublic,
			});

			setPendingFlierFile(null);
			if (flierPreviewUrl) {
				URL.revokeObjectURL(flierPreviewUrl);
				setFlierPreviewUrl(null);
			}
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-6 @container">
			{/* Media */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<ImageIcon className="size-5" />
						Event Media
					</CardTitle>
					<CardDescription>Upload images for your event</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Flier Image */}
					<div className="space-y-3">
						<Label>Event Flier</Label>
						<p className="text-sm text-muted-foreground">
							Upload a high-quality flier for your event. Your event header will automatically inherit your organization's banner backdrop.
						</p>

						<input
							ref={flierInputRef}
							type="file"
							accept="image/jpeg,image/png,image/webp,image/gif"
							onChange={handleFileChange}
							className="hidden"
						/>

						{flierImage || flierPreviewUrl ? (
							<div className="relative rounded-xl overflow-hidden border aspect-video max-w-lg">
								<img
									src={(flierDisplayPreview || undefined) as string | undefined}
									alt="Flier"
									className="object-cover w-full h-full"
								/>
								<button
									type="button"
									onClick={() => {
										setFlierImage("");
										setPendingFlierFile(null);
										if (flierPreviewUrl) URL.revokeObjectURL(flierPreviewUrl);
										setFlierPreviewUrl(null);
									}}
									className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
								>
									<X className="size-4" />
								</button>
							</div>
						) : (
							<button
								type="button"
								onClick={() => flierInputRef.current?.click()}
								disabled={isUploading}
								className="w-full aspect-video max-w-lg rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 flex flex-col items-center justify-center gap-2 text-muted-foreground transition-colors"
							>
								{isUploading ? (
									<>
										<Loader2 className="size-8 animate-spin" />
										<span>Uploading...</span>
									</>
								) : (
									<>
										<AddFilesIcon className="size-16 mb-2" />
										<span>Click to upload event flier</span>
										<span className="text-xs">
											JPEG, PNG, WebP or GIF (max 5MB)
										</span>
									</>
								)}
							</button>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Settings */}
			<Card>
				<CardHeader>
					<CardTitle>Event Settings</CardTitle>
					<CardDescription>Configure capacity and visibility</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Max Attendees */}
					<div className="space-y-2">
						<Label htmlFor="maxAttendees">Maximum Attendees (Optional)</Label>
						<div className="flex items-center gap-2">
							<Users className="size-4 text-muted-foreground" />
							<Input
								id="maxAttendees"
								type="number"
								min="1"
								max="100000"
								value={maxAttendees}
								onChange={(e) => setMaxAttendees(e.target.value)}
								placeholder="No limit"
								className="flex-1"
							/>
						</div>
						<p className="text-xs text-muted-foreground">
							Leave empty for unlimited capacity
						</p>
					</div>

					{/* Visibility */}
					<div className="space-y-3">
						<Label>Event Visibility</Label>
						<div className="grid @lg:grid-cols-2 gap-3">
							<SelectionCard
								illustration={visibilityIllustrations.public}
								label="Public"
								description="Anyone can find and view your event"
								isSelected={isPublic}
								onClick={() => setIsPublic(true)}
							/>
							<SelectionCard
								illustration={visibilityIllustrations.private}
								label="Private"
								description="Only organization members can view this event"
								isSelected={isPrivate}
								onClick={() => setIsPublic(false)}
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Actions */}
			<div className="flex justify-between pt-4">
				<Button type="button" variant="ghost" onClick={handleBack}>
					<ArrowLeft className="mr-2 size-4" />
					Back
				</Button>

				<div className="flex gap-2">
					<Button type="button" variant="outline" onClick={handleSkip}>
						Skip for Now
					</Button>
					<Button
						type="submit"
						disabled={isSubmitting || isUploading}
					>
						{isSubmitting ? (
							<>
								<Loader2 className="mr-2 size-4 animate-spin" />
								Creating...
							</>
						) : (
							<>
								<CheckCircle className="mr-2 size-4" />
								Continue
							</>
						)}
					</Button>
				</div>
			</div>

			<ConfirmDiscardDialog
				open={showDiscardDialog}
				onOpenChange={setShowDiscardDialog}
				onConfirm={handleConfirmDiscard}
			/>
		</form>
	);
}
