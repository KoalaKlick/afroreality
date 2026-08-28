"use client";
// src/components/organization/management/OrgGeneralSettings.tsx


import { Loader2, Settings } from "lucide-react";
import { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { useImageUpload } from "@/hooks/use-image-upload";
import { usePermissions } from "@/hooks/use-permissions";
import {
	UnsavedChangesGuard,
} from "@/hooks/use-unsaved-changes-guard";
import { updateOrganizationSettings } from "@/lib/server-functions/organization";
import { getErrorMessage } from "@/lib/utils";

import { OrgBrandIdentity } from "./OrgBrandIdentity";
import { OrgContactSocials } from "./OrgContactSocials";
import { OrgThemeColors } from "./OrgThemeColors";
import type { UseImageUploadResult } from "./types";

export interface OrgManageOrganization {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	logoUrl: string | null;
	bannerUrl: string | null;
	primaryColor: string;
	secondaryColor: string;
	tertiaryColor: string;
	websiteUrl: string | null;
	contactEmail: string | null;
	phone: string | null;
	socialLinks?: {
		id: string;
		url: string;
		createdAt: string;
		updatedAt: string;
	}[];
}

interface OrgGeneralSettingsProps {
	readonly organization: OrgManageOrganization;
}

export function OrgGeneralSettings({ organization }: OrgGeneralSettingsProps) {
	const router = useRouter();
	const { canManageSettings } = usePermissions();
	const [isPending, startTransition] = useTransition();

	const [lastSaved, setLastSaved] = useState(() => ({
		name: organization.name,
		description: organization.description ?? "",
		logoUrl: organization.logoUrl ?? "",
		bannerUrl: organization.bannerUrl ?? "",
		primaryColor: organization.primaryColor,
		secondaryColor: organization.secondaryColor,
		tertiaryColor: organization.tertiaryColor ?? "#dc2626",
		websiteUrl: organization.websiteUrl ?? "",
		contactEmail: organization.contactEmail ?? "",
		phone: organization.phone ?? "",
		socialLinks: organization.socialLinks?.map((l) => l.url) ?? [],
	}));

	const logoUpload: UseImageUploadResult = useImageUpload({
		folder: "organizations",
	});
	const bannerUpload: UseImageUploadResult = useImageUpload({
		folder: "organizations",
	});

	const [name, setName] = useState(lastSaved.name);
	const [description, setDescription] = useState(lastSaved.description);

	const [logoUrl, setLogoUrl] = useState(lastSaved.logoUrl);
	const [bannerUrl, setBannerUrl] = useState(lastSaved.bannerUrl);

	const [primaryColor, setPrimaryColor] = useState(lastSaved.primaryColor);
	const [secondaryColor, setSecondaryColor] = useState(lastSaved.secondaryColor);
	const [tertiaryColor, setTertiaryColor] = useState(lastSaved.tertiaryColor);

	const [websiteUrl, setWebsiteUrl] = useState(lastSaved.websiteUrl);
	const [contactEmail, setContactEmail] = useState(lastSaved.contactEmail);
	const [phone, setPhone] = useState(lastSaved.phone);

	const [socialLinks, setSocialLinks] = useState<string[]>(
		lastSaved.socialLinks,
	);

	// Sync state when organization prop updates or changes
	useEffect(() => {
		const newSaved = {
			name: organization.name,
			description: organization.description ?? "",
			logoUrl: organization.logoUrl ?? "",
			bannerUrl: organization.bannerUrl ?? "",
			primaryColor: organization.primaryColor,
			secondaryColor: organization.secondaryColor,
			tertiaryColor: organization.tertiaryColor ?? "#dc2626",
			websiteUrl: organization.websiteUrl ?? "",
			contactEmail: organization.contactEmail ?? "",
			phone: organization.phone ?? "",
			socialLinks: organization.socialLinks?.map((l) => l.url) ?? [],
		};
		setLastSaved(newSaved);
		setName(newSaved.name);
		setDescription(newSaved.description);
		setLogoUrl(newSaved.logoUrl);
		setBannerUrl(newSaved.bannerUrl);
		setPrimaryColor(newSaved.primaryColor);
		setSecondaryColor(newSaved.secondaryColor);
		setTertiaryColor(newSaved.tertiaryColor);
		setWebsiteUrl(newSaved.websiteUrl);
		setContactEmail(newSaved.contactEmail);
		setPhone(newSaved.phone);
		setSocialLinks(newSaved.socialLinks);
	}, [organization]);

	const isDirty = useMemo(
		() =>
			name !== lastSaved.name ||
			description !== lastSaved.description ||
			logoUrl !== lastSaved.logoUrl ||
			bannerUrl !== lastSaved.bannerUrl ||
			primaryColor !== lastSaved.primaryColor ||
			secondaryColor !== lastSaved.secondaryColor ||
			tertiaryColor !== lastSaved.tertiaryColor ||
			websiteUrl !== lastSaved.websiteUrl ||
			contactEmail !== lastSaved.contactEmail ||
			phone !== lastSaved.phone ||
			JSON.stringify(socialLinks) !==
				JSON.stringify(lastSaved.socialLinks),
		[
			name,
			description,
			logoUrl,
			bannerUrl,
			primaryColor,
			secondaryColor,
			tertiaryColor,
			websiteUrl,
			contactEmail,
			phone,
			socialLinks,
			lastSaved,
		],
	);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		if (contactEmail && !contactEmail.includes("@")) {
			toast.error("Please enter a valid email address");
			return;
		}

		if (websiteUrl && !/^https?:\/\/.+/.test(websiteUrl)) {
			toast.error("Please enter a valid URL starting with http:// or https://");
			return;
		}

		const validSocialLinks = socialLinks.filter((l) => l.trim() !== "");
		for (const link of validSocialLinks) {
			if (!/^https?:\/\/.+/.test(link)) {
				toast.error(`Invalid social URL: ${link}`);
				return;
			}
		}

		startTransition(async () => {
			try {
				await updateOrganizationSettings({
					data: {
						id: organization.id,
						name,
						slug: organization.slug,
						description: description || undefined,
						logoUrl: logoUrl || undefined,
						bannerUrl: bannerUrl || undefined,
						primaryColor,
						secondaryColor,
						tertiaryColor,
						websiteUrl: websiteUrl || undefined,
						contactEmail: contactEmail || undefined,
						phone: phone || undefined,
						socialLinks: validSocialLinks,
					},
				});
				toast.success("Organization settings updated!");
				setLastSaved({
					name,
					description,
					logoUrl,
					bannerUrl,
					primaryColor,
					secondaryColor,
					tertiaryColor,
					websiteUrl,
					contactEmail,
					phone,
					socialLinks: validSocialLinks,
				});
				await router.refresh();
			} catch (err) {
				toast.error(getErrorMessage(err));
			}
		});
	}

	return (
		<>
			<UnsavedChangesGuard
				isDirty={isDirty && canManageSettings}
				isSaving={isPending}
				cancelGotoId="save-all-changes"
			/>
			{!canManageSettings && (
				<div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
					<p className="font-semibold">View-Only Access</p>
					<p className="mt-0.5 text-xs text-muted-foreground">
						You are viewing these organization settings as a team member. Only organization owners and admins can make changes.
					</p>
				</div>
			)}
			<form onSubmit={handleSubmit} className="space-y-6">
			<fieldset disabled={!canManageSettings} className="space-y-6">
			<OrgBrandIdentity
				name={name}
				setName={setName}
				slug={organization.slug}
				description={description}
				setDescription={setDescription}
				logoUrl={logoUrl}
				setLogoUrl={setLogoUrl}
				bannerUrl={bannerUrl}
				setBannerUrl={setBannerUrl}
				logoUpload={logoUpload}
				bannerUpload={bannerUpload}
				disabled={!canManageSettings}
			/>

			<OrgThemeColors
				primaryColor={primaryColor}
				setPrimaryColor={setPrimaryColor}
				secondaryColor={secondaryColor}
				setSecondaryColor={setSecondaryColor}
				tertiaryColor={tertiaryColor}
				setTertiaryColor={setTertiaryColor}
				logoUrl={logoUrl}
				orgName={name}
			/>

			<OrgContactSocials
				websiteUrl={websiteUrl}
				setWebsiteUrl={setWebsiteUrl}
				contactEmail={contactEmail}
				setContactEmail={setContactEmail}
				phone={phone}
				setPhone={setPhone}
				socialLinks={socialLinks}
				setSocialLinks={setSocialLinks}
			/>
			</fieldset>

			{canManageSettings && (
				<>
					<Separator />
					<div className="flex justify-end">
						<button
							id="save-all-changes"
							type="submit"
							disabled={
								isPending || logoUpload.isUploading || bannerUpload.isUploading
							}
							className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
						>
							{isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Saving...
								</>
							) : (
								<>
									<Settings className="mr-2 h-4 w-4" />
									Save All Changes
								</>
							)}
						</button>
					</div>
				</>
			)}
		</form>
		</>
	);
}
