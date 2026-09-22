"use client";

import { useEffect, useState, useCallback } from "react";
import {
	X,
	ChevronLeft,
	ChevronRight,
	Maximize2,
	ExternalLink,
	Images,
} from "lucide-react";
import { getImageUrl } from "@/lib/image-url-utils";
import { cn } from "@/lib/utils";

interface EventGalleryProps {
	readonly images: string[];
	readonly className?: string;
	readonly maxDisplay?: number;
}

export function EventGallery({ images, className }: EventGalleryProps) {
	const [lightboxOpen, setLightboxOpen] = useState(false);
	const [currentIndex, setCurrentIndex] = useState(0);

	const validImages = (images || []).filter(Boolean);
	const count = validImages.length;

	const openLightbox = (index: number) => {
		setCurrentIndex(index);
		setLightboxOpen(true);
	};

	const closeLightbox = useCallback(() => {
		setLightboxOpen(false);
	}, []);

	const goToPrev = useCallback(() => {
		setCurrentIndex((prev) => (prev === 0 ? count - 1 : prev - 1));
	}, [count]);

	const goToNext = useCallback(() => {
		setCurrentIndex((prev) => (prev === count - 1 ? 0 : prev + 1));
	}, [count]);

	// Keyboard navigation and body scroll lock
	useEffect(() => {
		if (!lightboxOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") closeLightbox();
			if (e.key === "ArrowLeft") goToPrev();
			if (e.key === "ArrowRight") goToNext();
		};

		document.addEventListener("keydown", handleKeyDown);
		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			document.body.style.overflow = originalOverflow;
		};
	}, [lightboxOpen, closeLightbox, goToPrev, goToNext]);

	if (count === 0) return null;

	const getImageSrc = (img: string | undefined) => {
		if (!img) return "";
		return getImageUrl(img);
	};

	// Helper for rendering an image cell button
	const renderImageCell = (
		img: string | undefined,
		index: number,
		cellClassName?: string,
		isLastWithMore = false,
		moreCount = 0,
	) => {
		if (!img) return null;
		return (
			<button
				key={index}
				type="button"
				onClick={() => openLightbox(index)}
				className={cn(
					"relative h-full w-full overflow-hidden group cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:z-10",
					cellClassName,
				)}
				aria-label={`View photo ${index + 1} of ${count}`}
			>
				<img
					src={getImageSrc(img)}
					alt={`Event photo ${index + 1}`}
					className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
					loading={index === 0 ? "eager" : "lazy"}
				/>
				{/* Hover scrim overlay */}
				<div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 z-10" />

				{/* Corner view indicator on hover (only when no +N overlay) */}
				{!isLastWithMore && (
					<div className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/60 backdrop-blur-md rounded-full p-1.5 text-white shadow-md z-15">
						<Maximize2 className="size-3.5" />
					</div>
				)}

				{/* +N More Photos overlay for the last quadrant */}
				{isLastWithMore && (
					<div className="absolute inset-0 bg-black/60 backdrop-blur-xs group-hover:bg-black/70 flex flex-col items-center justify-center text-white transition-colors duration-300 p-2 text-center z-20">
						<span className="text-2xl sm:text-4xl font-black tracking-tight drop-shadow-md">
							+{moreCount}
						</span>
						<span className="text-[11px] sm:text-xs font-semibold text-white/90 uppercase tracking-wider mt-1 flex items-center gap-1.5 drop-shadow-sm">
							<Images className="size-3.5 text-primary" />
							<span>View all {count}</span>
						</span>
					</div>
				)}
			</button>
		);
	};

	return (
		<>
			{/* Modern Uneven / Asymmetric Twitter-Style Dynamic Gallery */}
			<div className={cn("w-full relative group/gallery", className)}>
				<div className="rounded-lg overflow-hidden border border-border/50 shadow-sm bg-muted/20">
					{/* CASE 1: Single Image - Cinematic Hero Aspect */}
					{count === 1 && (
						<div className="w-full aspect-16/10 sm:aspect-16/9 max-h-[500px]">
							{renderImageCell(validImages[0], 0, "h-full")}
						</div>
					)}

					{/* CASE 2: Two Images - Asymmetric 7/5 Split */}
					{count === 2 && (
						<div className="grid grid-cols-12 gap-1.5 sm:gap-2 aspect-16/10 sm:aspect-16/9 w-full h-[320px] sm:h-[400px] md:h-[460px]">
							<div className="col-span-7 h-full">
								{renderImageCell(validImages[0], 0, "h-full")}
							</div>
							<div className="col-span-5 h-full">
								{renderImageCell(validImages[1], 1, "h-full")}
							</div>
						</div>
					)}

					{/* CASE 3: Three Images - 1 Tall Portrait Hero Left, 2 Stacked Landscapes Right */}
					{count === 3 && (
						<div className="grid grid-cols-12 gap-1.5 sm:gap-2 aspect-16/10 sm:aspect-16/9 w-full h-[340px] sm:h-[420px] md:h-[480px]">
							<div className="col-span-7 h-full">
								{renderImageCell(validImages[0], 0, "h-full")}
							</div>
							<div className="col-span-5 grid grid-rows-2 gap-1.5 sm:gap-2 h-full">
								<div className="h-full">
									{renderImageCell(validImages[1], 1, "h-full")}
								</div>
								<div className="h-full">
									{renderImageCell(validImages[2], 2, "h-full")}
								</div>
							</div>
						</div>
					)}

					{/* CASE 4: Four Images - Asymmetric Mosaic (1 Tall Hero Left + 1 Landscape Top Right + 2 Compact Bottom Right) */}
					{count === 4 && (
						<div className="grid grid-cols-12 gap-1.5 sm:gap-2 aspect-16/10 sm:aspect-16/9 w-full h-[360px] sm:h-[440px] md:h-[500px]">
							{/* Large Featured Hero */}
							<div className="col-span-7 h-full">
								{renderImageCell(validImages[0], 0, "h-full")}
							</div>

							{/* Right Column: 1 Landscape Top + 2 Square/Portrait Bottom */}
							<div className="col-span-5 flex flex-col gap-1.5 sm:gap-2 h-full">
								<div className="flex-1 min-h-0">
									{renderImageCell(validImages[1], 1, "h-full")}
								</div>
								<div className="grid grid-cols-2 gap-1.5 sm:gap-2 flex-1 min-h-0">
									<div className="h-full">
										{renderImageCell(validImages[2], 2, "h-full")}
									</div>
									<div className="h-full">
										{renderImageCell(validImages[3], 3, "h-full")}
									</div>
								</div>
							</div>
						</div>
					)}

					{/* CASE 5+: Five or More Images - Editorial Mosaic with Hero + Staggered Right Grid + More Overlay */}
					{count >= 5 && (
						<div className="grid grid-cols-12 gap-1.5 sm:gap-2 aspect-16/10 sm:aspect-16/9 w-full h-[360px] sm:h-[440px] md:h-[500px]">
							{/* Large Featured Hero Card */}
							<div className="col-span-7 h-full">
								{renderImageCell(validImages[0], 0, "h-full")}
							</div>

							{/* Right Column: 1 Landscape Top + 2 Cards Bottom (second with +N overlay) */}
							<div className="col-span-5 flex flex-col gap-1.5 sm:gap-2 h-full">
								<div className="flex-1 min-h-0">
									{renderImageCell(validImages[1], 1, "h-full")}
								</div>
								<div className="grid grid-cols-2 gap-1.5 sm:gap-2 flex-1 min-h-0">
									<div className="h-full">
										{renderImageCell(validImages[2], 2, "h-full")}
									</div>
									<div className="h-full">
										{renderImageCell(
											validImages[3],
											3,
											"h-full",
											true,
											count - 3,
										)}
									</div>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Floating Header Badge (only when count <= 4, since count >= 5 has the +N tile) */}
				{count > 1 && count <= 4 && (
					<button
						type="button"
						onClick={() => openLightbox(0)}
						className="absolute bottom-3 right-3 z-10 px-3 py-1.5 rounded-full bg-black/75 hover:bg-black/90 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg border border-white/10 transition-all hover:scale-105 active:scale-95"
					>
						<Images className="size-3.5" />
						<span>{count} Photos</span>
					</button>
				)}
			</div>

			{/* Fullscreen Lightbox Modal */}
			{lightboxOpen && (
				<div
					className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between select-none animate-in fade-in duration-200"
					onClick={closeLightbox}
					role="dialog"
					aria-modal="true"
					aria-label="Photo gallery"
				>
					{/* Top Header Controls */}
					<div
						className="flex items-center justify-between px-4 sm:px-6 py-4 bg-gradient-to-b from-black/80 to-transparent z-20"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center gap-2">
							<span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white text-xs sm:text-sm font-medium border border-white/10">
								{currentIndex + 1} / {count}
							</span>
						</div>

						<div className="flex items-center gap-2">
							<a
								href={getImageSrc(validImages[currentIndex])}
								target="_blank"
								rel="noopener noreferrer"
								className="p-2.5 rounded-full text-white/75 hover:text-white hover:bg-white/10 transition-colors"
								title="Open original image"
							>
								<ExternalLink className="size-5" />
							</a>
							<button
								type="button"
								onClick={closeLightbox}
								className="p-2.5 rounded-full text-white/75 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
								title="Close (Esc)"
								aria-label="Close photo viewer"
							>
								<X className="size-5 sm:size-6" />
							</button>
						</div>
					</div>

					{/* Center Main Image Stage */}
					<div
						className="relative flex-1 flex items-center justify-center px-4 sm:px-16 overflow-hidden"
						onClick={(e) => e.stopPropagation()}
					>
						{/* Prev Arrow */}
						{count > 1 && (
							<button
								type="button"
								onClick={goToPrev}
								className="absolute left-3 sm:left-6 z-20 p-3 rounded-full bg-black/50 hover:bg-white/20 text-white backdrop-blur-md transition-all hover:scale-110 active:scale-95 cursor-pointer border border-white/10 shadow-xl"
								title="Previous photo (Arrow Left)"
								aria-label="Previous photo"
							>
								<ChevronLeft className="size-6 sm:size-7" />
							</button>
						)}

						{/* Main Focused Image */}
						<div className="relative max-h-[72vh] sm:max-h-[78vh] max-w-[90vw] flex items-center justify-center">
							<img
								key={currentIndex}
								src={getImageSrc(validImages[currentIndex])}
								alt={`Event photo ${currentIndex + 1}`}
								className="max-h-[72vh] sm:max-h-[78vh] max-w-[90vw] object-contain shadow-2xl transition-all duration-200 animate-in fade-in zoom-in-95"
							/>
						</div>

						{/* Next Arrow */}
						{count > 1 && (
							<button
								type="button"
								onClick={goToNext}
								className="absolute right-3 sm:right-6 z-20 p-3 rounded-full bg-black/50 hover:bg-white/20 text-white backdrop-blur-md transition-all hover:scale-110 active:scale-95 cursor-pointer border border-white/10 shadow-xl"
								title="Next photo (Arrow Right)"
								aria-label="Next photo"
							>
								<ChevronRight className="size-6 sm:size-7" />
							</button>
						)}
					</div>

					{/* Bottom Thumbnail Strip */}
					{count > 1 && (
						<div
							className="px-4 sm:px-6 py-4 bg-gradient-to-t from-black/90 via-black/70 to-transparent z-20"
							onClick={(e) => e.stopPropagation()}
						>
							<div className="flex items-center justify-center gap-2 overflow-x-auto py-1 max-w-4xl mx-auto scrollbar-thin scrollbar-thumb-white/20">
								{validImages.map((img, idx) => (
									<button
										key={idx}
										type="button"
										onClick={() => setCurrentIndex(idx)}
										className={cn(
											"relative size-12 sm:size-14 shrink-0 rounded-md overflow-hidden transition-all duration-200 cursor-pointer border",
											idx === currentIndex
												? "ring-2 ring-primary ring-offset-2 ring-offset-black border-transparent scale-105 opacity-100 shadow-md"
												: "border-white/20 opacity-40 hover:opacity-80 hover:border-white/50",
										)}
										aria-label={`Jump to photo ${idx + 1}`}
									>
										<img
											src={getImageSrc(img)}
											alt={`Thumbnail ${idx + 1}`}
											className="w-full h-full object-cover"
										/>
									</button>
								))}
							</div>
						</div>
					)}
				</div>
			)}
		</>
	);
}
