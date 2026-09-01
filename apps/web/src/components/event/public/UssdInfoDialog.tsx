"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, PhoneCall, Smartphone, Check } from "lucide-react";
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

	const dialCode = getUssdDialCode(ussdCode);
	const telUri = getUssdTelUri(ussdCode);

	const copyCode = () => {
		navigator.clipboard.writeText(dialCode);
		setCopied(true);
		toast.success("USSD code copied to clipboard!");
		setTimeout(() => setCopied(false), 2000);
	};

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
					<div className="p-4 bg-white rounded-none border border-border/80 flex flex-col items-center">
						<QRCode value={telUri} size={168} level="M" />
						<p className="text-[10px] font-mono font-medium text-zinc-500 mt-2.5">
							Scan with phone camera to auto-dial
						</p>
					</div>

					{/* USSD Code Box */}
					<div className="w-full space-y-2">
						<p className="text-xs font-semibold text-center text-muted-foreground">
							Or dial directly from your phone dialer:
						</p>
						<div className="flex items-center gap-2">
							<div className="bg-muted/40 border border-border/80 rounded-sm px-4 py-2 font-mono text-lg font-black tracking-wider flex-1 text-center select-all text-foreground">
								{dialCode}
							</div>
							<Button
								type="button"
								variant="outline"
								size="icon"
								onClick={copyCode}
								className="size-12 shrink-0"
								title="Copy code"
							>
								{copied ? (
									<Check className="size-5 text-emerald-500" />
								) : (
									<Copy className="size-5" />
								)}
							</Button>
						</div>
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
