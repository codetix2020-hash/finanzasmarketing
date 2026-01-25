import { db } from "@repo/database/prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const organizationId = formData.get("organizationId") as string;
		const files = formData.getAll("files") as File[];

		if (!organizationId) {
			return NextResponse.json({ error: "Missing organizationId" }, { status: 400 });
		}

		if (!files || files.length === 0) {
			return NextResponse.json({ error: "No files provided" }, { status: 400 });
		}

		// TODO: Implement actual file upload to storage (S3, Cloudflare, etc.)
		// For now, we'll create placeholder records
		const uploadedMedia = [];

		for (const file of files) {
			// In a real implementation, you would:
			// 1. Upload file to storage (S3, Cloudflare R2, etc.)
			// 2. Get the public URL
			// 3. Get file dimensions (for images)
			// 4. Save to database

			const fileUrl = `https://placeholder.com/${file.name}`; // Placeholder
			const fileType = file.type;
			const fileSize = file.size;

			const media = await db.mediaLibrary.create({
				data: {
					organizationId,
					fileName: file.name,
					fileUrl,
					fileType,
					fileSize,
					category: "other",
					tags: [],
					aiTags: [],
				},
			});

			uploadedMedia.push(media);
		}

		return NextResponse.json({ media: uploadedMedia });
	} catch (error) {
		console.error("Error uploading media:", error);
		return NextResponse.json({ error: "Error uploading media" }, { status: 500 });
	}
}

