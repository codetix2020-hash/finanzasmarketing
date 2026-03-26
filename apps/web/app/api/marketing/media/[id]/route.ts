import { db } from "@repo/database/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse } from "@repo/api/lib/auth-guard";

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;

		const media = await db.mediaLibrary.findUnique({ where: { id }, select: { organizationId: true } });
		if (!media) {
			return NextResponse.json({ error: "Media not found" }, { status: 404 });
		}
		const authCtx = await getAuthContext(media.organizationId);
		if (!authCtx) {
			return unauthorizedResponse();
		}

		// TODO: Delete file from storage
		await db.mediaLibrary.delete({
			where: { id },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting media:", error);
		return NextResponse.json({ error: "Error deleting media" }, { status: 500 });
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const body = await request.json();

		const existing = await db.mediaLibrary.findUnique({ where: { id }, select: { organizationId: true } });
		if (!existing) {
			return NextResponse.json({ error: "Media not found" }, { status: 404 });
		}
		const authCtx2 = await getAuthContext(existing.organizationId);
		if (!authCtx2) {
			return unauthorizedResponse();
		}

		const media = await db.mediaLibrary.update({
			where: { id },
			data: body,
		});

		return NextResponse.json({ media });
	} catch (error) {
		console.error("Error updating media:", error);
		return NextResponse.json({ error: "Error updating media" }, { status: 500 });
	}
}







