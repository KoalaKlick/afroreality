"use client";

import { useState } from "react";
import {
	Download,
	Printer,
	Loader2,
	QrCode,
	ImageIcon,
	ChevronDown,
	Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as htmlToImage from "html-to-image";
import { toast } from "sonner";

interface TicketDownloadButtonProps {
	ticketCode: string;
	eventTitle?: string;
	frontElementId?: string;
	backElementId?: string;
	bothElementId?: string;
	className?: string;
}

type ExportTarget = "both" | "back" | "front";

export function TicketDownloadButton({
	ticketCode,
	eventTitle = "Fextiva-Ticket",
	frontElementId = "ticket-export-front",
	backElementId = "ticket-export-back",
	bothElementId = "ticket-export-both",
	className = "",
}: TicketDownloadButtonProps) {
	const [activeExport, setActiveExport] = useState<ExportTarget | null>(null);

	const sanitizeFileName = (str: string) => {
		return str.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 40);
	};


	const handleDownload = async (target: ExportTarget) => {
		const elementId =
			target === "front"
				? frontElementId
				: target === "back"
					? backElementId
					: bothElementId;

		const targetLabel =
			target === "front"
				? "Front Pass"
				: target === "back"
					? "QR Gate Pass (Back)"
					: "Full Ticket";

		const node = document.getElementById(elementId);
		if (!node) {
			console.error(`Export container #${elementId} not found`);
			toast.error(`Could not locate ${targetLabel} container`);
			return;
		}

		try {
			setActiveExport(target);
			await new Promise((resolve) => setTimeout(resolve, 350));

			// Temporarily monkeypatch window.fetch so html-to-image's internal
			// image re-fetches are routed through our same-origin proxy.
			// This is necessary because html-to-image clones the DOM and re-fetches
			// every image src it finds — it doesn't expose a URL-rewriting hook.
			const originalFetch = window.fetch;
			window.fetch = (input, init) => {
				const url =
					typeof input === "string"
						? input
						: input instanceof URL
							? input.href
							: (input as Request).url;
				if (url.startsWith("https://") || url.startsWith("http://")) {
					const proxied = `/api/image-proxy?url=${encodeURIComponent(url)}`;
					return originalFetch(proxied, init);
				}
				return originalFetch(input, init);
			};

			let dataUrl: string;
			try {
				dataUrl = await htmlToImage.toPng(node, {
					quality: 1.0,
					pixelRatio: 3,
					skipAutoScale: true,
				});
			} finally {
				// Always restore original fetch, even if toPng throws
				window.fetch = originalFetch;
			}

			const cleanEvent = sanitizeFileName(eventTitle);
			const cleanCode = sanitizeFileName(ticketCode);
			const sideTag =
				target === "both" ? "Full" : target === "back" ? "QR-Pass" : "Front";

			const link = document.createElement("a");
			link.download = `${cleanEvent}-${cleanCode}-${sideTag}.png`;
			link.href = dataUrl;
			link.click();

			toast.success(`${targetLabel} downloaded successfully!`);
		} catch (err) {
			console.error(`Failed to export ${targetLabel}:`, err);
			toast.error(`Failed to generate ${targetLabel}. Please try again.`);
		} finally {
			setActiveExport(null);
		}
	};

	const handlePrint = () => {
		window.print();
	};

	const isDownloading = activeExport !== null;

	return (
		<div
			className={`flex flex-wrap items-center gap-2 print:hidden ${className}`}
		>
			{/* Print Shortcut */}
			<Button
				variant="outline"
				size="sm"
				onClick={handlePrint}
				className="text-xs gap-1.5 h-9 border-border/70 shadow-none"
			>
				<Printer className="size-3.5" />
				Print
			</Button>

			<div className="inline-flex rounded-lg">
				<Button
					size="sm"
					onClick={() => handleDownload("both")}
					disabled={isDownloading}
					className="text-xs gap-1.5 h-9 font-semibold rounded-r-none shadow-none"
				>
					{activeExport === "both" ? (
						<Loader2 className="size-3.5 animate-spin" />
					) : (
						<Download className="size-3.5" />
					)}
					Download
				</Button>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							size="sm"
							disabled={isDownloading}
							className="px-2 h-9 rounded-l-none border-l border-primary-foreground/20 shadow-none"
							aria-label="More download options"
						>
							<ChevronDown className="size-3.5" />
						</Button>
					</DropdownMenuTrigger>

					<DropdownMenuContent align="end" className="w-48">
						<DropdownMenuItem
							onClick={() => handleDownload("both")}
							disabled={isDownloading}
							className="text-xs cursor-pointer gap-2"
						>
							<Layers className="size-3.5 text-muted-foreground" />
							Full ticket
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() => handleDownload("back")}
							disabled={isDownloading}
							className="text-xs cursor-pointer gap-2"
						>
							<QrCode className="size-3.5 text-muted-foreground" />
							QR gate pass
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => handleDownload("front")}
							disabled={isDownloading}
							className="text-xs cursor-pointer gap-2"
						>
							<ImageIcon className="size-3.5 text-muted-foreground" />
							Front only
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}
