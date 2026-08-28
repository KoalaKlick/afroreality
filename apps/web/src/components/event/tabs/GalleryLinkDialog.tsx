"use client";
// src/components/event/tabs/GalleryLinkDialog.tsx

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
import type { EventGalleryLink } from "./types";

interface GalleryLinkDialogProps {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly link: EventGalleryLink | null;
	readonly onSave: (data: EventGalleryLink) => void;
	readonly isPending: boolean;
}

export function GalleryLinkDialog({
	open,
	onOpenChange,
	link,
	onSave,
	isPending,
}: GalleryLinkDialogProps) {
	const [name, setName] = useState(link?.name ?? "");
	const [url, setUrl] = useState(link?.url ?? "");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim() || !url.trim()) {
			toast.error("Name and URL are required");
			return;
		}
		onSave({ name, url });
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{link ? "Edit Photo Gallery" : "Add Photo Gallery"}
					</DialogTitle>
					<DialogDescription>
						Link to external albums (Google Drive, Pixieset, Dropbox, etc.)
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4 py-2">
					<div className="space-y-2">
						<Label>Album Name</Label>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g., Red Carpor Photos"
							required
						/>
					</div>
					<div className="space-y-2">
						<Label>Album URL</Label>
						<Input
							type="url"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							placeholder="https://drive.google.com/..."
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
							Save Album
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
