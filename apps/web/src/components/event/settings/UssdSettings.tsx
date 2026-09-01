"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Smartphone,
	CheckCircle2,
	Copy,
	Loader2,
	Info,
	QrCode as QrCodeIcon,
	PhoneCall,
	XCircle,
	Download,
} from "lucide-react";
import { toast } from "sonner";
import { enableUssdForEvent, disableUssdForEvent } from "@/lib/server-functions/ussd";
import { getUssdDialCode, getUssdTelUri } from "@/lib/utils/ussd";
import QRCode from "react-qr-code";

interface UssdSettingsProps {
	readonly eventId: string;
	readonly hasUssd?: boolean | null;
	readonly ussdCode?: string | null;
	readonly canEdit?: boolean;
	readonly onUpdated?: (hasUssd: boolean, ussdCode?: string | null) => void;
}

export function UssdSettings({
	eventId,
	hasUssd: initialHasUssd,
	ussdCode: initialUssdCode,
	canEdit = true,
	onUpdated,
}: UssdSettingsProps) {
	const [hasUssd, setHasUssd] = useState(!!initialHasUssd);
	const [ussdCode, setUssdCode] = useState(initialUssdCode || "");
	const [showQr, setShowQr] = useState(false);
	const [isPending, startTransition] = useTransition();
	const qrRef = useRef<HTMLDivElement>(null);

	const dialCode = ussdCode ? getUssdDialCode(ussdCode) : "";
	const telUri = ussdCode ? getUssdTelUri(ussdCode) : "";

	const handleEnable = () => {
		startTransition(async () => {
			const result = await enableUssdForEvent(eventId);
			if (result.success && result.data) {
				setHasUssd(true);
				setUssdCode(result.data.ussdCode);
				onUpdated?.(true, result.data.ussdCode);
				toast.success("USSD channel successfully activated!");
			} else {
				toast.error(result.error || "Failed to activate USSD.");
			}
		});
	};

	const handleDisable = () => {
		startTransition(async () => {
			const result = await disableUssdForEvent(eventId);
			if (result.success) {
				setHasUssd(false);
				onUpdated?.(false, ussdCode);
				toast.success("USSD channel deactivated.");
			} else {
				toast.error(result.error || "Failed to deactivate USSD.");
			}
		});
	};

	const copyCode = () => {
		if (!dialCode) return;
		navigator.clipboard.writeText(dialCode);
		toast.success("USSD code copied to clipboard!");
	};

	const downloadQrCode = useCallback(async () => {
		if (!qrRef.current) return;

		const svgElement = qrRef.current.querySelector("svg");
		if (!svgElement) return;

		const svgData = new XMLSerializer().serializeToString(svgElement);
		const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
		const svgUrl = URL.createObjectURL(svgBlob);

		const img = new Image();
		img.onload = () => {
			const scale = 4;
			const canvas = document.createElement("canvas");
			canvas.width = (img.width || 200) * scale;
			canvas.height = (img.height || 200) * scale;
			const ctx = canvas.getContext("2d");
			if (!ctx) return;

			ctx.fillStyle = "#ffffff";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

			canvas.toBlob((blob) => {
				if (!blob) return;
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `ussd-qr-${dialCode}.png`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
				toast.success("QR code downloaded!");
			}, "image/png");

			URL.revokeObjectURL(svgUrl);
		};
		img.src = svgUrl;
	}, [dialCode]);

	return (
		<Card className="p-6 border-primary/20 bg-card shadow-xs">
			<div className="flex items-start justify-between mb-4">
				<div className="space-y-1">
					<h3 className="text-base font-semibold flex items-center gap-2 text-foreground">
						<Smartphone className="size-5 text-primary" />
						USSD Integration (Offline Ticketing &amp; Live Voting)
					</h3>
					<p className="text-xs text-muted-foreground">
						Allow attendees to purchase tickets and cast votes offline via their Mobile Money wallet without internet access.
					</p>
				</div>
			</div>

			<div className="space-y-4">
				{hasUssd && ussdCode ? (
					<div className="space-y-4">
						{/* Active Banner */}
						<div className="bg-primary/5 border border-primary/20 rounded-xl p-4 sm:p-5">
							<div className="flex items-center justify-between gap-3 mb-3">
								<div className="flex items-center gap-2">
									<CheckCircle2 className="size-5 text-primary" />
									<p className="font-bold text-sm text-primary">USSD Channel Active</p>
								</div>
								<span className="text-[11px] font-mono font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20">
									EXT: {ussdCode}
								</span>
							</div>

							<p className="text-xs text-muted-foreground mb-4">
								Your attendees can dial the shortcode below from any network in Ghana to access your event menu:
							</p>

							{/* Dial Code Display */}
							<div className="flex flex-wrap items-center gap-2.5">
								<div className="bg-background border border-border/80 rounded-xl px-4 py-2.5 font-mono text-base sm:text-lg flex-1 min-w-[200px] text-center font-bold tracking-wider select-all text-foreground shadow-xs">
									{dialCode}
								</div>

								<Button
									type="button"
									variant="outline"
									size="icon"
									onClick={copyCode}
									title="Copy USSD Code"
									className="size-11 shrink-0"
								>
									<Copy className="size-4" />
								</Button>

								<Button
									type="button"
									variant="outline"
									size="icon"
									onClick={() => setShowQr(!showQr)}
									title={showQr ? "Hide QR Code" : "Show QR Code"}
									className="size-11 shrink-0"
								>
									<QrCodeIcon className="size-4" />
								</Button>

								<Button
									asChild
									variant="default"
									className="size-11 sm:w-auto sm:px-4 shrink-0 gap-2"
								>
									<a href={telUri}>
										<PhoneCall className="size-4" />
										<span className="hidden sm:inline">Dial Code</span>
									</a>
								</Button>
							</div>

							{/* Expandable QR Code Section */}
							{showQr && (
								<div className="mt-5 pt-4 border-t border-primary/15 flex flex-col sm:flex-row items-center gap-5">
									<div className="p-3 bg-white rounded-xl shadow-xs border">
										<div ref={qrRef}>
											<QRCode value={telUri} size={130} />
										</div>
									</div>
									<div className="space-y-2 text-center sm:text-left">
										<p className="text-xs font-bold text-foreground">USSD Quick Dial QR</p>
										<p className="text-xs text-muted-foreground max-w-sm">
											Attendees can scan this QR code with their phone camera to instantly load the USSD dialing string into their phone app.
										</p>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={downloadQrCode}
											className="gap-2"
										>
											<Download className="size-3.5" />
											Download QR
										</Button>
									</div>
								</div>
							)}
						</div>

						{/* Deactivate Option */}
						{canEdit && (
							<div className="flex justify-end pt-1">
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={handleDisable}
									disabled={isPending}
									className="text-xs text-muted-foreground hover:text-destructive gap-1.5"
								>
									<XCircle className="size-3.5" />
									Deactivate USSD Channel
								</Button>
							</div>
						)}
					</div>
				) : (
					/* Inactive State */
					<div className="bg-muted/20 border border-border/80 rounded-xl p-5">
						<div className="flex items-start gap-3 mb-4">
							<Info className="size-5 text-primary shrink-0 mt-0.5" />
							<div className="space-y-1">
								<p className="text-xs font-semibold text-foreground">
									Offline Ticketing &amp; Voting
								</p>
								<p className="text-xs text-muted-foreground leading-relaxed">
									USSD assigns a dedicated 3-digit extension code to your event (e.g. <span className="font-mono font-bold text-foreground">*384*77340*104#</span>). Users across Ghana can interact with your ticketing tiers and voting categories on any mobile device without mobile data.
								</p>
							</div>
						</div>

						{canEdit && (
							<Button
								type="button"
								onClick={handleEnable}
								disabled={isPending}
								className="w-full sm:w-auto gap-2 font-bold"
							>
								{isPending ? (
									<>
										<Loader2 className="size-4 animate-spin" />
										Generating Extension Code...
									</>
								) : (
									<>
										<Smartphone className="size-4" />
										Activate USSD Channel
									</>
								)}
							</Button>
						)}
					</div>
				)}
			</div>
		</Card>
	);
}
