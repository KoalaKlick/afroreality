"use client";

import { useState } from "react";
import QRCode from "react-qr-code";
import { X } from "lucide-react";
import { getUssdDialCode, getUssdTelUri } from "@/lib/utils/ussd";
import { UssdInfoDialog } from "./UssdInfoDialog";
import { PROJ_NAME } from "@/lib/constants/branding";
import { cn } from "@/lib/utils";

interface UssdFloatingWidgetProps {
	readonly eventTitle?: string;
	readonly ussdCode?: string | null;
	readonly primaryColor?: string;
	readonly className?: string;
}

export function UssdFloatingWidget({
	eventTitle = PROJ_NAME,
	ussdCode = "root",
	primaryColor = "var(--color-primary-600, #ca0808)",
	className,
}: UssdFloatingWidgetProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isDismissed, setIsDismissed] = useState(false);

	if (isDismissed) return null;

	const dialCode = getUssdDialCode(ussdCode);
	const telUri = getUssdTelUri(ussdCode);

	return (
		<>
			{/* Fixed Bottom Right Corner Widget (Preline Clean Style: 1px border, rounded-lg, zero shadows) */}
			<div
				className={cn(
					"fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300",
					className,
				)}
			>
				<div
					onClick={() => setIsOpen(true)}
					className="group relative bg-background/95 hover:bg-background backdrop-blur-md border border-border hover:border-primary/60 rounded-lg p-1.5 flex flex-col items-center gap-1 cursor-pointer transition-colors shadow-none"
					title="Click to view offline USSD dialing details"
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
						className="absolute -top-2 -right-2 size-5 rounded-full bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors z-10 shadow-none"
						title="Dismiss"
						aria-label="Close USSD widget"
					>
						<X className="size-3" />
					</button>

					{/* QR Code Container */}
					<div className="p-1 bg-white rounded-md border border-border/40">
						<QRCode value={telUri} size={74} level="M" />
					</div>

					{/* Shortcode */}
					<span className="font-mono font-bold text-[10px] sm:text-[11px] text-primary tracking-tight select-all">
						{dialCode}
					</span>
				</div>
			</div>

			{/* Full USSD Modal on click */}
			<UssdInfoDialog
				open={isOpen}
				onOpenChange={setIsOpen}
				eventTitle={eventTitle}
				ussdCode={ussdCode || "root"}
				primaryColor={primaryColor}
			/>
		</>
	);
}
