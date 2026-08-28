// src/components/organization/management/types.ts

export interface UseImageUploadResult {
	isUploading: boolean;
	upload: (
		file: File,
		oldUrl?: string | null,
	) => Promise<{ url: string; key: string } | null>;
}
