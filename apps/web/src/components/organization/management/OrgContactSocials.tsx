// src/components/organization/management/OrgContactSocials.tsx

import { Globe, Mail, Phone, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getSocialPlatform } from "@/lib/utils/event-icons";

export interface OrgContactSocialsProps {
	readonly websiteUrl: string;
	readonly setWebsiteUrl: (value: string) => void;
	readonly contactEmail: string;
	readonly setContactEmail: (value: string) => void;
	readonly phone: string;
	readonly setPhone: (value: string) => void;
	readonly socialLinks: string[];
	readonly setSocialLinks: (links: string[]) => void;
}

export function OrgContactSocials({
	websiteUrl,
	setWebsiteUrl,
	contactEmail,
	setContactEmail,
	phone,
	setPhone,
	socialLinks,
	setSocialLinks,
}: OrgContactSocialsProps) {
	function handleAddSocial() {
		setSocialLinks([...socialLinks, ""]);
	}

	function handleRemoveSocial(idx: number) {
		setSocialLinks(socialLinks.filter((_, i) => i !== idx));
	}

	function handleSocialChange(idx: number, val: string) {
		const next = [...socialLinks];
		next[idx] = val;
		setSocialLinks(next);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Mail className="h-5 w-5" />
					Contact & Details
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-4 sm:grid-cols-3">
					<div className="space-y-2">
						<Label htmlFor="org-website" className="flex items-center gap-1">
							<Globe className="h-3.5 w-3.5" /> Website
						</Label>
						<Input
							id="org-website"
							value={websiteUrl}
							onChange={(e) => setWebsiteUrl(e.target.value)}
							placeholder="https://yoursite.com"
							type="url"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="org-email" className="flex items-center gap-1">
							<Mail className="h-3.5 w-3.5" /> Support Email
						</Label>
						<Input
							id="org-email"
							type="email"
							value={contactEmail}
							onChange={(e) => setContactEmail(e.target.value)}
							placeholder="contact@yourorg.com"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="org-phone" className="flex items-center gap-1">
							<Phone className="h-3.5 w-3.5" /> Phone Number
						</Label>
						<Input
							id="org-phone"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
							placeholder="+233..."
						/>
					</div>
				</div>

				<Separator />

				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<Label className="text-base">Social Profiles</Label>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={handleAddSocial}
							className="h-8"
						>
							<Plus className="h-4 w-4 mr-2" />
							Add Profile
						</Button>
					</div>

					<div className="space-y-3">
						{socialLinks.map((url, index) => {
							const platform = getSocialPlatform(url);
							return (
								<div
									key={url || `empty-${index}`}
									className="flex gap-2 items-start group"
								>
									<div className="flex-1">
										<div className="relative">
											<div className="absolute left-3 top-1/2 -translate-y-1/2">
												{platform.icon}
											</div>
											<Input
												value={url}
												onChange={(e) =>
													handleSocialChange(index, e.target.value)
												}
												placeholder="https://instagram.com/yourhandle"
												className="pl-10"
											/>
										</div>
										{url && (
											<p className="text-[10px] mt-1 ml-1 font-medium">
												Detected: {platform.name}
											</p>
										)}
									</div>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => handleRemoveSocial(index)}
										className="h-10 w-10 text-muted-foreground hover:text-destructive"
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							);
						})}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
