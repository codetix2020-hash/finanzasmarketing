import { put } from "@vercel/blob";
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

		// Verificar que BLOB_READ_WRITE_TOKEN esté configurado
		if (!process.env.BLOB_READ_WRITE_TOKEN) {
			return NextResponse.json(
				{ error: "BLOB_READ_WRITE_TOKEN no configurado. Configura la variable de entorno en Railway." },
				{ status: 500 },
			);
		}

		const uploadedMedia = [];

		for (const file of files) {
			// Subir archivo a Vercel Blob
			const blob = await put(`${organizationId}/${Date.now()}-${file.name}`, file, {
				access: "public",
			});

			// Guardar en DB
			const media = await db.mediaLibrary.create({
				data: {
					organizationId,
					fileName: file.name,
					fileUrl: blob.url,
					fileType: file.type,
					fileSize: file.size,
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
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Error uploading media" },
			{ status: 500 },
		);
	}
}

