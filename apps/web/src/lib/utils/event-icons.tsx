import React from "react";
import {
	Globe,
	Share2,
	Video,
	MessageCircle,
	Camera,
	Folder,
	Cloud,
	Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function getSocialIcon(platform: string) {
	switch (platform?.toLowerCase()) {
		case "website":
			return <Globe className="size-4" />;
		case "zoom":
		case "meet":
		case "virtual":
			return <Video className="size-4" />;
		case "whatsapp":
			return <MessageCircle className="size-4" />;
		default:
			return <Share2 className="size-4" />;
	}
}

export function getSocialPlatform(url: string, className?: string): { name: string; icon: React.ReactNode; color?: string } {
	const iconClass = cn("size-4 shrink-0", className);
	const u = url?.toLowerCase() || "";

	if (u.includes("instagram.com")) {
		return { name: "Instagram", icon: <Camera className={iconClass} />, color: "text-[#E4405F]" };
	}
	if (u.includes("twitter.com") || u.includes("x.com")) {
		return { name: "X / Twitter", icon: <Share2 className={iconClass} />, color: "text-foreground" };
	}
	if (u.includes("facebook.com") || u.includes("fb.me")) {
		return { name: "Facebook", icon: <Globe className={iconClass} />, color: "text-[#1877F2]" };
	}
	if (u.includes("youtube.com") || u.includes("youtu.be")) {
		return { name: "YouTube", icon: <Video className={iconClass} />, color: "text-[#FF0000]" };
	}
	if (u.includes("linkedin.com")) {
		return { name: "LinkedIn", icon: <Globe className={iconClass} />, color: "text-[#0A66C2]" };
	}
	if (u.includes("wa.me") || u.includes("whatsapp")) {
		return { name: "WhatsApp", icon: <MessageCircle className={iconClass} />, color: "text-[#25D366]" };
	}
	return { name: "Website", icon: <Globe className={iconClass} />, color: "text-muted-foreground" };
}

export function getGalleryProvider(url: string, className?: string): { name: string; icon: React.ReactNode; color?: string } {
	const iconClass = cn("size-4 shrink-0", className);
	const u = url?.toLowerCase() || "";

	if (u.includes("drive.google.com")) {
		return { name: "Google Drive", icon: <Folder className={iconClass} />, color: "text-primary" };
	}
	if (u.includes("dropbox.com")) {
		return { name: "Dropbox", icon: <Folder className={iconClass} />, color: "text-blue-500" };
	}
	if (u.includes("pixieset.com")) {
		return { name: "Pixieset", icon: <Camera className={iconClass} />, color: "text-purple-500" };
	}
	if (u.includes("icloud.com")) {
		return { name: "iCloud", icon: <Cloud className={iconClass} />, color: "text-sky-500" };
	}
	return { name: "Photo Gallery", icon: <ImageIcon className={iconClass} />, color: "text-muted-foreground" };
}
