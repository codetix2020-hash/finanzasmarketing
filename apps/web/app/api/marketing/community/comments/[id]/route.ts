import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const body = await request.json();
		const { organizationId, ...updates } = body;

		if (!organizationId) {
			return NextResponse.json({ error: "Missing organizationId" }, { status: 400 });
		}

		const comment = await prisma.socialComment.update({
			where: { id },
			data: updates,
		});

		return NextResponse.json({ comment });
	} catch (error) {
		console.error("Error updating comment:", error);
		return NextResponse.json(
			{ error: "Error updating comment" },
			{ status: 500 },
		);
	}
}


