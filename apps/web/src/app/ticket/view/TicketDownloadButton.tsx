"use client";

import { useState } from "react";
import {
	Download,
	Printer,
	Loader2,
	QrCode,
	Sparkles,
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
			// Small delay to ensure fonts, QR SVG, and layout settle
			await new Promise((resolve) => setTimeout(resolve, 350));

			const dataUrl = await htmlToImage.toPng(node, {
				quality: 1.0,
				pixelRatio: 3, // Crisp high-res 300+ DPI output
				skipAutoScale: true,
				cacheBust: true,
			});

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
				className="text-xs gap-1.5 h-9 border-border/80 hover:bg-accent"
			>
				<Printer className="size-3.5" />
				Print
			</Button>

			{/* Primary Dropdown / Split Action */}
			<div className="inline-flex rounded-lg shadow-xs">
				<Button
					size="sm"
					onClick={() => handleDownload("both")}
					disabled={isDownloading}
					className="text-xs gap-1.5 h-9 font-semibold rounded-r-none bg-emerald-600 hover:bg-emerald-700 text-white"
				>
					{activeExport === "both" ? (
						<Loader2 className="size-3.5 animate-spin" />
					) : (
						<Download className="size-3.5" />
					)}
					Download Full Ticket
				</Button>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							size="sm"
							disabled={isDownloading}
							className="px-2 h-9 rounded-l-none border-l border-emerald-700/50 bg-emerald-600 hover:bg-emerald-700 text-white"
						>
							<ChevronDown className="size-3.5" />
						</Button>
					</DropdownMenuTrigger>

					<DropdownMenuContent align="end" className="w-56">
						<DropdownMenuItem
							onClick={() => handleDownload("both")}
							disabled={isDownloading}
							className="text-xs cursor-pointer py-2 gap-2"
						>
							<Layers className="size-4 text-emerald-500" />
							<div className="flex flex-col">
								<span className="font-semibold">Full Ticket (Both Sides)</span>
								<span className="text-[10px] text-muted-foreground">
									High-res stacked PNG
								</span>
							</div>
						</DropdownMenuItem>

						<DropdownMenuSeparator />

						<DropdownMenuItem
							onClick={() => handleDownload("back")}
							disabled={isDownloading}
							className="text-xs cursor-pointer py-2 gap-2"
						>
							<QrCode className="size-4 text-primary" />
							<div className="flex flex-col">
								<span className="font-semibold">QR Code Gate Pass</span>
								<span className="text-[10px] text-muted-foreground">
									Back side for entrance scanning
								</span>
							</div>
						</DropdownMenuItem>

						<DropdownMenuItem
							onClick={() => handleDownload("front")}
							disabled={isDownloading}
							className="text-xs cursor-pointer py-2 gap-2"
						>
							<Sparkles className="size-4 text-amber-500" />
							<div className="flex flex-col">
								<span className="font-semibold">Front Badge / Banner</span>
								<span className="text-[10px] text-muted-foreground">
									Event souvenir artwork
								</span>
							</div>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}
