import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { uploadToR2, deleteFromR2ByUrl } from "@/lib/storage";
import { ALLOWED_STORAGE_FOLDERS } from "@/lib/constants/storage";

export async function POST(req: Request) {
	try {
		await requireSession();

		const formData = await req.formData();
		const file = formData.get("file") as File | null;
		const folder = (formData.get("folder") as string) || "avatars";
		const resourceId = (formData.get("resourceId") as string) || undefined;
		const oldUrl = (formData.get("oldUrl") as string) || undefined;

		if (!file) {
			return NextResponse.json(
				{ success: false, error: "No file provided" },
				{ status: 400 },
			);
		}

		// Validate folder is allowed
		if (!(ALLOWED_STORAGE_FOLDERS as readonly string[]).includes(folder)) {
			return NextResponse.json(
				{ success: false, error: `Invalid folder: ${folder}` },
				{ status: 400 },
			);
		}

		if (oldUrl) {
			await deleteFromR2ByUrl(oldUrl).catch(() => {});
		}

		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);

		const result = await uploadToR2({
			fileBuffer: buffer,
			fileName: file.name,
			contentType: file.type || "image/webp",
			folder,
			resourceId,
		});

		return NextResponse.json({
			success: true,
			url: result.fileUrl,
			key: result.storageKey,
			fileKey: result.storageKey,
		});
	} catch (err: any) {
		return NextResponse.json(
			{ success: false, error: err?.message || "Failed to upload file" },
			{ status: 500 },
		);
	}
}
