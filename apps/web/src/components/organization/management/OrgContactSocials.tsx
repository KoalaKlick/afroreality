"use client";

// src/components/organization/management/OrgContactSocials.tsx

import { useState, useEffect, useRef } from "react";
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

let counter = 0;
function generateStableId(): string {
	counter += 1;
	return `social_field_${Date.now()}_${counter}`;
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
	// Maintain stable IDs so inputs never unmount and lose focus on keystroke
	const [items, setItems] = useState<Array<{ id: string; url: string }>>(() =>
		(socialLinks || []).map((url) => ({ id: generateStableId(), url })),
	);

	const lastPropUrlsRef = useRef<string[]>(socialLinks || []);

	useEffect(() => {
		const currentUrls = items.map((i) => i.url);
		const propChangedExternally =
			socialLinks.length !== currentUrls.length ||
			socialLinks.some((url, i) => url !== currentUrls[i]);

		if (propChangedExternally && socialLinks !== lastPropUrlsRef.current) {
			lastPropUrlsRef.current = socialLinks;
			setItems(socialLinks.map((url) => ({ id: generateStableId(), url })));
		}
	}, [socialLinks, items]);

	function handleAddSocial() {
		const newItems = [...items, { id: generateStableId(), url: "" }];
		setItems(newItems);
		const newUrls = newItems.map((i) => i.url);
		lastPropUrlsRef.current = newUrls;
		setSocialLinks(newUrls);
	}

	function handleRemoveSocial(id: string) {
		const newItems = items.filter((item) => item.id !== id);
		setItems(newItems);
		const newUrls = newItems.map((i) => i.url);
		lastPropUrlsRef.current = newUrls;
		setSocialLinks(newUrls);
	}

	function handleSocialChange(id: string, val: string) {
		const newItems = items.map((item) =>
			item.id === id ? { ...item, url: val } : item,
		);
		setItems(newItems);
		const newUrls = newItems.map((i) => i.url);
		lastPropUrlsRef.current = newUrls;
		setSocialLinks(newUrls);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Mail className="h-5 w-5 text-primary" />
					<span>Contact & Social Presence</span>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Official Website */}
				<div className="space-y-2">
					<Label htmlFor="websiteUrl">Official Website</Label>
					<div className="relative">
						<Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							id="websiteUrl"
							value={websiteUrl}
							onChange={(e) => setWebsiteUrl(e.target.value)}
							placeholder="https://example.com"
							className="pl-10"
						/>
					</div>
					<p className="text-xs text-muted-foreground">
						Visible to the public on your organization page.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{/* Contact Email */}
					<div className="space-y-2">
						<Label htmlFor="contactEmail">Public Contact Email</Label>
						<div className="relative">
							<Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								id="contactEmail"
								type="email"
								value={contactEmail}
								onChange={(e) => setContactEmail(e.target.value)}
								placeholder="contact@example.com"
								className="pl-10"
							/>
						</div>
					</div>

					{/* Phone Number */}
					<div className="space-y-2">
						<Label htmlFor="phone">Public Phone Number</Label>
						<div className="relative">
							<Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								id="phone"
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								placeholder="+233 24 123 4567"
								className="pl-10"
							/>
						</div>
					</div>
				</div>

				<Separator />

				{/* Social Media Profiles */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<Label className="text-base font-semibold">Social Profiles</Label>
							<p className="text-xs text-muted-foreground">
								Add your organization's social channels (X, Instagram, LinkedIn,
								YouTube, Facebook, etc.).
							</p>
						</div>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={handleAddSocial}
							className="h-8"
						>
							<Plus className="h-4 w-4 mr-1.5" />
							Add Profile
						</Button>
					</div>

					<div className="space-y-3">
						{items.map((item) => {
							const platform = getSocialPlatform(item.url);
							return (
								<div
									key={item.id}
									className="flex gap-2 items-start group"
								>
									<div className="flex-1">
										<div className="relative">
											<div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
												{platform.icon}
											</div>
											<Input
												value={item.url}
												onChange={(e) =>
													handleSocialChange(item.id, e.target.value)
												}
												placeholder="https://instagram.com/yourhandle"
												className="pl-10"
											/>
										</div>
										{item.url && (
											<p className="text-[10px] mt-1 ml-1 font-medium text-muted-foreground">
												Detected: {platform.name}
											</p>
										)}
									</div>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => handleRemoveSocial(item.id)}
										className="h-10 w-10 text-muted-foreground hover:text-destructive shrink-0"
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							);
						})}

						{items.length === 0 && (
							<div className="p-4 border border-dashed rounded-lg text-center text-xs text-muted-foreground">
								No social profiles added yet. Click "Add Profile" to connect your channels.
							</div>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
