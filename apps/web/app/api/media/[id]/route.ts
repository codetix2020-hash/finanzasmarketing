import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { prisma } from "@repo/database";
import { getAuthContext } from "@repo/api/lib/auth-guard";
import { MediaService } from "@repo/api/modules/media/media-service";

// DELETE - Eliminar archivo
export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const fileId = params.id;

		// Obtener archivo para verificar organización
		const file = await prisma.mediaFile.findUnique({
			where: { id: fileId },
			select: { organizationId: true },
		});

		if (!file) {
			return NextResponse.json(
				{ error: "File not found" },
				{ status: 404 },
			);
		}

		const auth = await getAuthContext(file.organizationId);
		if (!auth) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 },
			);
		}

		const result = await MediaService.deleteFile(
			fileId,
			auth.organizationId,
		);

		if (!result.success) {
			return NextResponse.json(
				{ error: "Failed to delete" },
				{ status: 500 },
			);
		}

		// Intentar eliminar del storage
		if (result.fileUrl) {
			try {
				await del(result.fileUrl);
			} catch (e) {
				console.warn("Could not delete from storage:", e);
			}
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to delete" },
			{ status: 500 },
		);
	}
}

// PATCH - Actualizar metadata
export async function PATCH(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const fileId = params.id;
		const body = await request.json();

		const file = await prisma.mediaFile.findUnique({
			where: { id: fileId },
			select: { organizationId: true },
		});

		if (!file) {
			return NextResponse.json(
				{ error: "File not found" },
				{ status: 404 },
			);
		}

		const auth = await getAuthContext(file.organizationId);
		if (!auth) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 },
			);
		}

		await MediaService.updateFile(fileId, auth.organizationId, {
			folder: body.folder,
			tags: body.tags,
			altText: body.altText,
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to update" },
			{ status: 500 },
		);
	}
}

