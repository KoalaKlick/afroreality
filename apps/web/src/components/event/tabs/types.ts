// src/components/event/tabs/types.ts

export interface EventSponsor {
	id?: string;
	name: string;
	logo?: string | null;
}

export interface EventSocialLink {
	id?: string;
	url: string;
}

export interface EventGalleryLink {
	id?: string;
	name: string;
	url: string;
}
