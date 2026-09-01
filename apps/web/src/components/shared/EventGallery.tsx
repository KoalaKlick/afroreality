"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { getImageUrl } from "@/lib/image-url-utils";
import { cn } from "@/lib/utils";

interface EventGalleryProps {
	readonly images: string[];
	readonly className?: string;
	readonly maxDisplay?: number;
}

export function EventGallery({ images, className, maxDisplay = 5 }: EventGalleryProps) {
	const [lightboxOpen, setLightboxOpen] = useState(false);
	const [currentIndex, setCurrentIndex] = useState(0);

	if (!images || images.length === 0) return null;

	const displayImages = images.slice(0, maxDisplay);
	const hasMore = images.length > maxDisplay;

	const openLightbox = (index: number) => {
		setCurrentIndex(index);
		setLightboxOpen(true);
	};

	const closeLightbox = () => setLightboxOpen(false);

	const goToPrev = () => {
		setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
	};

	const goToNext = () => {
		setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
	};

	const getImageSrc = (img: string | undefined) => {
		if (!img) return "";
		return getImageUrl(img);
	};

	return (
		<>
			<div className={cn("w-full", className)}>
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
					{displayImages.map((img, index) => (
						<button
							key={index}
							type="button"
							onClick={() => openLightbox(index)}
							className="relative aspect-square overflow-hidden group"
						>
							<img
								src={getImageSrc(img)}
								alt={`Gallery image ${index + 1}`}
								className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
								loading="lazy"
							/>
							<div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
							{index === maxDisplay - 1 && hasMore && (
								<div className="absolute inset-0 bg-black/50 flex items-center justify-center">
									<span className="text-white font-bold text-lg">+{images.length - maxDisplay}</span>
								</div>
							)}
						</button>
					))}
				</div>
			</div>

			{/* Lightbox */}
			{lightboxOpen && (
				<div
					className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
					onClick={closeLightbox}
				>
					<button
						type="button"
						onClick={closeLightbox}
						className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors z-10"
					>
						<X className="size-6" />
					</button>

					{images.length > 1 && (
						<>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									goToPrev();
								}}
								className="absolute left-4 p-2 text-white/80 hover:text-white transition-colors"
							>
								<ChevronLeft className="size-8" />
							</button>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									goToNext();
								}}
								className="absolute right-4 p-2 text-white/80 hover:text-white transition-colors"
							>
								<ChevronRight className="size-8" />
							</button>
						</>
					)}

					<div
						className="max-w-4xl max-h-[90vh] p-4"
						onClick={(e) => e.stopPropagation()}
					>
						<img
							src={getImageSrc(images[currentIndex])}
							alt={`Gallery image ${currentIndex + 1}`}
							className="max-w-full max-h-[85vh] object-contain mx-auto"
						/>
						<p className="text-center text-white/60 text-sm mt-3">
							{currentIndex + 1} / {images.length}
						</p>
					</div>
				</div>
			)}
		</>
	);
}
