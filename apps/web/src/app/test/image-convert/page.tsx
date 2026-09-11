"use client";

import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from "react";

type OutputFormat = "image/webp" | "image/png" | "image/jpeg" | "image/avif";

interface ConvertedImage {
	name: string;
	originalName: string;
	originalSize: number;
	convertedSize: number;
	url: string;
	format: OutputFormat;
	width: number;
	height: number;
}

const FORMAT_OPTIONS: { value: OutputFormat; label: string; ext: string }[] = [
	{ value: "image/webp", label: "WebP", ext: "webp" },
	{ value: "image/png", label: "PNG", ext: "png" },
	{ value: "image/jpeg", label: "JPEG", ext: "jpg" },
	{ value: "image/avif", label: "AVIF", ext: "avif" },
];

function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileExtension(format: OutputFormat): string {
	return FORMAT_OPTIONS.find((f) => f.value === format)?.ext ?? "webp";
}

function stripExtension(filename: string): string {
	return filename.replace(/\.[^/.]+$/, "");
}

export default function ImageConvertPage() {
	const [files, setFiles] = useState<File[]>([]);
	const [outputFormat, setOutputFormat] = useState<OutputFormat>("image/webp");
	const [quality, setQuality] = useState(0.85);
	const [convertedImages, setConvertedImages] = useState<ConvertedImage[]>([]);
	const [isConverting, setIsConverting] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFiles = useCallback((newFiles: FileList | File[]) => {
		const imageFiles = Array.from(newFiles).filter((f) => f.type.startsWith("image/"));
		if (imageFiles.length === 0) {
			setError("No valid image files selected.");
			return;
		}
		setError(null);
		setFiles((prev) => [...prev, ...imageFiles]);
		setConvertedImages([]);
	}, []);

	const handleDrop = useCallback(
		(e: DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragging(false);
			if (e.dataTransfer.files) {
				handleFiles(e.dataTransfer.files);
			}
		},
		[handleFiles],
	);

	const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	}, []);

	const handleFileInput = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			if (e.target.files) {
				handleFiles(e.target.files);
			}
		},
		[handleFiles],
	);

	const removeFile = useCallback((index: number) => {
		setFiles((prev) => prev.filter((_, i) => i !== index));
		setConvertedImages([]);
	}, []);

	const convertImages = useCallback(async () => {
		if (files.length === 0) return;
		setIsConverting(true);
		setError(null);
		const results: ConvertedImage[] = [];

		for (const file of files) {
			try {
				const bitmap = await createImageBitmap(file);
				const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
				const ctx = canvas.getContext("2d");
				if (!ctx) throw new Error("Canvas context unavailable");

				ctx.drawImage(bitmap, 0, 0);
				bitmap.close();

				const blob = await canvas.convertToBlob({
					type: outputFormat,
					quality: outputFormat === "image/png" ? undefined : quality,
				});

				const url = URL.createObjectURL(blob);
				const ext = getFileExtension(outputFormat);

				results.push({
					name: `${stripExtension(file.name)}.${ext}`,
					originalName: file.name,
					originalSize: file.size,
					convertedSize: blob.size,
					url,
					format: outputFormat,
					width: canvas.width,
					height: canvas.height,
				});
			} catch (err) {
				console.error(`Failed to convert ${file.name}:`, err);
				setError(`Failed to convert "${file.name}". The format may not be supported by your browser.`);
			}
		}

		setConvertedImages(results);
		setIsConverting(false);
	}, [files, outputFormat, quality]);

	const downloadImage = useCallback((img: ConvertedImage) => {
		const a = document.createElement("a");
		a.href = img.url;
		a.download = img.name;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}, []);

	const downloadAll = useCallback(() => {
		for (const img of convertedImages) {
			downloadImage(img);
		}
	}, [convertedImages, downloadImage]);

	const clearAll = useCallback(() => {
		for (const img of convertedImages) {
			URL.revokeObjectURL(img.url);
		}
		setFiles([]);
		setConvertedImages([]);
		setError(null);
	}, [convertedImages]);

	const savingsPercent = (orig: number, conv: number) => {
		if (orig === 0) return 0;
		return Math.round(((orig - conv) / orig) * 100);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#0f0f1a] via-[#1a1025] to-[#0d1117] text-white">
			{/* Ambient glow effects */}
			<div className="pointer-events-none fixed inset-0 overflow-hidden">
				<div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-[120px]" />
				<div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px]" />
				<div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-500/5 blur-[150px]" />
			</div>

			<div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
				{/* Header */}
				<header className="mb-12 text-center">
					<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-purple-300 backdrop-blur-sm">
						<span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
						Internal Test Tool
					</div>
					<h1 className="font-outfit bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
						Image Converter
					</h1>
					<p className="mt-3 text-base text-white/50">
						Convert images to WebP, PNG, JPEG, or AVIF — entirely in your browser. Nothing uploaded.
					</p>
				</header>

				{/* Controls */}
				<div className="mb-8 flex flex-wrap items-end justify-center gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md">
					{/* Output Format */}
					<div className="flex flex-col gap-2">
						<label htmlFor="format-select" className="text-xs font-semibold uppercase tracking-widest text-white/40">
							Output Format
						</label>
						<div className="flex gap-1.5 rounded-xl bg-white/5 p-1">
							{FORMAT_OPTIONS.map((fmt) => (
								<button
									key={fmt.value}
									type="button"
									onClick={() => {
										setOutputFormat(fmt.value);
										setConvertedImages([]);
									}}
									className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
										outputFormat === fmt.value
											? "bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg shadow-purple-500/25"
											: "text-white/50 hover:bg-white/10 hover:text-white"
									}`}
								>
									{fmt.label}
								</button>
							))}
						</div>
					</div>

					{/* Quality Slider */}
					{outputFormat !== "image/png" && (
						<div className="flex flex-col gap-2">
							<label htmlFor="quality-slider" className="text-xs font-semibold uppercase tracking-widest text-white/40">
								Quality — {Math.round(quality * 100)}%
							</label>
							<input
								id="quality-slider"
								type="range"
								min="0.1"
								max="1"
								step="0.05"
								value={quality}
								onChange={(e) => {
									setQuality(parseFloat(e.target.value));
									setConvertedImages([]);
								}}
								className="h-2 w-48 cursor-pointer appearance-none rounded-full bg-white/10 accent-purple-500
								[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none
								[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r
								[&::-webkit-slider-thumb]:from-purple-500 [&::-webkit-slider-thumb]:to-cyan-500
								[&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-purple-500/40"
							/>
						</div>
					)}
				</div>

				{/* Drop Zone */}
				<div
					onDrop={handleDrop}
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onClick={() => fileInputRef.current?.click()}
					className={`group relative mb-8 cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300 ${
						isDragging
							? "border-purple-400 bg-purple-500/10 scale-[1.01]"
							: "border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]"
					}`}
				>
					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						multiple
						onChange={handleFileInput}
						className="hidden"
					/>

					<div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

					<div className="relative">
						{/* Upload Icon */}
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 ring-1 ring-white/10">
							<svg className="h-8 w-8 text-purple-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
							</svg>
						</div>
						<p className="text-lg font-semibold text-white/80">
							Drop images here or <span className="text-purple-400 underline decoration-purple-400/40 underline-offset-4">browse</span>
						</p>
						<p className="mt-1.5 text-sm text-white/35">PNG, JPEG, WebP, GIF, BMP, SVG, AVIF…</p>
					</div>
				</div>

				{/* Error */}
				{error && (
					<div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm text-red-300 backdrop-blur-sm">
						{error}
					</div>
				)}

				{/* File List */}
				{files.length > 0 && (
					<div className="mb-8 space-y-3">
						<div className="flex items-center justify-between">
							<h2 className="text-sm font-semibold uppercase tracking-widest text-white/40">
								Selected ({files.length})
							</h2>
							<button
								type="button"
								onClick={clearAll}
								className="text-xs font-medium text-white/30 transition-colors hover:text-red-400"
							>
								Clear all
							</button>
						</div>

						<div className="space-y-2">
							{files.map((file, i) => (
								<div
									key={`${file.name}-${file.size}-${i}`}
									className="group/item flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 transition-colors hover:bg-white/[0.06]"
								>
									<div className="flex items-center gap-3 min-w-0">
										<div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 text-xs font-bold uppercase text-purple-300">
											{file.name.split(".").pop()?.substring(0, 4)}
										</div>
										<div className="min-w-0">
											<p className="truncate text-sm font-medium text-white/80">{file.name}</p>
											<p className="text-xs text-white/30">{formatBytes(file.size)}</p>
										</div>
									</div>
									<button
										type="button"
										onClick={() => removeFile(i)}
										className="ml-3 flex-shrink-0 rounded-lg p-1.5 text-white/20 transition-colors hover:bg-red-500/15 hover:text-red-400"
									>
										<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</div>
							))}
						</div>

						{/* Convert Button */}
						<button
							type="button"
							onClick={convertImages}
							disabled={isConverting}
							className="mt-4 w-full rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-purple-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30 hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
						>
							{isConverting ? (
								<span className="inline-flex items-center gap-2">
									<svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
									</svg>
									Converting…
								</span>
							) : (
								`Convert ${files.length} image${files.length > 1 ? "s" : ""} to ${FORMAT_OPTIONS.find((f) => f.value === outputFormat)?.label}`
							)}
						</button>
					</div>
				)}

				{/* Results */}
				{convertedImages.length > 0 && (
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h2 className="text-sm font-semibold uppercase tracking-widest text-white/40">
								Converted ({convertedImages.length})
							</h2>
							{convertedImages.length > 1 && (
								<button
									type="button"
									onClick={downloadAll}
									className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:bg-white/20 hover:text-white"
								>
									<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
									</svg>
									Download All
								</button>
							)}
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							{convertedImages.map((img, i) => {
								const savings = savingsPercent(img.originalSize, img.convertedSize);
								const isSavings = savings > 0;

								return (
									<div
										key={`${img.name}-${i}`}
										className="group/card overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] transition-all duration-300 hover:border-white/15 hover:bg-white/[0.05]"
									>
										{/* Preview */}
										<div className="relative aspect-video w-full overflow-hidden bg-[#0a0a12]">
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img
												src={img.url}
												alt={img.name}
												className="h-full w-full object-contain"
											/>
											{/* Size badge */}
											<div className={`absolute right-2 top-2 rounded-md px-2 py-0.5 text-[10px] font-bold backdrop-blur-md ${
												isSavings
													? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30"
													: "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30"
											}`}>
												{isSavings ? `−${savings}%` : `+${Math.abs(savings)}%`}
											</div>
										</div>

										{/* Info */}
										<div className="p-4">
											<p className="truncate text-sm font-medium text-white/80">{img.name}</p>
											<div className="mt-1.5 flex items-center gap-2 text-xs text-white/35">
												<span>{img.width}×{img.height}</span>
												<span className="text-white/15">•</span>
												<span className="text-white/50">{formatBytes(img.originalSize)}</span>
												<svg className="h-3 w-3 text-white/25" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
												</svg>
												<span className={isSavings ? "font-semibold text-emerald-400" : "font-semibold text-amber-400"}>
													{formatBytes(img.convertedSize)}
												</span>
											</div>

											<button
												type="button"
												onClick={() => downloadImage(img)}
												className="mt-3 w-full rounded-lg bg-gradient-to-r from-purple-600/80 to-cyan-600/80 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all hover:from-purple-600 hover:to-cyan-600 hover:shadow-lg hover:shadow-purple-500/20"
											>
												Download
											</button>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				)}

				{/* Footer */}
				<p className="mt-16 text-center text-xs text-white/20">
					All processing happens in your browser. No images are uploaded to any server.
				</p>
			</div>
		</div>
	);
}
