"use client";

import { useState, useRef, useCallback } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, PhoneCall, Smartphone, Check, Download } from "lucide-react";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import { getUssdDialCode, getUssdTelUri } from "@/lib/utils/ussd";

interface UssdInfoDialogProps {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly eventTitle: string;
	readonly ussdCode: string;
	readonly primaryColor?: string;
}

export function UssdInfoDialog({
	open,
	onOpenChange,
	eventTitle,
	ussdCode,
	primaryColor = "#009A44",
}: UssdInfoDialogProps) {
	const [copied, setCopied] = useState(false);
	const qrRef = useRef<HTMLDivElement>(null);

	const dialCode = getUssdDialCode(ussdCode);
	const telUri = getUssdTelUri(ussdCode);

	const copyCode = () => {
		navigator.clipboard.writeText(dialCode);
		setCopied(true);
		toast.success("USSD code copied to clipboard!");
		setTimeout(() => setCopied(false), 2000);
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
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md p-6  gap-6 overflow-hidden">
				<DialogHeader className="text-center sm:text-center space-y-2">
					<DialogTitle className="text-xl font-black uppercase tracking-tight text-foreground font-millik">
						Offline Ticketing &amp; Voting
					</DialogTitle>
					<DialogDescription className="text-xs text-muted-foreground">
						Purchase tickets or vote in <span className="font-semibold text-foreground">{eventTitle}</span> offline using any mobile phone across Ghana.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col items-center gap-5">
					{/* QR Code Container */}
					<div className="relative p-4 bg-white rounded-none border border-border/80 flex flex-col items-center">
						<div ref={qrRef}>
							<QRCode value={telUri} size={168} level="M" />
						</div>
						<p className="text-[10px] font-mono font-medium text-zinc-500 mt-2.5">
							Scan with phone camera to auto-dial
						</p>
						{/* Download icon button - bottom right corner */}
						<button
							type="button"
							onClick={downloadQrCode}
							className="absolute -bottom-0.5 -right-0.5 p-1.5  bg-background  border-border/60 text-muted-foreground hover:text-foreground hover:bg-background transition-all"
							title="Download QR Code"
						>
							<Download className="size-4" />
						</button>
					</div>

					{/* 3 Step Guide */}
					<div className="w-full bg-muted/20 border border-border/60 rounded-md p-4 text-xs space-y-2 text-muted-foreground">
						<p className="font-bold text-foreground text-[11px] uppercase tracking-wider">
							How It Works:
						</p>
						<ol className="list-decimal list-inside space-y-1 text-xs">
							<li>Dial the shortcode or scan the QR code above.</li>
							<li>Select your tickets or nominee to cast votes.</li>
							<li>Approve the Mobile Money PIN prompt on your phone.</li>
						</ol>
					</div>

					{/* Action Buttons */}
					<div className="w-full flex gap-3">
						<Button
							asChild
							className="flex-1 h-11 font-bold gap-2"
							style={{ backgroundColor: primaryColor }}
						>
							<a href={telUri}>
								<PhoneCall className="size-4" />
								Dial Now ({dialCode})
							</a>
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
