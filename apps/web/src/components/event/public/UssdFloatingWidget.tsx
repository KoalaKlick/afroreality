"use client";

import { useState } from "react";
import QRCode from "react-qr-code";
import { X, Smartphone } from "lucide-react";
import { getUssdDialCode, getUssdTelUri } from "@/lib/utils/ussd";
import { UssdInfoDialog } from "./UssdInfoDialog";
import { cn } from "@/lib/utils";

interface UssdFloatingWidgetProps {
	readonly eventTitle: string;
	readonly ussdCode: string;
	readonly primaryColor?: string;
	readonly className?: string;
}

export function UssdFloatingWidget({
	eventTitle,
	ussdCode,
	primaryColor = "#009A44",
	className,
}: UssdFloatingWidgetProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isDismissed, setIsDismissed] = useState(false);

	if (!ussdCode || isDismissed) return null;

	const dialCode = getUssdDialCode(ussdCode);
	const telUri = getUssdTelUri(ussdCode);

	return (
		<>
			{/* Fixed Bottom Right Corner Widget */}
			<div
				className={cn(
					"fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300",
					className,
				)}
			>
				<div
					onClick={() => setIsOpen(true)}
					className="group relative bg-card/95 hover:bg-card backdrop-blur-md border border-border/90 hover:border-primary/50 shadow-xs  p-1 flex flex-col items-center gap-1.5 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95"
					title="Click to view USSD details"
					role="button"
					tabIndex={0}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							setIsOpen(true);
						}
					}}
				>
					{/* Close 'X' Button at top-right */}
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							setIsDismissed(true);
						}}
						className="absolute -top-2 -right-2 size-6 rounded-full bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center shadow-md transition-transform hover:scale-110 z-10"
						title="Close widget"
						aria-label="Close USSD widget"
					>
						<X className="size-3.5" />
					</button>

					{/* QR Code Container */}
					<div className="p-1 bg-white border border-black/5">
						<QRCode value={telUri} size={80} level="M" />
					</div>

					{/* Shortcode */}
					<span className="font-mono font-black text-[11px] sm:text-xs text-primary tracking-tight select-all">
						{dialCode}
					</span>
				</div>
			</div>

			{/* Full USSD Modal on click */}
			<UssdInfoDialog
				open={isOpen}
				onOpenChange={setIsOpen}
				eventTitle={eventTitle}
				ussdCode={ussdCode}
				primaryColor={primaryColor}
			/>
		</>
	);
}
