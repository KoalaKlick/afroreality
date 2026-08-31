"use client";
// src/components/organization/management/OrgGeneralSettings.tsx

import { Loader2, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useImageUpload } from "@/hooks/use-image-upload";
import { usePermissions } from "@/hooks/use-permissions";
import { UnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";
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

function normalizeHtml(html: string | null | undefined): string {
	if (!html) return "";
	const trimmed = html.trim();
	if (
		trimmed === "<p></p>" ||
		trimmed === "<p><br></p>" ||
		trimmed === "<p><br/></p>" ||
		trimmed === "<p></br></p>"
	) {
		return "";
	}
	return trimmed;
}

function normalizeArray(
	arr: (string | null | undefined)[] | undefined,
): string[] {
	if (!arr) return [];
	return arr.map((s) => (s || "").trim()).filter(Boolean);
}

export function OrgGeneralSettings({ organization }: OrgGeneralSettingsProps) {
	const router = useRouter();
	const { canManageSettings } = usePermissions();
	const [isPending, startTransition] = useTransition();

	const [lastSaved, setLastSaved] = useState(() => ({
		name: organization.name ?? "",
		description: normalizeHtml(organization.description),
		logoUrl: organization.logoUrl ?? "",
		bannerUrl: organization.bannerUrl ?? "",
		primaryColor: organization.primaryColor ?? "#10b981",
		secondaryColor: organization.secondaryColor ?? "#047857",
		tertiaryColor: organization.tertiaryColor ?? "#dc2626",
		websiteUrl: organization.websiteUrl ?? "",
		contactEmail: organization.contactEmail ?? "",
		phone: organization.phone ?? "",
		socialLinks: normalizeArray(organization.socialLinks?.map((l) => l.url)),
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
	const [secondaryColor, setSecondaryColor] = useState(
		lastSaved.secondaryColor,
	);
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
			name: organization.name ?? "",
			description: normalizeHtml(organization.description),
			logoUrl: organization.logoUrl ?? "",
			bannerUrl: organization.bannerUrl ?? "",
			primaryColor: organization.primaryColor ?? "#10b981",
			secondaryColor: organization.secondaryColor ?? "#047857",
			tertiaryColor: organization.tertiaryColor ?? "#dc2626",
			websiteUrl: organization.websiteUrl ?? "",
			contactEmail: organization.contactEmail ?? "",
			phone: organization.phone ?? "",
			socialLinks: normalizeArray(organization.socialLinks?.map((l) => l.url)),
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

	const isDirty = useMemo(() => {
		const nameChanged = (name || "").trim() !== (lastSaved.name || "").trim();
		const descChanged =
			normalizeHtml(description) !== normalizeHtml(lastSaved.description);
		const logoChanged =
			(logoUrl || "").trim() !== (lastSaved.logoUrl || "").trim();
		const bannerChanged =
			(bannerUrl || "").trim() !== (lastSaved.bannerUrl || "").trim();
		const primaryChanged =
			(primaryColor || "").toLowerCase() !==
			(lastSaved.primaryColor || "").toLowerCase();
		const secondaryChanged =
			(secondaryColor || "").toLowerCase() !==
			(lastSaved.secondaryColor || "").toLowerCase();
		const tertiaryChanged =
			(tertiaryColor || "").toLowerCase() !==
			(lastSaved.tertiaryColor || "").toLowerCase();
		const websiteChanged =
			(websiteUrl || "").trim() !== (lastSaved.websiteUrl || "").trim();
		const emailChanged =
			(contactEmail || "").trim().toLowerCase() !==
			(lastSaved.contactEmail || "").trim().toLowerCase();
		const phoneChanged =
			(phone || "").trim() !== (lastSaved.phone || "").trim();
		const socialLinksChanged =
			JSON.stringify(normalizeArray(socialLinks)) !==
			JSON.stringify(normalizeArray(lastSaved.socialLinks));

		return (
			nameChanged ||
			descChanged ||
			logoChanged ||
			bannerChanged ||
			primaryChanged ||
			secondaryChanged ||
			tertiaryChanged ||
			websiteChanged ||
			emailChanged ||
			phoneChanged ||
			socialLinksChanged
		);
	}, [
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
	]);

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
				toast.error(
					`Invalid social link: "${link}". Must start with http:// or https://`,
				);
				return;
			}
		}

		startTransition(async () => {
			try {
				await updateOrganizationSettings({
					data: {
						id: organization.id,
						name: name.trim(),
						description: description ? description.trim() : null,
						logoUrl: logoUrl || null,
						bannerUrl: bannerUrl || null,
						primaryColor,
						secondaryColor,
						tertiaryColor,
						websiteUrl: websiteUrl ? websiteUrl.trim() : null,
						contactEmail: contactEmail ? contactEmail.trim() : null,
						phone: phone ? phone.trim() : null,
						socialLinks: validSocialLinks,
					},
				});

				setLastSaved({
					name: name.trim(),
					description: normalizeHtml(description),
					logoUrl: logoUrl || "",
					bannerUrl: bannerUrl || "",
					primaryColor,
					secondaryColor,
					tertiaryColor,
					websiteUrl: websiteUrl ? websiteUrl.trim() : "",
					contactEmail: contactEmail ? contactEmail.trim() : "",
					phone: phone ? phone.trim() : "",
					socialLinks: validSocialLinks,
				});

				toast.success("Organization settings updated!");
				await router.refresh();
			} catch (error) {
				toast.error(getErrorMessage(error));
			}
		});
	}

	return (
		<>
			<UnsavedChangesGuard
				isDirty={isDirty}
				isSaving={isPending}
				cancelGotoId="save-org-settings-btn"
			/>

			<form onSubmit={handleSubmit} className="space-y-6">
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
					bannerUrl={bannerUrl}
					orgName={name}
					description={description}
					websiteUrl={websiteUrl}
					contactEmail={contactEmail}
					phone={phone}
					socialLinks={socialLinks}
					slug={organization.slug}
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

				{canManageSettings && (
					<div className="flex justify-end pt-4">
						<Button
							id="save-org-settings-btn"
							type="submit"
							disabled={isPending || !isDirty}
							className="gap-2"
						>
							{isPending ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								<Settings className="size-4" />
							)}
							Save Changes
						</Button>
					</div>
				)}
			</form>
		</>
	);
}
