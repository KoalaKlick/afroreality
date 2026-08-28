"use client";
// src/components/event/tabs/SocialLinkDialog.tsx

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EventSocialLink } from "./types";

interface SocialLinkDialogProps {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly link: EventSocialLink | null;
	readonly onSave: (url: string) => void;
	readonly isPending: boolean;
}

export function SocialLinkDialog({
	open,
	onOpenChange,
	link,
	onSave,
	isPending,
}: SocialLinkDialogProps) {
	const [url, setUrl] = useState(link?.url ?? "");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!url.trim()) {
			toast.error("URL is required");
			return;
		}
		onSave(url);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{link ? "Edit Social Link" : "Add Social Link"}
					</DialogTitle>
					<DialogDescription>
						Enter your profile or page link (Instagram, X, Facebook, etc.)
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4 py-2">
					<div className="space-y-2">
						<Label>Social URL</Label>
						<Input
							type="url"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							placeholder="https://instagram.com/..."
							required
						/>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending}>
							Save Link
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
