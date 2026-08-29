"use client";

import { useState } from "react";
import { Download, Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TicketDownloadButton({
	ticketCode,
	elementId = "ticket-render-card",
}: {
	ticketCode: string;
	elementId?: string;
}) {
	const [isDownloading, setIsDownloading] = useState(false);

	const handleDownloadImage = async () => {
		const element = document.getElementById(elementId);
		if (!element) return;

		setIsDownloading(true);
		try {
			const html2canvas = (await import("html2canvas")).default;
			const canvas = await html2canvas(element, {
				scale: 2,
				useCORS: true,
				backgroundColor: null,
			});
			const image = canvas.toDataURL("image/png");
			const link = document.createElement("a");
			link.href = image;
			link.download = `ticket-${ticketCode}.png`;
			link.click();
		} catch (error) {
			console.error("Failed to generate ticket image:", error);
		} finally {
			setIsDownloading(false);
		}
	};

	const handlePrint = () => {
		window.print();
	};

	return (
		<div className="flex items-center gap-3 print:hidden">
			<Button
				variant="outline"
				size="sm"
				onClick={handlePrint}
				className="text-xs gap-1.5 h-9"
			>
				<Printer className="size-3.5" />
				Print Ticket
			</Button>

			<Button
				size="sm"
				onClick={handleDownloadImage}
				disabled={isDownloading}
				className="text-xs gap-1.5 h-9 font-semibold"
			>
				{isDownloading ? (
					<Loader2 className="size-3.5 animate-spin" />
				) : (
					<Download className="size-3.5" />
				)}
				Download Ticket (PNG)
			</Button>
		</div>
	);
}
