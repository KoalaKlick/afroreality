"use client";

import { useState } from "react";
import { Smartphone, QrCode } from "lucide-react";
import { getUssdDialCode } from "@/lib/utils/ussd";
import { UssdInfoDialog } from "./UssdInfoDialog";
import { cn } from "@/lib/utils";

interface UssdDialPillProps {
	readonly eventTitle: string;
	readonly ussdCode: string;
	readonly primaryColor?: string;
	readonly className?: string;
}

export function UssdDialPill({
	eventTitle,
	ussdCode,
	primaryColor,
	className,
}: UssdDialPillProps) {
	const [open, setOpen] = useState(false);
	const dialCode = getUssdDialCode(ussdCode);

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className={cn(
					"group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 text-foreground transition-all duration-200 text-xs font-semibold shadow-2xs hover:shadow-xs",
					className,
				)}
				title="Click to view offline USSD shortcode & QR code"
			>
				<Smartphone className="size-3.5 text-primary shrink-0 transition-transform group-hover:scale-110" />
				<span className="font-mono tracking-tight text-primary font-bold">
					{dialCode}
				</span>
				<span className="text-[10px] text-muted-foreground uppercase font-bold border-l pl-2 border-border/80 flex items-center gap-1">
					<QrCode className="size-3 text-muted-foreground" />
					USSD
				</span>
			</button>

			<UssdInfoDialog
				open={open}
				onOpenChange={setOpen}
				eventTitle={eventTitle}
				ussdCode={ussdCode}
				primaryColor={primaryColor}
			/>
		</>
	);
}
