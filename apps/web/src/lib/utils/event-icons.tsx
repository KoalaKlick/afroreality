import React from "react";
import { Share2, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

// Custom SVG components
import WhatsAppIcon from "@/assets/svg/whatsapp.svg";
import GoogleDriveIcon from "@/assets/svg/google-drive.svg";
import FacebookIcon from "@/assets/svg/facebook.svg";
import XIcon from "@/assets/svg/x-icon.svg";
import InstagramIcon from "@/assets/svg/instagram.svg";
import TelegramIcon from "@/assets/svg/telegram.svg";
import PixiesetIcon from "@/assets/svg/pixieset.svg";
import DropboxIcon from "@/assets/svg/dropbox.svg";
import FlickrIcon from "@/assets/svg/flickr.svg";
import LinkedInIcon from "@/assets/svg/linkedin.svg";
import YoutubeIcon from "@/assets/svg/youtube.svg";

export function getSocialIcon(platform: string) {
	const p = platform?.toLowerCase() || "";
	if (p.includes("whatsapp") || p.includes("wa.me")) {
		return <WhatsAppIcon className="size-4" />;
	}
	if (p.includes("facebook") || p.includes("fb")) {
		return <FacebookIcon className="size-4" />;
	}
	if (p.includes("instagram")) {
		return <InstagramIcon className="size-4" />;
	}
	if (p.includes("x") || p.includes("twitter")) {
		return <XIcon className="size-4" />;
	}
	if (p.includes("telegram") || p.includes("t.me")) {
		return <TelegramIcon className="size-4" />;
	}
	if (p.includes("youtube")) {
		return <YoutubeIcon className="size-4" />;
	}
	if (p.includes("linkedin")) {
		return <LinkedInIcon className="size-4" />;
	}
	return <Share2 className="size-4" />;
}

export function getSocialPlatform(url: string, className?: string): { name: string; icon: React.ReactNode; color?: string } {
	const iconClass = cn("size-4 shrink-0", className);
	const u = url?.toLowerCase() || "";

	if (u.includes("wa.me") || u.includes("whatsapp")) {
		return {
			name: "WhatsApp",
			icon: <WhatsAppIcon className={iconClass} />,
			color: "text-[#25D366]",
		};
	}
	if (u.includes("t.me") || u.includes("telegram")) {
		return {
			name: "Telegram",
			icon: <TelegramIcon className={iconClass} />,
			color: "text-[#0088cc]",
		};
	}
	if (u.includes("facebook.com") || u.includes("fb.me")) {
		return {
			name: "Facebook",
			icon: <FacebookIcon className={iconClass} />,
			color: "text-[#1877F2]",
		};
	}
	if (u.includes("x.com") || u.includes("twitter.com")) {
		return {
			name: "X / Twitter",
			icon: <XIcon className={iconClass} />,
			color: "text-foreground",
		};
	}
	if (u.includes("instagram.com")) {
		return {
			name: "Instagram",
			icon: <InstagramIcon className={iconClass} />,
			color: "text-[#E4405F]",
		};
	}
	if (u.includes("linkedin.com")) {
		return {
			name: "LinkedIn",
			icon: <LinkedInIcon className={iconClass} />,
			color: "text-[#0A66C2]",
		};
	}
	if (u.includes("youtube.com") || u.includes("youtu.be")) {
		return {
			name: "YouTube",
			icon: <YoutubeIcon className={iconClass} />,
			color: "text-[#FF0000]",
		};
	}

	return {
		name: "Social Link",
		icon: <Share2 className={cn(iconClass, "text-muted-foreground")} />,
		color: "text-muted-foreground",
	};
}

export function getGalleryProvider(url: string, className?: string): { name: string; icon: React.ReactNode; color?: string } {
	const iconClass = cn("size-4 shrink-0", className);
	const u = url?.toLowerCase() || "";

	if (u.includes("drive.google.com")) {
		return {
			name: "Google Drive",
			icon: <GoogleDriveIcon className={iconClass} />,
			color: "text-primary",
		};
	}
	if (u.includes("pixieset.com")) {
		return {
			name: "Pixieset",
			icon: <PixiesetIcon className={iconClass} />,
			color: "text-purple-500",
		};
	}
	if (u.includes("dropbox.com")) {
		return {
			name: "Dropbox",
			icon: <DropboxIcon className={iconClass} />,
			color: "text-blue-500",
		};
	}
	if (u.includes("flickr.com")) {
		return {
			name: "Flickr",
			icon: <FlickrIcon className={iconClass} />,
			color: "text-pink-500",
		};
	}

	return {
		name: "Photo Gallery",
		icon: <Globe className={cn(iconClass, "text-muted-foreground")} />,
		color: "text-muted-foreground",
	};
}
