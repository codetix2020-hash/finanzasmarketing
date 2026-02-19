import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getAuthContext } from "@repo/api/lib/auth-guard";
import { MediaService } from "@repo/api/modules/media/media-service";

// GET - Listar archivos
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const organizationId = searchParams.get("organizationId");
		const folder = searchParams.get("folder");
		const tags = searchParams
			.get("tags")
			?.split(",")
			.filter(Boolean);

		if (!organizationId) {
			return NextResponse.json(
				{ error: "organizationId required" },
				{ status: 400 },
			);
		}

		const auth = await getAuthContext(organizationId);
		if (!auth) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 },
			);
		}

		const files = await MediaService.getFiles(auth.organizationId, {
			folder: folder || undefined,
			tags,
		});

		const folders = await MediaService.getFolders(auth.organizationId);

		return NextResponse.json({ files, folders });
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to fetch files" },
			{ status: 500 },
		);
	}
}

// POST - Subir archivo
export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const file = formData.get("file") as File;
		const organizationId = formData.get("organizationId") as string;
		const folder = formData.get("folder") as string | null;
		const tags = formData.get("tags") as string | null;

		if (!file || !organizationId) {
			return NextResponse.json(
				{ error: "file and organizationId required" },
				{ status: 400 },
			);
		}

		const auth = await getAuthContext(organizationId);
		if (!auth) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 },
			);
		}

		// Validar archivo
		const validation = MediaService.validateFile(file);
		if (!validation.valid) {
			return NextResponse.json(
				{ error: validation.error },
				{ status: 400 },
			);
		}

		// Verificar límite
		const limitCheck = await MediaService.checkFileLimit(
			auth.organizationId,
		);
		if (!limitCheck.allowed) {
			return NextResponse.json(
				{ error: limitCheck.error },
				{ status: 429 },
			);
		}

		// Generar nombre único
		const timestamp = Date.now();
		const extension = file.name.split(".").pop() || "jpg";
		const filename = `${auth.organizationId}/${timestamp}-${Math.random().toString(36).slice(2)}.${extension}`;

		// Subir a Vercel Blob
		const blob = await put(filename, file, {
			access: "public",
			contentType: file.type,
		});

		// Guardar en DB
		const result = await MediaService.saveFile({
			organizationId: auth.organizationId,
			filename,
			originalName: file.name,
			mimeType: file.type,
			size: file.size,
			url: blob.url,
			thumbnailUrl: blob.url,
			folder: folder || undefined,
			tags: tags ? tags.split(",").filter(Boolean) : undefined,
		});

		if (!result.success) {
			return NextResponse.json(
				{ error: result.error },
				{ status: 400 },
			);
		}

		return NextResponse.json({ file: result.file }, { status: 201 });
	} catch (error) {
		console.error("Upload error:", error);
		return NextResponse.json(
			{ error: "Failed to upload" },
			{ status: 500 },
		);
	}
}

