"use client";

import { Building2, Globe, ImagePlus, Loader2, Pencil, X } from "lucide-react";
import { useRef } from "react";
import AddFilesIcon from "@/assets/add-files.svg";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { useImageUpload } from "@/hooks/use-image-upload";
import { DOMAIN_NAME } from "@/lib/constants/branding";
import { cleanStorageKey, getOrgImageUrl } from "@/lib/image-url-utils";

interface OrgBrandIdentityProps {
	readonly name: string;
	readonly setName: (name: string) => void;
	readonly slug: string;
	readonly description: string;
	readonly setDescription: (desc: string) => void;
	readonly logoUrl: string;
	readonly setLogoUrl: (url: string) => void;
	readonly bannerUrl: string;
	readonly setBannerUrl: (url: string) => void;
	readonly logoUpload: ReturnType<typeof useImageUpload>;
	readonly bannerUpload: ReturnType<typeof useImageUpload>;
	readonly disabled?: boolean;
}

export function OrgBrandIdentity({
	name,
	setName,
	slug,
	description,
	setDescription,
	logoUrl,
	setLogoUrl,
	bannerUrl,
	setBannerUrl,
	logoUpload,
	bannerUpload,
	disabled = false,
}: OrgBrandIdentityProps) {
	const logoInputRef = useRef<HTMLInputElement>(null);
	const bannerInputRef = useRef<HTMLInputElement>(null);

	const bannerDisplayUrl = bannerUrl ? getOrgImageUrl(bannerUrl) : null;
	const logoDisplayUrl = logoUrl ? getOrgImageUrl(logoUrl) : null;

	async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		const res = await logoUpload.upload(file, logoUrl || undefined);
		if (res) {
			const relativeKey = cleanStorageKey(res.key || res.url);
			setLogoUrl(relativeKey);
		}
	}

	async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		const res = await bannerUpload.upload(file, bannerUrl || undefined);
		if (res) {
			const relativeKey = cleanStorageKey(res.key || res.url);
			setBannerUrl(relativeKey);
		}
	}

	function handleRemoveLogo() {
		setLogoUrl("");
		if (logoInputRef.current) {
			logoInputRef.current.value = "";
		}
	}

	function handleRemoveBanner() {
		setBannerUrl("");
		if (bannerInputRef.current) {
			bannerInputRef.current.value = "";
		}
	}

	return (
		<>
			{/* Brand Header Card with Clean Light Primary-50 Background */}
			<div className="bg-card rounded-2xl border border-primary-100/80 dark:border-primary-900/40 shadow-xs overflow-hidden mb-6">
				<input
					ref={bannerInputRef}
					type="file"
					accept="image/*"
					onChange={handleBannerUpload}
					className="hidden"
					id="banner-upload"
				/>
				<input
					ref={logoInputRef}
					type="file"
					accept="image/*"
					onChange={handleLogoUpload}
					className="hidden"
					id="logo-upload"
				/>

				{/* Banner Container */}
				<div className="relative h-36 sm:h-40 md:h-48 bg-primary-50/70 dark:bg-primary-950/20 group/banner overflow-hidden border-b border-primary-100/80 dark:border-primary-900/40">
					{bannerDisplayUrl ? (
						<>
							<img
								src={bannerDisplayUrl}
								alt="Organization banner"
								className="size-full object-cover relative z-10"
							/>
							{!disabled && (
								<>
									<button
										type="button"
										onClick={() => bannerInputRef.current?.click()}
										disabled={bannerUpload.isUploading}
										className="absolute inset-0 bg-black/50 opacity-0 group-hover/banner:opacity-100 transition-opacity flex items-center justify-center cursor-pointer z-20"
									>
										{bannerUpload.isUploading ? (
											<Loader2 className="size-8 text-white animate-spin" />
										) : (
											<div className="flex flex-col items-center text-white">
												<Pencil className="size-6 mb-1" />
												<span className="text-sm font-medium">
													Change Banner
												</span>
											</div>
										)}
									</button>
									<button
										type="button"
										onClick={handleRemoveBanner}
										className="absolute top-3 right-3 rounded-full bg-destructive p-1.5 text-destructive-foreground shadow-sm hover:bg-destructive/90 z-30 opacity-0 group-hover/banner:opacity-100 transition-opacity"
									>
										<X className="size-4" />
									</button>
								</>
							)}
						</>
					) : !disabled ? (
						<button
							type="button"
							className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-primary-100/50 dark:hover:bg-primary-900/30 transition-colors relative z-10 p-4"
							onClick={() => bannerInputRef.current?.click()}
							disabled={bannerUpload.isUploading}
						>
							{bannerUpload.isUploading ? (
								<Loader2 className="size-8 text-primary animate-spin" />
							) : (
								<>
									<ImagePlus className="size-9 text-primary/80 mb-1.5" />
									<p className="text-sm font-semibold text-foreground">
										Click to upload banner
									</p>
									<p className="text-xs text-muted-foreground">
										Recommended 1920x600px • PNG, JPG or WebP
									</p>
								</>
							)}
						</button>
					) : (
						<div className="size-full flex items-center justify-center relative z-10" />
					)}
				</div>

				{/* Lower Info Section */}
				<div className="px-6 pb-6 pt-0 relative">
					<div className="flex flex-col sm:flex-row gap-5 sm:items-end">
						{/* Logo Image (Overlaps Banner Only) */}
						<div className="relative shrink-0 -mt-14 sm:-mt-16 z-20">
							<div className="size-28 sm:size-36 rounded-2xl border-4 border-card bg-background overflow-hidden group/logo relative shadow-sm border-primary-200/80 dark:border-primary-800/40">
								{logoDisplayUrl ? (
									<>
										<img
											src={logoDisplayUrl}
											alt={name}
											className="size-full object-cover rounded-2xl"
										/>
										{!disabled && (
											<>
												<button
													type="button"
													onClick={() => logoInputRef.current?.click()}
													disabled={logoUpload.isUploading}
													className="absolute inset-0 bg-black/50 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-2xl"
												>
													{logoUpload.isUploading ? (
														<Loader2 className="size-5 text-white animate-spin" />
													) : (
														<Pencil className="size-5 text-white" />
													)}
												</button>
												<button
													type="button"
													onClick={handleRemoveLogo}
													className="absolute top-1.5 right-1.5 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm hover:bg-destructive/90 z-10 opacity-0 group-hover/logo:opacity-100 transition-opacity"
												>
													<X className="size-3" />
												</button>
											</>
										)}
									</>
								) : !disabled ? (
									<button
										type="button"
										className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-primary-100/50 dark:hover:bg-primary-900/30 transition-colors bg-primary-50/70 dark:bg-primary-950/20 relative overflow-hidden"
										onClick={() => logoInputRef.current?.click()}
										disabled={logoUpload.isUploading}
									>
										{logoUpload.isUploading ? (
											<Loader2 className="size-6 animate-spin text-primary relative z-10" />
										) : (
											<div className="flex flex-col items-center relative z-10">
												<AddFilesIcon className="size-8 text-primary/80 mb-1" />
												<span className="text-[10px] text-foreground font-semibold">
													Upload Logo
												</span>
											</div>
										)}
									</button>
								) : (
									<div className="w-full h-full flex items-center justify-center bg-primary-50/70 p-3 relative overflow-hidden">
										<Building2 className="size-10 text-primary/60 relative z-10" />
									</div>
								)}
							</div>
						</div>

						{/* Organization Name & Slug Header Preview */}
						<div className="flex-1 min-w-0 pt-3 sm:pt-4">
							<h2 className="text-xl sm:text-2xl font-black tracking-tight truncate">
								{name || "Organization Name"}
							</h2>
							{slug && (
								<p className="text-xs font-mono text-muted-foreground mt-0.5">
									/{slug}
								</p>
							)}
						</div>
					</div>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Globe className="h-5 w-5" />
						Organization Details
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="org-name">Organization Name</Label>
							<Input
								id="org-name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Your Organization"
								required
								disabled={disabled}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="org-slug">Public URL</Label>
							<Input
								id="org-slug"
								value={`${DOMAIN_NAME}/${slug}`}
								disabled
								className="bg-muted text-muted-foreground"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="org-description">Bio / Description</Label>
						<RichTextEditor
							value={description}
							onChange={setDescription}
							minimal={false}
							disabled={disabled}
						/>
					</div>
				</CardContent>
			</Card>
		</>
	);
}
