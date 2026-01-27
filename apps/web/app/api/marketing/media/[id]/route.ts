import { db } from "@repo/database/prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;

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


